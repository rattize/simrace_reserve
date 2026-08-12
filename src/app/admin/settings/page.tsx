"use client";

import { useEffect, useState } from "react";

type Config = {
  rigCount: number;
  slotMinutes: number;
  eventDates: string;
  openTime: string;
  closeTime: string;
};

type Slot = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  isOpen: boolean;
};

function formatTimeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminSettingsPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [generating, setGenerating] = useState(false);

  async function loadConfig() {
    const res = await fetch("/api/admin/config", { cache: "no-store" });
    const data = await res.json();
    setConfig(data.config as Config);
  }

  async function loadSlots() {
    const res = await fetch("/api/admin/slots", { cache: "no-store" });
    const data = await res.json();
    setSlots(data.slots as Slot[]);
  }

  useEffect(() => {
    // 初回マウント時に設定と枠一覧をAPIから取得する
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadConfig();
    loadSlots();
  }, []);

  async function handleConfigSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!config) return;
    setSavingConfig(true);
    setError(null);
    setMessage(null);

    const res = await fetch("/api/admin/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "保存に失敗しました。");
    } else {
      setConfig(data.config as Config);
      setMessage("設定を保存しました。");
    }
    setSavingConfig(false);
  }

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    setMessage(null);

    const res = await fetch("/api/admin/slots/generate", { method: "POST" });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "枠の生成に失敗しました。");
    } else {
      setMessage(`${data.created}件の枠を生成しました。`);
      await loadSlots();
    }
    setGenerating(false);
  }

  async function handleSlotSave(slot: Slot) {
    setError(null);
    const res = await fetch(`/api/admin/slots/${slot.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ capacity: slot.capacity, isOpen: slot.isOpen }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "枠の更新に失敗しました。");
      await loadSlots();
      return;
    }
    setMessage("枠を更新しました。");
  }

  function updateSlotLocal(id: string, patch: Partial<Slot>) {
    setSlots((prev) => prev?.map((s) => (s.id === id ? { ...s, ...patch } : s)) ?? null);
  }

  if (!config || !slots) {
    return <p className="px-4 py-10 text-center text-slate-500">読み込み中...</p>;
  }

  const slotsByDate = slots.reduce<Record<string, Slot[]>>((acc, s) => {
    (acc[s.date] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-xl font-bold">設定</h1>

      {message && <p className="mt-3 text-sm text-emerald-600">{message}</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <form
        onSubmit={handleConfigSubmit}
        className="mt-4 grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3"
      >
        <div>
          <label className="block text-sm text-slate-600">稼働台数（1枠の定員）</label>
          <input
            type="number"
            min={1}
            value={config.rigCount}
            onChange={(e) => setConfig({ ...config, rigCount: Number(e.target.value) })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-600">1枠の長さ（分）</label>
          <input
            type="number"
            min={1}
            value={config.slotMinutes}
            onChange={(e) => setConfig({ ...config, slotMinutes: Number(e.target.value) })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-600">開始時刻</label>
          <input
            type="time"
            value={config.openTime}
            onChange={(e) => setConfig({ ...config, openTime: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-600">終了時刻</label>
          <input
            type="time"
            value={config.closeTime}
            onChange={(e) => setConfig({ ...config, closeTime: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div className="col-span-2 sm:col-span-3">
          <label className="block text-sm text-slate-600">
            開催日（YYYY-MM-DD をカンマ区切り）
          </label>
          <input
            value={config.eventDates}
            onChange={(e) => setConfig({ ...config, eventDates: e.target.value })}
            placeholder="2026-09-12,2026-09-13"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div className="col-span-2 flex items-end gap-2 sm:col-span-3">
          <button
            type="submit"
            disabled={savingConfig}
            className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
          >
            {savingConfig ? "保存中..." : "設定を保存"}
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="rounded-lg border border-slate-300 px-4 py-2 disabled:opacity-50"
          >
            {generating ? "生成中..." : "枠を生成"}
          </button>
        </div>
        <p className="col-span-2 text-xs text-slate-500 sm:col-span-3">
          「枠を生成」は、まだ枠が存在しない開催日についてのみ時間枠を作成します。既存の枠には影響しません。
        </p>
      </form>

      <h2 className="mt-8 text-lg font-bold">時間枠の個別設定</h2>
      {Object.keys(slotsByDate).length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">まだ枠がありません。</p>
      ) : (
        Object.entries(slotsByDate).map(([date, dateSlots]) => (
          <div key={date} className="mt-4">
            <h3 className="text-sm font-semibold text-slate-600">{date}</h3>
            <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-3 py-2">時間</th>
                    <th className="px-3 py-2">定員</th>
                    <th className="px-3 py-2">予約済み</th>
                    <th className="px-3 py-2">受付中</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {dateSlots.map((s) => (
                    <tr key={s.id} className="border-t border-slate-100">
                      <td className="px-3 py-2 whitespace-nowrap">
                        {formatTimeLabel(s.startTime)}〜{formatTimeLabel(s.endTime)}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={s.bookedCount}
                          value={s.capacity}
                          onChange={(e) =>
                            updateSlotLocal(s.id, { capacity: Number(e.target.value) })
                          }
                          className="w-20 rounded-lg border border-slate-300 px-2 py-1"
                        />
                      </td>
                      <td className="px-3 py-2">{s.bookedCount}</td>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={s.isOpen}
                          onChange={(e) => updateSlotLocal(s.id, { isOpen: e.target.checked })}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => handleSlotSave(s)}
                          className="rounded-lg border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50"
                        >
                          保存
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
