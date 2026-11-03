# Kargo ekranı — KPI, toplu kargo, sevkiyat listesi (tasarım spec'i)

> **Tarih:** 03.11.2026 · **Kaynak:** kullanıcı talebi (sohbet, 28.10.2026: "Kapsamlı sayfa modernizasyonu"
> isterinin §2-E maddesinin kargo yarısı — "Kargo Operasyon Paneli"; altı modülün altıncısı ve sonuncusu) ·
> **Yol haritası:** Ü-24 (§7-5 gereği yazılır) · **Durum:** kullanıcı 02.11.2026'da "önerilenlerinle ilerle",
> 03.11.2026'da "sonraki sayfaya geç aynı işleyiş" dedi — her seçim önerilen seçenektir (§9); tek PR.
> 28.10 seçimleri: **12-A** seçilen siparişlerin kalan adetlerinin hepsi tek seferde gönderilir, kargo firması
> ortak, takip ve irsaliye numarası satır başına, her sipariş ayrı işlem (A-8 her birine ayrı), sonuç sipariş
> başına listelenir; kısmi miktar için bugünkü kart formu kalır · **13-A** kargo firması tanım ekranı bu turda
> yok (ayrı iş).
>
> Bu belge **plan**dır, karar üretmez (`YOL_HARITASI.md` §7.1-A). Dayandığı kararlar A-3 (sevkiyat, kısmi
> sevk, kalan), A-8 (onay bloğu; negatif stok yumuşak kısıt), D-3 (firma, takip no, gönderi günü, takip
> linki), C-1 (irsaliye no salt kayıt), D-2 (OPERASYON sevk eder), E-1 (gün sınırı İstanbul günü). Yeni
> karar ya da ADR açılmaz.

## 1. Amaç

`/shipping` operasyonun kargo masası olsun: kaç sipariş kargo bekliyor, kaçı onayda takılı, bugün kaç
sevkiyat çıktı, kaç sipariş teslim bekliyor. Hazırlanan siparişler yoğun bir tabloda görünsün; operatör
takip numaralarını satır satır yazıp seçtiklerini tek düğmeyle kargolasın. Kısmi gönderim bugünkü kart
formuyla yan panelde yapılsın. Yapılmış sevkiyatlar süzülebilir, sayfalı bir listede bulunsun.

**Başarı ölçütü:** operatör beş siparişi seçer, her birine takip numarası yazar, ortak firmayı seçip
"Seçilenleri kargola"ya basar; sonuç listesinde dördü "SVK-… yazıldı", negatif stoktaki biri "onay
gerekli — Kısmi sevk panelinden gerekçeyle gönderin" der; dört sipariş tablodan düşer, biri kalır.

## 2. Kapsam

### Kapsamda

| # | Kalem | Dayanak |
|---|---|---|
| 1 | KPI: Kargo bekleyen · Onay bekleyen · Bugün kargolanan · Teslim bekleyen | ADR-010 `KpiCard` |
| 2 | Kargo bekleyenler tablosu: seçim, sipariş, cari, kalan, tutar, satır başına takip ve irsaliye; ortak firma ve "Seçilenleri kargola"; sipariş başına sonuç listesi | 12-A · A-3 · A-8 |
| 3 | Kısmi sevk yan paneli (`?kismi=<siparisId>`): bugünkü kart formu (kalem başına miktar, firma, takip, irsaliye) | 12-A · A-3 |
| 4 | Sevkiyat listesi: tarih kısayolları, Filtrele (tarih, firma, durum, metin), sütun seçici, sayfalama, boş durum | ortak bileşenler · D-3 |
| 5 | Eylem çekirdeği `siparisiSevkEt` (lib): kart formu ve toplu kargo aynı yoldan; kalan `kalemMiktarlari`'ndan | #70 kalıbı · Ü-23 §4 |
| 6 | Türkçe metin varyantları ortak modüle (`liste/metin.ts`) taşınır; Siparişler ve Kargo aynı yardımcıyı kullanır | Ü-23 gözden geçirme |

### Kapsam dışı

- Kargo firması tanım ekranı (13-A), kargo API entegrasyonu (`cargoStatus`, Faz 3).
- Teslim edildi işaretleme — sipariş detayında kalır.
- Toplu kargoda gerekçe girme: negatif stokta onay gereken sipariş toplu işlemde yazılmaz; kısmi panelden
  gerekçeyle gönderilir (gerekçe sipariş başına bir karardır, A-8).
- Sevkiyat için ayrı yan panel — sipariş bağlantısı Siparişler ekranının panelini açar (`/orders?detay=`).

## 3. Ekran

### 3.1 Görünürlük (D-2)

`requireStaff`. YONETICI ve OPERASYON aynı ekranı görür ve sevk eder; negatif stokta gerekçenin sonucu
role göre değişir (A-8: yönetici sevk eder, operasyon onaya gönderir) — `sevkiyatYaz` bugünkü davranışı.

### 3.2 KPI kartları

`karsilastirma: { anlik: … }`, trend yok, `bosDavranisi: "sifir"`; süzgeçten bağımsız.

| Kart | Tanım | Tıklayınca |
|---|---|---|
| Kargo bekleyen (birincil) | `stage ONAYLI`, `status HAZIRLANIYOR` sipariş sayısı; ikincil metrik "N adet kalan" (kalemlerin `kalan` toplamı) | bağlantı değil (tablo hemen altında) |
| Onay bekleyen | kargo bekleyenlerden `belgeOnayDurumlari("SIP")` BEKLIYOR ya da RED olanlar; > 0 ise uyarı tonu | YONETICI: `/approvals` (onay ekranı yalnız yöneticinin, `requireAdmin`); OPERASYON: bağlantı değil |
| Bugün kargolanan | `shippedAt` bugünün İstanbul gününde olan sevkiyat sayısı | sevkiyat listesi `?baslangic=<bugün>&bitis=<bugün>` (kart = satır) |
| Teslim bekleyen | `stage ONAYLI`, `status KARGOLANDI` sipariş sayısı | `/orders?durum=KARGOLANDI` (kart = satır) |

### 3.3 Kargo bekleyenler (toplu kargo, 12-A)

Tablo tek bir POST formudur (`TopluKargoFormu`, server action). Satırlar `orderDate asc, id asc`
(en eski önce); sayfalama yok (kargo bekleyen iş kuyruğudur).

| Sütun | İçerik |
|---|---|
| Seç | kutucuk `secili=<siparisId>`; onay bloğu BEKLIYOR/RED olan siparişte devre dışı (A-8) |
| Tarih | `formatDate(orderDate)` |
| Sipariş | belge no (`/orders?detay=<id>`) |
| Cari | ad + klinik (küçük) + `OnayEtiketi` |
| Kalan | "N kalem · M adet" (kalemlerin `kalan`'ı > 0 olanlar); kısmi sevk yapılmışsa "M / toplam adet" |
| Tutar | `siparisToplami` (KDV dahil, `oncelik-dusuk`) |
| Takip no | `takip_<siparisId>` metin |
| İrsaliye no | `irsaliye_<siparisId>` metin, en çok 32 karakter (C-1) |
| İşlem | "Kısmi sevk" → `?kismi=<id>` (yan panel) |

Tablonun altında: **Kargo firması** (ortak; aktif firmalar, "Seçiniz…" boş) · **Tümünü seç** (istemci; JS
yoksa kutucuklar tek tek) · **Seçilenleri kargola**.

**İşlem (`topluKargola`):** seçili her sipariş için sırayla, **ayrı transaction**'da `siparisiSevkEt`:
kalemler = kalanı > 0 olan her kalem, miktar = kalan (`kalemMiktarlari`; kilit altında `sevkiyatYaz`
yeniden doğrular), firma ortak, takip ve irsaliye o satırın, `gerekce: null`. Bir siparişin sonucu
öbürlerini etkilemez. Sonuç sipariş başına listelenir (formun üstünde, belge no ve cari adıyla):

| Sonuç | Metin |
|---|---|
| `SEVK_EDILDI` | "SVK-… yazıldı" (+ "sipariş kargolandı" tamamlandıysa) |
| `ONAY_GEREKLI` (negatif stok, gerekçe yok) | "Onay gerekli: <bildirim> — Kısmi sevk panelinden gerekçeyle gönderin." |
| `SERT` (`ONAY_BEKLIYOR`, `ONAY_REDDEDILDI`, `SIPARIS_DURUMU_UYGUN_DEGIL`, `SEVK_MIKTARI_ASILDI`, …) | sözlük metni (`bildirimMetni`) |

Seçim yoksa "Kargolanacak sipariş seçin." (SERT, form kutusunda). Seçim en çok 100 sipariş. Başarılı
olanlar tablodan düşer (sayfa yeniden doğrulanır); sonuç listesi ekranda kalır.

### 3.4 Kısmi sevk paneli

`?kismi=<siparisId>` yalnız kargo bekleyen siparişte açılır (başkası yok sayılır). `YanPanel` içinde
bugünkü kart formu: başlıkta cari, klinik · satıcı · tarih, onay çipi, tutar; kalem başına miktar (varsayılan
kalan, `kalan k/t` etiketi), firma, takip no, irsaliye no, **Kargola**. Kartın `data-sevk-karti` işareti
korunur. Eylem `shipOrder` → `siparisiSevkEt`; gerekçe diyaloğu bugünkü gibi (`IslemFormu`). Başarıda:
sipariş hâlâ kargo bekliyorsa `?kismi=<id>` (panel güncel kalanla açık kalır), tamamlandıysa `/shipping`.

### 3.5 Sevkiyat listesi

Bugünkü "Kargolanan Siparişler" (son 30 sipariş) yerine **sevkiyat** satırları (bir siparişin birden çok
sevkiyatı ayrı satırdır).

| Parametre | Değerler | Anlamı |
|---|---|---|
| `baslangic`, `bitis` | `YYYY-AA-GG` | `shippedAt` İstanbul günü, iki uç dahil; ters verilirse yer değiştirir |
| `firma` | firma kimliği · `yok` | `carrierId`; `yok` = firmasız |
| `durum` | `KARGOLANDI` · `TESLIM_EDILDI` | `Shipment.status` |
| `q` | metin (≤ 100) | SVK no, takip no, irsaliye no, cari adı (Türkçe varyantlı) |
| `page`, `per` | | ortak |
| `kismi` | sipariş kimliği | panel (süzgeç değil) |

Hızlı sekmeler (tarih): Tümü · Bugün · Son 7 gün · Bu ay. Filtrele paneli: tarih, firma (aktif + pasif
"· pasif", en sonda "Firmasız"), durum, ara; `per` gizli alanla korunur. Etkin etiketler × ile kalkar. Bilinmeyen
firma kimliği adresten düşer.

| Sütun | İçerik | Gizlenebilir |
|---|---|---|
| Gönderi | `formatDateTime(shippedAt)` | hayır |
| Belge no | `SVK-…` | hayır |
| Cari | `order.doctor.fullName` | hayır |
| Sipariş | `SIP-…` → `/orders?detay=<orderId>` | evet |
| Firma | `carrier.name` ya da "—" | evet |
| Takip no | `takipLinki` varsa bağlantı, yoksa düz | evet |
| İrsaliye | `externalDispatchNo` ya da "—" | evet |
| Adet | sevkiyat kalemlerinin toplamı | evet |
| Durum | `StatusBadge(Shipment.status)` | hayır |

Sıralama `shippedAt desc, id desc`. Çerez `kargo-sutunlar`, `path=/shipping`. Sayfa dışı adres son sayfaya.
`shippedAt` boş eski kayıt yoktur (`sevkiyatYaz` her zaman yazar); boşsa "—" ve tarih süzgecine girmez.

## 4. Veri katmanı

- **`src/lib/liste/metin.ts`** (saf, yeni): `metinVaryantlari(q)` — `siparis-listesi/suzgec.ts`'ten taşınır
  (Siparişler import'u güncellenir; davranış aynı).
- **`src/lib/sevk-et.ts`** (yeni): `siparisiSevkEt(girdi: SevkiyatGirdisi): Promise<SevkSonucu>` — kendi
  transaction'ı: `sevkiyatYaz` + başarıda denetim kaydı (bugün `shipOrder`'daki blok taşınır), `IsHatasi`'nı
  sonuca çevirir. `SevkSonucu = { durum: "SEVK_EDILDI"; documentNo; tamamlandi } | { durum:
  "ONAYA_GONDERILDI"; bildirimler } | { durum: "HATA"; sonuc: IslemSonucu }`. `shipOrder` ve
  `topluKargola` bunu çağırır; `revalidatePath`/`redirect` eylemlerde kalır.
- **`src/lib/kargo-listesi/suzgec.ts`** (saf): `KargoSuzgeci = { baslangic, bitis, firma, durum, q }`,
  `suzgecCoz(p) → { suzgec, kismi }`, `kargoAdresi(s, { page, per, kismi })`, `hizliSekmeler(bugun)`,
  `etkinSekme`, `sekmeAdresi`, `etkinSuzgecler(s, firmaAdi)`, `bosDurum`, `topluSecimCoz(formData) →
  { siparisId, takip, irsaliye }[]` (en çok 100, tekrar yok, kimlik biçimi), `TOPLU_SINIR = 100`.
- **`src/lib/kargo-listesi/sutunlar.ts`** (saf): `SUTUNLAR`, `SUTUN_CEREZI = "kargo-sutunlar"`, `SUTUN_YOLU = "/shipping"`.
- **`src/lib/kargo-listesi/sorgu.ts`:** `kargoBekleyenler()` (satır: kimlik, belge no, tarih, cari, satıcı,
  toplam, kalemler `{ id, urun, kod, adet, kalan }`, `kalanKalem`, `kalanAdet`, `adet`, onay), `kargoKpileri(bugun)`,
  `sevkiyatKosulu(s)`, `sevkiyatListesi(s, sayfa)`, `firmaSecenekleri()` (bütün firmalar, pasif işaretli),
  `kismiSiparis(id)` (kargo bekleyen değilse `null`).

## 5. Hata davranışı

Geçersiz süzgeç değeri yok sayılır; bilinmeyen firma kimliği adresten düşer. `kismi` kargo bekleyen
olmayan siparişi göstermez. Toplu işlemde: seçimsiz gönderim SERT; 100'den fazla seçim SERT ("En çok 100
sipariş"); bir siparişin hatası (transaction geri alınır) öbürlerini durdurmaz. Sayfa dışı `page` son sayfaya.
KPI sorgusu hata verirse yalnız kartlar düşer (`kpiGetir`).

## 6. Testler

**Kabul kriterleri (testten önce):**

- **A-3-3:** Toplu kargo seçilen her siparişin kalan adetlerinin tamamını **ayrı işlemle** sevk eder: kargo
  firması ortak, takip ve irsaliye numarası sipariş başına. Onay bloğu açık ya da reddedilmiş, durumu uygun
  olmayan ya da negatif stokta gerekçe isteyen sipariş yazılmaz ve sonuç listesinde nedeniyle görünür; bir
  siparişin başarısızlığı öbürlerinin sevkiyatını geri almaz. Kart formu ve toplu kargo aynı çekirdekten
  (`siparisiSevkEt`) yazar ve aynı denetim kaydını bırakır.
- **D-3-2:** Kargo ekranının sevkiyat listesi gönderi anını (`shippedAt`) İstanbul günüyle süzer; "Bugün
  kargolanan" kartı bugünün süzgecinin satır sayısına, "Teslim bekleyen" kartı Siparişler ekranının
  `durum=KARGOLANDI` satır sayısına eşittir. Takip numarası firmanın şablonu varsa bağlantıdır.

| Katman | Dosya | Neyi doğrular |
|---|---|---|
| Birim | `liste/metin.test.ts` | taşınan varyant testleri |
| Birim | `kargo-listesi/suzgec.test.ts` | çözme/adres gidiş-dönüş; ters gün; firma `yok`; tarih sekmeleri; etiketler; `topluSecimCoz` (boş, tekrar, bozuk kimlik, 100 sınırı, satır takip/irsaliye kırpma, irsaliye 32) |
| Entegrasyon | `sevk-et.itest.ts` | çekirdek: başarı + denetim kaydı; IsHatasi → HATA sonucu (yazım yok); negatif stok yönetici gerekçesiz → ONAY_GEREKLI |
| Entegrasyon | `kargo-listesi/sorgu.itest.ts` | A-3-3: üç sipariş (biri onay bloklu) toplu → ikisi yazıldı, biri SERT, bloklu sipariş kargo bekliyor; kalan = `kalemMiktarlari`; D-3-2: bugün kartı = süzgeç (İstanbul gece yarısı kenarı), teslim bekleyen = siparişler süzgeci; firma/durum/metin süzgeci; `kismiSiparis` kargo bekleyen değilse `null` |
| E2E | `e2e/admin/kargo.spec.ts` | toplu: iki siparişe takip yaz, seç, firma, kargola → sonuç listesi, satırlar düşer, sevkiyat listesinde takip numaraları; seçimsiz → hata; Bugün kargolanan kartı = satır; sütun gizle → yenile; sayfa dışı adres; KPI iskeleti eşleşir |
| E2E | mevcut, güncellenir | `sevkiyat`, `kabul-senaryosu`, `onay`, `iade`, `operasyon`: kart artık "Kısmi sevk" paneli — ortak yardımcı `sevkKarti(page, metin)` |

## 7. Belgeler

YOL_HARITASI Ü-24 · KABUL_KRITERLERI (A-3-3, D-3-2) · TRACEABILITY · PROJE_DURUMU arayüz bölümü ·
DEVAM_PROMPTU. KARARLAR değişmez.

## 8. Teslim

Tek PR `revize/kargo-ekrani`: spec · plan · Ü-24 · kriterler · `liste/metin.ts` · `sevk-et.ts` ·
`kargo-listesi/` · ekran (KPI, toplu tablo, kısmi panel, sevkiyat listesi, iskelet) · testler · belgeler.

## 9. Önerilen seçimler

| # | Soru | Seçilen | Diğer |
|---|---|---|---|
| 1 | Kart formu nerede? | Yan panel (`?kismi=`), tablo satırından "Kısmi sevk" | Kartlar tablonun altında da listelenir (her sipariş iki kez görünür) |
| 2 | Toplu kargoda negatif stok | yazılmaz, "onay gerekli — panelden gerekçeyle" | toplu gerekçe alanı (bir gerekçe bütün siparişlere — A-8 sipariş başına karardır) |
| 3 | Onay bloklu siparişin kutucuğu | devre dışı + çip; sunucu yine reddeder | seçilebilir, sonuçta hata |
| 4 | Alt liste | sevkiyat satırları, süzgeçli ve sayfalı | bugünkü "son 30 sipariş" |
| 5 | Sevkiyat paneli | yok; sipariş bağlantısı Siparişler panelini açar | ayrı sevkiyat paneli |
| 6 | Kısmi sevk sonrası | panel güncel kalanla açık kalır; tamamlandıysa kapanır | her zaman `/shipping` (bugünkü) |
| 7 | KPI tıklama | Onay bekleyen → `/approvals` (yalnız yönetici), Bugün kargolanan → liste süzgeci, Teslim bekleyen → Siparişler `durum=KARGOLANDI` | hepsi bağlantısız |
| 8 | Toplu sınır | 100 sipariş | sınırsız (uzun istek; tek eylem süresi) |
| 9 | Türkçe varyantlar | ortak `liste/metin.ts` | modül başına kopya |
