import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  PAGE_CONTENT_MAX,
  PAGE_CONTENTS,
  getPageContent,
  isPageContentKey,
} from "@/lib/pageContent";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ key: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { key } = await params;
  if (!isPageContentKey(key)) {
    return NextResponse.json({ error: "編集できないページです。" }, { status: 404 });
  }

  const markdown = await getPageContent(key);
  return NextResponse.json({ key, markdown, defaultMarkdown: PAGE_CONTENTS[key].default });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { key } = await params;
  if (!isPageContentKey(key)) {
    return NextResponse.json({ error: "編集できないページです。" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (typeof body?.markdown !== "string") {
    return NextResponse.json({ error: "本文が不正です。" }, { status: 400 });
  }
  const markdown = body.markdown.trim();
  if (markdown.length > PAGE_CONTENT_MAX) {
    return NextResponse.json(
      { error: `本文は${PAGE_CONTENT_MAX}文字以内で入力してください。` },
      { status: 400 },
    );
  }

  await prisma.pageContent.upsert({
    where: { key },
    create: { key, markdown },
    update: { markdown },
  });

  return NextResponse.json({ key, markdown });
}
