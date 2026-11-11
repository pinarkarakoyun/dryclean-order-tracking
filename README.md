# Kuru Temizleme Sipariş Takip

Order tracking for a dry-cleaning shop in Antalya, tracked **per garment**: an order has items, each with its own tag number (`1048-1`) and status. Customers follow their order through a secret QR/tracking link, without an account.

- Design: [docs/superpowers/specs/2026-11-09-data-model-design.md](docs/superpowers/specs/2026-11-09-data-model-design.md)
- Implementation plan: [docs/superpowers/plans/2026-11-11-data-model-database.md](docs/superpowers/plans/2026-11-11-data-model-database.md)

**Status:** prototype on a Supabase development project with **demo data only**. Not ready for real customer data yet (see "Before going live").

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev                  # http://localhost:3000/admin
```

| Variable | Where it comes from |
|---|---|
| `ENABLE_ORDER_TRACKING` | `true` turns on `/admin` and `/track` |
| `ADMIN_PASSWORD` | Your own password for the admin panel |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `SUPABASE_URL` | Supabase → Project Settings → Data API (`https://<ref>.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API Keys → **Secret key** (`sb_secret_…`). Server only: never share it, never prefix it with `NEXT_PUBLIC_` |

## Database setup (Supabase)

1. Create a project (Free plan, region **Central EU (Frankfurt)**). Under Security, keep "Enable Data API" on and turn **"Automatically expose new tables" off**.
2. In the SQL Editor, run each file in this order (one file per run):

| # | File | Expected result |
|---|---|---|
| 1 | `supabase/migrations/0001_schema.sql` | Success |
| 2 | `supabase/migrations/0002_append_only.sql` | Success |
| 3 | `supabase/checks/01_schema.sql` | 8 rows starting with `OK:` |
| 4 | `supabase/migrations/0003_rpc.sql` | Success |
| 5 | `supabase/migrations/0004_conflict_null_check.sql` | Success |
| 6 | `supabase/checks/02_rpc.sql` | 9 rows starting with `OK:` |
| 7 | `supabase/migrations/0005_products_and_quick_prices.sql` | Success |
| 8 | `supabase/checks/03_products.sql` | 4 rows starting with `OK:` |
| 9 | `supabase/seed.sql` (demo data, run once) | 4 orders |

3. Put the URL and secret key in `.env.local`, then check the connection:

```bash
node --env-file=.env.local supabase/checks/connection.mjs
```

Expected: `OK: connected, 8 products`.

To copy a file to the clipboard from the terminal, keep the text in UTF-8, or Turkish letters break:

```bash
LANG=en_US.UTF-8 pbcopy < supabase/seed.sql
```

The status history is **append-only** (a database trigger blocks every UPDATE and DELETE), so demo data cannot be deleted and re-seeded. Start from a new project instead.

## Checks

```bash
npm test             # pure functions: tag numbers, order status, totals, prices, phone
npx tsc --noEmit
npm run lint
npm run build
```

## Project structure

```
supabase/migrations/   Tables, constraints, append-only trigger, database functions
supabase/checks/       SQL checks (run in the SQL Editor) and the connection check
supabase/seed.sql      Fictional demo data
messages/tr.json       All Turkish texts
src/types/order-model.ts  Order, item, customer, status types
src/lib/order-calc.ts  Tag numbers, order status from items, totals (tested)
src/lib/item-status.ts Status rules for one garment (step 4: canTransition)
src/lib/orders.ts      Order data access (Supabase)
src/lib/customers.ts   Customer data access (Supabase)
src/lib/products.ts    Product names for the item form (Supabase; table price_list_items)
src/lib/quick-prices.ts  Quick price buttons of the item form (Supabase)
src/lib/db.ts          The only database client (server only)
src/app/[locale]/      Pages: admin panel and the public tracking page
```

## Before going live

Required before entering real customer data:

1. **KVKK:** transfer of data abroad (Supabase has no region in Turkey), privacy notice, deletion requests (plan: anonymize the customer, delete photos, keep the history).
2. **Backups and plan limits:** check Supabase's current backup and project-pausing rules.
3. **Login:** add rate limiting; today there is one shared password.
4. **Tracking link lifetime:** decide whether links stop working after pickup.
5. **Production:** a separate Supabase project and separate keys.

## Known limitations

- Which status changes are allowed is decided by `canTransition` in `src/lib/item-status.ts`. "Geri al" is shown for 8 seconds after a change; the server allows undoing only an item's latest change and checks no time limit (spec §8). Undone changes are hidden from the customer's timeline.
- Customers can be listed, searched and edited (`/admin/customers`, or "Müşteriyi düzenle" on an order). A phone number that belongs to another customer is refused; customers cannot be deleted or merged yet (deletion is planned as anonymization, see KVKK above).
- Products have no price: the same garment is not always the same price, so the price is typed per item or picked from the quick price buttons. Both are edited at `/admin/products`; products are hidden, never deleted. Order items keep their own copied name and price.
- No photo upload yet (roadmap step 5C); the `item_photos` table and private `item-photos` bucket exist.
- All orders are read (page by page, past Supabase's 1000-row limit) and searched in memory: fine for one shop, but slower as orders pile up. Move search and filters into SQL when it gets slow.
- In production mode the login cookie is HTTPS-only, so `next start` over plain `http://192.168…` cannot keep you logged in. Use `npm run dev` for local demos.
- `docs/PRD.md` still describes the tailoring project; the spec above takes precedence.
