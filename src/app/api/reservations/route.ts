import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createUniqueReservationCode } from "@/lib/code";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  const slotId = typeof body?.slotId === "string" ? body.slotId : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const grade =
    typeof body?.grade === "string" && body.grade.trim() ? body.grade.trim() : null;
  const partySize = Number.isInteger(body?.partySize) ? body.partySize : 1;

  if (!slotId) {
    return NextResponse.json({ error: "枠を選択してください。" }, { status: 400 });
  }
  if (!name || name.length > 50) {
    return NextResponse.json(
      { error: "お名前を1〜50文字で入力してください。" },
      { status: 400 },
    );
  }
  if (partySize < 1 || partySize > 20) {
    return NextResponse.json({ error: "人数が不正です。" }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const slot = await tx.slot.findUnique({ where: { id: slotId } });

    if (!slot || !slot.isOpen || slot.endTime.getTime() <= Date.now()) {
      return { ok: false as const, reason: "unavailable" as const };
    }
    if (partySize > slot.capacity) {
      return { ok: false as const, reason: "party_too_large" as const };
    }

    const threshold = slot.capacity - partySize;
    const updated = await tx.slot.updateMany({
      where: { id: slotId, isOpen: true, bookedCount: { lte: threshold } },
      data: { bookedCount: { increment: partySize } },
    });

    if (updated.count === 0) {
      return { ok: false as const, reason: "full" as const };
    }

    const code = await createUniqueReservationCode(tx);
    const reservation = await tx.reservation.create({
      data: { code, slotId, name, grade, partySize },
      include: { slot: true },
    });

    return { ok: true as const, reservation };
  });

  if (!result.ok) {
    const messages: Record<string, string> = {
      unavailable: "この枠は現在予約できません。",
      party_too_large: "人数が定員を超えています。",
      full: "この枠は満員になりました。別の枠をお選びください。",
    };
    return NextResponse.json({ error: messages[result.reason] }, { status: 409 });
  }

  return NextResponse.json({ reservation: result.reservation }, { status: 201 });
}
