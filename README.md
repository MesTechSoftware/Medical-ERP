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

**Admin:** Dashboard, Ürünler, Stok, Satıcılar (+cari), Siparişler (durum yönetimi), Kargo, Ödemeler
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
npx prisma studio    # veritabanı görüntüleyici
```

## Kapsam Dışı (bu MVP'de yok)

Mobil uygulama, muhasebe/e-Fatura/e-Arşiv, kargo API entegrasyonu, SMS/e-posta bildirimleri, çoklu depo/şirket, barkod/QR, prim/hedef, gelişmiş raporlama.
