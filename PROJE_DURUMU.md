# Proje Durumu — Medikal Satış Operasyon Yönetim Sistemi

_Son güncelleme: 2026-07-16 · Sürüm: 0.1.0 (MVP) · Durum: geliştirme_

Merkezi depodaki medikal ürünlerin ~10 satıcı üzerinden doktorlara ulaştırıldığı bir firmanın
operasyonlarını (ürün, stok, sipariş, kargo, ödeme, satıcı cari hesabı) tek sistemde toplayan
full-stack web uygulaması. Bu dosya, projenin **o an fiilen ne içerdiğini** özetler.
Kurulum ve iş kuralları detayı için `README.md`'ye bak.

## Teknoloji

| Katman        | Seçim                                          |
| ------------- | ---------------------------------------------- |
| Framework     | Next.js **16.2.10** (App Router, Server Actions) |
| Dil / UI      | TypeScript 5, React 19.2, Tailwind CSS 4       |
| Veritabanı    | SQLite + Prisma **7.8** (`better-sqlite3` adapter) |
| Kimlik doğrulama | Auth.js / NextAuth **v5 beta**, Credentials + bcryptjs |

> Prisma client `src/generated/prisma/` altına üretiliyor (özel `output`). Para alanları
> integer **kuruş** olarak saklanıyor; cari hesap ayrı tabloda tutulmayıp `src/lib/cari.ts`
> içinde hesaplanıyor (tek kaynak).

## Veri Modeli (`prisma/schema.prisma`)

7 model + 5 enum. 1 migration uygulanmış (`20260714131152_init`).

- **User** — `role` (ADMIN/SELLER), `status`, `passwordHash`; siparişler + ödemeler ile ilişkili
- **Product** — `code` (unique), `salePrice` (kuruş), `stock`
- **StockMovement** — `IN`/`OUT` hareket; ürüne ve opsiyonel siparişe bağlı
- **Order** — satıcı, doktor/hastane, `status`, `totalAmount` (kuruş)
- **OrderItem** — `unitPrice` sipariş anındaki fiyat snapshot'ı, `lineTotal`
- **Shipment** — siparişe 1-1; kargo firması, takip no, durum
- **Payment** — satıcı ödemesi; `method`, `amount` (kuruş)

Enum'lar: `Role`, `EntityStatus`, `OrderStatus` (PENDING→PREPARING→SHIPPED→DELIVERED / CANCELLED),
`StockMovementType`, `PaymentMethod`.

## Yapılmış Ekranlar

Rol bazlı iki route grubu var: `(admin)` ve `(seller)`, ayrı layout'larla.

**Admin** (`src/app/(admin)/`)
- ✅ Dashboard
- ✅ Ürünler — liste / yeni / düzenle (`ProductForm`)
- ✅ Stok — giriş formu + hareketler (`StockEntryForm`)
- ✅ Satıcılar — liste / yeni / düzenle / detay (cari ile) (`SellerForm`)
- ✅ Siparişler — liste / detay + durum yönetimi
- ✅ Kargo — sevkiyat yönetimi
- ✅ Ödemeler — liste + ödeme kaydı (`PaymentForm`)

**Satıcı** (`src/app/(seller)/`)
- ✅ Siparişlerim — liste / yeni sipariş / detay (`OrderForm`)
- ✅ Hesabım — cari / bakiye görünümü

**Ortak / altyapı**
- ✅ Login (`src/app/login/`) + Auth.js route handler
- ✅ Ortak bileşenler: `AppShell`, `SidebarLink`, `OrderDetail`, `ConfirmSubmit`, `LogoutButton`, `form.tsx`, `ui.tsx`
- ✅ `lib/`: `auth`, `auth-actions`, `session`, `db`, `cari`, `money`, `format`

Her modül kendi `actions.ts` dosyasıyla Server Actions üzerinden çalışıyor.

## Önemli İş Kuralları (kodda uygulanmış)

- **Sipariş oluşturma:** birim fiyat üründen snapshot alınır; Order + kalemler + stok düşümü +
  `OUT` hareketi tek transaction'da; stok yetmezse iptal.
- **Sipariş iptali:** stok `IN` hareketiyle geri yüklenir; iptal edilen sipariş cariye dahil edilmez.
- **Cari:** `Güncel Bakiye = Toplam Satış (iptal hariç) − Toplam Ödeme` — `getSellerCari` /
  `getAllSellersCari`.

## Sürüm Kontrolü & Test

- **Git:** başlatıldı; remote `origin` = GitHub `memirdemir/medikal-satis-operasyon`. `.gitignore`
  artık `*.db`, `.env*` (istisna: `.env.example`) ve Playwright artefaktlarını dışlıyor.
  `.env.example` şablonu eklendi (gizli değerler repoda değil).
- **E2E test altyapısı (Playwright):** `@playwright/test 1.61.1` + Chromium. `e2e/` altında 18 test
  (auth/yetki, admin smoke + ürün/satıcı/cari-ödeme, satıcı sipariş). İzole `test.db`'ye karşı,
  3100 portunda otomatik dev sunucusuyla çalışır; `dev.db`'ye dokunmaz. Komut: `npm run test:e2e`.
  > Not: bu iş `test/playwright-e2e` dalında (origin'e push'lu), **henüz `main`'e merge edilmedi**.

## Çalıştırma

```bash
npm install
npx prisma migrate dev
npm run db:seed          # demo verisi
npm run dev              # http://localhost:3000
```

Demo hesapları README'de (admin@medikal.local / `admin123`, satıcılar / `satici123`).

## Durum Notları / Bilinmeyenler

- Otomatik test: E2E paketi eklendi (yukarıya bakınız), ancak `main`'e merge bekliyor. Birim test yok.
- `dev.db` ve `.env` yerelde duruyor ama artık `.gitignore` ile versiyon kontrolünden dışlanıyor.
- **Production sertleştirme — tamamlandı** (`feature/production-hardening` dalı, 6 atomik commit;
  kaynak: `gelistirme.md` / `GELISTIRME_PLANI_v3.md`): SQLite yedekleme (+bütünlük doğrulaması),
  login rate-limit (brute-force), KVKK/Privacy sayfası, para/miktar-kritik alanlarda Zod doğrulama,
  ve merkezî-sanitize'lı Audit Log. Detaylar README'de. `main`'e merge bekliyor.
- MVP kapsam dışı: e-Fatura, kargo API, bildirim, çoklu depo, barkod, raporlama (bkz. README).
