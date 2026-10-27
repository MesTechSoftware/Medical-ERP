# Doktorlar ekranı — yoğunluk, süzgeç, yan panel (tasarım spec'i)

> **Tarih:** 27.10.2026 · **Kaynak:** kullanıcı talebi (sohbet; 4 maddelik "Doktorlar ekranı" isteri)
> · **Yol haritası:** Ü-18 (§7-5 gereği yazılır) · **Durum:** taslak — kullanıcı incelemesinde
>
> Bu belge **plan**dır, karar üretmez (`YOL_HARITASI.md` §7.1-A). Kullandığı her tanım mevcut bir
> karara ya da ADR'ye dayanır; yeni karar ya da ADR açılmaz.

## 1. Amaç

`/doctors` (yönetici ve operasyon cari listesi) ekranı tek bakışta daha çok bilgi versin, riskli
kayıtları öne çıkarsın, detaya sayfadan çıkmadan bakılabilsin ve liste çok kriterle daraltılabilsin.
Mevcut ekranın davranışı (toplu devir, sekmeler, eski adresler, detay sayfası) bozulmaz.

**Başarı ölçütü:** bir yönetici "Marmara'da, Ayşe'nin, 90 gündür sipariş vermeyen, fatura bilgisi
eksik doktorları" tek ekranda bulur; satırda bakiyesini ve limit durumunu görür; isme tıklayıp son
sipariş ve cari hareketlerine listeden ayrılmadan bakar.

## 2. Kapsam

### Kapsamda

| # | Kalem | Dayanak |
|---|---|---|
| 1 | KPI kartları: Toplam cari · Aktif · Sahipsiz · Eksik fatura bilgisi | ADR-010 `KpiCard` |
| 2 | Yeni sütunlar: Son sipariş · Bakiye | `sayilanBelgeler.siparis` (A-5) · `hesaplaDoktorBakiye` (K-2) |
| 3 | Durum rozetleri: Aktif · Pasif · Eksik fatura · Limit aşıldı | EntityStatus · A-13-2 · A-12-4 |
| 4 | Eksik fatura satır vurgusu | A-13-2 (bilgi kademesi) |
| 5 | Süzgece göre boş durum | — |
| 6 | Sağdan yan panel | X-18 §(9) `YanPanel` kabuğu |
| 7 | Gelişmiş süzgeç: sınıf, bölge, satıcı, durum, eksik fatura, son sipariş | X-8 §(5) · A-13 §(5) |
| 8 | Sütun seçici (çerezde saklanır) | — |

### Kapsam dışı (kararlarla çelişir — kullanıcı 27.10.2026'da çıkardı)

- **"Blokeli" durumu** — `EntityStatus` yalnız `AKTIF`/`PASIF`; A-12 limit aşımı bu fazda bilgi kademesidir.
- **İletişim geçmişi** — veri yok; yeni modül karar ister. Panelde yerine devir geçmişi gösterilir.
- **Toast bildirimi** — X-4 §(4) kapalı gösterim listesi; toplu devir sonucu bugünkü şeritte kalır.
- **Doktor başına ciro sütunu** — ADR-010: doktora göre ciro raporlar sayfasındadır.

## 3. Ekran

### 3.1 KPI kartları

- Başlığın altında `KpiSatiri` içinde dört `KpiCard`; `karsilastirma: { anlik: "şu an" }`, trend yok,
  `bosDavranisi: "sifir"`.
- Sayımlar **süzgeçten bağımsızdır** (tüm cariler).
  - Toplam: `doctor.count()`
  - Aktif: `status: AKTIF`
  - Sahipsiz: `SAHIPSIZ_DOKTOR`
  - Eksik fatura: `EKSIK_FATURA_BILGISI`
- Sahipsiz ve Eksik fatura > 0 ise uyarı tonunda. Kart tıklanınca ilgili süzgeç uygulanır.
- Bugünkü kırmızı "sahipsiz havuz" şeridi yerinde kalır (sonucu açıklıyor).

### 3.2 Süzgeç çubuğu

- **Hızlı sekmeler kalır:** Tümü · Doktorlar · Bayiler · Sahipsiz · Eksik fatura bilgisi. Her biri
  süzgeç adresinin kısayoludur; "Tümü" tüm süzgeçleri temizler.
- **Filtrele** düğmesi (etkin süzgeç sayısıyla: "Filtrele · 3") `<details>` içinde GET formu açar
  (JS'siz çalışır; biçim denetim ekranının formunu izler).
- **Panel alanları:**

  | Alan | Parametre | Değerler |
  |---|---|---|
  | Hesap sınıfı | `sinif` | `DOKTOR` · `BAYI` |
  | Bölge | `bolge` | veritabanındaki farklı `region` değerleri (boşlar hariç, alfabetik) |
  | Sorumlu satıcı | `satici` | aktif satıcı kimliği · `yok` (= `SAHIPSIZ_DOKTOR`) |
  | Durum | `durum` | `AKTIF` · `PASIF` |
  | Eksik fatura bilgisi | `fatura` | `eksik` |
  | Son sipariş — hazır | `sessiz` | `30` · `60` · `90` · `180` · `hic` |
  | Son sipariş — aralık | `sonBas`, `sonBit` | İstanbul günü `YYYY-AA-GG` |

- **Uygula / Temizle.** Hazır seçim ve serbest aralık birlikte gelirse **serbest aralık geçerlidir**;
  panelde bu yazılıdır.
- **Etkin süzgeçler**, çubuğun altında × ile kaldırılabilen etiketlerdir ("Bölge: Marmara ×").
- **Geriye uyum:** `?sahip=yok` → `satici=yok` olarak çözülür; `?sinif=`, `?fatura=eksik` aynen geçerli.
- **Sayfalama** tüm süzgeçleri korur.
- **Sütunlar** düğmesi Filtrele'nin yanındadır (§3.4).
- **Toplu devir formu** yerinde ve bugünkü davranışıyla kalır.

### 3.3 Tablo

| Sütun | İçerik | Gizlenebilir |
|---|---|---|
| ☐ | Toplu devir seçimi (yalnız `YONETICI`, yalnız `DOKTOR`) | hayır |
| Ad Soyad | Unvan + ad + "Bayi" etiketi; mavi, altı çizili, `›` ikonlu; yan paneli açar | hayır |
| Klinik / Bölge | bugünkü gibi | evet |
| Telefon | bugünkü gibi | evet |
| Sorumlu Satıcı | bugünkü gibi; boşsa kırmızı "Sahipsiz", bayide "—" | evet |
| Sipariş | sipariş sayısı (bugünkü `_count`) | evet |
| Son Sipariş | `formatDate` + altında "N gün önce"; yoksa "—" | evet |
| Bakiye | `<Tutar>` (brüt) + yön etiketi: Borçlu · Alacaklı (avans) · Kapalı | evet |
| Durum | rozetler | evet |

- **Rozetler** (`StatusChip`, mevcut tonlar; yeni renk yok; metin her zaman yazılı):
  - `AKTIF` → `olumlu`
  - `PASIF` → `notr` (gri)
  - Eksik fatura → `uyari` (turuncu, `critical` belirteci)
  - Limit aşıldı → `hata` (kırmızı, `negative` belirteci); `title`: "Risk X / Limit Y"
  - Bir satırda birden çok rozet olabilir.
- **Satır vurgusu:** eksik faturalı satır `bg-critical-bg` arka planı + solda ince `border-critical`
  şeridi. "Eksik mi" kümesi `EKSIK_FATURA_BILGISI ∧ id ∈ sayfa` tek
  sorgusuyla gelir; tanım ikinci kez yazılmaz.
- **Dar ekran:** `oncelik-dusuk` kuralı sürer.

### 3.4 Sütun seçici

- "Sütunlar" düğmesi `<details>` menüsü açar: gizlenebilir sütunların onay kutuları + "Varsayılana dön".
- Sunucu eylemi `doktor-sutunlar` çerezini yazar (gizli sütun anahtarları, virgüllü; `path=/doctors`,
  1 yıl, `sameSite=lax`). JS'siz form gönderimiyle de çalışır.
- Sayfa çerezi sunucuda okur, gizli sütunları **hiç çizmez** (başlık ve hücre birlikte). `colSpan`
  görünür sütun sayısından hesaplanır.
- Bozuk ya da bilinmeyen anahtar yok sayılır → varsayılan (hepsi görünür).

### 3.5 Boş durum

Tek satır yerine ortada ikon + başlık + yönlendirme (`colSpan` = görünür sütun):

| Durum | Metin | Eylem |
|---|---|---|
| Hiç cari yok, süzgeç yok | "Henüz cari yok." | Yeni Cari (yalnız `YONETICI`) |
| Yalnız Sahipsiz | "Sahipsiz cari yok — tüm doktorlar bir satıcıya atanmış." | — |
| Yalnız Eksik fatura | "Fatura bilgisi eksik cari yok." | — |
| Diğer süzgeçler | "Bu süzgeçlere uyan cari bulunamadı." | Süzgeçleri temizle |

İkon mevcut `Ikon` setinden; illüstrasyon dosyası eklenmez.

### 3.6 Yan panel

- **Açılış:** Ad Soyad bağlantısı `doktorAdresi(suzgec, { sayfa, detay: id })`, `scroll={false}`,
  `data-kayit={id}`. Sunucu paneli listeyle birlikte çizer.
- **Kabuk:** `YanPanel`; `src/components/denetim/` → `src/components/` taşınır (davranış aynı; denetim
  ekranının içe aktarımı güncellenir).
- **Geçersiz kimlik:** kimlik geçersiz ya da kayıt yoksa panel açılmaz, liste normal görünür.
- **İçerik** (yukarıdan aşağıya):
  1. **Başlık:** unvan, ad, "Bayi", rozetler (tabloyla aynı bileşen)
  2. **Kimlik/iletişim:** klinik, bölge, il, telefon (`tel:`), e-posta, sorumlu satıcı
  3. **Cari özeti:** bakiye + yön, açık sipariş, risk / limit ("Limitsiz"). Vade uyarısı varsa
     `vadesiGecmisUyarisi()` şeridi.
  4. **Son 5 sipariş:** numara, tarih, durum, tutar (`siparisToplami`) → `/orders/[id]`
  5. **Son 5 cari hareket:** tarih, tür, borç/alacak
  6. **Son 3 devir:** `DoctorAssignment` — "Eski → Yeni · tarih" (eski boşsa "Sahipsiz")
  7. **Alt (sabit):** Tam detaya git (`/doctors/[id]`) · Düzenle (yalnız `YONETICI`)
- **Yetki:** `requireStaff` (X-13 §(1)), detay sayfasıyla aynı. `/doctors/[id]` değişmez.

## 4. Veri katmanı

### 4.1 Toplu risk — tek hesap yolu

`src/lib/doctor-cari.ts`:

- `hesaplaDoktorRiskleri(idler: readonly string[], db?) → Map<string, DoktorRisk>` eklenir:
  - **Limitler:** `doctor.findMany({ where: { id: { in } }, select: { id, creditLimit } })`
  - **Açık satırlar:** `orderItem.findMany({ where: { order: { ...sayilanBelgeler.siparis, doctorId: { in } } } })`
    — `SIPARIS_SATIRI` + `shipmentItems` + `order.doctorId`. Doktor başına gruplanır, aynı sevk
    edilmemiş miktar dönüşümü ve `siparisToplami()` uygulanır.
  - **Bakiyeler:** tek `$queryRaw` — `SELECT "doctorId", ${BAKIYE} … WHERE "doctorId" IN (…) GROUP BY "doctorId"`.
    Hareketi olmayan doktorun bakiyesi 0'dır.
  - **Risk:** `bakiye + acik` Decimal ile; `limitAsildi` aynı kural (`risk.gt(limit)`).
- `hesaplaDoktorRisk(id)` → `hesaplaDoktorRiskleri([id])` sarmalayıcısı olur. Bulunamayan kimlikte
  bugünkü gibi hata atar (`findUniqueOrThrow` davranışı korunur).
- Para hesapları `.add/.div`/`Number()` yasağına uyar (X-5 lint).

**Not — risk toplamı:** bugün risk SQL'de `BAKIYE + acik::numeric` ile toplanıyor. Toplu sürümde
toplama Decimal ile JS'te yapılır. İki yol da 2 basamaklı tam sayılarda aynı sonucu verir; eşitlik
§6'daki entegrasyon testiyle sabitlenir.

### 4.2 Liste sorguları

`src/lib/doktor-listesi/sorgu.ts` (veritabanına bağlı):

- **`doktorWhere(suzgec, an)`** — `SAHIPSIZ_DOKTOR`, `EKSIK_FATURA_BILGISI` ve
  `sayilanBelgeler.siparis` buradan kullanılır. Son sipariş koşulları (gün sınırları
  `zaman.ts` ile İstanbul gününe göre — E-1):
  - **`sessiz=N`** → `orders: { none: { ...siparis, orderDate: { gte: gunAraligi(an).baslangic − (N−1) gün } } }`
    (bugün dahil son N günde sayılan sipariş yok)
  - **`sessiz=hic`** → `orders: { none: siparis }`
  - **`sonBas` / `sonBit`** (tek uç verilebilir) → son siparişi aralığa düşenler:
    - `orders: { some: { ...siparis, orderDate: { gte: bas, lt: bitSonu } } }`
    - ∧ `orders: { none: { ...siparis, orderDate: { gte: bitSonu } } }`
- **`doktorListesi(suzgec, sayfalama)`** — liste + toplam (bugünkü `include`), ardından sayfa
  kimlikleriyle paralel:
  - `order.groupBy({ by: doctorId, where: { ...siparis, doctorId: { in } }, _max: { orderDate } })`
  - `hesaplaDoktorRiskleri(idler)`
  - `doctor.findMany({ where: { AND: [{ id: { in } }, EKSIK_FATURA_BILGISI] }, select: { id } })`
- **`doktorKpileri()`** — dört sayım.
- **`doktorSuzgecSecenekleri()`** — farklı bölgeler (`distinct: region`) + aktif satıcılar.
- **`doktorPaneli(id)`** — doktor + satıcı; son 5 sipariş (`SIPARIS_SATIRI`); son 5 `LedgerEntry`;
  son 3 `DoctorAssignment`; `hesaplaDoktorRisk`; `vadesiGecmisUyarisi`. Bulunamazsa `null`.

### 4.3 Saf modüller (birim testli; `db.ts`'e dokunmaz)

- **`src/lib/doktor-listesi/suzgec.ts`:**
  - `DoktorSuzgeci` tipi, `BOS_SUZGEC`
  - `suzgecCoz(params) → { suzgec, sayfa, detay }`; geçersiz değer yok sayılır; eski adresleri
    çözer; kimlik deseni denetim modülündeki gibi
  - `doktorAdresi(suzgec, ek?)` — tek adres üreticisi; sekmeler, etiketler, sayfalama ve panel bunu kullanır
  - `etkinSuzgecler(suzgec, secenekler) → { anahtar, etiket, kaldirAdresi }[]`
  - `etkinSayisi(suzgec)`
- **`src/lib/doktor-listesi/sutunlar.ts`:**
  - `SUTUNLAR` (anahtar + başlık + gizlenebilir)
  - `gizliSutunlariCoz(cerez)`, `gizliSutunCerezi(anahtarlar)`

### 4.4 Sayfa bileşenleri (`src/app/(admin)/doctors/`)

| Dosya | Görevi |
|---|---|
| `page.tsx` | orkestrasyon: `requireStaff`, `suzgecCoz`, sorgular, çerez okuma |
| `KpiKartlari.tsx` | KPI kartları |
| `SuzgecCubugu.tsx` | sekmeler + Filtrele paneli + etkin etiketler + Sütunlar menüsü |
| `sutunEylemi.ts` | `"use server"`; çerez yazar, `redirect` ile aynı adrese döner |
| `DoktorTablosu.tsx` | satır, rozetler, vurgu, boş durum |
| `DurumRozetleri.tsx` | tablo ve panel ortak |
| `DoktorPaneli.tsx` | panel içeriği |

`TransferForm.tsx` değişmez.

## 5. Hata davranışı

- Geçersiz süzgeç değeri yok sayılır (hata göstermez; etiketi de çıkmaz).
- Bilinmeyen satıcı kimliği seçeneklerde yoksa yok sayılır.
- `bolge` serbest metindir; yalnız eşitlikle süzülür (Prisma parametreli).
- Panel verisi düşerse sayfanın `error.tsx` sınırı devreye girer; liste ayrı bir hata alanı değildir.
- Çerez değeri bozuksa varsayılan görünüm.

## 6. Testler

**Kabul kriterleri `KABUL_KRITERLERI.md`'ye testten önce yazılır** — ilgili karar satırlarının
altına yeni numaralar (öneri):

- A-12-5: listede ve panelde limit rozeti `hesaplaDoktorRisk` ile aynı sonucu verir
- A-13-3: eksik fatura satır vurgusu ve rozeti A-13-2 tanımını kullanır
- X-13 satırına: panel `requireStaff` ile görülür, Düzenle yalnız `YONETICI`'ye

Ek olarak Ü-18 başlığı altında: süzgeç, son sipariş, sütun seçici, boş durum davranış cümleleri.

| Katman | Dosya | Neyi doğrular |
|---|---|---|
| Birim | `src/lib/doktor-listesi/suzgec.test.ts` | Çözme/adres gidiş-dönüş; eski adresler; geçersiz değerler; hazır + aralık önceliği; etkin etiketler ve kaldırma adresleri; sayfa ve detay korunur |
| Birim | `src/lib/doktor-listesi/sutunlar.test.ts` | Çerez okuma/yazma; bozuk değer; gizlenemez sütun gizlenemez |
| Entegrasyon | `src/lib/risk.itest.ts` (genişler) | `hesaplaDoktorRiskleri` ≡ `hesaplaDoktorRisk` her doktor için birebir: borç, avans, açık sipariş, kısmi sevk, bedelsiz, limitsiz, limit eşit, limit aşımı, hareketsiz doktor, boş liste |
| Entegrasyon | `src/lib/doktor-listesi/sorgu.itest.ts` | Son sipariş: TEKLIF/IPTAL dışarıda; `sessiz=N` gün sınırı (İstanbul gece yarısı); `hic`; aralık "son sipariş aralıkta" anlamı; birleşik süzgeçler; satırdaki eksik fatura işareti süzgeçle tutarlı; KPI sayıları; panel `null` |
| E2E | `e2e/admin/doktorlar.spec.ts` | Süzgeç uygula → sonuç + etiket; × ile kaldır; KPI kartı tıklama; panel aç → içerik; Esc → odak isme; sütun gizle → yenile → gizli; boş durum → Süzgeçleri temizle |
| E2E | `e2e/operasyon/…` | OPERASYON paneli görür, Düzenle'yi görmez |
| E2E | `e2e/mobil/…` | Panel tam ekran açılır |
| E2E | mevcut | Toplu devir e2e'si değişmeden geçer |

E2E'yi push'tan önce yerelde koşarım (`medikal_test`).

## 7. Belgeler

- **`YOL_HARITASI.md`:** Ü-18 satırı.
- **`KABUL_KRITERLERI.md`:** §6'daki kriterler.
- **`TRACEABILITY.md`:** `npm run izlenebilirlik` ile yeniden üretilir.
- **`PROJE_DURUMU.md`:** arayüz bölümüne Doktorlar ekranı.
- **`AGENTS.md`:** doküman haritasına `docs/superpowers/specs/` satırı.
- **`MD_files/DEVAM_PROMPTU.md`:** ▶ satırı güncellenir.

## 8. Teslim

Her adım ayrı PR; CI yeşil görülmeden merge edilmez.

| PR | Dal | İçerik |
|---|---|---|
| D1 | `revize/doktorlar-d1-veri` | Bu spec · kabul kriterleri · Ü-18 · `hesaplaDoktorRiskleri` · `doktor-listesi/` saf modüller + sorgular · birim ve entegrasyon testleri. Ekran değişmez. |
| D2 | `revize/doktorlar-d2-tablo` | KPI kartları · süzgeç çubuğu ve paneli · yeni sütunlar · rozetler · satır vurgusu · boş durum · e2e |
| D3 | `revize/doktorlar-d3-panel` | `YanPanel` taşıma · yan panel · sütun seçici · e2e (admin, operasyon, mobil) · belgelerin kapanışı |
