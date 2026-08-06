import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "rh_session";

const PUBLIC_PAGE_PREFIXES = ["/login", "/logout", "/reset-password", "/forgot-password"];

const PUBLIC_API_PREFIXES = ["/api/login", "/api/auth/"];

function isPublicPage(pathname: string) {
  if (pathname === "/") return true;
  return PUBLIC_PAGE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "?"));
}

function isPublicApi(pathname: string) {
  return PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p));
}

function isPageRoute(pathname: string) {
  return !pathname.startsWith("/api/") && !pathname.startsWith("/_next/");
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const response = NextResponse.next();

  if (!request.cookies.has("rh_csrf")) {
    response.cookies.set("rh_csrf", crypto.randomUUID(), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
  }

  if (isPageRoute(pathname)) {
    if (!isPublicPage(pathname) && !request.cookies.has(SESSION_COOKIE)) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  } else if (!isPublicApi(pathname)) {
    if (!request.cookies.has(SESSION_COOKIE)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
