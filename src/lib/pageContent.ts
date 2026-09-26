import { prisma } from "@/lib/db";

// 管理画面から編集できるページ内のブロック。未編集の場合は default を表示する
export const PAGE_CONTENTS = {
  "top.visitGuide": {
    label: "トップページ「ご来場の流れ」",
    default: `**ご来場の流れ**

1. お好きな時間枠を予約すると、6桁の予約コードが発行されます。
2. 当日は開始時刻までに受付までお越しください。
3. 受付で予約コードまたはお名前をお伝えください。
`,
  },
} as const;

export type PageContentKey = keyof typeof PAGE_CONTENTS;

export const PAGE_CONTENT_MAX = 5000;

export function isPageContentKey(key: string): key is PageContentKey {
  return Object.hasOwn(PAGE_CONTENTS, key);
}

export async function getPageContent(key: PageContentKey) {
  const row = await prisma.pageContent.findUnique({ where: { key } });
  return row?.markdown ?? PAGE_CONTENTS[key].default;
}
