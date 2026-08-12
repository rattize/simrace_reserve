import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  const slot = await prisma.slot.findUnique({ where: { id } });
  if (!slot) {
    return NextResponse.json({ error: "枠が見つかりません。" }, { status: 404 });
  }

  const capacity = body?.capacity === undefined ? slot.capacity : Number(body.capacity);
  const isOpen = body?.isOpen === undefined ? slot.isOpen : Boolean(body.isOpen);

  if (!Number.isInteger(capacity) || capacity < 0 || capacity > 100) {
    return NextResponse.json({ error: "定員が不正です。" }, { status: 400 });
  }
  if (capacity < slot.bookedCount) {
    return NextResponse.json(
      { error: `既に${slot.bookedCount}名予約があるため、それ未満には設定できません。` },
      { status: 400 },
    );
  }

  const updated = await prisma.slot.update({
    where: { id },
    data: { capacity, isOpen },
  });

  return NextResponse.json({ slot: updated });
}
