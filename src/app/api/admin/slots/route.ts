import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const slots = await prisma.slot.findMany({
    orderBy: { startTime: "asc" },
    include: {
      _count: {
        select: { reservations: { where: { status: { not: "cancelled" } } } },
      },
    },
  });

  const data = slots.map((slot) => ({
    id: slot.id,
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    isOpen: slot.isOpen,
    bookedCount: slot._count.reservations,
  }));

  return NextResponse.json({ slots: data });
}

export async function DELETE(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const ids: string[] = Array.isArray(body?.ids) ? body.ids.map(String) : [];

  if (ids.length === 0) {
    return NextResponse.json({ error: "削除する枠を選択してください。" }, { status: 400 });
  }

  // 確認と削除の間に予約が入らないよう、同じトランザクション内で行う
  const result = await prisma.$transaction(async (tx) => {
    const activeCount = await tx.reservation.count({
      where: { slotId: { in: ids }, status: { not: "cancelled" } },
    });
    if (activeCount > 0) return null;

    // キャンセル済みの予約は枠と一緒に削除する（外部キー制約のため）
    await tx.reservation.deleteMany({ where: { slotId: { in: ids } } });
    return tx.slot.deleteMany({ where: { id: { in: ids } } });
  });

  if (!result) {
    return NextResponse.json(
      { error: "予約が入っている枠は削除できません。受付を停止してください。" },
      { status: 409 },
    );
  }

  return NextResponse.json({ deleted: result.count });
}
