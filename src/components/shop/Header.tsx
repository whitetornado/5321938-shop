import Link from "next/link";
import { site } from "@/lib/config";
import { CartButton } from "./CartButton";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2" aria-label={`${site.name} home`}>
          <span className="font-display text-2xl font-extrabold tracking-tight">{site.name}</span>
          <span className="size-2.5 rounded-full bg-brand transition group-hover:scale-125" />
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/#shirts"
            className="hidden rounded-full px-4 py-2 text-sm font-medium text-zinc-600 hover:text-ink sm:block"
          >
            Shirts
          </Link>
          <Link
            href="/maattabel"
            className="hidden rounded-full px-4 py-2 text-sm font-medium text-zinc-600 hover:text-ink sm:block"
          >
            Maattabel
          </Link>
          <Link
            href="/#faq"
            className="hidden rounded-full px-4 py-2 text-sm font-medium text-zinc-600 hover:text-ink sm:block"
          >
            Vragen
          </Link>
          <CartButton />
        </nav>
      </div>
    </header>
  );
}
