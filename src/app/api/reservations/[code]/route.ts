import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ code: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { code } = await params;
  const reservation = await prisma.reservation.findUnique({
    where: { code: code.toUpperCase() },
    include: { slot: true },
  });

  if (!reservation) {
    return NextResponse.json({ error: "予約が見つかりません。" }, { status: 404 });
  }

  return NextResponse.json({ reservation });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { code } = await params;

  const result = await prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!reservation) {
      return { ok: false as const, reason: "not_found" as const };
    }
    if (reservation.status !== "confirmed") {
      return { ok: false as const, reason: "not_cancellable" as const };
    }

    await tx.reservation.update({
      where: { id: reservation.id },
      data: { status: "cancelled" },
    });
    await tx.slot.update({
      where: { id: reservation.slotId },
      data: { bookedCount: { decrement: reservation.partySize } },
    });

    return { ok: true as const };
  });

  if (!result.ok) {
    const status = result.reason === "not_found" ? 404 : 409;
    const message =
      result.reason === "not_found"
        ? "予約が見つかりません。"
        : "この予約はキャンセルできません。";
    return NextResponse.json({ error: message }, { status });
  }

  return NextResponse.json({ ok: true });
}
