import type { Metadata } from "next";
import { Prose } from "@/components/shop/Prose";
import { site } from "@/lib/config";
import { CompanyBlock } from "@/lib/company";

export const metadata: Metadata = { title: "Algemene voorwaarden" };

export default function TermsPage() {
  return (
    <Prose title="Algemene voorwaarden" intro="Van toepassing op alle bestellingen via deze webshop.">
      <h2>1. Wie zijn wij</h2>
      <CompanyBlock />
      <h2>2. Toepasselijkheid</h2>
      <p>Deze voorwaarden gelden voor elk aanbod van ons en iedere overeenkomst op afstand tussen ons en jou als consument via {site.url.replace(/^https?:\/\//, "")}.</p>
      <h2>3. Aanbod en prijzen</h2>
      <p>Alle prijzen zijn in euro&apos;s en inclusief 21% btw. Verzendkosten worden vóór het afronden van je bestelling getoond. Kennelijke vergissingen of fouten in het aanbod binden ons niet. Het aanbod geldt zolang de voorraad strekt en/of tot de aangegeven sluitingsdatum.</p>
      <h2>4. Overeenkomst</h2>
      <p>De overeenkomst komt tot stand op het moment dat je bestelling is betaald en je een bevestiging per e-mail hebt ontvangen. Kunnen we een bestelling onverhoopt niet leveren, dan laten we dat zo snel mogelijk weten en betalen we het volledige bedrag binnen 14 dagen terug.</p>
      <h2>5. Betaling</h2>
      <p>Betaling vindt vooraf plaats via onze betaalprovider Stripe (o.a. iDEAL, Bancontact, creditcard, Apple Pay en Google Pay).</p>
      <h2>6. Levering</h2>
      <p>We leveren binnen de op de website vermelde levertijd, uiterlijk binnen 30 dagen. Het risico van beschadiging of vermissing gaat op jou over op het moment van bezorging.</p>
      <h2>7. Herroepingsrecht</h2>
      <p>Je hebt 14 dagen bedenktijd na ontvangst. Zie <a href="/retourneren">Retourneren &amp; ruilen</a> voor de werkwijze. De directe kosten van terugzending zijn voor jouw rekening.</p>
      <h2>8. Conformiteit en garantie</h2>
      <p>Wij staan ervoor in dat de producten voldoen aan de overeenkomst en de redelijke eisen van deugdelijkheid. Je wettelijke rechten blijven altijd van kracht. Kleine kleurafwijkingen ten opzichte van de afbeeldingen zijn mogelijk.</p>
      <h2>9. Klachten</h2>
      <p>Klachten kun je binnen bekwame tijd na ontdekking melden via <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>. We reageren binnen 14 dagen. Komen we er samen niet uit, dan kun je gebruikmaken van het Europese ODR-platform: <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">ec.europa.eu/consumers/odr</a>.</p>
      <h2>10. Toepasselijk recht</h2>
      <p>Op deze voorwaarden en overeenkomsten is Nederlands recht van toepassing.</p>
      <p className="text-sm text-zinc-500">Laatst bijgewerkt: {new Date().getFullYear()}</p>
    </Prose>
  );
}
