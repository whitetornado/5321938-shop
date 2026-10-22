import { supabaseAdmin } from "@/lib/supabase";
import { accessRequired } from "@/lib/access-session";
import { site } from "@/lib/config";
import type { AccessCode } from "@/lib/access";
import { AccessCodesManager } from "@/components/admin/AccessCodesManager";

export default async function AccessCodesPage() {
  const { data, error } = await supabaseAdmin().from("access_codes").select("*").order("created_at", { ascending: false });
  const codes = (data ?? []) as AccessCode[];
  const required = accessRequired();

  return (
    <div>
      <h1 className="text-2xl font-bold">Toegangscodes</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Alleen wie een geldige code invult, kan de shop zien en bestellen. Geef iedereen een eigen code — dan zie je bij elke bestelling wie het was
        en kun je één code blokkeren zonder de rest te raken.
      </p>

      <div className={`mt-4 rounded-2xl border p-4 text-sm ${required ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-300 bg-amber-50 text-amber-900"}`}>
        {required ? (
          <>🔒 <strong>Toegangscode staat AAN.</strong> De shop is alleen bereikbaar via {site.url.replace(/^https?:\/\//, "")}/toegang met een code.</>
        ) : (
          <>⚠️ <strong>Toegangscode staat UIT</strong> — de shop is voor iedereen open. Zet in Netlify <code>ACCESS_CODE_REQUIRED=true</code> en deploy opnieuw.</>
        )}
      </div>

      {error ? (
        <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          Tabel <code>access_codes</code> niet gevonden. Draai eerst <code>supabase/migrations/0002_access_codes.sql</code> in Supabase.
        </p>
      ) : (
        <AccessCodesManager codes={codes} siteUrl={site.url} />
      )}
    </div>
  );
}
