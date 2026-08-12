import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getEventConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = await getEventConfig();
  return NextResponse.json({ config });
}

export async function PUT(request: NextRequest) {
  const body = await request.json().catch(() => null);

  const slotMinutes = Number(body?.slotMinutes);
  const eventDates = typeof body?.eventDates === "string" ? body.eventDates.trim() : "";
  const openTime = typeof body?.openTime === "string" ? body.openTime : "";
  const closeTime = typeof body?.closeTime === "string" ? body.closeTime : "";

  if (!Number.isInteger(slotMinutes) || slotMinutes < 1 || slotMinutes > 180) {
    return NextResponse.json({ error: "枠の長さが不正です。" }, { status: 400 });
  }
  if (!/^\d{2}:\d{2}$/.test(openTime) || !/^\d{2}:\d{2}$/.test(closeTime)) {
    return NextResponse.json({ error: "営業時間が不正です。" }, { status: 400 });
  }
  const dates = eventDates
    .split(",")
    .map((d: string) => d.trim())
    .filter(Boolean);
  if (dates.some((d: string) => !/^\d{4}-\d{2}-\d{2}$/.test(d))) {
    return NextResponse.json(
      { error: "開催日はYYYY-MM-DD形式でカンマ区切りにしてください。" },
      { status: 400 },
    );
  }

  await getEventConfig();
  const config = await prisma.eventConfig.update({
    where: { id: 1 },
    data: { slotMinutes, eventDates: dates.join(","), openTime, closeTime },
  });

  return NextResponse.json({ config });
}
