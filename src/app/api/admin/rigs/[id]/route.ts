import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  const rig = await prisma.rig.findUnique({ where: { id } });
  if (!rig) {
    return NextResponse.json({ error: "機体が見つかりません。" }, { status: 404 });
  }

  const name = body?.name === undefined ? rig.name : String(body.name).trim();
  const spec = body?.spec === undefined ? rig.spec : String(body.spec).trim();
  const isActive = body?.isActive === undefined ? rig.isActive : Boolean(body.isActive);

  if (!name || name.length > 50) {
    return NextResponse.json(
      { error: "機体名を1〜50文字で入力してください。" },
      { status: 400 },
    );
  }
  if (spec.length > 300) {
    return NextResponse.json({ error: "スペックは300文字以内で入力してください。" }, { status: 400 });
  }

  const updated = await prisma.rig.update({
    where: { id },
    data: { name, spec, isActive },
  });

  return NextResponse.json({ rig: updated });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  const rig = await prisma.rig.findUnique({ where: { id } });
  if (!rig) {
    return NextResponse.json({ error: "機体が見つかりません。" }, { status: 404 });
  }

  const reservationCount = await prisma.reservation.count({ where: { rigId: id } });
  if (reservationCount > 0) {
    return NextResponse.json(
      { error: "この機体には予約履歴があるため削除できません。非稼働にしてください。" },
      { status: 409 },
    );
  }

  await prisma.rig.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
