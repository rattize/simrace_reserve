// このアプリは日本の学園祭を想定しているため、時刻は常に日本時間(JST)として扱う。
const JST_OFFSET = "+09:00";

function toJstDate(dateStr: string, timeStr: string) {
  return new Date(`${dateStr}T${timeStr}:00${JST_OFFSET}`);
}

export type EventConfigLike = {
  eventDates: string;
  openTime: string;
  closeTime: string;
  slotMinutes: number;
  rigCount: number;
};

export type SlotDraft = {
  date: string;
  startTime: Date;
  endTime: Date;
  capacity: number;
};

export function parseEventDates(eventDates: string): string[] {
  return eventDates
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);
}

export function buildSlotDrafts(config: EventConfigLike): SlotDraft[] {
  const drafts: SlotDraft[] = [];

  for (const date of parseEventDates(config.eventDates)) {
    const dayStart = toJstDate(date, config.openTime);
    const dayEnd = toJstDate(date, config.closeTime);
    const stepMs = config.slotMinutes * 60_000;

    let cursor = dayStart.getTime();
    while (cursor + stepMs <= dayEnd.getTime()) {
      drafts.push({
        date,
        startTime: new Date(cursor),
        endTime: new Date(cursor + stepMs),
        capacity: config.rigCount,
      });
      cursor += stepMs;
    }
  }

  return drafts;
}

export function formatJstTime(date: Date): string {
  return date.toLocaleTimeString("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatJstDate(date: string): string {
  const d = new Date(`${date}T00:00:00${JST_OFFSET}`);
  return d.toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}
