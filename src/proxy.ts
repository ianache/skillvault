import { auth } from "@/auth";
import { decidePageAccess } from "@/lib/auth/access-policy";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const roles = req.auth?.user?.roles ?? [];
  const decision = decidePageAccess(pathname, Boolean(req.auth), roles);

  if (decision === "signin") {
    const loginUrl = new URL("/api/auth/signin", req.url);
    loginUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(loginUrl);
  }

  if (decision === "catalog") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/publish/:path*",
    "/dashboard/:path*",
    "/proposals/:path*",
    "/review/:path*",
    "/categories/:path*",
    "/users/:path*",
    "/skills/:path*",
  ],
};
