import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, expectedAuthValue } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const expected = await expectedAuthValue();

  // If no password is configured, don't lock people out during local dev —
  // but this means the dashboard is open. Set DASHBOARD_PASSWORD before going live.
  if (!expected) return NextResponse.next();

  const cookie = req.cookies.get(AUTH_COOKIE)?.value;
  if (cookie === expected) return NextResponse.next();

  const loginUrl = new URL("/login", req.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
