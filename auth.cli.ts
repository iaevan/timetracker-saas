/**
 * CLI-only config used by `npx @better-auth/cli generate` to emit the
 * auth schema SQL for SQLite/D1. Never imported by the app.
 */
import { betterAuth } from "better-auth";
import {
  DummyDriver,
  Kysely,
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
} from "kysely";

const db = new Kysely({
  dialect: {
    createAdapter: () => new SqliteAdapter(),
    createDriver: () => new DummyDriver(),
    createIntrospector: (d) => new SqliteIntrospector(d),
    createQueryCompiler: () => new SqliteQueryCompiler(),
  },
});

export const auth = betterAuth({
  appName: "Daily Line",
  database: { db, type: "sqlite" },
  emailAndPassword: { enabled: true, minPasswordLength: 8, autoSignIn: true },
});
