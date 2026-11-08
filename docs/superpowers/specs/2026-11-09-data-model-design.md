# Veri Modeli ve Veritabanı Tasarımı (Yol Haritası 3. Adım)

**Tarih:** 2026-11-09
**Durum:** İnceleme bekliyor
**Öncelik:** Bu belge, `docs/PRD.md` içindeki terziye ait veri modeli bölümlerinin yerine geçer. Çelişki olursa bu belge geçerlidir.

## 1. Amaç

Antalya'daki gerçek bir kuru temizleme dükkânının siparişlerini parça bazında takip etmek ve verileri kalıcı olarak saklamak.

**Başarı ölçütleri:**
- Çalışan bir parçayı etiket numarasıyla (`1048-1`) bulup durumunu birkaç tıklamayla değiştirebilir.
- Müşteri QR linkinden parçalarının durumunu görür; özel veri görmez.
- Sunucu yeniden başlasa da veri kaybolmaz.
- Durum geçmişi hiçbir kod yolundan silinemez veya değiştirilemez.

## 2. Kapsam

**Bu adımda:**
- Tablolar, kısıtlar, trigger'lar ve RPC fonksiyonları (migration dosyaları)
- `src/lib/db.ts` ve yeni modele göre `src/lib/orders.ts`
- Saf hesap fonksiyonları ve testleri
- Demo seed verisi
- Mevcut ekranların yeni modele **asgari** uyarlanması: build geçer ve temel akış çalışır

**Bu adımda değil:**
- Geçiş kuralları, 8 saniyelik "Geri al", "Önceki aşamaya al" ve "Teslim edildi" onayı (4. adım)
- Yeni ekran tasarımı, fiyat listesi yönetim ekranı, fotoğraf yükleme arayüzü (5. adım)
- Fiş yazdırma ve WhatsApp iyileştirmeleri (6. adım)
- Yayına alma ve gerçek müşteri verisi (7. adım)

**MVP'de yok:** ödeme ve veresiye, indirim, fiş tablosu, müşteri hesabı, çok kullanıcılı giriş.

## 3. Alınan kararlar

| Konu | Karar |
|---|---|
| Müşteri kimliği | Bir telefon numarası tek müşteridir |
| Teknoloji | Supabase (PostgreSQL + Storage), SQL migration dosyaları, `@supabase/supabase-js`; ORM yok |
| Sipariş durumu | Saklanmaz, parçalardan hesaplanır |
| Parçasız sipariş | Serbest; yalnızca ad ve telefonla sipariş açılabilir |
| Ekspres | Sipariş bazında, oran siparişe kopyalanır (`50`) |
| Fiyat | Parçaya kopyalanır; liste değişse de eski sipariş değişmez |
| Para | Tam sayı kuruş |
| Etiket numarası | Saklanmaz, `order_number` ve `item_no` alanlarından üretilir |
| Adet | Yok; her fiziksel parça ayrı satırdır |
| Geçiş kuralları | Pınar yazar, `src/lib/item-status.ts` içinde |

## 4. Tablolar

Tüm `id` alanları aksi belirtilmedikçe `uuid` (`gen_random_uuid()`). Tüm zaman alanları `timestamptz not null default now()`. `updated_at` ortak bir trigger ile güncellenir. Yabancı anahtarların tümü `on delete restrict`.

```
customers 1 ── N orders 1 ── N order_items 1 ── N item_status_events
                                  │    └──────── N item_photos
price_list_items 1 ── N order_items (boş olabilir)
```

### `customers`

| Alan | Tip | Kural |
|---|---|---|
| `id` | uuid | Birincil anahtar |
| `name` | text | Zorunlu |
| `phone` | text | Zorunlu, benzersiz, E.164 (`+905321234567`) |
| `preference_note` | text | Boş olabilir, yalnızca panelde görünür |
| `created_at`, `updated_at` | timestamptz | |

### `orders`

| Alan | Tip | Kural |
|---|---|---|
| `id` | uuid | Birincil anahtar |
| `order_number` | integer | Benzersiz, 1001'den başlayan sequence'ten gelir; boşluk olabilir |
| `tracking_token` | text | Zorunlu, benzersiz; uygulama `generateTrackingToken()` ile üretir |
| `customer_id` | uuid | Zorunlu, `customers` |
| `express_percent` | integer | Boşsa normal sipariş; doluysa `> 0` |
| `estimated_ready_date` | date | Boş olabilir |
| `public_description` | text | Boş olabilir, takip sayfasında görünür |
| `internal_note` | text | Boş olabilir, yalnızca panelde görünür |
| `created_at`, `updated_at` | timestamptz | |

### `price_list_items`

| Alan | Tip | Kural |
|---|---|---|
| `id` | uuid | Birincil anahtar |
| `name` | text | Zorunlu |
| `price_kurus` | integer | Zorunlu, `>= 0` |
| `is_active` | boolean | Varsayılan `true`; kullanılmış kalem silinmez, pasif yapılır |
| `sort_order` | integer | Varsayılan `0` |
| `created_at`, `updated_at` | timestamptz | |

### `order_items`

| Alan | Tip | Kural |
|---|---|---|
| `id` | uuid | Birincil anahtar |
| `order_id` | uuid | Zorunlu, `orders` |
| `item_no` | integer | Zorunlu, `> 0`; `(order_id, item_no)` benzersiz |
| `price_list_item_id` | uuid | Boş olabilir ("Diğer" için) |
| `garment_name` | text | Zorunlu; listeden kopyalanır veya elle yazılır |
| `unit_price_kurus` | integer | Boş olabilir, `>= 0` |
| `rack_location` | text | Boş olabilir |
| `note` | text | Boş olabilir, yalnızca panelde görünür |
| `status` | text | Zorunlu; bkz. §5 |
| `created_at`, `updated_at` | timestamptz | |

Parça silinmez. Yanlış eklenen parça `CANCELLED` yapılır, böylece `item_no` tekrar kullanılmaz.

### `item_status_events`

| Alan | Tip | Kural |
|---|---|---|
| `id` | bigint identity | Birincil anahtar; aynı andaki olayları da sıralar |
| `item_id` | uuid | Zorunlu, `order_items` |
| `from_status` | text | İlk olayda boş, diğerlerinde dolu |
| `to_status` | text | Zorunlu |
| `kind` | text | `normal`, `undo` veya `step_back` |
| `changed_at` | timestamptz | |

Bir trigger `UPDATE` ve `DELETE` isteklerini hata vererek durdurur.

### `item_photos`

| Alan | Tip | Kural |
|---|---|---|
| `id` | uuid | Birincil anahtar |
| `item_id` | uuid | Zorunlu, `order_items` |
| `storage_path` | text | Zorunlu, benzersiz |
| `note` | text | Boş olabilir |
| `created_at` | timestamptz | |

Durum geçmişinin aksine fotoğraflar silinebilir.

## 5. Durumlar

Değerler kodda İngilizce, ekranda Türkçedir. Veritabanında `check` kısıtıyla sınırlanır.

| Değer | Ekranda |
|---|---|
| `RECEIVED` | Teslim alındı |
| `CLEANING` | Temizlemede |
| `IRONING` | Ütüde |
| `READY` | Hazır |
| `DELIVERED` | Teslim edildi |
| `CANCELLED` | İptal |

**Olay türleri:**
- `normal`: olağan değişiklik
- `undo`: 8 saniyelik "Geri al"; `to_status` son olayın `from_status` değeridir
- `step_back`: "Önceki aşamaya al"

## 6. Hesaplanan değerler

Hepsi saf TypeScript fonksiyonudur ve test edilir.

### Etiket numarası
`${order_number}-${item_no}`, örneğin `1048-1`.

### Sipariş durumu (`deriveOrderStatus`)
İlk uyan kural geçerlidir:

1. Parça yok → `RECEIVED` + "parça eklenmedi" uyarısı
2. Tüm parçalar `CANCELLED` → `CANCELLED`
3. İptal olmayanların tümü `DELIVERED` → `DELIVERED`
4. İptal olmayanların tümü `READY` veya `DELIVERED` → `READY`; bir kısmı `DELIVERED` ise "kısmen teslim edildi" işareti
5. Diğer durumlar → iptal olmayanlar arasında en geride kalan durum (sıra: `RECEIVED` < `CLEANING` < `IRONING` < `READY` < `DELIVERED`)

### Toplam tutar (`calculateOrderTotal`)
- `CANCELLED` parçalar hesaba katılmaz.
- İptal olmayan bir parçanın fiyatı boşsa sonuç "eksik" olur; kısmi tutar kesinmiş gibi gösterilmez.
- Formül: `ara toplam × (100 + express_percent) / 100`, en yakın kuruşa yuvarlanır (.5 yukarı). `express_percent` boşsa 0 sayılır.

## 7. RPC fonksiyonları

Birden fazla tabloya dokunan işlemler tek transaction içinde çalışan Postgres fonksiyonlarıdır.

### `create_order`
**Girdi:** müşteri adı, telefon, tracking token, isteğe bağlı sipariş alanları.
1. Telefona göre müşteriyi bulur; yoksa oluşturur.
2. Kayıtlı müşterinin adını **değiştirmez**.
3. Siparişi ekler ve döndürür.

Form, numara girilince kayıtlı müşteriyi önceden sorgular. Girilen ad farklıysa kullanıcıya sorar; ad değişikliği ayrı bir güncellemedir.

### `add_order_item`
**Girdi:** sipariş id, ad, isteğe bağlı fiyat listesi id, fiyat, raf, not.
1. Sipariş satırını kilitler (`for update`).
2. `item_no` olarak en büyük değer + 1 verir.
3. Parçayı `RECEIVED` olarak ekler.
4. İlk olayı ekler (`from_status` boş, `kind = normal`).

Fiyat listesinden seçimde ad ve fiyat, çağıran kod tarafından gönderilir.

### `change_item_status`
**Girdi:** parça id, `expected_status`, `to_status`, `kind`.
1. Parça satırını kilitler. Yoksa `item_not_found` hatası verir.
2. Mevcut durum `to_status` ile aynıysa hiçbir şey yazmaz, başarı döner (çift tıklama).
3. Mevcut durum `expected_status` ile farklıysa `status_conflict` hatası verir.
4. Olayı ekler ve `status` alanını günceller.

Bu fonksiyon iş kuralı denetlemez; `check` kısıtları yalnızca geçerli değerleri zorunlu kılar. Kurallar çağrıdan önce uygulamada denetlenir (§8).

## 8. Geçiş kuralları

- **Yer:** `src/lib/item-status.ts`
- **İmza:** `canTransition(from: ItemStatus, to: ItemStatus, kind: StatusEventKind): boolean`
- **Yazan:** Pınar, 4. adımda. İskeleti ve testlerin başlangıcı hazırlanır.
- **Çağrılan yer:** Status değiştiren Server Action, RPC'den önce.
- **8 saniye sınırı:** Arayüzde uygulanır; sunucu süre denetlemez.
- **3. adımda geçici davranış:** Ekranda yalnızca bir sonraki duruma geçiş ve iptal sunulur. 4. adımda bu davranış `canTransition` ile değiştirilir.

## 9. Güvenlik

- **Tarayıcı** veritabanına bağlanmaz ve anahtar görmez. Veritabanı istemcisi yalnızca `src/lib/db.ts` içinde, `server-only` ile korunur.
- **Ortam değişkenleri:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. `NEXT_PUBLIC_` öneki kullanılmaz; `.env.local` içinde durur, `.env.example` içinde boş olarak listelenir.
- **RLS** tüm tablolarda açık, policy yok. Yalnızca `service_role` erişebilir.
- **Panel:** Her okuma ve yazma öncesi `requireAdmin()` çalışır; bu durum veritabanına geçişle değişmez.
- **Girdi doğrulama:** Sunucuda yapılır; mevcut `order-validation.ts` deseni korunur, fiyat kuruşa çevrilir, telefon E.164'e normalize edilir (öncelik Türkiye).

## 10. Fotoğraflar

- **Bucket:** `item-photos`, gizli.
- **Yol:** `<order_id>/<item_id>/<uuid>.jpg`
- **Yükleme:** Tarayıcıda en uzun kenar 1600 px olacak şekilde JPEG'e küçültülür; sunucu Server Action içinde yükler ve 2 MB üstünü reddeder. Next.js Server Action boyut ayarı uygulama sırasında proje içindeki Next dokümanından doğrulanır.
- **Görüntüleme:** Sunucunun ürettiği 10 dakikalık signed URL ile, yalnızca panelde.
- **Silme:** Önce Storage'daki dosya, sonra tablo satırı silinir.

## 11. Takip sayfası

`getPublicOrderByToken` alanları tek tek seçerek döndürür (mevcut `PublicOrder` deseni). Token biçimi denetimi aynen kalır.

| Görünür | Görünmez |
|---|---|
| Sipariş no, müşterinin ilk adı | Telefon, soyad, tercih notu |
| `public_description`, tahmini tarih, hesaplanan sipariş durumu | Fiyat, tutar, ekspres oranı |
| Her parçanın etiketi, adı, durumu | Raf konumu, parça notu, iç not, fotoğraf |
| Her parçanın zaman çizelgesi (durum ve zaman) | `kind`, olay ve parça id'leri |

## 12. Mevcut kodun etkilenmesi

- **`src/types/order.ts`:** Yeni tipler (`Customer`, `Order`, `OrderItem`, `ItemStatus`, `StatusEventKind`, `ItemStatusEvent`, `ItemPhoto`, `PublicOrder`).
- **`src/lib/orders.ts`:** İçi Supabase'e geçer; veri erişiminin tek noktası olmaya devam eder. Bellek deposu kaldırılır.
- **Kaldırılanlar:** `src/lib/mock-data.ts`; `src/lib/services.ts` ve `src/types/service.ts` (`price_list_items` yerine geçer); `customerLanguage` ve `parseLanguage` (tek dil).
- **`MissingField`:** `items`, `price`, `estimatedReadyDate` olur.
- **Etkilenen ekranlar:** `types/order` veya `lib/orders` kullanan 18 dosya asgari düzeyde uyarlanır. Çeviriler `messages/tr.json` içinde yeni durumlara göre güncellenir.

## 13. Test ve kurulum

- **Birim testleri:** Node'un yerleşik `node:test` aracı; `deriveOrderStatus`, `calculateOrderTotal`, etiket üretimi. 4. adımda `canTransition`. Yeni paket eklenmez.
- **SQL kontrolleri:** `supabase/checks/` altında çalıştırılabilir senaryolar: append-only trigger'ı, `change_item_status` için çift tıklama ve `status_conflict`, `item_no` sıralaması, RLS.
- **Migration:** `supabase/migrations/` altında sıralı `.sql` dosyaları; başlangıçta Supabase SQL Editor'den çalıştırılır. Docker veya CLI gerekmez.
- **Seed:** `supabase/seed.sql`, yalnızca kurgusal veri.
- **Ortam:** AB bölgesinde tek bir geliştirme projesi; gerçek müşteri verisi girilmez.
- **Son kontrol:** `npm run lint`, `npx tsc --noEmit`, `npm run build`, testler ve panelde elle uçtan uca akış.

## 14. Yayın öncesi zorunlu kontroller

Gerçek müşteri verisi girilmeden önce kapatılmalıdır (7. adım):

1. **KVKK:** Yurt dışına aktarım, aydınlatma metni, silme talebi akışı. Silme talebi için plan: müşteri kaydını anonimleştirmek ve fotoğrafları silmek; geçmiş kayıtlar korunur. Gerekirse uzman görüşü alınır.
2. **Yedekleme ve plan:** Supabase'in güncel yedekleme ve duraklatma koşulları kontrol edilir.
3. **Giriş güvenliği:** Deneme sınırı (rate limiting) eklenir.
4. **Takip linki ömrü:** Teslimden sonra linkin kapanıp kapanmayacağına karar verilir.
5. **Üretim ortamı:** Ayrı Supabase projesi ve ayrı anahtarlar kullanılır.

## 15. Dükkân cevaplarına bağlı noktalar

| Cevap | Etki |
|---|---|
| Temizlik merkezi tesiste yapılıyorsa | `check` kısıtına ve §5'e yeni durum eklenir (ör. "Tesise gönderildi") |
| Veresiye varsa | Ayrı ödeme tablosu eklenir; mevcut tablolar değişmez |
| Etiket sistemi `1048-1` biçimine uymuyorsa | Yalnızca etiket üretim fonksiyonu değişir |
| Karışık ekspres sık görülüyorsa | `express_percent` parçaya taşınır |
| Gerçek fiyat listesi | `seed.sql` yerine panelden girilir |
