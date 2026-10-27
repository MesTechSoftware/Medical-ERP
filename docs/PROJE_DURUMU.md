# Proje Durumu — Medikal Satış Operasyon Yönetim Sistemi

_Son güncelleme: 2026-10-13 · Sürüm: 3.0 · Durum: **Faz 1A kapandı (söküm + şema)** · Faz 1B (yeniden inşa) başlamadı · canlı veri yok_

> **Bu dosya kodda fiilen ne varsa onu anlatır** (`YOL_HARITASI.md` §7.1 — Sınıf 3, ayna).
> Ticari/kapsam kararları burada tekrarlanmaz; kaynak `KARARLAR.md`'dir. Kararlaştırılmış ama
> henüz yazılmamış iş **yapılmış gibi gösterilmez.**
>
> **13.10.2026 — Faz 1A kapanışı.** Dosya 16.09'dan beri güncellenmemişti; `CM`, C8, C9 ve
> C10 hiç yansımamıştı (hâlâ `BigInt` kuruş, 25 model, eski migration ve "geri çekilecek"
> listesi yazıyordu). Bu sürüm `main` @ `2265b8d` ölçümüyle **yeniden yazıldı.** Önceki
> sürümlerin tarihçesi git geçmişindedir.
>
> ⚠️ **"✅" = bugün kodda çalışıyor.** "KARARLAR'a uygun" demek değildir; 1A eski arayüzü
> **kasıtlı olarak** korudu, yeni davranış 1B'dedir.

Merkezi depodaki medikal ürünlerin satıcılar üzerinden doktorlara ulaştırıldığı bir firmanın
(Anka West — referans müşteri) operasyonlarını tek sistemde toplayan full-stack web uygulaması.
Plan: `YOL_HARITASI.md` + `FAZ1_UYGULAMA_KAPSAMI.md`.

## Faz 1A'da ne değişti (özet)

1A **arayüz fazı değildi.** Amaç: eski arayüz yerinde kalsın, KARARLAR ile geçersizleşen iş
mantığı sökülsün, şema tek seferde doğru kurulsun. Bu yüzden ekranlar eskisiyle büyük ölçüde
aynı görünür; görünür değişiklik yalnız **kaybolan** menü ve alanlardır.

| Commit | İş |
|---|---|
| C0 | Depo hijyeni — `docs/` sürüm kontrolüne alındı, port uyumu |
| C1 | Entegrasyon test altyapısı (F-00) |
| C2–C7b | Söküm — kongre modülü · mahsup ve yaşlandırma · tahsilat bazlı prim ve dönem kapatma · bayi paneli ve `Dealer*` · KDV toggle'ı ve taban fiyat reddi · `SystemSetting` → `policy.ts` · `LoginAttempt` → bellek içi sayaç |
| `CM` | **Tek migration + parasal tip** — `BigInt` kuruş → `Decimal`; Faz 1 şemasının tamamı |
| C8 | Anti-şema testi (yasak tablo ve kolonlar) |
| C9 | Seed ayrımı — referans veri / demo veri |
| C10 | Belge kapanışı — `KABUL_KRITERLERI.md` iskeleti, `PRD_V2.md` arşive |

Geri çekme listesinin **20 kalemi** kapandı (`FAZ1_UYGULAMA_KAPSAMI.md` §A — hash'ler orada).
Tek istisna **GÇ-12**: kısmi sevkiyatın şeması var, tek parça sevkiyat varsayımı kodda 1B
madde 7'de kalkar. 1A çıkış kriterlerinin tamamı işaretli (`FAZ1_UYGULAMA_KAPSAMI.md` §D.2).

## Teknoloji

| Katman           | Seçim |
| ---------------- | ----- |
| Framework        | Next.js **16.2.10** (App Router, Server Components + Actions, Turbopack) |
| Dil / UI         | TypeScript 5, React **19.2.4**, Tailwind CSS 4 |
| Veritabanı       | **PostgreSQL 17** + Prisma **7.8** (driver adapter: `@prisma/adapter-pg` + `pg`) |
| Kimlik doğrulama | Kendi oturum tablosu (`Session`): opak 256-bit token, DB'de SHA-256 hash, `HttpOnly`/`SameSite=Lax` çerez; rol ve aktiflik her istekte okunur; 4 saat kayar / 12 saat mutlak; pasifleştirme oturumları aynı transaction'da iptal eder — *1B madde 4a, 19.10.2026 (`docs/adr/ADR-003`).* Parola bcryptjs. `next-auth` ve `AUTH_SECRET` yok; uygulamada route handler yok. `mustChangePassword` akışı ve son-yönetici kısıtı madde 4b'de (20.10.2026) |
| Doğrulama        | Zod 4 |
| Para             | **`Decimal`** — birim fiyat `Decimal(18,4)` · tutar `Decimal(18,2)` · oran `Decimal(5,2)` · miktar tam sayı (X-5). Ham aritmetik `hesaplaSatirTutarlari()` ve `cozumleBirimFiyat()` içinde; istemciye `formatla()` ile `string` gider; `.toNumber()`/`Number()`/`parseFloat` kaçışı **lint kuralıyla** yasak |
| Zaman            | An `timestamptz` (UTC), takvim günü `date`; yorum `Europe/Istanbul` (E-1); `TZ=UTC` CI, `docker-compose.yml` ve `.env.example`'da tanımlı |
| Test             | vitest (birim + entegrasyon şeridi) + Playwright 1.61 (e2e) |

Prisma client `src/generated/prisma/` altına üretilir (gitignored — taze klonda ve CI'da
`prisma generate` zorunlu). Bağlantı dizesi `prisma.config.ts`'tedir.

## Arayüz katmanı — görsel tasarım sistemi *(26.10.2026, `docs/adr/ADR-009`)*

> Bu bölüm 26.10.2026'da eklendi (Faz 1 → 2 arası revize turu, PR #57–#62); dosyanın geri
> kalanı yukarıdaki tarihli ölçümdür.

- **Tek token kaynağı `src/app/globals.css`:**
  - semantik renkler (nötr / olumlu / uyarı / hata / bilgi), markadan (`--color-brand`) ayrı ve WCAG AA;
  - yoğunluk: `<html data-density="compact">`. Masaüstü 32 px; telefon ve `pointer: coarse` cozy (kontrol 44 px, satır 48 px);
  - hareket eğrileri/süreleri ve `prefers-reduced-motion`.
- **Ortak bileşenler ve sınıflar:**
  - tablolar `.tablo-kutusu` + `.veri-tablosu` (sabit başlık ve ilk sütun, `.sayi`, telefonda `.oncelik-dusuk` gizli);
  - kontrol ve butonlar `src/components/stil.ts` (`KONTROL*`, `buton()`);
  - buton ikonları `src/components/Ikon.tsx` (27.10.2026): her eylem ikon + metin, lucide; emoji ve düz metin ok yok (ADR-009 madde 8);
  - form alanları `form.tsx` (masaüstünde etiket solda);
  - durum etiketi `StatusChip`, iki seviyeli kritik stok `stokDurumu()`;
  - yükleme iskeleti `Iskelet.tsx` + grup `loading.tsx`.
- **Mobil web aynı uygulamadır** (mobil uygulama değil — KARARLAR §3.5):
  - telefonda iki satırlı başlık ve kayan nav şeridi;
  - dokunma hedefleri ≥ 44 px, input yazısı ≥ 16 px;
  - `dvh` ve güvenli alan;
  - 390 / 412 / 810 px'te sayfa yatay kaymaz.
- **Zorlama:**
  - `src/lib/tasarim.test.ts`: kontrast, `data-density`, `100vh` yasağı, ham palet sınıfı yasağı, ikonsuz buton ve emoji yasağı;
  - Playwright `mobil-iphone` / `mobil-android` / `mobil-ipad` projeleri;
  - masaüstü ritim ve iskelet eşleşmesi: `e2e/admin/tasarim.spec.ts`;
  - E2E seçicileri stil sınıfına bağlanmaz.
- **2. tur — KPI kartları ve mikro grafikler** *(27.10.2026, `docs/adr/ADR-010`, PR #63–#71)*:
  - `KpiCard` / `KpiSatiri`: sayfa başına ≤ 4 KPI, ilki birincil; her KPI'da iyi yön ve boş
    davranışı zorunlu; değer kart genişliğine göre küçülür, taşmaz; yerleşim satırın kendi
    genişliğinden (container query). Karşılaştırma geçen ayın aynı günleriyle (K-1).
  - Mikro grafikler sunucuda saf SVG (`src/components/grafik/`): Sparkline, ColumnMicro, BarMicro,
    OranCubugu; istemciye JS yok. Geometri ve yüzde yalnız `src/lib/kpi/olcek.ts` (X-5 eki).
  - Ekranlar: dashboard ("bu ay"), raporlar ve Raporum (seçili dönem), doktor detayı (cari bakiye
    trendi). KPI sorguları mevcut tek hesap yollarından; her KPI kendi hata alanında (`kpiGetir`).
  - Tarih aralığı indeksleri: `Shipment(shippedAt)`, `ReturnNote(createdAt)`,
    `DoctorPayment(status, paidAt)`.
  - Demo geçmişi: `npm run db:seed:gecmis` (aşağıda, "Çalıştırma").

## Veri Modeli (`prisma/schema.prisma`)

**33 model + 14 enum**, **tek migration** (`20261004000000_init`). Ad rejimi `docs/adr/ADR-001`:
tablo/kolon İngilizce `camelCase`, enum değerleri Türkçe. Prisma'nın ifade edemediği kısıtlar
(BAYI satırında sahip boş `CHECK`, fiyat listesi tarih çakışması `EXCLUDE`) migration SQL'indedir.

| Grup | Modeller |
|---|---|
| Kimlik | `User` (rol `YONETICI`/`OPERASYON`/`SATICI`, `isActive`, `mustChangePassword`, `commissionRate`) · `Session` *(1B madde 4a)* |
| Tanım tabloları | `TaxRate` · `PaymentMethod` · `Carrier` · `StockLocation` · `StockAdjustmentReason` · `DocumentCounter` |
| Cari | `Doctor` (`accountClass` DOKTOR/BAYI, `partyType`, `taxId`, fatura alanları, `creditLimit`, `paymentTermDays`, `priceListId`) · `DoctorAssignment` · `LedgerEntry` (cari hareket — X-11) · `DueDateChange` |
| Ürün ve fiyat | `Product` (fiyat ve stok kolonu yok) · `PriceList` · `PriceListItem` |
| Stok | `StockMovement` · `StockTransfer` (+ satır) · `StockAdjustment` (+ satır) · `ConsignmentIssue` (+ satır) |
| Satış | `Order` (`stage` TEKLIF/SIPARIS, `paymentTermDays`) · `OrderItem` (fiyat ve KDV oranı donar) · `Shipment` (+ `ShipmentItem` — kısmi sevkiyat şeması; `externalDispatchNo`, `deliveryAddress`) · `ReturnNote` (+ satır) |
| Tahsilat | `DoctorPayment` (`paymentMethodId`, komisyon) |
| Denetim ve iz | `ApprovalBlock` (onay bloğu — A-8) · `ImportBatch` · `ExportLog` · `AuditLog` |

**Şemada var, davranışı 1B'de:** cari hareket, belge numarası sayacı, oturum, onay bloğu,
iade/konsinye/transfer/stok düzeltme belgeleri, kısmi sevkiyat, fiyat listesi ekranı, dışa
aktarım kütüğü, import partisi. Hangi tablonun hangi 1B
maddesinde canlanacağı: `FAZ1_UYGULAMA_KAPSAMI.md` §B tablosu.

**Şemada yok (anti-şema testiyle korunur — C8):** `tenantId` · lot/seri/GTIN/karekod/SKT ·
ÜTS sınıfı · barkod · `dis_referans`/`aktarildi_mi` · `harici_fatura_no` · para birimi ·
stok tutar/maliyet · `Dealer*` · `LoginAttempt` · `Product.stock`/`vatRate`/`netListPrice` ·
kongre tabloları · e-belge ve kargo modül tabloları (KARARLAR §1.3 §(10): modül yazıldığı gün girer).

⚠️ `Shipment.cargoStatus` ve `cargoLastQueriedAt` şemada var, **kodda kullanılmıyor**
(KARARLAR C-1 revizyon 3 / §1.3 §F açık bulgusu — kargo modülü çekirdek kaydına yazamaz).

## Ekranlar (bugün)

İki route grubu: `(admin)`, `(seller)`. `(dealer)` grubu C5'te söküldü.

**Yönetici** (`src/app/(admin)/`)
- ✅ Gösterge paneli — özet kartlar, kritik stok *(alacak tablosu, yaşlandırma, bayi kartları söküldü)*
- ✅ İçe Aktarım (`/imports`, yalnız yönetici — D-6, X-16, 1B-7f1): Excel şablonu sistemden üretilir; doğrula → önizle (özet) → yaz; hatalı satır varken hiçbir kayıt yazılmaz; parti listesi ve geri alma. Türler: **cari**, **ürün**, **fiyat listesi**, **açılış bakiyesi** (ACL hareketi; geri alınmaz, ters kayıtla düzeltilir), **açılış stoğu** (konum bazında; geri alınmaz, stok düzeltmesiyle düzeltilir). Şablon ekrandan ya da `npm run sablon:uret` ile.
- ✅ Fiyat Listeleri (`/price-lists`, yalnız yönetici — X-10, 1B-7e1): liste oluşturma; satır (ürün, min. adet barem, liste fiyatı) ekleme/güncelleme/silme; denetim kaydı. Tarihli satırlar salt okunur.
- ✅ Ürünler — liste / yeni / düzenle: ad, kod, **KDV oranı tanım tablosundan** (`taxRateId`), liste fiyatı (varsayılan fiyat listesine yazılır), başlangıç stoğu. *Taban fiyat alanı yok.*
- ✅ Stok — giriş + hareketler (miktar hareketlerden türer — ADR-005) · **konsinye çıkış** (doktor başına konsinye konumu) ve **depoya transfer** (A-4, B-4, 1B-7d3); konsinyedeki mal listesi. Mali sonucu yok · **stok düzeltme** (B-7, 1B-7d4, yalnız yönetici): çok satır, ± fark, sebep + açıklama, tutanak no; müşavir stok dosyasında yıl içi düzeltme satırları
- ✅ Kullanıcılar (`/users`, eski Satıcılar — 1B-4b, 20.10.2026) — liste (rol kolonu) / yeni (rol seçimi, geçici parola, gerekçe) / düzenle (geçici parola atama, pasifleştirme; rol değişmez) / satıcı detayı. Silme yok (E-2 §(6)). Son aktif yönetici ve kendini pasifleştirme sert kısıt (`kullanici.ts`, SERIALIZABLE)
- ✅ Parola değiştirme (`/parola-degistir`) — geçici parolalı kullanıcı her guard'da buraya yönlenir (E-2-7); politika `parola.ts` (8 karakter + yaygın parola listesi)
- ✅ Cariler (`/doctors`) — liste (Doktorlar · Bayiler · Sahipsiz · Eksik fatura bilgisi süzgeçleri) / detay (kart, cari, sipariş/tahsilat geçmişi) + satıcı devri. **Yönetici cari açar ve düzeltir** (1B-7e2): doktor ya da bayi, fatura bilgileri (VKN/TCKN doğrulamalı), fiyat listesi ataması, vade ve kredi limiti; değişiklik logu. Cari detayında **cari hareketler** (1B-7e3): yönetici vade değiştirir, elle vade farkı girer, açılış/vade farkı hareketini ters kayıtla çevirir
- ✅ Siparişler — liste / detay + durum yönetimi; **yönetici ve operasyon sipariş girer** (1B-8, doktor ya da bayi; doktor siparişi sorumlu satıcıya yazılır); sevk edilmiş sipariş iptal edilemez. **İade** (A-1, 1B-7d1): sipariş detayından, sevk edilen kalemlerden kısmi iade + zorunlu sebep; depoya stok girişi, cariye alacak, ciro ve hakediş iade tarihinde düşer
- ✅ Kargo — **kısmi sevkiyat** (A-3, 1B-7a): kalem başına sevk miktarı, kargo firması + takip no **elle**, isteğe bağlı müşteri irsaliye no; gönderi tarihi otomatik. Borç (`SEVKIYAT` cari hareket, vade sevk gününden), stok çıkışı ve prim oranı sevkiyatta doğar; sipariş stok düşürmez. *Takip numarası, firmanın takip linki şablonu (`{takip_no}`) tanımlıysa link olarak gösterilir (D-3, 1B-10).*
- ✅ Onay Bekleyenler (`/approvals`, yalnız yönetici — A-8, 1B-7c/7d2): **bedelsiz satır** (numune dışı sebep, sipariş girişinde) ve **negatif stok** (sevkiyatta). Onaylanmamış sipariş sevk edilemez. Negatif stok sevkiyatta denetlenir. Yönetici gerekçeyle sevk eder (blok anında onaylı); operasyonun gerekçesi siparişi onaya gönderir, karar verilene kadar sipariş sevk edilemez. Karar (onay/red) notla verilir.
- ✅ Tahsilatlar — tutar, tarih, **ödeme yöntemi** (tanım tablosu), referans no; siparişe eşlenmez
- ✅ Raporlar — **dönem seçimli** (varsayılan içinde bulunulan ay, "tüm zamanlar" ayrı seçim — X-1): satıcı başına ciro, **hakediş**, tahsilat; doktor ciro sıralaması; dönem cirosu. Ciro **KDV hariç**, tahsilat **KDV dahil**, taban kolon başlığında *(tahsilat oranı, kanal ve yaşlandırma raporları söküldü)*. Yalnız `YONETICI`
- ✅ Denetim kaydı — salt okunur, filtreli
- ❌ Primler · Kongreler · Bayiler · Bayi sevkiyat — **söküldü** (C2, C4, C5). Yeni hakediş (sevkiyat satırına donmuş oran) raporda — 1B madde 3c; oran sevkiyat satırına donar (1B-7a); kongre Faz 3+ modül; bayi = `Doctor` satırı (1B madde 7)

**Satıcı** (`src/app/(seller)/`)
- ✅ Siparişlerim — liste / yeni / detay; fiyat girişi KDV hariç, tek fiyat yolu `cozumleBirimFiyat()` (fiyat boş bırakılırsa carinin atanmış listesinden — 1B-9 düzeltmesi)
- ✅ Doktorlarım — liste / yeni / düzenle (yalnız kendi portföyü)
- ✅ Hesabım — doktor sayısı + ortalama iskonto
- ✅ Raporum — kendi dönem cirosu, hakedişi, tahsilatı (D-2 §(1); kısıt sorguda)
- ❌ Primlerim · Kongreler — söküldü

**Operasyon** (`OPERASYON`, yönetim rota grubu — D-2 §(1) + 17.10 eki, 1B madde 3c): Dashboard (ana sayfa) · siparişler (hazırla/teslim/iptal) · kargo · tahsilat (kayıt/iptal) · stok girişi · doktorlar, ürünler, satıcılar **salt okuma**. Raporlar ve denetim kaydı kapalı; devir, vade, ürün tanımı ve kullanıcı yönetimi `YONETICI`'de. *Sipariş girişi ve cari açma ekranı 1B madde 7.*

**Ortak:** rol bazlı kök yönlendirme · giriş · KVKK/gizlilik · `loading.tsx` / `not-found.tsx` ·
`scripts/backup.ts` (`pg_dump`). **Hata yüzeyi (X-3, 1B-4c):** `global-error.tsx` + kök `error.tsx` + sipariş/sevkiyat,
tahsilat, stok segmentlerinde `error.tsx` — tek ekran (`HataEkrani`: sabit metin, referans, ana sayfa); teknik hata
`instrumentation.ts`'ten tek JSON satırı (mesaj ve `meta` yok); denetim kaydı işle aynı transaction'da.
**İş sonucu (X-4, 1B-4d):** bütün server action'lar `IslemSonucu` döner (`durum` · `kademe` · bildirimler); kural
kodu kataloğu `sonuc.ts`, metni tek sözlük `sozluk.ts`; gösterim tek bileşen `Sonuc.tsx` — `SERT` alanın altında,
`YUMUSAK` gerekçe diyaloğu, `BILGI` kapatılabilir şerit *(son ikisinin üreticisi A-15 ve 1B-7)*.
**Taban etiketi (Ü-3, 1B-4e):** ekrandaki her para tutarı `Tutar` bileşeniyle, tabanı (*KDV hariç/dahil*) yanında
ya da kolon başlığında gösterilir; cari/tahsilat brüt, ciro/hakediş matrah, sipariş satırı matrah + toplam brüt.
**Nakit tevsik uyarısı (A-15, 1B-4f):** tahsilat kaydında aynı cari + aynı gün nakit toplamı limiti aşarsa `BILGI`
şeridi; kayıt engellenmez. Limit (`finance.nakitTevsikLimiti`) devreye almada dolar — bugün `null`, uyarı kapalı.
**Dışa aktarım (D-5 + K-4 §(6), 1B-6):** `/exports` (yalnız `YONETICI`) — cari hareket, tahsilat, sipariş, stok, doktor listesi,
fatura hazırlık (şablon `export.sablonTanimi` devreye almada girilir; o güne kadar reddedilir); Excel/CSV;
her indirme `ExportLog` kütüğüne yazılır, dosya sunucuda saklanmaz.
**Vade uyarısı (X-6 §(6), 1B-4g):** cari borçluyken vadesi geçmiş borç hareketi varsa doktor kartında ve tahsilat
sonucunda `BILGI` (en eski vade; tutar yok).

## Kodda uygulanmış iş kuralları (seçme)

- **Stok** saklanmaz, hareketlerden türer: tek `hesaplaStok(urun, konum?, tarih?)` (B-4, ADR-005). Negatife düşüş engellenmez (yumuşak kısıt). *Onay bloğu izi 1B'de (R-10).*
- **Fiyat** tek yoldan çözülür: `cozumleBirimFiyat(urun, cari, { miktar, gun })` — cariye atanmış liste, yoksa varsayılan liste (X-10); o günde geçerli satırlardan miktarı karşılayan en yüksek barem (B-5, B-6). Uygun satır yoksa `SERT` *fiyat çözümlenemedi*; düşüş yok.
- **Satır tutarı** tek fonksiyonda: `hesaplaSatirTutarlari()` — satır bazında yuvarlama, belge toplamı = Σ satır (C-6). KDV saklanmaz.
- **Sahiplik** tek yazma noktasından: `degistirDoktorSahibi()` (X-17); BAYI satırında sahip boş — DB `CHECK`.
- **Belge numarası** `uretBelgeNo()` ile, global tekil; eşzamanlılık testli. *X-2 kabul testi 1B madde 2.*
- **Sayılan belgeler** tek filtreden (`sayilanBelgeler`, A-5 — 1B madde 1, 14.10.2026): `TEKLIF` ve `IPTAL` sipariş, bedelsiz satır, `ACILIS`/`VADE_FARKI` cari hareketi, konsinye/transfer/düzeltme stok hareketi sayılmaz. Ciro raporları (satıcı, doktor, toplam) bu filtreyle okur. *Dashboard'daki iş kuyruğu sayıları (bugünkü/bekleyen/hazırlanan sipariş) filtre dışıdır — operasyon sayımıdır, ciro değil.*
- **Cari bakiye** saklanmaz, hesaplanır (RULE-08): tek `hesaplaDoktorBakiye(doktor, tarih?)` (K-2 — 1B madde 1, 14.10.2026). Bütün hareket tipleri girer; doktor detayında tutar mutlak değer + yön etiketiyle gösterilir (avans çıplak negatif değil). `LedgerEntry` toplamını başka dosyanın alması birim testte kırmızıdır.
- **Kredi riski** tek `hesaplaDoktorRisk(doktor)` (A-12 — 1B madde 1, 16.10.2026): cari bakiye + `ONAYLI`, iptal edilmemiş siparişlerin sevk edilmemiş miktarının brüt tutarı. `kredi_limiti` boşsa limitsiz; aşım bilgi kademesidir, işlemi durdurmaz. *Henüz bir ekran çağırmıyor; uyarı gösterimi 1B madde 7.*
- **Stok yazımı** tek `stokHareketiYaz()` (B-4, ADR-005 §3, ADR-008 — 1B madde 1, 16.10.2026): ürün satırları id sırasıyla kilitlenir, stok kilit altında okunur, hareket yazılır. Negatife düşüş engellenmez; `NEGATIF_STOK` kalemi döner ama **henüz `OnayBlogu`'na yazılmıyor** (#6). Başka dosyada stok hareketi yazımı ve `FOR UPDATE` birim testte kırmızıdır.
- **Onay bloğu** (A-8 — 1B madde 1, 16.10.2026): `acikBlokVarMi()` her kural için son bloğa bakar (`RED` ve kararsız durdurur, `ONAY` geçirir); `blokKontrolleriniCalistir()` X-4 sonucunu döner ve bloğu yazar. **Henüz hiçbir akış çağırmıyor** — sipariş/sevkiyat bağlantısı ve onay ekranı 1B madde 4/7. `OnayBlogu`'nu başka dosyanın yazması birim testte kırmızıdır.
- **Modül durumu** tek `modulAcikMi(kod)` (K-9, §1.3 — 1B madde 1, 16.10.2026): `policy.modules`'tan okur; kongre kapalı (K-6). `policy.modules`'u başka dosyanın okuması birim testte kırmızıdır. **1B madde 1 bu işle kapandı.**
- **Belge numarası** (A-14 — 1B madde 2, 16.10.2026): `uretBelgeNo(onek, tx)` sayaç satırı kilidi altında, belgeyi yazan transaction'da; yıl İstanbul takvim yılı. **X-2 kabul testi yeşil:** tahsilat yazılamazsa `THS` numarası harcanmaz; `BAYI` tahsilatı aynı yoldan. Sayaç tablosuna başka dosyanın dokunması, elle kurulmuş numara ve ikinci tahsilat yolu birim testte kırmızıdır. Tahsilat aynı `THS` numarasıyla `TAHSILAT` cari hareketi yazar; iptal `TERS_KAYIT`'tır (1B-7b).
- **Doktor kapsamı** tek `kapsamliDoktorlariGetir(kullanici)` (D-2 §(3), X-13 §(1) — 1B madde 3a, 17.10.2026): `SATICI` yalnız sahibi olduğu `DOKTOR` carilerini görür; `YONETICI` ve `OPERASYON` hepsini. Satıcı ekranlarının doktor okumaları (liste, düzenleme, sipariş formu, hesabım, doktor güncelleme, sipariş kaydı) bu süzgeçten geçer; kapsam dışındaki cari "portföyünüzde değil" döner, varlığı ima edilmez. Satıcı rota grubunda elle sahip süzgeci birim testte kırmızıdır.
- **Doktor sahipliği** tek `degistirDoktorSahibi()` (X-17 — 1B madde 3b, 17.10.2026): doktor satırları id sırasıyla kilitlenir (ADR-008: doktor → ürün → sayaç); iz satırı ve denetim kaydı aynı transaction'da. Sipariş kaydı sahibi kilit altında yeniden okur — arada devir tamamlandıysa reddedilir (`SAHIP_DEGISTI`). Yönetici doktor listesinden **çoklu seçimle** devreder ya da sahipsiz bırakır; listede **Sahipsiz** süzgeci var. Doktoru olan satıcı pasifleştirilirken portföy seçimi (tek satıcıya devret / sahipsiz bırak) ve gerekçe zorunlu. Sahip alanına başka dosyanın yazması birim testte kırmızıdır.
- **Satıcı raporu** tek `getSellerReports(kullanici, { baslangic, bitis })` (X-1 + D-2 — 1B madde 3c, 17.10.2026): dönem zorunlu; ciro sevkiyat tarihiyle siparişin satıcısına, hakediş = satır matrahı × donmuş oran (`hesaplaSatirTutarlari()`), tahsilat tahsilat tarihiyle **tahsilat anındaki sahibe** (iz kaydından). `SATICI` yalnız kendi satırını alır, `OPERASYON` alamaz.
- **Ekran matrisi** sunucuda (D-2 — 1B madde 3c): yönetim grubu `requireStaff()` (YONETICI + OPERASYON), yalnız yöneticinin işleri `requireAdmin()`; her action'ın guard'ı `yetki.test.ts`'teki matrise karşı birim testte denetlenir.
- **Bir doktorun tek sahibi satıcı**; sahibi olmayan satıcı sipariş açamaz (RULE-02).
- **Denetim izi** merkezî ve sanitize'lı (RULE-13).
- **Giriş deneme sınırı** bellek içi sayaç — eşikler `policy.auth` (ADR-004, X-9).
- **Config** `src/lib/policy.ts`'te, kodda; admin ayar ekranı yok (§0.1.1).
- **Vade:** sipariş vade gün sayısı taşır, varsayılan `policy.finance.odemeVadesiGunVarsayilan` (30); üst sınır yok.

## Sürüm Kontrolü, CI ve Test

- **Git:** `origin` = GitHub `MesTechSoftware/Medical-ERP`. `docs/` sürüm kontrolünde (C0). İş akışı: branch → PR → `main`.
- **CI** (`.github/workflows/ci.yml`, push `main` + tüm PR'lar; PostgreSQL 17 servisi): `npm ci` → `prisma generate` → `migrate deploy` → **typecheck + lint + birim + entegrasyon + e2e**. Son koşu **yeşil** — `main` @ `2265b8d`, run `38340305135`.
- **Test sayıları (17.10.2026 ölçümü — birim ve entegrasyon koşuldu; e2e sayısı `--list` ile, koşusu CI'da):**

  | Şerit | Dosya | Test | Komut |
  |---|---|---|---|
  | Birim | 14 | **109** | `npm test` |
  | Entegrasyon | 15 | **128** | `npm run test:integration` |
  | E2E | 16 | **45** | `npm run test:e2e` |

  Entegrasyon dosyaları: `db` · `collections` · `orders` · `reports-service` · `sahiplik` ·
  `kisitlar` · `anti-sema` · `referans-seed` · `sayilan-belgeler` · `bakiye` · `risk` · `stok` · `onay-blogu` · `belge-no` · `kapsam`.
  ⚠️ Dokunulmadan kalan eski birim testleri (`doctor`, `pagination`, `phone`, `audit`) sistemin
  kanıtı değildir; 1A çıkışında yazılı olarak kabul edildi, kapanması 1B'nin işidir.
- **Üç veritabanı:** `medikal_dev` (geliştirme) · `medikal_test` (e2e, her koşuda reset) ·
  `medikal_itest` (entegrasyon; test başına `TRUNCATE`; `DATABASE_URL` `medikal_itest`
  içermiyorsa şerit koşmayı reddeder).
- **Faz 1'den itibaren her commit** lint + typecheck + test yeşil olmak zorundadır.

## Çalıştırma

```bash
npm install
npm run db:up            # PostgreSQL (docker compose, 5432)
npx prisma generate      # client gitignored — taze klonda zorunlu
npx prisma migrate deploy
npm run db:seed          # referans veri (canlıda da çalışır, hiçbir şey silmez)
npm run db:seed:demo     # demo verisi — yalnız geliştirme
DEMO_GECMIS=evet DEMO_GECMIS_HOST=localhost npm run db:seed:gecmis   # 6 aylık demo geçmişi (isteğe bağlı)
npm run dev              # http://localhost:3000
```

Demo geçmişi demo seed'inin üstüne çalışır: sipariş, sevk, teslim, iade, tahsilat ve stok girişi
uygulamanın kendi servislerinden yazılır ve geçmişe kaydırılır; sonda tutarlılık denetimi, ihlalde
hiçbir şey yazılmaz. Canlıda, bayraksız ya da izinli olmayan veritabanı sunucusunda, demo işareti
yokken ya da geçmiş zaten varken çalışmaz.

Demo hesapları (yalnız `db:seed:demo`, üretime taşınmaz): `admin@medikal.local` / `admin123` ·
`ahmet@…`, `ayse@…`, `mehmet@…` / `satici123`.

## Faz 1B'de gelecekler (henüz kodda yok)

Sıra ve ayrıntı `FAZ1_UYGULAMA_KAPSAMI.md` §D.3'tedir. Özetle: tek çağrı noktası
fonksiyonlarının kalanı *(sayılan belgeler filtresi ✅ 14.10)* · belge numarası kabul testi · sevkiyat
bazlı prim + üç rolün yetki matrisi · yeni oturum katmanı, hata/uyarı yüzeyi, taban etiketi,
tevsik ve vade uyarıları · fiyat hesabının tamamlanması · dışa aktarım + fatura hazırlık
çıktısı · stok düzeltme, iade/konsinye/transfer, kısmi sevkiyat, tek cari ekranı, fiyat listesi
ekranı, import · kabul senaryosu · `TRACEABILITY.md`'nin yeniden kurulması.

## Kapsam dışı / ertelenmiş (kodda yok)

- **e-Fatura / e-Arşiv / e-İrsaliye** — sistem e-belge kesmez. Entegrasyon **çekirdek sonrası ilk
  opsiyonel modül** (KARARLAR C-1 revizyon 2–3); kodda hiçbir parçası yok. Faz 1'de yalnız K-4 §(6)
  fatura hazırlık Excel çıktısı gelecek (1B madde 6).
- **Kargo API** — e-belge modülünden sonra gelen modül (D-3); bugün yalnız elle takip no.
- **ÜTS / izlenebilirlik** — ertelenmiş modül (K-10); şemada hiçbir alan yok.
- **Kongre ve teşvik** — söküldü; Faz 3+ modül olarak yeniden yazılır (K-6).
- **Bayi paneli** — Faz 3+ modül, yalnız Sınıf 1 (D-2 §(6)); bayi ticari ilişkisi çekirdekte `Doctor` satırı olarak kalır (X-8).
- **Bildirim** — opsiyonel modül (D-1). *Olay noktaları 1B'de.*
- **Çoklu depo** — şema destekler (`StockLocation`), Faz 1'de tek depo seed edilir.
- **Barkod / GTIN**, **kalıcı dosya eki** — kapsam dışı (B-3, E-3).
