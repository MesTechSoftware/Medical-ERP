# Anka West · Medikal Satış Operasyon Yönetim Sistemi

Merkezi depodaki medikal ürünlerin ~10 satıcı aracılığıyla doktorlara ulaştırıldığı bir firmanın
operasyonlarını tek sistemde yöneten full-stack web uygulaması. **v2** kapsamı: ürün · merkezi stok ·
sipariş · kargo · **doktor cari hesabı, vade ve tahsilat · satıcı primi · kongre bakiyesi defteri ·
bayi kanalı** + KDV altyapısı ve raporlama.

Projenin o anki fiili durumu için `PROJE_DURUMU.md`, gereksinim detayı için `PRD_V2.md`, faz faz
uygulama için `UYGULAMA_PLANI.md`.

## Teknoloji

- **Next.js 16.2.10** (App Router, Server Components + Server Actions) — full-stack, tek proje
- **PostgreSQL + Prisma 7.8** — driver adapter zorunlu (`@prisma/adapter-pg` + `pg`)
- **Auth.js (NextAuth v5 beta)** — Credentials, rol bazlı (ADMIN / SELLER / DEALER)
- **Zod 4** doğrulama · **Tailwind CSS 4** + `lucide-react` ikonlar
- **Test:** vitest (birim) + Playwright 1.61 (e2e)

> **Para her yerde `BigInt` kuruş** olarak saklanır ve işlenir (150,50 TL → `15050n`). Yuvarlama tek
> kaynaktan yapılır (`src/lib/money.ts` → `divRound`, round-half-away-from-zero); gösterim için
> `formatTRY`. Prisma client `src/generated/prisma/` altına üretilir (gitignored — taze klonda
> `prisma generate` şart). Bağlantı dizesi şemada değil `prisma.config.ts` içindedir.

## Kurulum

```bash
npm install
cp .env.example .env        # ortam değişkenleri (aşağıya bak)
npm run db:up               # PostgreSQL (docker compose)
npx prisma generate
npx prisma migrate deploy   # veritabanı + tablolar
npm run db:seed             # örnek demo verisi
npm run dev                 # http://localhost:3000
```

### Ortam Değişkenleri

`.env` repoda yoktur; `.env.example` şablonundan üretilir. İki değişken gerekir:

| Değişken       | Açıklama                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------- |
| `DATABASE_URL` | PostgreSQL bağlantı dizesi — dev için `postgresql://medikal:medikal_dev@localhost:5432/medikal_dev?schema=public` |
| `AUTH_SECRET`  | Auth.js JWT imzalama anahtarı — `openssl rand -base64 32` ile üret                             |

> `DATABASE_URL` yoksa uygulama **başlangıçta hata fırlatır** (`src/lib/db.ts` fail-fast) — sessizce
> yanlış veritabanına bağlanmaz. `AUTH_SECRET` boş bırakılırsa giriş akışı çalışmaz.

## Demo Hesapları

Yalnızca geliştirme içindir; üretime taşınmamalıdır.

| Rol    | E-posta                | Şifre       |
| ------ | ---------------------- | ----------- |
| Admin  | admin@medikal.local    | `admin123`  |
| Satıcı | ahmet@medikal.local    | `satici123` |
| Satıcı | ayse@medikal.local     | `satici123` |
| Satıcı | mehmet@medikal.local   | `satici123` |
| Bayi   | bayi@medikal.local     | `bayi123`   |

## Roller ve Ekranlar

**Admin** — Dashboard (KDV dahil/hariç toggle), Ürünler, Stok, Satıcılar, Doktorlar (cari + satıcı
devri), Siparişler, Kargo, Tahsilatlar, Primler, Kongreler, Bayiler, Bayi Sevkiyat, Raporlar,
Audit Log

**Satıcı** — Siparişlerim (+yeni sipariş), Doktorlarım (kendi portföyü; ekle/düzenle), Primlerim,
Kongreler (paket görüntüleme + kayıt talebi), Hesabım

**Bayi** (`/bayi`) — Panel, Sevkiyat Talebi, Sevkiyatlar, Ödemeler, Fiyat Listem (talep dışında salt
görüntüleme)

Giriş sonrası kök yönlendirme role göre yapılır: `/dashboard` · `/my-orders` · `/bayi`.

## Marka & Arayüz

Uygulama **Anka West** markasıyla giydirilmiştir: giriş ekranı ve sidebar logosu
(`public/logo.png`, `public/logo-mark.png`), güncellenmiş favicon ve "Anka West · Medikal Satış
Operasyon" başlığı. Logodan örneklenen `--color-brand` tokenı (`src/app/globals.css`) login form
focus rengi ile aktif sidebar bağlantısının ikon vurgusunda kullanılır. Sidebar ve mobil nav
bağlantılarının ikonları `lucide-react`'ten gelir.

## İş Kuralları (özet)

**Sipariş & stok**

- **Sipariş oluşturma:** birim fiyat ve KDV oranı sipariş anındaki üründen snapshot alınır. Order +
  kalemler + stok düşümü + `OUT` hareketi **tek transaction**'da yapılır (RULE-12).
- **Stok asla negatife düşmez:** düşüm koşullu `updateMany (where stock >= qty)` ile yapılır; yarış
  durumunda işlem iptal olur (RULE-01).
- **Sipariş iptali:** stok geri yüklenir (`IN` hareketi), sipariş cari toplamına dahil edilmez.
- **Durum akışı:** Bekliyor → Hazırlanıyor → Kargolandı (kargo ekranından) → Teslim Edildi. Her
  aşamada iptal mümkün (teslim/iptal hariç).
- **Aktif/Pasif:** Pasif ürün sipariş edilemez (form dışı + sunucuda reddedilir).

**Fiyat & KDV**

- Ürünlerde **net liste fiyatı** + **taban fiyat** (`netMinPrice`) tutulur; satıcı serbest fiyat
  girebilir ama tabanın altına inemez (sunucu tarafı kontrol).
- KDV **satır bazında** yuvarlanır, Σ satır = sipariş toplamıdır; net/brüt dönüşümleri `src/lib/vat.ts`.

**Doktor cari, vade, tahsilat**

- **Cari bakiye saklanmaz, hesaplanır** — tek kaynak (RULE-08).
- Bir doktorun **tek sahibi satıcı** olur; sahibi olmayan satıcı o doktora sipariş açamaz (RULE-02).
  Devir admin tarafından yapılır, iz `DoctorAssignment`'ta tutulur.
- **Vade:** üst sınırı admin belirler (`SystemSetting`); değişiklikler `DueDateChange` ile izlenir.
- **Tahsilat:** ödeme **FIFO** mahsuplaşır — en eski vadeli borçtan başlanır (`PaymentAllocation`).
  Aging kovaları rapor ekranında.

**Prim**

- Prim dönem bazlıdır; **kapanmış dönem değişmez**. Kapanış sonrası iptaller sonraki döneme
  **negatif düzeltme** olarak yansır (RULE-05, `CommissionAdjustment`).

**Kongre bakiyesi**

- Bakiye tahsilata bağlı hak edilir, **FIFO** harcanır ve **kısmi harcama yoktur** (RULE-11).
- Aynı bakiye iki kez harcanamaz — rezervasyon koşullu `updateMany` ile yapılır (RULE-09).
- Geçerlilik **rolling 12 ay**; 29 Şubat → 28'e sabitlenir. Süresi geçenler `npm run job:expire`
  ile düşülür.

**Bayi**

- Bayinin kendi fiyat listesi ve cari hesabı vardır; sevkiyatı **talep eder, admin onaylar** —
  onaylanmadan stok ve cari etkilenmez.
- Bayi **prim ve kongre yüzeylerine asla dokunmaz** (RULE-15).

## Komutlar

```bash
npm run dev          # geliştirme sunucusu
npm run build        # production build
npm start            # build edilmiş uygulamayı çalıştır
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint
npm run db:up        # PostgreSQL container'ını başlat
npm run db:down      # container'ı durdur
npm run db:seed      # demo verisini yeniden yükle (mevcut veriyi siler)
npm run db:reset     # migration'ları sıfırla
npm run backup       # veritabanını yedekle (+ bütünlük doğrulaması)
npm run job:expire   # süresi dolan kongre bakiyelerini düş
npx prisma studio    # veritabanı görüntüleyici
```

## Test

```bash
npm test                 # 134 birim testi (vitest, 10 dosya)
npm run test:e2e         # 66 e2e testi (Playwright, 18 spec)
npm run test:e2e:ui      # etkileşimli UI modu
npm run test:e2e:report  # son koşunun HTML raporu
```

**Birim testler** saf fonksiyonları kapsar: `money`, `vat`, `phone`, `doctor`, `allocation`,
`commission`, `congress-ledger`, `reports`, `pagination`, `audit`.

**E2E testler izole** çalışır: `playwright.config.ts` ayrı bir `medikal_test` veritabanı kurar
(migrate reset + seed) ve dev sunucusunu **3100** portunda ayağa kaldırır — dev veritabanınıza ve
3000 portundaki oturumunuza dokunmaz. Projeler: `admin` / `seller` / `dealer` / `guest`; rol
oturumları `auth.setup.ts` ile bir kez hazırlanıp `storageState` olarak paylaşılır. Kapsam: yetki
yönlendirmeleri, oturum iptali, sipariş/stok akışı, doktor cari + FIFO mahsup, prim dönemi kapanışı,
kongre FIFO bakiyesi, bayi paneli izolasyonu.

### CI

`.github/workflows/ci.yml` — `push:main` ve tüm PR'larda: PostgreSQL 17 servisi ile `npm ci` →
`prisma generate` → `prisma migrate deploy` → **typecheck + lint + birim testler + Playwright e2e**.

## Güvenlik, Gizlilik ve Dayanıklılık

### Privacy & KVKK

Sistem doktor adı, hastane, satıcı iletişim ve finansal veri tuttuğundan `/privacy`
(public) sayfasında bir aydınlatma metni sunulur: hangi veriler, işlenme amacı, saklama
süresi, erişim, güvenlik önlemleri, iletişim. Login ekranından linklenir.

> **Dürüst kapsam notu:** Bu, KVKK'nın *statik bilgilendirme* ayağını karşılar. Tam uyum
> için ayrıca resmi aydınlatma metni, saklama süresi politikası, ilgili kişi hakları
> (erişim/silme talebi süreci) ve gerekiyorsa VERBİS kaydı gerekir. Bu bir başlangıçtır,
> "KVKK tamamen tamamlandı" anlamına gelmez.

### Audit Log

Kritik işlemler `AuditLog` tablosuna kaydedilir: **kim, ne yaptı, ne zaman, hangi kayıt
üzerinde** (+ `before`/`after` snapshot). Kapsam: ürün/satıcı oluşturma-güncelleme, stok girişi,
sipariş oluşturma/iptal/durum değişikliği, tahsilat, prim dönemi kapanışı, kongre ve bayi
işlemleri ile auth olayları (başarılı/başarısız giriş, çıkış). `Admin → Audit Log` ekranında
filtrelenerek görülür (salt okunur).

- **Hassas veri koruması:** `passwordHash`, `password`, `token`, `secret` gibi alanlar
  merkezî `sanitizeAuditData()` ile (iç içe nesnelerde de) temizlenir — hiçbir audit
  kaydında görünmez. Merkezî olduğu için yeni action eklendiğinde sızma riski yoktur.
- **Non-blocking:** audit yazımı iş transaction'ı COMMIT olduktan sonra, `redirect`'ten önce
  çağrılır; audit hatası ana işlemi geri almaz/bozmaz.

### Oturum & yetki

- **Anlık oturum iptali:** `requireSession()` her istekte kullanıcıyı canlı DB'den doğrular (React
  `cache` ile istek başına tek sorgu). Pasife alınan kullanıcı token süresini beklemeden erişimini
  kaybeder.
- **Nesne düzeyi yetki (IDOR):** rol kontrolüne (`requireAdmin`/`requireSeller`/bayi oturumu) ek
  olarak, satıcı verisine erişen her sorgu `sellerId: session.user.id` ile, bayi verisine erişen her
  sorgu ilgili `dealerId` ile kapsanır; başkasının kaydı `id` değiştirilerek görülemez (kayıt yoksa
  `notFound()`).
- **Login rate-limit:** 5 hatalı denemede e-posta 10 dk kilitlenir. Kilit **veritabanı tabanlıdır**
  (`LoginAttempt`) — sunucu restart'ında sıfırlanmaz, çok instance'lı kurulumda da paylaşılır.
  Enforcement tek noktada (Credentials `authorize`), böylece hem form hem ham
  `/api/auth/callback/credentials` POST'u korunur.

### Girdi Doğrulama (Zod)

Para/miktar-kritik alanlar sunucu tarafında Zod ile doğrulanır (`src/lib/validation.ts`):
tahsilat/ödeme tutarı, ürün fiyatı ve taban fiyat, stok/sipariş miktarı. Negatif, ondalıklı-kuruş
(örn. 12,345), NaN/Infinity veya aşırı büyük değerler reddedilir — böylece cari sessizce bozulmaz.
Kapsam bilinçli olarak finansal alanlarla sınırlıdır; diğer alanlar mevcut kontrollerini korur.

### Yedekleme & Restore

```bash
npm run backup   # backups/backup-YYYY-MM-DD-HH-mm.dump
```

Yedek `pg_dump --format=custom` ile alınır: sıkıştırılmış, seçmeli geri yüklenebilir ve PostgreSQL'in
MVCC'si sayesinde uygulama çalışırken bile **tutarlı** bir snapshot verir. `pg_dump` host'ta yoksa
otomatik olarak Postgres container'ı üzerinden çalıştırılır (`PG_CONTAINER`, varsayılan
`medikal_postgres`).

**"Test edilmemiş yedek, yedek değildir":** script yedeği aldıktan hemen sonra arşivi
`pg_restore --list` ile geri okur; TOC bozuksa veya beklenen tablo verisi yoksa non-zero exit ile
durur.

**Otomatikleştirme (öneri):** düzenli yedek için sistem zamanlayıcısı — örn. cron:

```cron
0 * * * *  cd /path/to/proje && npm run backup   # saatte bir
```

**Restore prosedürü (elle — bilinçli işlem):**

1. Uygulamayı durdur.
2. Hedef veritabanını yedekle/kenara al.
3. Geri yükle: `pg_restore --clean --if-exists --dbname "$DATABASE_URL" backups/backup-....dump`
4. `npm run dev` ile aç; veriler yerinde mi kontrol et.

### Known Limitations

- **Auth.js v5 beta:** next-auth'un stable sürümü v4'tür ama v4 farklı bir API'dir (App
  Router `auth()`/`handlers` yok). v4'e geçmek downgrade + yeniden yazım olacağından bilinçli
  olarak **v5 beta**'da kalınmıştır.
- **Rate-limit e-posta bazlı:** hedefli DoS'a (bir kullanıcıyı bilerek kilitleme) açıktır — kabul
  edilen denge. Çok yüksek trafikte `LoginAttempt` yerine Redis değerlendirilmeli.
- **e-Fatura / kargo API entegrasyonu yok:** yalnızca raporlama yapılır (bilinçli erteleme).

## Kapsam Dışı (bu sürümde yok)

Mobil uygulama, muhasebe/e-Fatura/e-Arşiv, kargo API entegrasyonu, SMS/e-posta bildirimleri,
çoklu depo/şirket, barkod/QR.
