import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { site } from "@/lib/config";
import { logout } from "../actions";
import { AdminNav } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link href="/admin" className="flex items-center gap-2 font-bold">
            {site.name} <span className="size-2 rounded-full bg-brand" />
            <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-semibold text-zinc-500">ADMIN</span>
          </Link>
          <AdminNav />
          <div className="ml-auto flex items-center gap-2">
            <Link href="/" target="_blank" className="hidden rounded-full px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 sm:block">Bekijk shop ↗</Link>
            <form action={logout}>
              <button className="rounded-full px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100">Uitloggen</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </>
  );
}
