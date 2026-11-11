# Ürünler ve Sık Kullanılan Fiyatlar (Yol Haritası 5B)

**Tarih:** 2026-11-12
**Durum:** İnceleme bekliyor
**Bağlam:** 5. adımın B parçası (A müşteri düzenleme tamamlandı, C leke/hasar fotoğrafı sonra). CLAUDE.md'deki "fiyat listesi (panelden düzenlenebilir)" kararı bu belgeyle şöyle yorumlanır: **ürünler ve fiyatlar birbirinden ayrıdır.** Aynı tür kıyafet her zaman aynı fiyattan yapılmaz (Pınar'ın gözlemi), bu yüzden ürüne sabit fiyat bağlanmaz.

## 1. Amaç

Dükkân sahibi, geliştiriciye ihtiyaç duymadan panelden:
- parça eklerken seçilen **ürün adlarını** (Gömlek, Pantolon…) ekleyip düzenleyebilsin, gizleyebilsin;
- parça eklerken tıklanan **sık kullanılan fiyat butonlarını** (100 ₺, 150 ₺…) ekleyip silebilsin; zam geldiğinde bunları kendisi güncelleyebilsin.

**Başarı ölçütleri:**
- Ürün listesi ve hızlı fiyatlar `/admin/products` sayfasından yönetilir; kod değişikliği gerekmez.
- Ürün seçmek fiyatı doldurmaz; fiyat butonla, elle ya da hiç girilmez.
- Eski siparişlerin parça adları ve fiyatları hiçbir düzenlemeden etkilenmez (zaten parçaya kopyalanıyor).
- Aynı ürün iki kez, aynı tutar iki kez listede olamaz.

## 2. Kapsam

**Bu parçada:**
- Migration `0005`: ürün fiyatı sütunu kaldırılır, `quick_prices` tablosu eklenir
- `/admin/products` sayfası ve `/admin/products/[id]/edit` sayfası
- Üst menüye "Ürünler ve fiyatlar" bağlantısı
- Parça ekleme formunun ve eyleminin yeni kurala uyarlanması
- Saf fonksiyonlar ve testleri

**Bu parçada değil:**
- Ürünlerin elle sıralanması (sıra alfabetik ve otomatik)
- Ürün silme (ürünler yalnızca gizlenir)
- Ürüne "önerilen fiyat"
- Ekspres (+%50) hesaplaması
- Tablo adını değiştirmek (`price_list_items` adı kalır, bkz. §3.1)

## 3. Veri

### 3.1 Migration `supabase/migrations/0005_products_and_quick_prices.sql`

Pınar Supabase SQL Editor'da çalıştırır. Tek dosyada:

1. `alter table public.price_list_items drop column price_kurus;`
   Tablo artık yalnızca ürün adını tutar: `id, name, is_active, sort_order, created_at, updated_at`. `sort_order` kullanılmaz ama kaldırılmaz (zararsız, ileride elle sıralama istenirse hazır).
   **Ad değişmez:** `price_list_items` adı artık tam doğru değil, ama yeniden adlandırma `order_items.price_list_item_id` yabancı anahtarına ve `add_order_item` RPC'sine dokunmayı gerektirir. Kodda (`src/lib/products.ts`) bunu açıklayan bir yorum bulunur; ekranda "Ürünler" yazar.
2. Yeni tablo:
   ```sql
   create table public.quick_prices (
     id uuid primary key default gen_random_uuid(),
     amount_kurus integer not null unique check (amount_kurus > 0),
     created_at timestamptz not null default now()
   );
   ```
   RLS açık, politika yok; yetkiler `0001_schema.sql`'deki diğer tablolarla aynı biçimde yalnızca `service_role`'e verilir.
3. Başlangıç verisi: `10000, 15000, 20000, 25000, 30000, 40000` (`on conflict do nothing`).

`supabase/seed.sql` güncellenir: ürün ekleme satırlarından `price_kurus` çıkarılır, hızlı fiyat ekleme satırları eklenir. `supabase/checks/` içinde `price_kurus` veya tablo listesine bağlı kontroller varsa uyarlanır (`quick_prices` tablo listesine eklenir).

### 3.2 Eski siparişler
`order_items.garment_name` ve `order_items.unit_price_kurus` her parçada kopya olarak durur. Ürün yeniden adlandırılsa, gizlense ya da hızlı fiyat silinse bile mevcut siparişler değişmez.

### 3.3 Uygulama sırası (kesintisiz)
1. Kod `price_kurus` sütununu okumayı ve yazmayı bırakır (sütun hâlâ var, uygulama çalışır).
2. Pınar migration `0005`'i çalıştırır.
3. `quick_prices` tablosunu okuyan/yazan kod devreye girer.

Plan görevleri bu sırayla düzenlenir; 2. adım Pınar'ın elle yaptığı bir adımdır ve plan orada onu bekler.

## 4. Veri erişimi

`src/lib/price-list.ts` → `src/lib/products.ts` olarak yeniden düzenlenir (`server-only`, `db.ts` üzerinden):

- `listProducts(): Promise<Product[]>` — görünür ve gizli bütün ürünler (az sayıda; sayfalama gerekmez, yine de mevcut `collectAllPages` kalıbı kullanılabilir)
- `getProduct(id): Promise<Product | null>`
- `createProduct(name): Promise<{ ok: true } | { ok: false; reason: "duplicate" }>`
- `renameProduct(id, name): Promise<{ ok: true } | { ok: false; reason: "duplicate" | "notFound" }>`
- `setProductActive(id, isActive): Promise<boolean>` (false = bulunamadı)

`src/lib/quick-prices.ts` (`server-only`):

- `listQuickPrices(): Promise<QuickPrice[]>` — küçükten büyüğe
- `addQuickPrice(amountKurus): Promise<{ ok: true } | { ok: false; reason: "duplicate" | "limit" }>` — sınır sunucuda tekrar sayılır; `23505` → `duplicate`
- `deleteQuickPrice(id): Promise<void>` — yoksa sessizce geçer

Tipler (`src/types/order-model.ts`): `PriceListItem` → `Product = { id; name; isActive }`; yeni `QuickPrice = { id; amountKurus }`.

Tekrar kontrolü uygulamada yapılır (Türkçe harf ve büyük/küçük harf farkı için). Tek yöneticili bir dükkânda aynı anda aynı ad eklenmesi pratikte olmaz; ürün adı için veritabanı kuralı eklenmez.

## 5. Saf fonksiyonlar (node:test)

### 5.1 `src/lib/product-validation.ts`
- `validateProductName(raw: string)` → `{ value: string } | { error: "nameRequired" | "nameTooLong" }`. Kırpılır; sınır `LIMITS.garmentName` (60).
- `findDuplicateProduct(products: Product[], name: string, ignoreId?: string)` → `{ kind: "active" | "hidden"; id: string } | null`. Karşılaştırma `normalizeSearchText` ile (`"gömlek"` = `"GÖMLEK"` = `"Gomlek"`). `ignoreId` ile ürünün kendisi yok sayılır, böylece "gömlek" → "Gömlek" düzeltmesi yapılabilir.
- `sortProducts(products: Product[])` → yeni dizi, `localeCompare(…, "tr")` ile alfabetik, eşitlikte id. (`"Ceket"` < `"Çanta"` < `"Dikiş"`.)

### 5.2 `src/lib/quick-price-validation.ts`
- `MAX_QUICK_PRICES = 8`
- `validateQuickPrice(raw: string, existing: QuickPrice[])` → `{ value: number } | { error: "amountRequired" | "amountInvalid" | "duplicate" | "limit" }`. Okuma `parsePriceToCents` ile (aynı biçimler: `"175"`, `"175,50"`, `"₺ 175"`); 0 geçersiz; aynı kuruş değeri `duplicate`; `existing.length >= 8` ise `limit`.
- `sortQuickPrices(prices: QuickPrice[])` → küçükten büyüğe yeni dizi.

### 5.3 Parça fiyatı
`resolveItemPrice(typed, listPriceKurus)` sadeleşir: liste fiyatı parametresi kalkar. Boş → `null`, geçerli → kuruş, geçersiz → `priceInvalid`. Eski "liste fiyatına düş" testi bu davranışın testiyle değiştirilir.

## 6. Ekranlar

### 6.1 Menü
`AdminHeader`'a "Ürünler ve fiyatlar" bağlantısı (`/admin/products`), "Müşteriler"in yanına.

### 6.2 `/admin/products`
Telefonda alt alta, geniş ekranda yan yana iki bölüm.

**Ürünler**
- Üstte tek kutulu ekleme formu: "Yeni ürün adı" + "Ekle".
- Görünür ürünler alfabetik; her satırda ad, "Düzenle" (bağlantı) ve "Gizle" (form butonu).
- Altta `<details>` ile kapalı "Gizlenen ürünler (N)"; her satırda ad ve "Geri getir". Gizli ürün yoksa bu bölüm görünmez.
- Gizle / Geri getir onay sormaz; sayfaya dönüldüğünde bildirim çıkar ("Gömlek gizlendi", "Gömlek geri getirildi"). Bildirimde ad, veritabanından okunan addır.

**Sık kullanılan fiyatlar**
- Ekleme formu: "Tutar (₺)" + "Ekle". 8 tutar varken form yerine "En fazla 8 fiyat olabilir. Yenisini eklemek için önce birini silin." yazar.
- Tutarlar küçükten büyüğe; her birinde "Sil" (form butonu, onaysız, gerçek silme).
- Hiç tutar yoksa: "Henüz fiyat yok. Eklediğiniz fiyatlar parça eklerken buton olarak görünür."

Bildirimler `?notice=` ile (mevcut `Notice` bileşeni): `productAdded`, `productRenamed`, `productHidden`, `productRestored`, `priceAdded`, `priceDeleted`. Gizle/geri getir bildirimleri ürün adını göstermek için `&id=` taşır; ad sunucuda okunur, URL'den metin alınmaz.

### 6.3 `/admin/products/[id]/edit`
- Tek alan: ürün adı (`defaultValue` mevcut ad). "Kaydet" ve "Vazgeç" (`/admin/products`).
- Ürün yoksa `not-found.tsx`; yükleme için `loading.tsx` (müşteri sayfası kalıbı).
- Gizli bir ürün de yeniden adlandırılabilir.

### 6.4 Parça ekleme formu (`AddItemForm`)
- Açılır liste yalnızca **görünür** ürünleri alfabetik gösterir; seçim fiyat kutusunu doldurmaz.
- Hızlı fiyat butonları `listQuickPrices()`'tan gelir (prop olarak); liste boşsa buton satırı ve başlığı görünmez.
- `QUICK_PRICES_KURUS` sabiti `order-limits.ts`'ten kaldırılır.
- Eylem (`addItemAction`): ürün seçilmişse adı veritabanından okunur (gizli veya yoksa `itemInvalid`: "Bu ürün artık listede yok"); fiyat yalnızca kutudan gelir.

## 7. Hatalar

| Durum | Mesaj |
|---|---|
| Ürün adı boş | Ürün adı gerekli. |
| Ürün adı 60 karakterden uzun | Ürün adı en fazla 60 karakter olabilir. |
| Aynı ad görünür ürünlerde | Bu ürün zaten listede. |
| Aynı ad gizli ürünlerde | Bu ürün gizlenenler arasında var. Aşağıdan geri getirebilirsiniz. |
| Tutar boş | Tutar gerekli. |
| Tutar geçersiz veya 0 | Geçerli bir tutar yazın, örneğin 150 veya 150,50. |
| Aynı tutar | Bu fiyat zaten var. |
| 8 tutar dolu | En fazla 8 fiyat olabilir. |
| Düzenlenen ürün yok | "Ürün bulunamadı" sayfası |
| Gizle/geri getir/sil sırasında kayıt yok | Sessizce sayfaya dönülür, bildirim çıkmaz |
| Veritabanı hatası | Mevcut `error.tsx` |

Bütün eylemler `requireAdmin()` ile başlar; id'ler `isUuid` ile doğrulanır; form metni hiçbir zaman URL olarak kullanılmaz. Metinler `messages/tr.json`'da yeni `Products` ve `ProductNotFound` ad alanlarında; istemci bileşenlerinin ihtiyaç duyduğu ad alanları `src/i18n/client-messages.ts`'e eklenir.

## 8. Test

**Otomatik:** §5'teki fonksiyonların testleri (`product-validation.test.ts`, `quick-price-validation.test.ts`, `order-validation.test.ts` güncellemesi). `npm test`, `tsc`, `lint`, `build` temiz olmalı.

**Pınar'ın tarayıcı testi:**
1. Ürün ekle; "gömlek" gibi var olan bir adı farklı harflerle eklemeyi dene → hata.
2. Ürünü yeniden adlandır; sadece harf büyüklüğünü düzelt → kabul edilir.
3. Ürünü gizle → "Gizlenen ürünler"de görünür, sipariş formunun listesinde görünmez. Geri getir.
4. Gizli bir ürünün adını yeniden eklemeyi dene → "gizlenenler arasında var" mesajı.
5. Hızlı fiyat ekle (175,50 dahil), aynısını tekrar ekle → hata; 8'e tamamla → form kaybolur; birini sil.
6. Siparişe parça ekle: ürün seçince fiyat dolmuyor; buton fiyatı yazıyor; fiyatsız parça eklenebiliyor.
7. Eski bir siparişi aç: parça adları ve fiyatları değişmemiş.

## 9. Dükkâna sorulacaklar (CLAUDE.md listesine eklenir)
- Kaç tane hızlı fiyat butonu istersiniz? (Şimdilik en fazla 8.)
- Ürünler alfabetik mi kalsın, en çok kullanılanlar üstte mi olsun?
