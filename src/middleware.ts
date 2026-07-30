import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = [/^\/$/, /^\/week(\/.*)?$/, /^\/edit(\/.*)?$/];
const AUTH_PAGES = [/^\/login$/, /^\/signup$/];

function hasSessionCookie(request: NextRequest): boolean {
  // better-auth session cookie (secure prefix on https)
  return Boolean(
    request.cookies.get("better-auth.session_token")?.value ||
      request.cookies.get("__Secure-better-auth.session_token")?.value,
  );
}

/**
 * Optimistic auth gate — checks only for the presence of a session cookie.
 * Real verification happens in server components via auth.api.getSession.
 * (Uses the edge middleware convention: OpenNext does not yet support
 * Next 16's Node-runtime `proxy.ts`.)
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authed = hasSessionCookie(request);
  let res: NextResponse | null = null;

  if (AUTH_PAGES.some((re) => re.test(pathname)) && authed) {
    res = NextResponse.redirect(new URL("/", request.url));
  } else if (PROTECTED.some((re) => re.test(pathname)) && !authed) {
    const url = new URL("/login", request.url);
    if (pathname !== "/") url.searchParams.set("next", pathname);
    res = NextResponse.redirect(url);
  }

  const response = res ?? NextResponse.next();
  response.headers.set("Content-Security-Policy", CSP);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  return response;
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.json).*)"],
};
