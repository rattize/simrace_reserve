import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const slots = await prisma.slot.findMany({
    where: {
      isOpen: true,
      endTime: { gt: new Date() },
    },
    orderBy: { startTime: "asc" },
  });

  const data = slots.map((slot) => ({
    id: slot.id,
    date: slot.date,
    startTime: slot.startTime.toISOString(),
    endTime: slot.endTime.toISOString(),
    capacity: slot.capacity,
    remaining: Math.max(slot.capacity - slot.bookedCount, 0),
  }));

  return NextResponse.json({ slots: data });
}
