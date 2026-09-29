import type { Metadata } from "next";
import { Prose } from "@/components/shop/Prose";
import { site } from "@/lib/config";
import { CompanyBlock } from "@/lib/company";

export const metadata: Metadata = { title: "Privacyverklaring" };

export default function PrivacyPage() {
  return (
    <Prose title="Privacyverklaring" intro="We verwerken alleen wat nodig is om je bestelling te leveren.">
      <h2>Verwerkingsverantwoordelijke</h2>
      <CompanyBlock />
      <h2>Welke gegevens</h2>
      <ul>
        <li>Naam, e-mailadres, telefoonnummer en bezorgadres</li>
        <li>Bestelgegevens (artikelen, maten, bedragen)</li>
        <li>Betaalstatus (je betaalgegevens zelf worden verwerkt door Stripe; die zien wij niet)</li>
      </ul>
      <h2>Waarvoor</h2>
      <p>Uitsluitend voor het uitvoeren van je bestelling (grondslag: uitvoering overeenkomst), het versturen van order- en verzendmails en het voldoen aan wettelijke (fiscale) bewaarplichten (7 jaar voor administratie).</p>
      <h2>Met wie delen we gegevens</h2>
      <ul>
        <li><strong>Stripe</strong> — betalingen</li>
        <li><strong>Sendcloud</strong> en de vervoerder (bv. PostNL/DHL) — verzending en track &amp; trace</li>
        <li><strong>Resend</strong> — versturen van transactionele e-mails</li>
        <li><strong>Supabase</strong> en <strong>Netlify</strong> — hosting en database</li>
      </ul>
      <p>Met al deze partijen zijn (verwerkers)afspraken gemaakt. We verkopen je gegevens nooit.</p>
      <h2>Cookies</h2>
      <p>Deze website gebruikt geen tracking- of marketingcookies. Je winkelwagen wordt alleen lokaal in je browser bewaard.</p>
      <h2>Jouw rechten</h2>
      <p>Je kunt ons vragen je gegevens in te zien, te corrigeren of te verwijderen (voor zover we ze niet wettelijk moeten bewaren). Mail naar <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>. Je kunt ook een klacht indienen bij de Autoriteit Persoonsgegevens.</p>
    </Prose>
  );
}
