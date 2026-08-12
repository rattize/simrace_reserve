import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-16 text-center">
      <h1 className="text-3xl font-bold">🏎️ シムレース体験</h1>
      <p className="mt-3 text-slate-600">
        学園祭シムレース体験ブースへようこそ。
        <br />
        下のボタンから来場前に時間枠を予約できます。
      </p>

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

      <div className="mt-10 rounded-xl border border-slate-200 bg-white p-4 text-left text-sm text-slate-600">
        <p className="font-medium text-slate-800">ご来場の流れ</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>お好きな時間枠を予約すると、6桁の予約コードが発行されます。</li>
          <li>当日は開始時刻までに受付までお越しください。</li>
          <li>受付で予約コードまたはお名前をお伝えください。</li>
        </ol>
      </div>
    </div>
  );
}
