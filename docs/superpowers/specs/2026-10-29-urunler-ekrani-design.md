# Ürünler ekranı — KPI, süzgeç, sütun seçici, yan panel (tasarım spec'i)

> **Tarih:** 29.10.2026 · **Kaynak:** kullanıcı talebi (sohbet, 28.10.2026: "Kapsamlı sayfa modernizasyonu"
> isterinin §2-A maddesi; altı modül sırayla, her biri kendi Ü numarası ve D1–D3 PR'larıyla — bu ilki)
> · **Yol haritası:** Ü-19 (§7-5 gereği yazılır) · **Durum:** kullanıcı tasarımı onayladı (29.10.2026)
>
> Bu belge **plan**dır, karar üretmez (`YOL_HARITASI.md` §7.1-A). Kullandığı her tanım mevcut bir
> karara, ADR'ye ya da Ü-18'de kurulan kalıba dayanır; yeni karar ya da ADR açılmaz.

## 1. Amaç

`/products` (yönetici ve operasyon ürün kataloğu) tek bakışta stok riskini göstersin, kritik ürünler
süzülebilsin, bir ürünün son hareketlerine ve fiyat listelerine sayfadan çıkmadan bakılabilsin.
Bugünkü davranış (Yeni Ürün, Düzenle, Sil, OPERASYON'un yalnız görmesi) bozulmaz.

**Başarı ölçütü:** bir yönetici "stoğu kritik olan aktif ürünleri" tek tıkla listeler; satırda KDV
hariç (istenirse dahil) liste fiyatını ve stok rozetini görür; ürün adına tıklayıp son 90 günün stok
eğrisine, son hareketlere ve ürünün geçtiği fiyat listelerine listeden ayrılmadan bakar.

**Yan kazanç:** liste fiyatı ve stok bugün ürün başına ayrı sorguyla okunuyor; toplu okumaya geçer.

## 2. Kapsam

### Kapsamda

| # | Kalem | Dayanak |
|---|---|---|
| 1 | KPI kartları: Toplam · Aktif · Kritik stok · Pasif | ADR-010 `KpiCard` · ADR-009 iki seviyeli stok |
| 2 | Hızlı sekmeler + etkin süzgeç etiketleri (`durum`, `stok`) | Ü-18 kalıbı |
| 3 | Sütun seçici; KDV dahil sütunu varsayılan gizli | Ü-3 taban etiketi · kullanıcı seçimi 3-A |
| 4 | Sayfalama + süzgece göre boş durum | Ü-18 kalıbı |
| 5 | Sağdan yan panel: özet, 90 günlük stok grafiği, son hareketler, fiyat listeleri | `YanPanel` · `Sparkline` (ADR-010) · kullanıcı seçimi 4-A |
| 6 | Toplu stok ve toplu liste fiyatı okuması | B-4 / ADR-005 tek okuma yolu · X-10 §(5) |
| 7 | Ortak sütun modülü ve bileşenleri (Doktorlar ekranı da geçer) | Ü-18 §3.4 |

### Kapsam dışı

- **`deleteProduct` (C-3 açık gözlemi)** — Sil düğmesi bugünkü davranışıyla kalır.
- **Ürün detay sayfası** — yok; panelin "Tam detay" bağlantısı olmaz, Düzenle bağlantısı olur.
- **Arama kutusu** — isterde yok.
- **Stok ekranındaki konsinye döngüsü** (`/stock`, konum × ürün) — Stok modülünün (Ü-20) işi.

## 3. Ekran

### 3.1 KPI kartları

- `KpiSatiri` içinde dört `KpiCard`; `karsilastirma: { anlik: "şu an" }`, trend yok, `bosDavranisi: "sifir"`.
- Sayımlar **süzgeçten bağımsızdır** (tüm ürünler):

  | Kart | Tanım | Tıklayınca |
  |---|---|---|
  | Toplam | `product.count()` | `/products` |
  | Aktif | `status: AKTIF` | `?durum=AKTIF` |
  | Kritik stok | aktif ürünlerden `stokDurumu(stok) !== null` (tükendi dahil, ≤ `CRITICAL_STOCK`) | `?durum=AKTIF&stok=kritik` |
  | Pasif | `status: PASIF` | `?durum=PASIF` |

- Kritik stok > 0 ise uyarı tonunda.
- Kart sayısı ile tıklanınca gelen satır sayısı aynıdır (kritik kartı `durum=AKTIF` ile birleşik adres açar).

### 3.2 Süzgeç çubuğu

- **Hızlı sekmeler:** Tümü · Aktif · Pasif · Kritik stok · Tükendi. Her biri süzgeç adresinin
  kısayoludur; "Tümü" süzgeçleri temizler. İki süzgeç alanı olduğu için ayrı Filtrele paneli yoktur.

  | Parametre | Değerler | Anlamı |
  |---|---|---|
  | `durum` | `AKTIF` · `PASIF` | `Product.status` |
  | `stok` | `kritik` · `tukendi` | `kritik`: `stokDurumu(stok) !== null` (tükendi dahil) · `tukendi`: `stok <= 0` |

- İki parametre birleşir ("Kritik stok" sekmesi `stok=kritik` yalnızdır; pasif ürünü de gösterir —
  KPI kartı ise `durum=AKTIF` ekler).
- **Etkin süzgeçler** çubuğun altında × ile kaldırılabilen etiketlerdir ("Durum: Aktif ×").
- **Sütunlar** düğmesi sekmelerin sağındadır (§3.4).
- **Sayfalama** süzgeçleri ve sütun tercihini korur.

### 3.3 Tablo

| Sütun | İçerik | Gizlenebilir | Varsayılan |
|---|---|---|---|
| Ürün | Ad; mavi, altı çizili, `›` ikonlu; yan paneli açar | hayır | görünür |
| Kod | bugünkü gibi | evet | görünür |
| Liste Fiyatı (KDV hariç) | `<Tutar taban={MATRAH} baslikta>`; çözülemezse "—" | evet | görünür |
| Liste Fiyatı (KDV dahil) | `<Tutar taban={BRUT} baslikta>`; çözülemezse "—" | evet | **gizli** |
| KDV | oran | evet | görünür |
| Stok | `StokMiktari` (iki seviyeli rozet) | evet | görünür |
| Durum | `StatusBadge` (Aktif/Pasif) | evet | görünür |
| İşlem | Düzenle · Sil (yalnız `YONETICI`) | hayır | görünür |

- **KDV dahil liste fiyatı** yeni aritmetik yazmaz: `hesaplaSatirTutarlari([{ birimFiyat: liste,
  listeFiyat: liste, miktar: 1, kdvOrani }]).toplam.toplam` — 1 adetlik sipariş satırıyla aynı
  yuvarlama (X-5 §(4) izinli dosya).
- Sıralama bugünkü gibi `createdAt desc`.
- **Dar ekran:** `oncelik-dusuk` kuralı sürer (Kod, KDV).

### 3.4 Sütun seçici

- Davranış Ü-18 §3.4 ile aynıdır; çerez `urun-sutunlar`, `path=/products`, 1 yıl, `sameSite=lax`, `httpOnly`.
- **Varsayılan gizli sütun:** çerez **yoksa** sütun tanımındaki varsayılan uygulanır (KDV dahil gizli).
  Çerez **varsa** yalnız çerezdeki küme gizlidir. Hiçbir sütun gizli değilse değer `-` yazılır —
  boş değer ile çerezin yokluğu karışmaz.
- "Varsayılana dön" çerezi siler.

### 3.5 Boş durum

| Durum | Metin | Eylem |
|---|---|---|
| Hiç ürün yok, süzgeç yok | "Henüz ürün yok." | Yeni Ürün (yalnız `YONETICI`) |
| Yalnız `stok=kritik` | "Kritik stokta ürün yok." | — |
| Yalnız `stok=tukendi` | "Tükenen ürün yok." | — |
| Diğer süzgeçler | "Bu süzgeçlere uyan ürün bulunamadı." | Süzgeçleri temizle |

### 3.6 Yan panel

- **Açılış:** Ürün bağlantısı `urunAdresi(suzgec, { sayfa, detay: id })`, `scroll={false}`,
  `data-kayit={id}`. Sunucu paneli listeyle birlikte çizer. Kabuk `src/components/YanPanel.tsx`.
- **Geçersiz kimlik:** kimlik geçersiz ya da kayıt yoksa panel açılmaz, liste normal görünür.
- **İçerik** (yukarıdan aşağıya):
  1. **Başlık:** ad, kod, stok ve durum rozetleri (tabloyla aynı bileşenler)
  2. **Özet:** stok, KDV oranı, liste fiyatı KDV hariç ve dahil (sütun gizli olsa da panelde ikisi de görünür)
  3. **Stok grafiği:** son 90 günün gün sonu stok seviyesi, `Sparkline`; `ozet` metni "90 gün önce N → bugün M"
  4. **Son 10 stok hareketi:** tarih, tür (§4.3 `hareketTuru`), konum, ± miktar (giriş `+`, çıkış `−`)
  5. **Fiyat listeleri:** ürünün satırı bulunan listeler; liste başına kod, ad, (varsayılan / pasif
     etiketi), bugün ve sonrası geçerli satırlar `minQuantity` sırasıyla: en az adet, `<Tutar taban={MATRAH}>`,
     geçerlilik. Satırı olmayan ürün: "Bu ürün hiçbir fiyat listesinde yok."
  6. **Alt (sabit):** Düzenle (`/products/[id]/edit`, yalnız `YONETICI`) · Stok girişi (`/stock?urun=id`)
- **Yetki:** `requireStaff`. OPERASYON paneli görür; Düzenle, Sil ve Yeni Ürün görmez (D-2 17.10 eki).

## 4. Veri katmanı

### 4.1 Toplu okuma — tek hesap yolu

**`src/lib/stok.ts`:**

- **`hesaplaStoklar(urunIdler, konumId?, tarih?, db?) → Map<string, number>`** — tek
  `stockMovement.groupBy({ by: [productId, type] })`; hareketi olmayan ürün 0. `hesaplaStok()` bunun
  `[urunId]` sarmalayıcısı olur (imza ve davranış aynı). B-4 "tek okuma yolu" korunur.
- **`aktifUrunStoklari()`** `hesaplaStoklar` ile yazılır; çıktısı aynı (dashboard bundan okur).
- **`stokSerisi(urunId, gunSayisi, db?) → { gun: string; stok: number }[]`** — son `gunSayisi` İstanbul
  gününün gün sonu stoğu, eskiden yeniye. Başlangıç = `hesaplaStok(urun, —, ilkGün − 1)`; sonra
  aralıktaki hareketler gün gün eklenir (`zaman.ts` gün sınırları, E-1). Her nokta
  `hesaplaStok(urun, undefined, gün)` ile aynıdır; son nokta bugünkü stoktur.

**`src/lib/fiyat.ts`:**

- İç yardımcı **`listedenFiyatlar(listeId, urunIdler, kosul, db)`** — tek `priceListItem.findMany`
  (aynı tarih ve `minQuantity <= miktar` koşulu), ürün başına en yüksek `minQuantity`.
  `cozumleBirimFiyat` satır seçimini buradan yapar (davranışı aynı).
- **`cozumleListeFiyatlari(urunIdler, kosul, db?) → Map<string, FiyatSonucu>`** — varsayılan listeyi
  (`pricing.varsayilanFiyatListesiKodu`) bir kez çözer; liste yoksa her ürün `LISTE_YOK`.

### 4.2 Liste sorguları

`src/lib/urun-listesi/sorgu.ts` (veritabanına bağlı):

- **`urunListesi(suzgec, sayfalama)`:**
  1. `product.findMany({ where: durum, orderBy: createdAt desc, include: taxRate })` — süzgeç `durum`'u SQL'de
  2. `hesaplaStoklar(tüm kimlikler)` — tek sorgu
  3. `stok` süzgeci bellekte (`stokDurumu`), ardından sayfalama
  4. Sayfa kimlikleriyle `cozumleListeFiyatlari` + KDV dahil fiyat (§3.3)

  Not: stok hesaplanan değer olduğundan süzme bellekte yapılır; katalog binler mertebesindeyken
  yeterlidir. Ölçek aşılırsa SQL'e taşıma ayrı iş olur.
- **`urunKpileri()`** — dört sayım; kritik sayımı `aktifUrunStoklari()` + `stokDurumu`.
- **`urunPaneli(id)`** — ürün + KDV; `hesaplaStok`; `stokSerisi(id, 90)`; son 10 `StockMovement`
  (konum adı ve kaynak belge kimlikleri); fiyat listesi satırları (`validTo` boş ya da > bugün),
  liste kodu/adı/`isActive`; liste fiyatı (`cozumleListeFiyatlari([id])`). Bulunamazsa `null`.

### 4.3 Saf modüller (birim testli; `db.ts`'e dokunmaz)

- **`src/lib/liste/sutunlar.ts`** (ortak; Doktorlar ekranı da geçer):
  - `SutunTanimi<K> = { anahtar: K; baslik: string; varsayilanGizli?: boolean }`
  - `gizliSutunlariCoz(sutunlar, deger | undefined)` — `undefined` → varsayılan gizliler; `-` → boş küme;
    bilinmeyen anahtar yok sayılır
  - `gizliSutunCerezi(sutunlar, gizli)` — boşsa `-`
  - `guvenliDonus(yol, donus)` — yalnız `yol` ile başlayan adres, değilse `yol`
  - `doktor-listesi/sutunlar.ts` bu modülün üstüne iner (anahtar listesi ve çerez adı orada kalır).
- **`src/lib/urun-listesi/suzgec.ts`:** `UrunSuzgeci`, `BOS_SUZGEC`, `suzgecCoz(params) → { suzgec, sayfa,
  detay }`, `urunAdresi(suzgec, ek?)` (tek adres üreticisi), `etkinSuzgecler`, `bosDurumTuru`, `HIZLI_SEKMELER`.
- **`src/lib/urun-listesi/sutunlar.ts`:** `SUTUNLAR` (KDV dahil `varsayilanGizli`), `SUTUN_CEREZI = "urun-sutunlar"`.
- **`src/lib/stok-hareket-turu.ts`:** `hareketTuru(hareket) → etiket` kaynak belge bağından: sevkiyat →
  "Sevkiyat" · iade → "İade" · konsinye → "Konsinye" · transfer → "Transfer" · düzeltme → "Düzeltme" ·
  içe aktarım partisi → "Açılış" · sipariş (1B-7a öncesi) → "Sipariş" · hiçbiri → "Stok girişi".
  Stok ekranı (Ü-20) da kullanacak.

### 4.4 Bileşenler

| Dosya | Görevi |
|---|---|
| `src/components/liste/SutunSecici.tsx` | Ü-18'deki bileşenin genel hali: `sutunlar`, `gizli`, `action`, `donus` alır. Doktorlar ekranı da kullanır |
| `src/components/liste/BosDurum.tsx` | ikon + başlık + isteğe bağlı eylem bağlantısı/düğmesi, `colSpan`. Doktorlar ekranı da kullanır |
| `src/app/(admin)/products/page.tsx` | orkestrasyon: `requireStaff`, `suzgecCoz`, sorgular, çerez |
| `src/app/(admin)/products/KpiKartlari.tsx` | KPI kartları |
| `src/app/(admin)/products/SuzgecCubugu.tsx` | sekmeler + etkin etiketler + Sütunlar |
| `src/app/(admin)/products/sutunEylemi.ts` | `"use server"`; çerez yazar, `redirect` |
| `src/app/(admin)/products/UrunTablosu.tsx` | satırlar, rozetler, boş durum |
| `src/app/(admin)/products/UrunPaneli.tsx` | panel içeriği |

`ProductForm.tsx`, `actions.ts`, `new/`, `[id]/edit/` değişmez.

## 5. Hata davranışı

- Geçersiz süzgeç değeri yok sayılır (etiketi de çıkmaz).
- Liste fiyatı çözülemezse hücre "—" (bugünkü gibi); KDV dahil de "—".
- Panel verisi düşerse sayfanın hata sınırı (`src/app/error.tsx`) devreye girer.
- Çerez değeri bozuksa varsayılan görünüm.

## 6. Testler

**Kabul kriterleri `KABUL_KRITERLERI.md`'ye testten önce yazılır** (numara karar kimliğinden):

- **B-4-7:** `hesaplaStoklar` her ürün ve konum için `hesaplaStok` ile aynıdır; `stokSerisi`'nin her
  noktası o günün `hesaplaStok(urun, —, gün)` değeridir. Stok hareketi toplaması yalnız `stok.ts`'tedir.
- **X-10-4:** ürün listesi ve panelindeki liste fiyatı varsayılan listedendir; `cozumleListeFiyatlari`
  her ürün için `cozumleBirimFiyat(urun, null, …)` ile aynıdır.
- **Ü-3-2:** ürün listesindeki KDV dahil liste fiyatı `BRUT` taban etiketini taşır ve 1 adetlik satırın
  `hesaplaSatirTutarlari` toplamıdır.
- **D-2-2:** OPERASYON ürün listesini ve panelini görür; Yeni Ürün, Düzenle ve Sil görmez.

| Katman | Dosya | Neyi doğrular |
|---|---|---|
| Birim | `src/lib/liste/sutunlar.test.ts` | Çerez yok → varsayılan gizliler; `-` → hepsi görünür; bilinmeyen anahtar; gidiş-dönüş; `guvenliDonus` |
| Birim | `src/lib/doktor-listesi/sutunlar.test.ts` | Mevcut testler değişmeden geçer |
| Birim | `src/lib/urun-listesi/suzgec.test.ts` | Çözme/adres gidiş-dönüş; geçersiz değer; birleşik süzgeç; etiketler ve kaldırma adresleri; sayfa ve detay korunur; boş durum türü |
| Birim | `src/lib/stok-hareket-turu.test.ts` | Her kaynak belge türü; kaynaksız giriş |
| Birim | `src/lib/tek-cagri.test.ts` (genişler) | `stockMovement.groupBy/aggregate` ve `FROM "StockMovement"` yalnız `stok.ts`'te |
| Entegrasyon | `src/lib/stok.itest.ts` (genişler) | `hesaplaStoklar` ≡ `hesaplaStok` (konumlu/konumsuz, tarihli, hareketsiz ürün, boş liste); `stokSerisi` her noktası ≡ `hesaplaStok(gün)`, İstanbul gece yarısı sınırı |
| Entegrasyon | `src/lib/fiyat.itest.ts` (genişler) | `cozumleListeFiyatlari` ≡ `cozumleBirimFiyat(…, null, …)`: barem, tarih aralığı, satırsız ürün, varsayılan liste yok |
| Entegrasyon | `src/lib/urun-listesi/sorgu.itest.ts` | `durum` + `stok` birleşimi; kritik/tükendi sınırı (10, 0, negatif); sayfalama süzgeçten sonra; KPI sayıları; panel `null`; panel fiyat listesi satırları (süresi geçmiş satır yok) |
| E2E | `e2e/admin/urunler.spec.ts` | KPI kartı → süzgeç + etiket; × ile kaldır; KDV dahil sütunu varsayılan gizli → aç → yenile → görünür; panel aç → içerik; Esc → odak ada; boş durum → Süzgeçleri temizle |
| E2E | `e2e/operasyon/operasyon.spec.ts` (genişler) | OPERASYON paneli görür; Yeni Ürün, Düzenle, Sil görmez |
| E2E | `e2e/mobil/urunler.spec.ts` | Panel tam ekran açılır |
| E2E | mevcut | `products.spec.ts`, `doktorlar.spec.ts`, `dashboard.spec.ts` değişmeden geçer (seçici çakışması çıkarsa kapsamlanır) |

E2E'yi push'tan önce yerelde koşarım (`medikal_test`).

## 7. Belgeler

- **`YOL_HARITASI.md`:** Ü-19 satırı (D3'te ✅).
- **`KABUL_KRITERLERI.md`:** §6'daki kriterler.
- **`TRACEABILITY.md`:** `npm run izlenebilirlik` ile yeniden üretilir.
- **`PROJE_DURUMU.md`:** arayüz bölümüne Ürünler ekranı (D3).
- **`MD_files/DEVAM_PROMPTU.md`:** ▶ satırı ve altı modüllük sıra (Ürünler → Stok → Fiyat listeleri →
  Kullanıcılar → Siparişler → Kargo) ile 28.10 seçimleri (1-A … 13-A).

## 8. Teslim

Her adım ayrı PR; CI yeşil görülmeden merge edilmez.

| PR | Dal | İçerik |
|---|---|---|
| D1 | `revize/urunler-d1-veri` | Bu spec · plan · kriterler · Ü-19 · `hesaplaStoklar`, `stokSerisi`, `cozumleListeFiyatlari` · `liste/sutunlar.ts` (Doktorlar geçer) · `urun-listesi/` saf modüller + sorgular · `stok-hareket-turu.ts` · birim ve entegrasyon testleri. Ekran değişmez. |
| D2 | `revize/urunler-d2-tablo` | Ortak `SutunSecici`/`BosDurum` (Doktorlar geçer) · KPI · sekmeler ve etiketler · tablo (KDV dahil sütunu) · sütun seçici · sayfalama · boş durum · e2e |
| D3 | `revize/urunler-d3-panel` | Yan panel · e2e (admin, operasyon, mobil) · belgelerin kapanışı |

Not: sütun seçici Ü-18'de D3'teydi; burada ortak bileşen hazır olduğundan tabloyla birlikte D2'ye alınır.
