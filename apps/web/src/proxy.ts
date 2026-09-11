import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PATHS = ["/map", "/spot", "/profile", "/settings", "/feed", "/search", "/explore"];
const AUTH_PATHS = ["/login", "/register"];
/** The landing page — authenticated users skip it and go straight to the app. */
const LANDING_PATH = "/";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("trs_token")?.value;
  const refreshToken = request.cookies.get("trs_refresh_token")?.value;

  // Redirect unauthenticated users away from protected pages
  // Allow through if they have a refresh token (client will auto-refresh)
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (isProtected && !token && !refreshToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages and the landing page
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));
  if ((isAuthPage || pathname === LANDING_PATH) && (token || refreshToken)) {
    return NextResponse.redirect(new URL("/map", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
