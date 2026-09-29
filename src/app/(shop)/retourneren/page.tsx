import type { Metadata } from "next";
import { Prose } from "@/components/shop/Prose";
import { site } from "@/lib/config";
import { CompanyBlock } from "@/lib/company";

export const metadata: Metadata = { title: "Retourneren & ruilen" };

export default function ReturnsPage() {
  return (
    <Prose title="Retourneren & ruilen" intro="Past je shirt niet? Geen probleem.">
      <h2>14 dagen bedenktijd</h2>
      <p>
        Je hebt het recht om je bestelling binnen 14 dagen na ontvangst zonder opgave van redenen te herroepen. Daarna heb je
        nog 14 dagen om het artikel terug te sturen. Het shirt moet ongedragen, ongewassen en in originele staat zijn.
      </p>
      <h2>Zo werkt het</h2>
      <ol className="ml-5 list-decimal space-y-1">
        <li>Mail binnen 14 dagen naar <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a> met je bestelnummer en of je wilt ruilen of retourneren.</li>
        <li>Je ontvangt van ons het retouradres en instructies.</li>
        <li>Stuur het pakket goed verpakt terug. De retourkosten zijn voor eigen rekening.</li>
        <li>Na ontvangst betalen we binnen 14 dagen het aankoopbedrag (incl. de standaard verzendkosten) terug via dezelfde betaalmethode. Bij ruilen sturen we de nieuwe maat zo snel mogelijk op (zolang de voorraad strekt).</li>
      </ol>
      <h2>Modelformulier voor herroeping</h2>
      <p>
        Je mag het wettelijke modelformulier gebruiken, maar een duidelijke e-mail is ook voldoende: &ldquo;Hierbij deel ik mee
        dat ik mijn overeenkomst betreffende de verkoop van [artikel] herroep. Besteld op [datum] / ontvangen op [datum].
        Naam, adres, datum.&rdquo;
      </p>
      <h2>Verkoper</h2>
      <CompanyBlock />
    </Prose>
  );
}
