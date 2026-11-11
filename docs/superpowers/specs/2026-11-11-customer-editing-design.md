# Müşteri Düzenleme ve Müşteriler Sayfası (Yol Haritası 5A)

**Tarih:** 2026-11-11
**Durum:** İnceleme bekliyor
**Bağlam:** 5. adım (Ekranlar) üç ayrı parçaya bölündü ve bu sırayla yapılacak: A müşteri düzenleme (bu belge), B fiyat listesi düzenleme, C leke/hasar fotoğrafı. Her parçanın kendi spec'i ve planı olacak.

## 1. Amaç

Dükkân çalışanı müşteri bilgilerini (ad, telefon, tercih notu) düzeltebilsin ve bir müşterinin bütün siparişlerini tek ekranda görebilsin.

**Başarı ölçütleri:**
- Bir müşterinin adı, telefonu veya tercih notu hem sipariş detayından hem müşteri sayfasından düzenlenebilir.
- Yapılan düzenleme o müşterinin bütün siparişlerinde görünür, çünkü müşteri tek bir kayıttır.
- Bir telefon numarası hiçbir zaman iki müşteriye ait olamaz. Çakışmada kayıt yapılmaz ve çalışan uyarılır.
- Müşteri, ad veya telefonun bir kısmıyla bulunabilir.

## 2. Kapsam

**Bu parçada:**
- Müşteri listesi, müşteri sayfası, müşteri düzenleme sayfası
- Üst menüye "Müşteriler" bağlantısı
- Sipariş detayında "Müşteriyi düzenle" butonu; müşteri adı müşteri sayfasına bağlantı olur
- Saf fonksiyonlar ve testleri

**Bu parçada değil:**
- Müşteri silme (KVKK silme talebi 7. adımda anonimleştirme olarak planlı)
- Müşteri birleştirme
- Listede sayfalama, istatistik, grafik
- Veritabanı değişikliği: `customers` tablosunda gereken her alan, `updated_at` tetikleyicisi ve `service_role` yetkileri zaten var. **Bu parçada çalıştırılacak SQL dosyası yoktur.**

## 3. Ekranlar ve davranış

### 3.1 Menü
`AdminHeader`'a "Müşteriler" bağlantısı eklenir (`/admin/customers`).

### 3.2 Müşteri listesi: `/admin/customers`
- Büyük bir arama kutusu (`?q=`). Aranan metin adda veya telefonda geçerse müşteri gösterilir.
- Her satır: ad, biçimlendirilmiş telefon, sipariş sayısı, son sipariş tarihi. Satıra dokununca müşteri sayfası açılır.
- Sıralama: son sipariş tarihi en yeni olan en üstte. Hiç siparişi olmayan müşteriler en altta, kendi aralarında kayıt tarihine göre (yeni üstte). Eşitlikte ad ve sonra id ile sabit sıralama yapılır.
- Sonuç yoksa: "Müşteri bulunamadı" mesajı.

### 3.3 Müşteri sayfası: `/admin/customers/[id]`
- Ad, `tel:` bağlantılı telefon ve tercih notu (boşsa gösterilmez).
- "Düzenle" butonu: `/admin/customers/[id]/edit`
- Müşterinin siparişleri, en yeni üstte, mevcut `OrderCard` ile. Siparişi yoksa: "Henüz sipariş yok".
- `?notice=saved` gelirse üstte "Müşteri bilgileri kaydedildi" bildirimi.

### 3.4 Düzenleme sayfası: `/admin/customers/[id]/edit?from=…`
Alanlar:

| Alan | Kural |
|---|---|
| Ad | Zorunlu, en fazla `LIMITS.name` (100) karakter; mevcut `validateName` |
| Telefon | Zorunlu; mevcut `validatePhone`, E.164'e çevrilir (`normalizePhone`) |
| Tercih notu | İsteğe bağlı, en fazla `LIMITS.preferenceNote` (300) karakter; boş bırakılırsa `null` olarak kaydedilir |

- Hatalı alanların altında hata mesajı çıkar; yazılan değerler korunur (mevcut `useActionState` kalıbı, `EditOrderForm` gibi).
- Telefon başka bir müşteriye aitse kayıt yapılmaz. Telefon alanının altında "Bu numara {ad} adlı müşteriye kayıtlı" uyarısı ve o müşterinin sayfasına bağlantı çıkar.
- "Vazgeç" butonu ve başarılı kayıt, kullanıcıyı geldiği yere döndürür (§5.3). Başarılı kayıtta hedef sayfaya `notice=customerSaved` (sipariş detayı) veya `notice=saved` (müşteri sayfası) eklenir.

### 3.5 Sipariş detayı
- "Müşteri" bölümüne "Müşteriyi düzenle" butonu eklenir: `/admin/customers/{customerId}/edit?from=order:{orderId}`
- Müşteri adı `/admin/customers/{customerId}` bağlantısı olur.
- `notice=customerSaved` gelirse "Müşteri bilgileri kaydedildi" bildirimi çıkar.

## 4. Veri erişimi

Bütün veritabanı işleri `src/lib` içindeki veri katmanında kalır. Her çağıran önce `requireAdmin()` çalıştırır.

**`src/lib/customers.ts`:**
- `listCustomers(): Promise<CustomerListEntry[]>`. Bütün müşterileri ve bütün siparişlerin yalnızca `customer_id` ve `created_at` alanlarını `collectAllPages` ile okur. Bellekte müşteri başına `orderCount` ve `lastOrderAt` hesaplar.
  ```ts
  type CustomerListEntry = Customer & { orderCount: number; lastOrderAt: string | null };
  ```
- `getCustomer(id: string): Promise<Customer | null>`
- `updateCustomer(id, { name, phone, preferenceNote })` şunlardan birini döner:
  ```ts
  | { ok: true }
  | { ok: false; reason: "phoneTaken"; owner: { id: string; name: string } }
  | { ok: false; reason: "notFound" }
  ```
  Akış:
  1. `findCustomerByPhone(phone)` ile numaraya bakılır. Numara başka bir id'ye aitse `phoneTaken` döner.
  2. `update … where id = $id` çalışır ve satırı geri ister. Satır gelmezse `notFound` döner.
  3. Güncelleme `23505` (unique ihlali) hatası verirse, yani iki istek aynı anda geldiyse, sahibi tekrar okunur ve `phoneTaken` döner.
  4. Diğer veritabanı hataları `throw` ile `error.tsx`'e gider.
  Müşterinin kendi numarasını değiştirmeden kaydetmesi çakışma değildir.

**`src/lib/orders.ts`:**
- `listOrdersForCustomer(customerId: string): Promise<OrderWithDetails[]>`. Mevcut sipariş sorgusunu `customer_id` filtresiyle tekrar kullanır, `created_at desc, id` ile sıralar.

## 5. Saf fonksiyonlar (node:test ile test edilir)

### 5.1 `validateCustomerForm(formData)` — `src/lib/customer-validation.ts`
`validateName`, `validatePhone` ve `validateOptionalText`'i tekrar kullanır. Sonuç olarak ya `{ name, phone, preferenceNote }` (telefon E.164) ya da alan başına hata anahtarı döner: `nameRequired`, `nameTooLong`, `phoneRequired`, `phoneInvalid`, `preferenceNoteTooLong`. `LIMITS`'e `preferenceNote: 300` eklenir.

### 5.2 `filterCustomers(list, query)` ve `sortCustomers(list)` — `src/lib/customer-search.ts`
- Arama metni kırpılır; boşsa liste aynen döner.
- Ad eşleşmesi sipariş aramasıyla **aynı** kuralı kullanır: aksan ve büyük-küçük harf farkı yok sayılır, "ı" ile "i" aynı sayılır. "ELİF" araması "Elif"i, "yilmaz" araması "Yılmaz"ı, "celik" araması "Çelik"i bulur. Bu kural `orders.ts` içindeki `normalizeText`'ten ortak bir dosyaya (`src/lib/text-search.ts`) taşınır, iki arama da onu kullanır.
- Telefon eşleşmesi yalnızca rakamlarla yapılır: aramadaki rakam dışı karakterler ve baştaki sıfırlar atılır; en az 3 rakam kalırsa telefonun rakamlarında aranır. "0555 000", "+905550000…" içinde bulunur.
- Sıralama §3.2'deki kurala uyar.

### 5.3 `parseReturnTo(from, customerId)` — `src/lib/customer-validation.ts`
- `from` değeri `order:<uuid>` ise ve uuid `isUuid` kontrolünden geçerse dönüş `{ kind: "order", orderId }`.
- Diğer her değer (boş, bozuk, yabancı adres) müşteri sayfasıdır: `{ kind: "customer" }`.
- Sunucu yönlendirme adresini bu sonuçtan kendisi kurar; formdan gelen metin hiçbir zaman doğrudan adres olarak kullanılmaz (open redirect koruması).

## 6. Hata durumları

| Durum | Davranış |
|---|---|
| Numara başka müşteride | Kayıt yok, telefon altında uyarı + bağlantı, değerler korunur |
| Aynı anda iki kayıt aynı numarayı alır | Veritabanının unique kuralı (`23505`) yakalanır, aynı uyarı |
| Kendi numarasını değiştirmeden kaydetme | Normal kayıt |
| Geçersiz uuid veya olmayan müşteri | `notFound()` |
| Kayıt sırasında müşteri bulunamazsa | `notFound()` |
| Veritabanı hatası | `error.tsx` (mevcut) |

## 7. Çeviri ve bileşenler

- `messages/tr.json`: yeni `Customers` (liste ve müşteri sayfası) ve `EditCustomer` (form) bölümleri; `AdminHeader` ve `OrderDetail` için yeni anahtarlar.
- `EditCustomerForm` bir client bileşenidir. `EditCustomer` bölümü `src/i18n/client-messages.ts` listesine eklenir.
- Form, `EditOrderForm` ile aynı kalıbı kullanır: `useActionState`, `Input`, `Textarea`, `SubmitButton`, `ButtonLink`.

## 8. Test ve doğrulama

- `npm test`: doğrulama, arama (Türkçe harfler, telefon parçası, baştaki 0), sıralama ve `parseReturnTo` testleri.
- `npx tsc --noEmit`, `npm run lint`, `npm run build`.
- Pınar'ın tarayıcıda deneyeceği kontrol tablosu:
  - Menüden müşteri listesini aç, "elif" ve "0555" ile ara.
  - Sipariş detayından "Müşteriyi düzenle", tercih notu ekle, kaydet: siparişe döner, bildirim ve not görünür.
  - Müşteri sayfasından düzenle, numarayı başka bir demo müşterinin numarası yap: kayıt yok, uyarı ve bağlantı görünür.
  - Adı değiştir: aynı müşterinin diğer siparişlerinde yeni ad, takip sayfasında yeni adın ilk kelimesi görünür (takip sayfası yalnızca ilk adı gösterir).
