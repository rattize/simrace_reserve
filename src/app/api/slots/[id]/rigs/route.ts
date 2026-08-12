import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  const slot = await prisma.slot.findUnique({ where: { id } });
  if (!slot || !slot.isOpen || slot.endTime.getTime() <= Date.now()) {
    return NextResponse.json({ error: "この枠は現在予約できません。" }, { status: 404 });
  }

  const [rigs, bookedReservations] = await Promise.all([
    prisma.rig.findMany({ where: { isActive: true }, orderBy: { createdAt: "asc" } }),
    prisma.reservation.findMany({
      where: { slotId: id, status: { not: "cancelled" } },
      select: { rigId: true },
    }),
  ]);

  const bookedRigIds = new Set(bookedReservations.map((r) => r.rigId));

  const data = rigs.map((rig) => ({
    id: rig.id,
    name: rig.name,
    spec: rig.spec,
    available: !bookedRigIds.has(rig.id),
  }));

  return NextResponse.json({ rigs: data });
}
