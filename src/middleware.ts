import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/signin", "/signup"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths through
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow Next.js internals and static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Check for access token in cookies
  const accessToken = request.cookies.get("accessToken")?.value;

  if (!accessToken) {
    const signinUrl = new URL("/signin", request.url);
    // Replace so the browser back button cannot return to the protected page
    const response = NextResponse.redirect(signinUrl);
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match every route except:
     * - _next/static  (Next.js static chunks)
     * - _next/image   (Next.js image optimisation)
     * - favicon.ico
     * - /images/*     (public static assets — logos, icons, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|images/).*)",
  ],
};
