# Medikal Satış Operasyon Yönetim Sistemi

Merkezi depodaki medikal ürünlerin ~10 satıcı aracılığıyla doktorlara ulaştırıldığı bir firmanın operasyonlarını (ürün, merkezi stok, sipariş, kargo, ödeme, satıcı cari hesabı) tek sistemde yöneten web uygulaması. MVP.

## Teknoloji

- **Next.js 16** (App Router, Server Actions) — full-stack, tek proje
- **SQLite + Prisma 7** (better-sqlite3 driver adapter)
- **Auth.js (NextAuth v5)** — Credentials, rol bazlı (ADMIN / SELLER)
- **Tailwind CSS 4**

> **Not:** Tüm parasal değerler veritabanında **integer kuruş** olarak saklanır (150,50 TL → `15050`). Gösterimde `src/lib/money.ts` içindeki `formatTRY` kullanılır.

## Kurulum

```bash
npm install
npx prisma migrate dev      # veritabanı + tablolar
npm run db:seed             # örnek demo verisi
npm run dev                 # http://localhost:3000
```

## Demo Hesapları

| Rol    | E-posta                | Şifre       |
| ------ | ---------------------- | ----------- |
| Admin  | admin@medikal.local    | `admin123`  |
| Satıcı | ahmet@medikal.local    | `satici123` |
| Satıcı | ayse@medikal.local     | `satici123` |
| Satıcı | mehmet@medikal.local   | `satici123` |

## Roller ve Ekranlar

**Admin:** Dashboard, Ürünler, Stok, Satıcılar (+cari), Siparişler (durum yönetimi), Kargo, Ödemeler, Audit Log
**Satıcı:** Siparişlerim (+yeni sipariş), Hesabım (cari/bakiye)

## İş Kuralları (özet)

- **Sipariş oluşturma:** birim fiyat, sipariş anındaki ürün fiyatından snapshot alınır. Kaydederken tek transaction'da Order + kalemler + stok düşümü + `OUT` stok hareketi yapılır; stok yetersizse iptal edilir.
- **Sipariş iptali:** stok geri yüklenir (`IN` hareketi), sipariş cari toplamına dahil edilmez.
- **Cari hesap:** ayrı tablo değildir, hesaplanır (`src/lib/cari.ts`):
  `Güncel Bakiye = Toplam Satış (iptal hariç) − Toplam Ödeme`
- **Durum akışı:** Bekliyor → Hazırlanıyor → Kargolandı (kargo ekranından) → Teslim Edildi. Her aşamada iptal mümkün (teslim/iptal hariç).

## Komutlar

```bash
npm run dev          # geliştirme sunucusu
npm run build        # production build
npm run db:seed      # demo verisini yeniden yükle (mevcut veriyi siler)
npm run db:reset     # migration'ları sıfırla
npm run backup       # veritabanını yedekle (+ bütünlük doğrulaması)
npx prisma studio    # veritabanı görüntüleyici
```

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
üzerinde** (+ `before`/`after` snapshot). Kapsam: ürün/satıcı oluşturma-güncelleme, stok
girişi, sipariş oluşturma/iptal/durum değişikliği, ödeme kaydı ve auth olayları (başarılı/
başarısız giriş, çıkış). `Admin → Audit Log` ekranında son 100 kayıt filtrelenerek görülür
(salt okunur).

- **Hassas veri koruması:** `passwordHash`, `password`, `token`, `secret` gibi alanlar
  merkezî `sanitizeAuditData()` ile (iç içe nesnelerde de) temizlenir — hiçbir audit
  kaydında görünmez. Merkezî olduğu için yeni action eklendiğinde sızma riski yoktur.
- **Non-blocking:** audit yazımı iş transaction'ı COMMIT olduktan sonra, `redirect`'ten önce
  çağrılır; audit hatası ana işlemi geri almaz/bozmaz.

### Nesne düzeyi yetki (IDOR)

Rol kontrolüne (`requireAdmin`/`requireSeller`) ek olarak, satıcı verisine erişen her sorgu
`sellerId: session.user.id` ile kapsanır; başkasının siparişi/carisi `id` değiştirilerek
görülemez (kayıt yoksa `notFound()`). Mevcut satıcı yüzeyleri (`my-orders` liste/detay,
`account`, sipariş oluşturma) bu koşulu sağladığı **doğrulanmıştır**.

### Girdi Doğrulama (Zod)

Para/miktar-kritik alanlar sunucu tarafında Zod ile doğrulanır (`src/lib/validation.ts`):
ödeme tutarı, ürün fiyatı, stok/sipariş miktarı. Negatif, ondalıklı-kuruş (örn. 12,345),
NaN/Infinity veya aşırı büyük değerler reddedilir — böylece cari sessizce bozulmaz. Kapsam
bilinçli olarak finansal alanlarla sınırlıdır; diğer alanlar mevcut kontrollerini korur.

### Yedekleme & Restore

```bash
npm run backup   # backups/backup-YYYY-MM-DD-HH-mm.db
```

Yedek, düz dosya kopyası değil `better-sqlite3`'ün `db.backup()` API'si ile alınır (WAL
modunda tutarlı, uygulama açıkken güvenli). **"Test edilmemiş yedek, yedek değildir":** script
yedeği aldıktan hemen sonra dosyayı geri açıp `integrity_check` + satır sayısı ile doğrular;
sorun varsa non-zero exit ile durur.

**Otomatikleştirme (öneri):** düzenli yedek için sistem zamanlayıcısı — örn. cron:

```cron
0 * * * *  cd /path/to/proje && npm run backup   # saatte bir
```

**Restore prosedürü (elle — bilinçli işlem):**

1. Uygulamayı durdur.
2. Mevcut `dev.db`'yi kenara al (örn. `dev.db.bak`).
3. İstenen yedeği kopyala: `cp backups/backup-....db dev.db`
4. `npm run dev` ile aç; veriler yerinde mi kontrol et.

### Known Limitations

- **Auth.js v5 beta:** next-auth'un stable sürümü v4'tür ama v4 farklı bir API'dir (App
  Router `auth()`/`handlers` yok). v4'e geçmek downgrade + yeniden yazım olacağından bilinçli
  olarak **v5 beta**'da kalınmıştır.
- **Rate-limit memory tabanlı:** 5 hatalı denemede e-posta 10 dk kilitlenir (form + ham
  `/api/auth/callback/credentials` POST). Sunucu restart'ında sıfırlanır; çok sunuculu
  production'da paylaşımlı store (Redis) gerekir. E-posta bazlı kilit hedefli DoS'a (bir
  kullanıcıyı bilerek kilitleme) açıktır — MVP için kabul edilen denge.
- **SQLite tek dosya/tek sunucu:** ~10 satıcı, düşük eşzamanlılık için uygundur. Ölçek
  artarsa (yüksek eşzamanlı yazma) PostgreSQL'e geçiş ve yedek/rate-limit stratejisinin
  yeniden değerlendirilmesi gerekir.
- **Oturum iptali gecikmeli:** Yetki JWT'den (login anındaki snapshot) doğrulanıyor; bir
  kullanıcı "Pasif" yapıldığında veya rolü değiştiğinde bu, mevcut oturuma **token süresi
  dolana kadar** yansımaz. Anlık iptal için `requireSession()` içinde canlı DB doğrulaması
  gerekir (yol haritası — bkz. `PROJE_DURUMU.md`).

> **Yol haritası:** Demo sonrası ele alınacak mühendislik bulguları (oturum iptali, stok
> yarışı/PostgreSQL, hata sınırları, CI, sayfalama, birim testler) `PROJE_DURUMU.md`'de
> önceliklendirilmiş olarak listelenmiştir.

## Kapsam Dışı (bu MVP'de yok)

Mobil uygulama, muhasebe/e-Fatura/e-Arşiv, kargo API entegrasyonu, SMS/e-posta bildirimleri, çoklu depo/şirket, barkod/QR, prim/hedef, gelişmiş raporlama.
