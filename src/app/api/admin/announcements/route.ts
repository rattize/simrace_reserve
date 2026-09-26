import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  ANNOUNCEMENT_BODY_MAX,
  parseAnnouncementLevel,
  sortAnnouncements,
} from "@/lib/announcements";

export const dynamic = "force-dynamic";

export async function GET() {
  const announcements = await prisma.announcement.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ announcements: sortAnnouncements(announcements) });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  const text = typeof body?.body === "string" ? body.body.trim() : "";
  const level = body?.level === undefined ? "info" : parseAnnouncementLevel(body.level);
  const isPublished = body?.isPublished === undefined ? true : Boolean(body.isPublished);

  if (!text || text.length > ANNOUNCEMENT_BODY_MAX) {
    return NextResponse.json(
      { error: `本文を1〜${ANNOUNCEMENT_BODY_MAX}文字で入力してください。` },
      { status: 400 },
    );
  }
  if (!level) {
    return NextResponse.json({ error: "重要度が不正です。" }, { status: 400 });
  }

  const announcement = await prisma.announcement.create({
    data: { body: text, level, isPublished },
  });

  return NextResponse.json({ announcement }, { status: 201 });
}
