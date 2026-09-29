import type { Metadata } from "next";
import { Prose } from "@/components/shop/Prose";
import { shipping, site } from "@/lib/config";
import { money } from "@/lib/format";

export const metadata: Metadata = { title: "Verzending & levertijd" };

const COUNTRY: Record<string, string> = { NL: "Nederland", BE: "België", DE: "Duitsland", LU: "Luxemburg", FR: "Frankrijk" };

export default function ShippingPage() {
  return (
    <Prose title="Verzending & levertijd">
      <ul>
        <li>Verzendkosten: <strong>{money(shipping.costCents)}</strong>{shipping.freeFromCents != null && <> — <strong>gratis vanaf {money(shipping.freeFromCents)}</strong></>}.</li>
        <li>We verzenden naar: {shipping.countries.map((c) => COUNTRY[c] ?? c).join(", ")}.</li>
        <li>Levertijd: <strong>{site.deliveryTime}</strong> na je bestelling, tenzij bij het shirt een andere leverdatum staat (bij een pre-order met sluitingsdatum wordt na sluiting geproduceerd).</li>
        <li>Je ontvangt een e-mail met track &amp; trace zodra je pakket onderweg is.</li>
        {shipping.pickupEnabled && <li>{shipping.pickupLabel}: kies dit bij het afrekenen. We mailen je wanneer je bestelling klaarligt.</li>}
      </ul>
      <h2>Meerdere shirts?</h2>
      <p>Alle shirts uit één bestelling worden samen in één pakket verzonden.</p>
      <h2>Vragen over je zending?</h2>
      <p>Mail naar <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a> met je bestelnummer.</p>
    </Prose>
  );
}
