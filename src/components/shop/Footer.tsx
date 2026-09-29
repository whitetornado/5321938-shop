import Link from "next/link";
import { site } from "@/lib/config";

export function Footer() {
  const c = site.company;
  return (
    <footer className="mt-24 border-t border-zinc-200 bg-zinc-50">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="font-display text-2xl font-extrabold">{site.name}</span>
            <span className="size-2.5 rounded-full bg-brand" />
          </div>
          <p className="mt-3 max-w-sm text-sm text-zinc-600">{site.tagline}. Beperkte oplage, met liefde gedrukt.</p>
          <div className="mt-5 flex flex-wrap gap-2" aria-label="Betaalmethoden">
            {["iDEAL", "Bancontact", "Visa", "Mastercard", "Apple Pay"].map((m) => (
              <span key={m} className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-600">
                {m}
              </span>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Klantenservice</h3>
          <ul className="mt-3 space-y-2 text-sm text-zinc-600">
            <li><Link href="/maattabel" className="hover:text-ink">Maattabel</Link></li>
            <li><Link href="/verzending" className="hover:text-ink">Verzending &amp; levertijd</Link></li>
            <li><Link href="/retourneren" className="hover:text-ink">Retourneren</Link></li>
            <li><Link href="/contact" className="hover:text-ink">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Juridisch</h3>
          <ul className="mt-3 space-y-2 text-sm text-zinc-600">
            <li><Link href="/voorwaarden" className="hover:text-ink">Algemene voorwaarden</Link></li>
            <li><Link href="/privacy" className="hover:text-ink">Privacyverklaring</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-zinc-200">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-5 text-xs text-zinc-500 sm:flex-row sm:justify-between sm:px-6">
          <span>© {new Date().getFullYear()} {c.name || site.name}. Alle prijzen incl. 21% btw.</span>
          <span>
            {c.kvk && <>KvK {c.kvk}</>} {c.btw && <>· btw {c.btw}</>}
          </span>
        </div>
      </div>
    </footer>
  );
}
