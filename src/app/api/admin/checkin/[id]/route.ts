import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reservation = await prisma.reservation.findUnique({ where: { id } });

  if (!reservation || reservation.status === "cancelled") {
    return NextResponse.json({ error: "予約が見つかりません。" }, { status: 404 });
  }

  const nextStatus = reservation.status === "checked_in" ? "confirmed" : "checked_in";
  const updated = await prisma.reservation.update({
    where: { id },
    data: {
      status: nextStatus,
      checkedInAt: nextStatus === "checked_in" ? new Date() : null,
    },
    include: { slot: true },
  });

  return NextResponse.json({ reservation: updated });
}
