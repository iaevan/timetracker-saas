/// <reference types="@cloudflare/workers-types" />

/** Cloudflare Worker environment bindings (kept in sync with wrangler.jsonc). */
interface CloudflareEnv {
  DB: D1Database;
  ASSETS: Fetcher;
  WORKER_SELF_REFERENCE: Fetcher;
  BETTER_AUTH_SECRET?: string;
  NEXTJS_ENV?: string;
}
