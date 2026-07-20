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
 * (Uses the edge middleware convention: OpenNext Cloudflare does not yet
 * support Next 16's Node-runtime `proxy.ts`.)
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authed = hasSessionCookie(request);

  if (AUTH_PAGES.some((re) => re.test(pathname)) && authed) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (PROTECTED.some((re) => re.test(pathname)) && !authed) {
    const url = new URL("/login", request.url);
    if (pathname !== "/") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/week/:path*", "/edit/:path*", "/login", "/signup"],
};
