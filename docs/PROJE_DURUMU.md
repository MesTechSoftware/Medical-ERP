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
- ✅ Ürünler — liste / yeni / düzenle: ad, kod, **KDV oranı tanım tablosundan** (`taxRateId`), liste fiyatı (varsayılan fiyat listesine yazılır), başlangıç stoğu. *Taban fiyat alanı yok.*
- ✅ Stok — giriş + hareketler (miktar hareketlerden türer — ADR-005)
- ✅ Kullanıcılar (`/users`, eski Satıcılar — 1B-4b, 20.10.2026) — liste (rol kolonu) / yeni (rol seçimi, geçici parola, gerekçe) / düzenle (geçici parola atama, pasifleştirme; rol değişmez) / satıcı detayı. Silme yok (E-2 §(6)). Son aktif yönetici ve kendini pasifleştirme sert kısıt (`kullanici.ts`, SERIALIZABLE)
- ✅ Parola değiştirme (`/parola-degistir`) — geçici parolalı kullanıcı her guard'da buraya yönlenir (E-2-7); politika `parola.ts` (8 karakter + yaygın parola listesi)
- ✅ Doktorlar — liste / detay (cari, sipariş/tahsilat geçmişi) + satıcı devri *(fatura bilgileri formu, tek cari ekranı ve bayi süzgeci 1B madde 7)*
- ✅ Siparişler — liste / detay + durum yönetimi *(tek parça sevkiyat — kısmi sevkiyat 1B)*
- ✅ Kargo — sevkiyat: kargo firması + takip no **elle**; gönderi tarihi otomatik. *İrsaliye no alanı şemada var, formda yok (1B). Takip linki şablonu ekranda kullanılmıyor.*
- ✅ Tahsilatlar — tutar, tarih, **ödeme yöntemi** (tanım tablosu), referans no; siparişe eşlenmez
- ✅ Raporlar — **dönem seçimli** (varsayılan içinde bulunulan ay, "tüm zamanlar" ayrı seçim — X-1): satıcı başına ciro, **hakediş**, tahsilat; doktor ciro sıralaması; dönem cirosu. Ciro **KDV hariç**, tahsilat **KDV dahil**, taban kolon başlığında *(tahsilat oranı, kanal ve yaşlandırma raporları söküldü)*. Yalnız `YONETICI`
- ✅ Denetim kaydı — salt okunur, filtreli
- ❌ Primler · Kongreler · Bayiler · Bayi sevkiyat — **söküldü** (C2, C4, C5). Yeni hakediş (sevkiyat satırına donmuş oran) raporda — 1B madde 3c; *oranı satıra yazan sevkiyat akışı 1B madde 7*; kongre Faz 3+ modül; bayi = `Doctor` satırı (1B madde 7)

**Satıcı** (`src/app/(seller)/`)
- ✅ Siparişlerim — liste / yeni / detay; fiyat girişi KDV hariç, tek fiyat yolu `cozumleBirimFiyat()`
- ✅ Doktorlarım — liste / yeni / düzenle (yalnız kendi portföyü)
- ✅ Hesabım — doktor sayısı + ortalama iskonto
- ✅ Raporum — kendi dönem cirosu, hakedişi, tahsilatı (D-2 §(1); kısıt sorguda)
- ❌ Primlerim · Kongreler — söküldü

**Operasyon** (`OPERASYON`, yönetim rota grubu — D-2 §(1) + 17.10 eki, 1B madde 3c): Dashboard (ana sayfa) · siparişler (hazırla/teslim/iptal) · kargo · tahsilat (kayıt/iptal) · stok girişi · doktorlar, ürünler, satıcılar **salt okuma**. Raporlar ve denetim kaydı kapalı; devir, vade, ürün tanımı ve kullanıcı yönetimi `YONETICI`'de. *Sipariş girişi ve cari açma ekranı 1B madde 7.*

**Ortak:** rol bazlı kök yönlendirme · giriş · KVKK/gizlilik · `error.tsx` / `loading.tsx` /
`not-found.tsx` · `scripts/backup.ts` (`pg_dump`).

## Kodda uygulanmış iş kuralları (seçme)

- **Stok** saklanmaz, hareketlerden türer: tek `hesaplaStok(urun, konum?, tarih?)` (B-4, ADR-005). Negatife düşüş engellenmez (yumuşak kısıt). *Onay bloğu izi 1B'de (R-10).*
- **Fiyat** tek yoldan çözülür: `cozumleBirimFiyat()` ilk sürümü — cariye atanmış liste, yoksa varsayılan liste (X-10). *Barem ve tarih 1B madde 5.*
- **Satır tutarı** tek fonksiyonda: `hesaplaSatirTutarlari()` — satır bazında yuvarlama, belge toplamı = Σ satır (C-6). KDV saklanmaz.
- **Sahiplik** tek yazma noktasından: `degistirDoktorSahibi()` (X-17); BAYI satırında sahip boş — DB `CHECK`.
- **Belge numarası** `uretBelgeNo()` ile, global tekil; eşzamanlılık testli. *X-2 kabul testi 1B madde 2.*
- **Sayılan belgeler** tek filtreden (`sayilanBelgeler`, A-5 — 1B madde 1, 14.10.2026): `TEKLIF` ve `IPTAL` sipariş, bedelsiz satır, `ACILIS`/`VADE_FARKI` cari hareketi, konsinye/transfer/düzeltme stok hareketi sayılmaz. Ciro raporları (satıcı, doktor, toplam) bu filtreyle okur. *Dashboard'daki iş kuyruğu sayıları (bugünkü/bekleyen/hazırlanan sipariş) filtre dışıdır — operasyon sayımıdır, ciro değil.*
- **Cari bakiye** saklanmaz, hesaplanır (RULE-08): tek `hesaplaDoktorBakiye(doktor, tarih?)` (K-2 — 1B madde 1, 14.10.2026). Bütün hareket tipleri girer; doktor detayında tutar mutlak değer + yön etiketiyle gösterilir (avans çıplak negatif değil). `LedgerEntry` toplamını başka dosyanın alması birim testte kırmızıdır.
- **Kredi riski** tek `hesaplaDoktorRisk(doktor)` (A-12 — 1B madde 1, 16.10.2026): cari bakiye + `ONAYLI`, iptal edilmemiş siparişlerin sevk edilmemiş miktarının brüt tutarı. `kredi_limiti` boşsa limitsiz; aşım bilgi kademesidir, işlemi durdurmaz. *Henüz bir ekran çağırmıyor; uyarı gösterimi 1B madde 7.*
- **Stok yazımı** tek `stokHareketiYaz()` (B-4, ADR-005 §3, ADR-008 — 1B madde 1, 16.10.2026): ürün satırları id sırasıyla kilitlenir, stok kilit altında okunur, hareket yazılır. Negatife düşüş engellenmez; `NEGATIF_STOK` kalemi döner ama **henüz `OnayBlogu`'na yazılmıyor** (#6). Başka dosyada stok hareketi yazımı ve `FOR UPDATE` birim testte kırmızıdır.
- **Onay bloğu** (A-8 — 1B madde 1, 16.10.2026): `acikBlokVarMi()` her kural için son bloğa bakar (`RED` ve kararsız durdurur, `ONAY` geçirir); `blokKontrolleriniCalistir()` X-4 sonucunu döner ve bloğu yazar. **Henüz hiçbir akış çağırmıyor** — sipariş/sevkiyat bağlantısı ve onay ekranı 1B madde 4/7. `OnayBlogu`'nu başka dosyanın yazması birim testte kırmızıdır.
- **Modül durumu** tek `modulAcikMi(kod)` (K-9, §1.3 — 1B madde 1, 16.10.2026): `policy.modules`'tan okur; kongre kapalı (K-6). `policy.modules`'u başka dosyanın okuması birim testte kırmızıdır. **1B madde 1 bu işle kapandı.**
- **Belge numarası** (A-14 — 1B madde 2, 16.10.2026): `uretBelgeNo(onek, tx)` sayaç satırı kilidi altında, belgeyi yazan transaction'da; yıl İstanbul takvim yılı. **X-2 kabul testi yeşil:** tahsilat yazılamazsa `THS` numarası harcanmaz; `BAYI` tahsilatı aynı yoldan. Sayaç tablosuna başka dosyanın dokunması, elle kurulmuş numara ve ikinci tahsilat yolu birim testte kırmızıdır. *Tahsilatın `TAHSILAT` cari hareketi hâlâ yazılmıyor — 1B madde 7 (R-11).*
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
npm run dev              # http://localhost:3000
```

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
