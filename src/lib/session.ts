import { headers } from "next/headers";
import { cache } from "react";
import { createAuth } from "./auth";
import { getEnv } from "./db";

/** Current session (or null). Cached per request. */
export const getSession = cache(async () => {
  const env = await getEnv();
  const auth = createAuth(env.DB, env.BETTER_AUTH_SECRET);
  return auth.api.getSession({ headers: await headers() });
});

export const requireUser = cache(async () => {
  const session = await getSession();
  if (!session?.user) return null;
  return session.user;
});
