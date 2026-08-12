import { prisma } from "@/lib/db";

export async function getEventConfig() {
  const existing = await prisma.eventConfig.findUnique({ where: { id: 1 } });
  if (existing) return existing;
  return prisma.eventConfig.create({ data: { id: 1 } });
}
