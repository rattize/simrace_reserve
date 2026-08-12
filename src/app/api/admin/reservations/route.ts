import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const q = searchParams.get("q")?.trim();

  const reservations = await prisma.reservation.findMany({
    where: {
      status: { not: "cancelled" },
      ...(date ? { slot: { date } } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { code: { contains: q.toUpperCase() } },
            ],
          }
        : {}),
    },
    include: { slot: true },
    orderBy: [{ slot: { startTime: "asc" } }, { createdAt: "asc" }],
  });

  return NextResponse.json({ reservations });
}
