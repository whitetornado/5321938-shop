import { supabaseAdmin } from "@/lib/supabase";
import type { Settings } from "@/lib/types";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { hasSendcloud } from "@/lib/sendcloud";
import { site } from "@/lib/config";

export default async function SettingsPage() {
  const { data } = await supabaseAdmin().from("settings").select("*").eq("id", 1).single();
  const checks = [
    ["Supabase", Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)],
    ["Stripe", Boolean(process.env.STRIPE_SECRET_KEY)],
    ["Stripe webhook", Boolean(process.env.STRIPE_WEBHOOK_SECRET)],
    ["Resend", Boolean(process.env.RESEND_API_KEY)],
    ["Admin-meldingen", Boolean(process.env.ADMIN_NOTIFY_EMAILS)],
    ["Sendcloud", hasSendcloud()],
    ["Bedrijfsgegevens", Boolean(site.company.name && site.company.kvk)],
  ] as const;
  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Instellingen</h1>
      <SettingsForm settings={data as Settings} />
      <section className="card mt-6 p-5">
        <h2 className="font-semibold">Koppelingen</h2>
        <ul className="mt-3 grid grid-cols-2 gap-2 text-sm">
          {checks.map(([k, ok]) => (
            <li key={k} className="flex items-center gap-2">
              <span className={`size-2 rounded-full ${ok ? "bg-emerald-500" : "bg-red-500"}`} /> {k}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
