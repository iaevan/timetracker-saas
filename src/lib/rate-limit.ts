import type { AppKysely } from "./db";

const LIMITS: Record<string, { windowMs: number; max: number }> = {
  "createBlock": { windowMs: 60_000, max: 30 },
  "updateBlock": { windowMs: 60_000, max: 30 },
  "deleteBlock": { windowMs: 60_000, max: 30 },
  "createCategory": { windowMs: 60_000, max: 20 },
  "updateCategory": { windowMs: 60_000, max: 20 },
  "deleteCategory": { windowMs: 60_000, max: 20 },
  "createRoutine": { windowMs: 300_000, max: 10 },
  "renameRoutine": { windowMs: 60_000, max: 10 },
  "deleteRoutine": { windowMs: 60_000, max: 5 },
  "setActiveRoutine": { windowMs: 60_000, max: 10 },
  "setDayTag": { windowMs: 60_000, max: 20 },
};

export async function checkRateLimit(
  db: AppKysely,
  userId: string,
  action: string,
): Promise<boolean> {
  const limit = LIMITS[action];
  if (!limit) return true;

  const cutoff = Date.now() - limit.windowMs;

  await db
    .deleteFrom("rate_limits")
    .where("created_at", "<", cutoff)
    .execute();

  const row = await db
    .selectFrom("rate_limits")
    .select(({ fn }) => fn.countAll<number>().as("n"))
    .where("user_id", "=", userId)
    .where("action", "=", action)
    .where("created_at", ">=", cutoff)
    .executeTakeFirstOrThrow();

  if (Number(row.n) >= limit.max) return false;

  await db
    .insertInto("rate_limits")
    .values({ user_id: userId, action, created_at: Date.now() })
    .execute();

  return true;
}
