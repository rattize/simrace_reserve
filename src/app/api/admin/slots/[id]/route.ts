import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  const slot = await prisma.slot.findUnique({ where: { id } });
  if (!slot) {
    return NextResponse.json({ error: "枠が見つかりません。" }, { status: 404 });
  }

  const isOpen = body?.isOpen === undefined ? slot.isOpen : Boolean(body.isOpen);

  const updated = await prisma.slot.update({
    where: { id },
    data: { isOpen },
  });

  return NextResponse.json({ slot: updated });
}
