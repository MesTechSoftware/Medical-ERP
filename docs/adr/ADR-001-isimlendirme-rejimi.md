# ADR-001 — İsimlendirme rejimi: karma

- **Durum:** ✅ Kabul edildi
- **Tarih:** 15.09.2026
- **Kaynak soru:** `FAZ1_UYGULAMA_KAPSAMI.md` §C-l
- **Bağlı KARARLAR maddeleri:** §4 (şema özeti) · D-2 (rol enum'u) · A-13 (`cari_tip`) · A-14 (belge önekleri) · §4 *"11 tek çağrı noktası fonksiyonu"* · `policy.ts` anahtarları (E-1, E-2, A-15, K-4 …)
- **Uygulandığı commit:** `CM` (Faz 1A) — hash `FAZ1_UYGULAMA_KAPSAMI.md` §A'da
- **Ek güncellemesi (16.09.2026 — karar değişmedi):** Ek, `CM`'e kadar dolan yaşayan bir tablodur.
  Üç değişiklik yapıldı: `netListPrice` satırı **yasak** olarak işaretlendi (§C-t) · `vatRate`
  yasağı `Product` ile sınırlandı · X-11/X-12'ye bağlı iki satır eklendi. *Aynı gün:* X-11/X-12
  kapandı; satırlar ✅ oldu ve iki 🟦 enum kataloğu Karar tablosuna eklendi. *Son hâli:* X-13…X-15
  ve ADR-005 satırları eklendi; `policy.ts` örneğine `finance.primOraniVarsayilan` girdi.

## Bağlam

KARARLAR tablo ve kolonları Türkçe adlarla anlatıyor (`Kullanici.aktif`, `Doktor.vkn_tckn`,
`fatura_*` …). Mevcut kod ise İngilizce `camelCase` kullanıyor (`User`, `netListPrice`,
`phoneNormalized` …). `CM` tek migration olduğu için adların **o commit'te** kesinleşmesi
gerekiyordu. Aksi hâlde iki sorun doğar:
- Yeniden adlandırma kuyruğu (rol string'leri, `BigInt` alanlar, `netMinPrice`, `vatRate` …) iki kez yazılır.
- Anti-şema testi (C8) hangi adı arayacağını bilemez.

## Karar

**Karma rejim.**

| Tür | Dil | Biçim | Örnek | Statü |
|---|---|---|---|---|
| Şema **tanımlayıcıları** (tablo, kolon) | İngilizce | `camelCase` (model `PascalCase`) | `User`, `lastSeenAt` | Eşleme tablosuyla (§Ek) |
| **Enum değerleri** | Türkçe, ASCII | `BUYUK_HARF_ALT_CIZGI` | `YONETICI` · `OPERASYON` · `SATICI` · `TUZEL_KISI` · `GERCEK_KISI` · `DOKTOR` · `BAYI` *(X-8)* · `NEGATIF_STOK` · `VADESI_GECMIS_HAREKET` · `SEVKIYAT`/`TAHSILAT`/`TERS_KAYIT`/`BORC`/`ALACAK` *(X-11 🟦)* · `CARI`/`ACILIS_STOGU` *(X-12 🟦)* | **Normatif** — KARARLAR'daki yazımıyla aynen |
| **11 tek çağrı noktası fonksiyonu** | Türkçe, ASCII | `camelCase` | `hesaplaDoktorBakiye` · `uretBelgeNo` · `hesaplaSatirTutarlari` · `cozumleBirimFiyat` · `hesaplaStok` · `hesaplaDoktorRisk` … | **Normatif** |
| **`policy.ts` anahtarları** | Türkçe, ASCII | noktalı `camelCase` | `auth.oturumHareketsizlikSaat` · `auth.girisDenemeSiniri` *(X-9)* · `pricing.varsayilanFiyatListesiKodu` *(X-10)* · `finance.primOraniVarsayilan` *(X-14)* · `zaman.saatDilimi` · `finance.nakitTevsikLimiti` | **Normatif** |
| **Belge önekleri** | Türkçe | büyük harf | `SIP` · `SVK` · `IAD` · `KNS` · `TRF` · `THS` · `ACL` · `VDF` · `DZL` | **Normatif** — müşterinin gördüğü şey |

**Okuma kuralı:** KARARLAR'daki Türkçe **tablo/kolon** adları **kavramsaldır**, normatif
değildir. KARARLAR §4'e 15.09.2026'da bu yönde redaksiyon notu kondu.

## Sonuçlar

- **Kavramsal → şema adı eşlemesi tek yerde tutulur:** bu ADR'nin ekindeki tablo. `CM` commit'i
  tabloyu **doldurmadan kapanmaz**. Çünkü anti-şema testinin *"… karşılığı"* diye bırakılan
  kalemleri (`FAZ1_UYGULAMA_KAPSAMI.md` §D.2) buradan beslenir.
- **Yeniden adlandırma kuyruğu tektir ve `CM` içindedir** (`FAZ1_UYGULAMA_KAPSAMI.md` §D.1 not 2).
  Rol string'leri **mekanik** olarak değişir: `ADMIN`→`YONETICI`, `SELLER`→`SATICI`, `DEALER`
  düşer.
- **Anti-şema testi `lower(column_name)` ile karşılaştırır.** Prisma `camelCase` kolonları
  tırnaklı üretir; büyük/küçük harf varyantı listeden kaçmamalıdır.
- **Plan ve ayna dosyalarında** Türkçe kolon adı görüldüğünde kavram okunur, şema adı ekten alınır.

## Değerlendirilen alternatifler

- **Tamamen Türkçe şema.** Reddedildi. Bugünkü 25 modelin tamamı yeniden adlandırılırdı ve
  kuyruk `CM`'i şişirirdi. Ayrıca ASCII'ye indirilmiş Türkçe kolon adları okunabilirlik
  kazandırmaz.
- **Tamamen İngilizce (enum ve fonksiyonlar dahil).** Reddedildi. Enum değerleri ve belge
  önekleri müşterinin gördüğü ve dışa aktarımda çıkan değerlerdir (K-4). Fonksiyon adları da
  KARARLAR'da iş kuralının adıdır; çevirmek, karar metniyle kod arasındaki izlenebilirliği
  koparır (X-7).

## Açık uygulama kalemleri (atıf)

- Eşleme tablosunun doldurulması → `CM`.
- Anti-şema listesindeki *"karşılığı"* kalemleri → `FAZ1_UYGULAMA_KAPSAMI.md` §D.2.

## Geçerlilik sınırı

Rejim **kalıcıdır**. Canlıya çıkıştan sonra bir şema adını değiştirmek veri taşıma
migration'ıdır; o hâlde yeni ADR gerekir.

---

## Ek · Ad eşleme tablosu

> **Durum: kısmi.** Aşağıdaki satırlar yalnız **bugün başka bir belgede adı sabitlenmiş** olanlardır.
> Geri kalanı `CM` commit'inde doldurulur. **`CM` bu tablo tamamlanmadan kapanmaz.**

| KARARLAR kavramı | Şema adı | Tür | Kaynak |
|---|---|---|---|
| `tenant_id` | `tenantId` | 🚫 yasak | §D.2 anti-şema |
| `Kullanici.son_giris_at` | `lastLoginAt` | 🚫 yasak | §D.2 · E-2 §(9) |
| `Doktor.kurum_id` (kurum bağı) | `institutionId` | 🚫 yasak | §D.2 · A-9 |
| `OrderItem.iskonto_oran` | `discountRate` | 🚫 yasak | §D.2 · X-5 |
| lot / seri / GTIN / SKT | `lotNumber` · `serialNumber` · `gtin` · `expiryDate` | 🚫 yasak | §D.2 · K-10 |
| `dosya_url` / `ek_var_mi` | `fileUrl` · `hasAttachment` | 🚫 yasak | §D.2 · E-3 |
| `Urun.kdv_orani` (decimal) | `Product.vatRate` *(bugünkü ad — **yalnız `Product`'ta** yasak)* | 🚫 yasak | C-6 · GÇ-10 · §C-t |
| `OrderItem.kdv_orani` (dondurulmuş oran) | *`CM`'de* — bugün `OrderItem.vatRate`; ad seçilirken yukarıdaki yasakla karışmamalı | ✅ konur | C-6 · §C-t |
| oturum son görülme zamanı | `lastSeenAt` | ✅ konur | §D.4 · ADR-003 |
| `Kullanici.aktif` | *`CM`'de* | ✅ konur | E-2 · §D.1 not 2 (`User.status` yerine) |
| `Kullanici.parola_hash` · `parola_degistirmeli` | *`CM`'de* | ✅ konur | E-2 |
| oturum tablosu | *`CM`'de* | ✅ konur | E-2 · ADR-003 |
| `Doktor` (cari) tablosu | *`CM`'de* — ⚠️ bugünkü `Doctor` adı, bayiyi de taşıyan tabloyu artık tam anlatmıyor; ad eşlemede **bilinçli** seçilir | ✅ konur | A-9 · **X-8** |
| `Doktor.hesap_sinifi` · enum `HesapSinifi` | *`CM`'de* (enum değerleri `DOKTOR`/`BAYI` normatif) | ✅ konur | **X-8** |
| bayi tabloları | `Dealer` · `DealerPrice` · `DealerShipment` · `DealerShipmentItem` · `DealerPayment` *(bugünkü adlar)* | 🚫 yasak | **X-8** — tablo adı kontrolü |
| giriş denemesi tablosu | `LoginAttempt` *(bugünkü ad)* | 🚫 yasak | **X-9** — tablo adı kontrolü |
| `FiyatListesi` · `FiyatListesiSatir` · `Doktor.fiyat_listesi_id` | *`CM`'de* | ✅ konur | **X-10** |
| ürün kartındaki liste fiyatı | `Product.netListPrice` *(bugünkü ad)* | 🚫 yasak | **X-10** §(5) · GÇ-15 · §C-t |
| `CariHareket` (tip, yön, tutar, `vade_tarihi`, `belge_no`, bağlar) | *`CM`'de* | ✅ konur | **X-11** |
| `ImportParti` (`dosya_adi` dahil) · beş tabloda parti FK | *`CM`'de* | ✅ konur | **X-12** |
| prim dönemi tabloları | `CommissionPeriod` · `CommissionAdjustment` *(bugünkü adlar)* | 🚫 kalkar | X-1 · GÇ-16 |
| saklı KDV/toplamlar · sipariş vadesi · tahsilat fatura no | `vatAmount` · `lineNetTotal` · `lineGrossTotal` · `netTotal` · `vatTotal` · `grossTotal` · `Order.dueDate` · `DoctorPayment.invoiceNo` | 🚫 kalkar | C-6 · A-7 · C-1 · GÇ-18/19/20 |
| devir izi · vade değişiklik izi | `DoctorAssignment` · `DueDateChange` *(bugünkü adlar; ikincisinin bağı cari harekete taşınır)* | ✅ konur | X-13 · X-15 |
| `Kullanici.prim_orani` · sevkiyat satırı `prim_orani` | `commissionRate` *(bugünkü ad, `Decimal(5,2)`)* · sevkiyat satırı *`CM`'de* | ✅ konur | X-14 |
| `Siparis` satıcı alanı (nullable) · `Doktor.telefon` (UNIQUE) · `klinik`/`bolge` (nullable) | `sellerId` · `phoneNormalized` · `clinic`/`region` *(bugünkü adlar)* | ✅ konur | X-13 · X-15 |
| saklı stok miktarı | `Product.stock` *(bugünkü ad)* | 🚫 yasak | ADR-005 · GÇ-17 |
| `Kurum` tablosu · `Yetki` tablosu · `OdemeYontemi.hesap_etiketi` | *`CM`'de* | 🚫 yasak | §D.2 |
| karekod · `Urun.uts_sinifi` · `UrunBarkod` · `Urun.barkod` · `dis_referans` · `aktarildi_mi` · `harici_fatura_no` · para birimi · stok tutar/maliyet · `Tahsilat.hesaba_gecti_mi` · `uyari_gosterildi_mi` | *`CM`'de* | 🚫 yasak | §D.2 (15.09 tamamlaması) |
| KARARLAR §4 *"Faz 1 şema özeti"*ndeki diğer tüm tablo ve kolonlar | *`CM`'de* | ✅ konur | KARARLAR §4 |
