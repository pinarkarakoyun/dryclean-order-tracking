# Products and Quick Prices Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The shop owner manages product names and the quick price buttons from `/admin/products`; products no longer carry a price.

**Architecture:** Migration `0005` drops `price_list_items.price_kurus` and adds `quick_prices`. Data access lives in `src/lib/products.ts` (replaces `price-list.ts`) and `src/lib/quick-prices.ts`; rules live in two pure, tested modules. Pages and server actions follow the customer-editing pattern (requireAdmin → readText → validate → data layer → `redirect({href, locale})`).

**Tech Stack:** Next.js 16 App Router (cacheComponents), TypeScript, Tailwind, next-intl (tr only), Supabase (service role, server only), node:test.

**Spec:** `docs/superpowers/specs/2026-11-12-products-and-quick-prices-design.md`

## Global Constraints

- Code, comments, identifiers, commit messages in English; user-facing text only in `messages/tr.json`, copied verbatim from spec §7 where given.
- Commit after each task; never push, never open a branch or PR. No Co-Authored-By or "Generated with Claude" lines.
- Tested modules use relative imports ending in `.ts` and `import type` for `@/` aliases (node:test runs them directly).
- Every server action starts with `requireAdmin()`; ids are checked with `isUuid`; form text is never used as a URL.
- Data access modules import `server-only` and use `getDb()` from `./db`; reads call `await connection()` first (existing pattern in `price-list.ts`).
- Product name limit: `LIMITS.garmentName` (60). Quick price limit: `MAX_QUICK_PRICES = 8`.
- Comparison of product names uses `normalizeSearchText` from `src/lib/text-search.ts`; sorting uses `localeCompare(…, "tr")`.
- The table keeps the name `price_list_items` and the column `order_items.price_list_item_id`; a comment in `products.ts` says why.
- Big touch targets (`min-h-14` for primary controls, `min-h-11` for row buttons), mobile first, existing `Input`, `SubmitButton`, `ButtonLink`, `Notice`, `DetailSection` components.
- Pınar runs SQL herself in the Supabase SQL Editor. Never print `.env.local` values.

## Review Focus

1. A name that differs only in spacing ("Takım  elbise", " Gömlek ") must count as a duplicate of the existing one — pinned in Task 2.
2. "150" and "150,00" are the same amount and must be rejected as a duplicate; "1.500" (Turkish thousands) must be invalid, not 1.5 ₺ — pinned in Task 3.
3. A product hidden in another tab, then submitted from an open order form, must give `itemInvalid`, never add the item — owned by Task 1 (existing check kept; manual test 6).
4. `/admin/products?notice=productHidden&id=<garbage or unknown uuid>` must render the page without a notice and without crashing — Task 5.
5. Renaming a product must not change `garment_name` on existing order items — guaranteed by the copy; check in Pınar's browser test 7.

---

### Task 1: Stop reading the product price

**Files:**
- Create: `src/lib/products.ts` (read functions only; replaces `src/lib/price-list.ts`, which is deleted)
- Modify: `src/types/order-model.ts:83-89`, `src/lib/order-validation.ts` (`resolveItemPrice`), `src/lib/order-validation.test.ts:39-53`, `src/app/[locale]/admin/(panel)/orders/[id]/actions.ts:140-164`, `src/app/[locale]/admin/(panel)/orders/[id]/page.tsx:26,51,119-127`, `src/components/admin/AddItemForm.tsx`, `messages/tr.json` (`AddItem.priceHint`, `AddItem.itemInvalid`)

**Interfaces:**
- Produces: `type Product = { id: string; name: string; isActive: boolean }` (replaces `PriceListItem`); `listProducts(): Promise<Product[]>` (all products, active and hidden, unsorted); `getProduct(id: string): Promise<Product | null>`; `resolveItemPrice(typed: string): Result<number | null, "priceInvalid">`; `sortProducts` is NOT here (Task 2).
- `AddItemForm` prop becomes `products: { id: string; name: string }[]` (visible products, alphabetical — the page sorts with `localeCompare(…, "tr")` until Task 2 provides `sortProducts`, then Task 5 switches to it).

- [ ] **Step 1: Replace the price tests in `order-validation.test.ts`**

Remove the four `resolveItemPrice` tests at lines 39-53 and add:

```ts
test("typed price is used as the item price", () => {
  assert.deepEqual(resolveItemPrice("150"), { value: 15000 });
  assert.deepEqual(resolveItemPrice("150,50"), { value: 15050 });
});

test("empty price stays empty", () => {
  assert.deepEqual(resolveItemPrice(""), { value: null });
});

test("invalid typed price is an error", () => {
  assert.deepEqual(resolveItemPrice("abc"), { error: "priceInvalid" });
});
```

- [ ] **Step 2: Run and see it fail**

Run: `npm test 2>&1 | tail -20`
Expected: FAIL on "empty price stays empty" — the old function returns `{ value: undefined }` (`null ?? undefined`), not `{ value: null }`. node:test strips types, so the missing second argument is not a compile error here.

- [ ] **Step 3: Implement**

- `resolveItemPrice(typed)` in `order-validation.ts`: returns `parsePriceToCents(typed)` unchanged. Update its doc comment: the price only comes from the box; an empty box means "no price yet".
- `src/lib/products.ts`: header comment explains the table name (§3.1 of the spec). Row type `{ id; name; is_active }`, `select("id, name, is_active")`. `listProducts` has no `.eq("is_active", true)` filter. Delete `src/lib/price-list.ts`.
- `addItemAction`: use `getProduct`; drop `listPriceKurus`; `resolveItemPrice(values.price)`. Keep the `!item || !item.isActive → "itemInvalid"` check.
- Order page: `const products = (await listProducts()).filter((p) => p.isActive)`, sorted by name with `localeCompare(…, "tr")`; pass `products={products.map(({id, name}) => ({id, name}))}`.
- `AddItemForm`: option text is the name only; `onPickListItem` no longer touches the price; `onTypeName` no longer clears the price; delete `toPriceInput`'s list use (keep the function for the quick buttons). Update the comment at the top of the component.
- `messages/tr.json`: `AddItem.priceHint` → "Butona dokunun ya da tutarı yazın. Bilmiyorsanız boş bırakın."; `AddItem.itemInvalid` → "Bu ürün artık listede yok. Başka bir ürün seçin veya adını yazın."

- [ ] **Step 4: Verify**

Run: `npm test 2>&1 | tail -5 && npx tsc --noEmit && npm run lint && grep -rn "price_kurus\|priceKurus\|price-list" src`
Expected: all tests pass; tsc and lint clean; grep prints nothing (only `unit_price_kurus`/`unitPriceKurus` may remain — use `grep -rn "[^_t]price_kurus\|[^t]priceKurus\|price-list" src` to exclude them; that prints nothing).

- [ ] **Step 5: Commit**

```bash
git add -A src messages
git commit -m "refactor: stop using the product price when adding an item"
```

---

### Task 2: Product rules (pure)

**Files:**
- Create: `src/lib/product-validation.ts`, `src/lib/product-validation.test.ts`

**Interfaces:**
- Consumes: `Product` (Task 1), `normalizeSearchText`, `LIMITS.garmentName`.
- Produces:
  - `type ProductNameErrorKey = "nameRequired" | "nameTooLong" | "duplicateActive" | "duplicateHidden"`
  - `validateProductName(raw: string): { value: string } | { error: "nameRequired" | "nameTooLong" }` — trims and collapses inner whitespace to one space; the returned value is that cleaned name.
  - `findDuplicateProduct(products: Product[], name: string, ignoreId?: string): { kind: "active" | "hidden"; id: string } | null`
  - `sortProducts(products: Product[]): Product[]`

- [ ] **Step 1: Write the failing tests**

```ts
const p = (name: string, isActive = true, id = name): Product => ({ id, name, isActive });

test("name is trimmed and inner spaces collapse", () => {
  assert.deepEqual(validateProductName("  Takım   elbise "), { value: "Takım elbise" });
});
test("empty name is required", () => {
  assert.deepEqual(validateProductName("   "), { error: "nameRequired" });
});
test("name is limited to 60 characters", () => {
  assert.deepEqual(validateProductName("x".repeat(61)), { error: "nameTooLong" });
  assert.ok("value" in validateProductName("x".repeat(60)));
});
test("duplicate ignores case, Turkish letters and spacing", () => {
  const list = [p("Gömlek"), p("Takım elbise")];
  assert.deepEqual(findDuplicateProduct(list, "GÖMLEK"), { kind: "active", id: "Gömlek" });
  assert.deepEqual(findDuplicateProduct(list, "gomlek"), { kind: "active", id: "Gömlek" });
  assert.deepEqual(findDuplicateProduct(list, "takım  elbise"), { kind: "active", id: "Takım elbise" });
  assert.equal(findDuplicateProduct(list, "Pantolon"), null);
});
test("duplicate among hidden products says so", () => {
  assert.deepEqual(findDuplicateProduct([p("Yorgan", false)], "yorgan"), { kind: "hidden", id: "Yorgan" });
});
test("a product is not its own duplicate", () => {
  assert.equal(findDuplicateProduct([p("gömlek", true, "a")], "Gömlek", "a"), null);
});
test("products sort in Turkish alphabetical order", () => {
  const sorted = sortProducts([p("Dikiş"), p("Çanta"), p("Ceket"), p("Ütü")]);
  assert.deepEqual(sorted.map((x) => x.name), ["Ceket", "Çanta", "Dikiş", "Ütü"]);
});
test("sorting does not change the input", () => {
  const list = [p("B"), p("A")];
  sortProducts(list);
  assert.deepEqual(list.map((x) => x.name), ["B", "A"]);
});
```

- [ ] **Step 2: Run and see it fail**

Run: `npm test 2>&1 | tail -20`
Expected: FAIL, cannot find module `./product-validation.ts`.

- [ ] **Step 3: Implement** the three functions. Comparison key: `normalizeSearchText(name.trim().replace(/\s+/g, " "))`. Sort ties by id.

- [ ] **Step 4: Run**

Run: `npm test 2>&1 | tail -5`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/product-validation.ts src/lib/product-validation.test.ts
git commit -m "feat: add product name rules"
```

---

### Task 3: Quick price rules (pure)

**Files:**
- Create: `src/lib/quick-price-validation.ts`, `src/lib/quick-price-validation.test.ts`
- Modify: `src/types/order-model.ts` (add `QuickPrice`)

**Interfaces:**
- Consumes: `parsePriceToCents` from `./order-validation.ts`.
- Produces:
  - `type QuickPrice = { id: string; amountKurus: number }` (in `order-model.ts`)
  - `MAX_QUICK_PRICES = 8`
  - `type QuickPriceErrorKey = "amountRequired" | "amountInvalid" | "duplicate" | "limit"`
  - `validateQuickPrice(raw: string, existing: QuickPrice[]): { value: number } | { error: QuickPriceErrorKey }` — check order: limit, required, invalid (incl. 0), duplicate.
  - `sortQuickPrices(prices: QuickPrice[]): QuickPrice[]`

- [ ] **Step 1: Write the failing tests**

```ts
const q = (amountKurus: number): QuickPrice => ({ id: String(amountKurus), amountKurus });

test("amount is read in kuruş", () => {
  assert.deepEqual(validateQuickPrice("175", []), { value: 17500 });
  assert.deepEqual(validateQuickPrice("175,50", []), { value: 17550 });
  assert.deepEqual(validateQuickPrice("₺ 175", []), { value: 17500 });
});
test("empty amount is required", () => {
  assert.deepEqual(validateQuickPrice(" ", []), { error: "amountRequired" });
});
test("zero, text and thousand separators are invalid", () => {
  for (const raw of ["0", "0,00", "abc", "1.500", "-5"]) {
    assert.deepEqual(validateQuickPrice(raw, []), { error: "amountInvalid" }, raw);
  }
});
test("the same amount written differently is a duplicate", () => {
  assert.deepEqual(validateQuickPrice("150,00", [q(15000)]), { error: "duplicate" });
});
test("at most 8 quick prices", () => {
  const eight = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => q(n * 1000));
  assert.deepEqual(validateQuickPrice("999", eight), { error: "limit" });
  assert.ok("value" in validateQuickPrice("999", eight.slice(1)));
});
test("quick prices sort from low to high without changing the input", () => {
  const list = [q(30000), q(10000), q(20000)];
  assert.deepEqual(sortQuickPrices(list).map((x) => x.amountKurus), [10000, 20000, 30000]);
  assert.deepEqual(list.map((x) => x.amountKurus), [30000, 10000, 20000]);
});
```

Note: `parsePriceToCents` already rejects `"1.500"` (at most two decimals) and `"-5"`; `validateQuickPrice` adds only the "0 is invalid" rule. Do not change `parsePriceToCents`.

- [ ] **Step 2: Run and see it fail**

Run: `npm test 2>&1 | tail -20`
Expected: FAIL, cannot find module `./quick-price-validation.ts`.

- [ ] **Step 3: Implement** both functions and the `QuickPrice` type.

- [ ] **Step 4: Run**

Run: `npm test 2>&1 | tail -5 && npx tsc --noEmit`
Expected: all pass; tsc clean.

- [ ] **Step 5: Commit**

```bash
git add src/lib/quick-price-validation.ts src/lib/quick-price-validation.test.ts src/types/order-model.ts
git commit -m "feat: add quick price rules"
```

---

### Task 4: Migration 0005 (Pınar runs it)

**Files:**
- Create: `supabase/migrations/0005_products_and_quick_prices.sql`, `supabase/checks/03_products.sql`
- Modify: `supabase/seed.sql:5-17`, `supabase/checks/connection.mjs:22` ("price list items" → "products"), `README.md` (expected connection output, setup order: 0005 and check 03)

**Interfaces:**
- Produces in the database: `price_list_items` without `price_kurus`; `public.quick_prices(id uuid pk default gen_random_uuid(), amount_kurus integer not null unique check (amount_kurus > 0), created_at timestamptz not null default now())`.

- [ ] **Step 1: Write the migration**

In order: `alter table public.price_list_items drop column price_kurus;` → create `quick_prices` → `alter table public.quick_prices enable row level security;` → `revoke all on public.quick_prices from anon, authenticated;` → `grant select, insert, update, delete on public.quick_prices to service_role;` → insert `10000, 15000, 20000, 25000, 30000, 40000` with `on conflict (amount_kurus) do nothing`. Header comment: run after the code from Task 1 is in place; safe to run twice except the `drop column` (use `drop column if exists`, and `create table if not exists`, so the whole file is re-runnable).

- [ ] **Step 2: Write `checks/03_products.sql`** in the style of `01_schema.sql` (a `pg_temp` function, results as `OK:` rows, test data rolled back by raising `rollback_checks`). Checks, one row each:
  1. `OK: price column removed` — no `price_kurus` column on `price_list_items`
  2. `OK: quick prices rls` — RLS on for `quick_prices`
  3. `OK: quick prices grants` — anon has no select, service_role has insert
  4. `OK: quick prices rules` — inserting an existing amount raises `unique_violation`, inserting 0 raises `check_violation`
  Header: "Expected result: 4 rows starting with OK:".

- [ ] **Step 3: Update `seed.sql`** — product insert without `price_kurus`; header comment "Run once, after 0001-0005". Order item demo rows keep their own `unit_price_kurus` values.

- [ ] **Step 4: Static check**

Run: `grep -n "price_kurus" supabase/seed.sql; npm run build 2>&1 | tail -5`
Expected: grep prints nothing; build succeeds.

- [ ] **Step 5: Commit**

```bash
git add supabase README.md
git commit -m "feat: add migration 0005 for products and quick prices"
```

- [ ] **Step 6: STOP — Pınar runs the SQL**

Tell Pınar the file paths (no clipboard): run `0005_products_and_quick_prices.sql`, then `checks/03_products.sql`. Expected: "Success" for 0005; 4 `OK:` rows for the check. Then `node --env-file=.env.local supabase/checks/connection.mjs` → `OK: connected, 8 products`. Wait for her result before Task 5.

---

### Task 5: Products screen

**Files:**
- Modify: `src/lib/products.ts` (write functions), `src/components/admin/AdminHeader.tsx`, `messages/tr.json` (`Admin.products`, new `Products`, `ProductNotFound`), `src/i18n/client-messages.ts`, `src/app/[locale]/admin/(panel)/orders/[id]/page.tsx` (use `sortProducts`)
- Create:
  - `src/app/[locale]/admin/(panel)/products/page.tsx`, `products/actions.ts`
  - `products/[id]/edit/page.tsx`, `products/[id]/loading.tsx`, `products/[id]/not-found.tsx`
  - `src/components/admin/AddProductForm.tsx`, `src/components/admin/RenameProductForm.tsx` (client)

**Interfaces:**
- Consumes: `validateProductName`, `findDuplicateProduct`, `sortProducts`, `ProductNameErrorKey` (Task 2).
- Produces (in `products.ts`):
  - `createProduct(name: string): Promise<{ ok: true } | { ok: false; duplicate: "active" | "hidden" }>`
  - `renameProduct(id: string, name: string): Promise<{ ok: true } | { ok: false; duplicate: "active" | "hidden" } | { ok: false; notFound: true }>`
  - `setProductActive(id: string, isActive: boolean): Promise<boolean>` (false = not found / invalid id)
  - The duplicate check runs inside these functions (`listProducts()` + `findDuplicateProduct`), like `updateCustomer` checks the phone.
  - Deliberate refinement of spec §4: the duplicate result carries `"active" | "hidden"` so the action can pick the right message.
- Actions (`products/actions.ts`):
  - `type ProductFormState = { error: ProductNameErrorKey | null; value: string }`
  - `addProductAction(prev, formData)`, `renameProductAction(prev, formData)` (useActionState)
  - `hideProductAction(formData): Promise<void>`, `restoreProductAction(formData): Promise<void>`
  - Redirects: add → `/admin/products?notice=productAdded`; rename → `?notice=productRenamed`; hide/restore → `?notice=productHidden|productRestored&id=<id>`; not found on hide/restore → `/admin/products` without notice. Rename of an unknown id → `notFound()`.

- [ ] **Step 1: Data writes and actions** — implement the `products.ts` functions (`insert({ name })`, `update({ name })` / `update({ is_active })` with `.eq("id", id).select("id").maybeSingle()`), then the actions. Validation via `validateProductName` before any database call; ids via `isUuid`.

- [ ] **Step 2: Messages** — `Admin.products`: "Ürünler ve fiyatlar". `Products` namespace keys (Turkish text from spec §6.2/§7): `title`, `intro` ("Parça eklerken seçilen ürünler ve fiyat butonları."), `productsTitle` ("Ürünler"), `newProduct` ("Yeni ürün adı"), `add` ("Ekle"), `adding` ("Ekleniyor…"), `edit` ("Düzenle"), `hide` ("Gizle"), `restore` ("Geri getir"), `hiddenTitle` ("Gizlenen ürünler ({count})"), `noProducts` ("Henüz ürün yok."), `renameTitle` ("Ürünü düzenle"), `renameIntro` ("Yeni ad eski siparişleri değiştirmez."), `name` ("Ürün adı"), `save` ("Kaydet"), `saving` ("Kaydediliyor…"), `cancel` ("Vazgeç"), `nameRequired`, `nameTooLong`, `duplicateActive`, `duplicateHidden` (spec §7), `noticeProductAdded` ("Ürün eklendi"), `noticeProductRenamed` ("Ürün kaydedildi"), `noticeProductHidden` ("{name} gizlendi"), `noticeProductRestored` ("{name} geri getirildi"). `ProductNotFound`: `title` ("Ürün bulunamadı"), `text` ("Bu ürün silinmiş veya bağlantı yanlış olabilir."), `back` ("Ürünlere dön"). Add `Products` and `ProductNotFound` to `ADMIN_CLIENT_NAMESPACES`.

- [ ] **Step 3: Pages and forms**
  - `products/page.tsx`: `requireAdmin`; products via `listProducts()` → `sortProducts` → split active / hidden. Notice from `searchParams` inside `<Suspense>` (customer page pattern); for hidden/restored, show the notice only when `isUuid(id)` and the product is found, with its database name. Layout `grid gap-8 md:grid-cols-2`; the right column is left for Task 6 (render nothing there yet). Hidden list in `<details>` only when hidden products exist. Hide/restore are `<form action={…}>` with a hidden `id` and a `min-h-11` button.
  - `AddProductForm`: one `Input` + `SubmitButton`, `useActionState(addProductAction)`, error under the field, keeps typed value after an error.
  - `products/[id]/edit/page.tsx` + `RenameProductForm`: single name field (`defaultValue`), Save, Cancel `ButtonLink` to `/admin/products`. `loading.tsx` / `not-found.tsx` copy the customer ones with the `ProductNotFound` namespace.
  - `AdminHeader`: `NavLink href="/admin/products"` after customers.
  - Order page: replace the inline `localeCompare` sort from Task 1 with `sortProducts`.

- [ ] **Step 4: Verify**

Run: `npm run build 2>&1 | tail -5 && npx tsc --noEmit && npm run lint && npm test 2>&1 | tail -3`
Expected: build succeeds (generates the route types first), tsc/lint clean, all tests pass. Then `npm run dev` and open `/admin/products?notice=productHidden&id=x` and `…&id=3f2b8c1e-9a4d-4e6f-8b2a-1c3d5e7f9a0b`: page renders, no notice, no error (Review Focus 4).

- [ ] **Step 5: Commit**

```bash
git add -A src messages
git commit -m "feat: add products screen with add, rename, hide and restore"
```

---

### Task 6: Quick prices screen and form buttons from the database

**Files:**
- Create: `src/lib/quick-prices.ts`, `src/components/admin/AddQuickPriceForm.tsx` (client)
- Modify: `products/actions.ts`, `products/page.tsx`, `src/components/admin/AddItemForm.tsx`, `orders/[id]/page.tsx`, `src/lib/order-limits.ts` (remove `QUICK_PRICES_KURUS` and its comment), `messages/tr.json` (`Products`), `README.md` (known limitations, structure)

**Interfaces:**
- Consumes: `validateQuickPrice`, `sortQuickPrices`, `MAX_QUICK_PRICES`, `QuickPriceErrorKey`, `QuickPrice` (Task 3).
- Produces:
  - `listQuickPrices(): Promise<QuickPrice[]>` (sorted low → high)
  - `addQuickPrice(amountKurus: number): Promise<{ ok: true } | { ok: false; reason: "duplicate" }>` — Postgres `23505` → `duplicate`. Deliberate refinement of spec §4: no `"limit"` reason here, the action checks the limit with `validateQuickPrice` on a fresh server read.
  - `deleteQuickPrice(id: string): Promise<void>` (invalid id or missing row: no error)
  - Actions: `type QuickPriceFormState = { error: QuickPriceErrorKey | null; value: string }`; `addQuickPriceAction(prev, formData)` (reads `listQuickPrices()`, then `validateQuickPrice`, then `addQuickPrice`) → `?notice=priceAdded`; `deleteQuickPriceAction(formData): Promise<void>` → `?notice=priceDeleted`.
  - `AddItemForm` new prop `quickPrices: number[]` (kuruş, sorted).

- [ ] **Step 1: Data access and actions** as above. The limit is enforced by `validateQuickPrice` on the server-read list, so it holds even when the form is hidden.

- [ ] **Step 2: Messages** in `Products`: `pricesTitle` ("Sık kullanılan fiyatlar"), `amount` ("Tutar (₺)"), `delete` ("Sil"), `noPrices` and `limitReached` (spec §6.2 text), `amountRequired`, `amountInvalid`, `duplicate`, `limit` (spec §7), `noticePriceAdded` ("Fiyat eklendi"), `noticePriceDeleted` ("Fiyat silindi"), `deletePriceLabel` ("{price} fiyatını sil", for `aria-label`).

- [ ] **Step 3: Screens**
  - Products page right column: `AddQuickPriceForm` while fewer than 8, otherwise the `limitReached` text; amounts formatted with `format.number(kurus / 100, "price")`, each with a delete form button (`aria-label` = `deletePriceLabel`); `noPrices` when empty.
  - `AddItemForm`: buttons from the `quickPrices` prop; when empty, render no fieldset. Grid `grid-cols-3 sm:grid-cols-4` (up to 8 fit in two rows).
  - Order page: `const quickPrices = (await listQuickPrices()).map((q) => q.amountKurus)`.
  - Remove `QUICK_PRICES_KURUS`; README: remove "no price list editing yet", add `products.ts`, `quick-prices.ts` to the structure.

- [ ] **Step 4: Verify**

Run: `npm run build 2>&1 | tail -5 && npx tsc --noEmit && npm run lint && npm test 2>&1 | tail -3 && grep -rn "QUICK_PRICES_KURUS" src`
Expected: build/tsc/lint clean, tests pass, grep prints nothing.

- [ ] **Step 5: Commit**

```bash
git add -A src messages README.md
git commit -m "feat: manage quick prices in the panel and use them in the item form"
```

- [ ] **Step 6: Hand over** Pınar's browser test list (spec §8, steps 1-7).
