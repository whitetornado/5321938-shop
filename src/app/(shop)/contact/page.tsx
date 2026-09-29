import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { Prose } from "@/components/shop/Prose";
import { site } from "@/lib/config";
import { CompanyBlock } from "@/lib/company";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <Prose title="Contact" intro="Vraag over je bestelling, maat of levering? We helpen je graag.">
      <a href={`mailto:${site.contactEmail}`} className="btn-dark !no-underline">
        <Mail className="size-4" /> {site.contactEmail}
      </a>
      <p>Vermeld bij vragen over een bestelling altijd je bestelnummer. We reageren meestal binnen één werkdag.</p>
      <h2>Gegevens</h2>
      <CompanyBlock />
    </Prose>
  );
}
