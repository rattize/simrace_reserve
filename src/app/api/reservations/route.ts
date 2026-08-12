import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createUniqueReservationCode } from "@/lib/code";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  const slotId = typeof body?.slotId === "string" ? body.slotId : "";
  const rigId = typeof body?.rigId === "string" ? body.rigId : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const grade =
    typeof body?.grade === "string" && body.grade.trim() ? body.grade.trim() : null;

  if (!slotId) {
    return NextResponse.json({ error: "枠を選択してください。" }, { status: 400 });
  }
  if (!rigId) {
    return NextResponse.json({ error: "機体を選択してください。" }, { status: 400 });
  }
  if (!name || name.length > 50) {
    return NextResponse.json(
      { error: "お名前を1〜50文字で入力してください。" },
      { status: 400 },
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const slot = await tx.slot.findUnique({ where: { id: slotId } });
    if (!slot || !slot.isOpen || slot.endTime.getTime() <= Date.now()) {
      return { ok: false as const, reason: "unavailable" as const };
    }

    const rig = await tx.rig.findUnique({ where: { id: rigId } });
    if (!rig || !rig.isActive) {
      return { ok: false as const, reason: "rig_unavailable" as const };
    }

    const existing = await tx.reservation.findFirst({
      where: { slotId, rigId, status: { not: "cancelled" } },
    });
    if (existing) {
      return { ok: false as const, reason: "taken" as const };
    }

    const code = await createUniqueReservationCode(tx);
    const reservation = await tx.reservation.create({
      data: { code, slotId, rigId, name, grade },
      include: { slot: true, rig: true },
    });

    return { ok: true as const, reservation };
  });

  if (!result.ok) {
    const messages: Record<string, string> = {
      unavailable: "この枠は現在予約できません。",
      rig_unavailable: "この機体は現在予約できません。",
      taken: "この機体はこの時間帯で既に予約されています。別の機体をお選びください。",
    };
    return NextResponse.json({ error: messages[result.reason] }, { status: 409 });
  }

  return NextResponse.json({ reservation: result.reservation }, { status: 201 });
}
