import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// 来場者にも見えるデジタルサイネージ用の公開エンドポイント。
// 氏名などの個人情報は含めず、予約コード（受付番号）と枠ごとの件数だけを返す。
export async function GET() {
  const slots = await prisma.slot.findMany({
    where: { isOpen: true },
    orderBy: { startTime: "asc" },
    include: {
      reservations: {
        where: { status: { not: "cancelled" } },
        select: { code: true, status: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const data = slots.map((slot) => {
    const total = slot.reservations.length;
    const pendingCodes = slot.reservations
      .filter((r) => r.status !== "checked_in")
      .map((r) => r.code);
    const checkedIn = total - pendingCodes.length;
    return {
      id: slot.id,
      date: slot.date,
      startTime: slot.startTime.toISOString(),
      endTime: slot.endTime.toISOString(),
      totalCount: total,
      checkedInCount: checkedIn,
      pendingCount: pendingCodes.length,
      pendingCodes,
    };
  });

  return NextResponse.json({ slots: data, now: new Date().toISOString() });
}
