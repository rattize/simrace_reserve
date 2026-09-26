import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ANNOUNCEMENT_BODY_MAX, parseAnnouncementLevel } from "@/lib/announcements";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  const announcement = await prisma.announcement.findUnique({ where: { id } });
  if (!announcement) {
    return NextResponse.json({ error: "お知らせが見つかりません。" }, { status: 404 });
  }

  const text = body?.body === undefined ? announcement.body : String(body.body).trim();
  const level = body?.level === undefined ? announcement.level : parseAnnouncementLevel(body.level);
  const isPublished =
    body?.isPublished === undefined ? announcement.isPublished : Boolean(body.isPublished);

  if (!text || text.length > ANNOUNCEMENT_BODY_MAX) {
    return NextResponse.json(
      { error: `本文を1〜${ANNOUNCEMENT_BODY_MAX}文字で入力してください。` },
      { status: 400 },
    );
  }
  if (!level) {
    return NextResponse.json({ error: "重要度が不正です。" }, { status: 400 });
  }

  const updated = await prisma.announcement.update({
    where: { id },
    data: { body: text, level, isPublished },
  });

  return NextResponse.json({ announcement: updated });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  const announcement = await prisma.announcement.findUnique({ where: { id } });
  if (!announcement) {
    return NextResponse.json({ error: "お知らせが見つかりません。" }, { status: 404 });
  }

  await prisma.announcement.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
