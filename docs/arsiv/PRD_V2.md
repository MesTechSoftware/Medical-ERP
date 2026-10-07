> ⛔ ARŞİV (KARARLAR X-7 §(1)) — C10, Faz 1A. Atıf yapılmaz. Yerine: `KARARLAR.md` (ne/neden) ·
> `KABUL_KRITERLERI.md` (nasıl doğrulanır). Tarama sonucu: `FAZ1_UYGULAMA_KAPSAMI.md` §E.

# PRD — Medikal Satış Operasyon Yönetim Sistemi **v2.2**

**Sürüm:** 2.2 (10 açık soru kapandı + bayi paneli kararı) · **Tarih:** 23 Temmuz 2026
**Önceki:** v2.0 taslak (17 açık soru) → v2.1 (15 karar alındı, 10 yeni soru doğdu) → **v2.2 (10 soru kapandı + D-05 revize)**
**Durum:** Tüm fazlar geliştirmeye hazır. §11 hukuk teyidi yalnız Faz E için ön koşul.

---

## 1. Bu Sürümün Özeti

v1.0 MVP tek kanallıydı ve satıcı şirkete borçluydu. v2 ile sistem:

1. **İki satış kanalına** ayrılıyor — *Satıcı kanalı* (prim usulü) ve *Bayi kanalı* (cari usulü).
2. **Satıcı borçlu olmaktan çıkıyor**, prim alacaklısı + **tahsilat sorumlusu** oluyor.
3. **Doktor gerçek bir varlık oluyor**: satıcıya kilitleniyor, kendi cari hesabı ve kongre bakiyesi oluyor.
4. **Fiyat serbestleşiyor** — satıcı taban fiyatın üstünde serbest, bayi kendi fiyat listesinden alıyor.
5. **KDV (%20) sisteme giriyor** — tüm parasal alanlar net/brüt ayrımı kazanıyor.
6. **Kongre hak ediş sistemi** ekleniyor — tahsil edilen ciro, doktora kongre bakiyesi kazandırıyor.
7. **Bayi self-servis panel kazanıyor** — bayi kendi carisini/fiyat listesini görür ve sevkiyat talebi açar; admin onaylar (D-05 revize).

> ⚠️ **Bu bir ek modül işi değil, çekirdek veri modeli değişikliğidir.** `Order`, `Payment`, `Product`
> ve cari hesap mantığı yeniden yazılıyor. §8'deki teknik ön koşullar okunmadan tahminleme yapılmamalı.

---

## 2. Karar Kaydı (Müşteri — 22 Temmuz 2026)

| # | Konu | Karar | Etkilediği yer |
|---|---|---|---|
| **D-01** | Doktor parayı kime öder? | **Şirkete.** Satıcı nakit tahsil etmez ama **tahsilat takibinden sorumludur.** | Satıcı cari kalkıyor, **doktor cari modülü zorunlu** |
| **D-02** | Vade | **Vade yapılabilir ve esneyebilir.** Vade tarihi sonradan değiştirilebilir. | Yeni: vade + vade değişiklik geçmişi |
| **D-03** | KDV | **%20.** Tutarlar hem **KDV dahil** hem **hariç** girilebilmeli/gösterilebilmeli. | Tüm parasal alanlar |
| **D-04** | Doktor kimliği | Ad-soyad + **klinik** + **telefon** + **bölge** yeterli. | FR-09 |
| **D-05** | Bayi paneli | **Var (revize — 23 Temmuz 2026).** Bayi giriş yapar; kendi cari/sevkiyat/ödeme/fiyat listesini görür + **sevkiyat talebi** açar (admin onaylar). Doğrudan sipariş veremez. | `DEALER` rolü + `(dealer)` panel eklendi; **Faz D genişledi** |
| **D-06** | Bayinin doktor satışları | **İzlenmeyecek**, bizden bağımsız. | Bayi kanalı kongreye **hiç dokunmuyor** |
| **D-07** | Taban fiyat | **Ürün bazlı**, şirket belirler. Satıcı bazlı istisna **yok**, onay akışı **yok**. | v2.0'daki FR-16/FR-17 **kapsam dışı** |
| **D-08** | Bayi fiyatı | **Sabit tutar** (iskonto oranı değil). | FR-28 |
| **D-09** | Kongre kazanımı ne zaman? | **Ücret tahsil edildikten sonra.** | Tahsilat merkezî tetikleyici oldu |
| **D-10** | Bakiye geçerliliği | **1 yıl** sonra sıfırlanır. | FIFO + expiry mekaniği gerekli |
| **D-11** | Kazanım katsayısı | **%100** (1 ₺ tahsilat = 1 ₺ kongre bakiyesi). | FR-38 |
| **D-12** | Bakiye yetersizse | Sistem üzerinden **fark ödenemez.** Doktor ayrıca iletişime geçer (sistem dışı). | FR-41: sert red + bilgilendirme |
| **D-13** | Kongre iptali | Bakiye **iade edilir.** | FR-44 |
| **D-14** | Kongre → prim etkisi | **Yok.** Kongre maliyeti tamamen şirket gideri. | Prim hesabı sadeleşti |
| **D-15** | Kongre paketi değeri | **Kongreden kongreye değişken** (paket bazında tanımlanır). | Model zaten destekliyor |

### 2.1 v2.1 Açık Sorularının Kapanışı (Müşteri — 23 Temmuz 2026)

| # | Konu | Karar | Etkilediği yer |
|---|---|---|---|
| **D-16** | Prim matrahı (OQ-01) | **Tahsil edilen tutar** (sipariş tutarı değil). | FR-33 |
| **D-17** | Prim & kongre matrahı KDV (OQ-02) | **KDV hariç (net).** Muhasebe/mali müşavir teyidi hâlâ önerilir. | FR-33, FR-49 |
| **D-18** | Mahsuplaşma (OQ-03) | **FIFO** (vadesi en eski siparişten başlar) + admin manuel düzeltme imkânı. | FR-24 |
| **D-19** | Kısmi ödemede orantılı kazanım (OQ-04) | **Evet, orantılı.** Ayrıca netleştirme: **prim ile kongrenin birbiriyle alakası yoktur** — prim **satıcının** hak edişidir, kongre bakiyesi **doktorun** hak edişidir; ikisi ayrı taraflar üzerinde ayrı ayrı hesaplanır. **Bayi hiçbirine dahil değildir** (D-06, D-14 ile tutarlı). | FR-25, RULE-15 |
| **D-20** | Vade parametreleri (OQ-05) | **Vade var.** Varsayılan gün sayısı admin parametresi; uzatma yetkisi admin'de, satıcı talep açar. **Vade üst sınırı vardır ve admin belirler** (sınırsız uzatma değil). | FR-21, FR-22 |
| **D-21** | Vadesi geçmiş doktoya yeni sipariş (OQ-06) | Faz 1'de **uyarı**, blok yok. Kredi limiti Faz 2. | FR-28 |
| **D-22** | Bakiye geçerliliği tanımı (OQ-07) | **Rolling 12 ay** (kazanımdan itibaren), takvim yılı sonu sıfırlaması değil. | FR-50 |
| **D-23** | Tahsilat iptalinde geri alma (OQ-08) | **Ters kayıt.** Kongre bakiyesi zaten harcanmışsa bakiye **negatife düşer** ve admin'e uyarı çıkar; yeni kazanımla kapanır. | FR-29, FR-56 |
| **D-24** | Fatura & kargo entegrasyonu (OQ-09) | Faz 1'de sadece **fatura numarası alanı**. **e-Fatura entegrasyonu ve kargo/taşıyıcı entegrasyonu sonradan eklenecek** — kapsam dışı. | FR-42 |
| **D-25** | Tahsilat performansının prime etkisi (OQ-10) | Faz 1'de **hayır**, prim etkilenmez; yalnızca **raporlanır** (aging/OQ'ların cevapları raporda gösterilir). | FR-27, FR-62 |

> **En büyük iki sonuç:** (1) **Doktor cari + vade takibi yepyeni bir modül** ve v2'nin en büyük tek
> kalemi haline geldi. (2) **Tahsilat kaydı artık sistemin merkezî olayı** — tek bir ödeme, doktor
> bakiyesini, satıcı prim matrahını ve kongre bakiyesini aynı anda etkiliyor.

---

## 3. Aktörler

| Aktör | Tanım | Sistemdeki karşılığı |
|---|---|---|
| **Ana Admin** | Ana firma + merkezi depo. Tüm parametreleri belirler. | `User.role = ADMIN` |
| **Satıcı** | Maaşlı personel. %5 prim alır. Kendi doktor portföyünü ve **tahsilatını** yönetir. | `User.role = SELLER` |
| **Doktor** | Nihai müşteri. Tek satıcıya bağlı. Şirkete borçlanır, kongre bakiyesi biriktirir. | **YENİ** `Doctor` |
| **Bayi** | Bağımsız ticari taraf. **Kendi paneline erişir** (görüntüleme + sevkiyat talebi). | **YENİ** `Dealer` + `User.role = DEALER` |
| **Kongre** | Doktorların bakiyesiyle katılım hakkı kazandığı etkinlik. | **YENİ** `Congress` + `CongressPackage` |

---

## 4. İş Modeli — İki Kanal

### Kanal A — Satıcı Kanalı (prim + cari)

```
Depo ──► Satıcı ──satış──► Doktor ──ödeme (vadeli)──► ŞİRKET
             │                                          │
             │                                    tahsilat kaydı
             │                                          │
             │                          ┌───────────────┼───────────────┐
             │                          ▼               ▼               ▼
             └──── %5 prim ◄──── prim matrahı    doktor bakiyesi   kongre bakiyesi
                   (ay sonu)         artar          azalır            +%100
```

- Satış fiyatını satıcı belirler, **taban fiyatın altına inemez** (ürün bazlı, D-07).
- Doktor **şirkete** öder; satıcı tahsilat takibinden sorumludur (D-01).
- Tahsilat gerçekleşince: prim matrahı işlenir + doktorun kongre bakiyesi artar (D-09).

### Kanal B — Bayi Kanalı (cari)

```
Bayi ──talep──► ADMİN onay ──sevkiyat──► Bayi ──ödeme──► ŞİRKET
```

- Bayiye ürün bazında **sabit fiyat** tanımlanır (D-08).
- Bayi sevkiyatı **kendi panelinden talep** olarak başlatır; **admin onayında** stok düşer ve tutar bayi borcuna yazılır (D-05 revize).
- Sevk bedeli bayinin borcuna yazılır; ödedikçe düşer.
- **Bayi kanalı prim ve kongre sistemine hiç dokunmaz** (D-06, D-14, D-19). Kritik yola değmez, büyük ölçüde bağımsız geliştirilebilir.

---

## 5. Fonksiyonel Gereksinimler

### 5.1 Doktor Yönetimi ve Satıcı–Doktor Eşleşmesi

| ID | Gereksinim | Öncelik |
|---|---|---|
| **FR-01** | Doktor kaydı: ad-soyad, unvan, branş, **klinik/kurum**, **bölge**, şehir, **telefon**, e-posta, durum. | Zorunlu |
| **FR-02** | Her doktorun **en fazla bir sorumlu satıcısı** vardır. | Zorunlu |
| **FR-03** | Satıcı yeni doktor kaydı açar; sahiplik otomatik kendisine atanır. | Zorunlu |
| **FR-04** | Satıcı, sahibi olmadığı doktora sipariş **oluşturamaz** — sunucu tarafında zorlanır. | Zorunlu |
| **FR-05** | Satıcı yalnızca kendi doktorlarını görür. Admin tümünü görür. | Zorunlu |
| **FR-06** | Admin doktoru başka satıcıya **devredebilir**; devir kaydı tutulur (kim/ne zaman/gerekçe). | Zorunlu |
| **FR-07** | Devir sonrası geçmiş siparişler, primler ve tahsilat sorumluluğu **eski satıcıda kalır**. | Zorunlu |
| **FR-08** | Satıcı pasifleştirilirse doktorları sahipsiz havuza düşer; yeniden atanana kadar sipariş girilemez. | Zorunlu |
| **FR-09** | Mükerrer kayıt engeli: **normalize telefon numarası benzersizdir** (`+90XXXXXXXXXX`). Ayrıca ad-soyad + klinik benzerliğinde uyarı gösterilir (yumuşak kontrol). | Zorunlu |
| **FR-10** | Doktor detayı: cari bakiye, vadesi gelen/geçen borç, sipariş geçmişi, tahsilat geçmişi, kongre bakiyesi ve hareket defteri. | Zorunlu |

> 🔴 **FR-09 kritik.** Telefon benzersizliği zorlanmazsa iki satıcı aynı doktoru farklı yazımlarla kaydeder;
> hem tekil sahiplik kuralı (RULE-02) sessizce delinir hem de kongre bakiyesi ikiye bölünür.

### 5.2 Fiyatlandırma, Taban Fiyat ve KDV

| ID | Gereksinim | Öncelik |
|---|---|---|
| **FR-11** | Her ürün için: **liste fiyatı** (önerilen) ve **taban fiyat** (`minPrice`). İkisi de ürün bazlı, admin belirler (D-07). | Zorunlu |
| **FR-12** | Satıcı sipariş kaleminde birim fiyatı değiştirebilir; `minPrice` altındaysa **reddedilir** (sunucu tarafı). | Zorunlu |
| **FR-13** | Fiyat sipariş anında **snapshot** alınır; sonraki değişiklikler geçmiş kayıtları etkilemez. | Zorunlu |
| **FR-14** | Kalem bazında liste fiyatına göre **iskonto oranı** hesaplanıp saklanır. | Yüksek |
| **FR-15** | Taban ve liste fiyat değişiklikleri audit log'a yazılır. | Zorunlu |
| **FR-16** | **KDV oranı %20** sistem parametresidir; ürün bazında override edilebilir (farklı oranlı ürün ihtimaline karşı). | Zorunlu |
| **FR-17** | **Kanonik saklama net (KDV hariç) tutardır.** KDV ve brüt tutar hesaplanır, snapshot olarak kalemde saklanır (`netUnitPrice`, `vatRate`, `vatAmount`, `grossLineTotal`). | Zorunlu |
| **FR-18** | Fiyat girişinde ve tüm listelerde **"KDV Dahil / KDV Hariç" seçeneği** bulunur (D-03). Kullanıcının seçimi tercih olarak hatırlanır. | Zorunlu |
| **FR-19** | Taban fiyat da **net (KDV hariç)** tanımlanır; karşılaştırma net üzerinden yapılır. | Zorunlu |

> ⚠️ **Yuvarlama kuralı belirlenmeli.** KDV dahil giriş → net'e çevirirken (`brüt / 1,20`) kuruş
> yuvarlaması oluşur. Kural: **kalem bazında yuvarla, sipariş toplamında değil.** Aksi halde
> "kalemler toplamı ≠ sipariş toplamı" farkı çıkar. Bu kural birim testle korunmalı.

### 5.3 Doktor Cari Hesabı, Vade ve Tahsilat **(YENİ MODÜL)**

| ID | Gereksinim | Öncelik |
|---|---|---|
| **FR-20** | **Doktor cari:** `Bakiye = Toplam Sipariş (iptal hariç, brüt) − Toplam Tahsilat`. Ayrı kolonda tutulmaz, hesaplanır. | Zorunlu |
| **FR-21** | Her siparişe **vade tarihi** girilir. Varsayılan vade gün sayısı ve üst sınırı sistem parametresidir, admin belirler (**D-20**). | Zorunlu |
| **FR-22** | Vade tarihi sonradan **değiştirilebilir** (D-02). Her değişiklik geçmişe kaydedilir: eski tarih, yeni tarih, kim, ne zaman, gerekçe. Audit log'a yazılır. | Zorunlu |
| **FR-23** | **Tahsilat kaydı:** doktor, tutar, tarih, yöntem (Nakit/Havale-EFT/Kredi Kartı/Çek/Diğer), dekont/referans no, açıklama. | Zorunlu |
| **FR-24** | **Ödeme mahsuplaşması:** tahsilat, **vadesi en eski siparişten başlayarak otomatik (FIFO)** mahsup edilir + admin manuel düzeltebilir (**D-18**). | Zorunlu |
| **FR-25** | **Kısmi tahsilat** desteklenir. Kısmi ödemede prim matrahı ve kongre kazanımı **orantılı** işlenir (**D-19**). | Zorunlu |
| **FR-26** | **Yaşlandırma (aging) raporu:** vadesi gelmemiş / 1-30 / 31-60 / 61-90 / 90+ gün gecikmiş alacaklar; doktor ve satıcı kırılımında. | Zorunlu |
| **FR-27** | Satıcı panelinde: **kendi doktorlarının** vadesi yaklaşan ve geçen alacakları, toplam açık bakiye. | Zorunlu |
| **FR-28** | Vadesi geçmiş borcu olan doktora yeni sipariş açılırken uyarı gösterilir; blok yok, kredi limiti Faz 2 (**D-21**). | Yüksek |
| **FR-29** | Tahsilat iptali/iadesi mümkündür; ters kayıtla prim matrahı ve kongre bakiyesi **geri alınır**; kongre bakiyesi harcanmışsa negatife düşer + admin uyarısı (**D-23**). | Zorunlu |

> 🔴 **Bu modülün transaction bütünlüğü kritiktir.** Bir tahsilat kaydı **tek transaction içinde**
> şunları yapmalı: (a) mahsuplaşma, (b) doktor bakiyesi güncelleme, (c) satıcı prim matrahına ekleme,
> (d) kongre `EARN` hareketi yazma. Herhangi biri başarısız olursa tamamı geri alınmalıdır.

### 5.4 Satıcı Primi (Komisyon)

| ID | Gereksinim | Öncelik |
|---|---|---|
| **FR-30** | Varsayılan prim oranı **%5**, sistem parametresi; admin değiştirebilir. | Zorunlu |
| **FR-31** | Satıcı bazında prim oranı override edilebilir. | Yüksek |
| **FR-32** | Prim dönemi **takvim ayıdır.** | Zorunlu |
| **FR-33** | Prim matrahı: dönem içinde **tahsil edilen** tutar (**D-16**), **KDV hariç** (**D-17**). | Zorunlu |
| **FR-34** | Ay sonunda admin **"dönemi kapat"** işlemi yapar; matrah, oran ve prim tutarı **dondurulur**. | Zorunlu |
| **FR-35** | Kapanmış döneme ait tahsilat iptal edilirse, düzeltme **sonraki döneme negatif kayıt** olarak yansır. Geçmiş dönem asla değişmez. | Zorunlu |
| **FR-36** | Prim durumları: `HESAPLANDI → ONAYLANDI → ÖDENDİ`. | Zorunlu |
| **FR-37** | Satıcı panelinde: ay içi **anlık tahsilat, tahmini prim**, geçmiş dönem dökümü. Ayrıca "sipariş açıldı ama henüz tahsil edilmedi" tutarı ayrı gösterilir (motivasyon + tahsilat baskısı). | Zorunlu |
| **FR-38** | Kongre harcamaları prim matrahını **etkilemez** (D-14). | Zorunlu |

### 5.5 Bayi Yönetimi

| ID | Gereksinim | Öncelik |
|---|---|---|
| **FR-39** | Bayi kaydı: kod (benzersiz), ünvan, vergi dairesi/no, yetkili, iletişim, adres, durum. Bayiye opsiyonel bir **DEALER kullanıcı hesabı** (login) bağlanır — 1 bayi ↔ 1 hesap (D-05 revize). | Zorunlu |
| **FR-40** | **Bayiye özel fiyat listesi:** her bayi × ürün için **sabit net tutar** (D-08). Fiyatı tanımlanmamış ürün o bayiye sevk edilemez. | Zorunlu |
| **FR-41** | Fiyat değişikliği geriye dönük etki etmez; açık sevkiyatlar snapshot fiyatını korur. | Zorunlu |
| **FR-42** | **Sevkiyat:** admin bayi + ürün + adet girer (veya bayi talebini onaylar); sistem fiyatı listeden çeker, KDV'yi ekler, stoktan `OUT` düşer, tutarı bayi borcuna yazar — **tek transaction**. | Zorunlu |
| **FR-43** | Stok yetersizse sevkiyat tamamen iptal/reddedilir. | Zorunlu |
| **FR-44** | Sevkiyat iptali stoğu `IN` ile geri yükler ve borcu geri alır. | Zorunlu |
| **FR-45** | **Bayi cari:** `Bakiye = Toplam Sevkiyat (iptal hariç) − Toplam Ödeme`. | Zorunlu |
| **FR-46** | Bayi ödemesi kaydedilebilir; bayi için de vade takibi ve yaşlandırma uygulanır. | Yüksek |
| **FR-46a** | **Bayi paneli girişi:** `DEALER` rolüyle giriş yapılır; erişim **yalnızca kendi verisiyle** sınırlıdır (sunucu tarafında `session.user.id` → `Dealer` eşlemesiyle zorlanır). | Zorunlu |
| **FR-46b** | **Bayi dashboard (read-only):** kendi cari bakiyesi, vadesi yaklaşan/geçen borcu, sevkiyat geçmişi, ödeme geçmişi, yaşlandırma. | Zorunlu |
| **FR-46c** | Bayi **kendi fiyat listesini** (ürün × net fiyat) görür; başka bayinin fiyat listesini göremez. | Zorunlu |
| **FR-46d** | **Sevkiyat talebi:** bayi ürün + adet girerek talep açar → durum `TALEP`; bu aşamada **stok/cari değişmez**. Admin onayında FR-42 transaction'ı çalışır; stok yetersizse **reddedilir** (FR-43). | Zorunlu |
| **FR-46e** | Bayi, onaylanmamış talebini **geri çekebilir**; admin talebi **gerekçeli reddedebilir** (`REDDEDILDI`). | Zorunlu |
| **FR-46f** | Bayi **doğrudan sipariş veremez, stok göremez, fiyat değiştiremez** — sunucu tarafında zorlanır. | Zorunlu |
| **FR-46g** | Bayi **pasifleştirilirse** login engellenir (canlı oturum doğrulaması gerektirir, bkz. BRK-04). | Zorunlu |

### 5.6 Kongre ve Doktor Kongre Bakiyesi

**Model:** Doktorun **tahsil edilmiş** alışverişi kongre bakiyesi kazandırır (D-09, %100 — D-11);
kongre paketi kaydı bakiyeden düşer. Bakiye ayrı kolonda tutulmaz, **hareket defterinden** hesaplanır.
Her kazanım **1 yıl** geçerlidir (D-10).

```
Tahsilat 700.000 ₺   →  EARN  +700.000 ₺   (son kullanım: +12 ay)
Kongre paketi 200.000 ₺ →  SPEND −200.000 ₺  (en eski kazanımdan düşer — FIFO)
                            ──────────────────
                            Bakiye: 500.000 ₺
```

| ID | Gereksinim | Öncelik |
|---|---|---|
| **FR-47** | **Kongre:** ad, açıklama, başlangıç/bitiş, lokasyon, son kayıt tarihi, kontenjan, durum. | Zorunlu |
| **FR-48** | **Kongre paketi:** kongreye bağlı, ad, **değer (kuruş)**, kontenjan. Değer kongre bazında değişkendir (D-15). | Zorunlu |
| **FR-49** | Tahsilat gerçekleştiğinde doktora `EARN` hareketi yazılır; tutar = tahsil edilen tutar × **%100** (D-11). Matrah **KDV hariç (net)** (D-17). | Zorunlu |
| **FR-50** | Her `EARN` hareketinin **son kullanma tarihi** vardır: tahsilat tarihi + 12 ay (D-10). | Zorunlu |
| **FR-51** | Harcama **FIFO** ile en eski kazanımdan düşülür. Aksi halde geçerlilik süresi mantığı yanlış çalışır. | Zorunlu |
| **FR-52** | Süresi dolan kazanımlar `EXPIRE` hareketiyle bakiyeden düşülür. Uygulama: gecelik job + okuma anında tembel (lazy) doğrulama. | Zorunlu |
| **FR-53** | **Kayıt akışı:** satıcı kendi doktorunu pakete kaydeder → bakiye kontrol edilir → `TALEP` (bakiye **rezerve** edilir) → admin onayı → `ONAYLANDI` (bakiye kesin düşer). | Zorunlu |
| **FR-54** | Bakiye yetersizse kayıt **reddedilir**; sistem üzerinden fark ödemesi yapılamaz. Ekranda "eksik tutar" gösterilir ve doktorun ayrıca iletişime geçmesi gerektiği belirtilir (D-12). | Zorunlu |
| **FR-55** | Kontenjan dolmuşsa kayıt alınamaz. Rezerve edilmiş talepler kontenjandan düşülür. | Zorunlu |
| **FR-56** | Kongre kaydı iptalinde bakiye **iade edilir** (D-13) ve kontenjan serbest kalır. İade edilen bakiyenin son kullanma tarihi **orijinal kazanım tarihine göre** hesaplanır (iptalle süre uzatılamaz). | Zorunlu |
| **FR-57** | Doktor detayında kongre hareket defteri görünür. Admin gerekçeli manuel `ADJUST` girebilir (audit'e yazılır). | Zorunlu |
| **FR-58** | Kongre ekranı: katılımcı listesi, kalan kontenjan, toplam kullanılan bakiye. | Yüksek |
| **FR-59** | Satıcı panelinde: kendi doktorlarının bakiyesi, **yakında süresi dolacak bakiye uyarısı**, "şu an hangi paketlere yeterli" görünümü. | Yüksek |

> 💡 **FR-59'daki "süresi dolacak bakiye" uyarısı satış aracıdır:** satıcı, bakiyesi yanmak üzere olan
> doktorunu kongreye yönlendirebilir.

### 5.7 Dashboard ve Raporlama

| ID | Gereksinim | Öncelik |
|---|---|---|
| **FR-60** | Admin dashboard: kanal bazlı ciro (Satıcı/Bayi), **toplam açık alacak + yaşlandırma özeti**, ay içi prim yükü, bayi alacağı, **açık kongre bakiyesi toplamı (potansiyel yükümlülük)**. | Zorunlu |
| **FR-61** | Satıcı dashboard: aylık tahsilat/prim ilerlemesi, açık alacak ve gecikmeler, doktor portföyü, ortalama iskonto. | Zorunlu |
| **FR-62** | Rapor: satıcı performans karşılaştırması (ciro, **tahsilat oranı**, iskonto, prim, doktor sayısı). | Yüksek |
| **FR-63** | Rapor: doktor ciro sıralaması + kongre bakiye durumu + gecikmiş borç. | Yüksek |
| **FR-64** | Tüm raporlarda KDV dahil/hariç görünüm seçeneği. | Orta |

---

## 6. Değişmez İş Kuralları (Invariants)

| ID | Kural |
|---|---|
| **RULE-01** | Stok hiçbir koşulda eksiye düşemez (satıcı siparişi + bayi sevkiyatı aynı stoğu kullanır). |
| **RULE-02** | Bir doktora aynı anda yalnızca bir satıcı sahiptir. |
| **RULE-03** | Satış birim fiyatı ürünün taban fiyatının (net) altında olamaz. |
| **RULE-04** | Sipariş anındaki fiyat, KDV oranı ve tutarlar dondurulur. |
| **RULE-05** | Kapanmış prim dönemi asla değişmez; düzeltmeler sonraki döneme yazılır. |
| **RULE-06** | Bayiye, fiyat listesinde tanımı olmayan ürün sevk edilemez. |
| **RULE-07** | Kongre bakiyesi negatife düşürülerek harcama yapılamaz. |
| **RULE-08** | Doktor bakiyesi ve kongre bakiyesi ayrı kolonda tutulmaz; hareketlerden hesaplanır. |
| **RULE-09** | Aynı bakiye iki farklı kongre paketine aynı anda kullanılamaz (rezervasyon kilidi). |
| **RULE-10** | Tüm parasal alanlar tam sayı **kuruş** olarak saklanır; kanonik değer **net (KDV hariç)**. |
| **RULE-11** | Kongre bakiyesi harcaması **FIFO**'dur; en eski kazanım önce tüketilir. |
| **RULE-12** | Bir tahsilat kaydı; mahsuplaşma + doktor bakiyesi + prim matrahı + kongre kazanımını **tek transaction'da** işler. |
| **RULE-13** | Fiyat, prim oranı, KDV oranı, **vade değişikliği**, doktor devri, mahsup düzeltmesi ve manuel bakiye düzeltmesi **istisnasız audit log'a** yazılır. |
| **RULE-14** | Bayi yalnızca kendi verisini görür/işler; sevkiyat talebi **admin onayı olmadan** stoğu/cariyi etkilemez. |
| **RULE-15** | Bayi hiçbir koşulda prim/kongre mekanizmasına dahil olmaz — prim satıcının, kongre doktorun hak edişidir (D-06, D-19). |

---

## 7. Veri Modeli Değişiklikleri

### 7.1 Yeni Modeller

```
Doctor                  id, fullName, title, specialty, clinic, region, city,
                        phoneNormalized (UNIQUE), email, ownerSellerId?, status
DoctorAssignment        doctorId, sellerId, fromDate, toDate?, assignedBy, reason
DoctorPayment           doctorId, amount(net/gross), method, paidAt, referenceNo,
                        recordedBy, note, status (AKTIF/IPTAL)
PaymentAllocation       paymentId, orderId, allocatedAmount     ← mahsuplaşma
DueDateChange           orderId, oldDueDate, newDueDate, changedBy, reason, changedAt

Dealer                  code (UNIQUE), title, taxOffice, taxNo, contactName,
                        phone, email, address, status, + userId? (DEALER User FK, opsiyonel)
DealerPrice             dealerId, productId, netPrice (kuruş), validFrom
                        └ UNIQUE(dealerId, productId, validFrom)
DealerShipment          dealerId, shipmentDate, dueDate, status(TALEP/ONAYLANDI/IPTAL/REDDEDILDI),
                        netTotal, vatTotal, grossTotal, + requestedByUserId?, + approvedBy?
DealerShipmentItem      shipmentId, productId, quantity, netUnitPrice, vatRate, lineTotal
DealerPayment           dealerId, amount, method, paidAt, referenceNo

CommissionPeriod        sellerId, year, month, baseAmount, rate, commissionAmount,
                        status, closedAt, closedBy   └ UNIQUE(sellerId, year, month)
CommissionAdjustment    periodId, amount(±), reason, sourcePaymentId?, createdBy

Congress                name, description, startDate, endDate, location,
                        registrationDeadline, quota, status
CongressPackage         congressId, name, value (kuruş), quota
CongressRegistration    packageId, doctorId, sellerId, status(TALEP/ONAYLANDI/IPTAL),
                        reservedAmount, requestedAt, approvedAt, approvedBy
CongressLedger          doctorId, type(EARN/SPEND/ADJUST/EXPIRE), amount(±),
                        earnedAt, expiresAt?, remainingAmount, refType, refId, note
                        └ FIFO tüketimi için remainingAmount tutulur
```

### 7.2 Değişen Modeller

| Model | Değişiklik |
|---|---|
| `Product` | `+ netListPrice`, `+ netMinPrice`, `+ vatRate` (varsayılan 20). Mevcut `salePrice` → `netListPrice` |
| `Order` | `doctorName`/`hospital` → `doctorId` **FK**; `+ dueDate`, `+ netTotal`, `+ vatTotal`, `+ grossTotal`, `+ channel` |
| `OrderItem` | `+ netUnitPrice`, `+ listPriceAtSale`, `+ discountRate`, `+ vatRate`, `+ vatAmount`, `+ lineNetTotal`, `+ lineGrossTotal` |
| `User` | `+ commissionRate?` (override). **`DEALER` rolü ekleniyor** (D-05 revize); opsiyonel `Dealer.userId` bağlantısı |
| `Payment` | **Kaldırılıyor / bölünüyor** → `DoctorPayment` + `DealerPayment`. Satıcı ödemesi kavramı yok |
| `StockMovement` | `+ dealerShipmentId?` |
| `src/lib/cari.ts` | **Silinip yeniden yazılıyor:** `doctor-cari.ts`, `dealer-cari.ts`, `commission.ts`, `congress-ledger.ts` |

### 7.3 Yeni Enum'lar

`Channel` · `CommissionStatus` · `CongressStatus` · `CongressRegistrationStatus` ·
`CongressLedgerType` · `DealerShipmentStatus` (**+ `TALEP`/`REDDEDILDI` durumları eklendi** — D-05 revize) ·
`PaymentStatus` · `AgingBucket` · `Role` (**+ `DEALER` eklendi**)

---

## 8. Mevcut Sistemle Çakışmalar

| ID | Çakışma | Etki |
|---|---|---|
| **BRK-01** | **Satıcı cari modeli tamamen geçersiz.** Satıcı artık borçlu değil (D-01). `cari.ts`, satıcı "Hesabım" ekranı, `Payment` modeli ve README'deki iş kuralı **silinip yeniden yazılacak.** | 🔴 Yüksek |
| **BRK-02** | **Doktor metin alanı → varlık.** Exclusivity, cari ve kongre bunsuz imkânsız. Mevcut serbest metin doktor isimleri temizlenip eşleştirilmeli (manuel emek gerekebilir). | 🔴 Yüksek |
| **BRK-03** | **Para tavanı (`Int32` ≈ 21,5 M ₺).** KDV, kümülatif doktor cirosu ve kongre bakiyeleriyle bu tavan artık gerçek bir risk. `BigInt`/`Decimal` geçişi **ön koşul**. `MAX_TL = 1e9` uyumsuzluğu da burada kapanır. | 🔴 Yüksek |
| **BRK-04** | **Oturum iptali çalışmıyor (JWT snapshot).** Satıcı **ve bayi** pasifleştirme artık doktor sahipliğini, prim hak edişini, tahsilat sorumluluğunu ve bayi panel erişimini etkiliyor. FR-08, FR-46g bu düzeltilmeden çalışmaz. | 🔴 Yüksek |
| **BRK-05** | **Stok yarışı (check-then-act).** İki kanal aynı stoğa yazacak. Koşullu update + PostgreSQL geçişi öne alınmalı. | 🟠 Orta-Yüksek |
| **BRK-06** | **Sayfalama yok.** Doktor listesi, tahsilat geçmişi ve kongre hareket defteri hızla büyür. | 🟠 Orta |
| **BRK-07** | **`error.tsx` / `loading.tsx` / `not-found.tsx` yok.** Tahsilat ve kongre akışları çok sayıda hata yolu üretiyor. | 🟠 Orta |
| **BRK-08** | **CI yok.** v2'nin kırılma yüzeyi çok geniş; `tsc + lint + test:e2e` zorunlu. | 🟠 Orta |
| **BRK-09** | **Birim test yok.** Prim, mahsuplaşma, KDV yuvarlama ve kongre FIFO/expiry saf fonksiyonlar — test edilmeden canlıya alınmamalı. | 🔴 Yüksek |
| **BRK-10** | **Rol yönlendirmesi ikili.** `src/app/page.tsx` şu an `ADMIN ? /dashboard : /my-orders` şeklinde ikili dallanıyor. Üçüncü rol (`DEALER`) için bu yönlendirme, `src/lib/session.ts`'e yeni bir `requireDealer()` koruması, yeni bir `(dealer)` route-group ve dealer-kullanıcı oluşturma yolu (mevcut `sellers/actions.ts` rolü sabit `"SELLER"` yazıyor) gerekiyor. | 🟠 Orta |

---

## 9. Teknik Ön Koşullar (Sprint 0)

1. **PostgreSQL geçişi** (+ rate-limit'in Redis'e taşınması) — BRK-05
2. **Parasal alanların `BigInt`/`Decimal`'e taşınması** + `MAX_TL` düzeltmesi — BRK-03
3. **`requireSession()` içinde istek başına canlı DB doğrulaması** — BRK-04
4. **CI kurulumu** (`tsc + lint + test:e2e`) — BRK-08
5. **`error.tsx` / `loading.tsx` / `not-found.tsx`** — BRK-07
6. **Sayfalama altyapısı** (ortak, tüm listelerde kullanılabilir) — BRK-06
7. **`db.ts` env fail-fast doğrulaması**

> Bu maddeler "sonra yaparız" listesi değil, **v2'nin doğru çalışmasının koşuludur.**
> Özellikle 2 ve 3 atlanırsa prim, cari ve kongre hesapları sessizce yanlış sonuç üretir.
> Faz D artık **madde 3**'e de bağımlı — bayi login'i canlı oturum doğrulaması ister (BRK-04, BRK-10).

---

## 10. Açık Sorular (v2.1) — KAPANDI

> v2.0'daki 17 sorudan 15'i kapandı (§2). Alınan kararlar v2.1'de 10 yeni soru doğurmuştu.
> **Tümü 23 Temmuz 2026'da kapandı → kararlar §2.1'e (D-16…D-25) işlendi.** Aşağıdaki tablo
> arşiv amaçlı korunmuştur; "Öneri" kolonundakiler artık nihai karardır.

| # | Soru | Karar (bkz. §2.1) | Durum |
|---|---|---|---|
| **OQ-01** | Prim matrahı **sipariş tutarı** mı **tahsil edilen tutar** mı? | **Tahsilat.** → **D-16** | ✅ KAPANDI |
| **OQ-02** | Prim ve kongre matrahı **KDV hariç mi dahil mi**? | **KDV hariç (net).** Muhasebe/mali müşavir teyidi önerilir. → **D-17** | ✅ KAPANDI |
| **OQ-03** | Tahsilat hangi siparişe mahsup edilir? | **FIFO** + admin manuel düzeltme. → **D-18** | ✅ KAPANDI |
| **OQ-04** | Kısmi ödemede prim ve kongre kazanımı **orantılı** mı? | **Evet, orantılı**; ayrıca prim (satıcı) ve kongre (doktor) birbirinden bağımsız hesaplanır, bayi hiçbirine dahil değil. → **D-19** | ✅ KAPANDI |
| **OQ-05** | Varsayılan vade kaç gün? Vade uzatma yetkisi **kimde**? Üst sınır var mı? | Vade var; üst sınır **admin parametresi** ile belirlenir. → **D-20** | ✅ KAPANDI |
| **OQ-06** | Vadesi geçmiş borcu olan doktora yeni sipariş girilebilir mi? | Faz 1'de **uyarı**, blok yok. → **D-21** | ✅ KAPANDI |
| **OQ-07** | "1 yıl" = **rolling 12 ay** mı, **takvim yılı sonu** mu? | **Rolling 12 ay.** → **D-22** | ✅ KAPANDI |
| **OQ-08** | Tahsilat iptal/iade edilirse prim ve kongre bakiyesi nasıl geri alınır? | Ters kayıt; harcanmışsa bakiye negatife düşer + admin uyarısı. → **D-23** | ✅ KAPANDI |
| **OQ-09** | **Fatura** ve kargo sisteme girecek mi? | Faz 1'de sadece fatura no alanı; **e-Fatura ve kargo/taşıyıcı entegrasyonu sonradan.** → **D-24** | ✅ KAPANDI |
| **OQ-10** | Satıcının tahsilat performansı primi etkileyecek mi? | Faz 1'de **hayır**, sadece raporlanır. → **D-25** | ✅ KAPANDI |

---

## 11. Uyumluluk Notu (Hukuk Teyidi Gerektirir)

Kongre modülü, **sağlık profesyonellerine satın alma hacmine bağlı menfaat sağlanması** anlamına geliyor
ve kazanım katsayısı %100 olarak belirlendi (D-11). Türkiye'de sağlık meslek mensuplarına yönelik tanıtım,
destek ve etkinlik katılımı düzenlemeye tabidir (TİTCK'nın tanıtım faaliyetlerine ilişkin mevzuatı; tıbbi
cihazlar için de benzer kısıtlar bulunur). Ciroya endeksli otomatik hak ediş modeli bu açıdan risk taşıyabilir.

**Yapılması gereken:** Faz E geliştirmesine başlamadan önce firmanın hukuk/uyum danışmanıyla teyit.
Sistem tarafında, hangi kararın ne zaman ve kim tarafından alındığının **eksiksiz denetim izi** bu nedenle
zorunlu tutulmuştur (RULE-13).

> Bu bir hukuki görüş değildir; ürün riski olarak işaretlenmiştir.

---

## 12. Faz Planı

| Faz | Kapsam | Bağımlılık | Paralel? |
|---|---|---|---|
| **Sprint 0** | Teknik ön koşullar (§9) | — | — |
| **Faz A** | Doktor varlığı + veri taşıma + satıcı-doktor eşleşmesi (FR-01…FR-10) | Sprint 0 (BRK-04) | — |
| **Faz B** | KDV altyapısı + taban fiyat + serbest fiyat (FR-11…FR-19) | Sprint 0 (BRK-03) | Faz A ile paralel |
| **Faz C1** | **Doktor cari + vade + tahsilat + mahsuplaşma** (FR-20…FR-29) | Faz A, B | — |
| **Faz C2** | Prim dönemi + kapanış + düzeltme (FR-30…FR-38) | Faz C1 | — |
| **Faz D** | Bayi kanalı **+ bayi paneli** (login, görüntüleme, sevkiyat talebi/onay) (FR-39…FR-46g) | Sprint 0 (**BRK-04 dahil**) | Büyük ölçüde bağımsız |
| **Faz E** | Kongre: ledger, FIFO, expiry, kayıt akışı (FR-47…FR-59) | Faz C1 · §11 hukuk teyidi | — |
| **Faz F** | Dashboard + raporlar (FR-60…FR-64) | Tümü | — |

> **Kritik yol:** Sprint 0 → A/B → C1 → C2 → E → F. **Faz D bu yola değmiyor** (D-06, D-19 sayesinde
> hâlâ prim/kongreden bağımsız), ama artık Sprint 0'ın auth sertleştirmesini (BRK-04, BRK-10) bekliyor;
> ikinci geliştirici varsa yine de erken paralel başlayabilir.

---

## 13. Efor Tahmini

Kod tabanına hâkim, orta seviye bir geliştirici için **adam-gün** cinsinden:

| Faz | Alt kalemler | A/G |
|---|---|---|
| **Sprint 0** | PostgreSQL 3-5 · para tipi 2-3 · oturum 1-2 · CI 1-2 · error/loading 2-3 · sayfalama 2-3 | **12–18** |
| **Faz A** | Doktor CRUD, sahiplik/devir, yetki, **veri taşıma scripti + temizlik** | **10–14** |
| **Faz B** | KDV altyapısı (yatay, tüm ekranlar) 5-8 · taban fiyat 3-5 | **8–13** |
| **Faz C1** | Cari hesaplama, vade, tahsilat, **mahsuplaşma**, yaşlandırma raporu | **12–16** |
| **Faz C2** | Prim dönemi, kapanış snapshot, düzeltme mekanizması, satıcı ekranı | **8–11** |
| **Faz D** | Bayi CRUD, fiyat listesi, sevkiyat, cari, ödeme, **DEALER rolü/guard/route-group, bayi dashboard (read-only), sevkiyat talep+onay akışı** | **13–19** |
| **Faz E** | Ledger + FIFO + expiry job, kongre/paket CRUD, rezervasyon + onay akışı | **13–18** |
| **Faz F** | Dashboard güncellemesi + 4 rapor + KDV toggle | **8–11** |
| **Test/QA** | E2E genişletme + **birim testler (prim, mahsup, KDV yuvarlama, FIFO)** + hata düzeltme | **12–18** |
| **Analiz/PM** | Toplantı, dokümantasyon, kabul testi (%10-15) | **10–15** |
| | | **≈ 106–153 A/G** |

**Takvim karşılığı:**

| Ekip | Süre |
|---|---|
| 1 geliştirici (tam zamanlı) | ~5–7 ay |
| 2 geliştirici (Faz D paralel) | ~3–4 ay |
| 3 geliştirici | ~2,5–3 ay (koordinasyon maliyeti artar, kritik yol tek kişilik kalır) |

> ⚠️ **Bu tahmin, §2.1'deki D-16…D-25 kararlarının nihai olduğu varsayımıyla verilmiştir.** Prim matrahı
> **tahsilat** olarak seçildi (D-16) → Faz C1 kritik yol üzerinde kalır. Ayrıca Faz D artık kendi
> içinde bir auth/panel dikeyi taşıdığı için eforu büyüdü; kritik yola değmese de Sprint 0'ın
> tamamlanmasını bekliyor (bkz. §12).

---

## 14. Kabul Kriterleri (v2.0)

- [ ] Satıcı, sahibi olmadığı doktora sipariş **oluşturamıyor** — arayüzde ve doğrudan sunucu isteğinde
- [ ] Aynı telefon numarasıyla ikinci doktor kaydı **açılamıyor**
- [ ] Taban fiyatın altında birim fiyat girilen sipariş **reddediliyor** (sunucu tarafı)
- [ ] KDV dahil girilen fiyat net'e doğru çevriliyor; **kalemler toplamı = sipariş toplamı** (yuvarlama testi)
- [ ] Kısmi tahsilat, doktor bakiyesini + prim matrahını + kongre bakiyesini **orantılı** güncelliyor
- [ ] Tahsilat kaydı tek transaction; ara adım hata verirse **hiçbiri** yazılmıyor
- [ ] Vade değişikliği geçmişi ve audit kaydı oluşuyor
- [ ] Yaşlandırma raporu doğru kovalara ayırıyor (0/1-30/31-60/61-90/90+)
- [ ] Ay kapanınca prim donuyor; sonraki iptal geçmiş dönemi **değiştirmiyor**
- [ ] Bayiye fiyat listesinde olmayan ürün sevk **edilemiyor**
- [ ] Kongre bakiyesi hareketlerden hesaplanıyor; ayrı kolon **yok**
- [ ] Harcama **en eski kazanımdan** düşüyor (FIFO testi)
- [ ] 12 ayı dolan kazanım `EXPIRE` ile bakiyeden düşüyor
- [ ] Bakiyesi yetersiz doktor kayıt **olamıyor**; ekranda eksik tutar gösteriliyor
- [ ] Aynı bakiye iki pakete eşzamanlı harcanamıyor (rezervasyon yarış testi)
- [ ] Kongre iptali bakiyeyi iade ediyor ama **son kullanma tarihini uzatmıyor**
- [ ] Prim, mahsuplaşma, KDV ve FIFO için **birim testler** mevcut
- [ ] Fiyat, KDV oranı, prim oranı, vade değişikliği, doktor devri ve manuel düzeltme audit log'da
- [ ] Bayi yalnız **kendi** verisini görüyor; başka bayinin verisine sunucu tarafında **erişemiyor**
- [ ] Bayi sevkiyat talebi açıyor; **onaylanana kadar stok/cari değişmiyor**; admin onayında **tek transaction'da** stok düşüyor + cariye yazılıyor
- [ ] Bayi doğrudan sipariş veremiyor / fiyat değiştiremiyor (sunucu tarafı)
- [ ] **Pasif bayi login olamıyor**

---

## Ek — Örnek Senaryo (uçtan uca doğrulama testi)

```
 1. Admin  : "Ürün X" → net liste 1.000 ₺, net taban 800 ₺, KDV %20
 2. Admin  : Depoya 1.000 adet stok girer
 3. Satıcı A: "Dr. Ayşe Demir" kaydı açar (klinik + bölge + telefon) → sahiplik A'ya kilitlenir
 4. Satıcı B: Aynı telefonla kayıt dener → REDDEDİLİR (FR-09)
 5. Satıcı B: Dr. Ayşe'ye sipariş açmayı dener → REDDEDİLİR (RULE-02)
 6. Satıcı A: 700 adet × net 850 ₺ sipariş girer (taban 800'ün üstünde → KABUL)
              → net 595.000 ₺ + KDV 119.000 ₺ = brüt 714.000 ₺
              → stok düşer, fiyat+KDV dondurulur, vade: +30 gün
              → Dr. Ayşe cari borcu: 714.000 ₺ · kongre bakiyesi: 0 (henüz tahsilat yok)
 7. Admin  : Vadeyi +15 gün uzatır → DueDateChange kaydı + audit
 8. Şirket : 714.000 ₺ tahsil eder → tek transaction:
              → borç 0 · prim matrahı +595.000 ₺ (net) · kongre EARN +595.000 ₺ (son kullanım +12 ay)
 9. Admin  : "Antalya Kardiyoloji Kongresi" → "Tam Paket" 200.000 ₺
10. Satıcı A: Dr. Ayşe'yi kaydeder → 595.000 ≥ 200.000 → TALEP (bakiye rezerve)
11. Admin  : Onaylar → SPEND −200.000 ₺ (en eski kazanımdan) → bakiye 395.000 ₺
12. Ay sonu: Dönem kapanır → Satıcı A matrahı 595.000 ₺ → prim 29.750 ₺ (%5)
              → Kongre maliyeti primi ETKİLEMEZ (D-14)
13a. Bayi C : Kendi panelinden Ürün X'ten 50 adet **sevkiyat talebi** açar → TALEP (stok/cari değişmez)
13b. Admin  : Talebi onaylar, net 600 ₺'den sevk eder
              → stok düşer · Bayi C borcu: net 30.000 + KDV 6.000 = 36.000 ₺
14. Bayi C : 20.000 ₺ öder → bakiyesi 16.000 ₺
15. 12 ay sonra: kalan 395.000 ₺ kullanılmadıysa EXPIRE ile sıfırlanır (D-10)
```

> Bu senaryonun tamamı, geliştirme bittiğinde **tek bir E2E testi** olarak yazılmalıdır.