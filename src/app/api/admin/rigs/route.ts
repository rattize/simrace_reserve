import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const rigs = await prisma.rig.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json({ rigs });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const spec = typeof body?.spec === "string" ? body.spec.trim() : "";

  if (!name || name.length > 50) {
    return NextResponse.json(
      { error: "機体名を1〜50文字で入力してください。" },
      { status: 400 },
    );
  }
  if (spec.length > 300) {
    return NextResponse.json({ error: "スペックは300文字以内で入力してください。" }, { status: 400 });
  }

  const rig = await prisma.rig.create({ data: { name, spec } });
  return NextResponse.json({ rig }, { status: 201 });
}
