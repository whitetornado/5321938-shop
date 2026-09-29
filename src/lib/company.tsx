import { site } from "./config";

/** Blok met verkopergegevens; toont een waarschuwing als de env nog leeg is. */
export function CompanyBlock() {
  const c = site.company;
  if (!c.name)
    return (
      <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        ⚠️ Vul NEXT_PUBLIC_COMPANY_NAME / ADDRESS / KVK / BTW in (Vercel env) — deze gegevens zijn wettelijk verplicht.
      </p>
    );
  return (
    <p>
      <strong>{c.name}</strong>
      <br />
      {c.address && <>{c.address}<br /></>}
      E-mail: <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>
      <br />
      {c.kvk && <>KvK: {c.kvk}<br /></>}
      {c.btw && <>Btw-id: {c.btw}</>}
    </p>
  );
}
