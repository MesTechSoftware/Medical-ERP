# ADR-009 — Görsel tasarım sistemi: tek token kaynağı, uygulama düzeyinde yoğunluk, mobil web

- **Durum:** ✅ Kabul edildi
- **Tarih:** 26.10.2026
- **Kaynak soru:** Faz 1 → Faz 2 arası revize turu — "ERP Görsel Tasarım Sistemi" brief'i (kullanıcı, 26.10.2026)
- **Bağlı KARARLAR maddeleri:** **X-4** (bildirim desenleri — yapı değişmez, yalnız renk token'a geçer) · **Ü-3** (taban etiketi, `<Tutar>` tek gösterim noktası) · **§3.5** (mobil *uygulama* kalıcı kapsam dışı — bu ADR mobil uygulama değildir) · nakit uyarısının "uygundur demez" kuralı (yeşil uyum rozeti yoktur)
- **İlgili plan:** `YOL_HARITASI.md` §4 görev 2 (marka dışsallaştırma) — bu ADR'nin semantik renkleri markadan ayrı tutmasının sebebi
- **Uygulandığı commit:** tasarım 1 (token'lar, kabuk, mobil test projeleri) · tablo, form, semantik renk, yükleme adımları ayrı PR'lar

## Bağlam

Tailwind 4 kuruluydu ama tema boştu: `globals.css`'te yalnız `--color-brand` vardı. Her ekran kendi
sınıf dizisini yazıyordu:

- 23 tablo aynı başlık/satır sınıflarını elle tekrarlıyor, iki ayrı yoğunluk (`px-4 py-3` / `px-3 py-2`)
  karışık;
- durum renkleri dört yerde (`StatusBadge`, `OnayEtiketi`, stok rozeti, `Sonuc`) ve mavi bağlantı
  olmayan bir durumda (HAZIRLANIYOR) kullanılıyor;
- telefonda yönetici menüsünün 14 öğesi kullanıcı bloğuyla aynı satıra sıkışıyor, dokunma hedefleri
  36 px, `min-h-screen` (100vh) iOS adres çubuğunun altında kalıyor.

Görünüm kararı kimseye ait değildi; her yeni ekran bir öncekini kopyalıyordu.

## Karar

1. **Tek token kaynağı `src/app/globals.css`.** Renk, yoğunluk, boşluk ve hareket değerleri yalnız
   burada tanımlanır; ekranlar değer değil token kullanır.
2. **Semantik renk markadan ayrıdır.** Beş anlam: nötr, olumlu, uyarı (`critical`), hata (`negative`),
   bilgi. Marka dışsallaştırması (`--color-brand`) bunlara dokunmaz — marka değişse de "uyarı = turuncu"
   kalır. Kurallar:
   - Renk yalnız anlam taşıyorsa kullanılır ve **yanında daima metin** olur.
   - Mavi metin bağlantılara ayrılmıştır; durum etiketi mavi olmaz.
   - Her ön plan kendi arka planında ve beyazda **≥ 4,5:1** (WCAG AA). Brief'in bilgi mavisi
     (`#0070f2`) 4,04 verdiği için `#0058c2`'ye koyulaştırıldı.
3. **Yoğunluk uygulama düzeyindedir:** `<html data-density="compact">`. Aynı sayfada iki yoğunluk
   karışmaz; yazı boyutu yoğunlukla küçülmez, yalnız yükseklik ve boşluk değişir.
   - Masaüstü (fare) **compact**: kontrol/satır/araç çubuğu 32 px.
   - Telefon (`max-width: 767px`) ve dokunmatik tablet (`pointer: coarse`) **cozy**: kontrol 44 px,
     satır/araç çubuğu 48 px.
   - Kullanıcı tercihi ve şema alanı **yoktur**; altyapı ileride bir tercihe izin verir.
4. **Dokunmaya özgü kurallar tek varyantla yazılır:** `dokunmatik:` (`max-width: 767px` **veya**
   `pointer: coarse`). Dokunma hedefi ≥ 44×44 px ve input yazısı ≥ 16 px (iOS Safari yakınlaştırması)
   yalnız bu varyantla uygulanır; fareli masaüstünde 32 px ritim bozulmaz.
5. **Mobil web, aynı uygulamadır.**
   - `viewport-fit=cover`; kenar boşlukları güvenli alandan küçük olmaz (`kenar-x`, `kenar-alt`).
     Sabit (fixed) bir alt öğe eklenirse `env(safe-area-inset-bottom)` kuralı ona da uygulanır.
   - `100vh` / `*-screen` yoktur; `dvh` kullanılır.
   - Telefonda menü iki satırlı başlığın altında tam genişlik kayan şerittir; aktif sayfa şeridin
     görünür alanına alınır — **yalnız şeridin `scrollLeft`'i** ayarlanır, sayfa kaymaz.
   - Telefonda sayfa başlığı (`PageHeader`, md altı): başlık satırı kontrol yüksekliğindedir ve
     aksiyonla paylaşılır, açıklama tam genişliktedir. Aksiyon açıklamayı daraltmaz; başlık
     yüksekliği aksiyonun varlığından bağımsızdır, iskelet aynı ölçüyü kullanır (27.10.2026).
6. **Hareket "productive"tir.** Süreler kısa, eğri asla linear değil (dönen yükleme hariç), giren
   yavaşlayarak durur, çıkan hızlanarak çıkar. `prefers-reduced-motion` desteklenir; uygulama
   animasyonsuz da tam çalışır.
7. **Zorlama — testler:**
   - `src/lib/tasarim.test.ts`: kontrast, `data-density`, `100vh` yasağı; semantik renk adımında
     ham palet sınıfı yasağı (`red-…`, `blue-…` vb.; `slate`/`gray` nötrleri serbest); her
     `<button>` ve `buton()` sınıflı bağlantı `<Ikon>` taşır; `.tsx`'te emoji ve düz metin ok yoktur
     (madde 8).
   - Playwright mobil projeleri (`mobil-iphone`, `mobil-android`, `mobil-ipad`): kritik akışlar,
     yatay kayma yok, dokunma hedefi ölçümü.
   - E2E seçicileri stil sınıfına bağlanmaz (`data-*`, rol, etiket).
8. **Buton ikonları: ikon + metin, her yerde** (27.10.2026, kullanıcı kararı). Her eylem butonu ve
   buton görünümlü bağlantı bir ikon ve metin taşır.
   - İkon seti menüyle aynıdır (lucide). Emoji ve düz metin ok/çarpı (`←`, `→`, `✕`, baştaki "+ ")
     kullanılmaz.
   - Tek eşleme `src/components/Ikon.tsx`: anlamsal ad → ikon. Aynı eylem her ekranda aynı ikonu
     taşır (Düzenle kalem, Sil çöp kutusu, formu kaydeden buton disket).
   - İkon dekoratiftir (`aria-hidden`), erişilebilir ad metindir; boyut yazıya göredir (1,15 em).
   - İkon metnin önündedir; ileri yönü gösteren ok (`ileri`, `sonraki`) metnin ardındadır.
   - `SubmitButton`, `LinkButton` ve `ConfirmSubmit` ikon adını zorunlu prop olarak alır. Beklerken
     dönen gösterge ikonun yerine geçer.
   - `<details>` içinde eylem açan `<summary>` (ör. "Ters kayıt") aynı kurala uyar (`ACILIR_EYLEM`):
     tarayıcının üçgen işaretinin yerini ikon alır.
   - Yalnız ikon iki yerde görünür, erişilebilir ad yine metindir: satır içi "Kalemi sil"
     (`aria-label`) ve telefonda sayfalama (metin `sr-only`).

## Sonuçlar

- ✅ Görünüm tek dosyadan değişir; yoğunluk ve renk anlamı ekran ekran tartışılmaz.
- ✅ Marka dışsallaştırması (Faz 2 görev 2) semantik renklere dokunmadan yapılabilir.
- ✅ Telefon ve dokunmatik tablet aynı build ile tam kullanılabilir; mobil uygulama gerekmez.
- ⚠️ Telefonda tablo başlığı sabit kalmaz: dikey iç kaydırma telefonda bilinçli olarak yoktur, sayfa kayar.
- ⚠️ Tailwind `@custom-variant` kısa yazımı virgüllü media sorgusunu seçici listesi sanıp bölüyor;
  `dokunmatik` bu yüzden blok yazımla (`@slot`) tanımlıdır.

## Değerlendirilen alternatifler

- **Kullanıcı başına yoğunluk tercihi (çerez ya da `User` alanı).** Reddedildi: kullanıcı ayar ekranı
  yoktur (GÇ-11) ve masaüstünde compact yeterlidir; şema alanı bir kavram eklerdi.
- **Bileşen kütüphanesi (shadcn/ui, MUI).** Reddedildi: yeni bağımlılık ve ikinci stil sistemi;
  ihtiyaç token ve birkaç ortak sınıftır.
- **Brief'in renk değerlerini aynen almak.** Reddedildi: bilgi mavisi AA kontrastını geçmiyor.

## Açık uygulama kalemleri (atıf)

- Tablo (`.veri-tablosu`, sticky başlık ve ilk sütun, `.oncelik-dusuk`), form (etiket solda),
  `StatusChip`, iskeletler — tasarım 2–5 PR'ları
- KPI kartları ve mikro grafikler — tasarım 2. tur

## Geçerlilik sınırı

Bir renk ya da görünüm kuralı müşteriye karşı taahhüde (sözleşme eki, kabul kriteri) dönüşürse
KARARLAR'a girer; bu ADR onu geçersiz kılamaz (`README` §2.1). Dark mode, kullanıcı tercihi ya da
ikinci bir yoğunluk kademesi eklenirse bu ADR değiştirilmez, yerine yenisi yazılır (`README` §2.2).
