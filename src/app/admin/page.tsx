"use client";

import { useEffect, useMemo, useState } from "react";

type Reservation = {
  id: string;
  code: string;
  name: string;
  grade: string | null;
  partySize: number;
  status: "confirmed" | "cancelled" | "checked_in";
  slot: { id: string; date: string; startTime: string; endTime: string };
};

function formatTimeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminDashboardPage() {
  const [reservations, setReservations] = useState<Reservation[] | null>(null);
  const [date, setDate] = useState("");
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (q) params.set("q", q);
    const res = await fetch(`/api/admin/reservations?${params.toString()}`, {
      cache: "no-store",
    });
    const data = await res.json();
    setReservations(data.reservations as Reservation[]);
  }

  useEffect(() => {
    // dateが変わるたびにAPIから予約一覧を取得する
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const dates = useMemo(() => {
    if (!reservations) return [];
    return Array.from(new Set(reservations.map((r) => r.slot.date))).sort();
  }, [reservations]);

  async function handleCheckin(id: string) {
    setBusyId(id);
    await fetch(`/api/admin/checkin/${id}`, { method: "POST" });
    await load();
    setBusyId(null);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-xl font-bold">予約一覧・受付</h1>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <select
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">すべての日付</option>
          {dates.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
          className="flex gap-2"
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="氏名・予約コードで検索"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            検索
          </button>
        </form>
      </div>

      {!reservations ? (
        <p className="mt-6 text-slate-500">読み込み中...</p>
      ) : reservations.length === 0 ? (
        <p className="mt-6 text-slate-500">予約はありません。</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-3 py-2">日時</th>
                <th className="px-3 py-2">コード</th>
                <th className="px-3 py-2">氏名</th>
                <th className="px-3 py-2">学年・組</th>
                <th className="px-3 py-2">人数</th>
                <th className="px-3 py-2">状態</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {r.slot.date} {formatTimeLabel(r.slot.startTime)}
                  </td>
                  <td className="px-3 py-2 font-mono tracking-wider">{r.code}</td>
                  <td className="px-3 py-2">{r.name}</td>
                  <td className="px-3 py-2">{r.grade ?? "-"}</td>
                  <td className="px-3 py-2">{r.partySize}</td>
                  <td className="px-3 py-2">
                    {r.status === "checked_in" ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">
                        受付済み
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                        未受付
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => handleCheckin(r.id)}
                      disabled={busyId === r.id}
                      className="rounded-lg border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50 disabled:opacity-50"
                    >
                      {r.status === "checked_in" ? "受付取消" : "チェックイン"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
