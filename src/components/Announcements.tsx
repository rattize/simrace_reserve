"use client";

import { useEffect, useState } from "react";

type Announcement = {
  id: string;
  body: string;
  level: string;
};

type Props = {
  // display: 受付案内画面（暗い背景・大きい文字）用
  variant?: "page" | "display";
  // 指定するとその間隔(ms)で再取得する
  pollMs?: number;
  className?: string;
};

const STYLES = {
  page: {
    info: "border-sky-200 bg-sky-50 text-sky-900",
    important: "border-red-300 bg-red-50 text-red-900",
    item: "rounded-xl border px-4 py-3 text-left text-sm",
    badge: "mr-2 rounded bg-red-600 px-1.5 py-0.5 text-xs font-bold text-white",
  },
  display: {
    info: "border-slate-700 bg-slate-900 text-slate-100",
    important: "border-red-500 bg-red-950 text-red-50",
    item: "rounded-2xl border-2 px-6 py-4 text-left text-2xl",
    badge: "mr-3 rounded bg-red-500 px-2 py-0.5 text-xl font-bold text-white",
  },
};

export default function Announcements({ variant = "page", pollMs, className = "" }: Props) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/announcements", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) setAnnouncements(data.announcements as Announcement[]);
      } catch {
        // 通信エラー時は直前の表示を維持する
      }
    }

    load();
    const timer = pollMs ? setInterval(load, pollMs) : undefined;
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [pollMs]);

  if (announcements.length === 0) return null;

  const styles = STYLES[variant];

  return (
    <ul className={`flex w-full flex-col gap-2 ${className}`}>
      {announcements.map((a) => (
        <li
          key={a.id}
          className={`${styles.item} ${a.level === "important" ? styles.important : styles.info}`}
        >
          {a.level === "important" && <span className={styles.badge}>重要</span>}
          <span className="whitespace-pre-wrap">{a.body}</span>
        </li>
      ))}
    </ul>
  );
}
