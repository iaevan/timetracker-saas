import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { chunkedInsert, createDb, type AppKysely } from "./db";
import {
  STARTER_BLOCKS,
  STARTER_CATEGORIES,
  STARTER_DAY_TAGS,
  STARTER_NAME,
} from "./starter-routine";

/** Seed a brand-new account with the original Daily Line routine. */
async function seedStarterRoutine(db: AppKysely, userId: string) {
  const routineId = crypto.randomUUID();
  await db
    .insertInto("routines")
    .values({
      id: routineId,
      user_id: userId,
      name: STARTER_NAME,
      day_tags: JSON.stringify(STARTER_DAY_TAGS),
      is_active: 1,
      sort_order: 0,
      created_at: Date.now(),
    })
    .execute();

  const catIdByKey = new Map<string, string>();
  await chunkedInsert(
    db,
    "categories",
    STARTER_CATEGORIES.map((c, i) => {
      const id = crypto.randomUUID();
      catIdByKey.set(c.key, id);
      return { id, routine_id: routineId, name: c.name, color: c.color, sort_order: i };
    }),
    5,
  );

  await chunkedInsert(
    db,
    "blocks",
    STARTER_BLOCKS.map((b, i) => ({
      id: crypto.randomUUID(),
      routine_id: routineId,
      day_of_week: b.dayOfWeek,
      category_id: catIdByKey.get(b.catKey) ?? null,
      title: b.title,
      detail: b.detail,
      room: b.room ?? "",
      start_min: b.startMin,
      end_min: b.endMin,
      sort_order: i,
    })),
    10,
  );
}

export function createAuth(d1: D1Database, secret?: string) {
  return betterAuth({
    appName: "Daily Line",
    secret,
    database: {
      db: createDb(d1),
      type: "sqlite",
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      autoSignIn: true,
    },
    plugins: [nextCookies()],
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            try {
              await seedStarterRoutine(createDb(d1), user.id);
            } catch (e) {
              console.error("failed to seed starter routine", e);
            }
          },
        },
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
export type Session = Awaited<ReturnType<Auth["api"]["getSession"]>>;
