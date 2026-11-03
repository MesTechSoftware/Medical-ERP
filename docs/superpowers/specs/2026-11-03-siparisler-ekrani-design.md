# Siparişler ekranı — KPI, süzgeç, sütun seçici, yan panel (tasarım spec'i)

> **Tarih:** 03.11.2026 · **Kaynak:** kullanıcı talebi (sohbet, 28.10.2026: "Kapsamlı sayfa modernizasyonu"
> isterinin §2-E maddesinin sipariş yarısı; altı modülün beşincisi — kargo yarısı altıncı modüldür) ·
> **Yol haritası:** Ü-23 (§7-5 gereği yazılır) · **Durum:** kullanıcı 02.11.2026'da "tüm sayfalar için
> aynı planı ve tasarımı uygula, önerilenlerinle ilerle" dedi — her seçim önerilen seçenektir (§9).
> 28.10 seçimleri: **10-A** kartlar seçili tarih aralığını sayar (varsayılan bu ay), "Hazırlanıyor" kartı
> eklenir (6 kart), teklif sayılmaz · **11-A** sipariş detay sayfasına ve iade formuna dokunulmaz, listede
> `?detay=` yan paneli (kalemler, sevkiyatlar, tutar, tam detay bağlantısı) · satıcı ekranları
> (`/my-orders`) kapsam dışı.
>
> Bu belge **plan**dır, karar üretmez (`YOL_HARITASI.md` §7.1-A). Dayandığı kararlar A-5 (teklif hiçbir
> sayıma girmez), A-3 (kısmi sevkiyat, kalem başına kalan), A-1 (iade ayrı belge), A-8 (onay bloğu),
> C-6 §(3) (sipariş toplamı saklanmaz, satırlardan türetilir), D-3 (sevkiyat: firma, takip no, gönderi
> günü), D-2 (OPERASYON siparişleri görür ve işler), E-1 (gün sınırı İstanbul günüdür). Yeni karar ya da
> ADR açılmaz.

## 1. Amaç

`/orders` tek bakışta sipariş akışını göstersin: seçili aralıkta kaç onaylı sipariş açıldı, kaçı
bekliyor, hazırlanıyor, kargoda, teslim edildi, iptal edildi. Liste tarih, satıcı ve metinle süzülsün; bir
siparişin kalemlerine, kalan miktarlarına, sevkiyatlarına ve tutarına listeden ayrılmadan bakılabilsin.
Sipariş açma, durum işlemleri, iade ve detay sayfası değişmez.

**Başarı ölçütü:** yönetici "Bekliyor" kartına tıklar, kartın sayısı kadar satır görür; bir satırı açar,
panelde hangi kalemin ne kadarının sevk edildiğini, kalanı, sevkiyatın takip numarasını ve belge
toplamını detay sayfasıyla aynı sayılarla görür. Dashboard'daki "Sipariş durumları" dilimi aynı sayıyı
açar.

## 2. Kapsam

### Kapsamda

| # | Kalem | Dayanak |
|---|---|---|
| 1 | KPI: Toplam · Bekliyor · Hazırlanıyor · Kargolandı · Teslim edildi · İptal — seçili aralık, varsayılan bu ay, teklif hariç | ADR-010 `KpiCard` · 10-A · A-5 |
| 2 | Hızlı sekmeler (durum): Tümü · Bekliyor · Hazırlanıyor · Kargolandı · Teslim edildi · İptal · Teklif + etkin süzgeç etiketi | ortak `HizliSekmeler`/`EtkinSuzgecler` |
| 3 | Filtrele paneli: tarih aralığı (sipariş günü), satıcı, metin (belge no, cari adı, klinik) | ortak `SuzgecFormu`/`AcilirPanel` |
| 4 | Tablo: tarih, belge no, cari (+ Teklif ve onay çipi), klinik, satıcı, tutar (KDV dahil), sevk, durum, işlem | C-6 §(3) · A-3 · A-8 |
| 5 | Sütun seçici, sayfalama (sayfa dışı adres son sayfaya, `per` korunur), boş durum, yükleme iskeleti | ortak bileşenler |
| 6 | Yan panel: özet, kalemler (sevk / kalan / iade), tutarlar, sevkiyatlar, iadeler, Tam detay | `YanPanel` · 11-A |
| 7 | Dashboard "Sipariş durumları" dilimi yeni süzgeç adresini aralığıyla açar | ADR-010 madde 10 |

### Kapsam dışı

- Sipariş detay sayfası (`/orders/[id]`), durum işlemleri, iptal ve iade formu — bugünkü gibi (11-A).
- Yeni sipariş formu (`/orders/new`).
- Satıcı ekranı `/my-orders` (28.10 varsayımı).
- Kargo ekranı (`/shipping`) ve toplu kargo — altıncı modül (12-A, 13-A).
- Panelden durum işlemi (Hazırlığa al, teslim, iptal) — detay sayfasında kalır.
- KPI'da önceki dönemle karşılaştırma ve trend — dashboard'dadır.

## 3. Ekran

### 3.1 Görünürlük (D-2)

`requireStaff` (admin yerleşimi). YONETICI ve OPERASYON aynı listeyi, KPI'ı ve paneli görür; ekranda rol
farkı yoktur. Prim gösterilmez.

### 3.2 KPI kartları

6 kart ADR-010'un 4 kart sınırına istisnadır (kullanıcı kararı 03.11.2026, ADR-010 eki); yerleşim dar satırda 2 kolon, 576 px'ten 6 birim (birincil tam satır, 3 + 2), 1200 px'ten tek satır. Etiketler sekmelerle aynıdır ("Teslim Edildi", "İptal"). Kartlar **aralıkta açılan onaylı siparişlerin bugünkü durumlarını** sayar (`stage = ONAYLI`, `orderDate`
aralıkta). Bu tanım dashboard'un "Sipariş durumları" dağılımıyla aynıdır ve tek fonksiyondan okunur
(`siparisDagilimi(aralik)`, `src/lib/dashboard.ts`). Teklif sayılmaz (A-5).

- **Aralık:** adreste tarih süzgeci varsa o (`baslangic`–`bitis`, İstanbul günleri, ikisi dahil; biri
  boşsa açık uç); yoksa **bu ay** (ayın 1'i – bugün). Kartın alt notu aralığı yazar: "Bu ay" ya da
  `aralikEtiketi(...)` ("01.10.2026 – 15.10.2026", "15.10.2026 sonrası"). Açık uç `TUM_ZAMANLAR`'ın
  ucudur.
- Metin ve satıcı süzgeci kartları **etkilemez** (kartlar aralığın özetidir); durum sekmesi de etkilemez.
- `bosDavranisi: "sifir"`, karşılaştırma ve trend yok.

| Kart | Tanım | Tıklayınca |
|---|---|---|
| Toplam | beş durumun toplamı (iptal dahil) — alt metin "teklif hariç" | bağlantı değil (Tümü sekmesi teklifi de listeler) |
| Bekliyor | `BEKLIYOR` | `?durum=BEKLIYOR&baslangic=…&bitis=…` |
| Hazırlanıyor | `HAZIRLANIYOR` | `?durum=HAZIRLANIYOR&…` |
| Kargolandı | `KARGOLANDI` | `?durum=KARGOLANDI&…` |
| Teslim edildi | `TESLIM_EDILDI` | `?durum=TESLIM_EDILDI&…` |
| İptal | `IPTAL` | `?durum=IPTAL&…` |

Kart bağlantısı **kullandığı aralığı adrese yazar** (varsayılan aralıkta da `baslangic` = ayın 1'i,
`bitis` = bugün). Böylece durum kartının sayısı, açtığı listenin satır sayısına eşittir (aynı `where`
üreticisi). "Bekliyor" ve "Hazırlanıyor" > 0 ise uyarı tonu yok — bekleyen iş dashboard'un istisna
bandındadır; burada kartlar nötrdür.

### 3.3 Süzgeç

| Parametre | Değerler | Anlamı |
|---|---|---|
| `durum` | `BEKLIYOR` · `HAZIRLANIYOR` · `KARGOLANDI` · `TESLIM_EDILDI` · `IPTAL` | `stage = ONAYLI` **ve** `status = …` |
| | `TEKLIF` | `stage = TEKLIF` (durumu ne olursa olsun) |
| `baslangic`, `bitis` | `YYYY-AA-GG` | `orderDate` İstanbul günü; ters verilirse yer değiştirir (stok süzgeciyle aynı) |
| `satici` | kullanıcı kimliği · `yok` | `sellerId`; `yok` = satıcısız (bayi) siparişi |
| `q` | metin (kırpılır, en çok 100 karakter) | belge no, cari adı ya da klinik içerir (büyük/küçük harf duyarsız) |
| `page`, `per`, `detay` | | ortak adlar |

- **Eski adres:** `status=<durum>` okunur ve `durum` gibi davranır (dashboard'un eski bağlantısı, yer
  imleri); `durum` varsa `status` yok sayılır. Liste kendi bağlantılarında yalnız `durum` yazar.
- **Sekmeler:** Tümü · Bekliyor · Hazırlanıyor · Kargolandı · Teslim edildi · İptal · Teklif. Sekme yalnız
  `durum`'u yazar, öbür süzgeçleri korur; sayfa düşer. "Tümü" iki aşamayı da listeler.
- **Filtrele paneli** (`AcilirPanel` + `SuzgecFormu`): başlangıç ve bitiş günü, satıcı (satıcı rolündeki
  kullanıcılar ada göre; pasifler "· pasif" ekiyle; en sonda "Satıcısız (bayi)"), metin kutusu. Form
  `durum` ve `per`'i gizli alanla korur (D2'den beri açık olan "Filtrele formu `per`'i korumuyor" gözlemi
  bu ekranda kapanır).
- **Etkin etiketler** × ile kaldırılır: "Durum: Bekliyor", "Tarih: …", "Satıcı: Ad" / "Satıcı: Satıcısız
  (bayi)", "Ara: …". Bilinmeyen satıcı kimliği adresten düşer (yönlendirme; stok ekranındaki ürün
  süzgeciyle aynı, B-4-12 deseni).

### 3.4 Tablo

| Sütun | İçerik | Gizlenebilir |
|---|---|---|
| Tarih | `formatDate(orderDate)` | hayır |
| Belge no | `documentNo` (`SIP-…`) | evet |
| Cari | ad (panel bağlantısı `?detay=<id>`) + `OnayEtiketi` (A-8: onay bekliyor / reddedildi) | hayır |
| Klinik | `doctor.clinic` (`oncelik-dusuk`) | evet |
| Satıcı | `seller.name` ya da "—" (`oncelik-dusuk`) | evet |
| Tutar | `siparisToplami(items).toplam` — KDV dahil (bugünkü sütun) | evet |
| Sevk | sevk edilen / sipariş adedi (bedelsiz dahil): hiç yoksa "—", kısmiyse "3 / 5", tamamsa "5 / 5" | evet |
| Durum | `StatusBadge`; teklifte durum adı yerine "Teklif" / "Teklif (iptal)" çipi (durum sekmeleri yalnız onaylıyı sayar) | hayır |
| İşlem | Detay (`/orders/<id>`) | hayır |

Sıralama `orderDate desc, id desc` (aynı andaki siparişlerde sayfalama kararlı). Çerez `siparis-sutunlar`,
`path=/orders`; varsayılan gizli sütun yok. Onay çipi sayfadaki siparişler için tek sorguyla okunur
(`belgeOnayDurumlari("SIP", ids)`, Kargo ve Siparişlerim ekranlarıyla aynı).

### 3.5 Yan panel (11-A)

1. **Özet:** belge no, sipariş tarihi (`formatDateTime`), durum rozeti (+ Teklif ve onay çipi), cari
   (bağlantı `/doctors?detay=<id>`) ve klinik, satıcı, vade (`paymentTermDays` gün).
2. **Kalemler:** ürün (ad + kod), sipariş adedi, sevk edilen, kalan, iade edilen, birim fiyat, satır
   tutarı; bedelsiz satır "Bedelsiz" çipiyle ve tutarsız. Kalan = sipariş − sevk (A-3); iade kalanı
   değiştirmez (A-1: iade ayrı belgedir). Hepsi tek saf fonksiyondan (§4 `kalemMiktarlari`).
3. **Tutarlar:** ara toplam, KDV, genel toplam — `siparisToplami` (detay sayfasıyla aynı yol).
4. **Sevkiyatlar:** her biri belge no (`SVK-…`), gönderi günü, firma, takip no (firmanın şablonu varsa
   `takipLinki` bağlantısı), irsaliye no (C-1, doluysa), kalem adedi toplamı. Yoksa "Henüz sevkiyat yok."
5. **İadeler:** belge no (`IAD-…`), tarih, adet toplamı; yoksa bölüm çizilmez.
6. Altta: **Tam detay** (`/orders/<id>`).

Bulunamayan `detay` paneli açmaz (sessizce).

## 4. Veri katmanı

- **`src/lib/siparis.ts`** (mevcut, saf) — eklenir: `kalemMiktarlari({ quantity, shipmentItems,
  returnItems }) → { sevk, iade, kalan }`. Panel ve tablonun "Sevk" sütunu buradan okur. Detay sayfası,
  Kargo ekranı ve `sevkiyatYaz()` bu turda değişmez (detay 11-A gereği; Kargo altıncı modülde bu
  fonksiyona geçer; `sevkiyatYaz` kalanı kilit altında kendi okumasıyla hesaplar).
- **`src/lib/siparis-listesi/suzgec.ts`** (saf): `SiparisSuzgeci = { durum, baslangic, bitis, satici, q }`,
  `BOS_SUZGEC`, `suzgecCoz(params)` (`status` takma adı dahil), `siparisAdresi(s, { page, per })`,
  `hizliSekmeler(s)`, `etkinSuzgecler(s, saticiAdi)`, `kpiAraligi(s, bugun) → { baslangic, bitis,
  varsayilan }` (gün metinleri), `kartAdresi(durum, aralik)`, `bosDurum(s)`.
- **`src/lib/siparis-listesi/sutunlar.ts`** (saf): `SUTUNLAR`, `SUTUN_CEREZI = "siparis-sutunlar"`.
- **`src/lib/siparis-listesi/sorgu.ts`:**
  - `siparisKosulu(s) → Prisma.OrderWhereInput` — tek `where` üreticisi (durum/aşama, `orderDate`
    aralığı `yerelGunAraligi`'ndan, satıcı, metin `OR`).
  - `siparisListesi(s, { skip, take }) → { satirlar, toplam }` — satır: kimlik, belge no, tarih, aşama,
    durum, cari (kimlik, ad, klinik), satıcı adı, `toplam` (Decimal), `sevk` / `adet`, onay durumu.
  - `siparisKpileri(aralik: Aralik) → Record<OrderStatus, number> & { toplam }` — `siparisDagilimi`'nı
    sarar; ikinci bir sayım yolu açılmaz.
  - `siparisPaneli(id) → Panel | null`.
- **Dashboard:** dağılım diliminin `href`'i `siparisAdresi({ durum, baslangic, bitis })` olur — dashboard
  aralığının İstanbul günleriyle (`r.simdi`; bitiş dışlayıcı olduğundan son gün `bitis − 1 ms`'nin
  günüdür).

## 5. Hata davranışı

Geçersiz süzgeç değeri (bilinmeyen durum, bozuk gün, kimlik biçimine uymayan satıcı) yok sayılır.
Biçimi doğru ama bulunmayan satıcı kimliği adresten düşer (yönlendirme). Bulunamayan `detay` paneli
açmaz. Sayfa dışı `page` son sayfaya yönlenir (süzgeç ve `per` korunur). KPI sorgusu hata verirse
yalnız kartlar düşer (`kpiGetir`, X-3), liste çizilir.

## 6. Testler

**Kabul kriterleri (testten önce):**

- **A-5-8:** Siparişler ekranının durum kartları aralıkta (`orderDate`, İstanbul günü, iki uç dahil;
  varsayılan bu ay) açılan **onaylı** siparişleri bugünkü durumlarına göre sayar; `TEKLIF` hiçbir karta
  girmez, "Toplam" beş durumun toplamıdır (iptal dahil). Durum kartının sayısı açtığı süzgecin satır
  sayısına ve dashboard'un aynı aralıktaki "Sipariş durumları" dağılımına eşittir; metin ve satıcı
  süzgeci kartları değiştirmez.
- **A-3-2:** Siparişler ekranında kalem başına sevk edilen, kalan (sipariş − sevk) ve iade edilen miktar
  tek fonksiyondan okunur; iade kalanı değiştirmez. Tablonun "Sevk" sütunu ve yan panelin tutarları detay
  sayfasıyla aynı yoldan (`siparisToplami`) gelir.

| Katman | Dosya | Neyi doğrular |
|---|---|---|
| Birim | `siparis-listesi/suzgec.test.ts` | çözme/adres gidiş-dönüş; `status` takma adı ve `durum` önceliği; ters gün; `q` kırpma/sınır; sekme adresleri süzgeci korur; KPI aralığı (varsayılan bu ay, açık uç); kart adresi aralığı yazar; etiketler; boş durum türü |
| Birim | `siparis.test.ts` (genişler) | `kalemMiktarlari`: sevk yok, kısmi, tam, iade sonrası kalan değişmez |
| Entegrasyon | `siparis-listesi/sorgu.itest.ts` | A-5-8: teklif kart dışı ama Teklif sekmesinde; her durum kartı = süzgeç satırı = `siparisDagilimi`; aralık sınırları İstanbul günü (gece yarısı kenarı); metin ve satıcı kartı değiştirmez; satıcısız süzgeç; metin belge no / cari / klinik; sıralama kararlı; panel: kalemler, kalan, iade, sevkiyat (takip linki, irsaliye), tutar = `siparisToplami`, bulunmayan → `null` |
| E2E | `e2e/admin/siparisler.spec.ts` | Bekliyor kartı → satır sayısı = kart; Teklif sekmesi; Filtrele (tarih + satıcı) etiketleri ve × ile kaldırma; panel aç → kalemler + sevkiyat + toplam = detay sayfası; sütun gizle → yenile; sayfa dışı adres; eski `?status=` adresi; dashboard dilimi → aynı sayı |
| E2E | mevcut | `siparis-toplam`, `sevkiyat`, `iade`, `onay`, `kabul-senaryosu`, `mobil/tablo`, `tasarim`, `operasyon` geçer |

## 7. Belgeler

YOL_HARITASI Ü-23 · KABUL_KRITERLERI (A-5-8, A-3-2) · TRACEABILITY (`npm run izlenebilirlik`) ·
PROJE_DURUMU arayüz bölümü · DEVAM_PROMPTU. KARARLAR değişmez.

## 8. Teslim

Tek PR (kullanıcı 03.11.2026: "tek PR'la bitir"):

| PR | Dal | İçerik |
|---|---|---|
| Ü-23 | `revize/siparisler-ekrani` | spec · plan · Ü-23 · kriterler · `kalemMiktarlari` · `siparis-listesi/` saf modüller + sorgular · KPI · sekmeler · Filtrele · tablo · sütun seçici · sayfalama · panel · iskelet · dashboard bağlantısı · birim/entegrasyon/e2e testleri · belgeler |

## 9. Önerilen seçimler

| # | Soru | Seçilen | Diğer |
|---|---|---|---|
| 1 | KPI aralığı ile listenin tarih süzgeci | Kartlar listenin tarih süzgecini izler; süzgeç yoksa bu ay. Liste varsayılanı tüm zamanlar kalır | Sayfa varsayılan olarak "bu ay"a süzülür (bugünkü liste davranışı değişir; "tümü" için ayrı işaret gerekir) |
| 2 | Teklif listede nerede? | Tümü'de "Teklif" çipiyle + ayrı "Teklif" sekmesi; durum sekmeleri yalnız onaylıyı sayar (kart = satır) | Teklif listeden tamamen çıkar (A-5 ciroyu ilgilendirir, listeyi değil) |
| 3 | "Toplam" kartı tıklanır mı? | Hayır — Tümü teklifi de listeler, sayı tutmaz | Tıklanır, `durum` yerine ayrı `asama=onayli` süzgeci (yalnız bu kart için yeni parametre) |
| 4 | KPI hangi süzgeçleri izler? | Yalnız tarih | Bütün süzgeçler (satıcıya göre kart — satıcı raporu Raporlar'dadır) |
| 5 | Sevk sütunu | adet olarak "sevk / sipariş" | yüzde çubuğu (küçük ekranda okunmaz) · yok (kısmi sevk listede görünmez) |
| 6 | Panelde işlem düğmeleri | yok; Tam detay | Hazırlığa al / teslim / iptal panelde (iki yerde aynı işlem, onay diyalogları çoğalır) |
| 7 | Eski `?status=` adresi | okunur, `durum` gibi | düşer (dashboard bağlantısı ve yer imleri bozulur) |
| 8 | `kalemMiktarlari` yaygınlaştırma | panel + tablo; Kargo altıncı modülde geçer; detay sayfasına dokunulmaz (11-A) | şimdi bütün çağıranlar (detay ve kargo bu turun dışında) |
| 9 | Metin araması | belge no, cari adı, klinik | ürün adı da (kalem birleştirmesi; liste sorgusunu ağırlaştırır) |
