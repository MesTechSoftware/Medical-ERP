# Siparişlerim ekranı — KPI, süzgeç, sütun seçici, yan panel (tasarım spec'i)

> **Tarih:** 05.11.2026 · **Kaynak:** kullanıcı talebi (sohbet, 05.11.2026: "satıcı sayfaları için de aynı
> işlemleri uygula, KPI kartları ve frontend efektif olsun, gereksiz yere tekrar yüklenme durumları
> olmasın") · **Yol haritası:** Ü-31 (§7-5 gereği yazılır) · **Durum:** her satıcı sayfası tek PR, aynı
> işleyiş; spec onayı beklenmez (DEVAM_PROMPTU 05.11).
>
> Bu belge **plan**dır, karar üretmez (`YOL_HARITASI.md` §7.1-A). Dayandığı kararlar X-13 (satıcı yalnız
> kendi portföyü — kapsam sorgudadır), D-2 (SATICI sipariş girer, kendi siparişini izler), A-5 (teklif
> sayılmaz), A-3 (kısmi sevkiyat), A-8 (onay bloğu), C-6 §(3) (toplam satırlardan), E-1 (İstanbul günü),
> ADR-010 madde 2 (ekran başına en çok 4 KPI kartı). Yeni karar ya da ADR açılmaz.

## 1. Amaç

`/my-orders` satıcıya kendi siparişlerinin akışını göstersin: bu ay kaç sipariş açtı, kaçı bekliyor, kaçı
yolda, kaçı teslim edildi. Liste durum, tarih ve metinle süzülsün; siparişin kalemleri, kalanı,
sevkiyatın takip numarası listeden ayrılmadan görülsün. Ekran yönetici Siparişler ekranının (Ü-23) satıcı
kapsamlı hâlidir — **aynı süzgeç, sorgu ve bileşenler**, ikinci bir hesap yolu yok.

**Başarı ölçütü:** satıcı "Bekliyor" kartına tıklar, kartın sayısı kadar satır görür; bir satırı açar,
panelde kalemleri ve sevkiyatı görür; panel açılıp kapanırken sayfa yeniden yüklenmez, KPI satırı ve
tablo yerinde kalır (e2e: DOM düğümü korunur, tam yükleme yok).

## 2. Kapsam

| # | Kalem | Dayanak |
|---|---|---|
| 1 | KPI: Toplam sipariş (birincil) · Bekliyor · Kargolandı · Teslim edildi — seçili aralık, varsayılan bu ay, teklif hariç, satıcı kapsamlı | ADR-010 madde 2 (4 kart) · A-5-8 |
| 2 | Durum sekmeleri (Ü-23 ile aynı: Tümü … İptal · Teklif) + etkin süzgeç etiketi | ortak `HizliSekmeler` |
| 3 | Filtrele: tarih aralığı, metin (belge no, cari, klinik) — **satıcı alanı yok** | X-13 |
| 4 | Tablo: tarih, belge no, cari (+ onay çipi), klinik, tutar (KDV dahil), sevk, durum, Detay — satıcı sütunu yok | Ü-23 §3.4 |
| 5 | Sütun seçici (ayrı çerez `siparislerim-sutunlar`, yolu `/my-orders`), sayfalama, boş durum, iskelet | ortak bileşenler |
| 6 | Yan panel (`?detay=`): özet (satıcı satırı yok, cari adı düz metin), kalemler, tutarlar, sevkiyatlar, iadeler, Tam detay → `/my-orders/[id]` | Ü-23 §3.5 |

**Kapsam dışı:** sipariş formu (`/my-orders/new`) ve detay sayfası (`/my-orders/[id]`) değişmez; panelden
işlem yok. Cari adından Doktorlarım paneline bağlantı Doktorlarım ekranıyla (Ü-32) gelir.

## 3. Kapsam kuralı (X-13)

- Sorgular `saticiId` alır (`siparisKosulu`, `siparisListesi`, `siparisKpileri` → `siparisDagilimi`,
  `siparisPaneli`). Satıcı ekranı oturumdaki kullanıcının kimliğini verir; kapsam `where`'dedir.
- Adresteki `satici` parametresi yok sayılır (süzgeç `satici: null`); etiketi de çıkmaz. Kapsamı
  genişletemez, daraltmaz.
- Başka satıcının sipariş kimliği `?detay=` ile gelirse panel `null` döner, açılmaz (öbür üç panel
  okuması kimliğe bağlıdır; sonuçları atılır, hiçbir şey gösterilmez).
- Kart = açtığı süzgecin satır sayısı, aynı kapsamla (A-5-8'in satıcı kapsamlı hâli).

## 4. Verimlilik ("gereksiz yeniden yükleme yok")

Ölçüm (05.11, geliştirme sunucusu): yönetici Siparişler'de panel açmak tek RSC isteği, ~100 ms; iskelet
görünmez, kabuk ve tablo DOM'u korunur. Satıcı ekranı aynı deseni izler:

- Bütün gezinmeler istemci tarafındadır: sekme/kart/etiket/sayfalama `Link`, Filtrele `next/form`
  (`SuzgecFormu`), panel aç/kapat `scroll={false}`, Esc ve arka plan `router.replace`. Tam sayfa yüklemesi
  yoktur; KPI satırı ve tablo yeniden kurulmaz (e2e işaretli DOM düğümüyle ölçer).
- Sayfanın üç okuması (liste, KPI, panel) tek `Promise.all` turundadır; yönetici ekranındaki satıcı
  seçenekleri sorgusu bu ekranda yoktur.
- Alt sayfalar (`new`, `[id]`) liste iskeletini değil genel iskeleti gösterir.
- **Bilinçli sınır:** `?detay=` arama parametresi olduğundan panel açılınca sunucu liste ve KPI
  sorgularını da yeniden koşar (Next'in arama parametresi modeli; Cache Components kapalı). Bunu
  kaldırmanın yolları — paralel/araya giren rota (`@panel`) ya da `cacheComponents` — bütün liste
  ekranlarının adres düzenini ya da uygulamanın önbellek modelini değiştirir; satıcı başına birkaç düzine
  satırda maliyet onlarca milisaniyedir. Ayrı iş olarak kalır.

## 5. Bileşenler

Yönetici ekranının `KpiKartlari`, `SuzgecCubugu`, `SiparisTablosu`, `SiparisPaneli` bileşenleri
`src/components/siparis/`'e taşınır ve `yol` (`/orders` | `/my-orders`) alır; yönetici davranışı
değişmez (varsayılan `/orders`). Süzgeç modülünün adres üreticileri (`siparisAdresi`, `hizliSekmeler`,
`kartAdresi`, `etkinSuzgecler`) aynı `yol`'u alır. Satıcı kartları `SATICI_DURUM_KARTLARI`, sütunlar
`SATICI_SUTUNLARI`.

## 6. Test

- Birim: adres üreticileri `/my-orders` yazar, varsayılan `/orders` kalır.
- Entegrasyon: liste, KPI ve panel yalnız satıcının siparişleri; `satici` süzgeci kapsamı genişletemez;
  kart = süzgecin satırı; kapsamsız çağrı herkesi sayar; başka satıcının panel kimliği `null`.
- E2e (`e2e/seller/siparislerim.spec.ts`): 4 kart / 3 bağlantı, Bekliyor kartı = satır; liste = satıcının
  sipariş sayısı; Filtrele'de satıcı alanı yok; başka satıcının `?detay=`'si açılmaz; panel aç/kapat
  yumuşak gezinme ve DOM korunur; Tam detay; sütun seçici; kartlar taşmaz, iskelet eşleşir.
