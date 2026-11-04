# Tahsilatlar ekranı — KPI, süzgeç, tahsilat paneli, yeni tahsilat sayfası (tasarım spec'i)

> **Tarih:** 04.11.2026 · **Kaynak:** kullanıcı talebi (sohbet, 04.11.2026: "sonraki sayfaya geç aynı işlem" —
> menüde Onay Bekleyenler'den sonraki sayfa) · **Yol haritası:** Ü-26 (§7-5 gereği yazılır) · **Durum:**
> kullanıcı 02.11.2026'da "önerilenlerinle ilerle" dedi — her seçim önerilen seçenektir (§9); tek PR.
>
> Bu belge **plan**dır, karar üretmez (`YOL_HARITASI.md` §7.1-A). Dayandığı kararlar: A-11 (ödeme yöntemi tanım
> tablosu, tip kodda kapalı NAKIT/BANKA/POS, komisyon kayda donar ve cariye dokunmaz), A-15 (nakit tevsik
> uyarısı `BILGI`), X-6 (tahsilat siparişle eşleşmez; vadesi geçmiş hareket `BILGI`), FR-29 / X-11 §(5)
> (iptal ters kayıt, kayıt silinmez), X-18-5 (tahsilat iptali gerekçe isteyen akıştır), D-2-1 (tahsilat
> kaydı ve iptali `YONETICI` ve `OPERASYON`), Ü-3-1 (tahsilat tutarı *KDV dahil*), E-1 (İstanbul günü),
> ADR-010 (KPI). Yeni karar ya da ADR açılmaz.

## 1. Amaç

`/collections` tahsilatın hem kayıt hem takip ekranı olsun: seçili dönemde ne kadar tahsil edildi, bunun
ne kadarı nakit, havale ve POS (POS'ta komisyon ne tuttu). Liste tarihe, yönteme, duruma ve metne göre
süzülsün, altında süzgecin toplamı dursun. Bir tahsilat açılınca belgenin bütün bilgisi (donmuş komisyon,
referans, kaydeden, carinin güncel bakiyesi) görünsün; iptal gerekçeyle oradan yapılsın. Yeni tahsilat
formu kendi sayfasına taşınsın.

**Başarı ölçütü:** kullanıcı "POS" kartına tıklar; liste yalnız bu ayın POS tahsilatlarını gösterir ve
altındaki toplam karttaki tutara eşittir. Bir satırı açar, panelde "Komisyon %2,50 · ₺125,00" ve carinin
bakiyesini görür; gerekçe yazıp iptal eder; tahsilat "İptal" süzgecinde gerekçesiyle görünür, kart tutarı
düşer.

## 2. Kapsam

### Kapsamda

| # | Kalem | Dayanak |
|---|---|---|
| 1 | KPI: Tahsilat · Nakit · Banka · POS (süzgecin tarih aralığı, varsayılan bu ay; kart = süzgecin toplamı) | ADR-010 · A-11 |
| 2 | Tarih hızlı sekmeleri (Tümü · Bugün · Son 7 gün · Bu ay) + Filtrele (tarih, durum, yöntem tipi, metin) + etkin süzgeç etiketleri | ortak bileşenler |
| 3 | Tablo: tarih, belge no, cari, yöntem, referans, tutar, komisyon, kaydeden, durum; sütun seçici, sayfalama, süzgeç toplamı satırı, boş durum, iskelet | ortak bileşenler · Ü-3-1 |
| 4 | Yan panel (`?detay=<tahsilatId>`): belge, donmuş komisyon, carinin güncel bakiyesi, iptal bilgisi; aktifse gerekçeli iptal formu | A-11 · FR-29 · X-18-5 |
| 5 | Yeni tahsilat `/collections/new` (bugünkü form; sonuç ve `BILGI` uyarıları formun altında) | A-15 · X-6 |
| 6 | Formdaki eskimiş "vadesi en eski siparişten başlayarak otomatik mahsup edilir" notu düzeltilir | X-6 (FIFO söküldü) |

### Kapsam dışı

- Tahsilat yazım yolu (`tahsilatYaz`, `recordCollection`) ve iptalin ters kaydı (değişmez).
- Tahsilat düzenleme (kayıt değişmez; yanlış kayıt iptal edilip yeniden girilir).
- Kasa/banka bakiyesi (A-11-1: tutulmaz), valör tarihi (`expectedValueDate` bugün yazılmıyor).
- Doktor detayından ön seçili "Tahsilat kaydet" bağlantısı (ayrı iş).
- Satıcıya göre süzgeç (tahsilat satıcıya tahsilat anındaki sahiplikten bağlanır — Raporlar'ın işi, X-1-1).

## 3. Ekran

### 3.1 Görünürlük

`requireStaff` (bugünkü gibi; `YONETICI` ve `OPERASYON`, D-2-1). Başlıkta "Yeni Tahsilat" düğmesi
(`LinkButton`, ikon `yeni`) → `/collections/new`.

### 3.2 KPI kartları

Aralık: süzgeçte tarih varsa o, yoksa bu ay (ayın 1'i – bugün) — Siparişler'deki `kpiAraligi` kuralı; alt not
"Bu ay" ya da aralık etiketi. Yalnız `AKTIF` tahsilatlar; tarih `paidAt`'in İstanbul günü, iki uç dahil.
Durum, tip ve metin süzgecinden bağımsız. `bosDavranisi: "sifir"`, trend ve karşılaştırma yok; tutarlar
`taban={BRUT}` (*KDV dahil*). `kpiGetir` kapsülü: sorgu hata verirse yalnız kartlar düşer.

| Kart | Değer | İkincil metrik | Tıklayınca |
|---|---|---|---|
| Tahsilat (birincil) | aralıktaki aktif tahsilatların tutar toplamı | "N tahsilat" | `?baslangic=…&bitis=…` |
| Nakit | `paymentMethod.type = NAKIT` toplamı | "N tahsilat" | `…&tip=NAKIT` |
| Banka | `BANKA` toplamı | "N tahsilat" | `…&tip=BANKA` |
| POS | `POS` toplamı | "N tahsilat" | `…&tip=POS` |

Kart adresi aralığı adrese yazar (varsayılan aralıkta da); açtığı listenin toplam satırı kartın tutarına,
satır sayısı ikincil metrikteki adede eşittir.

### 3.3 Süzgeç

| Parametre | Değerler | Anlamı |
|---|---|---|
| `baslangic`, `bitis` | `YYYY-AA-GG` | `paidAt`'in İstanbul günü, iki uç dahil |
| `durum` | yok (= aktif) · `IPTAL` · `tumu` | `status` |
| `tip` | `NAKIT` · `BANKA` · `POS` | `paymentMethod.type` |
| `q` | metin (≤ 100, Türkçe varyantlı `metinVaryantlari`) | belge no (`THS-…`), referans no ya da cari adı |
| `page`, `per`, `detay` | | ortak |

Hızlı sekmeler tarih kısayollarıdır (`tarihSekmeleri`/`etkinTarihSekmesi`, ortak modül); öbür süzgeçleri
korur. Filtrele paneli: tarih, durum (Aktif / İptal edilen / Tümü), yöntem tipi (Nakit / Banka / POS), ara;
`per` gizli alanla korunur. Etiketler: "Tarih: …", "Durum: İptal edilen" / "Durum: Tümü", "Yöntem: POS",
"Ara: …".

### 3.4 Tablo

| Sütun | İçerik | Gizlenebilir |
|---|---|---|
| Tarih | `formatDate(paidAt)` | hayır |
| Belge no | `THS-…` | hayır |
| Cari | doktor adı → `/doctors/<id>` | hayır |
| Yöntem | yöntem adı | evet |
| Referans | `referenceNo` ya da "—" | evet |
| Tutar (KDV dahil) | `Tutar taban={BRUT}`; iptalde üstü çizili | hayır |
| Komisyon | `commissionAmount`, sıfırsa "—" | evet |
| Kaydeden | kullanıcı adı | evet |
| Durum | Aktif (nötr) · İptal (hata rozeti) | hayır |
| İşlem | "İncele" → panel (`?detay=`, `data-kayit`) | hayır |

Sıralama `paidAt desc, id desc`. Çerez `tahsilat-sutunlar`, `path=/collections`. **Toplam satırı**
(`tfoot`): `durum` aktifken süzgecin bütün sayfalarındaki aktif tahsilatların toplamı ve adedi ("Toplam ·
N tahsilat"); `IPTAL`/`tumu`'da gösterilmez.

### 3.5 Yan panel

1. **Tahsilat:** belge no, durum rozeti, cari (bağlantı), tarih ve saat (`paidAt`), tutar (*KDV dahil*),
   yöntem ve tipi, referans, açıklama, kaydeden · kayıt zamanı.
2. **Komisyon:** donmuş oran ve tutar (A-11: yöntemin bugünkü oranı değil kayıttaki); sıfırsa bölüm yok.
3. **Cari:** carinin güncel bakiyesi (`hesaplaDoktorBakiye`, tek kaynak) ve "Cari hareketleri" bağlantısı
   (`/doctors/<id>`).
4. **İptal:** iptal edilmişse iptal eden, zaman, gerekçe; aktifse form: gerekçe (zorunlu) + "Tahsilatı iptal
   et" (onay iletişimi bugünkü metin). Form `data-payment-id` taşır.

Bulunmayan `detay` paneli açmaz.

### 3.6 Yeni tahsilat sayfası

`/collections/new` (`requireStaff`): bugünkü `CollectionForm` aynen; üstte "← Tahsilatlar" bağlantısı. Not
satırı: "Tahsilat siparişle eşleştirilmez; carinin bakiyesinden düşer." (X-6). Başarı ve `BILGI` uyarıları
(nakit tevsik, vadesi geçmiş hareket) formun altında, bugünkü gibi.

## 4. Veri katmanı

- **`src/lib/tahsilat-listesi/suzgec.ts`** (saf): `TahsilatSuzgeci = { baslangic, bitis, durum, tip, q }`,
  `BOS_SUZGEC`, `suzgecCoz(p) → { suzgec, detay }`, `tahsilatAdresi(s, { page, per, detay })`,
  `tarihSekmeleri` uyarlaması, `etkinSuzgecler(s)`, `bosDurum(s)`, `kpiAraligi(s, bugun)`,
  `kartAdresi(tip | null, aralik)`.
- **`src/lib/tahsilat-listesi/sutunlar.ts`** (saf): `SUTUNLAR`, `SUTUN_CEREZI = "tahsilat-sutunlar"`,
  `SUTUN_YOLU = "/collections"`.
- **`src/lib/tahsilat-listesi/sorgu.ts`:** `tahsilatKosulu(s) → Prisma.DoctorPaymentWhereInput` (tek `where`;
  liste, toplam ve kartlar aynı koşuldan), `tahsilatListesi(s, sayfa)` (satırlar + `toplam: { tutar, adet } |
  null`), `tahsilatKpileri(aralik)` (bir `groupBy` `paymentMethodId` — `_sum` tutar ve komisyon, `_count` — sonra
  yöntemlerin tipine katlanır; toplam üç tipin toplamıdır; para `Decimal`, X-5), `tahsilatPaneli(id)`.
- **`cancelCollection`:** gerekçe boşsa `engel("GEREKCE_ZORUNLU", {}, "reason")` (X-18-5); sabit "Admin iptali"
  kalkar.

## 5. Hata davranışı

Geçersiz süzgeç değeri yok sayılır. Bulunmayan `detay` paneli açmaz. Sayfa dışı `page` son sayfaya
yönlenir. İptal: gerekçesiz → `GEREKCE_ZORUNLU` (alan altında); zaten iptal → `TAHSILAT_ZATEN_IPTAL`
(bugünkü gibi). KPI sorgusu hata verirse yalnız kartlar düşer (`kpiGetir`).

## 6. Testler

**Kabul kriterleri (testten önce):**

- **A-11-2:** Tahsilat ekranının kartları süzgecin tarih aralığındaki (yoksa bu ayın) aktif tahsilatlarını
  `paidAt`'in İstanbul gününden toplar: toplam ve yöntem tipi başına (Nakit, Banka, POS), tutar ve adet. Kartın açtığı süzgecin toplam satırı kartın tutarına, satır sayısı kartın
  adedine eşittir. İptal edilen tahsilat hiçbir karta ve toplama girmez.
- **A-11-3:** Tahsilat panelinde komisyon kayıttaki donmuş oran ve tutardır (yöntemin oranı sonradan değişse
  de). Tahsilat iptali gerekçe ister; gerekçe kayda yazılır ve panelde iptal edeni ve zamanıyla görünür.

| Katman | Dosya | Neyi doğrular |
|---|---|---|
| Birim | `tahsilat-listesi/suzgec.test.ts` | çözme/adres gidiş-dönüş; varsayılan aktif; geçersiz değer; tarih sekmeleri öbür süzgeçleri korur; `kpiAraligi`; kart adresleri; etiketler; boş durum |
| Entegrasyon | `tahsilat-listesi/sorgu.itest.ts` | A-11-2: kart = süzgeç toplamı ve adedi (toplam ve üç tip); iptal girmez; İstanbul gece yarısı sınırı; metin (belge no, referans, cari adı, Türkçe I/ı); sıralama; A-11-3: panel donmuş komisyon (yöntem oranı değiştirildikten sonra), bakiye, iptal bilgisi; bulunmayan → `null` |
| Entegrasyon | `collections.itest.ts` güncellenir | gerekçesiz iptal `GEREKCE_ZORUNLU`, hiçbir şey yazılmaz; gerekçe `cancelReason`'a yazılır |
| E2E | `e2e/admin/tahsilat-ekrani.spec.ts` | POS kartı → süzgeç, toplam = kart; panel komisyon; gerekçeli iptal → İptal süzgecinde gerekçe; sütun gizle; sayfa dışı adres; KPI iskeleti |
| E2E | `e2e/admin/collections.spec.ts` güncellenir | kayıt `/collections/new`'den; iptal panelden gerekçeyle |

`yetki.test.ts`: yeni sütun eylemi (`requireStaff`) matrise girer. `operasyon.spec.ts`: OPERASYON ekranı ve
yeni tahsilat sayfasını açar.

## 7. Belgeler

YOL_HARITASI Ü-26 · KABUL_KRITERLERI (A-11-2, A-11-3) · TRACEABILITY · PROJE_DURUMU · DEVAM_PROMPTU.

## 8. Teslim

Tek PR `revize/tahsilat-ekrani`.

## 9. Önerilen seçimler

| # | Soru | Seçilen | Diğer |
|---|---|---|---|
| 1 | KPI'lar | Tahsilat · Nakit · Banka · POS — mutabakatta yöntem kırılımı (komisyon tablo sütununda ve panelde; Ü-3-1 ikincil metinde para göstermez) | Tahsilat · Bugün · İptal · Ortalama |
| 2 | KPI dönemi | süzgecin tarihi, yoksa bu ay (Siparişler gibi) | sabit bu ay |
| 3 | Hızlı sekmeler | tarih kısayolları (Tümü · Bugün · Son 7 gün · Bu ay) | durum sekmeleri (Aktif/İptal) |
| 4 | Varsayılan durum | yalnız aktif (iptaller "Durum" süzgecinde) — kart = toplam | aktif + iptal karışık (bugünkü) |
| 5 | Yeni tahsilat formu | ayrı sayfa `/collections/new` (Kullanıcılar, Doktorlar gibi) | listenin üstünde kart (bugünkü) |
| 6 | İptal | panelde, gerekçe zorunlu (X-18-5) | satırda, sabit gerekçe (bugünkü "Admin iptali") |
| 7 | Süzgeç toplamı | tablo altında toplam ve adet (aktifken) | yok |
| 8 | Yöntem süzgeci | tip (Nakit/Banka/POS — kapalı katalog) | yöntem kimliği (tanım tablosu büyüyebilir) |
