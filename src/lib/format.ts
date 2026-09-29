import { site, VAT_RATE } from "./config";

const eur = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });
export const money = (cents: number) => eur.format((cents || 0) / 100);

/** BTW-deel van een bedrag inclusief btw. */
export const vatOf = (inclCents: number) => Math.round(inclCents - inclCents / (1 + VAT_RATE));

export const orderNo = (n: number | string) => `${site.orderPrefix}${n}`;

export const dateTimeNL = (iso: string | null | undefined) =>
  iso
    ? new Intl.DateTimeFormat("nl-NL", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Europe/Amsterdam",
      }).format(new Date(iso))
    : "—";

export const dateNL = (iso: string | null | undefined) =>
  iso
    ? new Intl.DateTimeFormat("nl-NL", { dateStyle: "long", timeZone: "Europe/Amsterdam" }).format(
        new Date(iso),
      )
    : "";

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

export const escapeHtml = (s: string) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
