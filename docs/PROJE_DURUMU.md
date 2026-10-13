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
| Kimlik doğrulama | Auth.js / NextAuth **v5 beta**, Credentials + bcryptjs, **JWT** — ⏳ *1B madde 4'te tamamen sökülür, yerine opak token + DB oturumu (`docs/adr/ADR-003`). Oturum tablosu (`Session`) şemada hazır, henüz kullanılmıyor.* |
| Doğrulama        | Zod 4 |
| Para             | **`Decimal`** — birim fiyat `Decimal(18,4)` · tutar `Decimal(18,2)` · oran `Decimal(5,2)` · miktar tam sayı (X-5). Ham aritmetik `hesaplaSatirTutarlari()` ve `cozumleBirimFiyat()` içinde; istemciye `formatla()` ile `string` gider; `.toNumber()`/`Number()`/`parseFloat` kaçışı **lint kuralıyla** yasak |
| Zaman            | An `timestamptz` (UTC), takvim günü `date`; yorum `Europe/Istanbul` (E-1); `TZ=UTC` CI, `docker-compose.yml` ve `.env.example`'da tanımlı |
| Test             | vitest (birim + entegrasyon şeridi) + Playwright 1.61 (e2e) |

Prisma client `src/generated/prisma/` altına üretilir (gitignored — taze klonda ve CI'da
`prisma generate` zorunlu). Bağlantı dizesi `prisma.config.ts`'tedir.

## Veri Modeli (`prisma/schema.prisma`)

**33 model + 14 enum**, **tek migration** (`20261004000000_init`). Ad rejimi `docs/adr/ADR-001`:
tablo/kolon İngilizce `camelCase`, enum değerleri Türkçe. Prisma'nın ifade edemediği kısıtlar
(BAYI satırında sahip boş `CHECK`, fiyat listesi tarih çakışması `EXCLUDE`) migration SQL'indedir.

| Grup | Modeller |
|---|---|
| Kimlik | `User` (rol `YONETICI`/`OPERASYON`/`SATICI`, `isActive`, `mustChangePassword`, `commissionRate`) · `Session` *(1B madde 4)* |
| Tanım tabloları | `TaxRate` · `PaymentMethod` · `Carrier` · `StockLocation` · `StockAdjustmentReason` · `DocumentCounter` |
| Cari | `Doctor` (`accountClass` DOKTOR/BAYI, `partyType`, `taxId`, fatura alanları, `creditLimit`, `paymentTermDays`, `priceListId`) · `DoctorAssignment` · `LedgerEntry` (cari hareket — X-11) · `DueDateChange` |
| Ürün ve fiyat | `Product` (fiyat ve stok kolonu yok) · `PriceList` · `PriceListItem` |
| Stok | `StockMovement` · `StockTransfer` (+ satır) · `StockAdjustment` (+ satır) · `ConsignmentIssue` (+ satır) |
| Satış | `Order` (`stage` TEKLIF/SIPARIS, `paymentTermDays`) · `OrderItem` (fiyat ve KDV oranı donar) · `Shipment` (+ `ShipmentItem` — kısmi sevkiyat şeması; `externalDispatchNo`, `deliveryAddress`) · `ReturnNote` (+ satır) |
| Tahsilat | `DoctorPayment` (`paymentMethodId`, komisyon) |
| Denetim ve iz | `ApprovalBlock` (onay bloğu — A-8) · `ImportBatch` · `ExportLog` · `AuditLog` |

**Şemada var, davranışı 1B'de:** cari hareket, belge numarası sayacı, oturum, onay bloğu,
iade/konsinye/transfer/stok düzeltme belgeleri, kısmi sevkiyat, fiyat listesi ekranı, dışa
aktarım kütüğü, import partisi, `OPERASYON` rolünün yetkileri. Hangi tablonun hangi 1B
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
- ✅ Ürünler — liste / yeni / düzenle: ad, kod, **KDV oranı tanım tablosundan** (`taxRateId`), liste fiyatı (varsayılan fiyat listesine yazılır), başlangıç stoğu. *Taban fiyat alanı yok.*
- ✅ Stok — giriş + hareketler (miktar hareketlerden türer — ADR-005)
- ✅ Satıcılar — liste / yeni / düzenle / detay (prim oranı dahil)
- ✅ Doktorlar — liste / detay (cari, sipariş/tahsilat geçmişi) + satıcı devri *(fatura bilgileri formu, tek cari ekranı ve bayi süzgeci 1B madde 7)*
- ✅ Siparişler — liste / detay + durum yönetimi *(tek parça sevkiyat — kısmi sevkiyat 1B)*
- ✅ Kargo — sevkiyat: kargo firması + takip no **elle**; gönderi tarihi otomatik. *İrsaliye no alanı şemada var, formda yok (1B). Takip linki şablonu ekranda kullanılmıyor.*
- ✅ Tahsilatlar — tutar, tarih, **ödeme yöntemi** (tanım tablosu), referans no; siparişe eşlenmez
- ✅ Raporlar — satıcı performansı, doktor ciro sıralaması, toplam ciro. Ciro **KDV hariç**, tahsilat **KDV dahil**, taban kolon başlığında *(tahsilat oranı, kanal ve yaşlandırma raporları söküldü)*
- ✅ Denetim kaydı — salt okunur, filtreli
- ❌ Primler · Kongreler · Bayiler · Bayi sevkiyat — **söküldü** (C2, C4, C5). Yeni prim (sevkiyat bazlı) 1B madde 3; kongre Faz 3+ modül; bayi = `Doctor` satırı (1B madde 7)

**Satıcı** (`src/app/(seller)/`)
- ✅ Siparişlerim — liste / yeni / detay; fiyat girişi KDV hariç, tek fiyat yolu `cozumleBirimFiyat()`
- ✅ Doktorlarım — liste / yeni / düzenle (yalnız kendi portföyü)
- ✅ Hesabım — doktor sayısı + ortalama iskonto
- ❌ Primlerim · Kongreler — söküldü

**Ortak:** rol bazlı kök yönlendirme · giriş · KVKK/gizlilik · `error.tsx` / `loading.tsx` /
`not-found.tsx` · `scripts/backup.ts` (`pg_dump`).

## Kodda uygulanmış iş kuralları (seçme)

- **Stok** saklanmaz, hareketlerden türer: tek `hesaplaStok(urun, konum?, tarih?)` (B-4, ADR-005). Negatife düşüş engellenmez (yumuşak kısıt). *Onay bloğu izi 1B'de (R-10).*
- **Fiyat** tek yoldan çözülür: `cozumleBirimFiyat()` ilk sürümü — cariye atanmış liste, yoksa varsayılan liste (X-10). *Barem ve tarih 1B madde 5.*
- **Satır tutarı** tek fonksiyonda: `hesaplaSatirTutarlari()` — satır bazında yuvarlama, belge toplamı = Σ satır (C-6). KDV saklanmaz.
- **Sahiplik** tek yazma noktasından: `degistirDoktorSahibi()` (X-17); BAYI satırında sahip boş — DB `CHECK`.
- **Belge numarası** `uretBelgeNo()` ile, global tekil; eşzamanlılık testli. *X-2 kabul testi 1B madde 2.*
- **Cari bakiye** saklanmaz, hesaplanır (RULE-08).
- **Bir doktorun tek sahibi satıcı**; sahibi olmayan satıcı sipariş açamaz (RULE-02).
- **Denetim izi** merkezî ve sanitize'lı (RULE-13).
- **Giriş deneme sınırı** bellek içi sayaç — eşikler `policy.auth` (ADR-004, X-9).
- **Config** `src/lib/policy.ts`'te, kodda; admin ayar ekranı yok (§0.1.1).
- **Vade:** sipariş vade gün sayısı taşır, varsayılan `policy.finance.odemeVadesiGunVarsayilan` (30); üst sınır yok.

## Sürüm Kontrolü, CI ve Test

- **Git:** `origin` = GitHub `MesTechSoftware/Medical-ERP`. `docs/` sürüm kontrolünde (C0). İş akışı: branch → PR → `main`.
- **CI** (`.github/workflows/ci.yml`, push `main` + tüm PR'lar; PostgreSQL 17 servisi): `npm ci` → `prisma generate` → `migrate deploy` → **typecheck + lint + birim + entegrasyon + e2e**. Son koşu **yeşil** — `main` @ `2265b8d`, run `38340305135`.
- **Test sayıları (13.10.2026 ölçümü):**

  | Şerit | Dosya | Test | Komut |
  |---|---|---|---|
  | Birim | 10 | **81** | `npm test` |
  | Entegrasyon | 8 | **58** | `npm run test:integration` |
  | E2E | — | **32** | `npm run test:e2e` |

  Entegrasyon dosyaları: `db` · `collections` · `orders` · `reports-service` · `sahiplik` ·
  `kisitlar` · `anti-sema` · `referans-seed`.
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
npm run dev              # http://localhost:3000
```

Demo hesapları (yalnız `db:seed:demo`, üretime taşınmaz): `admin@medikal.local` / `admin123` ·
`ahmet@…`, `ayse@…`, `mehmet@…` / `satici123`.

## Faz 1B'de gelecekler (henüz kodda yok)

Sıra ve ayrıntı `FAZ1_UYGULAMA_KAPSAMI.md` §D.3'tedir. Özetle: tek çağrı noktası
fonksiyonlarının tamamı ve sayılan belgeler filtresi · belge numarası kabul testi · sevkiyat
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
