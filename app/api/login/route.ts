import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, expectedAuthValue, hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const expected = await expectedAuthValue();
  if (!expected) {
    return NextResponse.json(
      { error: "DASHBOARD_PASSWORD is not configured on the server." },
      { status: 500 }
    );
  }

  const body = await req.json();
  const submitted = typeof body.password === "string" ? body.password : "";
  const submittedHash = await hashPassword(submitted);

  if (submittedHash !== expected) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, expected, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
