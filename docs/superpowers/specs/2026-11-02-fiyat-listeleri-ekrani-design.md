# Fiyat listeleri ekranı — KPI, süzgeç, sütun seçici, yan panel, barem matrisi (tasarım spec'i)

> **Tarih:** 02.11.2026 · **Kaynak:** kullanıcı talebi (sohbet, 28.10.2026: "Kapsamlı sayfa modernizasyonu"
> isterinin §2-C maddesi; altı modülün üçüncüsü) · **Yol haritası:** Ü-21 (§7-5 gereği yazılır) ·
> **Durum:** kullanıcı 02.11.2026'da "tüm sayfalar için aynı planı ve tasarımı uygula, önerilenlerinle
> ilerle" dedi — bu spec'teki her seçim önerilen seçenektir (§9). 28.10 seçimleri: "Aktif kampanya"
> yerine "Aktif liste", barem matrisi salt okunur.
>
> Bu belge **plan**dır, karar üretmez (`YOL_HARITASI.md` §7.1-A). Kullandığı her tanım mevcut bir
> karara (X-10, B-5, B-6, D-2), ADR'ye ya da Ü-18…Ü-20 kalıbına dayanır; yeni karar ya da ADR açılmaz.

## 1. Amaç

`/price-lists` (yalnız yönetici, X-10 §(6)) tek bakışta fiyatlandırmanın sağlığını göstersin: kaç liste
bugün fiyat veriyor, kaç cari özel listede, varsayılan listede fiyatı olmayan aktif ürün var mı. Bir
listenin barem yapısına ve atandığı carilere listeden ayrılmadan bakılabilsin. Satır yazımı (ekle,
güncelle, sil) bugünkü detay sayfasında aynen kalır.

**Başarı ölçütü:** yönetici "Fiyatsız ürün" kartından varsayılan listenin paneline geçer; panelde ürün ×
barem eşiği matrisini (bugün geçerli fiyatlar, alt eşikten devralınan hücre soluk) ve listeye atanmış
carileri görür; "Satırları düzenle" ile detay sayfasına gider.

## 2. Kapsam

### Kapsamda

| # | Kalem | Dayanak |
|---|---|---|
| 1 | KPI: Toplam liste · Aktif liste · Özel listeli cari · Fiyatsız ürün | ADR-010 `KpiCard` · 28.10 seçimi "Aktif liste" |
| 2 | Hızlı sekmeler (Tümü · Aktif · Boş) + etkin süzgeç etiketi | Ü-18…Ü-20 ortak `HizliSekmeler`/`EtkinSuzgecler` |
| 3 | Tablo: kod (+ varsayılan rozeti), ad, ürün, barem, atanmış cari, durum, işlem | X-10 §(7) |
| 4 | Sütun seçici, sayfalama (sayfa dışı adres son sayfaya), boş durum | Ü-19 ortak bileşenleri |
| 5 | Yan panel: özet, barem matrisi (salt okunur), atanmış cariler | `YanPanel` · 28.10 seçimi "barem matrisi salt okunur" |
| 6 | Detay sayfasında aynı barem matrisi kartı (satır tablosunun üstünde) | aynı bileşen |
| 7 | "Yeni Liste" formu `/price-lists/new`'e taşınır; oluşturunca listenin detayına gider | Ürünler/Doktorlar kalıbı (`/products/new`, `/doctors/new`) |

### Kapsam dışı

- **Liste aktifliği (`PriceList.isActive`)** — kolon şemada var, hiçbir yol okumuyor ve yazmıyor. Pasif
  listenin fiyat çözümüne etkisi (atanmış cari ne olur?) bir X-10 kararıdır; bu iş açmaz. "Aktif liste"
  KPI'ı bu kolondan değil, bugün geçerli satırdan türer (§3.2).
- **Tarihli satır ekranı** — X-10 §(7) Faz 2. Matris yalnız bugünü gösterir; satır tablosu tarihleri
  bugünkü gibi salt okunur yazar.
- **Matristen düzenleme** — 28.10 seçimi: salt okunur.
- **Doktorlar ekranına "liste" süzgeci** — panel carileri doğrudan listeler (§3.5).
- **Arama kutusu** — liste sayısı küçük; isterde yok.

## 3. Ekran

### 3.1 Yerleşim

`PageHeader` (sağda "Yeni Liste" bağlantı düğmesi) → KPI satırı → süzgeç çubuğu (sekmeler + Sütunlar)
→ tablo → sayfalama → (adreste `detay` varsa) yan panel. Bugünkü sağ sütundaki form kalkar (§3.7).

### 3.2 KPI kartları

`KpiSatiri` içinde dört `KpiCard`; `karsilastirma: { anlik: "şu an" }`, trend yok, `bosDavranisi: "sifir"`.
Sayımlar süzgeçten bağımsızdır. "Bugün" İstanbul günüdür (`bugun()`).

| Kart | Tanım | Alt metin | Tıklayınca |
|---|---|---|---|
| Toplam liste | `priceList.count()` | — | `/price-lists` |
| Aktif liste | bugün geçerli (`validFrom <= bugün < validTo`, boş uç süresiz) en az bir satırı olan liste | — | `?durum=aktif` |
| Özel listeli cari | `status: AKTIF` ve varsayılan dışında bir listeye atanmış cari (varsayılana açıkça atanmış cari varsayılanı kullananlardadır) | `ikincilMetrik`: "N cari varsayılanı kullanır" | — |
| Fiyatsız ürün | aktif ürünlerden varsayılan listede 1 adet için bugün fiyatı çözülemeyenler (`cozumleListeFiyatlari`, `HATA`) | — | varsayılan listenin paneli (`?detay=<id>`); liste yoksa bağlantı yok |

- Fiyatsız ürün > 0 ise uyarı tonunda (satıcı o ürünle sipariş giremez — X-10 §(3), `SERT`).
- Varsayılan liste yoksa (`LISTE_YOK`) bütün aktif ürünler fiyatsız sayılır.
- Aktif liste kartı = `?durum=aktif` satır sayısı (aynı `where` üreticisi, §4.2).

### 3.3 Süzgeç çubuğu

- **Hızlı sekmeler:** Tümü · Aktif · Boş. `durum` parametresi: `aktif` (bugün geçerli satırı var) ·
  `bos` (bugün geçerli satırı yok — hiç satırı olmayan ya da yalnız süresi geçmiş/başlamamış satırı olan).
- **Etkin süzgeç** × ile kaldırılan tek etikettir ("Durum: Aktif" / "Durum: Boş").
- **Sütunlar** düğmesi sekmelerin sağındadır. Filtrele formu yoktur (tek boyutlu süzgeç sekmelerle biter).
- Adres: `durum`, `page`, `per`, `detay` (Ü-19 adları).

### 3.4 Tablo

| Sütun | İçerik | Gizlenebilir | Varsayılan |
|---|---|---|---|
| Kod | kod (bağlantı: paneli açar `?detay=<id>`, süzgeç korunur) + "varsayılan" rozeti | hayır | görünür |
| Ad | ad | evet | görünür |
| Ürün | bugün geçerli satırı olan farklı ürün sayısı | evet | görünür |
| Barem | bugün geçerli satırlardan `min_adet > 1` olanların sayısı | evet (`oncelik-dusuk`) | görünür |
| Atanmış cari | `doctors` sayısı (pasif cariler dahil — atama verisi) | evet | görünür |
| Durum | `StatusChip`: Aktif (`olumlu`) / Boş (`notr`) | evet | görünür |
| İşlem | "Satırlar" bağlantısı → `/price-lists/<id>` | hayır | görünür |

- Sıralama `code asc`. Varsayılan liste rozeti `policy.pricing.varsayilanFiyatListesiKodu` ile.
- Sütun çerezi `fiyat-listesi-sutunlar`, `path=/price-lists`; varsayılan gizli sütun yok.

### 3.5 Yan panel

`YanPanel` (Ü-19 ile aynı kabuk; kapatınca süzgeçli liste adresi). Bölümler:

1. **Özet** — kod, ad, varsayılan mı, bugün geçerli satır / toplam satır, tarihli satır sayısı
   ("Tarihli satırlar içe aktarımdan gelir"), atanmış cari sayısı.
2. **Barem matrisi** — §3.6. Ürün sayısı çoksa panel içinde kaydırılır.
3. **Atanmış cariler** — ad (bağlantı `/doctors?detay=<id>`) + pasifse `StatusChip` "Pasif"; ada göre,
   ilk 20; fazlası "ve N cari daha". Hiç yoksa: varsayılan listedeyse "Atanmamış bütün cariler bu listeyi
   kullanır.", değilse "Bu listeye atanmış cari yok."
4. Altta **"Satırları düzenle"** (`/price-lists/<id>`).

Geçersiz ya da bulunamayan `detay` kimliğinde panel açılmaz.

### 3.6 Barem matrisi

- **Satırlar:** listede bugün geçerli satırı olan ürünler (ada göre). **Sütunlar:** bu satırların farklı
  `min_adet` değerleri (küçükten büyüğe) — "1+", "10+", "50+".
- **Hücre:** o ürün, o eşik miktarı ve bugün için **liste fiyatının seçimi** (B-6: `min_adet <= miktar`
  olanların en yüksek `min_adet`'lisi). Seçim `fiyat.ts`'in tek yolundan yapılır (§4.1), ikinci kez
  yazılmaz.
  - Seçilen satırın `min_adet`'i sütun eşiğine eşitse hücre normal yazılır.
  - Alt eşikten devralınmışsa hücre soluk (`text-slate-400`) ve `title="1+ eşiğinden"` taşır — B-6'da
    üst eşik yoktur; o miktarda bu fiyat uygulanır.
  - Eşiğe kadar hiç satır yoksa "—" (fiyat çözülemez).
- Para `Tutar` ile, taban `MATRAH` başlıkta (`tabanli("Liste fiyatı", MATRAH)` tablo başlığı notu).
- Bugün geçerli satır yoksa: "Bu listede bugün geçerli satır yok."

### 3.7 Yeni liste ve detay sayfası

- **`/price-lists/new`:** bugünkü form (Kod, Ad, "Liste Oluştur"), `requireAdmin`. Başarıda
  `createPriceList` `/price-lists/<yeni id>`'ye yönlendirir (satır ekleme sırada). Hata davranışı aynı
  (`FIYAT_LISTESI_KODU_GECERSIZ`, `FIYAT_LISTESI_KODU_KAYITLI`, alanın altında).
- **`/price-lists/[id]`:** satır tablosunun üstüne "Barem matrisi" kartı (§3.6, aynı bileşen). Satır
  tablosu, form ve Sil bugünkü gibi.

### 3.8 Yetki

`requireAdmin` (bugünkü gibi; D-2: OPERASYON fiyat listesi görmez, menüde yok).

## 4. Veri katmanı

### 4.1 `src/lib/fiyat.ts` (fiyat seçiminin tek yolu)

- İç `listedenFiyatlar` seçilen satırın `minQuantity`'sini de döndürür (`Map<urunId, { fiyat, minQuantity }>`);
  mevcut iki çağıran yalnız fiyatı okur, davranış değişmez.
- **Yeni `baremMatrisi(fiyatListesiId, gun, db?) → { esikler: number[]; urunler: { id, name, code,
  hucreler: ({ fiyat: Decimal; kaynakEsik: number; devralinan: boolean } | null)[] }[] }`** — listedeki bugün geçerli
  satırların ürünleri ve eşikleri okunur; her eşik için `listedenFiyatlar(liste, ürünler, { miktar: eşik,
  gun })` bir kez çağrılır (eşik sayısı küçüktür). `kaynakEsik` seçilen satırın `min_adet`'i,
  `devralinan = kaynakEsik !== eşik`.
- **`gecerliSatir(gun)`** satır tarih koşulunun tek tanımı (dışa açık); çağıran `AND: [gecerliSatir(gun)]` içine koyar.

### 4.2 Liste sorguları — `src/lib/fiyat-listesi-listesi/sorgu.ts` (veritabanına bağlı)

- **`listeKosulu(suzgec, gun) → Prisma.PriceListWhereInput`** — tek `where` üreticisi
  (`aktif`: `items: { some: GECERLI(gun) }`, `bos`: `items: { none: GECERLI(gun) }`); liste, sayım ve
  Aktif liste KPI'ı bunu kullanır. `GECERLI(gun)` satır tarih koşulu `fiyat.ts`'tekiyle aynı biçimdedir.
- **`fiyatListeleri(suzgec, sayfalama) → { satirlar, toplam }`** — satır: `{ id, code, name, varsayilan,
  urunSayisi, baremSayisi, cariSayisi, aktif }`. Ürün/barem sayıları bugün geçerli satırlardan tek
  `priceListItem.findMany` ile (sayfadaki listeler için) hesaplanır.
- **`fiyatListesiKpileri() → { toplam, aktif, ozelListeliCari, varsayilanKullanan, fiyatsizUrun,
  varsayilanListeId }`**.
- **`fiyatListesiPaneli(id, gun) → { liste, gecerliSatir, toplamSatir, tarihliSatir, matris, cariler,
  cariToplam } | null`** — ürün/barem sayıları tablo satırıyla aynı yoldan (`satirSayilari`).
- Üç sorgu da `gun` alır; sayfa günü bir kez okur ve geçirir (kart ile sekme aynı günü sayar).
- Satır sayımları ürün durumundan bağımsızdır (liste satırı tanım verisidir); pasif ürünün satırı da
  listeyi "aktif" sayar. Fiyatsız ürün KPI'ı ise yalnız aktif ürünlere bakar.

### 4.3 Saf modüller (birim testli; `db.ts`'e dokunmaz)

- **`src/lib/fiyat-listesi-listesi/suzgec.ts`:** `ListeSuzgeci = { durum: "aktif" | "bos" | null }`,
  `BOS_SUZGEC`, `suzgecCoz(params) → { suzgec, detay }`, `listeAdresi(suzgec, ek?)`, `HIZLI_SEKMELER`,
  `ayniSuzgec`, `etkinSuzgecler`, `bosDurum`. `liste/parametreler.ts` yardımcılarıyla.
- **`src/lib/fiyat-listesi-listesi/sutunlar.ts`:** `SUTUNLAR`, `SUTUN_CEREZI = "fiyat-listesi-sutunlar"`,
  `SUTUN_YOLU = "/price-lists"`.

### 4.4 Bileşenler

| Dosya | Görevi |
|---|---|
| `src/app/(admin)/price-lists/page.tsx` | orkestrasyon (Ürünler sayfası kalıbı) |
| `src/app/(admin)/price-lists/KpiKartlari.tsx` | KPI |
| `src/app/(admin)/price-lists/SuzgecCubugu.tsx` | sekmeler + etkin etiket + Sütunlar |
| `src/app/(admin)/price-lists/ListeTablosu.tsx` | satırlar, boş durum |
| `src/app/(admin)/price-lists/ListePaneli.tsx` | yan panel |
| `src/app/(admin)/price-lists/BaremMatrisi.tsx` | matris (panel ve detay sayfası) |
| `src/app/(admin)/price-lists/sutunEylemi.ts` | `"use server"`; çerez yazar |
| `src/app/(admin)/price-lists/loading.tsx` | KPI + süzgeç + tablo iskeleti |
| `src/app/(admin)/price-lists/new/page.tsx` | Yeni Liste formu |

## 5. Hata davranışı

- Geçersiz `durum` yok sayılır (etiketi çıkmaz); geçersiz `detay` paneli açmaz.
- Sayfa dışı `page` son sayfaya yönlenir (PR #85 dersi).
- Çerez bozuksa varsayılan görünüm. Varsayılan liste yoksa KPI'da fiyatsız ürün = aktif ürün sayısı,
  bağlantı yok; tabloda rozet yok.

## 6. Testler

**Kabul kriterleri `KABUL_KRITERLERI.md`'ye testten önce yazılır:**

- **X-10-5:** Barem matrisinin her hücresi, o liste, ürün, eşik miktarı ve gün için `cozumleBirimFiyat`'ın
  seçtiği liste fiyatına eşittir (listeye atanmış cari ile); alt eşikten gelen hücre devralınmış
  işaretlidir; eşiğe kadar satır yoksa hücre boştur. Tarihli satır yalnız geçerli olduğu günde sayılır.
- **X-10-6:** Fiyat listesi ekranının "Aktif liste" kartı `durum=aktif` süzgecinin satır sayısına eşittir;
  "Fiyatsız ürün" kartı, aktif ürünlerden varsayılan listede 1 adet için `cozumleListeFiyatlari`'nın
  `HATA` döndürdüklerinin sayısıdır.

| Katman | Dosya | Neyi doğrular |
|---|---|---|
| Birim | `src/lib/fiyat-listesi-listesi/suzgec.test.ts` | çözme/adres gidiş-dönüş; geçersiz `durum`/`detay`; sekmeler; etiket kaldırma adresi; boş durum türü |
| Entegrasyon | `src/lib/fiyat.itest.ts` (genişler) | `baremMatrisi` ≡ `cozumleBirimFiyat` (atanmış cari, her hücre); devralınan; boş hücre; tarihli satır dünü/bugünü/yarını |
| Entegrasyon | `src/lib/fiyat-listesi-listesi/sorgu.itest.ts` | `aktif`/`bos` sınıflaması (süresi geçmiş satır → boş); KPI = süzgeçli sayım; fiyatsız ürün = `HATA` sayısı; ürün/barem/cari sayıları; panel carileri (ilk 20 + toplam, pasif işaret) |
| E2E | `e2e/admin/fiyat-listesi.spec.ts` (yeniden yazılır) | `/price-lists/new` → detaya yönlenir → barem satırı → matris hücresi; listede panel aç → matris + cari; "Aktif" sekmesi → satır sayısı = kart; sütun gizle → yenile → gizli; boş durum → temizle |
| E2E | mevcut | `kabul-senaryosu`, `dashboard`, `mobil/yonetici`, `mobil/form`, `operasyon` (fiyat listesi menüde yok) geçer; seçici değişirse kapsamlanır |

## 7. Belgeler

- **`YOL_HARITASI.md`:** Ü-21 satırı (D2'de ✅).
- **`KABUL_KRITERLERI.md`:** §6'daki kriterler. **`TRACEABILITY.md`:** `npm run izlenebilirlik`.
- **`PROJE_DURUMU.md`:** arayüz bölümünde Fiyat listeleri maddesi (D2).
- **`MD_files/DEVAM_PROMPTU.md`:** ▶ satırı.
- `KARARLAR.md` değişmez (yeni karar yok).

## 8. Teslim

| PR | Dal | İçerik |
|---|---|---|
| D1 | `revize/fiyat-listeleri-d1-veri` | Bu spec · plan · Ü-21 · kriterler · `fiyat.ts` `baremMatrisi` · `fiyat-listesi-listesi/` saf modüller + sorgular · birim ve entegrasyon testleri. Ekran değişmez. |
| D2 | `revize/fiyat-listeleri-d2-ekran` | KPI · sekmeler · tablo · sütun seçici · sayfalama · boş durum · yan panel · matris (panel + detay) · `/price-lists/new` · iskelet · e2e · belgelerin kapanışı |

Ü-20 gibi iki PR: panel ve tablo birlikte küçüktür.

## 9. Önerilen seçimler (kullanıcı 02.11.2026 "önerilenlerinle ilerle")

| # | Soru | Seçilen | Diğer seçenek |
|---|---|---|---|
| 1 | "Aktif liste" neye göre? | bugün geçerli en az bir satırı olan liste | `isActive` kolonu (hiçbir yol kullanmıyor; anlamı karar ister) |
| 2 | Dördüncü KPI | Fiyatsız ürün (varsayılan listede) — sipariş girişini engelleyen tek fiyat riski | Toplam satır sayısı (eylem önermez) |
| 3 | Matris hücresi devralınan fiyatı gösterir mi? | evet, soluk — B-6'da o miktarda uygulanan fiyat odur | yalnız tam eşik satırı ("—" yanıltır) |
| 4 | Matris nerede? | panelde ve detay sayfasında (tek bileşen) | yalnız panelde |
| 5 | Yeni liste formu | `/price-lists/new` + detaya yönlenme | sayfada yan kart (bugünkü) |
| 6 | Atanmış cariler | panelde ilk 20 + toplam | Doktorlar ekranına `liste` süzgeci (ayrı modül değişikliği) |
| 7 | Filtrele formu | yok; tek boyut sekmelerle | tarih/ürün süzgeci (isterde yok) |
