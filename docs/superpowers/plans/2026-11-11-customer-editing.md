# Customer Editing (Step 5A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A customers list, a customer page with the customer's orders, and one customer edit form reachable from both the customer page and the order detail.

**Architecture:** Pure, tested functions (search, sort, order stats, validation, return path) live in small `src/lib` files with `.ts` relative imports. Supabase access stays in `src/lib/customers.ts` and `src/lib/orders.ts`. Pages follow the existing orders pages (server components, `requireAdmin()`, `Suspense` for request-time data, `loading.tsx` / `not-found.tsx` in the `[id]` folder). The form follows `EditOrderForm` (`useActionState`).

**Tech Stack:** Next.js 16 App Router (cacheComponents), TypeScript, Tailwind, next-intl (tr only), supabase-js, node:test.

**Spec:** `docs/superpowers/specs/2026-11-11-customer-editing-design.md`

## Global Constraints

- No database change, no SQL file in this step.
- Code, comments, identifiers in English; all user-facing text in `messages/tr.json` (Turkish).
- Every server action and every page reading data calls `requireAdmin()` first.
- Tested modules use `.ts` relative imports and `import type` for `@/` aliases (so `node --test` can run them).
- Preference note limit: `LIMITS.preferenceNote = 300`. Name limit stays `LIMITS.name` (100); phone uses existing `validatePhone`.
- A redirect target is always built by the server from `parseReturnTo()`; form text is never used as a URL.
- Commits: one per task, conventional prefix, no Claude attribution lines. Do not push.

## Review Focus

1. Saving the customer's own unchanged phone must succeed (not "phoneTaken") → Task 3 handles it by comparing ids; checked in Task 5's manual table.
2. A `from` value like `order:https://evil.example` or `order:../../x` must fall back to the customer page → test in Task 2.
3. Clearing the preference note must store `null`, not `""` → test in Task 2.
4. A customer with no orders appears in the list (bottom) and opens a page that says "Henüz sipariş yok" → stats test in Task 1, manual check in Task 4.
5. Search text with only 1–2 digits ("05") must not match every phone number → test in Task 1.

---

### Task 1: Shared text search and customer search

**Files:**
- Create: `src/lib/text-search.ts`, `src/lib/customer-search.ts`, `src/lib/customer-search.test.ts`
- Modify: `src/lib/orders.ts` (remove local `normalizeText`, import `normalizeSearchText` and `phoneSearchDigits`)

**Interfaces:**
- Produces:
  - `normalizeSearchText(value: string): string` — the current `normalizeText` body from `orders.ts`, moved unchanged.
  - `phoneSearchDigits(query: string): string` — digits only, leading zeros removed.
  - `type CustomerListEntry = Customer & { orderCount: number; lastOrderAt: string | null }` (in `customer-search.ts`)
  - `withOrderStats(customers: Customer[], orders: { customerId: string; createdAt: string }[]): CustomerListEntry[]`
  - `filterCustomers(list: CustomerListEntry[], query: string): CustomerListEntry[]`
  - `sortCustomers(list: CustomerListEntry[]): CustomerListEntry[]` (returns a new array)

- [ ] **Step 1: Write the failing tests** in `customer-search.test.ts` (helper `customer(overrides)` builds a `CustomerListEntry`):
  - `"ELİF"` and `"elif"` find name `"Elif Kaya"`; `"yilmaz"` finds `"Ahmet Yılmaz"`; `"celik"` finds `"Mehmet Çelik"`.
  - `"0555 000"` finds phone `"+905550000001"`; `"+90 555 000"` finds it too.
  - `"05"` (→ `"5"` after stripping, fewer than 3 digits) returns `[]` for a list of customers named "Elif Kaya" / "Ahmet Yılmaz" with phones containing 5.
  - Empty / whitespace query returns the list unchanged.
  - `withOrderStats`: customer with orders at `2026-11-01T10:00Z` and `2026-11-05T10:00Z` → `orderCount 2`, `lastOrderAt "2026-11-05T10:00Z"`; customer with none → `0`, `null`.
  - `sortCustomers`: latest `lastOrderAt` first; customers with `null` after all others, newest `createdAt` first among them; equal values ordered by name (`localeCompare(…, "tr")`) then id.
- [ ] **Step 2: Run** `npm test` → the new tests FAIL (module not found).
- [ ] **Step 3: Implement** `text-search.ts` and `customer-search.ts`. Phone match only when `phoneSearchDigits(query).length >= 3`. Update `searchOrders` to use the shared helpers (its own `>= 4` phone threshold stays).
- [ ] **Step 4: Run** `npm test` → all pass (existing order tests included). `npx tsc --noEmit` clean.
- [ ] **Step 5: Commit** `refactor: share search helpers and add customer search`

### Task 2: Customer form validation and return path

**Files:**
- Create: `src/lib/customer-validation.ts`, `src/lib/customer-validation.test.ts`
- Modify: `src/lib/order-limits.ts` (add `preferenceNote: 300` to `LIMITS`)

**Interfaces:**
- Consumes: `readText`, `validateName`, `validatePhone`, `validateOptionalText` from `./order-validation.ts`; `isUuid` from `./ids.ts`.
- Produces:
  - `type CustomerFormField = "name" | "phone" | "preferenceNote"`
  - `type CustomerFormErrorKey = "nameRequired" | "nameTooLong" | "phoneRequired" | "phoneInvalid" | "preferenceNoteTooLong"`
  - `validateCustomerForm(values: Record<CustomerFormField, string>): { value: { name: string; phone: string; preferenceNote: string | null } } | { errors: Partial<Record<CustomerFormField, CustomerFormErrorKey>> }`
  - `type ReturnTo = { kind: "order"; orderId: string } | { kind: "customer" }`
  - `parseReturnTo(from: string): ReturnTo`

- [ ] **Step 1: Write the failing tests:**
  - Valid `{ name: "Elif Kaya", phone: "0555 000 00 02", preferenceNote: "Kola istemiyor" }` → `value.phone === "+905550000002"`.
  - Empty note → `value.preferenceNote === null`.
  - Empty name and `"abc"` phone → `errors` `{ name: "nameRequired", phone: "phoneInvalid" }`.
  - 301-char note → `errors.preferenceNote === "preferenceNoteTooLong"`; 300 chars passes.
  - `parseReturnTo("order:" + validUuid)` → `{ kind: "order", orderId: validUuid }`.
  - `parseReturnTo("")`, `"order:"`, `"order:https://evil.example"`, `"order:../../x"`, `"https://evil.example"`, `"customer"` → `{ kind: "customer" }`.
- [ ] **Step 2: Run** `npm test` → FAIL.
- [ ] **Step 3: Implement.** Values are already trimmed by the caller (`readText`).
- [ ] **Step 4: Run** `npm test` → pass; `npx tsc --noEmit` clean.
- [ ] **Step 5: Commit** `feat: add customer form validation and safe return path`

### Task 3: Data access

**Files:**
- Modify: `src/lib/customers.ts`, `src/lib/orders.ts`

**Interfaces:**
- Consumes: `withOrderStats`, `CustomerListEntry` (Task 1); `collectAllPages` (`./paging`); `isUuid`.
- Produces:
  - `listCustomers(): Promise<CustomerListEntry[]>` — reads all `customers` and all `orders` (`customer_id, created_at` only), each with `collectAllPages`, ordered with an `id` tie-breaker; returns `withOrderStats(...)` (unsorted).
  - `getCustomer(id: string): Promise<Customer | null>` — `null` for non-uuid or missing.
  - `type UpdateCustomerResult = { ok: true } | { ok: false; reason: "phoneTaken"; owner: { id: string; name: string } } | { ok: false; reason: "notFound" }`
  - `updateCustomer(id: string, values: { name: string; phone: string; preferenceNote: string | null }): Promise<UpdateCustomerResult>` — flow exactly as spec §4: `findCustomerByPhone` → owner with a different id ⇒ `phoneTaken`; `update(...).eq("id", id).select().maybeSingle()` → no row ⇒ `notFound`; error code `"23505"` ⇒ re-read owner with `findCustomerByPhone` and return `phoneTaken`; any other error throws `Database error (customers): …`.
  - `listOrdersForCustomer(customerId: string): Promise<OrderWithDetails[]>` in `orders.ts` — same `DETAILS` select as `listOrders`, `.eq("customer_id", customerId)`, `created_at desc, id`, paged; `[]` for a non-uuid.
- [ ] **Step 1: Implement** the four functions; each starts with `await connection()` like the existing ones.
- [ ] **Step 2: Verify** `npx tsc --noEmit` and `npm run lint` clean; `npm test` still passes.
- [ ] **Step 3: Commit** `feat: add customer data access`

### Task 4: Customers list and customer page

**Files:**
- Create: `src/components/admin/Notice.tsx` (moved from the local `Notice` in `orders/[id]/page.tsx`, same markup; the order page imports it)
- Create: `src/app/[locale]/admin/(panel)/customers/page.tsx`
- Create: `src/app/[locale]/admin/(panel)/customers/[id]/page.tsx`, `loading.tsx`, `not-found.tsx` (copy the orders `[id]` versions, customer texts)
- Modify: `src/components/admin/AdminHeader.tsx` (third `NavLink` → `/admin/customers`, text `Admin.customers` = "Müşteriler")
- Modify: `messages/tr.json` (new `Customers` namespace; `Admin.customers`)

**Interfaces:**
- Consumes: `listCustomers`, `getCustomer` (Task 3), `filterCustomers`, `sortCustomers` (Task 1), `listOrdersForCustomer` (Task 3), `OrderCard`, `formatPhone`.

- [ ] **Step 1: List page** — same structure as `orders/page.tsx`: title, GET search form (`q`, max 100 chars, label "İsim veya telefon ile arayın"), `Suspense` around the content, `requireAdmin()` inside. Rows are links to `/admin/customers/{id}` showing name, `formatPhone(phone)`, "{count} sipariş", last order date via `getFormatter()` (or "Henüz sipariş yok"). Empty result: "Müşteri bulunamadı". `generateMetadata` title "Müşteriler".
- [ ] **Step 2: Customer page** — `getCustomer(id)` → `notFound()` if null. Back link "← Müşteriler". Header: name; rows phone (`tel:`), preference note (hidden when null). `ButtonLink` "Düzenle" → `/admin/customers/{id}/edit` (no `from`). `notice === "saved"` → `<Notice title="Müşteri bilgileri kaydedildi" />`. Orders section "Siparişler" with `OrderCard` per order (same props as the orders list), or "Henüz sipariş yok".
- [ ] **Step 3: Verify** `npx tsc --noEmit`, `npm run lint`, `npm run build` all succeed.
- [ ] **Step 4: Commit** `feat: add customers list and customer page`

### Task 5: Edit customer form and order detail link

**Files:**
- Create: `src/app/[locale]/admin/(panel)/customers/[id]/edit/page.tsx`, `src/app/[locale]/admin/(panel)/customers/[id]/edit/actions.ts`
- Create: `src/components/admin/EditCustomerForm.tsx` (client)
- Modify: `src/app/[locale]/admin/(panel)/orders/[id]/page.tsx` (customer name links to `/admin/customers/{customerId}`; `ButtonLink` "Müşteriyi düzenle" → `/admin/customers/{customerId}/edit?from=order:{orderId}`; `notice === "customerSaved"` → Notice "Müşteri bilgileri kaydedildi")
- Modify: `src/i18n/client-messages.ts` (add `"EditCustomer"` to `ADMIN_CLIENT_NAMESPACES`), `messages/tr.json` (`EditCustomer` namespace, `OrderDetail.editCustomer`, `OrderDetail.noticeCustomerSaved`)
- Modify: `README.md` (Known limitations: customer editing done; no delete/merge yet)

**Interfaces:**
- Consumes: `validateCustomerForm`, `parseReturnTo`, `CustomerFormField`, `CustomerFormErrorKey` (Task 2); `getCustomer`, `updateCustomer` (Task 3).
- Produces (in `actions.ts`):
  - `type EditCustomerState = { errors: Partial<Record<CustomerFormField, CustomerFormErrorKey>>; values: Record<CustomerFormField, string> | null; phoneOwner: { id: string; name: string } | null }`
  - `updateCustomerAction(previous: EditCustomerState, formData: FormData): Promise<EditCustomerState>`

- [ ] **Step 1: Action** — `requireAdmin()`; read hidden `customerId`, `from`, and the three fields with `readText`. Validation errors → return them with `values`. `updateCustomer` result: `phoneTaken` → return `values` and `phoneOwner`; `notFound` → `notFound()`. Success → `redirect` (from `@/i18n/navigation`, with `getLocale()`) to `/admin/orders/{orderId}?notice=customerSaved` or `/admin/customers/{id}?notice=saved` per `parseReturnTo(from)`.
- [ ] **Step 2: Form** — like `EditOrderForm`: hidden `customerId` and `from`; `Input` for name (`maxLength LIMITS.name`) and phone (`type="tel"`), `Textarea` for preference note (`maxLength LIMITS.preferenceNote`, hint "Örnek: kola istemiyor, askıda teslim"); errors under each field. When `phoneOwner` is set, under the phone field: "Bu numara {name} adlı müşteriye kayıtlı" plus a `Link` to `/admin/customers/{phoneOwner.id}` ("Müşteriyi aç"). `SubmitButton` "Kaydet"; `ButtonLink` "Vazgeç" to the same place a save returns to (the page passes `cancelHref`).
- [ ] **Step 3: Page** — `requireAdmin()`, `getCustomer(id)` → `notFound()`. Read `from` from `searchParams`, compute `cancelHref` with `parseReturnTo`. Title "Müşteriyi düzenle", intro "Değişiklik bu müşterinin bütün siparişlerinde görünür." Initial values from the customer (phone shown as stored E.164; `formatPhone` not needed in an input).
- [ ] **Step 4: Verify** `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` all succeed.
- [ ] **Step 5: Commit** `feat: add customer editing from the customer page and order detail`

### Task 6: Browser check (Pınar) and final review

- [ ] **Step 1:** Give Pınar the spec §8 table (search "elif" / "0555", edit from order detail, phone taken by another demo customer, name change visible on other orders and as first name on the tracking page, unchanged own phone saves).
- [ ] **Step 2:** Final whole-branch review by a fresh reviewer; fix findings; commit `fix: …` if needed.
