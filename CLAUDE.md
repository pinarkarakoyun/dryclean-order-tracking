# Kuru Temizleme Sipariş Takip

Antalya'daki gerçek bir kuru temizleme dükkânı için sipariş takip sistemi.
Terzi projesinin (kledingreparatie-mustan) sipariş modülünden kopyalandı.
Ben (Pınar) bilgisayar mühendisliği 4. sınıf öğrencisiyim; adımları açıklayarak,
her seferinde tek bir değişiklik yaparak ilerle. Türkçe konuş.

## Alınan kararlar
- Takip PARÇA bazında: Order → OrderItem (her parçanın etiket no'su ve durumu var)
- Durum geçmişi append-only: geri alma kayıt silmez, yeni kayıt ekler
- Durumlar: Teslim alındı → Temizlemede → Ütüde → Hazır → Teslim edildi (+ İptal)
- Yanlış tıklama: 8 sn "Geri al" bildirimi + "Önceki aşamaya al" seçeneği;
  "Teslim edildi" onay ister
- Geçiş kuralları fonksiyonunu ben yazacağım; hazırlarken bana bırak
- MVP'de: fiyat listesi (panelden düzenlenebilir), ekspres (+%50), leke/hasar
  fotoğrafı, askı/raf konumu, müşteri tercih notları, QR'lı müşteri takip sayfası
- Bildirim: şimdilik wa.me linki (ücretsiz), otomatik SMS/WhatsApp API sonra
- Kıyafete QR yok: etiket numarası (1048-1) dükkânın kâğıt etiketine yazılır
- Dil: next-intl kalır, sadece tr. Giriş: tek ortak şifre (şimdilik)
- Veri şu an bellekte (globalThis); gerçek veritabanı ZORUNLU (muhtemelen
  Supabase/PostgreSQL, karar 3. bölümde)

## Yol haritası
1. Keşif ✅  2. Kopyala + temizle  3. Veri modeli + veritabanı
4. Durum geçişleri + geri alma  5. Ekranlar (prototipe göre)
6. Fiş yazdırma + WhatsApp  7. Yayına alma + demo

## Dükkâna sorulacaklar (henüz cevapsız)
Temizlik dükkânda mı, merkezi tesiste mi? Etiket sistemi? Bilgisayar/tablet var mı?
Veresiye var mı? Kâğıt fiş mi, WhatsApp linki mi? Gerçek fiyat listesi?
