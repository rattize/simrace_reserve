"use client";

import { useEffect, useState } from "react";
import Announcements from "@/components/Announcements";

type SlotStatus = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  totalCount: number;
  checkedInCount: number;
  pendingCount: number;
  pendingCodes: string[];
};

function formatClock(d: Date) {
  return d.toLocaleTimeString("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDateLabel(d: Date) {
  return d.toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function formatTimeRange(startIso: string, endIso: string) {
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
  };
  const start = new Date(startIso).toLocaleTimeString("ja-JP", opts);
  const end = new Date(endIso).toLocaleTimeString("ja-JP", opts);
  return `${start}〜${end}`;
}

export default function DisplayClient() {
  const [now, setNow] = useState(() => new Date());
  const [slots, setSlots] = useState<SlotStatus[] | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/slots/status", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) setSlots(data.slots as SlotStatus[]);
      } catch {
        // 通信エラー時は次のポーリングまで直前の表示を維持する
      }
    }

    poll();
    const timer = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  if (!slots) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <p className="text-2xl text-slate-400">読み込み中...</p>
      </div>
    );
  }

  const nowMs = now.getTime();
  const pendingSlots = slots.filter((s) => s.pendingCount > 0);
  const overdueSlots = pendingSlots.filter((s) => new Date(s.startTime).getTime() <= nowMs);
  const upcomingSlots = pendingSlots.filter((s) => new Date(s.startTime).getTime() > nowMs);

  const callingCodes = overdueSlots.flatMap((s) => s.pendingCodes);
  const nextSlot = upcomingSlots[0] ?? null;

  const nextSlotIndex = nextSlot ? slots.findIndex((s) => s.id === nextSlot.id) : -1;
  const afterNextSlot =
    nextSlotIndex >= 0
      ? (slots[nextSlotIndex + 1] ?? null)
      : (slots.find((s) => new Date(s.startTime).getTime() > nowMs) ?? null);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-slate-950 px-6 py-10 text-center">
      <div>
        <p className="text-lg text-slate-400">{formatDateLabel(now)}</p>
        <p className="mt-1 font-mono text-4xl font-bold tabular-nums text-white">
          {formatClock(now)}
        </p>
      </div>

      {callingCodes.length > 0 && (
        <div>
          <p className="text-3xl font-medium text-slate-300">呼び出し中の受付番号</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            {callingCodes.map((code) => (
              <span
                key={code}
                className="rounded-2xl bg-emerald-400 px-8 py-4 font-mono text-7xl font-bold tracking-widest text-emerald-950 sm:text-8xl"
              >
                {code}
              </span>
            ))}
          </div>
        </div>
      )}

      {nextSlot ? (
        <div>
          <p className="text-3xl font-medium text-slate-300">次にお呼びする受付番号</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            {nextSlot.pendingCodes.map((code) => (
              <span
                key={code}
                className="rounded-2xl bg-white px-8 py-4 font-mono text-7xl font-bold tracking-widest text-slate-900 sm:text-8xl"
              >
                {code}
              </span>
            ))}
          </div>
          <p className="mt-6 text-2xl text-slate-400">
            {formatTimeRange(nextSlot.startTime, nextSlot.endTime)} の枠
          </p>
        </div>
      ) : (
        callingCodes.length === 0 && (
          <p className="text-3xl text-slate-300">現在お呼び出し中の受付番号はありません</p>
        )
      )}

      {afterNextSlot && afterNextSlot.id !== nextSlot?.id && (
        <div className="text-slate-400">
          <p className="text-lg">次の枠の開始時刻</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-slate-200">
            {formatTimeRange(afterNextSlot.startTime, afterNextSlot.endTime)}
          </p>
        </div>
      )}

      <Announcements variant="display" pollMs={15000} className="max-w-4xl" />
    </div>
  );
}
