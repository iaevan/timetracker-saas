import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";
import type { Block, Category, Routine, RoutineBundle } from "./types";

/* ---------- Kysely schema (app tables; better-auth manages its own) ---------- */

export interface RoutinesTable {
  id: string;
  user_id: string;
  name: string;
  day_tags: string; // JSON: { [dayOfWeek: number]: string }
  is_active: number; // 0 | 1
  sort_order: number;
  created_at: number;
}

export interface CategoriesTable {
  id: string;
  routine_id: string;
  name: string;
  color: string;
  sort_order: number;
}

export interface BlocksTable {
  id: string;
  routine_id: string;
  day_of_week: number;
  category_id: string | null;
  title: string;
  detail: string;
  room: string;
  start_min: number;
  end_min: number;
  sort_order: number;
}

export interface AppDatabase {
  routines: RoutinesTable;
  categories: CategoriesTable;
  blocks: BlocksTable;
}

export type AppKysely = Kysely<AppDatabase>;

export function createDb(d1: D1Database): AppKysely {
  return new Kysely<AppDatabase>({ dialect: new D1Dialect({ database: d1 }) });
}

/**
 * D1 caps statements at 100 bound parameters — chunk multi-row inserts.
 * `cols` = number of columns per row; stays under the limit with headroom.
 */
export async function chunkedInsert<T extends keyof AppDatabase>(
  db: AppKysely,
  table: T,
  rows: AppDatabase[T][],
  cols: number,
): Promise<void> {
  const batchSize = Math.max(1, Math.floor(90 / cols));
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    if (batch.length === 0) continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.insertInto(table).values(batch as any).execute();
  }
}

export async function getEnv(): Promise<CloudflareEnv> {
  const { env } = await getCloudflareContext({ async: true });
  return env as unknown as CloudflareEnv;
}

export async function getDb(): Promise<AppKysely> {
  const env = await getEnv();
  return createDb(env.DB);
}

/* ---------- row -> domain mapping ---------- */

function toRoutine(row: RoutinesTable): Routine {
  let dayTags: Record<number, string> = {};
  try {
    dayTags = JSON.parse(row.day_tags || "{}");
  } catch {
    dayTags = {};
  }
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    dayTags,
    isActive: row.is_active === 1,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

function toCategory(row: CategoriesTable): Category {
  return {
    id: row.id,
    routineId: row.routine_id,
    name: row.name,
    color: row.color,
    sortOrder: row.sort_order,
  };
}

function toBlock(row: BlocksTable): Block {
  return {
    id: row.id,
    routineId: row.routine_id,
    dayOfWeek: row.day_of_week,
    categoryId: row.category_id,
    title: row.title,
    detail: row.detail,
    room: row.room,
    startMin: row.start_min,
    endMin: row.end_min,
    sortOrder: row.sort_order,
  };
}

/* ---------- queries ---------- */

export async function listRoutines(db: AppKysely, userId: string): Promise<Routine[]> {
  const rows = await db
    .selectFrom("routines")
    .selectAll()
    .where("user_id", "=", userId)
    .orderBy("sort_order", "asc")
    .orderBy("created_at", "asc")
    .execute();
  return rows.map(toRoutine);
}

export async function getBundle(
  db: AppKysely,
  userId: string,
  routineId: string,
): Promise<RoutineBundle | null> {
  const rrow = await db
    .selectFrom("routines")
    .selectAll()
    .where("id", "=", routineId)
    .where("user_id", "=", userId)
    .executeTakeFirst();
  if (!rrow) return null;
  const [cats, blks] = await Promise.all([
    db
      .selectFrom("categories")
      .selectAll()
      .where("routine_id", "=", routineId)
      .orderBy("sort_order", "asc")
      .execute(),
    db
      .selectFrom("blocks")
      .selectAll()
      .where("routine_id", "=", routineId)
      .orderBy("day_of_week", "asc")
      .orderBy("start_min", "asc")
      .orderBy("sort_order", "asc")
      .execute(),
  ]);
  return {
    routine: toRoutine(rrow),
    categories: cats.map(toCategory),
    blocks: blks.map(toBlock),
  };
}

export async function getActiveBundle(
  db: AppKysely,
  userId: string,
): Promise<RoutineBundle | null> {
  const active = await db
    .selectFrom("routines")
    .select("id")
    .where("user_id", "=", userId)
    .where("is_active", "=", 1)
    .executeTakeFirst();
  if (!active) {
    // fall back to the oldest routine and mark it active
    const first = await db
      .selectFrom("routines")
      .select("id")
      .where("user_id", "=", userId)
      .orderBy("created_at", "asc")
      .executeTakeFirst();
    if (!first) return null;
    await db
      .updateTable("routines")
      .set({ is_active: 1 })
      .where("id", "=", first.id)
      .execute();
    return getBundle(db, userId, first.id);
  }
  return getBundle(db, userId, active.id);
}
