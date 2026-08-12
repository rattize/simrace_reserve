import { NextResponse } from "next/server";
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
