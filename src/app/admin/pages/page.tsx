"use client";

import { useEffect, useState } from "react";
import Markdown from "@/components/Markdown";

const KEY = "top.visitGuide";

export default function AdminPagesPage() {
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [defaultMarkdown, setDefaultMarkdown] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadContent() {
    const res = await fetch(`/api/admin/page-content/${KEY}`, { cache: "no-store" });
    const data = await res.json();
    setMarkdown(data.markdown as string);
    setDefaultMarkdown(data.defaultMarkdown as string);
  }

  useEffect(() => {
    // 初回マウント時に現在の内容をAPIから取得する
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadContent();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (markdown === null) return;
    setSaving(true);
    setError(null);
    setMessage(null);

    const res = await fetch(`/api/admin/page-content/${KEY}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markdown }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "保存に失敗しました。");
    } else {
      setMarkdown(data.markdown as string);
      setMessage("保存しました。トップページに反映されています。");
    }
    setSaving(false);
  }

  function handleReset() {
    if (!confirm("初期状態の文章に戻しますか？（保存するまで反映されません）")) return;
    setMarkdown(defaultMarkdown);
  }

  if (markdown === null) {
    return <p className="px-4 py-10 text-center text-slate-500">読み込み中...</p>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-xl font-bold">ページ編集</h1>

      {message && <p className="mt-3 text-sm text-emerald-600">{message}</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <h2 className="mt-6 text-lg font-bold">トップページ「ご来場の流れ」</h2>
      <p className="mt-1 text-xs text-slate-500">
        Markdown で書けます（例: <code>**太字**</code>、<code>1. 番号付きリスト</code>、
        <code>- 箇条書き</code>、<code>## 見出し</code>、<code>[リンク](https://...)</code>
        ）。空にして保存すると、トップページのこの枠は表示されなくなります。
      </p>

      <form onSubmit={handleSave} className="mt-2 grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm text-slate-600">Markdown</label>
          <textarea
            rows={14}
            maxLength={5000}
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
            >
              {saving ? "保存中..." : "保存"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-slate-300 px-4 py-2"
            >
              初期状態に戻す
            </button>
          </div>
        </div>
        <div>
          <p className="text-sm text-slate-600">プレビュー</p>
          {markdown.trim() ? (
            <div className="mt-1 rounded-xl border border-slate-200 bg-white p-4 text-left text-sm text-slate-600">
              <Markdown>{markdown}</Markdown>
            </div>
          ) : (
            <p className="mt-1 text-sm text-slate-400">（空のため表示されません）</p>
          )}
        </div>
      </form>
    </div>
  );
}
