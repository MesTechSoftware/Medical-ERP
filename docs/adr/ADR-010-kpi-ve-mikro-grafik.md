# ADR-010 — KPI kartları ve mikro grafikler: sunucu SVG, tek hesap yolu, kart düzeyinde hata

- **Durum:** ✅ Kabul edildi
- **Tarih:** 26.10.2026
- **Kaynak soru:** Görsel tasarım 2. tur brief'i (kullanıcı, 26.10.2026) — kararlar K-1…K-5 ve X-5 dar istisnası
- **Bağlı KARARLAR maddeleri:**
  - **X-5 eki (26.10.2026):** gösterim ölçeği
  - **§0.4:** oran kuralı; ikinci hesap yolu yasak
  - **X-1 §(2)/(8):** dönem zorunlu; yetki sorguda
  - **E-1:** ay sınırı İstanbul takvimi; tek dönüşüm noktası
  - **X-3:** hata yüzeyi
  - **D-2:** dashboard prim/hakediş taşımaz
  - **D-4:** hedef/kota kalıcı kapsam dışı
  - **K-2:** bakiye mutlak tutar + yön
  - **Ü-3:** taban etiketi
- **İlgili ADR:** `ADR-009` (görsel tasarım sistemi)
- **Uygulandığı commit:** tasarım 2-1 (hesap katmanı) · 2-2 (grafikler) · 2-3 (KPI kartı) · 2-4 (yönetici ekranları)

## Bağlam

1. tur görünümü tek kaynağa topladı. KPI kartları ve mikro grafikler 2. tura kaldı (`ADR-009`, açık kalemler). Bu iş, ekrandaki sayıların **nasıl** hesaplandığına dokunur. Projede o hesabın kuralları sıkıdır:

- **Ciro:** veritabanında `SUM()` ile alınmaz. Satır başına `hesaplaSatirTutarlari()` yuvarlar. İkinci bir hesap yolu "iki farklı toplam" demektir (§0.4).
- **Decimal aritmetiği:** X-5 §(4) yalnız iki fonksiyonda izinlidir. Değişim yüzdesi ve grafik geometrisi ise bölme ister.
- **Saat dilimi:** E-1, dilim dönüşümünü tek noktada tutar; SQL'de `AT TIME ZONE` yoktur.
- **Yetki:** X-1 §(8) yetkiyi sorguya koyar; bileşen rol bilmez.
- **Hatalar:** X-3 sessiz hatayı yasaklar ve kullanıcıya yalnız sabit metin ile referans gösterilmesini ister.

## Karar

1. **Grafikler sunucuda saf SVG'dir.**
   - Kütüphane ve `"use client"` yoktur; istemciye JS gitmez.
   - Bileşenler `src/components/grafik/`'tedir: `Sparkline`, `ColumnMicro`, `BarMicro`, `OranCubugu`.
   - Geometri yalnız `src/lib/kpi/olcek.ts`'tedir (X-5 eki): boyutsuz değer döndürür, yuvarlama tek yerdedir.
   - SVG ekran okuyucudan gizlidir. Yanında görünmez özet vardır; tutarlar bu özette `<Tutar>` ile, tabanı yazılı olarak yer alır.
2. **KPI kartı sözleşmesi** (`src/components/kpi/`):
   - Her kartta `varyant`, `iyiYon` ve `bosDavranisi` zorunludur.
   - Sayfa başlığında en çok 4 kart vardır ve ilki birincildir. Grid sınıfları kart sayısına göre statiktir.
   - **Yerleşim satırın kendi genişliğinden gelir** (container query), ekrandan değil. Kenar çubuğu 768 px'ten itibaren 240 px yer, bu yüzden ekran genişliği kartın genişliğini söylemez. Eşikler ikincil kartın içerik alanını ≥ ~150 px tutar (`KpiSatiri` tablosu).
   - Para değeri `<Tutar>` ile gösterilir; taban etiketi değerin altında, kendi satırındadır.
   - Değer tek satırdır. Yazı boyu kart içeriğinin %13'üdür, varyantın üst sınırına kadar. ₺99.999.999,99 en dar kartta da sığar; değer kesilmez, taşmaz.
   - Kötü yön **uyarı** tonundadır, hata değil.
   - Değişim satırı ok ve yüzdeden oluşur; yönün adı ekran okuyucuya yazılır.
   - Karşılaştırma tabanı ("geçen ayın aynı günlerine göre") kartın alt notundadır (brief §3.1). Ok, yüzde ve not daima yazılıdır.
   - `tasarim.test.ts` kuralı zorlar:
     - dosya başına en çok 4 kart;
     - `iyiYon` ve `bosDavranisi` yazılı;
     - satırın ilk kartı birincil.
3. **Ciro serisi aynı hesap yolundan gelir.**
   - `ciroOzeti()` ve `saticiCiroSerileri()` `reports-service.ts`'tedir.
   - Aralıkların birleşimindeki sevk ve iade satırlarını **bir kez**, `getCiroTotal()` ile aynı okuyucularla (sayılan belgeler süzgeci) çeker.
   - Satırlar aylara bölünür, her ay `hesaplaSatirTutarlari()` ile toplanır.
   - Tahsilat ve bakiye serileri veritabanında toplanır: aralık başına `SUM(CASE …)`, tek sorgu. LedgerEntry toplamı yalnız `doctor-cari.ts`'tedir.
4. **Ay sınırları TS'te `ayAraligi()` ile kurulur** (`donem.ts`: `sonAylar`, `karsilastirmaAraliklari`). SQL bu sınırlarla gruplar; dilim dönüşümü yalnız `zaman.ts`'tedir (E-1).
5. **Karşılaştırma tabanı aynı gün aralığıdır** (K-1).
   - Devam eden ayda: ay başından şu ana, önceki ayın aynı uzunluktaki başıyla kıyaslanır; önceki ay kısaysa kırpılır.
   - Geçmiş ayda: tam ay, önceki tam ayla kıyaslanır.
   - "Tüm zamanlar"da karşılaştırma yoktur.
   - Taban 0 ise "yeni", negatifse yalnız yön gösterilir.
6. **Eksik veri kuralı:**
   - sayım ve ciroda kayıt yoksa gerçek değer 0'dır;
   - ölçümde (ay sonu bakiyesi) veri yoksa boşluk bırakılır, enterpolasyon yapılmaz;
   - trend 2 noktanın altındaysa aynı ölçüde "Veri yok" gösterilir.
7. **Rol süzgeci sorgudadır** (`KpiKapsami`: şirket ya da satıcının kendi siparişleri).
   - Dashboard prim/hakediş taşımaz.
   - OPERASYON, eskiden olduğu gibi, şirket ciro ve tahsilatını görür.
   - Satıcıya ya da doktora göre ciro raporlar sayfasında kalır.
8. **Kart düzeyinde hata — X-3 ile:**
   - `kpiGetir()` uygulamadaki **tek kapsüldür**.
   - Hata yutulmaz ve başarı dönmez: kart sabit metin ("Yüklenemedi") ve referans gösterir.
   - Aynı referans container log'una teknik hata satırı olarak yazılır (mesaj ve `meta` yok).
   - Yalnız o kart düşer, sayfa çökmez.
9. **İskelet kartla aynı sınıfları ve aynı metinleri taşır.**
   - Uzunluğu değişebilen metinler (etiket, anlık not, alt not) iskelette saydam yazılır; satır kırılımı gerçekle aynıdır.
   - Değer tek satırdır; taban etiketi kendi satırındadır. Bu yüzden kartın yüksekliği veriye bağlı değildir.
   - E2e kart kart ölçer: x, y, genişlik ve yükseklik ±2 px.

## Sonuçlar

- ✅ Grafikteki ve kartlardaki ciro, raporlardaki ciroyla aynı hesaptır; iki sayı ayrışamaz.
- ✅ İstemci paketi büyümez; grafik tarayıcıda çalışan kod değildir.
- ✅ Bir KPI sorgusunun hatası sayfayı düşürmez, referansla izlenir.
- ⚠️ Ciro serisi satırları belleğe çeker. "Tüm zamanlar" seçimi, öncekinde olduğu gibi bütün satırları okur. Demo hacminde süreler PR açıklamalarında raporlanır.
- ⚠️ **Tarih indeksleri (tasarım 2-5):** `Shipment(shippedAt)`, `ReturnNote(createdAt)` ve `DoctorPayment(status, paidAt)` eklendi. Sonuncusu tek başına `status` indeksinin yerini aldı.
  - Ölçüm, geçici bir veritabanında yapıldı: 36 ay × 1000 sipariş, 72 bin sevk satırı, 18 bin tahsilat, 3 bin iade.
    - Planlayıcı üç indeksi de kullanıyor (tam tarama yerine bitmap index scan).
    - Tahsilat sorgusu 4,6 → ~2 ms, iade sorgusu 7,3 → ~5 ms (EXPLAIN ANALYZE, 7 koşu medyanı).
    - Sevk tabanlı sorgularda (ciro serisi, en çok sevk edilenler) uçtan uca fark gürültü içinde kaldı. Şirket ciro özeti ~190 ms.
  - Sevk sorgularında maliyet indekste değil:
    - Prisma, sayılan belge süzgecini ve tarih süzgecini `Shipment`'a iki ayrı JOIN yoluyla bağlıyor; sipariş yolu tam taranıyor.
    - İlişkiler ayrı sorgularda, büyük `IN` listeleriyle yükleniyor; toplama JS'te yapılıyor.
  - Bu hacmin (ayda ~1000 sipariş) üstüne çıkılırsa iyileştirme sorgu biçiminde yapılır: tek ilişki yolu ve ilişki yükleme stratejisi. Bu ayrı bir iştir ve ölçümle yapılır.

## Değerlendirilen alternatifler

- **Grafik kütüphanesi (Recharts, Chart.js).** Reddedildi: grafikler etkileşimsiz; istemci JS ve bağımlılık gereksiz. `ADR-009` de bileşen kütüphanesini reddetmişti.
- **Ciroyu SQL'de satır başına `ROUND` ile toplamak.** Reddedildi: ikinci hesap yolu olur (§0.4).
- **Geometriyi ve yüzdeyi `money.ts`'e koymak.** Reddedildi: `money.ts` tek çıkış noktasıdır ve aritmetik içermez. İstisna kendi dosyasında, kaynak taramasıyla sınırlı durur (X-5 eki).
- **Ekran genişliğine bağlı grid (`md:`/`lg:`; ilk plan).** Ölçümle reddedildi. 1024 px'te 5 kolonlu düzende ikincil kart 134 px, içerik alanı 100 px kalıyor. ₺5.432.109,87 16 px'te bile 110 px tutuyor. 1280 px'te de taban etiketi ikiye bölünüyor ("KDV" / "dahil") ve iskelet 44 px kayıyordu.
- **İstemci tarafı hata sınırı (React error boundary).** Reddedildi: SSR'da sunucu hatası istemci sınırına ulaşmadan en yakın Suspense'e düşer; başarısız kartı iskelete çevirir ve istemci JS ister. Sunucu kapsülü aynı X-3 desenini (sabit metin + referans + log) sağlar.
- **Hedef ilerlemesi için `BulletMicro`.** Yapılmadı: hedef verisi yok, D-4 kalıcı kapsam dışı (K-2).

## Açık uygulama kalemleri (atıf)

- 6 aylık geçmiş demo seed'i (tasarım 2-7).

## Geçerlilik sınırı

- Hedef/kota ya da etkileşimli grafik (tooltip, yakınlaştırma) gelirse bu ADR değiştirilmez, yerine yenisi yazılır (`README` §2.2).
- Ciro hesabının yolu değişirse (`hesaplaSatirTutarlari()`) seri de aynı yolu izler; ayrı bir seri hesabı açılmaz.
