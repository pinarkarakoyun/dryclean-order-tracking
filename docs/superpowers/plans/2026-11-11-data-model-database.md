# Veri Modeli ve Veritabanı Uygulama Planı (Yol Haritası 3. Adım)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bellekteki terzi sipariş modelini, parça bazlı ve Supabase'te kalıcı duran kuru temizleme modeliyle değiştirmek; mevcut ekranlar yeni modelle asgari düzeyde çalışır kalacak.

**Architecture:** Tablolar, kısıtlar, append-only trigger'ı ve üç RPC fonksiyonu `supabase/migrations/` altındaki SQL dosyalarında. Uygulama veritabanına yalnızca sunucuda, `service_role` anahtarıyla, `src/lib/db.ts` üzerinden bağlanır. Hesaplanan değerler (etiket, sipariş durumu, toplam) saf TypeScript fonksiyonlarıdır ve `node:test` ile test edilir.

**Tech Stack:** Next.js 16.4.2 (App Router, `cacheComponents`), TypeScript, next-intl (yalnızca `tr`), Supabase (PostgreSQL + Storage), `@supabase/supabase-js`, `server-only`, Node 26 yerleşik `node:test`.

**Spec:** `docs/superpowers/specs/2026-11-09-data-model-design.md`

## Global Constraints

- Kod, yorum ve değişken adları İngilizce; arayüz metinleri yalnızca `messages/tr.json` içinde.
- Commit mesajlarında Claude'a ait hiçbir satır (`Co-Authored-By`, "Generated with") olmaz. Commit'i Claude atar; push, branch ve PR Pınar'dadır.
- Yeni paketler yalnızca `@supabase/supabase-js` ve `server-only`. Başka paket eklenmez.
- Para her yerde tam sayı kuruş (`150,00 ₺ = 15000`).
- Durum değerleri tam olarak: `RECEIVED`, `CLEANING`, `IRONING`, `READY`, `DELIVERED`, `CANCELLED`. Olay türleri: `normal`, `undo`, `step_back`.
- Ekran etiketleri: Teslim alındı, Temizlemede, Ütüde, Hazır, Teslim edildi, İptal.
- Ortam değişkenleri: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`; `NEXT_PUBLIC_` öneki yasak.
- Tüm tablolarda RLS açık ve policy yok. Tüm yabancı anahtarlar `on delete restrict`.
- Her admin okuma ve yazmasından önce `requireAdmin()` çalışır.
- Takip sayfası yalnızca spec §11'deki "Görünür" sütununu döndürür; alanlar tek tek seçilir.
- `node:test` ile test edilen modüller göreli importlarda `.ts` uzantısı kullanır ve `@/` yollarını yalnızca `import type` ile alır (Node bunları siler).
- Gerçek müşteri verisi yok; seed yalnızca kurgusal veridir.
- Supabase hesabı açmak, anahtarları `.env.local` dosyasına yazmak ve SQL Editor'de dosya çalıştırmak Pınar'ın işidir.

## Review Focus

1. **Telefonun farklı yazılışları:** `0532 123 45 67` ve `+905321234567` aynı müşteriyi bulmalı, ikinci bir müşteri oluşturmamalı (Task 1 testi + Task 3 SQL kontrolü).
2. **Eski ekrandan durum değiştirme:** Başka cihazda değişmiş bir parça için buton, uygulamayı çökertmek yerine "durum değişmiş, sayfayı yenileyin" mesajı göstermeli (Task 3 SQL kontrolü + Task 5 action davranışı).
3. **Supabase ayarı eksik veya yanlış:** Anahtar yoksa hata, nedenini söyleyen tek bir mesaj olmalı; anahtar değeri hiçbir mesajda görünmemeli (Task 4 testi).
4. **Fiyat girişi ve yuvarlama:** `150,50` → `15050`; tek kuruşlu ara toplamda %50 ekspres doğru yuvarlanmalı (Task 1 ve Task 5 testleri).
5. **Parçasız veya tamamen iptal sipariş:** Panel ve takip sayfası hatasız açılmalı, "parça eklenmedi" ve "İptal" doğru görünmeli (Task 1 testleri + Task 6 elle kontrol).

---

## Dosya Yapısı

| Dosya | Sorumluluk | Task |
|---|---|---|
| `package.json`, `tsconfig.json` | `test` script'i, `.ts` uzantılı import izni | 1, 4 |
| `src/types/order-model.ts` | Yeni sipariş tipleri ve sabitleri; eski `src/types/order.ts` Task 5'te silinir | 1 |
| `src/lib/order-calc.ts` (+ `.test.ts`) | Etiket üretme/okuma, sipariş durumu, toplam | 1 |
| `src/lib/item-status.ts` (+ `.test.ts`) | Sonraki durum ve 3. adımın geçici kuralı; 4. adımda `canTransition` buraya gelir | 1 |
| `src/lib/phone.test.ts`, `src/lib/order-validation.test.ts` | Telefon (Task 1) ve fiyat (Task 5) testleri | 1, 5 |
| `supabase/migrations/0001_schema.sql` | Tablolar, kısıtlar, indeksler, `updated_at` trigger'ı, RLS, bucket | 2 |
| `supabase/migrations/0002_append_only.sql` | Olay tablosunu koruyan trigger'lar | 2 |
| `supabase/checks/01_schema.sql` | Şema kontrolleri | 2 |
| `supabase/migrations/0003_rpc.sql` | `create_order`, `add_order_item`, `change_item_status` | 3 |
| `supabase/checks/02_rpc.sql` | RPC kontrolleri | 3 |
| `src/lib/supabase-config.ts` (+ `.test.ts`) | Ortam değişkenlerini okuma ve doğrulama | 4 |
| `src/lib/db.ts` | Tek Supabase istemcisi (`server-only`) | 4 |
| `supabase/seed.sql`, `supabase/checks/connection.mjs` | Demo veri, bağlantı kontrolü | 4 |
| `src/lib/orders.ts`, `src/lib/customers.ts`, `src/lib/price-list.ts` | Veri erişimi | 5 |
| `src/lib/order-utils.ts`, admin sayfaları/action'ları/bileşenleri, takip sayfası, `messages/tr.json` | Yeni modele uyarlama | 5 |
| Silinenler: `src/lib/mock-data.ts`, `src/lib/services.ts`, `src/types/service.ts`, `src/types/order.ts` | | 5 |

**Build kuralı:** Her task sonunda `npx tsc --noEmit`, `npm run lint`, `npm test` ve `npm run build` geçer. Bu yüzden Task 1 yeni tipleri eskilerin yanına ayrı dosyada ekler; eskiler Task 5'te, kullanıldıkları her yer değiştirildikten sonra silinir.
| `README.md`, `.env.example` | Kurulum belgeleri | 4, 6 |

**Bu planın dışında:** `canTransition`, geri alma ve "Teslim edildi" onayı (4. adım); fotoğraf yükleme/görüntüleme/silme fonksiyonları, fiyat listesi yönetimi, müşteri bilgisi düzenleme ve `serverActions.bodySizeLimit` ayarı (5. adım). Bu planda yalnızca `item_photos` tablosu ve `item-photos` bucket'ı oluşturulur.

---

### Task 1: Tipler, saf hesaplar ve test altyapısı

Veritabanı gerektirmez; Pınar'dan bir şey beklemeden başlanır.

**Files:**
- Modify: `package.json` (scripts), `tsconfig.json` (compilerOptions)
- Create: `src/types/order-model.ts`, `src/lib/order-calc.ts`, `src/lib/order-calc.test.ts`, `src/lib/item-status.ts`, `src/lib/item-status.test.ts`, `src/lib/phone.test.ts`

**Interfaces:**
- Produces (`src/types/order-model.ts`):
  ```ts
  export const ITEM_STATUSES = ["RECEIVED", "CLEANING", "IRONING", "READY", "DELIVERED", "CANCELLED"] as const;
  export type ItemStatus = (typeof ITEM_STATUSES)[number];
  export const STATUS_EVENT_KINDS = ["normal", "undo", "step_back"] as const;
  export type StatusEventKind = (typeof STATUS_EVENT_KINDS)[number];
  export type Customer = { id: string; name: string; phone: string; preferenceNote: string | null; createdAt: string; updatedAt: string };
  export type Order = { id: string; orderNumber: number; trackingToken: string; customerId: string; expressPercent: number | null; estimatedReadyDate: string | null; publicDescription: string | null; internalNote: string | null; createdAt: string; updatedAt: string };
  export type OrderItem = { id: string; orderId: string; itemNo: number; priceListItemId: string | null; garmentName: string; unitPriceKurus: number | null; rackLocation: string | null; note: string | null; status: ItemStatus; createdAt: string; updatedAt: string };
  export type ItemStatusEvent = { id: number; itemId: string; fromStatus: ItemStatus | null; toStatus: ItemStatus; kind: StatusEventKind; changedAt: string };
  export type PriceListItem = { id: string; name: string; priceKurus: number; isActive: boolean; sortOrder: number };
  export type OrderWithDetails = Order & { customer: Customer; items: OrderItem[] };
  export type OrderStatusSummary = { status: ItemStatus; noItems: boolean; partiallyDelivered: boolean };
  export type OrderTotal = { kind: "complete"; kurus: number } | { kind: "incomplete" };
  export type MissingField = "items" | "price" | "estimatedReadyDate";
  export type PublicOrder = {
    orderNumber: number; firstName: string; publicDescription: string | null; estimatedReadyDate: string | null;
    summary: OrderStatusSummary;
    items: { label: string; garmentName: string; status: ItemStatus; timeline: { status: ItemStatus; changedAt: string }[] }[];
  };
  ```
- Produces (`src/lib/order-calc.ts`):
  - `tagLabel(orderNumber: number, itemNo: number): string`
  - `parseTagLabel(input: string): { orderNumber: number; itemNo: number } | null` — `/^\s*(\d+)\s*-\s*(\d+)\s*$/`, ikisi de `> 0`
  - `deriveOrderStatus(items: Pick<OrderItem, "status">[]): OrderStatusSummary`
  - `calculateOrderTotal(items: Pick<OrderItem, "status" | "unitPriceKurus">[], expressPercent: number | null): OrderTotal`
- Produces (`src/lib/item-status.ts`):
  - `getNextItemStatus(status: ItemStatus): ItemStatus | null` — RECEIVED→CLEANING→IRONING→READY→DELIVERED, diğerleri `null`
  - `canQuickChange(from: ItemStatus, to: ItemStatus): boolean` — 3. adımın geçici kuralı: `to === getNextItemStatus(from)` ya da (`to === "CANCELLED"` ve `from` ne `DELIVERED` ne `CANCELLED`). 4. adımda `canTransition` ile değiştirilir.

- [ ] **Step 1: Test altyapısını kur**

`package.json` → `"test": "node --test \"src/**/*.test.ts\""`. `tsconfig.json` → `"allowImportingTsExtensions": true` (`noEmit: true` zaten var).

- [ ] **Step 2: `src/types/order-model.ts` dosyasını yukarıdaki Interfaces bloğuyla oluştur**

Eski `src/types/order.ts` bu task'ta değişmez; yeni dosyayı henüz uygulama kodu kullanmaz.

- [ ] **Step 3: Başarısız testleri yaz (`src/lib/order-calc.test.ts`)**

```ts
test("tagLabel joins order and item number", () => assert.equal(tagLabel(1048, 1), "1048-1"));
test("parseTagLabel accepts spaces", () => assert.deepEqual(parseTagLabel(" 1048 - 2 "), { orderNumber: 1048, itemNo: 2 }));
test("parseTagLabel rejects bad input", () => {
  for (const bad of ["1048", "1048-", "-1", "1048-0", "abc-1", "1048-1-2"]) assert.equal(parseTagLabel(bad), null);
});

const s = (...statuses: ItemStatus[]) => statuses.map((status) => ({ status }));
test("no items", () => assert.deepEqual(deriveOrderStatus([]), { status: "RECEIVED", noItems: true, partiallyDelivered: false }));
test("all cancelled", () => assert.equal(deriveOrderStatus(s("CANCELLED", "CANCELLED")).status, "CANCELLED"));
test("all active delivered", () => assert.equal(deriveOrderStatus(s("DELIVERED", "CANCELLED")).status, "DELIVERED"));
test("ready with partial delivery", () =>
  assert.deepEqual(deriveOrderStatus(s("READY", "DELIVERED")), { status: "READY", noItems: false, partiallyDelivered: true }));
test("all ready, none delivered", () => assert.equal(deriveOrderStatus(s("READY", "READY")).partiallyDelivered, false));
test("least advanced wins", () => assert.equal(deriveOrderStatus(s("IRONING", "CLEANING", "READY", "CANCELLED")).status, "CLEANING"));

const p = (status: ItemStatus, unitPriceKurus: number | null) => ({ status, unitPriceKurus });
test("total without express", () => assert.deepEqual(calculateOrderTotal([p("RECEIVED", 15000), p("READY", 5050)], null), { kind: "complete", kurus: 20050 }));
test("express 50 rounds half up", () => assert.deepEqual(calculateOrderTotal([p("RECEIVED", 1)], 50), { kind: "complete", kurus: 2 }));
test("express 50 on 15050", () => assert.deepEqual(calculateOrderTotal([p("RECEIVED", 15050)], 50), { kind: "complete", kurus: 22575 }));
test("cancelled items ignored, even without price", () => assert.deepEqual(calculateOrderTotal([p("CANCELLED", null), p("RECEIVED", 100)], null), { kind: "complete", kurus: 100 }));
test("missing price makes total incomplete", () => assert.deepEqual(calculateOrderTotal([p("RECEIVED", 100), p("CLEANING", null)], 50), { kind: "incomplete" }));
test("no active items totals zero", () => assert.deepEqual(calculateOrderTotal([], 50), { kind: "complete", kurus: 0 }));
```

- [ ] **Step 4: Testleri çalıştır, başarısız olduklarını gör**

Run: `npm test` — Expected: FAIL, `order-calc.ts` bulunamıyor.

- [ ] **Step 5: `src/lib/order-calc.ts` dosyasını yaz**

Durum sırası: `RECEIVED < CLEANING < IRONING < READY < DELIVERED`. Kurallar spec §6'daki sırayla uygulanır. Yuvarlama tam sayıyla yapılır, kayan nokta kullanılmaz:

```ts
const kurus = Math.floor((subtotal * (100 + (expressPercent ?? 0)) + 50) / 100);
```

- [ ] **Step 6: `item-status.test.ts` ve `phone.test.ts` testlerini yaz**

```ts
// item-status.test.ts
test("next status chain", () => {
  assert.equal(getNextItemStatus("RECEIVED"), "CLEANING");
  assert.equal(getNextItemStatus("READY"), "DELIVERED");
  assert.equal(getNextItemStatus("DELIVERED"), null);
  assert.equal(getNextItemStatus("CANCELLED"), null);
});
test("quick change allows next and cancel only", () => {
  assert.equal(canQuickChange("RECEIVED", "CLEANING"), true);
  assert.equal(canQuickChange("RECEIVED", "IRONING"), false);
  assert.equal(canQuickChange("IRONING", "CANCELLED"), true);
  assert.equal(canQuickChange("DELIVERED", "CANCELLED"), false);
  assert.equal(canQuickChange("CANCELLED", "RECEIVED"), false);
});
// phone.test.ts
test("same number, different spellings", () => {
  assert.equal(normalizePhone("0532 123 45 67"), "+905321234567");
  assert.equal(normalizePhone("+90 532 123 45 67"), "+905321234567");
  assert.equal(normalizePhone("12345"), null);
});
```

- [ ] **Step 7: Testlerin geçmesi için `item-status.ts` dosyasını yaz**

`phone.ts` değişmez; test mevcut davranışı sabitler.

- [ ] **Step 8: Tüm kontrolleri çalıştır**

Run: `npm test && npx tsc --noEmit && npm run lint && npm run build` — Expected: hepsi hatasız.

- [ ] **Step 9: Commit**

```bash
git add package.json tsconfig.json src/types/order-model.ts src/lib/order-calc.ts src/lib/order-calc.test.ts src/lib/item-status.ts src/lib/item-status.test.ts src/lib/phone.test.ts
git commit -m "feat: parça bazlı tipler ve hesap fonksiyonları eklendi"
```

---

### Task 2: Supabase projesi ve şema

**Files:**
- Create: `supabase/migrations/0001_schema.sql`, `supabase/migrations/0002_append_only.sql`, `supabase/checks/01_schema.sql`

**Interfaces:**
- Produces: spec §4'teki tablolar, sütun adları birebir aynı (snake_case). `orders.order_number` → `integer generated always as identity (start with 1001) unique`. `item_status_events.id` → `bigint generated always as identity`. Private Storage bucket `item-photos`.

- [ ] **Step 1 (Pınar): Supabase projesini aç**

supabase.com'da ücretsiz hesap → yeni proje, bölge **Central EU (Frankfurt)**. Veritabanı şifresini kendi şifre yöneticine kaydet. Bu adımın sonunda Claude'a yalnızca "proje hazır" yaz; hiçbir anahtarı sohbete yapıştırma.

- [ ] **Step 2: `0001_schema.sql` dosyasını yaz**

İçerik, spec §4 ve §5'e birebir uyar:
- `create extension if not exists pgcrypto;` ile `gen_random_uuid()`
- Her tablo; spec'teki `check` kısıtları (`price_kurus >= 0`, `unit_price_kurus >= 0`, `express_percent > 0`, `item_no > 0`, `status`/`from_status`/`to_status` için `ITEM_STATUSES` listesi, `kind` için `STATUS_EVENT_KINDS` listesi)
- `unique (order_id, item_no)`; `customers.phone`, `orders.tracking_token`, `item_photos.storage_path` benzersiz
- İndeksler: `orders(customer_id)`, `order_items(order_id)`, `item_status_events(item_id)`, `item_photos(item_id)`
- Ortak `set_updated_at()` trigger fonksiyonu; `updated_at` olan dört tabloya bağlanır
- Her tabloda `alter table ... enable row level security;` (policy yok)
- `insert into storage.buckets (id, name, public) values ('item-photos', 'item-photos', false) on conflict (id) do nothing;`

- [ ] **Step 3: `0002_append_only.sql` dosyasını yaz**

`prevent_event_changes()` fonksiyonu `raise exception 'item_status_events is append-only'` verir. `before update or delete ... for each row` ve `before truncate ... for each statement` trigger'larına bağlanır.

- [ ] **Step 4: `supabase/checks/01_schema.sql` dosyasını yaz**

`begin; ... rollback;` içinde `do $$ ... $$` blokları. Her kontrol başarıda `raise notice 'OK: <ad>'` yazar, başarısızlıkta hata verir:
- `OK: rls` — `pg_class.relrowsecurity` altı tablonun hepsinde `true`
- `OK: phone unique` — aynı telefonla ikinci `customers` satırı `unique_violation` verir
- `OK: status check` — `order_items.status = 'WASHING'` `check_violation` verir
- `OK: append-only update` / `OK: append-only delete` — bir olay satırını güncellemek ve silmek hata verir
- `OK: restrict` — siparişi olan müşteriyi silmek `foreign_key_violation` verir
- `OK: order number` — ilk sipariş numarası `>= 1001`

- [ ] **Step 5 (Pınar): Migration'ları ve kontrolü çalıştır**

SQL Editor'de sırayla `0001_schema.sql`, `0002_append_only.sql`, sonra `01_schema.sql`. Beklenen: ilk ikisinde "Success", üçüncüsünde yedi `OK:` satırı ve hiç hata yok. Çıktıyı Claude'a yapıştır.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/0001_schema.sql supabase/migrations/0002_append_only.sql supabase/checks/01_schema.sql
git commit -m "feat: veritabanı şeması ve append-only kuralı eklendi"
```

---

### Task 3: RPC fonksiyonları

**Files:**
- Create: `supabase/migrations/0003_rpc.sql`, `supabase/checks/02_rpc.sql`

**Interfaces:**
- Consumes: Task 2 tabloları.
- Produces (Postgres):
  - `create_order(p_customer_name text, p_customer_phone text, p_tracking_token text) returns orders`
  - `add_order_item(p_order_id uuid, p_garment_name text, p_price_list_item_id uuid, p_unit_price_kurus integer, p_rack_location text, p_note text) returns order_items`
  - `change_item_status(p_item_id uuid, p_expected_status text, p_to_status text, p_kind text) returns order_items`
  - Hata mesajları (errcode `P0001`): `order_not_found`, `item_not_found`, `status_conflict`.

- [ ] **Step 1: `02_rpc.sql` kontrollerini yaz**

`begin; ... rollback;` içinde, her biri `OK: <ad>` yazar:
- `OK: customer reused` — aynı telefonla iki `create_order` → tek müşteri, iki sipariş
- `OK: name kept` — ikinci çağrıda farklı ad, kayıtlı ad değişmez
- `OK: item numbers` — iki `add_order_item` → `item_no` 1 ve 2; her birinin `from_status` boş, `to_status = RECEIVED`, `kind = normal` tek olayı var
- `OK: status change` — `RECEIVED→CLEANING`: `status` güncellendi, yeni olay `from_status = RECEIVED`
- `OK: double click` — aynı çağrı tekrar: hata yok, olay sayısı değişmedi
- `OK: conflict` — `expected_status = RECEIVED`, mevcut `CLEANING`, hedef `IRONING` → `status_conflict`
- `OK: not found` — rastgele uuid ile `item_not_found` ve `order_not_found`
- `OK: grants` — `has_function_privilege('anon', 'change_item_status(uuid,text,text,text)', 'execute')` ve `authenticated` için `false`; üç fonksiyon için de

- [ ] **Step 2: `0003_rpc.sql` dosyasını yaz**

Spec §7'deki adımlar birebir uygulanır. Her fonksiyon `language plpgsql security invoker set search_path = public`. `create_order`: `insert ... on conflict (phone) do nothing`, sonra `select id`. `add_order_item`: `select ... from orders where id = p_order_id for update`, `coalesce(max(item_no), 0) + 1`. `change_item_status`: `for update`; önce `status = p_to_status` ise satırı olduğu gibi döndür, sonra `expected_status` karşılaştırması. Dosya sonunda üç fonksiyon için `revoke execute ... from public, anon, authenticated;` ve `grant execute ... to service_role;`.

- [ ] **Step 3 (Pınar): `0003_rpc.sql` ve `02_rpc.sql` dosyalarını çalıştır**

Beklenen: "Success" ve sekiz `OK:` satırı. Çıktıyı Claude'a yapıştır.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0003_rpc.sql supabase/checks/02_rpc.sql
git commit -m "feat: sipariş, parça ve durum değişikliği RPC fonksiyonları eklendi"
```

---

### Task 4: Bağlantı katmanı ve demo veri

**Files:**
- Modify: `package.json`, `package-lock.json` (npm install), `.env.example`
- Create: `src/lib/supabase-config.ts`, `src/lib/supabase-config.test.ts`, `src/lib/db.ts`, `supabase/seed.sql`, `supabase/checks/connection.mjs`

**Interfaces:**
- Produces:
  - `readSupabaseConfig(env: Record<string, string | undefined>): { url: string; serviceRoleKey: string }` — eksik ya da `https://` ile başlamayan değerde `Error` fırlatır
  - `getDb(): SupabaseClient` (`src/lib/db.ts`, ilk satırı `import "server-only";`, istemci tek sefer oluşturulur, `auth: { persistSession: false, autoRefreshToken: false }`)

- [ ] **Step 1: Başarısız testi yaz (`supabase-config.test.ts`)**

```ts
test("reads both values", () =>
  assert.deepEqual(readSupabaseConfig({ SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "k" }), { url: "https://x.supabase.co", serviceRoleKey: "k" }));
test("missing key explains what to set", () =>
  assert.throws(() => readSupabaseConfig({ SUPABASE_URL: "https://x.supabase.co" }), /SUPABASE_SERVICE_ROLE_KEY/));
test("error never contains the key value", () =>
  assert.throws(() => readSupabaseConfig({ SUPABASE_URL: "http://x", SUPABASE_SERVICE_ROLE_KEY: "secret-123" }), (e: Error) => !e.message.includes("secret-123")));
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör, `supabase-config.ts` dosyasını yaz, tekrar çalıştır**

Run: `npm test` — Expected: önce FAIL, sonra PASS.

- [ ] **Step 3: Paketleri kur, `db.ts` dosyasını yaz**

Run: `npm install @supabase/supabase-js server-only`. `db.ts`, `readSupabaseConfig(process.env)` kullanır.

- [ ] **Step 4: `.env.example` dosyasına boş `SUPABASE_URL=` ve `SUPABASE_SERVICE_ROLE_KEY=` ekle**

Yorum: "Supabase → Project Settings → API. Gizli anahtar yalnızca sunucuda kullanılır, asla paylaşmayın."

- [ ] **Step 5: `supabase/seed.sql` dosyasını yaz**

Kurgusal veri, `select create_order(...)`, `add_order_item(...)` ve `change_item_status(...)` çağrılarıyla (olaylar da oluşsun diye): 8 fiyat listesi kalemi ("DEMO" notuyla), 3 müşteri (`+90555000000x`), 4 sipariş (biri ekspres `50`, biri parçasız, biri tamamen iptal, biri karışık durumlu). Takip token'ları `demo-` ile başlar ve 20-64 karakterdir.

- [ ] **Step 6: `supabase/checks/connection.mjs` dosyasını yaz**

`@supabase/supabase-js` ile `price_list_items` satır sayısını okur; başarıda `OK: connected, <n> price list items`, hatada yalnızca hata mesajını yazar (anahtarı yazmaz). Run: `node --env-file=.env.local supabase/checks/connection.mjs`

- [ ] **Step 7 (Pınar): Anahtarları gir ve seed'i çalıştır**

`.env.local` dosyasına `SUPABASE_URL` ve `SUPABASE_SERVICE_ROLE_KEY` değerlerini yaz. SQL Editor'de `seed.sql` çalıştır.

- [ ] **Step 8: Bağlantıyı doğrula**

Run: `node --env-file=.env.local supabase/checks/connection.mjs` — Expected: `OK: connected, 8 price list items`. Run: `npm test` — Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json .env.example src/lib/supabase-config.ts src/lib/supabase-config.test.ts src/lib/db.ts supabase/seed.sql supabase/checks/connection.mjs
git commit -m "feat: Supabase bağlantı katmanı ve demo veri eklendi"
```

---

### Task 5: Veri erişimi ve ekranların yeni modele uyarlanması

Tek task, çünkü `orders.ts` yeni modele geçince onu kullanan dosyaların hepsi aynı anda değişmeli; task içindeki ara adımlarda build geçmez, task sonunda geçer. Her adım sonunda `npx tsc --noEmit` hata sayısının düştüğü kontrol edilir.

**Files:**
- Modify: `src/lib/orders.ts` (yeniden yazılır), `src/lib/order-utils.ts`, `src/lib/order-validation.ts`, `src/lib/tracking.ts`, `messages/tr.json`, `src/i18n/client-messages.ts` (gerekirse), admin `page.tsx`/`orders/page.tsx`/`orders/new/actions.ts`/`orders/[id]/page.tsx`/`orders/[id]/actions.ts`/`orders/[id]/edit/page.tsx`/`orders/[id]/edit/actions.ts`, `src/components/admin/{OrderCard,NewOrderForm,EditOrderForm,StatusControls,TrackingCard,WhatsAppCard,MissingFieldChips}.tsx`, `src/components/ui/{StatusBadge,StatusTimeline}.tsx`, `src/app/[locale]/(site)/track/[token]/page.tsx`
- Create: `src/lib/customers.ts`, `src/lib/price-list.ts`, `src/components/admin/AddItemForm.tsx`, `src/components/admin/ItemList.tsx`
- Create: `src/lib/order-validation.test.ts`
- Modify: `src/lib/order-limits.ts`
- Delete: `src/lib/mock-data.ts`, `src/lib/services.ts`, `src/types/service.ts`, `src/types/order.ts` (tüm importlar `@/types/order-model` olur)

**Interfaces:**
- Consumes: Task 1 tipleri ve fonksiyonları, Task 3 RPC'leri, Task 4 `getDb()`.
- Produces (her okuma fonksiyonu önce `await connection()` çağırır; satırlar snake_case → camelCase eşlenir):
  - `customers.ts`: `findCustomerByPhone(phone: string): Promise<Customer | null>`
  - `price-list.ts`: `listActivePriceListItems(): Promise<PriceListItem[]>` (`sort_order`, sonra `name`), `getPriceListItem(id: string): Promise<PriceListItem | null>`
  - `orders.ts`:
    - `listOrders(): Promise<OrderWithDetails[]>` — en yeni önce; tek sorgu `select("*, customer:customers(*), items:order_items(*)")`
    - `searchOrders(search: { query?: string; status?: ItemStatus }): Promise<OrderWithDetails[]>` — `status`, `deriveOrderStatus` sonucuyla karşılaştırılır; metin araması: ad (mevcut `normalizeText`), telefon rakamları (en az 4), sipariş numarası, `parseTagLabel` ile etiket
    - `getOrderDetail(id: string): Promise<{ order: OrderWithDetails; events: ItemStatusEvent[] } | null>` — uuid değilse `null` (veritabanına sorgu atmadan)
    - `createOrder(input: { customerName: string; customerPhone: string }): Promise<Order>` — token `generateTrackingToken()`
    - `updateOrder(id: string, update: Pick<Order, "expressPercent" | "estimatedReadyDate" | "publicDescription" | "internalNote">): Promise<boolean>`
    - `addOrderItem(input: { orderId: string; garmentName: string; priceListItemId: string | null; unitPriceKurus: number | null; rackLocation: string | null; note: string | null }): Promise<OrderItem | null>`
    - `changeItemStatus(input: { itemId: string; expectedStatus: ItemStatus; toStatus: ItemStatus; kind: StatusEventKind }): Promise<"ok" | "conflict" | "not_found">`
    - `getPublicOrderByToken(token: string): Promise<PublicOrder | null>` — mevcut `TOKEN_PATTERN` korunur
  - `order-utils.ts`: `isOpen(status: ItemStatus)` → RECEIVED/CLEANING/IRONING; `getMissingFields(order: OrderWithDetails): MissingField[]` (parça yoksa `items`; iptal olmayan fiyatsız parça varsa `price`; tarih yoksa `estimatedReadyDate`; sipariş DELIVERED/CANCELLED ise boş); `getDueState(order: OrderWithDetails, today: string): DueState`. `getNextStatus` ve `NextStatus` silinir.

- [ ] **Step 1: `customers.ts`, `price-list.ts` ve yeni `orders.ts` dosyalarını yaz; `mock-data.ts`, `services.ts`, `types/service.ts` dosyalarını sil**

`changeItemStatus`: RPC hatası `status_conflict` → `"conflict"`, `item_not_found` → `"not_found"`; diğer hatalar fırlatılır. `getPublicOrderByToken` dönüşü spec §11'in "Görünür" sütunundan başka alan içermez: `firstName` = adın ilk kelimesi; zaman çizelgesi `{ status: toStatus, changedAt }`.

- [ ] **Step 2: Fiyat testini yaz, `order-utils.ts` ve `order-validation.ts` dosyalarını uyarla**

`order-validation.test.ts`:

```ts
test("price input to kurus", () => {
  assert.deepEqual(parsePriceToCents("150,50"), { value: 15050 });
  assert.deepEqual(parsePriceToCents("₺ 150"), { value: 15000 });
  assert.deepEqual(parsePriceToCents(""), { value: null });
  assert.deepEqual(parsePriceToCents("1.500"), { error: "priceInvalid" });
});
test("express checkbox", () => {
  assert.equal(validateExpress("on"), 50);
  assert.equal(validateExpress(""), null);
});
```

`order-validation.ts`: `parseLanguage` ile `next-intl` ve `routing` importları silinir; göreli importlar `./order-limits.ts` ve `./phone.ts` olur (test edilebilmesi için). `parsePriceToCents` para birimi temizliği `/[€₺]/g` olur. Eklenir: `validateExpress(input: string): number | null` — `"on"` ise `EXPRESS_PERCENT`, değilse `null`. `order-limits.ts`: `priceEuros` → `priceLira`; eklenir `EXPRESS_PERCENT = 50`, `garmentName: 60`, `rackLocation: 20`, `itemNote: 300`. Run: `npm test` — Expected: önce FAIL, uyarlamadan sonra PASS.

- [ ] **Step 3: Çevirileri güncelle (`messages/tr.json`)**

- `Status`: altı durum, Global Constraints'teki etiketlerle
- `StatusAction`: `CLEANING` "Temizliğe al", `IRONING` "Ütüye al", `READY` "Hazır", `DELIVERED` "Teslim edildi", `CANCELLED` "İptal et"
- `Tracking`: eski beş durum metni yerine altı durum için kısa müşteri metni; `noItems`, `partiallyDelivered`, `items` anahtarları
- `MissingField`: `items` "Parça", `price` "Fiyat", `estimatedReadyDate` "Teslim tarihi"
- `OrderDetail`: parça listesi, parça ekleme, çakışma mesajı (`noticeConflict`: "Bu parçanın durumu başka bir yerde değişmiş. Sayfa yenilendi, tekrar deneyin."), ekspres ve toplam (`totalIncomplete`: "Eksik: fiyatı girilmemiş parça var")
- `NewOrder`: dil seçimi anahtarları silinir; `existingCustomer`: "Bu numara {name} adına kayıtlı. Sipariş {name} adına açılacak."
- `EditOrder`: müşteri alanları ve hizmet/kıyafet türü yerine ekspres onay kutusu
- Kaldırılan anahtarlar silinir; `next-intl` tip kontrolü eksik veya fazla anahtarı yakalar.

- [ ] **Step 4: Yeni sipariş akışını uyarla (`orders/new/actions.ts`, `NewOrderForm.tsx`)**

Dil alanı kalkar. Action, normalize edilmiş telefonla `findCustomerByPhone` çağırır. Kayıtlı müşteri farklı adla varsa ve formda `confirmExisting=1` yoksa siparişi oluşturmadan `{ existingCustomerName }` döner; form uyarıyı ve gizli `confirmExisting=1` alanlı onay butonunu gösterir. Aynı adsa veya onaylandıysa `createOrder` çağrılır.

- [ ] **Step 5: Sipariş detayını uyarla (`orders/[id]/page.tsx`, `actions.ts`, `ItemList.tsx`, `AddItemForm.tsx`, `StatusControls.tsx`)**

- Başlık: `#orderNumber`, `deriveOrderStatus` rozeti, `noItems` uyarısı, `partiallyDelivered` notu
- Müşteri bölümü: ad, telefon, tercih notu (salt okunur; düzenleme 5. adımda)
- Toplam: `calculateOrderTotal`; ekspres ise "Ekspres +%50"
- `ItemList`: her parça için `tagLabel`, ad, fiyat, raf, not, `StatusBadge` ve `StatusControls`
- `StatusControls` (parça bazında): `getNextItemStatus` butonu + `<details>` içinde "İptal et". Form alanları: `itemId`, `orderId`, `expectedStatus`, `toStatus`
- `changeItemStatusAction`: `requireAdmin()` → değerleri `ITEM_STATUSES` ile doğrula → `canQuickChange(expectedStatus, toStatus)` false ise detaya dön → `changeItemStatus(..., kind: "normal")` → `"conflict"` ise `notice=conflict`, `"not_found"` ise sipariş listesine, `"ok"` ise `notice=status` ile detaya yönlendir
- `AddItemForm` + `addItemAction`: fiyat listesinden seçim **veya** elle ad. Seçim varsa ad ve fiyat sunucuda `getPriceListItem` ile okunur, formdan gelen ad ve fiyat yok sayılır; elle girişte fiyat `parsePriceToCents`. Raf ve not isteğe bağlı, `LIMITS` ile sınırlı
- Durum geçmişi: parça başına `StatusTimeline` (girdi: `{ status: toStatus, changedAt }`)

- [ ] **Step 6: Liste, panel ve düzenleme ekranlarını uyarla**

`OrderCard`: `#orderNumber · müşteri adı`, türetilmiş durum, parça sayısı, teslim tarihi, `DueBadge`, eksikler. Panel bölümlerinde "Teslime hazır" = türetilmiş durum `READY`, "İşlemde" = `isOpen`. Sipariş listesi filtresi `ITEM_STATUSES` üzerinden. Düzenleme sayfası: ekspres onay kutusu, tahmini tarih, `publicDescription`, `internalNote`.

- [ ] **Step 7: Takip, QR ve WhatsApp bileşenlerini uyarla**

`getTrackingUrl(token: string): Promise<string>` (dil parametresi kalkar, `routing.defaultLocale` kullanılır). `TrackingCard` ve `WhatsAppCard` `customerLanguage` almaz. `WhatsAppCard`: sipariş `DELIVERED`/`CANCELLED` ise gizli, `READY` ise "hazır" mesajı. Takip sayfası: genel durum + parça listesi (etiket, ad, durum, zaman çizelgesi); fiyat, raf, not ve fotoğraf yok.

- [ ] **Step 8: Tüm kontrolleri çalıştır**

Run: `npx tsc --noEmit && npm run lint && npm test && npm run build` — Expected: hepsi hatasız. Run: `grep -rnE "mock-data|lib/services|types/order\"|customerLanguage|READY_FOR_PICKUP|IN_PROGRESS" src messages` — Expected: sonuç yok.

- [ ] **Step 9: Commit**

```bash
git add -A src messages
git commit -m "feat: ekranlar parça bazlı modele ve Supabase'e geçirildi"
```

---

### Task 6: Uçtan uca doğrulama ve belgeler

**Files:**
- Modify: `README.md` (yeniden yazılır)

- [ ] **Step 1: `README.md` dosyasını kuru temizleme projesine göre yeniden yaz**

İçerik: proje özeti, kurulum (`npm install`, `.env.local` değişkenleri), Supabase kurulum sırası (`0001` → `0002` → `0003` → `seed.sql`, ardından iki kontrol dosyası ve `connection.mjs`), `npm test`, bilinen sınırlar (spec §14 maddeleri).

- [ ] **Step 2 (Pınar ile birlikte): Elle uçtan uca kontrol (`npm run dev`)**

| # | Senaryo | Beklenen |
|---|---|---|
| 1 | Yeni sipariş, numara `0555 000 00 01` (seed'deki müşteri), farklı ad | Uyarı + onayla kayıtlı müşteriye bağlanır |
| 2 | Parça ekle: listeden "Gömlek", sonra elle "Halı" fiyatsız | Etiketler `<no>-1`, `<no>-2`; toplam "Eksik" |
| 3 | Ekspresi aç, fiyatı gir | Toplam %50 fazla |
| 4 | Parçayı Teslim alındı → … → Teslim edildi | Her adımda rozet ve geçmiş güncellenir |
| 5 | İki sekmede aynı parça; birinde ilerlet, diğerinde aynı butona bas | Çakışma mesajı, çökme yok |
| 6 | Parçasız siparişin takip linki | "Parça eklenmedi" görünür |
| 7 | Takip sayfasının kaynak kodunda telefon, fiyat, raf, not ara | Hiçbiri yok |
| 8 | Sunucuyu yeniden başlat | Veriler duruyor |

- [ ] **Step 3: Son kontroller**

Run: `npm test && npx tsc --noEmit && npm run lint && npm run build` — Expected: hatasız.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: README kuru temizleme kurulumuna göre güncellendi"
```
