import { createAuth } from "@/lib/auth";
import { getEnv } from "@/lib/db";

async function handler(req: Request): Promise<Response> {
  const env = await getEnv();
  const auth = createAuth(env.DB, env.BETTER_AUTH_SECRET);
  return auth.handler(req);
}

export const GET = handler;
export const POST = handler;
