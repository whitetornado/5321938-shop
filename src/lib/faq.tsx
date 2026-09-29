import Link from "next/link";
import { shipping, site } from "./config";
import { money } from "./format";
import type { FaqItem } from "@/components/shop/Faq";

export function faqItems(): FaqItem[] {
  return [
    {
      q: "Welke maat moet ik kiezen?",
      a: (
        <>
          Het shirt valt normaal. Twijfel je? Leg een shirt dat goed zit plat neer en meet van oksel tot oksel —
          vergelijk dat met de <Link href="/maattabel" className="underline">maattabel</Link>. Zit je precies tussen
          twee maten, kies dan de grotere.
        </>
      ),
    },
    {
      q: "Kan ik meerdere shirts in verschillende maten bestellen?",
      a: "Ja! Kies op de productpagina ‘Meerdere maten’ en vul per maat het aantal in. Alles komt in één bestelling en één pakket.",
    },
    {
      q: "Wat kost verzending en hoe snel heb ik het?",
      a: (
        <>
          Verzending kost {money(shipping.costCents)}
          {shipping.freeFromCents != null && <> — gratis vanaf {money(shipping.freeFromCents)}</>}. Levertijd:{" "}
          {site.deliveryTime}. Je ontvangt een track &amp; trace-code per e-mail zodra je pakket onderweg is.
        </>
      ),
    },
    {
      q: "Hoe kan ik betalen?",
      a: "Veilig via Stripe met iDEAL, Bancontact, creditcard, Apple Pay of Google Pay. Je betaalgegevens komen nooit bij ons terecht.",
    },
    {
      q: "Past het niet? Kan ik ruilen of retourneren?",
      a: (
        <>
          Ja, binnen 14 dagen na ontvangst, ongedragen en ongewassen. Lees hoe het werkt op de{" "}
          <Link href="/retourneren" className="underline">retourpagina</Link>.
        </>
      ),
    },
    {
      q: "Ik heb nog een andere vraag",
      a: (
        <>
          Mail ons via <a className="underline" href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a> — we
          reageren meestal binnen één werkdag.
        </>
      ),
    },
  ];
}
