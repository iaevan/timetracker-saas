"use server";

import { revalidatePath } from "next/cache";
import { chunkedInsert, getDb, getActiveBundle, type AppKysely } from "./db";
import { requireUser } from "./session";

type Result = { ok: true } | { ok: false; error: string };

const ok: Result = { ok: true };
const fail = (error: string): Result => ({ ok: false, error });

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/week");
  revalidatePath("/edit");
}

async function requireActive(userId: string) {
  const db = await getDb();
  const bundle = await getActiveBundle(db, userId);
  if (!bundle) throw new Error("No routine found");
  return { db, bundle };
}

/* ================= routines ================= */

export async function createRoutine(name: string, copyFromId: string | null): Promise<Result> {
  const user = await requireUser();
  if (!user) return fail("Not signed in");
  name = name.trim().slice(0, 80);
  if (!name) return fail("Name your routine");

  const db = await getDb();
  const count = await db
    .selectFrom("routines")
    .select(({ fn }) => fn.countAll<number>().as("n"))
    .where("user_id", "=", user.id)
    .executeTakeFirstOrThrow();
  if (Number(count.n) >= 20) return fail("You have reached the 20 routine limit");

  const id = crypto.randomUUID();
  const maxSort = await db
    .selectFrom("routines")
    .select(({ fn }) => fn.max("sort_order").as("m"))
    .where("user_id", "=", user.id)
    .executeTakeFirstOrThrow();

  let dayTags = "{}";
  if (copyFromId) {
    const src = await db
      .selectFrom("routines")
      .selectAll()
      .where("id", "=", copyFromId)
      .where("user_id", "=", user.id)
      .executeTakeFirst();
    if (src) dayTags = src.day_tags;
  }

  await db
    .insertInto("routines")
    .values({
      id,
      user_id: user.id,
      name,
      day_tags: dayTags,
      is_active: 0,
      sort_order: Number(maxSort.m ?? 0) + 1,
      created_at: Date.now(),
    })
    .execute();

  if (copyFromId) {
    const srcCats = await db
      .selectFrom("categories")
      .selectAll()
      .where("routine_id", "=", copyFromId)
      .execute();
    const catIdMap = new Map<string, string>();
    if (srcCats.length) {
      await chunkedInsert(
        db,
        "categories",
        srcCats.map((c) => {
          const nid = crypto.randomUUID();
          catIdMap.set(c.id, nid);
          return { id: nid, routine_id: id, name: c.name, color: c.color, sort_order: c.sort_order };
        }),
        5,
      );
    }
    const srcBlocks = await db
      .selectFrom("blocks")
      .selectAll()
      .where("routine_id", "=", copyFromId)
      .execute();
    if (srcBlocks.length) {
      await chunkedInsert(
        db,
        "blocks",
        srcBlocks.map((b) => ({
          id: crypto.randomUUID(),
          routine_id: id,
          day_of_week: b.day_of_week,
          category_id: b.category_id ? (catIdMap.get(b.category_id) ?? null) : null,
          title: b.title,
          detail: b.detail,
          room: b.room,
          start_min: b.start_min,
          end_min: b.end_min,
          sort_order: b.sort_order,
        })),
        10,
      );
    }
  }

  // make the new routine active
  await setActive(db, user.id, id);
  revalidateAll();
  return ok;
}

export async function renameRoutine(routineId: string, name: string): Promise<Result> {
  const user = await requireUser();
  if (!user) return fail("Not signed in");
  name = name.trim().slice(0, 80);
  if (!name) return fail("Name cannot be empty");
  const db = await getDb();
  await db
    .updateTable("routines")
    .set({ name })
    .where("id", "=", routineId)
    .where("user_id", "=", user.id)
    .execute();
  revalidateAll();
  return ok;
}

export async function deleteRoutine(routineId: string): Promise<Result> {
  const user = await requireUser();
  if (!user) return fail("Not signed in");
  const db = await getDb();
  const routines = await db
    .selectFrom("routines")
    .selectAll()
    .where("user_id", "=", user.id)
    .orderBy("created_at", "asc")
    .execute();
  if (routines.length <= 1) return fail("You need at least one routine");
  const target = routines.find((r) => r.id === routineId);
  if (!target) return fail("Routine not found");
  await db.deleteFrom("routines").where("id", "=", routineId).execute();
  if (target.is_active === 1) {
    const next = routines.find((r) => r.id !== routineId);
    if (next) await setActive(db, user.id, next.id);
  }
  revalidateAll();
  return ok;
}

async function setActive(db: AppKysely, userId: string, routineId: string) {
  await db.updateTable("routines").set({ is_active: 0 }).where("user_id", "=", userId).execute();
  await db
    .updateTable("routines")
    .set({ is_active: 1 })
    .where("id", "=", routineId)
    .where("user_id", "=", userId)
    .execute();
}

export async function setActiveRoutine(routineId: string): Promise<Result> {
  const user = await requireUser();
  if (!user) return fail("Not signed in");
  const db = await getDb();
  await setActive(db, user.id, routineId);
  revalidateAll();
  return ok;
}

export async function setDayTag(dayOfWeek: number, tag: string): Promise<Result> {
  const user = await requireUser();
  if (!user) return fail("Not signed in");
  if (dayOfWeek < 0 || dayOfWeek > 6) return fail("Invalid day");
  const { db, bundle } = await requireActive(user.id);
  const tags = { ...bundle.routine.dayTags, [dayOfWeek]: tag.trim().slice(0, 60) };
  if (!tag.trim()) delete tags[dayOfWeek];
  await db
    .updateTable("routines")
    .set({ day_tags: JSON.stringify(tags) })
    .where("id", "=", bundle.routine.id)
    .execute();
  revalidateAll();
  return ok;
}

/* ================= categories ================= */

export async function createCategory(name: string, color: string): Promise<Result> {
  const user = await requireUser();
  if (!user) return fail("Not signed in");
  name = name.trim().slice(0, 40);
  if (!name) return fail("Name the category");
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) return fail("Pick a color");
  const { db, bundle } = await requireActive(user.id);
  const maxSort = await db
    .selectFrom("categories")
    .select(({ fn }) => fn.max("sort_order").as("m"))
    .where("routine_id", "=", bundle.routine.id)
    .executeTakeFirstOrThrow();
  await db
    .insertInto("categories")
    .values({
      id: crypto.randomUUID(),
      routine_id: bundle.routine.id,
      name,
      color,
      sort_order: Number(maxSort.m ?? 0) + 1,
    })
    .execute();
  revalidateAll();
  return ok;
}

export async function updateCategory(categoryId: string, name: string, color: string): Promise<Result> {
  const user = await requireUser();
  if (!user) return fail("Not signed in");
  name = name.trim().slice(0, 40);
  if (!name) return fail("Name cannot be empty");
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) return fail("Pick a color");
  const { db, bundle } = await requireActive(user.id);
  await db
    .updateTable("categories")
    .set({ name, color })
    .where("id", "=", categoryId)
    .where("routine_id", "=", bundle.routine.id)
    .execute();
  revalidateAll();
  return ok;
}

export async function deleteCategory(categoryId: string): Promise<Result> {
  const user = await requireUser();
  if (!user) return fail("Not signed in");
  const { db, bundle } = await requireActive(user.id);
  // blocks keep their data, category becomes "Uncategorized" (set null via FK)
  await db
    .deleteFrom("categories")
    .where("id", "=", categoryId)
    .where("routine_id", "=", bundle.routine.id)
    .execute();
  revalidateAll();
  return ok;
}

/* ================= blocks ================= */

export interface BlockInput {
  dayOfWeek: number;
  categoryId: string | null;
  title: string;
  detail: string;
  room: string;
  startMin: number;
  endMin: number;
}

function validateBlock(input: BlockInput): { v: BlockInput } | { error: string } {
  const title = input.title.trim().slice(0, 120);
  if (!title) return { error: "Give the block a title" };
  const detail = input.detail.trim().slice(0, 240);
  const room = input.room.trim().slice(0, 60);
  const dayOfWeek = Math.floor(input.dayOfWeek);
  if (dayOfWeek < 0 || dayOfWeek > 6) return { error: "Invalid day" };
  const startMin = Math.round(input.startMin);
  let endMin = Math.round(input.endMin);
  if (startMin < 0 || startMin > 1439 || endMin < 0 || endMin > 1439) return { error: "Times must be within a day" };
  if (endMin <= startMin) endMin += 1440; // runs past midnight
  if (endMin - startMin > 18 * 60) return { error: "Blocks can't exceed 18 hours" };
  return { v: { dayOfWeek, categoryId: input.categoryId, title, detail, room, startMin, endMin } };
}

export async function createBlock(input: BlockInput): Promise<Result> {
  const user = await requireUser();
  if (!user) return fail("Not signed in");
  const parsed = validateBlock(input);
  if ("error" in parsed) return fail(parsed.error);
  const { db, bundle } = await requireActive(user.id);
  const maxSort = await db
    .selectFrom("blocks")
    .select(({ fn }) => fn.max("sort_order").as("m"))
    .where("routine_id", "=", bundle.routine.id)
    .executeTakeFirstOrThrow();
  await db
    .insertInto("blocks")
    .values({
      id: crypto.randomUUID(),
      routine_id: bundle.routine.id,
      day_of_week: parsed.v.dayOfWeek,
      category_id: parsed.v.categoryId,
      title: parsed.v.title,
      detail: parsed.v.detail,
      room: parsed.v.room,
      start_min: parsed.v.startMin,
      end_min: parsed.v.endMin,
      sort_order: Number(maxSort.m ?? 0) + 1,
    })
    .execute();
  revalidateAll();
  return ok;
}

export async function updateBlock(blockId: string, input: BlockInput): Promise<Result> {
  const user = await requireUser();
  if (!user) return fail("Not signed in");
  const parsed = validateBlock(input);
  if ("error" in parsed) return fail(parsed.error);
  const { db, bundle } = await requireActive(user.id);
  await db
    .updateTable("blocks")
    .set({
      day_of_week: parsed.v.dayOfWeek,
      category_id: parsed.v.categoryId,
      title: parsed.v.title,
      detail: parsed.v.detail,
      room: parsed.v.room,
      start_min: parsed.v.startMin,
      end_min: parsed.v.endMin,
    })
    .where("id", "=", blockId)
    .where("routine_id", "=", bundle.routine.id)
    .execute();
  revalidateAll();
  return ok;
}

export async function deleteBlock(blockId: string): Promise<Result> {
  const user = await requireUser();
  if (!user) return fail("Not signed in");
  const { db, bundle } = await requireActive(user.id);
  await db
    .deleteFrom("blocks")
    .where("id", "=", blockId)
    .where("routine_id", "=", bundle.routine.id)
    .execute();
  revalidateAll();
  return ok;
}
