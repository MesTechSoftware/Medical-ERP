# Stok ekranı — KPI, hareket geçmişi süzgeci, sütun seçici, işlemi yapan (tasarım spec'i)

> **Tarih:** 01.11.2026 · **Kaynak:** kullanıcı talebi (sohbet, 28.10.2026: "Kapsamlı sayfa modernizasyonu"
> isterinin §2-B maddesi; altı modülün ikincisi) · **Yol haritası:** Ü-20 (§7-5 gereği yazılır) ·
> **Durum:** kullanıcı seçimleri onaylandı (01.11.2026, sorular 1–10 hepsi önerilen)
>
> Bu belge **plan**dır, karar üretmez (`YOL_HARITASI.md` §7.1-A). Tek yeni "ne" kalemi — stok
> hareketinin işlemi yapan kullanıcıyı taşıması — 28.10 ürün sahibi seçimidir ve `KARARLAR.md` B-4'e
> **ek** olarak yazılır (§7); spec o eke dayanır. Yeni ADR açılmaz.

## 1. Amaç

`/stock` (yönetici ve operasyon) tek bakışta stok durumunu ve günün hareketini göstersin; hareket
geçmişi tarih, tür ve yöne göre süzülebilsin; her hareketin kaynak belgesi ve işlemi yapan kişi
görünsün. Formlar (giriş, düzeltme, konsinye, transfer) bugünkü davranışıyla kalır.

**Başarı ölçütü:** bir yönetici "bugün yapılan çıkışları" tek tıkla listeler; satırda ürünü, kaynak
belgeyi (ör. "Sevkiyat · SVK-…"), konumu, işaretli miktarı ve işlemi yapanı görür; ürün adına tıklayıp
Ü-19 ürün paneline geçer.

**Yan kazanç:** "Konsinyedeki Mal" kartı bugün konum × ürün başına ayrı sorgu atıyor; toplu okumaya geçer.

## 2. Kapsam

### Kapsamda

| # | Kalem | Dayanak |
|---|---|---|
| 1 | KPI kartları: Stoktaki ürün · Kritik stok · Bugün giriş · Bugün çıkış | ADR-010 `KpiCard` · seçim 4-A, 28.10 "ürün çeşidi + alt notta adet" |
| 2 | Hareket süzgeci: tarih aralığı (hızlı sekmeler + alanlar), tür, yön | Ü-18 kalıbı · seçimler 5-A, 6-A, 7-A |
| 3 | Tablo: tarih, ürün, tür + belge no, konum, ± miktar, açıklama, işlemi yapan | seçimler 3-A, 8-A, 10-A |
| 4 | Sütun seçici, sayfalama, süzgece göre boş durum | Ü-19 ortak bileşenleri |
| 5 | `StockMovement.createdById` + eski kayıtların kaynak belgeden doldurulması | KARARLAR B-4 eki (§7) · seçimler 1-A, 2-A |
| 6 | Konsinyedeki mal toplu okuma (`konumStoklari`) | B-4 / ADR-005 tek okuma yolu |
| 7 | Ortak süzgeç parçaları: adres parametresi yardımcıları ve süzgeç çubuğu bileşenleri (Doktorlar, Ürünler, Denetim kaydı geçer) | Ü-19 kod gözden geçirmesi (PR #85 notu) — dördüncü kopya yazılmaz |

### Kapsam dışı

- **Formların içeriği ve yerleşimi** — giriş, düzeltme, konsinye, transfer bugünkü gibi solda (seçim 9-A).
- **Stok ekranına ayrı yan panel** — ürün adı Ü-19 ürün paneline gider.
- **Ürün ve konum süzgeci** — isterde yok (seçim 7-A).
- **Belge numarasına bağlantı** — düz metin (seçim 8-A).
- **Renkli yön** — ADR-009 §2 (seçim 3-A); yön `+`/`−` ve metinle okunur.

## 3. Ekran

### 3.1 Yerleşim

`PageHeader` → KPI satırı (tam genişlik) → bugünkü iki sütun: solda formlar ve "Konsinyedeki Mal"
(`lg:col-span-1`), sağda "Hareket Geçmişi" kartı (`lg:col-span-2`): süzgeç çubuğu, tablo, sayfalama.
Telefonda sıra bugünkü gibidir (formlar üstte).

### 3.2 KPI kartları

- `KpiSatiri` içinde dört `KpiCard`; `karsilastirma: { anlik: "şu an" }` (bugünkü kartlarda `"bugün"`),
  trend yok, `bosDavranisi: "sifir"`. Sayımlar **süzgeçten bağımsızdır**.

  | Kart | Tanım | Alt metin | Tıklayınca |
  |---|---|---|---|
  | Stoktaki ürün | aktif ürünlerden `stok > 0` olanların sayısı (`aktifUrunStoklari`) | `ikincilMetrik`: "toplam N adet" (bu ürünlerin stok toplamı) | — (bağlantı yok) |
  | Kritik stok | Ü-19 ile aynı: aktif ürünlerden `stokDurumu(stok) !== null` | — | `/products?durum=AKTIF&stok=kritik` |
  | Bugün giriş | bugünün (İstanbul günü) `GIRIS` hareket sayısı | — | `?baslangic=<bugün>&bitis=<bugün>&yon=GIRIS` |
  | Bugün çıkış | bugünün `CIKIS` hareket sayısı | — | `?baslangic=<bugün>&bitis=<bugün>&yon=CIKIS` |

- Kritik stok > 0 ise uyarı tonunda. Stok hesabı ürün ekranıyla aynı yoldur (bütün konumlar, ADR-005).
- **Kart sayısı = tıklanınca gelen satır sayısı:** bugünkü kartlar listeyle aynı `where` üreticisiyle sayılır (§4.2).

### 3.3 Süzgeç çubuğu

- **Hızlı sekmeler:** Tümü · Bugün · Son 7 gün · Bu ay. Her biri yalnız `baslangic`/`bitis` yazar,
  `tur` ve `yon`'u korur; "Tümü" tarihleri temizler. Etkin sekme adresteki tarih çiftinden türer.
- **Filtrele formu** (GET, JS'siz çalışır): Başlangıç · Bitiş (`type="date"`) · Tür · Yön · Uygula.

  | Parametre | Değerler | Anlamı |
  |---|---|---|
  | `baslangic`, `bitis` | `YYYY-AA-GG` (İstanbul günü, `denetim/suzgec.ts` doğrulaması) | `createdAt` ∈ [başlangıç günü 00:00, bitiş günü sonu) |
  | `tur` | `giris` · `sevkiyat` · `iade` · `konsinye` · `transfer` · `duzeltme` · `acilis` · `siparis` | kaynak belge bağı (§4.3) |
  | `yon` | `GIRIS` · `CIKIS` | `StockMovement.type` |
  | `page`, `per` | sayfalama | Ü-18 adları |

- Bitiş başlangıçtan önceyse ikisi yer değiştirir (süzgeç çözülürken).
- **Etkin süzgeçler** × ile kaldırılan etiketlerdir: "Tarih: 01.11.2026 – 01.11.2026", "Tür: Sevkiyat", "Yön: Çıkış".
- **Sütunlar** düğmesi sekmelerin sağındadır.
- `?urun=` formun ürün önseçimidir (Dashboard ve ürün paneli bağlantısı); süzgeç adres üreticisi onu
  taşımaz, süzgeç ona dokunmaz.

### 3.4 Tablo

| Sütun | İçerik | Gizlenebilir | Varsayılan |
|---|---|---|---|
| Tarih | `formatDateTime(createdAt)` | hayır | görünür |
| Ürün | ad (bağlantı `/products?detay=<id>`) + kod küçük gri | hayır | görünür |
| Tür | `StatusChip ton="notr"` (`hareketTuru`) + belge no (düz metin, varsa) | evet | görünür |
| Konum | konum adı | evet (`oncelik-dusuk`) | görünür |
| Miktar | `+N` / `−N` (U+2212), `sayi`, renksiz | hayır | görünür |
| Açıklama | `note` | evet (`oncelik-dusuk`) | görünür |
| İşlemi yapan | kullanıcı adı; yoksa "—" | evet | görünür |

- Sıralama `createdAt desc, id desc`. Sayfa boyu varsayılanı Ü-18 ile aynı (`getPagination`).
- Belge no kaynağı: sevkiyat, iade, konsinye, transfer, düzeltme ve (eski) sipariş belgesinin
  `documentNo`'su. Açılış partisinin belge numarası yoktur; yalnız "Açılış" yazar.

### 3.5 Sütun seçici

- Ü-19 ile aynı (`SutunSecici`, `liste/sutunlar.ts`); çerez `stok-sutunlar`, `path=/stock`. Varsayılan
  gizli sütun yoktur.

### 3.6 Boş durum

| Durum | Metin | Eylem |
|---|---|---|
| Hiç hareket yok, süzgeç yok | "Henüz stok hareketi yok." | — (giriş formu aynı sayfada) |
| Süzgeçli | "Bu süzgeçlere uyan hareket bulunamadı." | Süzgeçleri temizle (`/stock`) |

### 3.7 Konsinyedeki Mal

- İçerik ve görünüm aynı (konum · ürün · miktar, yalnız sıfırdan farklı). Okuma `konumStoklari`
  ile tek sorgudur (§4.1).
- **Davranış farkı:** bugün yalnız aktif ürünler taranıyor; toplu okuma konsinye konumunda hareketi olan
  **bütün** ürünleri verir. Pasifleşmiş ama doktorda kalmış mal da görünür (malın yeri bilgisi kaybolmaz).

### 3.8 Yetki

`requireStaff` (bugünkü gibi). OPERASYON KPI, süzgeç ve tabloyu görür; Stok Düzeltme formu yalnız
`YONETICI`'de (B-7-1, değişmez).

## 4. Veri katmanı

### 4.1 Şema ve yazım

- **`StockMovement.createdById String?`** + `createdBy User? @relation("StockMovementBy")`. Kolon
  nullable'dır: eski kaydın bir kısmı bilinemez.
- **Yazım:** `StokHareketi` tipi `createdById: string` **zorunlu** olur
  (`Omit<…UncheckedCreateInput, "id" | "createdAt" | "createdById"> & { createdById: string }`).
  `stokHareketiYaz`'ın 8 çağıranı yapanı geçer (hepsinde oturum ya da belge sahibi var):
  `stok-giris.ts` (`yapanId`), `products/actions.ts` (başlangıç stoğu, oturum), `orders/actions.ts`
  (iptal iadesi, oturum), `stok-transfer.ts`, `stok-duzeltme.ts`, `iade.ts`, `sevkiyat.ts` (`yapan`),
  `ice-aktarim/acilis-stogu.ts` (parti kullanıcısı). `prisma/seed-demo.ts`'in doğrudan yazımı da doldurur.
- **Migration** (`…_stok_hareketi_yapan`): kolon + FK, ardından eski kayıtları dolduran `UPDATE`'ler —
  kaynak belgenin sahibi: `ReturnNote.createdById`, `ConsignmentIssue.createdById`,
  `StockTransfer.createdById`, `StockAdjustment.createdById`, `ImportBatch.userId`. Sevkiyat
  (`Shipment` sahip taşımaz), eski sipariş hareketi ve elle giriş boş kalır → ekranda "—".

**`src/lib/stok.ts`:**

- **`konumStoklari(konumIdler, db?) → Map<konumId, Map<urunId, number>>`** — tek
  `stockMovement.groupBy({ by: [locationId, productId, type] })`. Her (konum, ürün) değeri
  `hesaplaStok(urun, konum)` ile aynıdır. Hareketi olmayan konum boş haritadır.

### 4.2 Liste sorguları

`src/lib/stok-listesi/sorgu.ts` (veritabanına bağlı):

- **`hareketKosulu(suzgec) → Prisma.StockMovementWhereInput`** — tek `where` üreticisi; liste, sayım
  ve bugünkü KPI'lar bunu kullanır.
- **`stokHareketleri(suzgec, sayfalama) → { satirlar, toplam }`** — `findMany` + `count`; satırda ürün
  (id, ad, kod), konum adı, kullanıcı adı, `HAREKET_KAYNAGI` alanları ve kaynak belgelerin `documentNo`'su.
  Satır: `{ id, createdAt, urun, tur, belgeNo, konum, miktar (±), not, yapan: string | null }`.
- **`stokKpileri() → { stoktaki, toplamAdet, kritik, bugunGiris, bugunCikis }`** — `aktifUrunStoklari()`
  (stok > 0 sayısı ve toplamı, `stokDurumu` ile kritik) + `hareketKosulu`'yla iki `count`.
- **`konsinyedekiMal() → { konum, urun, miktar }[]`** — konsinye konumları + `konumStoklari` + ürün
  adları; sıfır satırlar düşer; konum ve ürün adına göre sıralı.

Not: `findMany`/`count` stok **toplaması** değildir; toplama (`groupBy`/`aggregate`, `FROM "StockMovement"`)
yalnız `stok.ts`'te kalır (B-4-7, `tek-cagri.test.ts`).

### 4.3 Saf modüller (birim testli; `db.ts`'e dokunmaz)

- **`src/lib/stok-hareket-turu.ts`** genişler: `HareketTuruKodu` (`giris` … `siparis`),
  `HAREKET_TURLERI` (kod → etiket, süzgeç seçenek sırası) ve `turKosulu(kod) → where parçası`
  (`sevkiyat` → `shipmentId: { not: null }` …; `giris` → bütün kaynak alanları `null`). Kaynaksız çıkış
  (bugün yazan akış yok) da `giris` koduna düşer, etiketi `hareketTuru()`'nun bugünkü "Çıkış"ı kalır. `hareketTuru()`
  etiketi aynı tablodan okunur — süzgeç ile etiket tek sınıflamadır.
- **`src/lib/stok-listesi/suzgec.ts`:** `StokSuzgeci`, `BOS_SUZGEC`, `suzgecCoz(params)`,
  `stokAdresi(suzgec, ek?)` (tek adres üreticisi; `urun`'u taşımaz), `etkinSuzgecler`, `HIZLI_SEKMELER`
  (bugün/son 7 gün/bu ay — `zaman.ts` ile, verilen "bugün"e göre saf hesap), `bosDurum`.
- **`src/lib/stok-listesi/sutunlar.ts`:** `SUTUNLAR`, `SUTUN_CEREZI = "stok-sutunlar"`.
- **`src/lib/liste/parametreler.ts`** (ortak, yeni): `Parametreler`, `ilk`, `secenek`, `gun` (`YYYY-AA-GG`
  doğrulaması), `kimlik` (`KIMLIK` deseni). Bugün `doktor-listesi/`, `urun-listesi/` ve `denetim/suzgec.ts`'te
  aynen kopya; üçü buna geçer, davranış değişmez (mevcut birim testleri değişmeden geçer).

### 4.4 Bileşenler

| Dosya | Görevi |
|---|---|
| `src/app/(admin)/stock/page.tsx` | orkestrasyon: `requireStaff`, `suzgecCoz`, sorgular, çerez; formlar bugünkü gibi |
| `src/app/(admin)/stock/KpiKartlari.tsx` | KPI kartları |
| `src/app/(admin)/stock/SuzgecCubugu.tsx` | sekmeler + Filtrele formu + etkin etiketler + Sütunlar |
| `src/app/(admin)/stock/HareketTablosu.tsx` | satırlar, boş durum |
| `src/app/(admin)/stock/sutunEylemi.ts` | `"use server"`; çerez yazar, `redirect` |
| `src/app/(admin)/stock/loading.tsx` | KPI + süzgeç + tablo iskeleti (ADR-009 ölçü testleri) |
| `src/components/liste/HizliSekmeler.tsx` (ortak, yeni) | `nav aria-label="Hızlı süzgeçler"` sekme hapları; `{ etiket, adres, etkin }[]` alır. Doktorlar ve Ürünler geçer |
| `src/components/liste/EtkinSuzgecler.tsx` (ortak, yeni) | `aria-label="Etkin süzgeçler"` × etiketleri; `{ etiket, kaldirAdresi }[]` alır. Doktorlar ve Ürünler geçer |

`StockEntryForm`, `DuzeltmeFormu`, `KonumBelgesiFormu`, `actions.ts` değişmez (yalnız yapan zaten geçiyor).

## 5. Hata davranışı

- Geçersiz süzgeç değeri yok sayılır (etiketi de çıkmaz); geçersiz tarih yok sayılır.
- Kullanıcısı silinemez (E-2 §(6)); `createdBy` boşsa "—".
- Çerez bozuksa varsayılan görünüm. Sorgu düşerse `stock/error.tsx`.

## 6. Testler

**Kabul kriterleri `KABUL_KRITERLERI.md`'ye testten önce yazılır** (numara karar kimliğinden):

- **B-4-8:** Her stok hareketi işlemi yapan kullanıcıyı taşır; `stokHareketiYaz` kullanıcısız hareket
  yazmaz. Eski hareketler kaynak belgenin sahibinden doldurulur (iade, konsinye, transfer, düzeltme,
  açılış partisi); sevkiyat, eski sipariş ve elle giriş boş kalır ve ekranda "—" görünür.
- **B-4-9:** `konumStoklari` her konum ve ürün için `hesaplaStok(urun, konum)` ile aynıdır.
- **B-4-10:** Stok ekranının bugün giriş/çıkış kartı, tıklanınca açılan listenin satır sayısına eşittir;
  hareket türü süzgeci ve tür etiketi aynı sınıflamadandır (her hareket tam bir türe düşer).

| Katman | Dosya | Neyi doğrular |
|---|---|---|
| Birim | `src/lib/stok-listesi/suzgec.test.ts` | Çözme/adres gidiş-dönüş; geçersiz tarih/tür/yön; tarih yer değiştirme; hızlı sekme adresleri (gün ve ay sınırı); etiketler ve kaldırma adresleri; `urun` taşınmaz; boş durum türü |
| Birim | `src/lib/stok-hareket-turu.test.ts` (genişler) | Her kod ↔ etiket; `turKosulu` alanları; kaynaksız hareket `giris` |
| Birim | `src/lib/tek-cagri.test.ts` | Toplama yalnız `stok.ts`'te (mevcut koruma, yeni dosya için) |
| Birim | `src/lib/liste/parametreler.test.ts` | `ilk` dizi/boş; `secenek`; `gun` geçersiz takvim günü; `kimlik` deseni. `doktor-listesi`, `urun-listesi`, `denetim` süzgeç testleri değişmeden geçer |
| Entegrasyon | `src/lib/stok.itest.ts` (genişler) | `stokHareketiYaz` `createdById` yazar; `konumStoklari` ≡ `hesaplaStok(u, k)` (çok konum, sıfır, hareketsiz konum) |
| Entegrasyon | `src/lib/stok-listesi/sorgu.itest.ts` | Tarih sınırı (İstanbul gece yarısı); tür × yön birleşimi; her hareket tam bir türde (türler toplamı = süzgeçsiz toplam); sayfalama; KPI = süzgeçli `count`; belge no; yapan adı / `null`; konsinyede pasif ürün |
| Entegrasyon | `src/lib/stok-hareketi-yapan.itest.ts` | Migration'ın dolduran `UPDATE`'leri (dosyadan okunur): beş kaynak belge sahibinden dolar, sevkiyat ve elle giriş `null` kalır |
| E2E | `e2e/admin/stok-ekrani.spec.ts` | KPI "Bugün giriş" → süzgeç + etiket + satır sayısı = kart; Tür süzgeci (Filtrele formu) → yalnız o tür; × ile kaldır; sütun gizle → yenile → gizli; boş durum → temizle; yapan sütunu yeni girişte kullanıcı adı |
| E2E | `e2e/operasyon/operasyon.spec.ts` (genişler) | OPERASYON KPI ve tabloyu görür; Stok Düzeltme yok |
| E2E | mevcut | `doktorlar.spec.ts`, `urunler.spec.ts`, `denetim.spec.ts` (ortak parçalara geçiş, davranış aynı) · `stok-duzeltme.spec.ts`, `konsinye.spec.ts`, `operasyon.spec.ts` stok girişi, `dashboard.spec.ts`, `mobil/iskelet.spec.ts`, `tasarim.spec.ts` geçer (seçici çakışması kapsamlanır) |

E2E'yi push'tan önce yerelde koşarım (`medikal_test`).

## 7. Belgeler

- **`KARARLAR.md` B-4 eki (01.11.2026 · ürün sahibi seçimi 28.10):** "Stok hareketi işlemi yapan
  kullanıcıyı taşır (`StockMovement.createdById`, nullable). Yazımda zorunludur; eski kayıt kaynak
  belgenin sahibinden doldurulur, bilinmeyen boş kalır." Şema etki tablosuna (§ B-4 satırları) bir satır.
- **`YOL_HARITASI.md`:** Ü-20 satırı (D2'de ✅).
- **`KABUL_KRITERLERI.md`:** §6'daki kriterler.
- **`TRACEABILITY.md`:** `npm run izlenebilirlik`.
- **`PROJE_DURUMU.md`:** arayüz bölümünde Stok maddesi (D2).
- **`MD_files/DEVAM_PROMPTU.md`:** ▶ satırı.

## 8. Teslim

Her adım ayrı PR; CI yeşil görülmeden merge edilmez.

| PR | Dal | İçerik |
|---|---|---|
| D1 | `revize/stok-d1-veri` | Bu spec · plan · KARARLAR eki · kriterler · Ü-20 · şema + migration (doldurma) · `StokHareketi.createdById` zorunlu (8 çağıran + seed) · `konumStoklari` · `stok-hareket-turu.ts` genişler · `liste/parametreler.ts` (Doktorlar, Ürünler, Denetim geçer) · `stok-listesi/` saf modüller + sorgular · birim ve entegrasyon testleri. Ekran değişmez (yalnız konsinye kartı `konsinyedekiMal`'a geçer). |
| D2 | `revize/stok-d2-ekran` | Ortak `HizliSekmeler`/`EtkinSuzgecler` (Doktorlar, Ürünler geçer) · KPI · süzgeç çubuğu · tablo (tür + belge no, konum, yapan) · sütun seçici · sayfalama · boş durum · iskelet · e2e · belgelerin kapanışı |

Not: Stok ekranında yan panel olmadığından Ü-19'un üç PR'ı burada ikiye iner.
