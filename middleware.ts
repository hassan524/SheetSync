import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Read your custom session cookie
  const token = req.cookies.get("my-supabase-session")?.value;

  const isLoggedIn = Boolean(token);

  // If logged in, don't allow access to "/" (login page)
  if (pathname === "/" && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // If NOT logged in, don't allow access to dashboard or other pages
  if (pathname !== "/" && !isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Otherwise allow request
  return NextResponse.next();
}

// Apply middleware to all routes except next internals
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
