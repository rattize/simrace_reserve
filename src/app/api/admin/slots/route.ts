import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const slots = await prisma.slot.findMany({
    orderBy: { startTime: "asc" },
  });
  return NextResponse.json({ slots });
}
