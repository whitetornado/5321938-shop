import "server-only";
import { Resend } from "resend";
import { site } from "./config";
import { dateTimeNL, escapeHtml as e, money, orderNo, vatOf } from "./format";
import type { Order, OrderItem } from "./types";

let _resend: Resend | null = null;
function resend() {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY ontbreekt");
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM = () => process.env.RESEND_FROM || `${site.name} <bestellingen@5321938.nl>`;
const brand = site.brandColor;

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */
function layout(title: string, preheader: string, inner: string) {
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(title)}</title></head>
<body style="margin:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${e(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#0a0a0a;padding:22px 28px"><a href="${site.url}" style="color:#fff;text-decoration:none;font-weight:800;font-size:20px;letter-spacing:.5px">${e(site.name)}</a>
<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${brand};margin-left:6px"></span></td></tr>
<tr><td style="padding:28px">${inner}</td></tr>
<tr><td style="padding:20px 28px;background:#fafafa;color:#71717a;font-size:12px;line-height:18px">
Vragen? Mail naar <a href="mailto:${site.contactEmail}" style="color:#18181b">${site.contactEmail}</a> en vermeld je bestelnummer.<br>
${site.company.name ? `${e(site.company.name)}${site.company.address ? " · " + e(site.company.address) : ""}${site.company.kvk ? " · KvK " + e(site.company.kvk) : ""}${site.company.btw ? " · btw " + e(site.company.btw) : ""}<br>` : ""}
<a href="${site.url}/voorwaarden" style="color:#71717a">Voorwaarden</a> · <a href="${site.url}/retourneren" style="color:#71717a">Retourneren</a> · <a href="${site.url}/privacy" style="color:#71717a">Privacy</a>
</td></tr></table></td></tr></table></body></html>`;
}

function button(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;background:${brand};color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px">${e(label)}</a>`;
}

function itemsTable(order: Order, items: OrderItem[]) {
  const rows = items
    .map(
      (i) => `<tr>
<td style="padding:10px 0;border-bottom:1px solid #f0f0f0;width:56px">${i.image ? `<img src="${e(i.image)}" width="48" height="48" alt="" style="border-radius:8px;object-fit:cover;background:#f4f4f5;display:block">` : ""}</td>
<td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;font-size:14px"><strong>${e(i.product_name)}</strong><br><span style="color:#71717a">Maat ${e(i.size)} · ${i.quantity}×</span></td>
<td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;text-align:right;white-space:nowrap">${money(i.unit_price_cents * i.quantity)}</td></tr>`,
    )
    .join("");
  const line = (label: string, val: string, bold = false) =>
    `<tr><td colspan="2" style="padding:4px 0;font-size:14px;${bold ? "font-weight:800;font-size:16px" : "color:#52525b"}">${label}</td><td style="padding:4px 0;text-align:right;font-size:14px;${bold ? "font-weight:800;font-size:16px" : ""}">${val}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}
<tr><td colspan="3" style="height:10px"></td></tr>
${line("Subtotaal", money(order.subtotal_cents))}
${order.discount_cents ? line("Korting", "− " + money(order.discount_cents)) : ""}
${line(e(order.shipping_label || "Verzending"), order.shipping_cents ? money(order.shipping_cents) : "Gratis")}
${line("Totaal", money(order.total_cents), true)}
<tr><td colspan="3" style="font-size:12px;color:#71717a;text-align:right">waarvan ${money(vatOf(order.total_cents))} btw (21%)</td></tr>
</table>`;
}

function addressBlock(order: Order) {
  const a = order.shipping_address ?? {};
  if (order.shipping_method === "pickup")
    return `<p style="margin:0;font-size:14px"><strong>${e(order.shipping_label || "Afhalen")}</strong><br>We laten je weten wanneer je bestelling klaarligt.</p>`;
  return `<p style="margin:0;font-size:14px;line-height:20px">${e(order.name ?? "")}<br>${e(a.line1 ?? "")}${a.line2 ? "<br>" + e(a.line2) : ""}<br>${e(a.postal_code ?? "")} ${e(a.city ?? "")}<br>${e(a.country ?? "")}</p>`;
}

/* ------------------------------------------------------------------ */
/* Templates                                                           */
/* ------------------------------------------------------------------ */
export function confirmationEmail(order: Order, items: OrderItem[]) {
  const no = orderNo(order.order_number);
  const firstName = (order.name ?? "").split(" ")[0];
  const html = layout(
    `Bestelling ${no} bevestigd`,
    `Bedankt! We gaan aan de slag met bestelling ${no}.`,
    `<h1 style="margin:0 0 8px;font-size:24px">Bedankt${firstName ? ", " + e(firstName) : ""}! 🎉</h1>
<p style="margin:0 0 20px;color:#52525b;font-size:15px;line-height:22px">We hebben je betaling ontvangen. Je bestelling <strong>${no}</strong> is bevestigd. Zodra je pakket onderweg is, ontvang je een e-mail met de track &amp; trace-code.</p>
${itemsTable(order, items)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px"><tr>
<td style="vertical-align:top;padding-right:12px"><p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:.8px;color:#71717a">Bezorging</p>${addressBlock(order)}</td>
<td style="vertical-align:top"><p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:.8px;color:#71717a">Details</p>
<p style="margin:0;font-size:14px;line-height:20px">Bestelnr: ${no}<br>Datum: ${dateTimeNL(order.paid_at ?? order.created_at)}<br>Levertijd: ${e(site.deliveryTime)}</p></td>
</tr></table>
<p style="margin:28px 0 0">${button(site.url, "Terug naar de shop")}</p>`,
  );
  return { subject: `Bevestiging bestelling ${no}`, html };
}

export function adminEmail(order: Order, items: OrderItem[]) {
  const no = orderNo(order.order_number);
  const qty = items.reduce((s, i) => s + i.quantity, 0);
  const html = layout(
    `Nieuwe bestelling ${no}`,
    `${qty} shirt(s) · ${money(order.total_cents)}`,
    `<h1 style="margin:0 0 8px;font-size:22px">Nieuwe bestelling ${no}</h1>
<p style="margin:0 0 20px;color:#52525b;font-size:15px">${e(order.name ?? "")} · <a href="mailto:${e(order.email ?? "")}">${e(order.email ?? "")}</a>${order.phone ? " · " + e(order.phone) : ""}</p>
${itemsTable(order, items)}
<div style="margin-top:20px">${addressBlock(order)}</div>
<p style="margin:24px 0 0">${button(`${site.url}/admin/bestellingen/${order.id}`, "Open in admin")}</p>`,
  );
  return { subject: `🛒 ${no} — ${qty}× · ${money(order.total_cents)} — ${order.name ?? ""}`, html };
}

export function shippedEmail(order: Order) {
  const no = orderNo(order.order_number);
  const html = layout(
    `Je bestelling ${no} is onderweg`,
    `Volg je pakket met track & trace.`,
    `<h1 style="margin:0 0 8px;font-size:24px">Je shirt is onderweg! 📦</h1>
<p style="margin:0 0 20px;color:#52525b;font-size:15px;line-height:22px">Goed nieuws: bestelling <strong>${no}</strong> is verzonden${order.carrier ? ` met <strong>${e(order.carrier.toUpperCase())}</strong>` : ""}.${order.tracking_number ? ` Je track &amp; trace-code is <strong>${e(order.tracking_number)}</strong>.` : ""}</p>
${order.tracking_url ? `<p style="margin:0 0 24px">${button(order.tracking_url, "Volg je pakket")}</p>` : ""}
${addressBlock(order)}`,
  );
  return { subject: `Je bestelling ${no} is onderweg`, html };
}

/* ------------------------------------------------------------------ */
/* Send                                                                */
/* ------------------------------------------------------------------ */
export async function sendMail(opts: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  idempotencyKey?: string;
}) {
  const { error } = await resend().emails.send(
    {
      from: FROM(),
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      replyTo: opts.replyTo ?? site.contactEmail,
    },
    opts.idempotencyKey ? { idempotencyKey: opts.idempotencyKey } : undefined,
  );
  if (error) throw new Error(`Resend: ${error.message}`);
}

export const adminRecipients = () =>
  (process.env.ADMIN_NOTIFY_EMAILS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
