"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  if (pathname === "/admin/login") return null;

  const linkClass = (href: string) =>
    `rounded-lg px-3 py-1.5 text-sm ${
      pathname === href ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
    }`;

  return (
    <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
      <nav className="flex gap-2">
        <Link href="/admin" className={linkClass("/admin")}>
          予約一覧
        </Link>
        <Link href="/admin/settings" className={linkClass("/admin/settings")}>
          設定
        </Link>
        <Link href="/admin/announcements" className={linkClass("/admin/announcements")}>
          お知らせ
        </Link>
        <Link href="/admin/pages" className={linkClass("/admin/pages")}>
          ページ編集
        </Link>
        <Link href="/display" target="_blank" className={linkClass("/display")}>
          受付案内を開く
        </Link>
      </nav>
      <button onClick={handleLogout} className="text-sm text-slate-500 hover:text-slate-800">
        ログアウト
      </button>
    </div>
  );
}
