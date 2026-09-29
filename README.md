# 5321938.nl — supporters shirt shop

Tijdelijke webshop voor supportersshirts. Stack: **Next.js 16 (App Router) · Supabase · Stripe Checkout · Resend · Sendcloud · Vercel**.

## Wat zit erin

**Shop**
- Homepage: hero met het uitgelichte shirt (hover/toggle voor ↔ achter), aftelklok bij een sluitingsdatum, "voor & achter"-showcase (bij 1 shirt) of een grid (bij meerdere), "zo werkt het", kwaliteit, FAQ en een afsluitende CTA
- Productpagina: galerij (voor/achter/detail, swipe, fullscreen zoom), **"Eén maat" of "Meerdere maten"** (per maat een aantal kiezen), voorraadlabels ("nog 3"), maattabel met meetuitleg, materiaal en onderhoud, verzending en retour, sticky koopknop op mobiel, deelknoppen (WhatsApp, Facebook, X, link kopiëren, native share)
- Winkelwagen als slide-over met balk "nog € X tot gratis verzending" en verwijderen met "ongedaan maken"
- Toast-meldingen (sonner) bij toevoegen, fouten, gewijzigde voorraad, geannuleerde betaling, gekopieerde link enzovoort
- Stripe Checkout (iDEAL, Bancontact, kaart, Apple Pay, Google Pay en kortingscodes), prijzen komen altijd uit de database
- Bedankpagina met bestelnummer; de winkelwagen wordt daar geleegd
- OG-afbeeldingen per shirt (voor- en achterkant, prijs, "Bestel nu"), JSON-LD Product, sitemap, robots
- Pagina's voor voorwaarden, privacy, retourneren, verzending, contact en maattabel
- Zelf-gehoste fonts, geen tracking-cookies, dus geen cookiebanner nodig

**Na betaling (Stripe-webhook)**
1. De order gaat van `pending` naar `paid`. Dit is idempotent, ook als de webhook en de bedankpagina tegelijk binnenkomen.
2. De voorraad wordt verlaagd (atomisch in Postgres).
3. De klant krijgt een orderbevestiging en de admin een melding (Resend, met idempotency keys).
4. De zending wordt automatisch aangemaakt in Sendcloud. Het label maak je in Sendcloud.
5. De Sendcloud-webhook zet de status op "verzonden" en stuurt de klant automatisch een mail met track & trace.

**Admin (`/admin`)**
- Inloggen met een wachtwoord (ondertekende cookie, 7 dagen geldig)
- **Shirts**: toevoegen, bewerken, dupliceren en met één schakelaar online of offline zetten. Foto's uploaden gaat met slepen en neerzetten; ze worden automatisch verkleind. Maten kies je via presets (volwassenen of kids), voorraad per maat is optioneel (leeg = onbeperkt). Verder een maattabel-editor, een sluitingsdatum (aftelklok, daarna niet meer te bestellen), een levertekst en een uitgelicht-optie.
- **Bestellingen**: filters (te verzenden, verzonden, alle, onbetaald), zoeken, detailpagina, status wijzigen, Sendcloud-knop, handmatig track & trace invullen, verzendmail of bevestiging opnieuw sturen, CSV-export
- **Overzicht**: omzet, aantallen en een **productie-overzicht per maat** (handig voor het drukken)
- **Instellingen**: shop open of dicht, aankondigingsbalk, hero-teksten, status van de koppelingen

---

## Installatie (±20 min)

### 1. Lokaal / Cursor
```cmd
npm install
copy .env.example .env.local
npm run dev
```

### 2. Supabase
1. Maak een nieuw project (regio EU, Frankfurt).
2. Ga naar **SQL Editor**, plak `supabase/migrations/0001_init.sql` en klik **Run**. Dit maakt de tabellen, RLS, de functies, de settings-rij en de storage-bucket `product-images` aan.
3. Kopieer onder Project Settings → API de URL, de anon key en de service_role key naar je env.

### 3. Stripe
1. Zet onder Settings → Payment methods **iDEAL, Bancontact, Apple Pay en Google Pay** aan.
2. Maak onder Developers → Webhooks een endpoint aan: `https://5321938.nl/api/stripe/webhook` met deze events:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `checkout.session.expired`
   - `charge.refunded`
3. Kopieer de signing secret naar `STRIPE_WEBHOOK_SECRET`.
4. Kortingscodes (optioneel) maak je aan onder Products → Coupons → Promotion codes.
5. Lokaal testen: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

### 4. Resend
Voeg het domein `5321938.nl` toe en zet de DNS-records (SPF/DKIM) bij je registrar. Gebruik als afzender `RESEND_FROM=5321938 <bestellingen@5321938.nl>`.

### 5. Sendcloud (zelfde aanpak als bij toet.store)
1. Maak onder Instellingen → Integraties een **Sendcloud API**-integratie aan en kopieer de public en secret key.
2. Zet in die integratie de **Webhook feedback** aan, met URL `https://5321938.nl/api/sendcloud/webhook`.
3. Na betaling verschijnt de order onder "Te verwerken". Maak daar het label aan; de klant krijgt dan automatisch de track & trace-mail.

### 6. Vercel + domein
1. Push naar GitHub en importeer de repo in Vercel.
2. Zet **alle** variabelen uit `.env.example` onder Settings → Environment Variables. Zet `NEXT_PUBLIC_SITE_URL=https://5321938.nl`.
3. Voeg onder Domains `5321938.nl` en `www.5321938.nl` toe (www stuurt door naar de hoofddomeinnaam) en zet de DNS-records die Vercel aangeeft.
4. Deploy en ga naar `/admin`. Voeg een shirt toe, zet het online en klaar.

`ADMIN_SESSION_SECRET` genereer je bijvoorbeeld met `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`.

---

## Checklist vóór livegang
- [ ] Bedrijfsgegevens ingevuld (`NEXT_PUBLIC_COMPANY_*`): verplicht voor voorwaarden en privacy
- [ ] Voorwaarden, privacy en retour doorgelezen en eventueel aangepast (`src/app/(shop)/…`)
- [ ] Testbestelling met Stripe **testmodus** gedaan: mails ontvangen, order in de admin, zending in Sendcloud
- [ ] Label gemaakt in Sendcloud en verzendmail ontvangen
- [ ] Stripe op **live** gezet: live keys en een nieuwe live webhook secret
- [ ] Deellink getest in WhatsApp (OG-afbeelding). Cache van Facebook vernieuwen kan via de Sharing Debugger.

## Handig om te weten
- **Foto's**: upload een vierkante PNG (transparant) of JPG. Het systeem verkleint naar max. 2000px; WebP wordt omgezet (nodig voor de OG-afbeelding).
- **Voorraad**: laat je het veld leeg, dan is de voorraad onbeperkt (print on demand). Vul je een getal in, dan wordt de maat bij 0 automatisch "uitverkocht".
- **Sluitingsdatum**: daarna kan er niet meer besteld worden, maar het shirt blijft zichtbaar. Zet het shirt offline om het te verbergen.
- **Shop dicht**: via Instellingen. Afrekenen is dan geblokkeerd en de homepage toont je melding.
- Prijzen zijn incl. 21% btw. Het btw-bedrag staat in de bevestigingsmail.
- Ordernummers hebben de vorm `5321-1001` (prefix via `NEXT_PUBLIC_ORDER_PREFIX`).

## Structuur
```
src/app/page.tsx                 homepage
src/app/(shop)/…                 shoppagina's (product, bedankt, juridisch)
src/app/admin/…                  beheer + server actions (actions.ts)
src/app/api/checkout             maakt pending order + Stripe Checkout Session
src/app/api/stripe/webhook       betaling → order afronden
src/app/api/sendcloud/webhook    tracking → verzendmail
src/lib/orders.ts                finalizeOrder / mails / Sendcloud
src/lib/email.ts                 HTML-mailtemplates
src/proxy.ts                     beveiligt /admin (Next 16 "proxy" = middleware)
supabase/migrations/0001_init.sql
```
