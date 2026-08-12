import { NextRequest, NextResponse } from "next/server";
import { isAdminPasswordCorrect } from "@/lib/adminPassword";
import { ADMIN_SESSION_COOKIE, createAdminSessionToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";

  if (!isAdminPasswordCorrect(password)) {
    return NextResponse.json({ error: "パスワードが違います。" }, { status: 401 });
  }

  const token = await createAdminSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}
