import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getEventConfig } from "@/lib/config";
import { buildSlotDrafts, parseEventDates } from "@/lib/slots";

export async function POST() {
  const config = await getEventConfig();
  const dates = parseEventDates(config.eventDates);

  if (dates.length === 0) {
    return NextResponse.json(
      { error: "先に開催日を設定してください。" },
      { status: 400 },
    );
  }

  const existingDates = new Set(
    (
      await prisma.slot.findMany({
        where: { date: { in: dates } },
        select: { date: true },
        distinct: ["date"],
      })
    ).map((s) => s.date),
  );

  const newDates = dates.filter((d) => !existingDates.has(d));
  if (newDates.length === 0) {
    return NextResponse.json(
      { error: "対象の日付にはすでに枠が存在します。", created: 0 },
      { status: 409 },
    );
  }

  const drafts = buildSlotDrafts({ ...config, eventDates: newDates.join(",") });
  await prisma.slot.createMany({
    data: drafts.map((d) => ({
      date: d.date,
      startTime: d.startTime,
      endTime: d.endTime,
      capacity: d.capacity,
    })),
  });

  return NextResponse.json({ created: drafts.length, dates: newDates });
}
