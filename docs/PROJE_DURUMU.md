# Proje Durumu — Medikal Satış Operasyon Yönetim Sistemi

_Son güncelleme: 2026-09-16 · Sürüm: 2.5 · Durum: v2 fazları tamamlandı (temiz sayfa, canlı veri yok) · **KARARLAR uyum denetimi yapıldı** · **§D / ADR senkronizasyonu yapıldı**_

> **🔄 KARARLAR senkronizasyonu — 11.09.2026.** Bu dosya `KARARLAR.md` (ana kitap) baz alınarak
> güncellendi. Ticari/kapsam kararları burada **tekrarlanmaz**; kaynak KARARLAR'dır, buraya atıf yapılır.
> Bu dosya **fiilen ne varsa onu** anlatır — kararlaştırılan işler yapılmış gibi gösterilmez.
>
> **🔴 KARARLAR uyum denetimi — 13.09.2026.** Önceki tur bir şeyi eksik bıraktı: dosya, kararlaştırılan
> işleri "yapılmış gibi" göstermiyordu ama **bugün kodda olan yeteneklerin bir kısmının KARARLAR ile
> geçersizleştiğini** de söylemiyordu. Bu tur eklenenler:
> (1) her bölüme **⛔ geri çekilecek** işaretleri kondu — ayrıntı `FAZ1_UYGULAMA_KAPSAMI.md` §A;
> (2) "Faz 1 migration'ında eklenecek şema" bölümü **üç kalemden on bir tabloya** genişletildi
> (önceki hâli yalnız 09.09 turunda doğan eklemeleri sayıyordu, KARARLAR §4'ün tamamını değil);
> (3) parasal tip çelişkisi (`BigInt` kuruş ↔ `Decimal`) **açık madde** olarak işaretlendi.
>
> **🔄 §D / ADR senkronizasyonu — 15.09.2026 (kod değişmedi, envanter değişmedi).**
> `FAZ1_UYGULAMA_KAPSAMI.md` §D ve `docs/adr/`'de kapanan maddeler bu dosyadaki ⛔ işaretlerine
> işlendi: kimlik doğrulama yolu (**ADR-003**), migration stratejisi (**ADR-002**), ad rejimi
> (**ADR-001**), seed ayrımı (**C9**). `MEVCUT_SISTEM_DURUMU.md` (14.09 ölçümü, HEAD `3825241`)
> ile iki ayna farkı giderildi: **e2e sayısı 66** ve **`docs/` sürüm kontrolü dışında**.
> İki çelişki (**`LoginAttempt` ↔ E-2 §(8)** ve **bayi yönetim ekranları ↔ §D.1 C5**) **aynı gün
> karara bağlandı**: KARARLAR **X-8** (bayi = `Doktor` satırı, `hesap_sinifi = BAYI`) ve **X-9**
> (`LoginAttempt` kalkar, deneme sınırı bellek içi — ADR-004). ⛔ işaretleri buna göre konuldu;
> geri çekme listesi **GÇ-14** ile 14 kaleme çıktı. Aynı gün **X-10** de kapandı (cariye atanan
> fiyat listesi; `Product.netListPrice` kalkar → **GÇ-15**, liste **15 kalem**).
>
> **🔄 16.09.2026 — X-11 · X-12 ve PRD taraması (kod değişmedi, yalnız işaretler).**
> - Geri çekme listesi **GÇ-16…GÇ-20** ile **20 kalem** oldu. Bunlar prim dönem kapatma, negatif
>   stoğun sert reddi, saklı KDV/toplam alanları, siparişteki vade tarihi ve tahsilattaki fatura numarasıdır.
> - Eklenecek şemaya `CariHareket` ve `ImportParti` girdi (**15 tablo**).
> - *Aynı gün:* X-13 · X-14 · X-15 ve ADR-005 kapandı. Bugünkü sahiplik, satıcıya özel oran, vade izi
>   ve telefon kuralı **korunur**. `Product.stock` ⛔ kalkar (GÇ-17 genişledi).
> - `UYGULAMA_PLANI.md` arşiv statüsündedir (X-7 §(1)).
>
> ⚠️ **Bu dosyadaki "✅" işaretleri "bugün kodda çalışıyor" demektir, "KARARLAR'a uygun" demek
> değildir.** İkisi artık her yerde aynı şey değil.

Merkezi depodaki medikal ürünlerin ~10 satıcı üzerinden doktorlara ulaştırıldığı bir firmanın
operasyonlarını tek sistemde toplayan full-stack web uygulaması. v2 ile kapsam; **doktor cari
hesabı, vade ve tahsilat, satıcı primi, kongre bakiyesi defteri ve bayi kanalı** eklenerek
genişletildi. Bu dosya, projenin **o an fiilen ne içerdiğini** özetler. Kurulum ve iş kuralları
detayı için `README.md`'ye, faz faz uygulama için ~~`UYGULAMA_PLANI.md`~~ ⛔ *arşiv (X-7 §(1)) — plan `YOL_HARITASI.md` + `FAZ1_UYGULAMA_KAPSAMI.md`*.

## Teknoloji

| Katman           | Seçim                                                          |
| ---------------- | -------------------------------------------------------------- |
| Framework        | Next.js **16.2.10** (App Router, Server Components + Actions)  |
| Dil / UI         | TypeScript 5, React **19.2.4**, Tailwind CSS 4 (CSS-first)     |
| Veritabanı       | **PostgreSQL** + Prisma **7.8** (zorunlu driver adapter: `@prisma/adapter-pg` + `pg`) |
| Kimlik doğrulama | Auth.js / NextAuth **v5 beta**, Credentials + bcryptjs, JWT ⛔ *(yol belirlendi: `next-auth` **tamamen sökülür** — `docs/adr/ADR-003`)* |
| Doğrulama        | Zod 4                                                          |
| Test             | **vitest** (birim) + **Playwright 1.61** (e2e)                 |
| İkonlar          | `lucide-react` (sidebar / mobil nav)                          |

> ⛔ **JWT oturumu geri çekilecek** — E-2 §(4) **veritabanı oturumu** şart koşuyor: rol ve aktiflik
> her istekte kaynaktan okunur, token'da dondurulmaz (KARARLAR §5.6).
> **15.09.2026 — mekanizma `docs/adr/ADR-003`:** Auth.js/`next-auth` bağımlılığı **tamamen** kalkar;
> oturum kimliği 256-bit rastgele **opak token**, DB'de SHA-256 hash'i. **`AUTH_SECRET` düşer**
> (`.env.example:10`, `ci.yml:17`). Sıra: oturum tablosu `CM`'de (1A), mekanizma 1B madde 4'te —
> **1A boyunca uygulama bugünkü JWT ile çalışır** (R-4).
>
> **Para her yerde `BigInt` kuruş** (integer cents) olarak saklanır ve işlenir; yuvarlama tek
> kaynaktan (`money.ts` `divRound`, round-half-away-from-zero) yapılır.
> ⛔ **GÇ-13 — geri çekiliyor (KARARLAR X-5, 13.09.2026).** Parasal alanlar **`Decimal`** olur:
> birim fiyat `Decimal(18,4)` · tutar `Decimal(18,2)` · oran `Decimal(5,2)` · **miktar tam sayı**.
> Gerekçe hassasiyet değil: **ölçek kodda değil şemada yaşamalıdır** (§0.1 doğrulanabilirlik) ve
> K-4 §(6) ile veri artık dışarı çıkıyor.
> ⚠️ **Bedeli yazılı:** `BigInt`te tip hatası gürültülüdür (`TypeError`); `Decimal`de `Number(tutar)`
> **sessizce float'a düşer**. Telafi **teslim şartıdır**: ham aritmetik yalnız
> `hesaplaSatirTutarlari()` ve `cozumleBirimFiyat()` içinde · `no-restricted-syntax` lint kuralı
> CI'da · istemciye tek `formatla()` çıkışından **`string`** gider. Prisma client
> `src/generated/prisma/` altına üretilir (gitignored — CI'da `prisma generate` ile üretilmek
> zorunda). Bağlantı dizesi şemada değil `prisma.config.ts` içindedir.

## Veri Modeli (`prisma/schema.prisma`)

**25 model + 11 enum**, tek migration (`20260723175607_init_v2`).
⛔ **§C-m / `docs/adr/ADR-002`:** bu klasör `CM`'de **silinir**, yerine tek yeni `init` üretilir (fresh init — canlı/pilot veri yok).

> ⛔ işaretli kalemler **KARARLAR ile geçersizleşti**; Faz 1'de geri çekilecek veya yeniden
> tanımlanacak. Gerekçe ve sıra: `FAZ1_UYGULAMA_KAPSAMI.md` §A.

**Çekirdek:** User (ADMIN/SELLER/**DEALER** ⛔ GÇ-6/GÇ-7 → `YONETICI`/`OPERASYON`/`SATICI`,
`commissionRate`), Product (`netListPrice` ⛔ **GÇ-15** → varsayılan fiyat listesinin satırı (X-10), `netMinPrice`/taban ⛔ GÇ-8, `vatRate` ⛔ GÇ-10 →
`vergi_orani_id` FK; `stock` saklı miktar ⛔ **GÇ-17 / ADR-005** — stok hareketlerden türer), StockMovement,
Order (`netTotal`/`vatTotal`/`grossTotal` ⛔ **GÇ-18**, `dueDate` ⛔ **GÇ-19**), OrderItem (`vatAmount`/`lineNetTotal`/`lineGrossTotal` ⛔ **GÇ-18**), Shipment.
`User.commissionRate` → korunur, `Decimal(5,2)` olur (**X-14**); sabit %5 → `policy.ts`.

**Doktor & cari:** Doctor, DoctorAssignment (satıcı-doktor sahipliği/devri) — korunur (**X-13**), DoctorPayment (`invoiceNo` ⛔ **GÇ-20**),
PaymentAllocation (FIFO mahsup) ⛔ GÇ-3, DueDateChange (vade değişiklik izi) — korunur, bağı cari harekete taşınır (**X-15**).

**Prim:** CommissionPeriod (dönem kapanışı), CommissionAdjustment (sonraki döneme negatif düzeltme).
⛔ **GÇ-16: dönem kapatma, onay/ödeme durumları ve sonraki döneme düzeltme kalkar** (X-1 kapsam dışı).
⛔ **GÇ-1: matrah tanımı değişiyor** — hakediş tahsilatta değil **sevkiyat anında** doğar (X-1 §(7), A-3).

**Kongre:** Congress, CongressPackage, CongressRegistration, CongressLedger (FIFO bakiye defteri).
⛔ **GÇ-4/GÇ-5: defter, FIFO lot, 12 ay expiry ve doktor bazlı bakiye tamamen kaldırılıyor** (K-6 §(2)).
Modül yeniden yazılana kadar **kapalı teslim edilir** (`modules.congress = false`).

**Bayi:** Dealer, DealerPrice, DealerShipment, DealerShipmentItem, DealerPayment.
⛔ **GÇ-6: bayi *cari tipidir, kullanıcı değildir*** — `Role.DEALER` ve bayi paneli kaldırılır;
ticari ilişki (fiyat listesi, sevkiyat, ödeme) **kalır**, firma tarafından girilir (D-2 §(6)).
⛔ **15.09.2026 — X-8 (GÇ-6 genişledi):** beş `Dealer*` tablosunun **tamamı** kalkar; bayi `Doktor`
tablosunda **`hesap_sinifi = BAYI`** satırıdır. Sevkiyat ve ödeme genel belge akışlarına
(`SVK`/`THS`) katılır. Bayiye özel fiyat **cariye atanan fiyat listesidir** (X-10).

**Altyapı:** SystemSetting (vade üst sınırı vb. admin ayarları) ⛔ GÇ-11, LoginAttempt (rate-limit) ⛔ **GÇ-14 (X-9):** tablo kalkar; deneme sınırı **bellek içi** sayaçla (ADR-004 — Faz 1A C7b, tablo `CM`'de),
AuditLog (merkezî sanitize'lı denetim izi).

Enum'lar: `Role`, `EntityStatus`, `OrderStatus`, `StockMovementType`, `PaymentMethod`,
`PaymentStatus`, `CommissionStatus`, `CongressStatus`, `CongressRegistrationStatus`,
`CongressLedgerType`, `DealerShipmentStatus`.

## Yapılmış Ekranlar

İki rol bazlı route grubu: `(admin)`, `(seller)` — ayrı layout'lar. `(dealer)` grubu C5'te söküldü *(28.09.2026 — C5)*.

**Admin** (`src/app/(admin)/`)
- ✅ Dashboard — özet stat kartları, kritik stok, KDV dahil/hariç toggle · açık alacak, yaşlandırma ve satıcı bazlı alacak tablosu **söküldü** *(28.09.2026 — C3)*
  · bayi kanal ciro ve bayi alacağı kartları **söküldü** *(28.09.2026 — C5)*
- ✅ Ürünler — liste / yeni / düzenle (taban fiyat + net liste + KDV oranı)
  ⛔ *X-10: net liste fiyatı ürün kartından çıkar, varsayılan fiyat listesine taşınır (GÇ-15); 1B'de ayrı fiyat listesi ekranı*
- ✅ Stok — giriş + hareketler
- ✅ Satıcılar — liste / yeni / düzenle / detay (prim oranı dahil)
- ✅ Doktorlar — liste / detay (cari, sipariş/tahsilat geçmişi) + satıcı devri — *korunur (X-13)* · yaşlandırma, vadesi geçmiş tutar ve sipariş başına kalan **söküldü** *(28.09.2026 — C3)*
- ✅ Siparişler — liste / detay + durum yönetimi
- ✅ Kargo — sevkiyat yönetimi
- ✅ Tahsilatlar — doktor tahsilatı; siparişe eşlenmez. FIFO mahsup ve yaşlandırma **söküldü** *(28.09.2026 — C3)*; kongre EARN entegrasyonu **söküldü** *(27.09.2026 — C2)*
- ❌ Primler — **söküldü** *(28.09.2026 — C4)* (GÇ-1 + GÇ-16): ekran, `commission-service.ts`, dönem kapanışı,
  onay/ödeme durumları, iptal düzeltmesi. Yeni prim (matrah **sevkiyat bazlı**, dönem zorunlu aralık)
  **1B'de** yazılır (X-1 §(2)/(7), A-3). `CommissionPeriod`/`CommissionAdjustment` **`CM`'e kadar
  şemada durur, okunmaz**. `DEFAULT_COMMISSION_RATE` C7'de `policy.ts`'e taşınır (X-14)
- ❌ Kongreler — **söküldü** *(27.09.2026 — C2, GÇ-4/GÇ-5)*: ekranlar, `congress-service.ts`,
  `congress-ledger.ts`, doktor detayındaki defter + manuel düzeltme (FR-57), dashboard ve rapordaki
  kongre bakiyesi. Dört `Congress*` tablosu **`CM`'e kadar şemada durur, okunmaz**. Modül Faz 3+'ta
  **uyum kütüğü** olarak yeniden yazılır (K-6, `modules.congress = false`)
- ❌ Bayiler ve Bayi Sevkiyat — **söküldü** *(28.09.2026 — C5)* (GÇ-6, X-8): yönetim ekranları, `dealer-cari.ts`,
  `dealer-shipment.ts`, bayi ödemesi. 1B'de bayi **`Doktor` satırıdır** (`hesap_sinifi = BAYI`) ve tek cari
  ekranından yönetilir; sevkiyat genel `SVK` akışıdır. Beş `Dealer*` tablosu **`CM`'e kadar şemada durur, okunmaz**
- ✅ Raporlar — **dört rapor**: (1) satıcı performans karşılaştırması (FR-62), (2) doktor ciro sıralaması (FR-63; kongre bakiyesi C2'de, gecikmiş borç C3'te söküldü), ~~(3) kanal karşılaştırma — satıcı vs bayi~~ C5'te söküldü, yerinde **toplam ciro** kartı kalır; kırılım 1B'de `hesap_sinifi`'nden türer (X-8), ~~(4) yaşlandırma (FR-26)~~ C3'te söküldü (X-6 §(5)). Satıcı tahsilatı artık doktorun sorumlusu üzerinden toplanır *(28.09.2026 — C3)*; **tahsilat oranı kolonu söküldü** *(28.09.2026 — C4)*. Hepsi KDV dahil/hariç toggle'ına bağlı ⛔ GÇ-9. *(X-1 ile **"tahsilat oranı" metriği kalıcı olarak
  kaldırılıyor**; yerine **iki mutlak sayı** — dönem cirosu (matrah) ve dönem tahsilatı (brüt) —
  tabanı ekranda yazılı gelir. Dönem **zorunlu aralık parametresidir**. Prim raporunu `OPERASYON`
  **görmez** (X-1 §(8): prim ücret ekidir). Faz 1 uygulama işi, D-2 ile **tek commit**.)*
- ✅ Audit Log — kritik işlemlerin denetim kaydı (salt okunur, filtre)

**Satıcı** (`src/app/(seller)/`)
- ✅ Siparişlerim — liste / yeni / detay
- ✅ Doktorlarım — liste / yeni / **düzenle** (yalnız kendi portföyü, RULE-02)
- ❌ Primlerim — **söküldü** *(28.09.2026 — C4)*
- ❌ Kongreler — **söküldü** *(27.09.2026 — C2)*
- ✅ Hesabım — doktor sayısı + ortalama iskonto; açık alacak listesi ve yaşlandırma **söküldü** *(28.09.2026 — C3)*

**Bayi** — ❌ **`(dealer)` route group'u, `dealer-session.ts` ve `bayi@` hesabı söküldü** *(28.09.2026 — C5)* (GÇ-6).
`Role.DEALER` enum'da `CM`'e kadar durur (GÇ-7); bu rolde bir hesap **giriş yapamaz** (`auth.ts`).
- ℹ️ Bayi **asla prim/kongreye dokunmaz** (RULE-15).
- ⛔ **KARARLAR D-2 §(6):** bayi sisteme **giriş yapmaz**; panel **Faz 3+ opsiyonel modül, yalnız
  Sınıf 1** (dış kullanıcı, internete açık hesap, parola sıfırlama, destek yükü). Faz 1'de bayi
  carisine **`Kullanici` bağlanmaz**; bugünkü beş sayfa ve `DEALER` rolü kaldırılır.

**Ortak / altyapı**
- ✅ Kök yönlendirme (role göre `/dashboard` · `/my-orders`), Login, Privacy/KVKK
- ✅ `error.tsx` / `loading.tsx` / `not-found.tsx` (kök seviyede mevcut)
- ✅ `scripts/backup.ts` (`pg_dump`, host/container fallback) · *`scripts/expire-congress-balances.ts` + `job:expire` C2'de söküldü*

## Marka & Arayüz (Anka West)

- Başlık: **"Anka West · Medikal Satış Operasyon"**; `public/logo.png` (giriş), `public/logo-mark.png` (sidebar).
- Logodan örneklenen `--color-brand` tokenı `globals.css`'te; sidebar/mobil nav `lucide-react` ikonlarıyla.

## Önemli İş Kuralları (kodda uygulanmış, seçme)

> ⛔ işaretli kurallar KARARLAR ile **geçersizleşti**; Faz 1'de kaldırılacak veya yeniden
> tanımlanacak (`FAZ1_UYGULAMA_KAPSAMI.md` §A).

- **RULE-01** Stok asla negatife düşmez — koşullu `updateMany (where stock >= qty)` (PostgreSQL).
  ⛔ **GÇ-17** — KARARLAR **B-4**: negatif stok artık **yumuşak kısıttır** (yetki + gerekçe + log ile aşılabilir),
  sert red değil.
- **RULE-02** Bir doktorun tek sahibi satıcı olur; sahibi olmayan satıcı sipariş açamaz (sunucu tarafı).
- **RULE-05** Kapanmış prim dönemi değişmez; sonraki iptaller sonraki döneme negatif yansır.
  ⛔ **GÇ-16** — X-1 §(6): kilit ve düzeltme kaydı yok; ters kayıt kendi belge tarihinde doğar.
  Mekanizma C4'te söküldü *(28.09.2026 — C4)*; prim kuralları 1B'ye kadar **testsizdir** (R-3).
- **RULE-08** Cari bakiye saklanmaz, hesaplanır (tek kaynak).
- **RULE-09** Aynı kongre bakiyesi iki kez harcanamaz — koşullu `updateMany` ile rezervasyon.
- **RULE-11** Kongre bakiyesi FIFO harcanır; kısmi harcama yok.
- **RULE-12** Bir tahsilat kaydı; **mahsuplaşma + doktor bakiyesi + prim matrahı + kongre kazanımını** tek transaction'da işler. *(Sipariş + kalemler + stok düşümü + hareket atomikliği doğru ve mevcut ama o **RULE-12 değildir** — v1 cümlesiydi, düzeltildi; bkz. `docs/DENETIM_BULGULARI.md` D-01.)*
  ⛔ **Dört bileşenin üçü düşüyor:** mahsuplaşma (GÇ-3), prim matrahı (GÇ-1), kongre kazanımı (GÇ-4).
  Geriye tahsilat kaydı + cari hareket kalır.
- **RULE-13** Kritik kararlar audit'e yazılır (merkezî sanitize). **Kalır** — C-3 §4 değişiklik logu
  KVKK md.12 teknik tedbir karşılığıdır.
- **RULE-15** Bayi prim/kongreye asla dokunmaz. **Kalır, biçim değiştirir** (X-8 §(3)): `BAYI`
  sınıfına satıcı atanmaz, bu yüzden bayi sevkiyatından prim doğmaz.
- **KDV:** per-satır yuvarlama, Σ satır = sipariş toplamı; net/brüt dönüşümleri `vat.ts`.
  ✅ **KARARLAR C-6 ile birebir uyumlu** — tek `hesaplaSatirTutarlari()` altında toplanacak,
  inline `fiyat * miktar` yasaklanacak.
- **Vade:** admin üst sınır belirler; FIFO mahsup ve aging kovaları **söküldü** *(28.09.2026 — C3)*;
  ⛔ **X-6: yaşlandırma Faz 2+'ya taşındı.** Faz 1'de gösterilen: `hesaplaDoktorBakiye()` çıktısı
  (tek işaretli, brüt, yön + taban etiketli) ve **bilgi kademesi uyarısı** *"vadesi geçmiş hareket
  var"* + en eski vade tarihi (`VADESI_GECMIS_HAREKET`). 🔴 **Vadesi geçmiş TUTAR gösterilmez** —
  dağıtım gerektirir, X-6 §(2) ile yasak.
- **Kongre expiry:** tahsilata bağlı hak ediş, **rolling 12 ay** (29 Şubat → 28'e sabitlenir).
  ⛔ **GÇ-4: mekanizmanın tamamı kaldırılıyor** (K-6 §(2)).
- **⚠️ RULE-03 (taban fiyat altı reddedilir) burada listelenmemişti ama kodda var** — ⛔ GÇ-8:
  KARARLAR **A-10** iskonto tavanını `null` yapıyor, **Ü-3 §(10)** liste üstü satışı da serbest
  bırakıp negatif iskonto olarak kaydediyor. Sistem **maliyet/geliş fiyatı tutmaz — kalıcı**.

## Sürüm Kontrolü, CI & Test

- **Git:** remote `origin` = GitHub `memirdemir/medikal-satis-operasyon`. `.env` gitignore'da
  (`.env.example` şablon), Prisma üretilen client + Playwright artefaktları hariç.
- ⚠️ **`docs/` sürüm kontrolünde değil** (14.09 ölçümü): `docs/TRACEABILITY.md` ve
  `docs/DENETIM_BULGULARI.md` yalnız diskte duruyor. Ayrıca `git status` temiz değil
  (`excalidraw.log`, sınıflandırılmamış `DENETIM_BRIFI_1.md`) ve `docker-compose.yml`'ın portu
  **5432 değil** — `.env.example`, `playwright.config.ts` ve `ci.yml` 5432 kullanıyor.
  Üçü de Faz 1A commit **C0**'ın işi.
- **CI (GitHub Actions, `.github/workflows/ci.yml`):** `push:main` + tüm PR'larda çalışır.
  PostgreSQL 17 servisi ile: `npm ci` → `prisma generate` → test DB → `prisma migrate deploy` →
  **typecheck + lint + birim testler + Playwright e2e**. Şu an **yeşil**.
- **Birim test:** **60 test** (vitest, 7 dosya) — `money`, `vat`, `phone`, `doctor`,
  `reports`, `pagination`, `audit` saf fonksiyonları. *(C2: `congress-ledger` 27 · C3: `allocation` 23 · C4: `commission` 21 + `reports` `collectionRate` 3 test silindi)*
- **E2E:** **38 test** *(C2: 66'dan kongre 10 + `doctor-detail` FR-57 3 · C3: `collections` FIFO + yaşlandırma 2 · C4: `commissions` 4 · C5: `dealer` 5 + `panel` 4 + bayi setup 1 silindi, bayi girişi reddi 1 eklendi)* (Playwright; `admin`/`seller`/`guest` projeleri, storageState auth),
  13 spec dosyası. Oturum iptali, doktor devri dahil.
- **Entegrasyon test:** **14 test** (vitest `integration` şeridi, 3 dosya) — `src/lib/db.itest.ts`
  altyapıyı sınar (şema uygulandı · yazılabilir · testler TRUNCATE ile izole) *(26.09.2026 — C1)* ·
  `collections.itest.ts` tahsilatın söküm boyunca kalan davranışını tutar: kuruş kaydı, hesaplanan
  cari (RULE-08), audit, iptal (FR-29), kongre hareketi **yazmaz** *(27.09.2026 — C2)*, mahsup satırı
  **yazmaz**, borçtan büyük tahsilat bakiyeyi eksiye çevirir (K-2) · `reports-service.itest.ts` satıcı
  tahsilatının doktor sorumlusu üzerinden toplandığını sınar *(28.09.2026 — C3)* · iptal prim düzeltmesi
  **yazmaz** *(28.09.2026 — C4)* · toplam ciro KDV moduna göre ve iptal hariç toplanır *(28.09.2026 — C5)*.
- **Test DB:** **üç veritabanı.** `medikal_dev` (geliştirme) · `medikal_test` (e2e, her koşuda
  `migrate reset`) · **`medikal_itest`** (entegrasyon; şema `globalSetup`'ta `migrate deploy`,
  izolasyon test başına `TRUNCATE`). Şerit ayrımı: `npm test` = birim (DB gerekmez) ·
  `npm run test:integration` = entegrasyon. Sigorta: `DATABASE_URL` `medikal_itest` içermiyorsa
  şerit **koşmayı reddeder** (`test/integration/setup.ts`). *(26.09.2026 — C1, F-00)*

## Çalıştırma

```bash
npm install
npm run db:up            # PostgreSQL (docker compose)
npx prisma generate      # client gitignored — taze klonda zorunlu
npx prisma migrate deploy
npm run db:seed          # demo verisi   ⛔ C9: db:seed = referans veri · db:seed:demo = demo
npm run dev              # http://localhost:3000

npm test                 # birim (vitest)
npm run test:e2e         # e2e (Playwright)
```

Demo hesapları (yalnızca geliştirme, üretime taşınmamalı): `admin@medikal.local`/`admin123`,
`ahmet@…`/`satici123`. *`bayi@…` hesabı C5'te seed'den çıktı (GÇ-6).*
**C9'dan sonra** demo hesapları yalnız `db:seed:demo`'dadır.

## Önceki Yol Haritasının Durumu (v2'de çözülenler)

MVP durum dosyasında (2026-07-17/21) ertelenen kritik işler v2 kapsamında kapatıldı:

- ✅ **Oturum iptali** — `requireSession()` her istekte canlı DB kontrolü yapar (React `cache`);
  pasife alınan kullanıcı anında erişimini kaybeder (e2e: `session-revocation.spec.ts`).
  ⛔ **Mekanizma değişiyor** (`docs/adr/ADR-003`); spec bugün JWT + `status` kontrolünü sınıyor ve
  **1B madde 4'te yeniden yazılır** (`FAZ1_UYGULAMA_KAPSAMI.md` §D.4).
- ✅ **Stok yarışı** — PostgreSQL + koşullu `updateMany` (RULE-01).
- ✅ **Para tavanı** — tüm para alanları `BigInt` kuruş; Int32 tavanı ortadan kalktı.
  ⛔ **GÇ-13 (X-5):** `BigInt` kuruş **geri çekiliyor**, yerine `Decimal`. Int32 sorunu
  `Decimal(18,2)` ile de çözülü kalır. *(14.09.2026: bu satır yukarıdaki "Teknoloji"
  bölümünde ⛔ işaretliyken burada ✅ görünüyordu — tek dosyada iki okuma.)*
- ✅ **PostgreSQL'e geçiş** — tamamlandı (Prisma driver adapter zorunlu).
- ✅ **error/loading/not-found** — kök seviyede eklendi.
- ✅ **CI** — GitHub Actions'ta tsc + lint + birim + e2e.
- ✅ **Sayfalama** — liste sayfalarında `getPagination` (`Pagination` bileşeni).
- ✅ **db.ts fail-fast** — `DATABASE_URL` yoksa başlangıçta hata fırlatır (sessiz yanlış-DB yok).
- ✅ **Birim testler** — saf fonksiyonlar için 60 test *(C4 sonrası)*.

## Faz 1 migration'ında eklenecek şema (Faz 0'da karara bağlandı, **henüz koda girmedi**)

> **⚠️ 13.09.2026 düzeltmesi.** Bu bölüm önceki turda yalnız **üç kalem** sayıyordu (E-2, D-5, E-1) —
> çünkü KARARLAR §6 "şema kapanışı" satırı yalnız **09.09 turunda doğan** eklemeleri anıyordu.
> Oysa daha önce karara bağlanan şema kalemlerinin de **hiçbiri kodda yok**: tek migration hâlâ
> `20260723175607_init_v2`. Aşağıdaki liste **KARARLAR §4 "Faz 1 şema özeti"nin tamamıdır.**
> Tam iş dökümü: `FAZ1_UYGULAMA_KAPSAMI.md` §B.
>
> 📐 **Ad rejimi (15.09.2026 — `docs/adr/ADR-001`):** aşağıdaki Türkçe tablo/kolon adları
> **kavramsaldır**; şemada İngilizce `camelCase` karşılıkları kullanılır. Enum değerleri, belge
> önekleri ve fonksiyon adları **olduğu gibi** (Türkçe) kalır.
>
> Canlı veri yok; tip yanlış konursa düzeltmesi veri taşıma migration'ı olacağından (KARARLAR §0.1.a)
> **hepsi tek migration'da netleşmeli** ve bu **ucuz olan tek andır**.

**Yeni tablolar (11):** `OnayBlogu` (A-8) · `StokKonum` (A-4) · `OdemeYontemi` (A-11) ·
`KargoFirma` (D-3) · `VergiOrani` (C-6) · `BelgeSayac` (A-14) · `StokDuzeltme` +
`StokDuzeltmeSatir` + `StokDuzeltmeSebep` (B-7) · **oturum tablosu** (E-2) ·
**dışa aktarım kütüğü** (D-5)

**Yeni belgeler (4):** `KonsinyeCikis` (A-4) · `StokTransfer` (B-4) · iade belgesi (A-1) ·
`StokDuzeltme` (B-7) — **dördü de mali sonuçsuz veya ayrı belge**

**Kolonlar (özet):** her belgede `belge_no` + `guncelleme_tarihi` (K-4/A-14) ·
`StockMovement.konum_id` zorunlu · `Siparis.asama`/`teklif_gecerlilik_tarihi`/`odeme_vadesi_gun` ·
`OrderItem.liste_fiyat`/**`birim_fiyat`**/`kdv_orani` (değer olarak donar) *(X-5: `iskonto_oran` konmaz, türetilir)* ·
`FiyatListesiSatir.min_adet`/`gecerli_baslangic`/`gecerli_bitis` · `CariHareket.vade_tarihi` ·
`Doktor`: `kredi_limiti`, `odeme_vadesi_gun`, **`vkn_tckn`, `cari_tip`, `fatura_*` seti,
`eposta`, `telefon`, `muhasebe_kodu`, `hesap_sinifi` (X-8)** · **`Urun.vergi_orani_id` NOT NULL** ·
`Tahsilat`: `odeme_yontemi_id`, `komisyon_oran`, `komisyon_tutar`, `beklenen_valor_tarihi`, `yon` ·
`Sevkiyat`: `kargo_firma_id`, `takip_no`, `gonderi_tarihi`, `kargo_durum`, `kargo_son_sorgu`,
`teslimat_adresi`, **`harici_irsaliye_no`** · `StokDuzeltme.harici_belge_no` ·
**`Kullanici.aktif`, `parola_hash`, `parola_degistirmeli`** · `ImportParti.dosya_adi`

**Yeni tipler:** cari hareket `ACILIS`/`VADE_FARKI` · kural kodu `NEGATIF_STOK`/`KREDI_LIMITI` ·
`cari_tip`: `TUZEL_KISI`/`GERCEK_KISI` · **`HesapSinifi`: `DOKTOR`/`BAYI` (X-8)** · **`Kullanici.rol`: `YONETICI`/`OPERASYON`/`SATICI`** ·
belge önekleri `SIP`/`SVK`/`IAD`/`KNS`/`TRF`/`THS`/`ACL`/`VDF`/`DZL`

**Kısıtlar:** `FiyatListesiSatir` tarih aralığı çakışma yasağı (DB) · `belge_no` **global UNIQUE** ·
VKN/TCKN format doğrulaması · `DZL` geriye tarihlendirilemez · en az bir aktif `YONETICI`

**Konmayacaklar (yazılı yasak):** `tenant_id` · lot/seri/GTIN/karekod/SKT · `Urun.uts_sinifi` ·
`UrunBarkod` · `dis_referans`/`aktarildi_mi` · `harici_fatura_no` · `OdemeYontemi.hesap_etiketi` ·
`Tahsilat.hesaba_gecti_mi` · **`Kullanici.son_giris_at`** · `uyari_gosterildi_mi` ·
`dosya_url`/`ek_var_mi` · `Kurum` tablosu ve `Doktor.kurum_id` · `Yetki` tablosu ·
bayi `Kullanici`'si · stok tutar/maliyet kolonu · **`Dealer*` tabloları (X-8)** · **`LoginAttempt` (X-9)**

**Zaman tipleri (E-1):** an → `timestamptz` (saklama UTC, yorum `Europe/Istanbul`),
takvim günü → `date`; aralıklar yarı açık `[başlangıç, bitiş)`; `new Date()` **doğrudan çağrılmaz**.

✅ **Parasal tip karara bağlandı (X-5):** `Decimal`. Ölçek şemada yaşar; ham aritmetik iki
fonksiyonla sınırlı; lint kuralı teslim şartı; yuvarlama **sıfırdan uzağa** ve **satır tutarları
daima pozitif** (işaret cari hareket tipinde taşınır).

⛔ **Şemadan çıkanlar (X-5, X-6):** `OrderItem.iskonto_oran` **konmaz** (türetilir) ·
**`PaymentAllocation` kaldırıldı, kalıcı** · **yaşlandırma Faz 2+** (X-6 §(5)).

⛔ **Şemadan çıkanlar (X-8, X-9 — 15.09.2026):** `Dealer` · `DealerPrice` · `DealerShipment` ·
`DealerShipmentItem` · `DealerPayment` · `LoginAttempt`.

➕ **X-11 · X-12 (16.09.2026) — eklenenler:** `CariHareket` (tip, yön, tutar, `vade_tarihi`) ·
`ImportParti` (`dosya_adi` dahil) · içe aktarılan kayıtlarda nullable parti FK → yeni tablo sayısı **15**.
⛔ **16.09 — şemadan çıkanlar:** `CommissionPeriod` · `CommissionAdjustment` (GÇ-16) · saklı KDV/toplam
alanları (GÇ-18) · `Order.dueDate` (GÇ-19) · `DoctorPayment.invoiceNo` (GÇ-20).

➕ **X-10 (15.09.2026) — eklenenler:** `FiyatListesi` · `FiyatListesiSatir` (yeni tablo sayısı
**13**) · `Doktor.fiyat_listesi_id` (nullable — boşsa varsayılan liste) · config
`pricing.varsayilanFiyatListesiKodu`. ⛔ **Çıkan:** `Product.netListPrice` (GÇ-15).

---

## ⛔ Faz 1'de geri çekilecek mevcut yetenekler

> Bu dosyanın en kolay yanlış okunan yeri burasıdır. Yukarıdaki "✅" işaretleri **bugün kodda
> çalışıyor** demektir; aşağıdakiler **çalışıyor ama KARARLAR ile geçersizleşti**.
> Tam gerekçe ve sıra: `FAZ1_UYGULAMA_KAPSAMI.md` §A.

| # | Ne | KARARLAR |
|---|---|---|
| GÇ-1 | Prim matrahı = tahsil edilen tutar → **sevkiyat anında doğan hakediş** | X-1 §(7), A-3 |
| GÇ-2 | `tahsilatOrani` metriği → **kaldırılır, kalıcı** (iki mutlak sayı) | X-1 §(1) |
| GÇ-3 | `PaymentAllocation` + FIFO mahsup → **kalem kapatma tablosu açılmaz** | A-7, K-2 |
| GÇ-4 | `CongressLedger` + EARN/SPEND/EXPIRE + 12 ay expiry job | K-6 §(2) |
| GÇ-5 | Doktor bazlı kongre/teşvik bakiyesi (her biçimde) | K-6 §(4) |
| GÇ-6 | `Role.DEALER` + `(dealer)` paneli → bayi **cari tipidir**; panel Faz 3+ · **15.09 genişledi:** beş `Dealer*` tablosu + bayi yönetim ekranları + `dealer-cari.ts`/`dealer-shipment.ts` → bayi **`Doktor` satırı** (`hesap_sinifi = BAYI`) | D-2 §(6), **X-8** |
| GÇ-7 | `ADMIN`/`SELLER`/`DEALER` → **`YONETICI`/`OPERASYON`/`SATICI`** | D-2 §(1) |
| GÇ-8 | `netMinPrice` taban fiyat + RULE-03 sert reddi → **tavan yok** | A-10, Ü-3 §(10) |
| GÇ-9 | KDV toggle + çerez tercihi → **taban etiketi zorunluluğu** | Ü-3 §(1)/(6) |
| GÇ-10 | `Product.vatRate` → `Urun.vergi_orani_id` (**tanım tablosu**) | C-6 §(2) |
| GÇ-11 | `SystemSetting` admin ayarı beklentisi → **config `policy.ts`'te, açılmaz** | §0.1.1 |
| GÇ-12 | Sipariş = tek parça sevkiyat → **kısmi sevkiyat** | A-3 |
| GÇ-13 | **`BigInt` kuruş + `money.ts` `divRound`** → **`Decimal`** + lint kuralı | **X-5** |
| GÇ-14 | **`LoginAttempt` tablosu** (deneme sınırı) → **tablo yok**, bellek içi sayaç *(15.09)* | **X-9**, E-2 §(8), ADR-004 |
| GÇ-15 | **`Product.netListPrice`** → ürün kartında fiyat yok; **varsayılan fiyat listesinin satırı** *(15.09)* | **X-10**, B-5 |
| GÇ-16 | Prim **dönem kapatma** + onay/ödeme durumları + sonraki döneme düzeltme → **kilit yok, ters kayıt** *(16.09)* | **X-1** §(6)/(7), kapsam dışı |
| GÇ-17 | Negatif stoğun **sert reddi** ve saklı `Product.stock` → **yumuşak kısıt, stok hareketlerden türer** *(16.09)* | **B-4**, ADR-005 |
| GÇ-18 | Saklı KDV ve toplam alanları (`Order`, `OrderItem`) → **türetilir** *(16.09)* | **C-6** §(3)/(5) |
| GÇ-19 | Siparişteki vade tarihi → **vade cari harekette** *(16.09)* | **A-7**, X-11 |
| GÇ-20 | Tahsilattaki fatura numarası → **fatura no kolonu konmaz** *(16.09)* | **C-1** §(4) |

> **Söküm takibi** `FAZ1_UYGULAMA_KAPSAMI.md` §A tablosundan yapılır (`Durum`/`Commit` kolonları).
> Bu dosya yalnız **sonucu** yansıtır: bir kalem söküldüğünde ilgili ⛔ satırı **silinir**.

## Kalan / Kapsam Dışı

- **e-Fatura API entegrasyonu — ertelendi** (KARARLAR K-4 §1.5): muhasebe programı yok (Excel),
  e-Fatura GİB portalından **elle** kesiliyor; API/adapter/`IEBelgeSaglayici` arayüzü Faz 1'de **yazılmaz**.
  **İstisna:** K-4 §(6) **fatura hazırlık veri seti** MVP'ye alındı — entegratöre toplu yüklenebilir
  altıncı dışa aktarım çıktısı (API yok, anahtar yok, gönderim yok).
- **ÜTS / izlenebilirlik (lot/seri/GTIN/karekod) — ertelendi** (KARARLAR K-10 §1.4): kapsam dışı değil,
  ertelenmiş. Faz 1'e hiçbir kolon/tablo/bayrak eklenmez.
- **Kargo API entegrasyonu** — Faz 3 opsiyonel modül; şu an yalnız sevkiyat kaydı var.
  Faz 1'de `KargoFirma` **tanım tablosu** + `takip_no`/`gonderi_tarihi` **görünür** (D-3).
- **Kongre ve teşvik modülü** — Faz 1'de **kapalı teslim** (`modules.congress = false`);
  yeniden yazımı **Faz 3+ opsiyonel modül** (K-6 §(2), KARARLAR §1.7).
- **Bayi paneli** — **Faz 3+ opsiyonel modül, yalnız Sınıf 1** (D-2 §(6)); bayi ticari
  ilişkisi çekirdekte kalır — **`Doktor` satırı olarak** (X-8).
- **Rate-limit** şu an **PostgreSQL** tabanlı (`LoginAttempt`); Redis'e taşıma ölçekle birlikte
  değerlendirilecek.
  ⛔ **X-9 (15.09):** tablo kalkar, sayaç **bellek içi** (ADR-004). Paylaşılan sayaç ancak aynı
  kurulumda birden fazla süreç çalıştırılacağı gün **yeni kararla** gelir (X-9 §(4)).
- **Bildirim** — opsiyonel modül; Faz 1'de yalnız **boş olay noktaları** tanımlanır
  (`onBlokAcildi`, `onBlokKararaBaglandi`, `onSevkiyatTamamlandi`, `onIadeKaydedildi` — D-1).
- **Çoklu depo** — ⚠️ artık kapsam dışı **değil**: B-4 ile şemada desteklenir (`StokKonum` +
  `StockMovement.konum_id` zorunlu); Faz 1'de **tek depo seed edilir**, UI davranışı satır
  sayısından türer, ayrı toggle **yoktur**.
- **Barkod / GTIN** — kapsam dışı, **sigorta kolonu da konmaz**; izlenebilirlik paketiyle
  **tek pakettir, ayrılamaz** (B-3, K-10 §H-A).
- **Dosya eki** — Faz 1'de **kalıcı dosya yüklemesi yoktur**; yükleme yalnız D-6 import
  akışında ve geçicidir, işlem sonunda **silinir** (E-3).
- **Not:** Faz faz commit'ler okunabilir geçmiş içindir; ara commit'ler tek tek build olmayabilir —
  yalnızca son (HEAD) ağaç doğrulanmış çalışan durumdur.
  ⚠️ *Bu not **v2 geçmişi** içindir. Faz 1'den itibaren **her commit** lint + typecheck + test
  yeşil olmak zorundadır (`DUZELTME_BRIFI.md` kapsam sınırı) — `CM`'in tek commit olmasının
  sebebi de budur (`FAZ1_UYGULAMA_KAPSAMI.md` §D.1).*
