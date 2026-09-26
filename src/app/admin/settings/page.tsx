"use client";

import { useEffect, useState } from "react";

type Config = {
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
  bookedCount: number;
  isOpen: boolean;
};

type Rig = {
  id: string;
  name: string;
  spec: string;
  isActive: boolean;
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
  const [rigs, setRigs] = useState<Rig[] | null>(null);
  const [newRigName, setNewRigName] = useState("");
  const [newRigSpec, setNewRigSpec] = useState("");
  const [addingRig, setAddingRig] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedSlotIds, setSelectedSlotIds] = useState<Set<string>>(new Set());
  const [deletingSlots, setDeletingSlots] = useState(false);

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

  async function loadRigs() {
    const res = await fetch("/api/admin/rigs", { cache: "no-store" });
    const data = await res.json();
    setRigs(data.rigs as Rig[]);
  }

  useEffect(() => {
    // 初回マウント時に設定・枠一覧・機体一覧をAPIから取得する
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadConfig();
    loadSlots();
    loadRigs();
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
      body: JSON.stringify({ isOpen: slot.isOpen }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "枠の更新に失敗しました。");
      await loadSlots();
      return;
    }
    setMessage("枠を更新しました。");
  }

  async function deleteSlots(ids: string[], confirmMessage: string) {
    if (ids.length === 0 || !confirm(confirmMessage)) return;
    setDeletingSlots(true);
    setError(null);
    setMessage(null);

    const res = await fetch("/api/admin/slots", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "枠の削除に失敗しました。");
    } else {
      setMessage(`${data.deleted}件の枠を削除しました。`);
      setSelectedSlotIds(new Set());
    }
    await loadSlots();
    setDeletingSlots(false);
  }

  function toggleSlotSelection(ids: string[], checked: boolean) {
    setSelectedSlotIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  function updateSlotLocal(id: string, patch: Partial<Slot>) {
    setSlots((prev) => prev?.map((s) => (s.id === id ? { ...s, ...patch } : s)) ?? null);
  }

  function updateRigLocal(id: string, patch: Partial<Rig>) {
    setRigs((prev) => prev?.map((r) => (r.id === id ? { ...r, ...patch } : r)) ?? null);
  }

  async function handleAddRig(e: React.FormEvent) {
    e.preventDefault();
    if (!newRigName.trim()) return;
    setAddingRig(true);
    setError(null);
    setMessage(null);

    const res = await fetch("/api/admin/rigs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newRigName, spec: newRigSpec }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "機体の追加に失敗しました。");
    } else {
      setNewRigName("");
      setNewRigSpec("");
      setMessage("機体を追加しました。");
      await loadRigs();
    }
    setAddingRig(false);
  }

  async function handleRigSave(rig: Rig) {
    setError(null);
    const res = await fetch(`/api/admin/rigs/${rig.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: rig.name, spec: rig.spec, isActive: rig.isActive }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "機体の更新に失敗しました。");
      await loadRigs();
      return;
    }
    setMessage("機体を更新しました。");
  }

  async function handleRigDelete(id: string) {
    if (!confirm("この機体を削除しますか？")) return;
    setError(null);
    const res = await fetch(`/api/admin/rigs/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "機体の削除に失敗しました。");
      return;
    }
    setMessage("機体を削除しました。");
    await loadRigs();
  }

  if (!config || !slots || !rigs) {
    return <p className="px-4 py-10 text-center text-slate-500">読み込み中...</p>;
  }

  const activeRigCount = rigs.filter((r) => r.isActive).length;
  const slotsByDate = slots.reduce<Record<string, Slot[]>>((acc, s) => {
    (acc[s.date] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-xl font-bold">設定</h1>

      {message && <p className="mt-3 text-sm text-emerald-600">{message}</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <h2 className="mt-6 text-lg font-bold">機体管理</h2>
      <p className="mt-1 text-xs text-slate-500">
        機体ごとにスペックが異なる場合は、ここで名前とスペックを登録してください。予約画面で来場者が機体を選ぶ際に表示されます。
      </p>
      <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-3 py-2">機体名</th>
              <th className="px-3 py-2">スペック</th>
              <th className="px-3 py-2">稼働中</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rigs.map((rig) => (
              <tr key={rig.id} className="border-t border-slate-100">
                <td className="px-3 py-2">
                  <input
                    value={rig.name}
                    onChange={(e) => updateRigLocal(rig.id, { name: e.target.value })}
                    className="w-32 rounded-lg border border-slate-300 bg-white px-2 py-1 text-slate-900"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    value={rig.spec}
                    onChange={(e) => updateRigLocal(rig.id, { spec: e.target.value })}
                    placeholder="例: ハンドル型/VR対応"
                    className="w-full min-w-48 rounded-lg border border-slate-300 bg-white px-2 py-1 text-slate-900"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={rig.isActive}
                    onChange={(e) => updateRigLocal(rig.id, { isActive: e.target.checked })}
                  />
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <button
                    onClick={() => handleRigSave(rig)}
                    className="rounded-lg border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => handleRigDelete(rig.id)}
                    className="ml-2 rounded-lg border border-red-300 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form
        onSubmit={handleAddRig}
        className="mt-3 flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white p-4"
      >
        <div>
          <label className="block text-sm text-slate-600">機体名</label>
          <input
            required
            value={newRigName}
            onChange={(e) => setNewRigName(e.target.value)}
            placeholder="例: 3号機"
            className="mt-1 w-32 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm text-slate-600">スペック（任意）</label>
          <input
            value={newRigSpec}
            onChange={(e) => setNewRigSpec(e.target.value)}
            placeholder="例: Thrustmasterハンドル/3面モニター"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
          />
        </div>
        <button
          type="submit"
          disabled={addingRig}
          className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
        >
          {addingRig ? "追加中..." : "機体を追加"}
        </button>
      </form>

      <h2 className="mt-8 text-lg font-bold">開催設定</h2>
      <form
        onSubmit={handleConfigSubmit}
        className="mt-2 grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3"
      >
        <div>
          <label className="block text-sm text-slate-600">1枠の長さ（分）</label>
          <input
            type="number"
            min={1}
            value={config.slotMinutes}
            onChange={(e) => setConfig({ ...config, slotMinutes: Number(e.target.value) })}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-600">開始時刻</label>
          <input
            type="time"
            value={config.openTime}
            onChange={(e) => setConfig({ ...config, openTime: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-600">終了時刻</label>
          <input
            type="time"
            value={config.closeTime}
            onChange={(e) => setConfig({ ...config, closeTime: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
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
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
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
          「枠を生成」は、まだ枠が存在しない開催日についてのみ時間枠を作成します（機体ごとの定員は上の「機体管理」の稼働中の台数から自動計算されます）。
        </p>
      </form>

      <h2 className="mt-8 text-lg font-bold">時間枠の個別設定</h2>
      <p className="mt-1 text-xs text-slate-500">
        予約が入っている枠は削除できません。開催設定を変えて枠を作り直すときは、その日の枠を削除してから「枠を生成」を押してください。
      </p>
      {slots.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() =>
              deleteSlots(
                [...selectedSlotIds],
                `選択した${selectedSlotIds.size}件の枠を削除しますか？`,
              )
            }
            disabled={selectedSlotIds.size === 0 || deletingSlots}
            className="rounded-lg border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            選択した枠を削除（{selectedSlotIds.size}件）
          </button>
        </div>
      )}
      {Object.keys(slotsByDate).length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">まだ枠がありません。</p>
      ) : (
        Object.entries(slotsByDate).map(([date, dateSlots]) => {
          const deletableIds = dateSlots.filter((s) => s.bookedCount === 0).map((s) => s.id);
          const allSelected =
            deletableIds.length > 0 && deletableIds.every((id) => selectedSlotIds.has(id));
          return (
            <div key={date} className="mt-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-600">{date}</h3>
                <button
                  onClick={() =>
                    deleteSlots(
                      dateSlots.map((s) => s.id),
                      `${date} の枠（${dateSlots.length}件）をすべて削除しますか？`,
                    )
                  }
                  disabled={deletingSlots}
                  className="rounded-lg border border-red-300 px-3 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  この日の枠をすべて削除
                </button>
              </div>
              <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-slate-500">
                    <tr>
                      <th className="px-3 py-2">
                        <input
                          type="checkbox"
                          aria-label={`${date} の枠をすべて選択`}
                          checked={allSelected}
                          disabled={deletableIds.length === 0}
                          onChange={(e) => toggleSlotSelection(deletableIds, e.target.checked)}
                        />
                      </th>
                      <th className="px-3 py-2">時間</th>
                      <th className="px-3 py-2">予約数/稼働機体数</th>
                      <th className="px-3 py-2">受付中</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {dateSlots.map((s) => (
                      <tr key={s.id} className="border-t border-slate-100">
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            aria-label="削除対象に選択"
                            title={
                              s.bookedCount > 0 ? "予約が入っているため削除できません" : undefined
                            }
                            checked={selectedSlotIds.has(s.id)}
                            disabled={s.bookedCount > 0}
                            onChange={(e) => toggleSlotSelection([s.id], e.target.checked)}
                          />
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {formatTimeLabel(s.startTime)}〜{formatTimeLabel(s.endTime)}
                        </td>
                        <td className="px-3 py-2">
                          {s.bookedCount} / {activeRigCount}
                        </td>
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
          );
        })
      )}
    </div>
  );
}
