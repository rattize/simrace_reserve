"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Slot = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  remaining: number;
};

type Reservation = {
  code: string;
  name: string;
  partySize: number;
  slot: { date: string; startTime: string; endTime: string };
};

function formatDateLabel(date: string) {
  const d = new Date(`${date}T00:00:00+09:00`);
  return d.toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function formatTimeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BookingClient() {
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [partySize, setPartySize] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reservation, setReservation] = useState<Reservation | null>(null);

  async function loadSlots() {
    const res = await fetch("/api/slots", { cache: "no-store" });
    const data = await res.json();
    setSlots(data.slots as Slot[]);
  }

  useEffect(() => {
    // 初回マウント時にAPIから枠一覧を取得する
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSlots();
  }, []);

  const dates = useMemo(() => {
    if (!slots) return [];
    return Array.from(new Set(slots.map((s) => s.date)));
  }, [slots]);

  const activeDate = selectedDate ?? dates[0] ?? null;

  const slotsForDate = useMemo(
    () => (slots ?? []).filter((s) => s.date === activeDate),
    [slots, activeDate],
  );

  const selectedSlot = useMemo(
    () => (slots ?? []).find((s) => s.id === selectedSlotId) ?? null,
    [slots, selectedSlotId],
  );

  const maxPartySize = selectedSlot ? Math.max(1, selectedSlot.remaining) : 20;
  const effectivePartySize = Math.min(partySize, maxPartySize);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlotId) return;
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slotId: selectedSlotId,
        name,
        grade,
        partySize: effectivePartySize,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "予約に失敗しました。");
      setSubmitting(false);
      await loadSlots();
      setSelectedSlotId(null);
      return;
    }

    setReservation(data.reservation as Reservation);
    setSubmitting(false);
  }

  if (reservation) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <p className="text-sm text-emerald-700">予約が完了しました</p>
          <p className="mt-2 text-3xl font-bold tracking-widest text-emerald-800">
            {reservation.code}
          </p>
          <p className="mt-4 text-sm text-slate-600">
            {formatDateLabel(reservation.slot.date)}{" "}
            {formatTimeLabel(reservation.slot.startTime)}〜
            {formatTimeLabel(reservation.slot.endTime)}
          </p>
          <p className="text-sm text-slate-600">
            {reservation.name} 様 / {reservation.partySize}名
          </p>
        </div>
        <p className="mt-4 text-sm text-slate-500">
          この予約コードは当日の受付や照会に必要です。忘れずに控えてください。
        </p>
        <Link
          href={`/reservation/${reservation.code}`}
          className="mt-6 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm text-white"
        >
          予約内容を確認する
        </Link>
      </div>
    );
  }

  if (!slots) {
    return <p className="px-4 py-10 text-center text-slate-500">読み込み中...</p>;
  }

  if (dates.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-slate-500">
        現在予約可能な枠がありません。
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-xl font-bold">予約する</h1>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {dates.map((date) => (
          <button
            key={date}
            onClick={() => {
              setSelectedDate(date);
              setSelectedSlotId(null);
            }}
            className={`shrink-0 rounded-full px-4 py-2 text-sm ${
              activeDate === date
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-700 border border-slate-300"
            }`}
          >
            {formatDateLabel(date)}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {slotsForDate.map((slot) => {
          const full = slot.remaining <= 0;
          return (
            <button
              key={slot.id}
              disabled={full}
              onClick={() => setSelectedSlotId(slot.id)}
              className={`rounded-lg border p-2 text-sm ${
                selectedSlotId === slot.id
                  ? "border-slate-900 bg-slate-900 text-white"
                  : full
                    ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                    : "border-slate-300 bg-white hover:border-slate-400"
              }`}
            >
              <div>{formatTimeLabel(slot.startTime)}</div>
              <div className="text-xs opacity-80">
                {full ? "満席" : `残${slot.remaining}/${slot.capacity}`}
              </div>
            </button>
          );
        })}
      </div>

      {selectedSlot && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-medium">
            {formatDateLabel(selectedSlot.date)} {formatTimeLabel(selectedSlot.startTime)}〜
            {formatTimeLabel(selectedSlot.endTime)} を予約
          </p>

          <div>
            <label className="block text-sm text-slate-600">お名前 *</label>
            <input
              required
              maxLength={50}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="山田 太郎"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600">学年・組（任意）</label>
            <input
              maxLength={30}
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="1年A組"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600">人数</label>
            <input
              type="number"
              min={1}
              max={maxPartySize}
              value={effectivePartySize}
              onChange={(e) => setPartySize(Number(e.target.value))}
              className="mt-1 w-24 rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
          >
            {submitting ? "予約中..." : "この内容で予約する"}
          </button>
        </form>
      )}
    </div>
  );
}
