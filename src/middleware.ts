import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/signin", "/signup"];

// Customer-only routes — ADMINs cannot access these
const CUSTOMER_ONLY_PREFIXES = [
  "/dashboard",
  "/company-management",
  "/accounting-bookkeeping",
  "/accounting-reports",
  "/taxation",
  "/communication-support",
  "/profile",
];

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
    const response = NextResponse.redirect(signinUrl);
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return response;
  }

  // Parse user type from the userData cookie for portal isolation
  let userType: "ADMIN" | "CUSTOMER" | null = null;
  try {
    const rawUserData = request.cookies.get("userData")?.value;
    if (rawUserData) {
      const parsed = JSON.parse(decodeURIComponent(rawUserData));
      userType = parsed?.type ?? null;
    }
  } catch {
    // If cookie is malformed, let it pass — layout guards will handle it
  }

  if (userType) {
    // CUSTOMER trying to access admin routes → redirect to customer dashboard
    if (userType === "CUSTOMER" && pathname.startsWith("/admin")) {
      const redirectUrl = new URL("/dashboard", request.url);
      const response = NextResponse.redirect(redirectUrl);
      response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
      return response;
    }

    // ADMIN trying to access customer-only routes → redirect to admin dashboard
    if (
      userType === "ADMIN" &&
      CUSTOMER_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix))
    ) {
      const redirectUrl = new URL("/admin/dashboard", request.url);
      const response = NextResponse.redirect(redirectUrl);
      response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
      return response;
    }
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
