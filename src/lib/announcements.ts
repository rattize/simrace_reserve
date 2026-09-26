export const ANNOUNCEMENT_LEVELS = ["info", "important"] as const;
export type AnnouncementLevel = (typeof ANNOUNCEMENT_LEVELS)[number];

export const ANNOUNCEMENT_BODY_MAX = 500;

export function parseAnnouncementLevel(value: unknown): AnnouncementLevel | null {
  return ANNOUNCEMENT_LEVELS.includes(value as AnnouncementLevel)
    ? (value as AnnouncementLevel)
    : null;
}

// 重要なお知らせを先に並べる（Array.prototype.sort は安定ソートなので、事前の新しい順は保たれる）
export function sortAnnouncements<T extends { level: string }>(announcements: T[]) {
  return [...announcements].sort(
    (a, b) => Number(b.level === "important") - Number(a.level === "important"),
  );
}
