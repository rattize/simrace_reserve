import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-bold text-slate-900">
          🏎️ シムレース体験
        </Link>
        <nav className="flex items-center gap-4 text-sm text-slate-600">
          <Link href="/book" className="hover:text-slate-900">
            予約する
          </Link>
          <Link href="/reservation" className="hover:text-slate-900">
            予約照会
          </Link>
        </nav>
      </div>
    </header>
  );
}
