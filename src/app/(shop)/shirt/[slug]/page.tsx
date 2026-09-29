import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Package, RotateCcw, Truck } from "lucide-react";
import { getProductBySlug, getSettings, isAvailable, isSoldOut } from "@/lib/products";
import { DEFAULT_SIZE_CHART, shipping, site } from "@/lib/config";
import { dateNL, money } from "@/lib/format";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { BuyBox } from "@/components/shop/BuyBox";
import { ShareButtons } from "@/components/shop/ShareButtons";
import { Countdown } from "@/components/shop/Countdown";
import { HowToMeasure, SizeChartTable } from "@/components/shop/SizeChartTable";

export const revalidate = 60;

// On-demand ISR: pagina's worden bij eerste bezoek gegenereerd en daarna gecachet
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Shirt niet gevonden" };
  const description =
    (p.subtitle ? `${p.subtitle}. ` : "") +
    `${money(p.price_cents)} · Bestel in jouw maat, veilig betalen met iDEAL en snel in huis.`;
  return {
    title: p.name,
    description,
    alternates: { canonical: `/shirt/${p.slug}` },
    openGraph: { title: `${p.name} — ${money(p.price_cents)}`, description, url: `/shirt/${p.slug}`, type: "website" },
    twitter: { card: "summary_large_image", title: p.name, description },
    other: {
      "product:price:amount": (p.price_cents / 100).toFixed(2),
      "product:price:currency": "EUR",
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getProductBySlug(slug), getSettings()]);
  if (!product) notFound();

  const images = [
    product.image_front && { src: product.image_front, label: "Voor" },
    product.image_back && { src: product.image_back, label: "Achter" },
    ...product.extra_images.map((src, i) => ({ src, label: `Detail ${i + 1}` })),
  ].filter(Boolean) as { src: string; label: string }[];

  const soldOut = isSoldOut(product);
  const available = isAvailable(product);
  const disabledReason = !settings.shop_open
    ? settings.closed_message || "De verkoop is gesloten"
    : !available
      ? "De bestelperiode voor dit shirt is voorbij"
      : soldOut
        ? "Uitverkocht"
        : null;

  const url = `${site.url}/shirt/${product.slug}`;
  const chart = product.size_chart ?? DEFAULT_SIZE_CHART;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? product.subtitle ?? undefined,
    image: images.map((i) => i.src),
    sku: product.id,
    brand: { "@type": "Brand", name: site.name },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "EUR",
      price: (product.price_cents / 100).toFixed(2),
      availability: disabledReason ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      ...(product.available_until ? { priceValidUntil: product.available_until.slice(0, 10) } : {}),
      itemCondition: "https://schema.org/NewCondition",
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: { "@type": "MonetaryAmount", value: (shipping.costCents / 100).toFixed(2), currency: "EUR" },
        shippingDestination: shipping.countries.map((c) => ({ "@type": "DefinedRegion", addressCountry: c })),
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: shipping.countries[0] ?? "NL",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 14,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
      },
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 md:pb-10">
        <nav aria-label="Kruimelpad" className="mb-5 flex items-center gap-1 text-sm text-zinc-500">
          <Link href="/" className="hover:text-ink">Home</Link>
          <ChevronRight className="size-3.5" />
          <span className="truncate text-ink">{product.name}</span>
        </nav>

        <div className="grid gap-8 md:grid-cols-[1.15fr_1fr] md:gap-12">
          <ProductGallery images={images} name={product.name} />

          <div>
            {product.available_until && available && (
              <p className="mb-3 inline-flex rounded-full bg-brand/10 px-3 py-1.5 text-sm font-medium text-brand">
                <Countdown until={product.available_until} prefix="Bestellen kan nog" />
              </p>
            )}
            <h1 className="font-display text-4xl font-extrabold uppercase leading-none sm:text-5xl">{product.name}</h1>
            {product.subtitle && <p className="mt-2 text-lg text-zinc-600">{product.subtitle}</p>}
            <p className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums">{money(product.price_cents)}</span>
              {product.compare_at_cents && product.compare_at_cents > product.price_cents && (
                <span className="text-lg text-zinc-400 line-through">{money(product.compare_at_cents)}</span>
              )}
              <span className="text-sm text-zinc-500">incl. btw</span>
            </p>

            <div className="mt-6">
              <BuyBox
                product={{
                  id: product.id,
                  slug: product.slug,
                  name: product.name,
                  price_cents: product.price_cents,
                  image: product.image_front,
                }}
                variants={product.product_variants}
                disabledReason={disabledReason}
              />
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs text-zinc-600">
              <div className="rounded-xl bg-zinc-50 p-3"><Truck className="mx-auto mb-1 size-5 text-ink" />{shipping.freeFromCents != null ? `Gratis vanaf ${money(shipping.freeFromCents)}` : `Verzending ${money(shipping.costCents)}`}</div>
              <div className="rounded-xl bg-zinc-50 p-3"><Package className="mx-auto mb-1 size-5 text-ink" />{product.delivery_note || `In huis in ${site.deliveryTime}`}</div>
              <div className="rounded-xl bg-zinc-50 p-3"><RotateCcw className="mx-auto mb-1 size-5 text-ink" />14 dagen retour</div>
            </div>

            <div className="mt-8 divide-y divide-zinc-200 border-y border-zinc-200">
              {product.description && (
                <Section title="Over dit shirt" open>
                  <p className="whitespace-pre-line">{product.description}</p>
                </Section>
              )}
              {(product.material || product.care) && (
                <Section title="Materiaal & onderhoud">
                  {product.material && <p className="whitespace-pre-line">{product.material}</p>}
                  {product.care && <p className="mt-3 whitespace-pre-line text-zinc-500">{product.care}</p>}
                </Section>
              )}
              <Section title="Pasvorm & maattabel" id="maattabel" open>
                {product.fit && <p className="mb-4 whitespace-pre-line">{product.fit}</p>}
                <SizeChartTable chart={chart} />
                <div className="mt-5"><HowToMeasure /></div>
              </Section>
              <Section title="Verzending & retour">
                <p>
                  Verzending {money(shipping.costCents)}
                  {shipping.freeFromCents != null && ` (gratis vanaf ${money(shipping.freeFromCents)})`}. Levertijd {site.deliveryTime}
                  {product.available_until && ` — bestellingen worden verwerkt na sluiting op ${dateNL(product.available_until)}`}. Je
                  ontvangt een track &amp; trace-code per e-mail.
                </p>
                <p className="mt-2">
                  Niet goed? Ruilen of retourneren kan binnen 14 dagen. <Link href="/retourneren" className="underline">Meer info</Link>
                </p>
              </Section>
            </div>

            <div className="mt-6">
              <ShareButtons url={url} title={product.name} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Section({ title, children, open, id }: { title: string; children: React.ReactNode; open?: boolean; id?: string }) {
  return (
    <details id={id} open={open} className="group scroll-mt-24 py-1">
      <summary className="flex cursor-pointer items-center justify-between py-4 font-semibold">
        {title}
        <span className="text-xl leading-none text-zinc-400 transition group-open:rotate-45">+</span>
      </summary>
      <div className="pb-5 text-[15px] leading-relaxed text-zinc-700">{children}</div>
    </details>
  );
}
