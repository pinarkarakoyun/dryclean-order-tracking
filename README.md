# Mustan Tailoring Management System

Order management and customer tracking prototype for a small tailoring shop in the Netherlands.
Product requirements: [docs/PRD.md](docs/PRD.md).

**Status: clickable prototype with demo data.** Orders live in server memory and reset when the server restarts.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in ADMIN_PASSWORD and AUTH_SECRET
npm run dev                  # http://localhost:3000
```

Generate `AUTH_SECRET` with `openssl rand -base64 32`.

### Order module switch

`ENABLE_ORDER_TRACKING=true` turns on the order module: admin panel (`/admin`), customer
tracking (`/track`), QR codes and WhatsApp order messages. Any other value, or no value,
turns it off: the site is then a plain business website, `/admin` and `/track` return 404,
and the texts about tracking and the privacy sections about order data are hidden.
Restart `npm run dev` (or build again) after changing it.

## Demo walkthrough

1. **Public site**: `/` (Dutch), `/tr`, `/en`. Pages: home, services, how it works, contact, privacy.
2. **Admin login**: `/admin` → password from `ADMIN_PASSWORD`.
3. **Dashboard**: orders that need attention, are incomplete, ready for pickup, in progress, newest.
4. **New order**: "+ Nieuwe bestelling" → only name and phone are required.
5. **Order detail**: status buttons, WhatsApp message (in the customer's language), QR code and tracking link, edit page.
6. **Customer tracking**: open the QR code / link → `/track/<token>` (no login, no private data).

To scan a QR code with a phone in development, open the admin on the computer's network
address (e.g. `http://192.168.1.15:3000/admin`, shown when `npm run dev` starts) and use the same Wi-Fi.

## Project structure

```
messages/            Translations (nl = reference, tr, en)
src/app/[locale]/    Pages; (site) = public website, admin = admin panel
src/components/      UI building blocks (ui = shared, public, admin)
src/i18n/            Language routing, formats, client message selection
src/lib/orders.ts    The single data access layer (mock data now, database later)
src/lib/             Auth, validation, phone, QR/tracking, WhatsApp helpers
src/proxy.ts         Language routing + admin route protection
```

## Checks

```bash
npm run lint
npm run build
```

## Known limitations (prototype)

- Demo data in memory: new orders disappear on restart. A real database (Supabase/PostgreSQL) replaces `src/lib/orders.ts` later.
- One shared admin password, no rate limiting beyond a short delay.
- In production mode the login cookie is HTTPS-only, so `next start` over plain `http://192.168…` cannot keep you logged in. Use `npm run dev` for local demos.
- An unknown tracking token shows the translated "not found" page with HTTP status 200 in production (the page is `noindex`).
- Next.js `partialPrefetching` is turned off (see `next.config.ts`): with Dutch URLs without a `/nl` prefix it caused an endless prefetch loop for `/track`.
- Shop address, phone, opening hours and service prices are placeholders; Dutch texts need review by a native speaker.
