import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PATHS = ["/map", "/spot", "/profile", "/settings", "/feed"];
const AUTH_PATHS = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("trs_token")?.value;

  // Redirect unauthenticated users away from protected pages
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));
  if (isAuthPage && token) {
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
