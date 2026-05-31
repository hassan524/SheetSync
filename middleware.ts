import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname === "/firebase-messaging-sw.js" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.startsWith("/icon-") ||
    pathname.startsWith("/og-image") ||
    pathname.startsWith("/Loading.") ||
    /\.(png|jpg|jpeg|gif|svg|webp|ico)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Read your custom session cookie
  const token = req.cookies.get("my-supabase-session")?.value;

  const isLoggedIn = Boolean(token);

  // If logged in, don't allow access to "/" (login page)
  if (pathname === "/" && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // If NOT logged in, don't allow access to dashboard or other pages
  if (pathname !== "/" && !isLoggedIn) {
    const loginUrl = new URL("/", req.url);
    loginUrl.searchParams.set("next", `${pathname}${req.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  // Otherwise allow request
  return NextResponse.next();
}

// Apply middleware to all routes except next internals
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
