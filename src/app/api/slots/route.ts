import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const [slots, activeRigCount, bookedGroups] = await Promise.all([
    prisma.slot.findMany({
      where: {
        isOpen: true,
        endTime: { gt: new Date() },
      },
      orderBy: { startTime: "asc" },
    }),
    prisma.rig.count({ where: { isActive: true } }),
    prisma.reservation.groupBy({
      by: ["slotId"],
      where: { status: { not: "cancelled" }, rig: { isActive: true } },
      _count: { _all: true },
    }),
  ]);

  const bookedBySlot = new Map(bookedGroups.map((g) => [g.slotId, g._count._all]));

  const data = slots.map((slot) => ({
    id: slot.id,
    date: slot.date,
    startTime: slot.startTime.toISOString(),
    endTime: slot.endTime.toISOString(),
    totalRigCount: activeRigCount,
    availableRigCount: Math.max(activeRigCount - (bookedBySlot.get(slot.id) ?? 0), 0),
  }));

  return NextResponse.json({ slots: data });
}
