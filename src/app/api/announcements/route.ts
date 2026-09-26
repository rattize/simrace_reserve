import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sortAnnouncements } from "@/lib/announcements";

export const dynamic = "force-dynamic";

export async function GET() {
  const announcements = await prisma.announcement.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, body: true, level: true, createdAt: true },
  });

  return NextResponse.json({ announcements: sortAnnouncements(announcements) });
}
