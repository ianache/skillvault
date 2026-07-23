import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // All protected routes require authentication
  const protectedPaths = ["/publish", "/dashboard"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !session) {
    const loginUrl = new URL("/api/auth/signin", req.url);
    loginUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(loginUrl);
  }

  const roles: string[] = session?.user?.roles ?? [];

  // /publish requires editor or admin
  if (pathname.startsWith("/publish") && !roles.includes("editor") && !roles.includes("admin")) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // /dashboard is available for any authenticated user,
  // but some sub-routes need stronger roles.
  if (pathname.startsWith("/dashboard/categories") && !roles.includes("admin")) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  if (pathname.startsWith("/dashboard/review") && !roles.includes("reviewer") && !roles.includes("admin")) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/publish/:path*", "/dashboard/:path*"],
};
