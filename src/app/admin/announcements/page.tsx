"use client";

import { useEffect, useState } from "react";

type Announcement = {
  id: string;
  body: string;
  level: string;
  isPublished: boolean;
};

const LEVEL_OPTIONS = [
  { value: "info", label: "通常" },
  { value: "important", label: "重要" },
];

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[] | null>(null);
  const [newBody, setNewBody] = useState("");
  const [newLevel, setNewLevel] = useState("info");
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadAnnouncements() {
    const res = await fetch("/api/admin/announcements", { cache: "no-store" });
    const data = await res.json();
    setAnnouncements(data.announcements as Announcement[]);
  }

  useEffect(() => {
    // 初回マウント時にお知らせ一覧をAPIから取得する
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAnnouncements();
  }, []);

  function updateLocal(id: string, patch: Partial<Announcement>) {
    setAnnouncements((prev) => prev?.map((a) => (a.id === id ? { ...a, ...patch } : a)) ?? null);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newBody.trim()) return;
    setAdding(true);
    setError(null);
    setMessage(null);

    const res = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: newBody, level: newLevel }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "お知らせの追加に失敗しました。");
    } else {
      setNewBody("");
      setNewLevel("info");
      setMessage("お知らせを追加しました。");
      await loadAnnouncements();
    }
    setAdding(false);
  }

  async function handleSave(announcement: Announcement) {
    setError(null);
    setMessage(null);
    const res = await fetch(`/api/admin/announcements/${announcement.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body: announcement.body,
        level: announcement.level,
        isPublished: announcement.isPublished,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "お知らせの更新に失敗しました。");
      await loadAnnouncements();
      return;
    }
    setMessage("お知らせを更新しました。");
    await loadAnnouncements();
  }

  async function handleDelete(id: string) {
    if (!confirm("このお知らせを削除しますか？")) return;
    setError(null);
    setMessage(null);
    const res = await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "お知らせの削除に失敗しました。");
      return;
    }
    setMessage("お知らせを削除しました。");
    await loadAnnouncements();
  }

  if (!announcements) {
    return <p className="px-4 py-10 text-center text-slate-500">読み込み中...</p>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-xl font-bold">お知らせ</h1>
      <p className="mt-1 text-xs text-slate-500">
        「表示中」のお知らせは、トップページ・予約確認ページ・受付案内画面に表示されます。「重要」は赤色で目立つように表示され、通常のお知らせより上に並びます。
      </p>

      {message && <p className="mt-3 text-sm text-emerald-600">{message}</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <form
        onSubmit={handleAdd}
        className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4"
      >
        <div>
          <label className="block text-sm text-slate-600">本文</label>
          <textarea
            required
            rows={3}
            maxLength={500}
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            placeholder="例: 機材調整のため、12:00〜12:30は体験を一時休止します。"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
          />
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="block text-sm text-slate-600">重要度</label>
            <select
              value={newLevel}
              onChange={(e) => setNewLevel(e.target.value)}
              className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
            >
              {LEVEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={adding}
            className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
          >
            {adding ? "追加中..." : "お知らせを追加"}
          </button>
        </div>
      </form>

      <h2 className="mt-8 text-lg font-bold">お知らせ一覧</h2>
      {announcements.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">まだお知らせがありません。</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-3">
          {announcements.map((a) => (
            <li
              key={a.id}
              className={`rounded-xl border bg-white p-4 ${
                a.level === "important" ? "border-red-300" : "border-slate-200"
              }`}
            >
              <textarea
                rows={3}
                maxLength={500}
                value={a.body}
                onChange={(e) => updateLocal(a.id, { body: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              />
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                <select
                  value={a.level}
                  onChange={(e) => updateLocal(a.id, { level: e.target.value })}
                  className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-slate-900"
                >
                  {LEVEL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-1 text-slate-600">
                  <input
                    type="checkbox"
                    checked={a.isPublished}
                    onChange={(e) => updateLocal(a.id, { isPublished: e.target.checked })}
                  />
                  表示中
                </label>
                <div className="ml-auto whitespace-nowrap">
                  <button
                    onClick={() => handleSave(a)}
                    className="rounded-lg border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="ml-2 rounded-lg border border-red-300 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                  >
                    削除
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
