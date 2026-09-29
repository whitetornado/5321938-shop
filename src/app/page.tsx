import Link from "next/link";
import { ArrowRight, CreditCard, PackageCheck, Ruler, ShieldCheck, Shirt, Truck } from "lucide-react";
import { getActiveProducts, getSettings, isAvailable, isSoldOut } from "@/lib/products";
import { site, shipping } from "@/lib/config";
import { money } from "@/lib/format";
import { faqItems } from "@/lib/faq";
import { ProductCard } from "@/components/shop/ProductCard";
import { FlipImage } from "@/components/shop/FlipImage";
import { Countdown } from "@/components/shop/Countdown";
import { Faq } from "@/components/shop/Faq";
import Image from "next/image";
import { ShopShell } from "@/components/shop/ShopShell";

export const revalidate = 60;

export default async function Home() {
  const [products, settings] = await Promise.all([getActiveProducts(), getSettings()]);
  const hero = products.find((p) => p.featured) ?? products[0];
  const single = products.length === 1;
  const heroHref = hero ? (single ? `/shirt/${hero.slug}` : "#shirts") : "#";

  return (
    <ShopShell>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-40 -top-40 size-[520px] rounded-full bg-brand/10 blur-3xl" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 sm:px-6 md:grid-cols-2 md:pt-16">
          <div className="order-2 md:order-1">
            <p className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-700">
              <span className="size-1.5 animate-pulse rounded-full bg-brand" />
              {hero?.available_until ? <Countdown until={hero.available_until} prefix="Nog" /> : "Beperkte oplage"}
            </p>
            <h1 className="font-display mt-5 text-5xl font-extrabold uppercase leading-[0.95] sm:text-6xl lg:text-7xl">
              {settings.hero_title || site.tagline}
            </h1>
            <p className="mt-5 max-w-md text-lg text-zinc-600">
              {settings.hero_subtitle || "Laat zien bij wie je hoort. Bestel in jouw maat — op = op."}
            </p>

            {!settings.shop_open ? (
              <div className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 font-medium">
                {settings.closed_message || "De verkoop is gesloten."}
              </div>
            ) : hero ? (
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href={heroHref} className="btn-primary px-8">
                  Bestel jouw shirt <ArrowRight className="size-4" />
                </Link>
                <Link href="/maattabel" className="btn-ghost">
                  <Ruler className="size-4" /> Maattabel
                </Link>
                {single && (
                  <span className="ml-1 text-2xl font-bold tabular-nums">{money(hero.price_cents)}</span>
                )}
              </div>
            ) : (
              <div className="mt-8 rounded-2xl border border-dashed border-zinc-300 p-5 text-zinc-600">
                Binnenkort verkrijgbaar. Houd deze pagina in de gaten!
              </div>
            )}

            <ul className="mt-10 grid grid-cols-3 gap-3 text-xs text-zinc-600 sm:text-sm">
              <li className="flex flex-col gap-1.5"><ShieldCheck className="size-5 text-ink" /> Veilig betalen met iDEAL</li>
              <li className="flex flex-col gap-1.5"><Truck className="size-5 text-ink" /> Track &amp; trace</li>
              <li className="flex flex-col gap-1.5"><PackageCheck className="size-5 text-ink" /> In huis in {site.deliveryTime}</li>
            </ul>
          </div>

          <div className="order-1 md:order-2">
            {hero ? (
              <Link href={`/shirt/${hero.slug}`} aria-label={hero.name} className="block">
                <FlipImage
                  front={hero.image_front}
                  back={hero.image_back}
                  alt={hero.name}
                  priority
                  sizes="(min-width: 768px) 50vw, 100vw"
                />
              </Link>
            ) : (
              <div className="flex aspect-square items-center justify-center rounded-3xl bg-zinc-100">
                <Shirt className="size-24 text-zinc-300" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* VOOR & ACHTER (1 shirt) of GRID (meerdere) */}
      {hero && single && hero.image_back && (
        <section id="shirts" className="scroll-mt-20 bg-ink py-16 text-white sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-brand">Het shirt</p>
                <h2 className="font-display mt-2 text-4xl font-extrabold uppercase sm:text-5xl">{hero.name}</h2>
              </div>
              <Link href={`/shirt/${hero.slug}`} className="btn-primary">
                Kies je maat <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {[
                { src: hero.image_front, label: "Voorkant" },
                { src: hero.image_back, label: "Achterkant" },
              ].map((img) =>
                img.src ? (
                  <figure key={img.label} className="relative aspect-square overflow-hidden rounded-3xl bg-zinc-100">
                    <Image src={img.src} alt={`${hero.name} — ${img.label}`} fill sizes="(min-width:640px) 50vw, 100vw" className="object-contain p-6" />
                    <figcaption className="absolute left-4 top-4 rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white">
                      {img.label}
                    </figcaption>
                  </figure>
                ) : null,
              )}
            </div>
          </div>
        </section>
      )}

      {products.length > 1 && (
        <section id="shirts" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-4xl font-extrabold uppercase">De shirts</h2>
            <p className="text-sm text-zinc-500">{products.length} ontwerpen</p>
          </div>
          <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 3} />
            ))}
          </div>
        </section>
      )}

      {/* HOE WERKT HET */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="font-display text-center text-4xl font-extrabold uppercase">Zo simpel is het</h2>
        <ol className="mt-10 grid gap-5 sm:grid-cols-3">
          {[
            { icon: Ruler, t: "Kies je maat(en)", d: "Eén shirt of voor het hele gezin — kies per maat het aantal." },
            { icon: CreditCard, t: "Betaal veilig", d: "Met iDEAL, Bancontact, creditcard of Apple Pay via Stripe." },
            {
              icon: Truck,
              t: "Snel in huis",
              d: `Binnen ${site.deliveryTime}, met track & trace${shipping.freeFromCents != null ? ` — gratis vanaf ${money(shipping.freeFromCents)}` : ""}.`,
            },
          ].map((s, i) => (
            <li key={s.t} className="card relative p-6">
              <span className="font-display absolute right-5 top-3 text-6xl font-extrabold text-zinc-100">{i + 1}</span>
              <s.icon className="relative size-7 text-brand" />
              <h3 className="relative mt-4 text-lg font-bold">{s.t}</h3>
              <p className="relative mt-1 text-zinc-600">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* KWALITEIT */}
      {hero && (hero.material || hero.fit) && (
        <section className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 rounded-3xl bg-zinc-50 p-8 sm:p-12 md:grid-cols-3">
            <div>
              <h2 className="font-display text-3xl font-extrabold uppercase">Kwaliteit die je voelt</h2>
              <p className="mt-2 text-zinc-600">Gemaakt om te dragen — op de tribune én daarna.</p>
            </div>
            {hero.material && (
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Materiaal</h3>
                <p className="mt-2 whitespace-pre-line">{hero.material}</p>
              </div>
            )}
            {hero.fit && (
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Pasvorm</h3>
                <p className="mt-2 whitespace-pre-line">{hero.fit}</p>
                <Link href="/maattabel" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold underline">
                  Bekijk maattabel <ArrowRight className="size-3.5" />
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="font-display text-center text-4xl font-extrabold uppercase">Veelgestelde vragen</h2>
        <div className="mt-8">
          <Faq items={faqItems()} />
        </div>
      </section>

      {/* CTA */}
      {hero && settings.shop_open && isAvailable(hero) && !isSoldOut(hero) && (
        <section className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-brand px-8 py-12 text-white sm:px-14">
            <div className="pointer-events-none absolute -bottom-24 -right-10 size-80 rounded-full bg-white/10" />
            <h2 className="font-display relative text-4xl font-extrabold uppercase sm:text-5xl">Op = op</h2>
            <p className="relative mt-2 max-w-md text-white/85">Dit shirt wordt in beperkte oplage gemaakt. Zorg dat je erbij bent.</p>
            <Link href={heroHref} className="btn relative mt-6 bg-white text-ink hover:bg-zinc-100">
              Bestel nu <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      )}
    </ShopShell>
  );
}
