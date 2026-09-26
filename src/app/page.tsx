import Link from "next/link";
import Announcements from "@/components/Announcements";
import Markdown from "@/components/Markdown";
import { getPageContent } from "@/lib/pageContent";

// 「ご来場の流れ」は管理画面から編集できるため、リクエストごとにDBから読む
export const dynamic = "force-dynamic";

export default async function Home() {
  const visitGuide = await getPageContent("top.visitGuide");

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-16 text-center">
      <h1 className="text-3xl font-bold">🏎️ シムレース体験</h1>
      <p className="mt-3 text-slate-600">
        学園祭シムレース体験ブースへようこそ。
        <br />
        下のボタンから来場前に時間枠を予約できます。
      </p>

      <Announcements className="mt-6" />

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/book"
          className="rounded-lg bg-slate-900 px-6 py-3 font-medium text-white"
        >
          予約する
        </Link>
        <Link
          href="/reservation"
          className="rounded-lg border border-slate-300 px-6 py-3 font-medium text-slate-700"
        >
          予約を確認・キャンセルする
        </Link>
      </div>

      {visitGuide.trim() && (
        <div className="mt-10 rounded-xl border border-slate-200 bg-white p-4 text-left text-sm text-slate-600">
          <Markdown>{visitGuide}</Markdown>
        </div>
      )}
    </div>
  );
}
