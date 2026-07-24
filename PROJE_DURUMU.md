# Proje Durumu — Medikal Satış Operasyon Yönetim Sistemi

_Son güncelleme: 2026-07-24 · Sürüm: 2.2 · Durum: v2 fazları tamamlandı (temiz sayfa, canlı veri yok)_

Merkezi depodaki medikal ürünlerin ~10 satıcı üzerinden doktorlara ulaştırıldığı bir firmanın
operasyonlarını tek sistemde toplayan full-stack web uygulaması. v2 ile kapsam; **doktor cari
hesabı, vade ve tahsilat, satıcı primi, kongre bakiyesi defteri ve bayi kanalı** eklenerek
genişletildi. Bu dosya, projenin **o an fiilen ne içerdiğini** özetler. Kurulum ve iş kuralları
detayı için `README.md`'ye, faz faz uygulama için `UYGULAMA_PLANI.md`'ye bak.

## Teknoloji

| Katman           | Seçim                                                          |
| ---------------- | -------------------------------------------------------------- |
| Framework        | Next.js **16.2.10** (App Router, Server Components + Actions)  |
| Dil / UI         | TypeScript 5, React **19.2.4**, Tailwind CSS 4 (CSS-first)     |
| Veritabanı       | **PostgreSQL** + Prisma **7.8** (zorunlu driver adapter: `@prisma/adapter-pg` + `pg`) |
| Kimlik doğrulama | Auth.js / NextAuth **v5 beta**, Credentials + bcryptjs, JWT    |
| Doğrulama        | Zod 4                                                          |
| Test             | **vitest** (birim) + **Playwright 1.61** (e2e)                 |
| İkonlar          | `lucide-react` (sidebar / mobil nav)                          |

> **Para her yerde `BigInt` kuruş** (integer cents) olarak saklanır ve işlenir; yuvarlama tek
> kaynaktan (`money.ts` `divRound`, round-half-away-from-zero) yapılır. Prisma client
> `src/generated/prisma/` altına üretilir (gitignored — CI'da `prisma generate` ile üretilmek
> zorunda). Bağlantı dizesi şemada değil `prisma.config.ts` içindedir.

## Veri Modeli (`prisma/schema.prisma`)

**25 model + 11 enum**, tek migration (`20260723175607_init_v2`).

**Çekirdek:** User (ADMIN/SELLER/**DEALER**, `commissionRate`), Product (`netListPrice`,
`netMinPrice`/taban, `vatRate`), StockMovement, Order, OrderItem, Shipment.

**Doktor & cari:** Doctor, DoctorAssignment (satıcı-doktor sahipliği/devri), DoctorPayment,
PaymentAllocation (FIFO mahsup), DueDateChange (vade değişiklik izi).

**Prim:** CommissionPeriod (dönem kapanışı), CommissionAdjustment (sonraki döneme negatif düzeltme).

**Kongre:** Congress, CongressPackage, CongressRegistration, CongressLedger (FIFO bakiye defteri).

**Bayi:** Dealer, DealerPrice, DealerShipment, DealerShipmentItem, DealerPayment.

**Altyapı:** SystemSetting (vade üst sınırı vb. admin ayarları), LoginAttempt (rate-limit),
AuditLog (merkezî sanitize'lı denetim izi).

Enum'lar: `Role`, `EntityStatus`, `OrderStatus`, `StockMovementType`, `PaymentMethod`,
`PaymentStatus`, `CommissionStatus`, `CongressStatus`, `CongressRegistrationStatus`,
`CongressLedgerType`, `DealerShipmentStatus`.

## Yapılmış Ekranlar

Üç rol bazlı route grubu: `(admin)`, `(seller)`, `(dealer)` — ayrı layout'lar (41 sayfa).

**Admin** (`src/app/(admin)/`)
- ✅ Dashboard — özet stat kartları, kritik stok, satıcı/cari özetleri, KDV dahil/hariç toggle
- ✅ Ürünler — liste / yeni / düzenle (taban fiyat + net liste + KDV oranı)
- ✅ Stok — giriş + hareketler
- ✅ Satıcılar — liste / yeni / düzenle / detay (prim oranı dahil)
- ✅ Doktorlar — liste / detay (cari, aging, açık siparişler) + satıcı devri
- ✅ Siparişler — liste / detay + durum yönetimi
- ✅ Kargo — sevkiyat yönetimi
- ✅ Tahsilatlar — doktor tahsilatı + FIFO mahsuplaşma; kongre EARN entegrasyonu
- ✅ Primler — açık dönem önizleme + dönem kapanışı (kapanınca dondurulur) + iptal düzeltmesi
- ✅ Kongreler — kongre/paket ekle · **düzenle · güvenli silme/iptal** · kayıt onay/iptal
- ✅ Bayiler — liste / yeni / detay (bayi fiyat listesi, ödeme, cari)
- ✅ Bayi Sevkiyat — bayi sevkiyat taleplerinin onayı
- ✅ Raporlar — tahsilat oranı, ağırlıklı iskonto, ciro raporları
- ✅ Audit Log — kritik işlemlerin denetim kaydı (salt okunur, filtre)

**Satıcı** (`src/app/(seller)/`)
- ✅ Siparişlerim — liste / yeni / detay
- ✅ Doktorlarım — liste / yeni / **düzenle** (yalnız kendi portföyü, RULE-02)
- ✅ Primlerim — dönem bazlı prim durumu
- ✅ Kongreler — paket görüntüleme + kayıt talebi
- ✅ Hesabım

**Bayi** (`src/app/(dealer)/` — URL öneki `/bayi`)
- ✅ Panel — kendi özetini görüntüler
- ✅ Sevkiyat Talebi — talep oluşturur (admin onaylar)
- ✅ Sevkiyatlar / Ödemeler / Fiyat Listem — salt görüntüleme
- ℹ️ Bayi **asla prim/kongreye dokunmaz** (RULE-15).

**Ortak / altyapı**
- ✅ Kök yönlendirme (role göre `/dashboard` · `/my-orders` · `/bayi`), Login, Privacy/KVKK
- ✅ `error.tsx` / `loading.tsx` / `not-found.tsx` (kök seviyede mevcut)
- ✅ `scripts/backup.ts` (`pg_dump`, host/container fallback), `scripts/expire-congress-balances.ts` (`npm run job:expire`)

## Marka & Arayüz (Anka West)

- Başlık: **"Anka West · Medikal Satış Operasyon"**; `public/logo.png` (giriş), `public/logo-mark.png` (sidebar).
- Logodan örneklenen `--color-brand` tokenı `globals.css`'te; sidebar/mobil nav `lucide-react` ikonlarıyla.

## Önemli İş Kuralları (kodda uygulanmış, seçme)

- **RULE-01** Stok asla negatife düşmez — koşullu `updateMany (where stock >= qty)` (PostgreSQL).
- **RULE-02** Bir doktorun tek sahibi satıcı olur; sahibi olmayan satıcı sipariş açamaz (sunucu tarafı).
- **RULE-05** Kapanmış prim dönemi değişmez; sonraki iptaller sonraki döneme negatif yansır.
- **RULE-08** Cari bakiye saklanmaz, hesaplanır (tek kaynak).
- **RULE-09** Aynı kongre bakiyesi iki kez harcanamaz — koşullu `updateMany` ile rezervasyon.
- **RULE-11** Kongre bakiyesi FIFO harcanır; kısmi harcama yok.
- **RULE-12** Sipariş + kalemler + stok düşümü + hareket tek transaction.
- **RULE-13** Kritik kararlar audit'e yazılır (merkezî sanitize).
- **RULE-15** Bayi prim/kongreye asla dokunmaz.
- **KDV:** per-satır yuvarlama, Σ satır = sipariş toplamı; net/brüt dönüşümleri `vat.ts`.
- **Vade:** admin üst sınır belirler; **FIFO mahsup** en eski vadeden başlar; aging kovaları.
- **Kongre expiry:** tahsilata bağlı hak ediş, **rolling 12 ay** (29 Şubat → 28'e sabitlenir).

## Sürüm Kontrolü, CI & Test

- **Git:** remote `origin` = GitHub `memirdemir/medikal-satis-operasyon`. `.env` gitignore'da
  (`.env.example` şablon), Prisma üretilen client + Playwright artefaktları hariç.
- **CI (GitHub Actions, `.github/workflows/ci.yml`):** `push:main` + tüm PR'larda çalışır.
  PostgreSQL 17 servisi ile: `npm ci` → `prisma generate` → test DB → `prisma migrate deploy` →
  **typecheck + lint + birim testler + Playwright e2e**. Şu an **yeşil**.
- **Birim test:** **134 test** (vitest, 10 dosya) — `money`, `vat`, `phone`, `doctor`, `allocation`,
  `commission`, `congress-ledger`, `reports`, `pagination`, `audit` saf fonksiyonları.
- **E2E:** ~**65 test** (Playwright; `admin`/`seller`/`dealer`/`guest` projeleri, storageState auth),
  18 spec dosyası. Oturum iptali, prim dönemi, kongre FIFO, bayi paneli, doktor devri dahil.

## Çalıştırma

```bash
npm install
npm run db:up            # PostgreSQL (docker compose)
npx prisma migrate deploy
npm run db:seed          # demo verisi
npm run dev              # http://localhost:3000

npm test                 # birim (vitest)
npm run test:e2e         # e2e (Playwright)
```

Demo hesapları (yalnızca geliştirme, üretime taşınmamalı): `admin@medikal.local`/`admin123`,
`ahmet@…`/`satici123`, `bayi@medikal.local`/`bayi123`.

## Önceki Yol Haritasının Durumu (v2'de çözülenler)

MVP durum dosyasında (2026-07-17/21) ertelenen kritik işler v2 kapsamında kapatıldı:

- ✅ **Oturum iptali** — `requireSession()` her istekte canlı DB kontrolü yapar (React `cache`);
  pasife alınan kullanıcı anında erişimini kaybeder (e2e: `session-revocation.spec.ts`).
- ✅ **Stok yarışı** — PostgreSQL + koşullu `updateMany` (RULE-01).
- ✅ **Para tavanı** — tüm para alanları `BigInt` kuruş; Int32 tavanı ortadan kalktı.
- ✅ **PostgreSQL'e geçiş** — tamamlandı (Prisma driver adapter zorunlu).
- ✅ **error/loading/not-found** — kök seviyede eklendi.
- ✅ **CI** — GitHub Actions'ta tsc + lint + birim + e2e.
- ✅ **Sayfalama** — liste sayfalarında `getPagination` (`Pagination` bileşeni).
- ✅ **db.ts fail-fast** — `DATABASE_URL` yoksa başlangıçta hata fırlatır (sessiz yanlış-DB yok).
- ✅ **Birim testler** — saf fonksiyonlar için 134 test.

## Kalan / Kapsam Dışı

- **e-Fatura ve kargo API entegrasyonu** — bilinçli olarak sonraya ertelendi (D-24; yalnızca
  raporlama yapılıyor, entegrasyon yok).
- **Rate-limit** şu an **PostgreSQL** tabanlı (`LoginAttempt`); Redis'e taşıma ölçekle birlikte
  değerlendirilecek.
- Bildirim, çoklu depo, barkod — MVP/v2 kapsam dışı.
- **Not:** Faz faz commit'ler okunabilir geçmiş içindir; ara commit'ler tek tek build olmayabilir —
  yalnızca son (HEAD) ağaç doğrulanmış çalışan durumdur.
