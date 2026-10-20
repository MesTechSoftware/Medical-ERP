# Kararlar — Medikal Satış Operasyon

> **Bu dosya Faz 0'ın çıktısıdır.** Proje boyunca alınan tüm ticari/kapsam kararlarının
> **tek kaynağıdır**. Cevaplar başka hiçbir dosyaya kopyalanmaz; diğer dosyalar buraya atıf yapar.
>
> Kural: `YOL_HARITASI.md` §2.1, `IS_AKISI_OZETI.md` §7 ve `DUZELTME_BRIFI.md`
> "Karar bekleyenler" bölümlerindeki soru metinleri **buraya taşındı**. O bölümler
> bundan sonra yalnız "bkz. `KARARLAR.md`" der.
>
> Son güncelleme: 20 Ekim 2026 (**A-8 eki — negatif stok sevkiyatta denetlenir; blok siparişe bağlanır ve sevkiyatı durdurur**) · 17 Ekim 2026 (**D-2 eki — `OPERASYON` ekran matrisi: cari açmaz, ürün kartını yalnız görür, rapor ve denetim kaydı görmez; Dashboard'u görür, Satıcılar ekranını salt okur · X-1 eki — dönem tahsilatı tahsilat anındaki sahibe sayılır**) · 16 Ekim 2026 (**A-8 eki — `RED`'in sonucu: her kural için son blok geçerli**) · 13 Ekim 2026 (**X-16 kararı — içe aktarım elle girişin toplu hâli, şablon tek tanımdan (ADR-006), kısmi yazma yok · X-15 §(5) kişisel telefon varsayımı 🟦**) · 12 Ekim 2026 (**C-1 revizyon 3 — modül sınırı §1.3 §F, zamanlayıcı altyapısı, e-belge durum makinesi, cari uzantısı, istisna/tevkifat çekirdek kararı · K-8 kontör 🟦 · K-9 §B kargo anahtarı**) · 10 Ekim 2026 (**C-1 revizyon 2 — e-belge modülü çekirdek sonrası ilk modül, ilk adaptör müşterinin entegratörü, tek çatı partnerlikle · D-3 kargo e-belgeden sonra, BYOI · 🟦 tarama: X-11/X-12/A-4/A-8 ✅, K-10 yeni kilit, K-4 ayrıştı**) · 9 Ekim 2026 (**C-1 iç karar olarak ✅ — 🟦 varsayılan kaydı ve kilitlenme anı kaldırıldı; §0.6'nın otomatik ✅ kuralı kaldırıldı — tarih tek başına hiçbir kaydı kapatmaz**) · 1 Ekim 2026 (**X-17 kararı — sahipliğin tek yazma noktası, toplu devir; tek çağrı noktası listesi 11 → 12; `CM`'in önündeki son açık kalem kapandı**) · 24 Eylül 2026 (**D-6 ekleri — açılış bakiyesi import'u**) · 16 Eylül 2026 (**X-11…X-15 kararı + PRD taraması**) · **Faz 0'ın karar adımları tamamlandı · Faz 1A'da açılan X-8…X-17 kapandı (X-16: 13.10.2026) · PRD taraması kapandı — açık (⬜) madde yok.**
> **24.09.2026 — D-6 ekleri (şema değişmedi):** açılış bakiyesi import'unda **işaret kuralı** ve
> **önizleme özeti** yazıldı. Boşluğun kaynağı 19.09 incelemesinin 4. bulgusudur; D-6 üç aşamayı
> (doğrula → önizle → yaz) koyuyor ama hiçbirinin içeriğini yazmıyordu. Yeni kural kodu: `TUTAR_NEGATIF`.
>
> ⚠️ **Bu turda şemaya iki ekleme yapıldı** (E-2: oturum tablosu ve `Kullanici` alanları ·
> D-5: dışa aktarım kütüğü). Önceki turların *"Faz 1 şemasını blokleyen madde kalmadı"*
> ifadesi bu turda **güncellenmiştir**; ikisi de küçük ve **teslim şartıdır**.
>
> **07.09.2026 turu:** K-8 (ticari model) · K-7 (geçiş dosyaları) · D-2 (rol tasarımı) karara
> bağlandı. **e-Fatura API modülü (K-4 §4) ve ÜTS modülü (K-10) ertelendi.**
>
> **08.09.2026 turu — stakeholder geri bildirimi:** **K-4 §(6) fatura hazırlık veri seti
> MVP'ye alındı** (entegratöre toplu yüklenebilir çıktı; API yok, anahtar yok, gönderim yok).
> ÜTS ertelemesi pazar verisiyle desteklendi. **1 Ekim kilitlenme anı ikiye ayrıldı:**
> K-10 tetikleyicisi düştü, **KDV oranı teyidi K-7 §(7) ile canlıya çıkışa taşındı.**
>
> 🟡 **Takvim notu — 08.09.2026'da revize edildi.** ÜTS/karekod zorunluluğunun kapsamı
> **1 Ekim 2026**'da değişiyor, ancak K-10 modülü ertelendiği için **bu tarih artık
> blokleyici değildir** (K-10 §I-7). **Yerini alan şart:** ürün bazında KDV oranı teyidi,
> **canlıya çıkıştan önce**, müşterinin doldurduğu içe aktarım şablonuyla (K-7 §(7)).
> **C-1 teyit metni (on bir madde) hâlâ canlıya çıkış ön koşuludur.**
>
> **08.09.2026 turu — ikinci oturum (denetim artıkları):** **X-1** (satıcı raporu ve dönem
> filtresi) · **A-15** (nakit tahsilatta tevsik uyarısı — yeni madde) · **X-3** (hata yüzeyi)
> karara bağlandı. **Üçü de şemaya hiçbir şey eklemez.** Teyit metni **dokuz → on bir
> maddeye** çıktı. Yeni açılan ve karar bekleyen maddeler: **X-4** (iş hatası ve uyarı
> gösterim sözleşmesi) · **E-1** (zaman dilimi) · **E-2** (hesap yaşam döngüsü) ·
> **E-3** (dosya eki).
>
> **13.09.2026 turu — belge uyum denetimi:** Diğer dosyalarla bu dosya arasında otuzdan fazla
> çelişki bulundu ve üçü **karar boşluğu** çıktı: **X-5** (parasal tip `Decimal`; `iskonto_oran`
> şemadan çıktı, yerine `birim_fiyat`) · **X-6** (`PaymentAllocation` kaldırıldı, **runtime FIFO
> de yasak**, yaşlandırma Faz 2+) · **X-7** (`PRD_V2.md` arşive, yerine `KABUL_KRITERLERI.md`,
> numaralandırma karar kimliğinden). Üçü de §5.8–§5.10'dadır. Ayrıca **K-1'in "tahsilat oranı"
> kalıntısı** (X-1 ile kaldırılmıştı) ve **A-10 / Ü-3 §(10) iskonto ifadeleri** redakte edildi.
> ⚠️ **X-5 şemayı değiştirir, X-6 şemadan çıkarır.**
>
> **15.09.2026 turu — redaksiyon (yeni karar yok).** `FAZ1_UYGULAMA_KAPSAMI.md` §D'nin commit
> dizisi turunda üç **"nasıl"** kararı verildi ve **`docs/adr/`'ye** yazıldı (ADR-001 isimlendirme ·
> ADR-002 fresh init · ADR-003 oturum mekanizması). Hiçbiri bu kitaptaki bir kararı değiştirmez;
> ama üç yerde metin yanıltıcı kalmıştı ve işlendi: **(a)** §4 E-2 satırındaki *"Auth.js
> veritabanı oturumu"* ifadesi → E-2'nin özü (oturum veritabanında) aynen geçerli, mekanizma
> ADR-003 · **(b)** §4 şema özetinin önüne **ad rejimi notu** kondu — Türkçe tablo/kolon adları
> **kavramsaldır** (ADR-001) · **(c)** §4 A-10 satırı hâlâ *"satıra `iskonto_oran`"* diyordu —
> **X-5 redaksiyonunun kaçan bir yeri daha** (13.09 üç yeri, 14.09 bir yeri düzeltmişti).
>
> **15.09.2026 turu (2. oturum) — X-8 · X-9 karara bağlandı, X-10 açıldı.** Redaksiyon
> taramasının bulduğu iki karar boşluğu aynı gün kapandı:
> **X-8 (§5.11)** — bayi ayrı tablo değildir; `Doktor` (cari) tablosunda **`hesap_sinifi = BAYI`**
> satırıdır. Beş `Dealer*` tablosu ve bayi yönetim ekranları sökülür; 1B'de tek cari ekranından
> yönetilir; bayiye satıcı atanmaz, **prim doğmaz**; X-2'nin ilkesi **bütün tahsilatlara** genişler.
> **X-9 (§5.12)** — `LoginAttempt` tablosu kaldırılır; E-2 §(8) harfiyen uygulanır; deneme
> sınırı **bellek içi** sayaçla (ADR-004); tek süreç varsayımı yazılıdır.
> **Şemaya etki:** bir enum + bir kolon eklenir, altı tablo çıkar.
> ⬜ **X-10 açıldı ve `CM`'i blokluyor:** fiyat listesinin cariye nasıl bağlandığı hiçbir
> yerde yazılı değil. X-8, bayi fiyatını taşıyan tek tabloyu (`DealerPrice`) kaldırdığı için
> boşluk somutlaştı.
>
> **15.09.2026 turu (3. oturum) — X-10 karara bağlandı (§5.13).** **Cariye atanan fiyat
> listesi:** `FiyatListesi` + `FiyatListesiSatir` yeni tablo (**11 → 13**) · `Doktor.fiyat_listesi_id`
> nullable, boşsa **varsayılan liste** (`pricing.varsayilanFiyatListesiKodu`) · atanmış listede
> satır yoksa varsayılana **düşülmez** — RULE-06 bu biçimde yaşar · `Product.netListPrice`
> kalkar, ürünün liste fiyatı varsayılan listenin satırıdır (**GÇ-15**) · **satıcının elle fiyat
> girişi serbest kalır** (Ü-3 §(10) değişmedi). **Faz 1A'nın önünde açık karar kalmadı.**
>
> **16.09.2026 — redaksiyon (yeni karar yok).** X-10'un sayı etkisi §6'da iki yere işlenmemişti:
> *"Şema kapanışı"* satırındaki **11 tablo** (X-10 ile **13**) ve 13.09 denetim satırındaki **on üç
> kalemlik** geri çekme listesi (X-9 ve X-10 ile **on beş**). Ayrıca `KABUL_KRITERLERI.md`
> satırındaki *"Faz 1A, madde 6"* atfı, `FAZ1_UYGULAMA_KAPSAMI.md` §D'nin commit bazlı sırasına
> göre **C10** olarak düzeltildi.
>
> **16.09.2026 turu (2. kısım) — X-11 · X-12 açıldı.** `FAZ1_UYGULAMA_KAPSAMI.md` §A–§C bu kitaptan
> yeniden kurulurken §4 şema özetinde **iki sayım boşluğu** çıktı. İkisi de X-10'daki desenle aynıdır:
> bu kitap bir varlığı kolonlarıyla anıyor ama tablo sayımına koymuyor.
> ⬜ **X-11:** `CariHareket` şemada nedir?
> ⬜ **X-12:** `ImportParti` tablosu sayımda yok.
> İkisi de **`CM`'i bloklar**; C0…C7b'yi bekletmez. Seçenekler §5 tablosundadır.
>
> **16.09.2026 turu (3. kısım) — X-11 · X-12 karara bağlandı; PRD taraması yapıldı.**
> - **X-11 (§5.14):** `CariHareket` yeni çekirdek tablodur.
> - **X-12 (§5.15):** `ImportParti` yeni çekirdek tablodur.
> - Tablo sayısı **13 → 15**. İki tip kataloğu 🟦 varsayılan olarak yazıldı; kilitlenme anı `CM`. *(10.10.2026 — geri not: ikisi de iç karar olarak ✅, kilitlenme anı kalktı — §0.6 (2).)*
>
> **PRD taraması (X-7 §(2))** — 59 madde (49 FR + 10 RULE) tek tek geçildi. Sonuç:
> - **38** ✅ karşılığı var
> - **8** ⛔ bu kitap geçersiz kılmış
> - **3** 🔵 modüle ertelenmiş
> - **10** ❌ karşılığı yok → üç eksik karar açıldı, üçü de `CM`'i bloklar:
>   - ⬜ **X-13** — satıcı–doktor sahipliği (görünürlük, devir, pasif satıcı). D-2 §(3) ile bugünkü kod çelişiyor.
>   - ⬜ **X-14** — prim oranının yeri ve dondurulması.
>   - ⬜ **X-15** — vade tarihi değişikliği ve mükerrer cari engeli.
>
> **✅ Aynı gün (4. kısım) — X-13 · X-14 · X-15 karara bağlandı (§5.16–§5.18).**
> - **X-13:** satıcı yalnız kendi doktorlarını görür (izolasyon korunur). **D-2 §(3) redakte edildi.**
>   Siparişin satıcısı sipariş anındaki sahiptir; devir izli kalır.
> - **X-14:** varsayılan prim oranı `policy.ts`'tedir (**23. anahtar**). Satıcı kartında isteğe bağlı
>   özel oran vardır. Uygulanan oran sevkiyat satırına donar.
> - **X-15:** vade tarihi sonradan değiştirilebilir ve değişiklik izlidir. Telefon zorunlu ve
>   benzersizdir. `BAYI` satırında klinik ve bölge boş kalabilir.
>
> **PRD taraması kapandı** (59/59, açık ❌ yok). `PRD_V2.md` arşive gidebilir.
> Aynı turda `Product.stock` için **`docs/adr/ADR-005`** yazıldı: kolon kalkar. Bu bir "nasıl" kararıdır,
> bu kitabı değiştirmez. **Faz 1A'nın önünde açık karar kalmadı.**
>
> Tarama ayrıca bu kitabın geçersiz kıldığı ama geri çekme listesinde olmayan **beş yetenek** buldu.
> Bunlar `FAZ1_UYGULAMA_KAPSAMI.md` §A'ya **GÇ-16…GÇ-20** olarak işlendi. *Bu tur karar metinlerini
> değiştirmedi; yalnız eksik olanları açtı.*
>
> **14.09.2026 turu — X-5 redaksiyonunun tamamlanması (yeni karar yok).** 13.09 turu X-5'i
> üç yerde redakte etmiş, **§6 çıkış listesindeki Ü-3 satırını atlamıştı**: satır hâlâ
> *"elle fiyat girişi `iskonto_oran`'a yazılır"* diyordu ve X-5 §(10) ile çelişiyordu.
> Düzeltildi. Aynı turda `KABUL_KRITERLERI.md` çıkış kalemi geçmiş zamandan gelecek zamana
> çevrildi (iskelet **kurulmadı**, Faz 1A'da kurulacak). **Bu tur hiçbir karar üretmedi —
> yalnız mevcut kararların metne geçmemiş kısımları işlendi.**
>
> **09.09.2026 turu — kalan yedi karar adımı kapatıldı:** **Ü-3** (KDV tabanı ve taban
> etiketi) · **X-4** (iş hatası ve uyarı gösterim sözleşmesi) · **E-1** (zaman dilimi ve gün
> sınırı) · **E-2** (hesap yaşam döngüsü) · **E-3** (dosya eki — kapsam dışı, yazılı) ·
> **D-5/Ü-5** (dışa aktarım kapsam teyidi) · **§1.3 modülerlik** ve onunla birlikte
> **A-9 parkı** çözüldü. Ayrıca **C-2'nin 🟦 periyot varsayılanı** çıkarımla sabitlendi
> (madde 14-a beklenmiyor, **numune yöntemine** çevrildi) ve **müşteri beyanı alındı:**
> yayınlanan fiyat listeleri **KDV hariçtir**, indirim **adet baremlidir**, KDV sonradan
> eklenir → `pricing.fiyatGirisiKdvDahil` **`false` kalır ve açılmaz**.

---

## 0. Karar çerçevesi

Bu bölüm tek tek maddelerden değil, maddeleri **nasıl karara bağladığımızdan** bahseder.
Yeni bir gereksinim çıktığında önce buraya bakılır.

**Temel ilke:** *veri modeli genel, davranış katı, iş kuralı kısıtı aşılabilir ama izli.*

### 0.1 Üçlü triyaj

Her yeni gereksinim şu üç kovadan birine düşer:

| Kova | Kural | Örnek |
|---|---|---|
| **Şemaya dokunuyor** | Şimdi ve **en genel** halde karar ver. Müşteri "gerekmiyor" dese bile alanı genel kur, UI'da kapat | Kısmi sevkiyat, açılış bakiyesi, iade belgesi, stok konumu, fiyat baremi, vade tarihi, vergi kimliği |
| **Sadece davranış/politika** | Tek varsayılan seç, ama kararı **kodda tek yerde** tut (`policy.ts`). Şimdiden toggle açma | Avans mahsup davranışı, onay kuralları, iskonto tavanı, kredi limiti kademesi |
| **Sadece etiket/görünüm** | Tartışma, en yaygın olanı yap | Bakiye yön etiketi, KDV dahil giriş tercihi, doktor kartı sekme düzeni |

Gerekçe: canlı veri üstünde migration en pahalı iştir. Her toggle test matrisini ikiye
katlar ve servis katmanında hâlâ test yok. **Ürünleşme esnekliği = config'i erken açmak
değil, config noktasını erken belirlemek.**

**Sigorta kolonu kuralı (C-5 ile netleşti; B-3 · K-10 · A-13 · C-3 · C-1 · B-7 · X-1 ·
E-2 · E-3 · A-9 ile on iki kez doğrulandı):** "ileride lazım olur" diye kolon koymak her zaman doğru değildir. Kolonun
**tek başına anlam taşıdığı** durumda konur (`vade_tarihi`, `takip_no`, `belge_no`,
`vkn_tckn`, `harici_irsaliye_no`, **`harici_belge_no`**). Kolonun ancak **bir mekanizmayla
birlikte** anlam taşıdığı durumda konmaz — yarım kurulmuş mekanizma, hiç kurulmamış olandan
kötüdür ve yanlış güven üretir (dövizli tutar, lot/seri takibi, barkod, `aktarildi_mi`,
`anonimlestirildi_mi`, `Urun.uts_kapsaminda_mi`, **`OdemeYontemi.hesap_etiketi`**,
**`Tahsilat.hesaba_gecti_mi`**, **`Kullanici.son_giris_at` (E-2)**,
**dosya eki alanları — `dosya_url`, `ek_var_mi` (E-3)**, **`Doktor.kurum_id` (A-9)**).
**X-5 eki (13.09.2026) — türetilebilir alan da konmaz:** `OrderItem.iskonto_oran` şemadan
**çıkarıldı**; `liste_fiyat` ve `birim_fiyat` saklandığı için oran her an **kayıpsız türetilir**
ve §0.1.a'nın **ikinci sorusunda düşer**. *Saklanan bir türev, girdileri değiştiğinde sessizce
yanlış kalır.*

**K-10 eki — yanlış güvenin bedeli:** İzlenebilirlik alanları için bu kural yalnız teknik
değil, **etik** gerekçe de taşır. `lot_no` kolonu dolu ama doğrulanmıyorsa birileri o
veriye güvenir; tıbbi cihazda o güvenin bedeli geri çağırma sürecinde ödenir.

**X-1 eki — bankada olan olay sistemde yoktur *(08.09.2026)*:** "Para şirket hesabına geçti"
bir **banka olayıdır**; sistem tahsilatın kaydını tutar, paranın hesaba girdiğini tutmaz
(A-11 §8: kasa/banka bakiyesi yok). Bu olayı bir bayrakla temsil etmek doğrulanamayan alanın
en tehlikeli türüdür: **doğrulanamayan alanın üstüne bir ücret ödemesi kurulur.**
Tahliye vanası zaten mevcuttur — **tahsilat kaydının kendisi "para alındı" beyanıdır**;
ikinci bir doğrulama katmanı, olmayan bir veriye ikinci bir isim vermektir.

**C-1 eki — doğrulanabilirlik testi *(28.08.2026)*:** Bir alanın doğruluğunu **sistemin
kendisi hiçbir koşulda kontrol edemiyorsa**, o alan kolon olmaz. `vkn_tckn` hane sayısından
doğrulanabilir (A-13 §3); `takip_no` yanlışsa kargo ekranında hemen görülür. Buna karşılık
**ÜTS kapsamının tek mercii TİTCK'dır** — biz ne doğrulayabilir ne çürütebiliriz.
Doğrulanamayan alan dolduğunda sistem **patlamaz, sessizce yanlış çalışır**; hata denetimde
veya geri çağırmada ortaya çıkar.
**K-6 eki (29.08.2026):** Aynı test kongre limitlerine uygulandı — doktorun **tüm
firmalardan** aldığı yıllık destek sayısı (4 sınırı) doğrulanamaz, dolayısıyla sayaç
tutulmaz; **bizim verdiğimiz** destek sayısı (2 sınırı) doğrulanabilir, sayılır.

**C-1 eki — beyan verisi kolon değil, tarihli ektir:** Müşteri/müşavir beyanına dayanan ve
sistemin tüketmediği veri, veritabanına değil **imzalı sözleşme ekine** yazılır. Gerekçe
güncellik değildir — beyan da bayatlar. Fark şudur: kolonun bayatlığı **görünmez** (ekranda
bugünkü veri gibi durur), imzalı ekin bayatlığı **tarihinden görünür** ve sorumluluğu
adreslidir (§0.6).

#### 0.1.a Kolon testi — üç soru *(19.08.2026, C-3 tartışmasından çıktı)*

"Şimdi mi koyalım, sonra mı?" ikilemi sırayla şu üç soruyla çözülür. İlk "evet"te durulur.

1. **Bu kolon bugün doldurulacak mı?** → Evet ise **koy**, tartışma biter.
2. **Veri sonradan geriye dönük üretilebilir mi?** → **Üretilemez ise ŞİMDİ koy.**
   "Sigorta kolonu"nun tek geçerli gerekçesi budur.
   *(Üretilemeyenler: `belge_no`, `guncelleme_tarihi`, `StockMovement.konum_id`,
   `CariHareket.vade_tarihi`, `OrderItem.kdv_orani`, `Sevkiyat.harici_irsaliye_no`,
   **`StokDuzeltme.harici_belge_no`**, **`ImportParti.dosya_adi` (E-3)**,
   **dışa aktarım kütüğü kaydı (D-5)**.)*
3. **Kolon tek başına mı anlamlı, yoksa bir mekanizmayla birlikte mi?**
   → Mekanizmayla ise **koyma** (§0.1).

**Maliyet asimetrisi (gerekçe):** PostgreSQL'de tek tabloya nullable kolon eklemek tabloyu
yeniden yazmaz — pratikte bedavadır. Buna karşılık **alanları sonradan ayrı tabloya
taşımak** veri taşıma migration'ıdır ve gerçekten pahalıdır. Yani *"az tutup sonra kolon
eklerim"* ucuz, *"az tutup sonra tablolaştırırım"* pahalıdır.

**C-1/K-10 eki — boş kolon maliyet düşürmez:** Bir kolonu bugün koyup **kimse doldurmazsa**,
modül açıldığında elde sıfır veri olur. Geçişin gerçek maliyeti kolonda değil,
**operasyondadır** (fiziksel sayım, etiketleme, saha alışkanlığı) ve bu maliyet kolon bugün
konsa da konmasa da **birebir aynıdır**. Boş kolonun tek ürettiği şey "hazırız" hissidir.

**C-2 eki (29.08.2026) — testin 2. sorusu `hesap_etiketi`'ni eledi:** Müşavirin hesap planı
kodları **her an geriye dönük yazılabilir** (beş satırlık tanım tablosuna etiket), ve alan
ancak bir eşleme mekanizmasıyla anlam taşır. İki testten de düştü → konmaz.

**Karmaşıklık ölçeği — kolon sayısı karmaşıklık değildir:**

| Ne ekleniyor | Karmaşıklık maliyeti |
|---|---|
| Nullable öznitelik kolonu | ~Sıfır — kod yolu ve test doğurmaz |
| Zorunlu alan | Yüksek — her kurulumda veri hazırlığı, her import'ta ret |
| Yeni tablo / 1-N ilişki | Yüksek — join, CRUD ekranı, varsayılan seçimi, silme davranışı |
| Davranış/kural | En yüksek — test matrisini katlar |
| **Operasyonel geçiş (sayım, etiketleme)** | **En pahalı ve ertelenemez — yazılımla azalmaz** |
| Kullanıcı tanımlı alan motoru | Kalıcı kapsam dışı |

**B-7 eki — "yeni tablo pahalıdır" kuralının istisnası yoktur, ama alternatifi olabilir:**
B-7 Faz 1'e üç tablo ekledi. Gerekçe tablo sayısı değil, **alternatifin mali çekirdeği
kirletmesidir**. Bir tablonun maliyeti, o tablo olmadığında kullanıcının bulacağı hilenin
maliyetiyle karşılaştırılır.

### 0.1.1 Katalog mu, tanım tablosu mu? *(A-11)*

Genişlemesi beklenen listelerde ayrım şudur:

- **Kodda kapalı katalog:** her değeri ayrı **davranış** doğuruyorsa. Yeni değer = geliştirme.
  Örnek: A-8 `kural_kodu`, A-11 `OdemeYontemi.tip`, `StokKonum.tip`, cari hareket tipleri,
  **K-4 veri seti kataloğu**, **A-13 `cari_tip`**, **A-14 belge öneki kataloğu**.
  **A-15 ile sekizinci doğrulama:** tevsik uyarısı `OdemeYontemi.tip = NAKIT` değerine
  bağlanır — kural **`tip`'ten türer, satır adından değil**.
- **Kullanıcı tanım tablosu:** değerler **aynı davranışı** paylaşıp yalnız etiket/parametre
  farkı taşıyorsa. Yeni değer = satır ekleme. Örnek: `OdemeYontemi` satırları,
  `KargoFirma` satırları, `StokKonum` satırları, fiyat listeleri,
  **`VergiOrani` satırları (C-6)**, **`DisaAktarimSablonu` satırları (K-4, Faz 2)**,
  **`StokDuzeltmeSebep` satırları (B-7)**.

Tanım tablosu satırları **silinmez**, `aktif = false` yapılır (§0.2).

**Türev kural (B-4):** Bir yetenek tanım tablosuyla sağlanıyorsa **ayrıca toggle açılmaz**.
Çoklu depo "modu" yoktur; tabloda kaç satır varsa o kadar depo vardır. UI davranışı
**satır sayısından türetilir**.

**Türev kural (C-6):** Mevzuatın belirlediği sayı **koda gömülmez**. KDV oranı bir enum
değil tanım tablosu satırıdır; oran değişimi deployment değil, veri güncellemesidir.
K-4'ün "program adı kodda geçmez" ilkesinin vergi tarafındaki karşılığıdır.

**Türev kural (B-7, 29.08.2026) — testin doğru uygulanışı:** Ayrım, değerin **sistemde**
davranış doğurup doğurmadığına bakar; **sistem dışında** (müşavirde, denetçide) farklı
sonuç doğurması değeri kapalı katalog yapmaz. Stok düzeltme sebepleri sistemde aynı
davranışı paylaşır (stok düşer, mali sonuç yoktur, aynı yetki gerekir); ayrım yalnız
müşavirin KDV/gider değerlendirmesinde iş görür → **tanım tablosu**. C-6 `VergiOrani`
deseniyle aynı: mevzuat değişince satır eklenir, deployment gerekmez.

**Türev kural (C-1):** Sistemin **ürettiği** belge ile **dışarıda üretilen** belge farklı
sınıftır. Dış belgenin numarası, elle yazılan tek bir referans alanıdır (`takip_no` deseni);
dış belgenin **durumu, yanıtı, gönderim kaydı** ise modülün kendi tablosudur (K-4 §4).

**Türev kural (K-4, 28.08.2026) — ayrımın satış tarafındaki karşılığı:** Müşteri segmenti
ayrımı, **davranış farkı doğuruyorsa** yapılır. Yalnız **oran farkı** taşıyan ayrım
yapılmaz — şema, kod ve davranış aynıysa iki segment değil tek segment vardır. Bedava da
değildir: her sahte segment teklife ve satış konuşmasına bir dal ekler.
*(Somut örnek: "karma portföy" ile "ağırlıklı ÜTS" ayrımı açıldı ve aynı gün kapatıldı —
ikisi arasında tek bir teknik fark bulunamadı; bkz. §1.5 K-4 §(4) eki-e.)*

### 0.2 Muhasebe çekirdeği esnek değildir

Kayıt silinmez, geriye dönük düzeltilmez; **ters kayıtla** kapatılır. Bu bir müşteri
kararı değil, ürün kararıdır. Müşteriye "iptal edilsin mi" diye sorulmaz; "iptal olduğunda
operasyonda ne yapıyorsunuz" diye sorulur.

**C-3 eki:** Sistemde `DELETE` cümlesi kullanılmaz. Tek istisna, **hiçbir belgeye bağlı
olmayan** kayıtlardır (C-3 §6) — orada silinen şey muhasebe kaydı değildir.

**B-7 eki (29.08.2026) — tahliye vanası kuralı:** Operasyonda gerçekten olan bir olayın
sistemde **meşru bir kayıt yolu yoksa**, kullanıcı mali sonucu olan bir belgeyi amacı
dışında kullanır. Bu, §0.2'nin ihlalini *kullanıcı hatası* değil **tasarım hatası** yapar.
Her operasyonel gerçek için mali sonucu olmayan bir belge yolu bulunmalıdır.

### 0.3 Üç kademeli kısıt deseni

"Müşteriyi kısıtlayalım mı?" ikilemi bununla çözülür:

| Kademe | Ne zaman | Örnek |
|---|---|---|
| **Sert** | Veri bütünlüğü bozulur | Aynı lot iki kez tüketilemez, fiyat tarih aralığı çakışması (B-5), **VKN/TCKN format doğrulaması (A-13)**, **belgeli doktor kaydının silinememesi (C-3)** |
| **Yumuşak** | İş kuralı; istisna gerçek hayatta oluyor → yetki + gerekçe + log | Kontenjan aşımı, negatif stok, iskonto tavanı, **kongre yıllık destek limiti (K-6)** |
| **Bilgi** | Sadece uyarı | Kredi limiti aşımı (A-12), valör gecikmesi, süresi geçmiş teklif, **eksik fatura kimliği (A-13)**, **eksik/geç kongre bildirimi (K-6)**, **aynı gün nakit tevsik limiti aşımı (A-15)** |

**Dördüncü hâl — salt kayıt alanı (C-1):** Hiçbir kademeye girmeyen, uyarı bile üretmeyen
alanlar vardır. `Sevkiyat.takip_no`, `Sevkiyat.harici_irsaliye_no`,
**`StokDuzeltme.harici_belge_no`**, **`Doktor.muhasebe_kodu` (C-2)** ve
**`ImportParti.dosya_adi` (E-3)** böyledir: boş
bırakmak serbesttir, doğrulanmaz, hiçbir hesaba girmez, hiçbir adımı durdurmaz.
**Bilgi kademesiyle karıştırılmamalıdır** — bilgi kademesi uyarı gösterir, bu göstermez.
**Tüketicisi insan gözüdür; üzerine mekanizma kurulmaz.**

Yumuşak kısıtlar **tek bir genel mekanizmayla** kurulur. **A-8 ile netleşti:** bu mekanizmanın
adı ve tablosu `OnayBlogu`'dur; ayrı bir `LimitAsimi` tablosu açılmaz, limit aşımı bu
tablonun bir kural tipidir.

**Kademeler arası terfi (A-12):** Bir kural bilgi kademesinde başlayıp sonradan yumuşak
kısıta terfi edebilir. Terfi **config noktasıyla** tanımlanır, mekanizma A-8'de zaten
hazırdır; terfi maliyeti tek satırdır. Ters yön de geçerlidir.

**Sınır (C-3):** `OnayBlogu` **belge adımını durduran** onaylar içindir. Yönetimsel eylemler
(anonimleştirme, kayıt silme, limit değişikliği, **stok düzeltme — B-7**) `OnayBlogu`
kullanmaz; **yetki + zorunlu gerekçe + log** deseniyle yürür.

### 0.4 Hesaplar belge bazlıdır

Fiyat, iskonto, prim ve hakkediş hesapları **tek belgeye bakar**; dönemsel birikime bakan
hiçbir hesap bu fazda yapılmaz. Kümülatif barem, dönemsel ciro primi kademesi ve yıllık
alım taahhüdü kapsam dışıdır — hepsi geriye dönük düzeltme doğurur ve §0.2'ye çarpar.

**Sınırın doğru okunuşu (A-7 ile netleşti):** zamana bağlı olmak tek başına yasak değildir.
Yasak olan, **dönemsel birikime bakan ve mevcut belgeyi geriye dönük değiştiren** hesaptır.
Girdisi tek belge olan ve sonucu **yeni belge** olarak doğan hesap bu yasağa girmez.

**C-2 eki (29.08.2026) — tarih parametresi dönemsel birikim değildir:**
`hesaplaDoktorBakiye(doktor, tarih?)` ve `hesaplaStok(urun, konum?, tarih?)` geçmiş bir
tarih itibarıyla **okuma** yapar; hiçbir belgeyi değiştirmez, yeni belge doğurmaz.
Yasak olan **yazan** birikim hesabıdır, **okuyan** değil.

**K-6 eki (29.08.2026) — sayaç da yazmaz:** Kongre modülünün yıllık destek sayacı geçmiş
katılımları sayar ve yalnız **yeni** bir katılımda uyarı üretir. Mevcut hiçbir kaydı
değiştirmediği için §0.4'e çarpmaz.
**Buna karşılık "doktorun toplam alımından bütçe türetmek" §0.4'ün tam olarak yasakladığı
hesaptı** — kümülatif, birikimli ve iptalde geriye dönük düzeltme doğuran. K-6 ile kaldırıldı.

**Ekran kuralı (A-7, C-5):** **Her gün değişen, mutabakatı imkânsız hiçbir tutar ekranda
gösterilmez.** Canlı gecikme faizi, anlık kur çevirisi ("bugünkü kurla ≈ $X") ve benzeri
türetilmiş anlık tutarlar yasaktır. Gösterilen tutar ya belgenin kendi dondurulmuş
kaydıdır ya da hiç gösterilmez. Gerekçe: gösterge sayı, karar verilen sayı hâline gelir.

**Yuvarlama kuralı (C-6):** Türetilen tutarlarda yuvarlama **tek noktada ve tek yönde**
yapılır. Satır düzeyinde yuvarlanır; belge toplamı **satır toplamlarının toplamıdır**,
belge matrahından yeniden hesaplanmaz. İki hesap yolu iki farklı toplam demektir.

**Oran kuralı (X-1, 08.09.2026) — payı ve paydası farklı olan oran gösterilmez.**
Bir oran ancak pay ve payda **aynı vergi tabanında** ve **aynı zaman ekseninde** ise
gösterilir. "Tahsilat oranı" ikisini de ihlal ediyordu: pay brüt, payda matrah (C-6 §6);
pay vadeye, payda sevkiyata bağlı (A-7 vs. A-3). Böyle bir oran dönem filtresi eklense bile
düzelmez — **filtresiz hâli sonsuz, filtreli hâli yanlış** olur. Şüphede kalınırsa
**iki mutlak sayı, tabanı yazılı olarak ayrı ayrı** gösterilir; bölme yapılmaz.

**Taban etiketi kuralı (Ü-3, 09.09.2026) — tabanı yazılmayan tutar gösterilmez.**
Ekranda görünen **her para tutarının** yanında vergi tabanı yazılıdır: *KDV hariç* /
*KDV dahil*. Etiket serbest metin değildir; A sınıfı ekranlarda `hesaplaSatirTutarlari()`
çıktısından, diğerlerinde **ekranın sabit sınıfından** türer. X-1 §(1)'in *"iki mutlak
sayı, tabanı ekranda yazılı"* kuralının genelleştirilmiş hâlidir.
**Tek kolonda iki farklı tabanlı tutar gösterilmez** (Ü-3 §6).

**Zaman ekseni kuralı (E-1, 09.09.2026):** "gün" daima **`Europe/Istanbul` takvim
günüdür**; aralıklar **yarı açıktır** `[başlangıç, bitiş)`; nokta okuma (`tarih?`)
**o günün sonu** itibarıyladır. Sunucunun bulunduğu makinenin dilimi hiçbir yerde
belirleyici değildir.

### 0.5 Anka West referans müşteridir, spec değil

Cevapları **varsayılanımız** olur, tek gerçeğimiz değil.

### 0.6 Cevabı müşteride olan maddeler — varsayılan kaydı *(17.08.2026)*

Bazı maddelerin cevabı bizde değildir. Beklemek seçenek değildir: cevapsızlık koda
**varsayım** olarak sızar ve kimse karar vermeden sistem karar vermiş olur. Denetimde
çıkan dokuz farklı bakiye formülü bu mekanizmanın ürünüdür.

**Kural: cevapsızlığın davranışı yazılı olarak sabitlenir.** Böyle maddeler karar metni
yerine **üç alanlı varsayılan kaydı** taşır:

| Alan | Ne yazar |
|---|---|
| **Varsayılan davranış** | Cevap hiç gelmezse sistem ne yapar. Tek cümle, uygulanabilir. |
| **Cevabın değiştirdiği katman** | §0.1 triyajı: şema mı · davranış/config mi · yalnız sözleşme/teslimat mı |
| **Kilitlenme anı** | Cevabın **ücretsiz** değiştirilebildiği son nokta. Sonrasında ayrı faz olarak fiyatlanır. |

**Varsayılan seçme kuralı — "en olası" değil, "geri dönüşü en ucuz":** Belirsizlik altında
ölçü isabet değil, **hata maliyetinin asimetrisidir**. Yanlış çıktığında *eklenerek*
düzelen varsayılan, daha olası ama yanlış çıktığında *silinerek* düzelen varsayılandan
iyidir. Varsayılan davranış daima **en dar** olanıdır.

**C-1 eki — "durdurarak düzelen" varsayılan da kötüdür:** Bir cevabın olumsuz çıkması
projeyi belirsiz süreyle durduruyorsa, o varsayılan yanlış kurulmuştur. Doğru varsayılan,
olumsuz cevabı **ayrı fiyatlı bir yükseltmeye** çeviren varsayılandır (K-10 revizyonu §H).

**K-4 eki — eşik ölçülebilir mutlak sayıya bağlanır:** Bir modülün satılabilirlik eşiği
**oran** olarak değil, **mutlak adet** olarak tanımlanır. Gerekçe iki katlı: (1) oran
yanıltıcıdır — düşük oranlı yüksek hacimli müşteri, yüksek oranlı düşük hacimli müşteriden
daha çok fayda görür; (2) oran **satış anında ölçülemez**, dolayısıyla konuşmada tahmine
dönüşür ve §0.4'ün uyarısına çarpar: *gösterge sayı, karar verilen sayı hâline gelir.*

**Yeni durum işareti — 🟦:** varsayılan sabitlendi, cevap beklenmeye devam ediyor.
⬜ ile ✅ arasındaki üçüncü hâldir; madde Faz 1'i bloklamaz ama kapanmış da sayılmaz.
Cevap geldiğinde 🟦 → ✅ olur ve varsayılan ya teyit edilir ya değiştirilir.
~~**Kilitlenme anı geçmiş 🟦 maddeler otomatik olarak ✅ sayılır.**~~ *(kaldırıldı — 09.10.2026)*

**🟦 → ✅ geçişinin iki yolu vardır *(09.10.2026)*:**
(1) **Kilitlenme olayı belgeyle gerçekleşir:** imza, yazılı müşteri/müşavir beyanı vb.
Belge karar metnine **tarihiyle** yazılır (aşağıdaki sorumluluk sınırı).
(2) **Kayıt iç karar olarak yeniden sınıflandırılır:** cevabın müşteride olmadığı
anlaşılırsa kayıt varsayılan kaydı olmaktan çıkar, doğrudan karar olur ve kilitlenme anı
alanı düşer.
**Tarihin geçmesi tek başına hiçbir kaydı değiştirmez.** Kilitlenme anı geçmiş ama olayı
gerçekleşmemiş bir 🟦 madde **açık bulgudur**: ya yeni bir kilitlenme anı yazılır ya da
(2) uygulanır. *Gerekçe: otomatik ✅, alınmamış bir beyanı alınmış gibi gösterir ve
sorumluluk sınırını (aşağıda) sessizce deler — C-1'in 1 Ekim kaydı böyle kapanmış
görünüyordu (§3.3.c, 09.10.2026 revizyonu).*

**Yöntemin bilinen riski:** varsayılan, fark edilmeden kalıcı karara dönüşebilir.
İki koruma: (1) her 🟦 bir kilitlenme anı taşır — tarihsiz varsayılan, varsayımın kılık
değiştirmiş hâlidir; (2) her faz geçişinde 🟦 listesi tek tek gözden geçirilir.

**Sorumluluk sınırı:** Müşteri beyanına dayanan varsayılanlarda beyan karar metnine
**tarihiyle** yazılır ve gerekiyorsa sözleşmeye geçer (K-10 deseni). Amaç suçlama değil,
sonradan gelen değişikliğin tartışmasız biçimde **ayrı kalem** sayılmasıdır.

**Beyanın kalitesi ölçülebilir (C-1, 28.08.2026):** "Ürünlerimiz kapsam dışıdır" gibi genel
bir cümle ile **ürün ürün işaretlenmiş, müşavir imzalı ve tarihli liste** aynı şey değildir.
Mümkün olan her yerde beyan **satır düzeyine** indirilir; sorumluluk sınırı ancak o zaman
tartışmasız olur.

### 0.7 Mevzuata dokunan maddede önce araştır *(19.08.2026)*

Genel prensipten şema tasarlamak yeterli değildir; **gerçek zorunlu alan ve oran listesine
bakmak gerekir**. Bu kural on iki kez ölçülebilir fayda üretti:

- **C-6:** Müşteri "KDV sabit %20" dedi; mevzuat, Tıbbi Cihaz Yönetmeliği kapsamındaki
  cihazların (II) sayılı listede **%10** olduğunu gösterdi → tek oranlı tasarım iptal.
- **A-13:** VUK 230 ve e-Arşiv kuralları vergi dairesi/VKN'nin **koşullu zorunlu** olduğunu
  gösterdi → alanlar NOT NULL yapılmadı.
- **K-9:** KVKK md.9 (01.06.2024) yurt dışı sunucuyu standart sözleşme + 5 iş günü bildirim
  yükümlülüğüne bağladı → yurt dışı barındırma kalıcı olarak elendi.
- **C-1 (28.08.2026):** e-İrsaliye zorunluluğunun **10 milyon TL** eşiğe bağlı olduğu ve
  geçiş tarihinin **1 Temmuz 2026**'da dolduğu ortaya çıktı; ÜTS/karekod kapsamının
  **1 Ekim 2026**'da değişmesi K-10'un kilitlenme anını öne çekti.
- **C-2 (29.08.2026):** Müşavirin satış faturalarını **GİB'den** aldığı ve banka
  hareketlerini bankadan çektiği görüldü → "muhasebeye aktarım" kapsamı üçte bire indi;
  Luca'nın Excel fiş aktarımının **hesap kodu zorunlu** istemesi, fiş üretiminin bizde
  olmadığını kesinleştirdi.
- **B-7 (29.08.2026):** Stok düşüşünün vergisel sonucunun **sebebe göre değiştiği** ortaya
  çıktı (KDVK 30/c zayi vs. tutanaklı imha) → sebep alanı kozmetik etiket olmaktan çıkıp
  müşavirin karar girdisi hâline geldi.
- **K-6/C-4 (29.08.2026):** Tıbbi Cihaz Satış, Reklam ve Tanıtım Yönetmeliği md. 22'nin
  alımla ilişkilendirilmiş fayda vaadini yasakladığı görüldü → modülün **temel iş kuralı**
  (alımdan bütçe türetme) geçersiz sayıldı. **Bugüne kadarki en pahalı bulgu.**

- **X-1 (08.09.2026):** Prim, yargı kararlarında **ücret eki** sayılıyor (İş K. md. 32) ve
  sigorta primine esas kazanca dâhil; düzenli ödenen prim **işyeri şartı** hâline gelince
  tek taraflı azaltılması İş K. md. 22 kapsamına giriyor → satıcı raporu bir "gösterge"
  değil, **ödemenin dayanağıdır**; geriye dönük eksilten rapor üretilmez.
- **A-15 (08.09.2026):** Tevsik zorunluluğu (VUK mük. 257 / 459 sıra no'lu Tebliğ) sınırı
  575 sıra no'lu Tebliğ ile **30.000 TL**; Tebliğ **aynı gün–aynı kişi** ve **kısım kısım
  ödeme** kurallarını ayrıca örnekliyor, ceza **iki tarafa da** kesilebiliyor → aynı gün
  kuralı bizde hesaplanabilir, **kısım kısım kuralı hiçbir fazda hesaplanamaz** (K-2/A-7).

- **Ü-3 (09.09.2026):** KDV Kanunu md. 57 perakende satışta **etiket ve listede** KDV'nin
  dahil olup olmadığının belirtilmesini zorunlu tutuyor; yükümlülük **iç ekranı değil, dışarı
  giden çıktıyı** bağlar → Faz 1'de sistemden müşteriye giden fiyat çıktısı olmadığı için
  bugün dokunmuyor, **teklif çıktısı yazıldığı gün dokunur** (Faz 2 format katmanı).
- **E-1 (09.09.2026):** Türkiye 2016'dan beri **kalıcı UTC+3**; kış saati yok. Ama bu bir
  **karardır, doğa kanunu değil** → ofset koda gömülmez, **dilim adı** (`Europe/Istanbul`)
  kullanılır. C-6'nın "mevzuatın belirlediği sayı koda gömülmez" kuralının saat tarafı.
- **E-2 (09.09.2026):** KVKK Kişisel Veri Güvenliği Rehberi erişimin sınırlandırılmasında
  dört somut yöntem sayıyor; bunlardan biri **"ilişiği kesilen çalışan için zaman
  kaybetmeksizin hesabın kapatılması"** → pasifleştirme **anında** etkili olmak zorunda,
  dolayısıyla **JWT değil veritabanı oturumu**. *(Aynı rehberin periyodik parola değişimi
  önerisi güncel güvenlik pratiğiyle çelişiyor — çelişki yazılı, rotasyon konmadı.)*

**Mevzuat hareketlidir:** karar metnine daima *"(tarih itibarıyla, teyit edilmeli)"* notu
düşülür ve müşteri iletişimi öncesi güncel durum kontrol edilir.
**C-1 eki:** kaynaklar birbiriyle çelişebilir. **Çelişkinin kendisi bulgudur** ve kararı
bize değil, müşavire/hukukçuya havale etmenin gerekçesidir.

**K-6 eki — "sektörün pratiği" bir bulgu değildir:** Bir uygulamanın sektörde yaygın olması,
mevzuatın metnini değiştirmez. Yaygınlık bize **talebin gerçek ve tekrar edeceğini** söyler;
**talebi nasıl karşılayacağımızı** söylemez. Bkz. §0.9.

### 0.8 Muhasebeye karşı sorumluluk sınırı *(C-2, 29.08.2026)*

> **ERP'nin muhasebeye karşı sorumluluğu *ham operasyonel veri* düzeyindedir,
> *hesap kodu* düzeyinde değildir.**

Bu cümle K-4 §1 ile C-2'yi tek mantığa bağlar: **fiş üretmeme kararı, veri vermeme kararı
değildir.** İkisi karıştırıldığı için C-2 aylarca ⬜ kaldı.

Sınırın iki tarafı:

| Bizde | Müşavirde |
|---|---|
| Tahsilat kırılımı (GİB tahsili görmez) | Fatura kaydı (GİB'den gelir) |
| Cari hareket ve tarihli bakiye | Banka hareketi (ekstreden gelir) |
| Tarihli stok **miktarı** | Stok **değeri**, SMM, maliyet yöntemi |
| Sipariş/doktor/satıcı referansı | Hesap planı, fiş, denge, beyanname |

**Türev kural:** Bir talep hesap planı sahipliği gerektiriyorsa kapsam dışıdır. Hesap kodu
taşıyan her alan (`hesap_etiketi`, `muhasebe_kodu`) ya **salt kayıt alanıdır** (§0.3
dördüncü hâl) ya da **konmaz**; eşleme mekanizmasının girdisi olamaz.

### 0.9 Çekirdek sektörden bağımsızdır *(K-6/C-4, 29.08.2026)*

> **Çekirdek satılan şeydir; modül fiyatlanan şeydir.**
> Çekirdek evrensel, risksiz ve mevzuata uyumlu kalmalıdır. Sektöre özgü, regülasyona
> tabi veya firmadan firmaya değişen iş kuralları **modüle** gider.

§1.3'ün modülerlik deseni bugüne kadar yalnız teknik terimlerle savunuldu ("modül klasörü
silinince derleniyor mu"). Ticari gerekçe bu bölümdedir: **başka bir regülasyona tabi yeni
bir sektöre girildiğinde, çekirdeğe gömülmüş sektör kuralı teknik borç ve satış engelidir.**

**Türev kural — pratik/mevzuat ayrışması:** Fiilî sektör pratiği ile yazılı mevzuat
ayrıştığında, ürün **mevzuata göre** tasarlanır. Aksi hâlde yazılım, yasaklı bir pratiği
**otomatikleştiren araç** hâline gelir. *(İlk uygulaması K-4 §4-g: senaryo seçimini sistem
yapmaz. İkinci uygulaması K-6: bütçe alımdan türemez.)*

**Türev kural — gizlemek çözüm değildir:** Bir ilişkiyi kurup FK'sini kaldırmak ilişkiyi
ortadan kaldırmaz; otomatik türetme varsa kodda formül, veritabanında kazanım hareketi
vardır ve bu FK'den güçlü bir kayıttır. Doğru çözüm ilişkiyi **gizlemek** değil,
**kurmamaktır**.

---

## 1. Karar kütüğü

Durum: ⬜ açık · 🟨 soruldu, cevap bekleniyor · 🟦 varsayılan sabitlendi · ✅ karar verildi

### 1.1 Faz 1'i blokluyor

**Bu bölümde blokleyen madde kalmadı.** K-8'in şema riski K-9 ile kapandı (bkz. §1.6);
B-7 ile açılan son şema kalemi 29.08.2026'da kapandı (bkz. §3.2.a).

| # | Soru | Blokladığı | Durum | Karar | Tarih |
|---|---|---|---|---|---|
| **K-1** | Tahsilatı yapılmış sipariş iptal edilebilir mi? | F-03 | ✅ | İptal edilebilir. Sipariş `CANCELLED` olur, **kayıt silinmez**. Tahsilat cari hesapta kalır, sipariş borcu ters kayıtla düşer → bakiye avansa döner. İptal; **satıcı primi ve ciro** türevlerini **ters kaydeder**. *(Redaksiyon 13.09.2026 — X-6 §(10): "tahsilat oranı" **X-1 §(1) ile kalıcı olarak kaldırılmıştı**; kongre türevi **K-6 §(2) ile düşmüştü**.)* **K-6 eki (29.08.2026): kongre kredisi lotu kavramı kaldırıldığı için "tüketilen kredinin lota iadesi" hükmü düştü.** **Sevk edilmiş sipariş bu yoldan iptal edilemez — o iade sürecidir (A-1).** | 14.08.2026 · rev. 29.08.2026 |
| **K-2** | Fazla ödeme (avans) bakiyede nasıl görünmeli? | F-02 | ✅ | Ayrı avans kaydı **tutulmaz**. Cari bakiye tek ve işaretli hesaplanır (Σborç − Σalacak); negatif bakiye = avans. Ekranda **çıplak negatif sayı gösterilmez**, yön etiketiyle sunulur. Tüm ekranlar **tek bakiye fonksiyonunu** çağırır. Avans sonraki siparişte **otomatik mahsup** olur. **C-6 eki: bakiye KDV dahil (brüt) hesaplanır.** **C-2 eki: fonksiyon `tarih?` parametresi alır.** | 14.08.2026 |
| **K-3** | Kongre kontenjanı fiziksel mi idari mi? Aşım engellensin mi? | F-05 | ✅ | **Yumuşak kısıt.** Aşım engellenmez; yetkili rol gerekçeyle onaylar. Her aşım **ve her kapasite değişikliği** loglanır. **A-8 ile `OnayBlogu` tablosunda somutlaştı.** **Onay makamı: yönetici (admin).** **K-6 eki: kural kongre modülünün içindedir; modül kapalıyken çalışmaz.** | 14.08.2026 |
| **K-10** | **İzlenebilirlik / ÜTS ve tıbbi cihaz faturası kapsamı** | Şema, K-5, B-3 | 🟦 | Bkz. §1.4. **Normal satış faturası; lot/seri/GTIN/karekod tutulmaz, sigorta kolonu da konmaz.** **28.08.2026 revizyonu: paket bölünmez · Faz 1'e hiçbir kolon/tablo/bayrak eklenmez · UI'da görünmez · geçiş = fiziksel sayım, ayrı kalem · tetikleyici iki bağımsız yazılı talep · ÜTS kapsam bilgisi sözleşme ekinde.** **Kilitlenme anı:** ~~1 Ekim 2026~~ → **teyit metni 1. madde imzası, canlıya geçişten önce (10.10.2026)**. **07.09.2026: modül ertelendi; teknik yol notu eklendi (§1.4 §I).** **08.09.2026: erteleme saha verisiyle desteklendi; 1 Ekim kilitlenmesi ikiye ayrıldı — K-10 tetikleyicisi düştü, KDV teyidi K-7 §(7)'ye taşındı. ÜTS "kalıcı kapsam dışı" DEĞİL, "ertelenmiş"tir (tek görüşme kararı tersine çeviremez).** | 17.08.2026 · rev. 28.08 · 07.09 · 08.09.2026 |

### 1.2 Faz 2–3'ü etkiliyor

| # | Soru | Etkilediği | Durum | Karar | Tarih |
|---|---|---|---|---|---|
| **K-4** | Hangi muhasebe programı? e-Fatura kesiliyor mu, hangi entegratörle? | Ürün konumlandırması, Ü-5 | ✅ / 🟦 | **10.10.2026 ayrıştırma: mimari ✅ (iç karar), entegratör tespiti 🟦 — §1.5 başı.** **Cevap alındı, varsayılan sabitlendi.** Muhasebe programı **yok** (Excel); e-Fatura firma içinde bir çalışan tarafından **GİB portalından elle** kesiliyor; ayrıca dış mali müşavir var. Bkz. §1.5. **C-1 eki: irsaliye tarafı §3.3.c'de karara bağlandı.** **C-2 eki: müşavirin fatura tarafında bize ihtiyacı olmadığı doğrulandı (§3.3.d).** **07.09.2026 ertelemesi: API modülü Faz 3+'ta kalır; BYOI adapter'ı ve `IEBelgeSaglayici` arayüzü Faz 1'de YAZILMAZ (§1.5 §(4)-EK2).** **08.09.2026: §(6) FATURA HAZIRLIK VERİ SETİ MVP'ye alındı** — altıncı dışa aktarım veri seti, modül değil; sütun eşlemesi `export.sablonTanimi` ile konfigüre edilir; C-1 ihlal edilmez. | 17.08.2026 · rev. 07.09 · 08.09.2026 |
| **K-5** | Ürünler ÜTS kapsamında mı? Lot/seri takibi zorunlu mu? | Şema | ✅ | **Kapsam dışı.** Lot/seri/SKT takibi yapılmaz. Talep gelirse **ayrı faz olarak fiyatlandırılır**. → B-1, B-2 ✅ · **K-10 ile teyit edildi** | 14.08.2026 |
| **K-6** | Kongre modülü için hukuki görüş alınacak mı? | Modül varsayılanı | ✅ / 🟦 | **C-4 ile tek madde olarak karara bağlandı — bkz. §1.7.** Hukuki görüş **opsiyonel değildir**. Modülün temel iş kuralı (alımdan bütçe türetme) **geçersiz sayıldı** (Yönetmelik md. 22). Modül **ödül motoru değil uyum kütüğüdür**; pazarlama bütçesi **satıcı/bölge/kampanya bazlıdır ve elle atanır**. Varsayılan: modül **kapalı teslim**. | 29.08.2026 |
| **K-7** | Canlıya geçişte hangi veri, hangi formatta aktarılacak? | Ü-4, C-2, A-6, **K-8** | ✅ / 🟦 | Bkz. §1.9. **Asgari şablon sabitlendi** (`VergiOrani` **kodu**, ÜTS sütunu, ayrı açılış stoğu şablonu) · **veri standardizasyonu ayrı kalemdir**, Anka West'te bedelsiz ama teklifte **görünen satır** (§0.5) · **canlıya çıkış öncesi yazılı teyit zorunlu**. 🟦 kalan: gerçek dosyaların incelenmesi — **K-8 devreye alma kaleminin tek girdisi**. **08.09.2026 §(7): KDV oranı teyidi 1 Ekim'den canlıya çıkışa taşındı; ayrı liste istenmez, şablonun `VergiOrani` kodu sütunuyla müşteri doldurur.** | 14.08.2026 · rev. 07.09 · 08.09.2026 |
| **K-8** | Ticari model: lisans+bakım mı, abonelik mi? | Sözleşme | ✅ / 🟦 | ~~**şema riski**~~ → **K-9 ile kapandı (19.08.2026).** **07.09.2026 KARARI — bkz. §1.8.** Hibrit ve **üç kalemli**: devreye alma (peşin) · abonelik · opsiyonel modül. **Kullanıcı başına ve belge adedi başına fiyatlama kalıcı olarak yasak.** Askıya alma sözleşmede + süre; **askıya alma imha değildir, veri rehin alınamaz**. **K-8 koda hiçbir şey eklemez.** Rakam ve paketleme **bu dosyaya işlenmez** (§10). 🟦 kalan: asgari süre. | 07.09.2026 |
| **K-9** | Sunucu kimde — sizde mi, müşteride mi? | KVKK, yedek, C-7 | ✅ / 🟦 | Bkz. §1.6. **A bölümü ✅ (Türkiye zorunlu, izole veritabanı, yedek politikası, çıkış maddesi). B bölümü 🟦 (varsayılan: bizim yönettiğimiz Türkiye VPS).** | 19.08.2026 |

---

## 1.4 K-10 · İzlenebilirlik ve tıbbi cihaz faturası kapsamı — 🟦

**Müşteri beyanı (17.08.2026):** Faturalar **normal satış faturası** olarak kesiliyor;
`ILAC_TIBBICIHAZ` senaryosu kullanılmıyor. Ürünler arasında hastaya takılan ürünler
bulunmakla birlikte fatura pratiği aynı. Firma beyanına göre yakın vadede mevzuat
değişikliği beklenmiyor.
*(KDV "sabit %20" beyanı C-6 ile geçersizleşti — bkz. §3.3 C-6.)*

> ⚠️ **28.08.2026 notu — beyanın zayıf noktası:** "Yakın vadede mevzuat değişikliği
> beklenmiyor" beyanı alındığı gün de doğru değildi. ÜTS/karekod zorunluluğunun kapsamı
> **1 Ekim 2026**'da değişiyor. Beyan bu nedenle **genel cümle olmaktan çıkarılıp ürün
> düzeyine indirilmiştir** (§H).

**Mevzuat arka planı (28.08.2026 itibarıyla, teyit edilmeli):** İTS/ÜTS bildirimi yapılan
ürünler için `ILAC_TIBBICIHAZ` e-Fatura senaryosu kullanılıyor. Bu senaryoda tıbbi cihaz
satırlarında UNO, LNO (lot), SNO (seri), URT (üretim tarihi); ilaçta GTIN, parti, seri ve
SKT zorunlu — ve **kalem miktarı kadar ayrı kimlik satırı** gerekiyor. ÜTS/karekod
zorunluluğunun tam yürürlüğü **1 Ekim 2026**'ya ertelenmiş durumda; aynı tarih eczane ve
optisyenlik müesseselerinin senaryoya geçişi için de geçerli.
**Kaynaklar çelişiyor:** bir kısmı genel zorunluluğun 1 Ekim 2025'te zaten yürürlüğe
girdiğini, ertelemenin yalnız eczane/optisyen için olduğunu söylüyor. **Bu belirsizliğin
kendisi, kararın müşavire havale edilmesinin gerekçesidir** (§0.7).

> **KARAR:** Sistem **miktar bazlı stok** yürütür. Lot, seri numarası, GTIN, üretim tarihi,
> SKT ve karekod **tutulmaz**; **sigorta kolonu da konmaz** (§0.1). K-5 ve B-3 kararları
> geçerliliğini korur.
>
> **(1) Sorumluluk sınırı:** Karar **müşteri beyanına dayanır**. Sözleşmeye şu cümle girer:
> *"Sistem, satılan ürünlerin ÜTS/İTS tekil takip kapsamında olmadığı ve normal satış
> faturası düzenlendiği beyanına göre kurulmuştur."*
> **28.08.2026 eki:** bu cümlenin **kanıtı**, müşavir tarafından ürün ürün işaretlenmiş
> tarihli ve imzalı listedir (§H-G).
>
> **(2) Geçiş yolu — ayrı uygulama değil, ayrı modül:** Değişen tek şey stoğun biriminin
> *sayı* olmaktan çıkıp *kimlikli küme* olmasıdır ve bu **tek `hesaplaStok()` çağrı
> noktasından** geçer (B-4). Cari, prim, fiyatlandırma, teklif ve onay mekanizmaları
> **etkilenmez**.
>
> **(3) Modül kapsamı (yazıldığında):** stok birimi kimliği · sevkiyatta birim seçimi ·
> **barkod okuma — B-3 ile tek pakettir, ayrılamaz** · fatura satırında miktar kadar kimlik
> satırı · ÜTS alan eşlemesi. **B-7 eki: stok düzeltme belgesi de kimlik taşımak zorunda
> kalır.**
>
> **(4) Ürün konumlandırması:** İzlenebilirlik **opsiyonel modüldür**, ayrı faz olarak ve
> **ilk gerçek talep üzerine** fiyatlanır. **K-9 eki: yalnız Sınıf 1 (barındırmalı) kurulumda
> satılır.** *("İlk gerçek talep" tanımı §H-E'de somutlaştı.)*
>
> **(5) Gerçek sigortamız kolon değil mimaridir:** tek `hesaplaStok()`, `StokKonum`'un
> boyut deseni ve `belge_no`.
>
> **(6) C-3 eki — KVKK sınıf değişimi:** Modül geldiğinde "hangi ürün hangi hastaya"
> verisi doğarsa sistem **özel nitelikli kişisel veri** işlemeye başlar (KVKK md.6).
> Modül fiyatına **ayrı bir KVKK uyum kalemi** girer; C-3 §2 sınırı yeniden değerlendirilir.
> **28.08.2026 netleştirmesi:** sınırı bozan şey **lot takibinin kendisi değil, kimliğin
> hastayla ilişkilendirilmesidir**. Modül hastayla ilişki kurmadan da satılabilir.
>
> **Yan sonuç:** K-5 mikro-önerisi (`StockMovement.lot_no`) **kapandı — konmayacak**.

### §H · K-10 revizyonu — paketin devreye alma yolu *(28.08.2026)*

Esas karar **değişmedi**. Bu bölüm yalnız paketin **nasıl ve ne zaman** açılacağını sabitler.
Gerekçe ticaridir: ilk sürümde barkod tarayıcı ve kimlikli stok göstermek, müşterinin
beklentisini karşılıksız yükseltir; **gösterilen özellik dâhil sayılır, dâhil sayılan özellik
fiyatlanamaz.** Teknik gerekçe: servis katmanında hâlâ test yokken çekirdek bir kavramın
(stok birimi) tanımını değiştirmek riskin kendisidir.

> **(A) Paket tek ve bölünmezdir.** İçeriği: kimlikli stok birimi · sevkiyatta birim seçimi ·
> **barkod okuma** · ÜTS alan eşlemesi · e-belge satırında miktar kadar kimlik satırı.
> **Alt paket satılmaz.** Özellikle *"sadece e-Fatura ÜTS uyumu"* diye bir kalem **yoktur**.
>
> **(B) Faz 1'e hiçbir kolon, tablo veya bayrak eklenmez; ek dikiş yeri de açılmaz.**
> Çekirdekte bulunan tek şey mevcut dikiş yerleridir: `hesaplaStok()` (B-4) ·
> `StokKonum` boyut deseni (A-4) · `belge_no` (A-14) · `modulAcikMi()` (K-9) ·
> §1.3 modülerlik deseni. **Bugün `config` listesine de bir şey eklenmez.**
> **Gerekçe (§0.1.a eki):** boş kolon veri üretmez.
>
> **(C) İlk sürümde görünmez.** Barkod alanı, "yakında" etiketi, kapalı menü öğesi, demo
> ekranı **bulunmaz**.
>
> **(D) Geçiş şema işi değil, sayım işidir — bugünden yazılıdır.** Paket açıldığında geçmiş
> hareketler **kimliksiz kalır ve geçerliliğini korur**; kimlik yalnız **geçiş tarihinden
> sonraki** hareketlere uygulanır. Geçiş bir **fiziksel sayım ve etiketleme** çalışması
> gerektirir ve **paket fiyatına dâhil değildir, ayrı kalemdir**.
>
> **(E) Tetikleyici — "ilk gerçek talep"in tanımı.** Paket, **birbirinden bağımsız iki
> müşteri adayının yazılı talebi** üzerine yazılır. **Tek müşterinin talebi paketi
> tetiklemez**; o kuruluma özel iş olarak ayrıca fiyatlanır.
> **Ölçüm aracı koda değil satış sürecine konur:** her müşteri adayı görüşmesinde tek
> standart soru sorulur — *"ÜTS/İTS bildirimi yapıyor musunuz; faturalarınızda lot/seri
> zorunlu mu?"*
>
> **(F) Değişmeyen ekler:** paket yalnız **Sınıf 1 (barındırmalı)** kurulumda satılır (K-9) ·
> hastayla ilişki kurulursa özel nitelikli veri sınırı bozulur ve fiyata **ayrı KVKK uyum
> kalemi** girer (C-3 §2).
>
> **(G) Ürün bazında ÜTS kapsam bilgisi şemada tutulmaz.**
> · Müşaviriden C-6 kapsamında istenen ürün listesine **"ÜTS/İTS kapsamında mı"** sütunu
>   eklenir; **iki talep tek dosyada** gider.
> · Dosya **tarihli ve imzalı sözleşme eki** olarak saklanır; K-10 §1 beyanının **kanıtıdır**.
> · **Ürün import'u bu sütunu okumaz** (D-6). Aynı dosyanın **KDV oranı sütunu şemaya girer,
>   ÜTS sütunu girmez** — bu ayrım bilinçlidir.
> · **Beyan fotoğraftır, canlı veri değildir.** Paket yazıldığında **taze liste istenir**.
> · **Gerekçe:** ÜTS kapsamı, sistemin **hiçbir koşulda doğrulayamayacağı** ilk alan olurdu
>   (§0.1 C-1 eki); tek mercii TİTCK'dır.
>
> **(H) Liste "evet" dönerse ne olur — dal bugünden yazılıdır.**
> Bazı ürünlerin ÜTS kapsamında olduğu çıkarsa K-10 varsayılanı **çürümüş sayılır**, ancak
> **Faz 1 şeması yine de açılmaz** ve sistem miktar bazlı kalır. Değişen tek şey **sözleşme
> dilidir**; paket **canlıya geçişin ön koşulu değil, ayrı fiyatlı ilk yükseltme** olarak
> teklife eklenir. **Karar müşterinindir; yazılı olması bizimdir.**
>
> **Kilitlenme anı — DEĞİŞTİ:** ~~Faz 1 migration'ı~~ → ~~**1 Ekim 2026.**~~ → **teyit metninin 1. maddesinin imzası (müşavir imzalı ürün listesi), canlıya geçişten önce** *(10.10.2026)*.
> *10.10.2026 — geri not: 1 Ekim tetikleyici kilidi 08.09'da düşmüştü (§I-7) ama alan güncellenmemişti; tarih geçince kayıt §0.6'nın eski otomatik ✅ kuralıyla kapanmış görünüyordu. K-10 müşteri bilgisine bağlıdır ve **🟦 kalır**; kanıt §(G)'deki imzalı listedir.*

### §I · Erteleme kararı ve teknik yol notu *(07.09.2026)*

> **KARAR:** İzlenebilirlik/ÜTS modülü **açılmaz**. §H'nin tetikleyici kuralı
> (**iki bağımsız yazılı talep**) yürürlüktedir ve teknik kolaylık bu kuralın yerine geçmez.
> **Çekirdek önce oturur.**
>
> **(1) §0.7 bulgusu — teknik yol doğrulandı (05.09.2026, teyit edilmeli).**
> ÜTS bildirimi **aracı kuruma ihtiyaç duymaz** ve **GİB'den bağımsızdır**; firmalar e-imza
> yetkilisiyle oluşturdukları **Sistem Token** ile kendi otomasyon sistemlerinden Alma/Verme
> bildirimlerini yapabilir. **Kısıt:** token **firma başına en fazla 2 adettir** ve **yalnız
> firma imza yetkilisi** alabilir. Yani modül açıldığında onboarding'e **imza yetkilisinin
> masaya oturduğu bir adım** eklenir; bu adım hiçbir tasarımla ortadan kalkmaz.
>
> **(2) Bu bir bulgudur, karar değildir.** Not olarak durur; **modül olarak açılmaz.**
> *"Kolay olduğu için yaparız" §H'nin reddettiği gerekçedir.*
>
> **(3) Modülün kapsamı tek çağrı değildir.** Alma · Verme · Tüketiciye Verme · Kullanım ·
> Ödünç Verme · Geçici Kullanıma Verme ayrı servislerdir ve TİTCK zaman zaman **zorunlu alan
> ekler** (ör. Gerçek İşlem Tarihi). Sürekli bakım hattıdır — K-4 §4 bakım kuralına tabidir.
>
> **(4) Erteleme, veri toplamayı ertelemez.** §H-G yürürlüktedir: müşavir listesinde **ÜTS
> sütunu istenir** (§0.1.a ikinci test — veri geriye dönük üretilemez). **Ürün import'u bu
> sütunu okumaz** (D-6). **1 Ekim 2026 kilitlenme anı değişmedi.** *(10.10.2026 — geri not: kilit artık teyit metninin 1. madde imzasıdır, canlıya geçişten önce — §H sonu.)*
>
> **(6) SAHA BULGUSU *(08.09.2026)* — erteleme kararı pazar verisiyle desteklendi.**
> Stakeholder görüşmesinde alınan sinyal: *"ÜTS'ye bulaşmayın; sektörün acısı e-Fatura
> tarafında."* Bu, ertelemenin arkasına **tahmin yerine bir müşteri sesi** koyar.
> **Kararın kendisi değişmedi** — modül 28.08'den beri zaten Faz 1 dışındaydı; değişen,
> gerekçenin kanıta dayanması. *(§0.7: "sektörün pratiği" bulgu değildir; ama **talebin
> yokluğu** ölçülebilir bir sinyaldir.)*
> ⚠️ **Simetri kuralı:** §H-E modül **açmak** için **iki bağımsız yazılı talep** ister.
> Aynı ölçü tersine de geçerlidir: **tek görüşme bir kararı kalıcı kapsam dışına
> taşımaya yetmez.** ÜTS bu nedenle **"kalıcı kapsam dışı" değil, "ertelenmiş"** kalır.
> İkinci bağımsız kaynak gelirse §1.3'te kalıcı kapsam dışına alınabilir.
>
> **(7) 🔴 KİLİTLENME ANI İKİYE AYRILDI *(08.09.2026)*.** 1 Ekim 2026 iki ayrı işi
> taşıyordu; ikisi aynı şey değildir:
> · **(a) K-10 tetikleyici kilidi → DÜŞTÜ.** Modül ertelendi, saha talebi yok.
>   **1 Ekim baskısı K-10 için kalkmıştır.**
> · **(b) Ürün bazında KDV oranı teyidi → DÜŞMEDİ, YERİ DEĞİŞTİ.** Bu bir ÜTS meselesi
>   değil, **C-6/C-1 meselesidir** ve **K-4 §(6) ile önemi ARTMIŞTIR**: artık bizim
>   ürettiğimiz satır faturaya gidiyor. Talep **K-7 §(4) canlıya çıkış teyidine** taşınır.
> · **Müşterinin "şirket sırrı" itirazı haklı ama konuyla ilgisizdir:** fiyat listesi
>   istemiyoruz, **ürün başına KDV oranı** istiyoruz. Fiyat ticari sırdır; **vergi oranı
>   mevzuatın belirlediği bir olgudur, sır olamaz.**
>
> **(5) 🔴 Ek bulgu — beyanı çürütme ihtimali.** ÜTS kayıtlı tıbbi cihazlarda **indirimli KDV
> oranı** söz konusu olabiliyor *(kaynaklarda oran tutarsız; rakam yazılmaz)*. Bu, müşterinin
> **"KDV sabit %20"** beyanının (madde 10-c) yanlış olma ihtimalini somutlaştırır ve müşavir
> listesinin aciliyetini artırır. **C-6 · K-10 · C-1 aynı dosyaya bağlıdır.**

---

## 1.5 K-4 · Muhasebe, e-Fatura ve dışa aktarım mimarisi — ✅ / 🟦

> **Durum ayrıştırması *(10.10.2026)*.** Başlıktaki tek 🟦 hangi alt maddeye ait olduğunu
> yazmıyordu. Ayrıştırma:
> · **✅ iç karar — mimari:** §(1) kimlik katmanı · §(2) dikiş yeri ve veri seti kataloğu ·
>   §(3) şablon katmanı · §(4) entegrasyon katmanının yapısı ve §(4)-EK2 · §(5) fatura belgesi
>   dikiş notu · §(6) fatura hazırlık veri seti. Bunların cevabı müşteride değildir; kilitlenme
>   anı taşımazlar (§0.6 (2)). *Alt maddelerde yazılı "kilitlenme anı" satırları ücretsiz
>   değişiklik penceresini anlatır, 🟦 değildir.*
> · **🟦 müşteri bilgisine bağlı — entegratör tespiti:**
>
> | Alan | İçerik |
> |---|---|
> | **Varsayılan davranış** | Anka West'in entegratörü ve onun toplu yükleme şablonu bilinmeden e-belge adaptörü yazılmaz; fatura hazırlık çıktısı `export.sablonTanimi` değeri girilmeden devreye alınmaz. Kodda "standart" şablon yazılmaz (§(6)-b). |
> | **Cevabın değiştirdiği katman** | Yalnız config (`export.sablonTanimi`) ve modülün ilk adaptörü. Şema etkilenmez. |
> | **Kilitlenme anı** | Hangisi önce gelirse: **devreye alma** (`export.sablonTanimi` değeri — `FAZ1_UYGULAMA_KAPSAMI.md` §B.7) ya da **e-belge modülü yazımının başlangıcı** (C-1 §3.3.c, 10.10.2026 revizyon 2). |

**Müşteri durumu (17.08.2026):** Muhasebe programı **kullanılmıyor**; takip Excel'de elle
tutuluyor. e-Fatura firma içinde bir çalışan tarafından **GİB portalından elle** kesiliyor.
Dış mali müşavir var, kendisine dosya gidiyor.

**Teknik sonuç:** GİB portalının dış sistemlere açık API'si yoktur. Otomatik fatura
gönderimi **özel entegratör sözleşmesi** gerektirir.

> **KARAR:** Sistem fatura kesmez, muhasebe fişi üretmez, dış sisteme veri göndermez;
> hiçbir muhasebe programını veya entegratörü tanımaz. Program adı **kodda ve şemada
> geçmez**.
>
> **(1) Kimlik katmanı — Faz 1, geri dönüşü yoktur:** Her belge değişmez `belge_no` taşır
> (üretim deseni **A-14**'te karara bağlandı). Her belge `guncelleme_tarihi` taşır.
>
> **(2) Dikiş yeri — Faz 1:** Tüm dışa aktarımlar tek
> `calistirDisaAktarim(kod, parametreler)` fonksiyonundan geçer ve tek iç sözleşme
> döndürür: `{ kolonlar, satirlar }`. Format katmanı (Excel/CSV yazıcı) **iş kavramı
> tanımaz**. **Her veri seti sorgusu sayılan belgeler filtresini kullanmak zorundadır;
> dışa aktarımda inline `where` yasaktır.** Veri seti kataloğu **kodda kapalıdır**;
> Faz 1 kümesi: cari hareket, tahsilat, sipariş, stok, doktor listesi.
> **C-6 eki: tutar kolonları `hesaplaSatirTutarlari()`'ndan okunur.**
> **A-13 eki: doktor listesi veri seti vergi kimliği ve fatura adresi kolonlarıyla genişler.**
> **C-1 eki: sevkiyat veri seti `harici_irsaliye_no` kolonunu taşır.**
> **C-2 eki (29.08.2026): cari hareket, tahsilat ve stok veri setleri `tarih` parametresi
> alır; stok veri seti **tutar taşımaz**; `DZL` hareketleri ayrı işaretli çıkar (B-7).**
>
> **(3) Şablon katmanı — Faz 2, ayrı kalem:** `DisaAktarimSablonu` tanım tablosu. Kullanıcı
> **veri setinin içeriğini değiştiremez, yalnız görünümünü** değiştirir.
> Config noktası `export.sablonTanimi` Faz 1'de belirlenir, **açılmaz**.
> *Kapsam dışı, kalıcı:* formüllü/hesaplanmış kolon · veri seti birleştirme ·
> gruplama/pivot/ara toplam · koşullu satır filtresi · şablon versiyonlama ·
> kullanıcı tanımlı veri seti · **muhasebeleştirme mantığı içeren şablon (C-2)**.
>
> **(4) Entegrasyon katmanı — Faz 3+ · REVİZE 19.08.2026:** Opsiyonel modüldür ve **aynı
> veri seti sözleşmesini okur**. Gönderim durumu, dış sistem kimliği, yeniden deneme ve
> idempotency **modülün kendi tablosundadır** (`DisAktarimKaydi`). **Çekirdek belge
> tablolarına `dis_referans` veya `aktarildi_mi` kolonu konmaz.**
> **Revizyon:** Entegratör sözleşmesinin **müşteride olması artık ön koşul değildir.**
> · **Bayilik (Sınıf 1, tercih edilen):** entegratör sözleşmesi **bizdedir**; müşteriye
>   kontör satılır. **Kontör bakiyesi ve entegratör anahtarları müşteri örneğinde
>   tutulmaz** (K-9 kontrol düzlemi).
> · **Müşteri sözleşmesi (Sınıf 2):** müşteri kendi entegratör sözleşmesini getirir.
> **Bakım bedeli fiyata dahildir.**
> *10.10.2026 — geri not (C-1 §3.3.c revizyon 2): katman çekirdek sonrası ilk modüle öne
> çekildi. İlk adaptör **Sınıf 1'de müşterinin kendi entegratör sözleşmesi ve API
> kullanıcısıyla** çalışır — "müşteri sözleşmesi = Sınıf 2" eşlemesi ilk adaptör için geçerli
> değildir. Partnerlik ilk entegrasyon çalıştıktan sonra görüşülür.*
> *12.10.2026 — geri not: modül sınırı §1.3 §F (16); tetikleme, zamanlayıcı ve durum makinesi
> C-1 §3.3.c revizyon 3-(5), (6). Zamanlayıcı altyapısı modül v1 ile gelir ve fiyatlanmaz.*
> **C-1 eki (28.08.2026):** Bu modül **normal satış faturası** gönderir. `ILAC_TIBBICIHAZ`
> senaryosuyla fatura göndermek için **K-10 izlenebilirlik paketi de gerekir**.
>
> ---
> **§(4) EKİ — e-Fatura modülü ve senaryo ayrımı *(28.08.2026)***
>
> **(a) Karma portföy normaldir, istisna değildir.** Müşterinin ürünlerinin bir kısmının
> ÜTS/İTS kapsamında olması **modülün satılmasına engel değildir**. **Normal fatura yolu
> hiçbir müşteride boş değildir.**
>
> **(b) Senaryo faturaya göre seçilir, firmaya göre değil.** Faturada **tek bir** ÜTS/İTS
> kayıtlı kalem varsa **tüm fatura** `ILAC_TIBBICIHAZ` senaryosuna geçer. Bu faturalar için
> **K-10 paketi de gerekir**.
> *Sinsi sonuç: ÜTS ürünlerinin portföydeki payı düşük olsa bile **fatura payı** yüksek
> çıkabilir. Ürün listesine bakarak tahmin yürütülmez.*
>
> **(c) Ürün bazında ÜTS sınıfı modülle birlikte gelir.** Alan Faz 1'de **konmaz**
> (K-10 §H-B); e-Fatura modülü yazıldığında şemaya girer, çünkü tüketicisi o zaman doğar.
>
> **(d) Modül kapalı tarafa düşer (fail-closed).** Sınıfı boş olan **veya** ÜTS işaretli
> ürün içeren fatura **gönderilmez**; kullanıcı uyarılır ve mevcut yöntemine (portal)
> yönlendirilir. **Yanlış senaryoyla fatura göndermek, hiç göndermemekten pahalıdır.**
>
> **(e) Segment ayrımı yapılmaz; iki durum vardır.**
> · **Durum 1 — portföyde hiç ÜTS/İTS ürünü yok:** modül tüm fatura akışını karşılar.
> · **Durum 2 — portföyde ÜTS/İTS ürünü var (oranı ne olursa olsun):** modül normal
>   senaryolu faturaları gönderir; izlenebilirlik paketi **doğal yükseltmedir**.
>
> **(f) Satılabilirlik ölçüsü oran değil, mutlak adettir.** Ölçülecek sayı: **normal
> senaryolu aylık fatura adedi**. **İlk gerçek ölçümümüz Anka West canlıya geçtikten
> sonra alınacaktır.**
>
> **(g) Senaryo seçimini sistem yapmaz, kullanıcı da tahmin etmez.**
> **Sözleşme cümlesi:** *"Fatura senaryosunun doğru seçimi ve ürünlerin ÜTS/İTS kapsam
> bilgisi müşterinin ve mali müşavirinin sorumluluğundadır."*
> **Gerekçe:** fiilî pratik ile yasal yükümlülük bugün örtüşmüyor. Ürünü **pratiğe göre**
> tasarlarsak, kapsamdaki ürün için normal fatura göndermeyi **otomatikleştiren araç**
> hâline geliriz. **Sorumluluğumuz pratikten değil, beyandan doğar.** *(Bu gerekçe §0.9'da
> genel kural hâline getirildi ve K-6'da ikinci kez uygulandı.)*
>
> **(h) Kapsam sınırı her iki durumda da teklife yazılır.**
>
> **(5) Fatura belgesi — dikiş notu (19.08.2026):** Faz 1'de fatura belgesi **yoktur**; cari
> borç **sevkiyattan doğar** (A-3). İleride fatura belgesi eklenirse **borcun kaynağı
> değişmez**: fatura, sevkiyata bağlanan **ikinci bir belgedir** ve cari borcu yeniden
> doğurmaz.
>
> **Kilitlenme anı:** Faz 2 dışa aktarım tasarımının başlangıcı.

> ---
> **§(4) EK-2 — ERTELEME KARARI ve model karşılaştırması *(07.09.2026)***
>
> **KARAR: e-Fatura modülü Faz 3+'ta kalır. Faz 1'de hiçbir kod ve hiçbir şema alanı
> yazılmaz.** Gerekçe §(4)-f'nin kendisidir: *"İlk gerçek ölçümümüz Anka West canlıya
> geçtikten sonra alınacaktır."* Modülü ölçümden önce yazmak, ölçümün amacını ortadan kaldırır.
> Müşteri bugün e-faturasını GİB portalından elle kesiyor ve buna devam edebilir —
> **modül canlıya çıkış engeli değildir.**
> *10.10.2026 — geri not: "Faz 3+'ta kalır" hükmü değişti — modül **çekirdek sonrası ilk
> modüldür** ve ikinci müşteriye satıştan önce hazır olmalıdır (C-1 §3.3.c revizyon 2).
> "Faz 1'de kod ve şema alanı yazılmaz" ile (a) ve (b) aynen geçerlidir; "canlıya çıkış
> engeli değildir" hükmü de geçerlidir — çekirdek deneme teslimi entegrasyonsuz yapılır.*
>
> **(a) `IEBelgeSaglayici` arayüzü de yazılmaz.** Sıfır implementasyonlu arayüz, test
> edilmeyen ve çürüyen koddur; K-10 §H-B'nin `modulAcikMi()` için söylediğinin aynısıdır.
> **Gerçek mimari gereklilik bir dosya değil bir özelliktir:** fatura verisi belgeden
> derlenebilir olmalı, yani iş mantığı `actions.ts` ve UI'a dağılmamalı, **servis katmanında
> durmalı**. Arayüz, adapter yazıldığı gün bir günlük iştir; dağılmış iş mantığını toplamak
> bir haftalık iştir. **Hazırlık = servis katmanı testleri + X-1/X-2/X-3/Ü-3.**
>
> **(b) Faz 1'de konmayacaklar — açıkça:** `Urun.uts_sinifi` (§(4)-c) · `lot_no` · `seri_no` ·
> `gtin` · `karekod` · `skt` · `UrunBarkod` · `modulAcikMi()`'ye e-fatura/izlenebilirlik kodu ·
> UI'da "yakında" etiketli menü. **Sigorta kolonu bile konmaz** (§0.1, K-10 eki).
>
> **(c) Zaten hazır olanlar — başka gerekçelerle konmuştur, bedava gelir:**
> A-13 (VKN/TCKN, `fatura_` alanları, `cari_tip`) · C-6 (`hesaplaSatirTutarlari()`,
> `VergiOrani`, satır düzeyinde yuvarlama) · A-14 + C-1 (`belge_no` iç/dış ayrımı,
> `harici_belge_no`) · B-4 (`hesaplaStok()` tek geçiş kapısı) · K-9 (kontrol düzlemi ayrımı).
> **Doğru mimarinin ödülü budur; e-Fatura için ayrıca hiçbir şey yapılmadı.**
>
> **(d) §0.7 bulgusu — üç ticari model *(05.09.2026, teyit edilmeli)*.**
> Belge formatı (UBL-TR) standarttır, **entegratör API'leri değildir**: kimi REST kimi SOAP,
> kimlik doğrulama, mükellef sorgulama uçları, durum makinesi ve hata kodları farklıdır.
> Ortak olan **veri modeli**, değişen **protokol**. Özel entegratörler yazılım firmalarına
> **bayilik/iş ortaklığı** programı sunar; toplu kontör alıp kendi müşterisine satan yazılım
> firmaları kontör geliri de elde eder. **Ama satıcının kendisi bile "her entegratörü ayrı
> ayrı desteklemek yazılım firması için gerçekçi değildir" der.**
>
> | | Al-Sat (bayilik) | Partnerlik (komisyon) | BYOI |
> |---|---|---|---|
> | Yasal risk | Yüksek | **Düşük** | Orta |
> | Nakit bağlama | Var (kontör stoğu) | Yok | Yok |
> | Operasyonel yük | Yüksek | **Düşük** | **Çok yüksek** |
> | Gelir | En yüksek | Küçük, kontrolsüz | **Sıfır** |
> | Teknik borç | Orta (**kontör kütüğü**) | **En düşük** | **En yüksek (N bakım hattı)** |
> | Arıza anında suçlanan | Biz | Sözleşmeyle net | Biz |
>
> **(e) Sıralama yönü — geri dönüşü en ucuz olan (§0.6).** Partnerlik → Al-Sat geçişi
> **eklemelidir** (aynı adapter'ın üstüne kontör kütüğü konur). Al-Sat → Partnerlik geçişi
> **çıkarmalıdır** (canlıda bakiye tutan kütük sökülür, müşteri sözleşmesi taşınır).
> Dolayısıyla **§(4)'ün "bayilik tercih edilen" ifadesi doğru hedef, yanlış başlangıçtır**:
> **ilk kurulumda partnerlik/komisyon**, bayilik **ikinci–üçüncü müşteriden sonra**.
> *Bir tedarikçiye tüm müşterilerin fatura akışını bağlamadan önce onunla bir müşteri boyunca
> çalışmış olmak, satın alınabilecek en ucuz bilgidir.*
> *10.10.2026 — geri not: sıra netleşti — ilk kurulumda **müşterinin mevcut entegratörüne
> müşterinin API kullanıcısıyla** bağlanılır (partnerlik şartı yok); o entegratör partner
> adayıdır ve **partner görüşmesi ilk entegrasyon çalıştıktan sonra** yapılır. Yukarıdaki
> gerekçe ("bir müşteri boyunca çalışmış olmak") bu sırayı destekler. BYOI ürün stratejisi
> değildir (C-1 §3.3.c revizyon 2-a).*
>
> **(f) Al-Sat'ın gizli maliyeti gelirde değil bilançodadır.** Kontör peşin alınır (nakit
> bağlanır); müşteri ödemezse entegratöre borç bizde kalır. **Bayilik sözleşmesinde
> kullanılmayan kontörün iade edilip edilmediği sorulmalıdır.** Ayrıca kontör kütüğü **para
> tutan bir alt sistemdir** (bakiye, rezervasyon, idempotency, çift-harcama) ve K-9 gereği
> **müşteri veritabanında tutulamaz** → **merkezî kontrol düzlemi** gerektirir.
>
> **(g) BYOI'de kimlik bilgisi kuralı — kalıcı.** Müşterinin entegratör **parolası hiçbir
> koşulda alınmaz**; yalnız **müşteri adına düzenlenmiş entegrasyon anahtarı** kullanılabilir.
> Gerekçe: parola hesabın tamamına erişimdir (geçmiş fatura, iptal, ayarlar); çoğu entegratör
> sözleşmesi kimlik bilgisinin üçüncü tarafla paylaşılmasını yasaklar; ve KVKK açısından
> **ikinci bir veri işleyen** doğar. §(4)-d fail-closed ile birleştiğinde: parola entegratör
> tarafında sessizce değişir, **sistem faturayı durdurur ve bunu müşteri fark ettiğinde
> öğreniriz**.
>
> **(h) Satış dili — bugünden bağlayıcı.** *"e-Fatura entegrasyonumuz var"* ve *"tüm
> entegratörleri destekliyoruz"* **denmez** (K-10 §H-C: gösterilen özellik dâhil sayılır).
> Modül geldiğinde kullanılacak cümle: *"e-Fatura altyapısını GİB onaylı özel entegratör X
> ile birlikte veriyoruz; sözleşmeniz doğrudan onlarla, fatura bizim ekranımızdan çıkıyor."*
> Satış görüşmelerine **K-10 §H-E standart sorusunun ikizi** eklenir:
> *"e-faturanızı bugün nereden kesiyorsunuz; özel entegratörünüz var mı, hangisi?"*
>
> **(i) Kilitlenme anı:** modül yazımının başlangıcı. **Ölçüm: Anka West canlıya geçtikten
> sonraki normal senaryolu aylık fatura adedi** (§(4)-f, mutlak adet).

> ---
> **§(6) FATURA HAZIRLIK VERİ SETİ — ✅ MVP'DE *(08.09.2026)***
>
> **Saha bulgusu (stakeholder görüşmesi, 08.09.2026):** Sektörde acı veren şey ÜTS değil,
> **e-Fatura girişinin elle veri kopyalama yükü**. Talep: *"faturaya hazır çıktı üretin."*
> Bu, dosyadaki en somut ilk **pazar verisidir** — ve §0.5 gereği hâlâ **tek kaynaktır**;
> spec değil, sinyaldir.
>
> **KARAR:** Sistem, sevkiyat/sipariş verisinden **fatura hazırlık veri seti** üretir. Bu
> **K-4 §2'nin altıncı veri setidir** ve `calistirDisaAktarim()` üzerinden çalışır.
> **Yeni modül değildir, opsiyonel değildir — MVP'dedir.**
>
> **(a) C-1 ihlal edilmez — açıkça yazılır.** Üretilen çıktı **UBL değildir**, imzalanmaz,
> gönderilmez, belge numarası taşımaz, GİB'e ulaşmaz. **Belge hâline getiren müşteri ve
> entegratördür.** *"Sistem hiçbir e-belge üretmez"* kalıcı kararı **yürürlüktedir**.
> **Ama risk sıfır değildir, azalmamıştır — artmıştır:** bugüne kadar faturaya hiç
> dokunmuyorduk; artık VKN, unvan, kalem, **KDV oranı ve tutar** içeren, tek tuşla faturaya
> dönüşen bir dosya üretiyoruz. Bu cümle karar metninde durur ki bir sonraki turda
> *"zaten fatura kesiyoruz"* noktasına kaymayalım.
>
> **(b) §0.7 bulgusu — standart format YOKTUR.** Toplu Excel yükleme entegratörlerde yaygın
> bir özelliktir (hazır şablona satırlar girilir, panele geri yüklenir, toplu fatura
> düzenlenir). **Ancak her sağlayıcı kendi şablonunu verir** ve sütun adları ile doğrulama
> kuralları **portal sürümüne göre değişir**. Bu, BYOI'de reddettiğimiz **N-sağlayıcı
> probleminin Excel kılığıdır**.
> → **Sütun eşlemesi konfigüre edilir, kodda sabitlenmez:** `export.sablonTanimi`
> (§4'te zaten tanımlı config noktası). Sabit kodlanmış "standart e-fatura Excel'i"
> **yazılmaz**; sağlayıcı sütun adını değiştirdiği gün **sessizce bozulur** (§0.1).
>
> **(c) Entegratör adı kodda ve şemada geçmez** — K-4 §4 kuralı aynen geçerlidir.
> Şablon tanımı **veridir**, kod değildir.
>
> **(d) 7 gün uyarısı — §0.7 bulgusu.** VUK'a göre e-Fatura ve e-arşiv fatura **geriye dönük
> en fazla 7 gün** öncesine kadar düzenlenebilir; aşımda **özel usulsüzlük cezası** uygulanır.
> **Toplu çıktı mantığı aylık çalışamaz.** Sevk tarihi 7 günü aşan satırlar için **bilgi
> kademesi uyarısı** üretilir (§0.3) — **engellenmez, `OnayBlogu` kullanılmaz**.
> *Sistem tarih hesaplar; vergisel sonucu hesaplamaz (B-7 §8 deseni).*
>
> **(e) Veri seti sayılan belgeler filtresine tabidir:** `TEKLIF` · `ACILIS` ·
> `KonsinyeCikis` · `VADE_FARKI` · `StokTransfer` · `StokDuzeltme` (+ bedelsiz satırlar).
> **Yedinci uygulama.**
>
> **(f) KDV oranı `VergiOrani` tanım tablosundan gelir** (C-6). `Urun` üzerinde `vat_rate`
> benzeri **sayısal kolon konmaz**; oran satır düzeyinde `hesaplaSatirTutarlari()` ile
> hesaplanır ve **belge toplamı = Σ satır** kuralı çıktıda da geçerlidir (§0.4).
>
> **(g) Fatura muhatabı A-13 alanlarından gelir** (`vkn_tckn`, `cari_tip`, `fatura_unvani`,
> `vergi_dairesi`, `fatura_adresi`). **Yeni alan gerekmez** — A-13 kendi gerekçesiyle
> konmuştu; çıktı onu tüketir.
>
> **(h) Kapsam dışı — K-4 §(4) modülünde kalır (Faz 3+):** gönderim · durum takibi ·
> iptal/itiraz · mükellef sorgulama · entegratör API'si · kontör · fail-closed davranışı ·
> `IEBelgeSaglayici` arayüzü.
>
> **(i) Satış dili.** *"e-Fatura entegrasyonumuz var"* **denmez** (K-10 §H-C).
> Denecek olan: *"Faturalarınızı entegratörünüze toplu yükleyebileceğiniz dosyayı
> hazırlıyoruz."* **Vaat edilen şey gönderim değil, veri hazırlığıdır.**
>
> **(j) Fiyatlandırma:** çekirdeğin parçasıdır, **ayrı modül olarak fiyatlanmaz**
> (K-8 §(3) modül tanımına girmez — tanımlı liste dışıdır).
>
> **Kilitlenme anı:** Faz 2 dışa aktarım tasarımının başlangıcı (K-4 §2 ile aynı).

**Ürün kuralı — üçüncü kez çıktı (D-1, D-3, K-4):** Dış sistem entegrasyonu **opsiyonel
modüldür**, **sağlayıcı başına ve bakım dahil** fiyatlanır.
**K-9 eki (dördüncü doğrulama):** opsiyonel modüllerin tamamı **yalnız Sınıf 1
(barındırmalı) kurulumda** satılır.

---

## 1.6 K-9 · Sunucu, barındırma ve yedekleme *(C-7 dahil)* — ✅ / 🟦

**Mevzuat bulgusu (19.08.2026, teyit edilmeli):** 01.06.2024'te yürürlüğe giren KVKK md.9
değişikliğiyle yurt dışına aktarımda açık rıza **istisna**, uygun güvenceler **asıl yöntem**
hâline geldi. Standart sözleşmeler imzadan sonra **5 iş günü içinde** Kurul'a bildirilmek
zorunda; bildirmeyene **50.000 – 1.000.000 TL** idari para cezası. **Yurt dışındaki bir
VPS'e veya nesne deposuna veri yazmak yurt dışına aktarımdır** — yedekler dâhil.

### A. Bize ait, müşteri cevabından bağımsız — ✅

> **(1) Veri ve yedekler Türkiye sınırları içinde barındırılır.** Uygulama sunucusu,
> veritabanı, yedekler ve varsa nesne deposu; hepsi Türkiye'de yerleşik sağlayıcıda.
> **Yurt dışı sağlayıcı kullanılmaz.** Bu **kalıcı ürün kararıdır**.
>
> **(2) Kurulum modeli: müşteri başına izole veritabanı ve izole uygulama örneği.** Ortak
> veritabanı kullanılmaz. **`tenant_id` hiçbir tabloya konmaz** (§0.1).
> **K-8 eki: bu kararla K-8'in şema riski ortadan kalkmıştır.** Bedeli: her müşteri ayrı
> container + ayrı migration + ayrı yedek; ~20 müşteriye kadar elle yönetilebilir.
> **Yan kazanç:** izolasyon aynı zamanda KVKK md.12 teknik tedbiridir.
>
> **(3) Yedekleme politikası — C-7:**
> · **Günlük otomatik veritabanı yedeği**, şifreli, **sunucudan ayrı fiziksel konumda**
>   (Türkiye içi)
> · Saklama: **günlük 14 gün + haftalık 8 hafta + aylık 12 ay**
> · **Üç ayda bir geri dönüş testi**, sonucu yazılı kaydedilir — *test edilmemiş yedek
>   yedek değildir*
> · **Yapılandırma yedeğe dahildir; anahtarlar yedekle aynı yerde durmaz**
> · ⚠️ **E-3 düzeltmesi (09.09.2026):** bu maddede önce *"yüklenen dosyalar"* yazıyordu ve
>   **hiçbir kararı olmayan bir yeteneği varsayıyordu**. Faz 1'de **kullanıcı tarafından
>   yüklenen kalıcı dosya yoktur** (E-3). Dosya eki açılırsa yedek ve imha politikası
>   **aynı maddede** genişletilir.
>
> **(4) Migration kuralı sertleşiyor.** Prod migration **elle** kalır. Ek şart: **her
> migration öncesi elle yedek alınır ve alındığı doğrulanır.**
>
> **(5) Veri müşterinindir — çıkış maddesi.** Sözleşme sona erdiğinde müşteri, verisinin
> **tam kopyasını** açık formatta (veritabanı dökümü + K-4 veri setlerinin Excel/CSV
> çıktısı) alır. Teslimden sonra veri **azami 30 gün içinde** imha edilir ve imha yazılı
> bildirilir. **Ürünleşmenin en önemli güven sinyalidir; pazarlıkta taviz verilmez.**
>
> **(6) Veri işleyen ek protokolü zorunludur** (C-3 §8).
>
> **(7) İzleme asgarisi (teslim şartı, özellik değil):** uygulama erişilebilirlik kontrolü ·
> container yeniden başlatma politikası · disk doluluk uyarısı · yedek başarısızlık uyarısı.

### B. Kurulum sınıfları — 🟦 varsayılan kaydı *(19.08.2026 revizyonu)*

> **İki kurulum sınıfı vardır; üçüncüsü kalıcı olarak kapsam dışıdır.**
>
> **Sınıf 1 — Barındırmalı abonelik *(ürünün ana hattı, varsayılan)***
> Bizim yönettiğimiz Türkiye'deki VPS · müşteri başına izole veritabanı ve izole uygulama
> örneği · abonelik, modül yetkisi ve kontör **bizim kontrolümüzde**. **Opsiyonel modüllerin
> tamamı (e-Fatura, bildirim, kargo API, izlenebilirlik, KVKK imha paketi, kongre ve teşvik)
> yalnız bu sınıfta satılır.**
>
> **Sınıf 2 — Müşteri sunucusu *(lisans + bakım, ayrı kurulum bedeli)***
> Kurulum ve yedekleme sorumluluğu müşteriye geçer. **Kontör satışı yapılmaz.**
> **Talep gelmedikçe teklif edilmez.**
>
> **Kalıcı kapsam dışı — Sınıf 3:** ortak veritabanlı gerçek çok kiracılı SaaS.
>
> **Gerekçe:** Ticari model üç şey satar — abonelik, modül bedeli, kontör. Üçü de aynı
> teknik zorunluluğu doğurur: erişimin uzaktan durdurulabilmesi, modül yetkisinin müşteri
> tarafından değiştirilememesi, kontör bakiyesinin bizim tarafımızda tutulması. **Bu bir
> güven meselesi değil, mimari meseledir.**
>
> **Kontrol düzlemi — Faz 1'de kurulmaz, dikişi bırakılır:**
> Abonelik durumu, modül yetkileri ve kontör bakiyesi **müşteri veritabanında tutulmaz**.
> Faz 1'de tek müşteri olduğu için bunlar yapılandırmadan okunur — ama **tek çağrı
> noktasından**: `modulAcikMi(kod)`. `process.env.MODULES` benzeri **doğrudan okuma
> yasaktır**.
> **K-10 §H-B eki: Faz 1'de `modulAcikMi()`'ye izlenebilirlik kodu eklenmez.**
> **K-6 eki: `modules.congress` bu fonksiyondan okunur ve Faz 1'de `false`'tur.**
>
> **Entegratör anahtarları ve kontör kütüğü hiçbir koşulda müşteri örneğinde bulunmaz.**
> *12.10.2026 — açıklama: yasak **entegratör anahtarları ve kontör kütüğü** içindir. **Kargo
> anahtarları** müşterinin kendi kargo sözleşmesine aittir (D-3) ve **müşteri örneğinde şifreli
> tutulabilir.** Entegratör anahtarı için alt hesap ayrımı önerisi bu cümleyle çeliştiği için
> uygulanmadı — C-1 §3.3.c revizyon 3-(4).*
>
> **Varsayılan davranış:** Sunucu **bizim yönettiğimiz, Türkiye'de bulunan VPS'tedir**
> (Sınıf 1); barındırma, yedekleme ve güncelleme bize aittir ve aylık bedele dahildir.
>
> **Cevabın değiştirdiği katman:** Yalnız **sözleşme ve teslimat**. §0.1 triyajında
> **üçüncü kova**.
>
> **Kilitlenme anı:** **Canlıya geçiş öncesi kurulum.**
>
> **Neden bu varsayılan (geri dönüşü en ucuz):** Bizde barındırma yanlış çıkarsa, müşteriye
> kurulum **eklenerek** düzelir; tersi veri taşıma ve kesinti demektir.

### Kapsam dışı (K-9)

Yüksek erişilebilirlik, failover, çoklu bölge, replika, otomatik ölçekleme, Kubernetes ·
**uptime SLA taahhüdü** (yanıt süresi taahhüdü verilir, çalışma süresi verilmez) ·
7/24 nöbet · felaket kurtarma merkezi · sıcak yedek · otomatik prod migration ·
merkezi log toplama, APM, dağıtık izleme · müşteri tarafından yedek indirme ekranı.

---

## 1.7 K-6 + C-4 · Kongre modülü, hukuki görüş ve teşvik mimarisi — ✅ / 🟦 *(29.08.2026)*

**Mevzuat bulgusu (29.08.2026 itibarıyla, teyit edilmeli)** — Tıbbi Cihaz Satış, Reklam ve
Tanıtım Yönetmeliği:

- **md. 21/2 — destek serbest ama sınırlı:** Satış merkezleri sağlık meslek mensuplarına
  kongre, sempozyum gibi yurt içi/yurt dışı bilimsel toplantılara katılım desteği
  verebilir. Toplantının kişinin uzmanlık veya görev alanıyla ilgili olması zorunludur.
  **Bir personel aynı yıl içinde toplam dört kez** bu destekten yararlanabilir; bu dördün
  **yalnız ikisi aynı satış merkezi tarafından** sağlanabilir ve **yalnız ikisi yurt dışı**
  toplantılarda kullanılabilir.
- **md. 21/6 — bildirim:** Düzenlenecek veya katkıda bulunulacak toplantılar için her
  toplantıdan **en az on beş gün önce** içerik, muhtemel katılımcı listesi ve masraf
  kalemleri Kuruma bildirilir; bildirimler **on iş günü** içinde cevaplanır, cevaplanmazsa
  onay verilmiş sayılır.
- **md. 22 — asıl bulgu:** Tanıtımlarda, cihazın **reçete edilmesi, kullanılması, alınması
  veya önerilmesi için** para veya hediye vererek, herhangi bir maddî kazanç sağlayarak
  **veya bir fayda ya da ödül sözü vererek** sağlık meslek mensupları teşvik edilemez;
  onlar tarafından da teşvik talep ve kabul edilemez.

**Bulgunun koda karşılığı:** Modülün bugünkü iş kuralı *"doktor bütçesi = iptal edilmemiş
toplam alım"*, md. 22'nin tarif ettiği şeyin kendisidir: alımla ilişkilendirilmiş, önceden
vaat edilmiş, tutarı satış hacminden türeyen bir fayda. Üstelik otomatik olduğu için vaadin
ispatı da sistemin içindedir. **İkinci ve bağımsız itiraz:** kural §0.4'ün yasakladığı
kümülatif birikim hesabıdır.

> ⚠️ **Sınır:** Bu bir hukuki görüş değildir. Tespit daha dar ve daha kesindir:
> **yönetmeliğin metni ile modülün iş kuralı doğrudan karşı karşıyadır.**

**Değerlendirilen ve elenen alternatif:** "Kazanımı soyut bir *pazarlama bütçesine*
yansıtıp kongre harcamasından FK ile ayırmak" önerisi tartışıldı ve **reddedildi**:
(1) otomatik kazanım varsa kodda formül, veritabanında kazanım hareketi kalır — bu FK'den
güçlü bir kayıttır, ilişki gizlenmiş olur, kaldırılmış olmaz; (2) *"herhangi bir maddî
kazanç"* ifadesi etikete değil doğaya bakar; (3) K-4 §4-g'nin reddettiği "sektör pratiği"
argümanının aynısıdır. Bkz. §0.9.

> **KARAR:**
>
> **(1) Hukuki görüş opsiyonel değildir; alınacaktır.** K-6'nın "alınsın mı?" sorusu
> kapanmıştır. **Görüşü müşteri kendi hukuk danışmanından alır; biz görüş üretmeyiz.**
>
> **(2) "Alımdan bütçe türetme" kaldırıldı.** *Doktor bütçesi = iptal edilmemiş toplam alım*
> kuralı modülden çıkar. **Bu kural yeniden yazılmadan modül hiçbir müşteriye açılmaz.**
> Yan sonuç: FIFO kredi lotu, bir yıllık geçerlilik ve iptalde lota iade mekanizmalarının
> tamamı **gereksizleşir ve silinir** (F-05 revizyonu).
>
> **(3) Modülün yeni tanımı: ödül motoru değil, uyum kütüğü.** Kayıt birimi doktorun
> bakiyesi değil, **etkinlik + katılımcıdır**.
>
> **(4) Teşvik bütçesinin sahibi doktor değildir — Seçenek A.**
> `PazarlamaButcesi` sahibi **satıcı · bölge · kampanya** + **dönem**'dir.
> · Bütçe **elle atanır** (`TAHSIS` hareketi), hiçbir satış verisinden türetilmez.
> · Her tahsis **zorunlu gerekçe** taşır ve loglanır.
> · **Doktorda hiçbir hak, bakiye veya kredi doğmaz.** Doktor kartında teşvik bakiyesi
>   gösteren hiçbir alan bulunmaz.
> · Bütçe bakiyesi = Σ`TAHSIS` − Σ`HARCAMA`; tek `hesaplaButceBakiye()` — **modül
>   tarafındadır**, çekirdeğin 10 fonksiyonluk listesine girmez.
>
> **(5) Harcama elle ve etkinlik üzerinden yapılır.** Bir doktor kongreye gönderildiğinde
> `KongreKatilim` kaydı açılır; masraf, seçilen bütçeden **elle** düşülür (`HARCAMA`).
> **Sistem otomatik atama, öneri veya hesaplama yapmaz.**
>
> **(6) Sayaç ikiye ayrılır — doğrulanabilirlik testi (§0.1):**
> · **Bizim verdiğimiz yıllık destek sayısı (2 sınırı):** sayılabilir → **yumuşak kısıt**;
>   kural kodu `KONGRE_YILLIK_LIMIT`.
> · **Yurt dışı destek sayısı (2 sınırı):** `Kongre.yurt_disi_mi` üzerinden sayılabilir →
>   kural kodu `KONGRE_YURTDISI_LIMIT`.
> · **Doktorun tüm firmalardan aldığı toplam destek (4 sınırı):** **hiçbir koşulda
>   doğrulanamaz** → kolon yok, sayaç yok. Katılımcı ekranında yalnız sabit bilgilendirme
>   metni gösterilir.
>
> **(7) Bildirim salt kayıt alanıdır (§0.3 dördüncü hâl, C-1 §2 deseni).**
> `Kongre.bildirim_tarihi` (date, nullable) · `Kongre.bildirim_referans_no` (varchar,
> nullable, doğrulanmaz). Tek türetilmiş davranış: etkinlik başlangıcı ile bildirim tarihi
> arası **15 günden azsa veya bildirim boşsa** → **bilgi kademesi uyarısı**. Hiçbir adımı
> durdurmaz. **Sistem TİTCK'ya bildirim göndermez — kalıcı ürün kararı.**
>
> **(8) Kongre desteği cari hesaba dokunmaz** (mevcut kural korunur). Borç/alacak değildir,
> prim/ciro/hakkediş tabanına girmez, `hesaplaDoktorBakiye()` ve `hesaplaDoktorRisk()`
> sonuçlarını etkilemez.
>
> **(9) Modül opsiyoneldir ve yalnız Sınıf 1'de satılır** (K-9 deseni, altıncı doğrulama).
> `modulAcikMi('congress')` üzerinden açılır.
>
> **(10) Sorumluluk sınırı — teyit metnine 9. madde:**
> *"Sağlık meslek mensuplarına verilen bilimsel toplantı desteklerinin ilgili mevzuata
> uygunluğu, TİTCK bildirimlerinin yapılması ve destek sınırlarına uyum münhasıran
> müşterinin sorumluluğundadır. Sistem, kendisine girilen destek kayıtlarını tutar ve uyarı
> gösterir; uygunluk denetimi yapmaz, bildirim göndermez."*
>
> **(11) Pazarlanmaz:** "Bu mimari sizi korur" veya benzeri bir **uyum taahhüdü verilmez**
> (C-3 §5 kuralı). Mimari seçimimiz **bizim** pozisyonumuzu belirler; müşterinin hukuki
> riskini yönetmez.
>
> **Modül şeması (çekirdekte değil, modülde):**
> `Kongre` (ad, baslangic_tarihi, bitis_tarihi, yer, **`yurt_disi_mi`**, uzmanlik_alani,
> kontenjan, `bildirim_tarihi`, `bildirim_referans_no`) ·
> `KongreKatilim` (kongre_id, doktor_id, kayit_tutar, konaklama_tutar, ulasim_tutar,
> zorunlu gerekçe) ·
> `PazarlamaButcesi` (sahip_tip `SATICI|BOLGE|KAMPANYA`, sahip_id, donem_baslangic,
> donem_bitis, ad) ·
> `ButceHareket` (butce_id, tarih, tip `TAHSIS|HARCAMA|IPTAL`, tutar, zorunlu gerekçe,
> katilim_id nullable).
> **FK yönü daima modül → çekirdek** (§1.3). Çekirdek tablolarda kongre/bütçe kolonu yoktur.
>
> ---
> **🟦 Varsayılan kaydı**
>
> | Alan | İçerik |
> |---|---|
> | **Varsayılan davranış** | Hukuki görüş gelene kadar kongre ve teşvik modülü **kapalı teslim edilir** (`modules.congress = false`). Mevcut "alımdan bütçe türetme" kodu **devre dışıdır**; modül açılacaksa §(3)–(7)'ye göre **yeniden yazılır** ve **ayrı kalem olarak fiyatlanır**. |
> | **Cevabın değiştirdiği katman** | **Modül kapsamı ve fiyatı.** Çekirdek şema etkilenmez — kongre tabloları modül tarafındadır. §0.1 triyajında **üçüncü kova**. |
> | **Kilitlenme anı** | **Canlıya geçiş.** Modül kapalı gidiyorsa kilitlenme yoktur; açık gitmesi isteniyorsa hukuki görüş **canlıya geçişten önce** yazılı olarak elde olmalıdır. |
>
> **Neden bu varsayılan (geri dönüşü en ucuz):** Kapalı teslim edilen modül, görüş olumlu
> gelirse **açılarak** düzelir. Açık teslim edilip görüş olumsuz gelirse **geri çağrılarak**
> düzelir — ve arada müşteri o mekanizmayı kullanmış, kaydını üretmiş olur.
> **C-1 eki uygulaması:** olumsuz cevap projeyi durdurmuyor; modül zaten opsiyoneldir.

### Kapsam dışı (K-6/C-4), kalıcı

Hukuki görüşün kendisini üretmek · TİTCK'ya elektronik bildirim gönderme · uygunluk denetimi ·
başka firmaların verdiği desteği görme veya doğrulama · katılımcı sözleşmesi/onam metni
üretimi · seyahat, otel, uçuş rezervasyonu · masraf onay iş akışı · organizatör/dernek
yönetimi · şeffaflık raporu · Beşeri Tıbbi Ürünlerin Tanıtım Faaliyetleri Yönetmeliği'nin
ayrıca modellenmesi · **doktor bazlı teşvik bakiyesi (her biçimde)**.

---

## 1.8 K-8 · Ticari model — ✅ / 🟦 *(07.09.2026)*

**Şema riski K-9 ile kapandı; madde saf ticaridir.** Bu bölümde **yön ve yapı** yazılır.
**Rakam, kademe, indirim ve paketleme bu dosyaya işlenmez** — ayrı ticari çalışmadır (§10).

### §0.7 bulgusu *(05.09.2026, teyit edilmeli)*

- **Askıya alma hakkı sözleşmeden doğar, mimariden değil.** SaaS sözleşmelerinde sağlayıcı
  ücret ödenmemesi hâlinde hizmeti askıya alma hakkını saklı tutar; ancak müşterinin ciddi
  kayba uğramaması için **ihlalin giderilmesine süre verilmesi** düzenlenir. K-9 §B'nin
  "erişimin uzaktan durdurulabilmesi" mimarisi, **sözleşmede yazılı değilse kullanılamaz**.
- **Tüketici mevzuatı uygulanmaz** (karşı taraf tacir). Sözleşme serbestisi geniştir — bu
  *daha çok* özen gerektirir, daha az değil.

### Genel ERP prensibi

Lisans + yıllık bakım (Logo, Netsis, SAP) · abonelik (Odoo, Paraşüt) · kontör (e-belge).
**Değişmeyen ortak nokta: devreye alma hiçbir modelde abonelik bedeline dâhil edilmez** —
kurulum eforu müşteriden müşteriye kat kat değişir; aboneliğe gömülürse ya kurulum kalitesi
düşer ya abonelik satılamaz hâle gelir.
**Bizim farkımız:** C-6 sayesinde KDV oranı değişimi bizde **deployment değil, satır
ekleme**. Yani Logo'nun bakım sözleşmesini sattığı asıl vaadin büyük kısmı bizde **veri
işidir**. Abonelik "mevzuat güncellemesi" üzerine kurulamaz; **barındırma + yedek + çalışır
tutma** üzerine kurulur (K-9 §A zaten bunu yazmıştır).

### Karar metni

> **KARAR (K-8):** Ticari model **hibrittir ve üç kalemlidir**. Teklif tek rakam değil,
> **üç satır** olarak verilir: ① devreye alma (tek seferlik, peşin) · ② abonelik
> (tekrarlayan) · ③ opsiyonel modül. Kalemler birbirinin yerine geçmez.
> *(Kontör dördüncü kalem olarak **düşmüştür**. ~~K-4 §(4)-EK2 ile modül ertelendiği ve BYOI
> yönü seçildiği için kontör bizim gelir kalemimiz değildir.~~ **Kontör/gelir paylaşımı partner
> anlaşmasında belirlenir (🟦 — aşağıda).** Partnerliğe geçilirse komisyon
> **bizim gelirimizdir**, müşteriye görünen satır değildir — üç kalem o durumda da doğrudur.)*
> *12.10.2026 — geri not: üstü çizili gerekçe bayattı — modül ertelenmedi, çekirdek sonrası ilk
> modüle öne çekildi; BYOI ürün stratejisi değildir (C-1 §3.3.c revizyon 2-(a), revizyon 3-(3)).*
>
> **(1) Devreye alma bedeli** kurulumu, tanım tablolarının doldurulmasını (`VergiOrani`,
> `OdemeYontemi`, `KargoFirma`, `StokKonum`, `StokDuzeltmeSebep`, fiyat listeleri), D-6
> formatındaki import'u, `ACILIS` bakiyelerini (A-6) ve **sabit saatli eğitimi** kapsar.
> **Verinin import formatına getirilmesi müşteriye aittir.** Format dışı temizlik, fiziksel
> sayım ve etiketleme **hiçbir kaleme dâhil değildir** (§0.1.a; K-10 §D'nin genelleştirilmesi).
> *Sabit fiyat ancak teslim edilen verinin formatı sabitse mümkündür.*
>
> **(2) Abonelik**, K-9 §A'da sayılan teslim şartlarını kapsar: barındırma, günlük şifreli
> yedek + saklama politikası, üç ayda bir geri dönüş testi, izleme asgarisi, sürüm
> güncellemesi, veri işleyen protokolü. **Abonelik ürünü çalışır tutar; ürünü değiştirmez.**
> Yeni özellik, rapor, veri seti veya şablon abonelik kapsamında **değildir** (§0.9).
>
> **(3) Opsiyonel modül ile özel geliştirme ayrı kalemlerdir — karıştırılmaz.**
> · **Opsiyonel modül:** önceden tanımlı, **tekrar satılabilir** liste (e-Fatura entegrasyonu,
>   izlenebilirlik, bildirim, kargo API, KVKK imha paketi, kongre modülü, **bayi paneli**).
>   **İki parçalı** fiyatlanır: tek seferlik devreye alma + **aboneliğe eklenen bakım kalemi**
>   (oran yazılmaz, §10). Bakım aboneliğin **üstüne biner**, yerine geçmez (K-4).
>   Yalnız **Sınıf 1**'de satılır (K-9).
>   **e-belge modülü *(12.10.2026)*:** Ürün açısından e-belge modülü **ticarileşmenin ön
>   koşuludur; ikinci müşteriye satıştan önce hazır olmalıdır.** Müşteri açısından modül
>   **opsiyoneldir;** müşteri kendi portalı ve çekirdek Excel çıktısıyla çalışabilir.
> · **Özel geliştirme:** tek müşteriye özgü, **tekrar satılamayan** iş. **Ayrı sözleşme**,
>   ayrı teslim. **Çekirdeğe girmez** (§0.9). *Modül tanımı "müşterinin istediği her şey"
>   hâline gelirse modül sınırı diye bir şey kalmaz.*
>
> **(4) Sınıf 2 daha ucuz değildir.** Barındırma maliyeti düşer, **teşhis ve destek maliyeti
> artar** (log bizde değil, ortam bizim değil, migration'ı biz yapamayız, K-9 §A-4'ün elle
> yedek doğrulaması uygulanamaz). Abonelik kalemi **"bakım" adıyla devam eder ve düşmez**.
> Modül ve kontör satılmaz — **sebep güven değil, yetkinin uygulanamamasıdır**
> (`modulAcikMi()` müşteri sunucusunda çalışır). **Kaynak kod verilmez.** Sınıf 2 teklifte
> **ceza gibi değil, kapsam farkı** olarak anlatılır.
>
> **(5) Askıya alma hakkı sözleşmede açıkça yazılır** ve **yazılı ihtar + ihlali giderme
> süresi** şartına bağlanır. Aksi hâlde K-9'un uzaktan durdurma mimarisi ölü yatırımdır.
>
> **(6) Askıya alma imha değildir.** K-9 §A-5'in 30 günlük imha süresi **yalnız fesihten**
> sonra işler. **Veri teslim yükümlülüğü ödenmemiş bedele bağlanamaz** — "borcunu ödemezsen
> verini vermem" hem K-9 §A-5'in *"pazarlıkta taviz verilmez"* kuralına hem **veri işleyen
> sıfatımıza** çarpar. Alacak tahsili ayrı hukuki yoldur. **Veri her zaman müşterinindir.**
>
> **(7) Fiyat modeli, ölçmediğimiz ve ölçmemiz doğru olmayan şeye bağlanmaz — kalıcı.**
> · **Kullanıcı başına fiyatlama yapılmaz.** Müşteriyi hesap paylaşmaya iter, **denetim izini
>   bozar** (§0.2, A-8, D-2 §8).
> · **Belge/sipariş/işlem adedi başına fiyatlama yapılmaz.** Bu, B-7'nin **tahliye vanası
>   kuralının ticari hâlidir**: doğru kaydı pahalı yaparsanız kullanıcı kayıt tutmaz, belgeyi
>   birleştirir, sistemi amacı dışında kullanır. Ve §0.4: *gösterge sayı, karar verilen sayı
>   hâline gelir.*
> · **Tek istisna kontördür** — kâr kalemi değil, **maliyet geçişidir**. Kontör **peşin
>   satılır, kredili verilmez** (bkz. K-4 §(4)-EK2-f).
>
> **(8) Ücretsiz deneme / freemium yoktur.** Kurulumun marjinal maliyeti sıfır değildir —
> her müşteri ayrı container, ayrı veritabanı, ayrı yedek (K-9 §A-2).
>
> **(9) K-8 koda ve şemaya hiçbir şey eklemez.** Kontrol düzlemi Faz 1'de kurulmaz;
> **abonelik, lisans, fatura veya kontör ekranı yazılmaz** (K-9). *Ticari model bir yazılım
> özelliği değildir.*
>
> **(10) Referans müşteri fiyatı ürün fiyatı değildir** (§0.5'in ticari karşılığı). Anka
> West'e verilen bedel, ikinci müşteri için **taban veya tavan oluşturmaz**.
>
> **Kalıcı kapsam dışı:** Sınıf 3 (gerçek çok kiracılı SaaS) fiyatlaması · kaynak kod escrow ·
> gelir paylaşımı / ortaklık · sektörel başarı primi.
>
> ---
> **🟦 Varsayılan kaydı — asgari süre ve askıya alma**
>
> | Alan | İçerik |
> |---|---|
> | **Varsayılan davranış** | **Asgari taahhüt süresi yoktur**; sözleşme aylık döner ve karşılıklı yazılı bildirimle sona erer. Devreye alma bedeli **peşin** alındığı için batık maliyet abonelikten çıkarılmıştır. Ödeme gecikmesinde **yazılı ihtar ve giderme süresi** verilir; süre dolarsa erişim askıya alınır, **veri imha edilmez**. |
> | **Cevabın değiştirdiği katman** | Yalnız **sözleşme**. §0.1 triyajında **üçüncü kova**; koda, şemaya ve config'e etkisi yoktur. |
> | **Kilitlenme anı** | **İlk sözleşmenin imzası.** Sonrasında değişiklik ikinci müşteride serbesttir, birinci müşteride **yeniden müzakeredir**. *(10.10.2026: olay belgede yok — 🟦 kalır. Önceki MVP anlaşması bu ürünün teklifi/sözleşmesi **sayılmaz**.)* |
>
> **Neden bu varsayılan (geri dönüşü en ucuz):** Kısa taahhüt yanlış çıkarsa süre **eklenerek**
> düzelir. Uzun taahhüt yanlış çıkarsa sıkışan müşteriyle **müzakere edilerek** düzelir — ve o
> müzakere ürünün **ilk referansıyla** yapılır. *Hibrit modelin asıl gerekçesi budur: batık
> maliyeti abonelikten çıkarmak, taahhüt süresini kısa tutabilmek için.*
>
> ---
> **🟦 Varsayılan kaydı — kontör/gelir paylaşımı *(12.10.2026)***
>
> | Alan | İçerik |
> |---|---|
> | **Varsayılan davranış** | Kontör müşteriye **bizden satılmaz**; müşteri kontörü kendi entegratör sözleşmesinden alır (ilk adaptör — C-1 §3.3.c revizyon 2-(c)). Kontör veya komisyon gelirimiz **yoktur**. |
> | **Cevabın değiştirdiği katman** | Yalnız **sözleşme** (partner anlaşması ve müşteri teklifi). Kontör kütüğü gerekirse K-9 §B gereği müşteri örneğinde değil, kontrol düzleminde tutulur. |
> | **Kilitlenme anı** | **Partner anlaşmasının imzası.** |

**Ön koşul notu:** K-8 kâğıt üstünde kalmaması için **şirket kuruluşu** gerekir (Anka West'e
ERP'nin faturası kesilemez). Sırası ve yapısı **mali müşavire** sorulur; bu dosyanın konusu
değildir.

---

## 1.9 K-7 · Canlıya geçiş dosyaları ve veri aktarımı — ✅ / 🟦 *(07.09.2026)*

Kapsam ve mekanizma A-6 (`ACILIS`) ve D-6 (import) ile zaten karara bağlanmıştı. Bu bölüm
**şablonu, veri kirliliği yolunu ve sorumluluk devrini** sabitler.
**K-7 artık yalnız teknik madde değildir: K-8 §(1) devreye alma kaleminin tek girdisidir.**

> **KARAR (K-7):**
>
> **(1) Asgari içe aktarım şablonu — ürün.** Zorunlu sütunlar: **Stok Kodu · Ürün Adı ·
> Birim · `VergiOrani` KODU · ÜTS/İTS Kapsamında mı.**
> · KDV sütunu **ham oran değil, `VergiOrani` kodudur** (C-6). Ham sayı yazılırsa oran koda
>   gömülür ve C-6'nın çözdüğü sorun geri gelir.
> · **ÜTS sütunu istenir ama import okumaz** (K-10 §H-G, D-6). Bu ayrım bilinçlidir.
>
> **(2) Açılış stoğu ayrı şablondur** (miktar + `StokKonum`, B-4/A-6). ~~Doktor/cari şablonu
> D-6'daki A-13 alanlarını taşır.~~ **Devreye alma kaleminde bu şablonlar ayrı görünür.**
> *13.10.2026 — geri not (X-16): cari şablonu sistemden üretilir; kolonları `YONETICI` cari açma
> akışının alanlarıdır. Belgede kolon listesi tutulmaz.*
>
> **(3) Veri standardizasyonu ayrı kalemdir.** Müşterinin şablona uygun dosya verememesi
> hâlinde veriyi bizim standart şablona taşımamız **mümkündür**, ancak:
> · **Devreye alma bedeline dâhil değildir** (K-8 §(1) ile çelişmemesi için).
> · Anka West'te **bedelsiz** uygulanır, fakat teklifte **bedeli görünen bir satır** olarak yer alır.
> · **Ürün kuralı değildir** (§0.5) ve sonraki müşterilerde **tekrarlanmaz**.
> *Gerekçe: sıfır fiyatlı ama görünmez iş, ürünün normu hâline gelir. §0.1.a — geçişin gerçek
> maliyeti operasyondadır ve yazılımla azalmaz.*
>
> **(4) Zorunlu yazılı teyit — canlıya çıkış şartı.** Nihai liste veritabanına aktarılmadan
> **önce** müşteriye ve mali müşavire e-posta ile gönderilir; *"Sistemi bu oranlarla canlıya
> alıyoruz"* denerek **yazılı onay** alınır. D-6'nın açılış bakiyesi mutabakatı teyidiyle
> **aynı yazıda** gidebilir.
> *13.10.2026 — geri not: aynı şart **cari listesi** için de geçerlidir (X-16 §(11)).*
>
> **(5) Sorumluluk dili — dikkatli formülasyon.** Yazılı teyit **delildir, mutlak kalkan
> değildir**; vergi cezası zaten mükellefe kesilir, sözleşmenin belirlediği şey **rücu
> edilebilirliktir**. Kullanılacak dil: *"Oranlar ve ÜTS kapsam bilgisi müşteri ve mali
> müşavir beyanına dayanır; sistem beyanı doğrulamaz."* **Nihai ifade hukukçuya kontrol
> ettirilir.** *(C-1 ve K-4 §(4)-g ile aynı desen: sorumluluğumuz pratikten değil beyandan doğar.)*
>
> **(6) Liste gelmezse ne olur — dal bugünden yazılı.** Sistem K-10/C-6 varsayılanlarıyla
> kurulur (`tax.varsayilanVergiOraniKodu = KDV20`, ÜTS kapalı) ve **bu durum yazılı olarak
> müşteriye bildirilir**.
>
> **(7) REVİZYON *(08.09.2026)* — KDV teyidi buraya taşındı.** ~~1 Ekim 2026~~ tarihi
> K-10 §I-7 ile ikiye ayrıldı; **ürün bazında KDV oranı teyidinin kilitlenme anı artık
> canlıya çıkıştır**, aylar öncesi değil.
> · Müşteriden **ayrı bir liste istenmez**; oran bilgisi **(1)'deki içe aktarım şablonunun
>   `VergiOrani` KODU sütunuyla**, **müşterinin kendi doldurduğu dosyayla** gelir.
> · Böylece **fiyat listesini hiç görmeyiz** — müşterinin gizlilik itirazı karşılanır,
>   C-6 ayakta kalır, zaman baskısı kalkar. **Üçü birden.**
> · **§(4) yazılı teyidi bu maddenin zırhıdır ve zorunluluğu artmıştır:** K-4 §(6) ile
>   ürettiğimiz satır artık faturaya gidiyor. Yanlış oran **bizim dosyamızla taşınır.**
> · **Yeni çıkış şartı:** K-4 §(6) veri seti ilk kez üretilmeden önce §(4) teyidi alınmış
>   olmalıdır.
>
> ---
> **🟦 Varsayılan kaydı — gerçek dosyaların incelenmesi**
>
> | Alan | İçerik |
> |---|---|
> | **Varsayılan davranış** | Dosyalar görülene kadar devreye alma bedeli **şablonlu teslim varsayımıyla** hesaplanır. Kirlilik çıkarsa fark **(3)'teki ayrı kalem** olarak görünür, devreye alma bedeli **yeniden açılmaz**. |
> | **Cevabın değiştirdiği katman** | **Teklif ve devreye alma planı.** Şemaya etkisi yoktur — kapsam D-6/A-6'da kapalıdır. |
> | **Kilitlenme anı** | **İlk teklifin verilmesi.** *(10.10.2026: olay belgede yok — 🟦 kalır. Önceki MVP anlaşması bu ürünün teklifi/sözleşmesi **sayılmaz**.)* |

---

## 1.3 Modülerlik — ✅ **KARAR (09.09.2026)** · A-9 parkı da burada çözüldü

**Faz 0'ın son karar adımıdır.** Bilinçli sıralama tutuldu: önce tüm iş gereksinimleri
kesinleşti, sonra sistemin tamamı için modülerlik **bir kerede** kararlaştırıldı.

**Ticari gerekçe §0.9'dadır (29.08.2026):** çekirdek sektörden bağımsız kalmalıdır.

**Maddenin gerçek sorusu sahipliktir.** Sekiz taşınmış sorunun tamamı *"bu katalog kimin"*
diye soruyor ve tek bir ayrımla kapanıyor: **davranış kataloğu ile veri ilişkisi aynı şey
değildir.**

**Genel ERP prensibi:** Odoo'nun `addons` modeli üç kural taşır — modül bağımlılığını
*bildirir*, çekirdek modülü *tanımaz*, kaldırma *tersine çevrilebilir*. SAP'ta add-on ayrı
namespace'tedir ve çekirdek tabloya kolon eklemek "modifikasyon" sayılıp yükseltmeyi
zehirler. Logo'da modül lisansla açılır, **kod tektir**. Üçünde de ortak olan ve bizim için
belirleyici olan: **modül çekirdeğin şemasını değiştirmez, ama çekirdeğin kataloglarına
değer ekleyebilir.** Runtime plugin, mikroservis ve modül mağazası hiçbirinde **iki kişilik
ekibin** yaptığı iş değildir.

> **KARAR (§1.3):** Modül bir **klasör ve bir bayraktır**; ayrı uygulama, ayrı servis, ayrı
> deploy veya ayrı şema değildir. Sınır **tek yönlü bağımlılıkla** kurulur.
>
> ### §A · Sınırın tanımı
>
> **(1) Bağımlılık tek yönlüdür.** Modül çekirdeği tanır; **çekirdek modülü asla tanımaz.**
> Çekirdek tablolarda **modül kolonu ve modüle FK bulunmaz**; FK yönü daima
> **modül → çekirdek**.
>
> **(2) Somut test:** modül klasörü silindiğinde proje **derlenir**. Faz 1'de bu **kural
> olarak durur, otomatik test değildir** — servis katmanında hâlâ test yok
> (K-4 §(4)-EK2-a). İlk modül yazıldığında CI'ya bir adım olarak eklenir.
> *Dürüstlük notu: bugün doğrulanan bir kural değil, uyulan bir kuraldır.*
>
> **(3) Bağlantı çekirdek olaylarına handler kaydıyla kurulur** (`onOrderConfirmed`,
> `onOrderCancelled`, `onBlokAcildi`, `onSevkiyatTamamlandi`, `onIadeKaydedildi` — D-1).
> Handler **aynı transaction içinde** çalışır; kuyruk, asenkron iş ve yeniden deneme
> **kapsam dışıdır** (X-3 deseni).
>
> **(4) Açma/kapama tek noktadan okunur:** `modulAcikMi(kod)` (K-9). Doğrudan `process.env`
> okuması **yasaktır**. Kapalı modülde **menü öğesi, rota ve server action'ın tamamı
> kapalıdır**; rota `not-found.tsx`'e düşer (X-3 §1).
> **Ekranda gizleyip sunucuda gizlememek yasaktır** (D-2 §3 deseni): kapalı modülün server
> action'ı **fail-closed** davranır.
>
> **(5) Modülü müşteri açamaz.** Kurulum düzeyi kararıdır (K-9 §B kontrol düzlemi,
> K-8 §(4)). **Kullanıcı toggle'ı, ayar ekranı veya modül mağazası yoktur — kalıcı.**
>
> ### §B · Sahiplik — sekiz taşınmış sorunun tek cevabı
>
> **(6) Davranış kataloğu çekirdektedir; genişlemesi çekirdek migration'ıdır.** Modül
> kataloğa **değer ekleyebilir**, ama ekleme işini modül yapmaz — **tek şema, tek migration
> hattı** korunur (K-9 §A-2: müşteri başına izole veritabanı, **ama tek kod tabanı**).
> Bu kural taşınmış soruların **1, 2, 3 ve 7**'sini birlikte kapatır:
>
> | Katalog | Sahibi | Modül ne yapar |
> |---|---|---|
> | `OnayBlogu.kural_kodu` (A-8) | **Çekirdek** | Modül **kendi kodlarını kullanır** (`KONGRE_YILLIK_LIMIT`, `KONGRE_YURTDISI_LIMIT`) |
> | Belge öneki + `BelgeSayac` (A-14) | **Çekirdek** | Modül **`uretBelgeNo()`'yu çağırır**, kendi sayacını kurmaz |
> | `Kullanici.rol` (D-2) | **Çekirdek enum** | **Modül rol ekleyemez**; yeni rol bir çekirdek kararıdır |
> | `OdemeYontemi.tip` · `StokKonum.tip` · cari hareket tipi · K-4 veri seti kodu · `cari_tip` | **Çekirdek** | Modül **okur**, genişletmez |
>
> **(7) `kural_kodu` enum değil `varchar`'dır.** Gerekçe kritik: **modül kapatıldığında
> geçmiş `OnayBlogu` kayıtları okunabilir kalmalıdır** (§0.2 — kayıt silinmez). Etiketi
> bulunamayan kod **ham hâliyle** gösterilir; ekran boş kalmaz, yalan da söylemez.
>
> **(8) Fiyatlandırma çekirdektir ve modül fiyata dokunamaz — kalıcı** *(taşınmış soru 2)*.
> `cozumleBirimFiyat()` (B-6/B-5) ve `hesaplaSatirTutarlari()` (C-6) modül tarafından
> **sarılmaz, genişletilmez, override edilmez**. Bir modül fiyata dokunuyorsa o modül değil,
> **çekirdek değişikliğidir**. *(Bayi paneli fiyat listesini **okur**, değiştirmez.)*
>
> **(9) Tek çağrı noktası fonksiyonları çekirdektedir ve liste 11'de kapalıdır.** Modül
> kendi fonksiyonunu kendi tarafında tutar (`hesaplaButceBakiye()` — K-6). **Modül çekirdek
> listesine fonksiyon ekleyemez.**
> *01.10.2026 — geri not: yasak **modüller** içindir. Çekirdek eklemesi X-17 ile yapıldı; liste **12**'ye çıktı (`degistirDoktorSahibi()`).*
>
> ### §C · Modül yazılmadan tablosu da yazılmaz
>
> **(10) Kapalı modülün tabloları şemada bulunmaz.** Modül **yazıldığı gün** tek migration
> hattına girer ve **tüm kurulumlarda oluşur**, kapalı olanlarda **boş durur**.
> · **Müşteri bazında farklı şema kalıcı olarak kapsam dışıdır.** İzole veritabanı
>   (K-9 §A-2) **izolasyondur, çeşitlenme değildir**; 20 müşteride 20 ayrı migration hattı
>   elle yönetilemez.
> · **Boş tablonun maliyeti sıfıra yakındır** (§0.1 karmaşıklık ölçeği) ve boş **kolonun**
>   aksine "hazırız" hissi de üretmez — UI'da hiç görünmez.
> · **K-6 kongre tabloları Faz 1'de yazılmaz** (modül yeniden yazılacak, §1.7-2) ·
>   **K-10 ve K-4 §(4) alanları yazılmaz** (K-10 §H-B, K-4 §(4)-EK2-b).
>
> **(11) Modül kapatıldığında veri silinmez** (§0.2). Kapatma bir **görünürlük kararıdır**;
> migration geri alınmaz, tablolar durur, dışa aktarımda görünmez.
>
> ### §D · Modül sınırı — kapalı liste
>
> **(12) Çekirdek:** doktor carisi ve bakiye · sipariş/teklif · sevkiyat · iade · stok ve
> stok düzeltme · tahsilat · fiyatlandırma ve barem · satıcı primi · belge numaralandırma ·
> dışa aktarım (**altı veri seti, fatura hazırlık dâhil**) · roller ve oturum · hata ve uyarı
> yüzeyi.
> **Opsiyonel modül:** kongre ve teşvik (K-6) · bildirim kademe 1+ (D-1) · kargo API (D-3) ·
> dış sistem entegrasyonu / e-Fatura (K-4 §4) · izlenebilirlik (K-10) · KVKK veri imha
> paketi (C-3 Faz 2) · **bayi paneli (D-2 §6)**.
> **Yeni modül eklemek bir ürün kararıdır**, müşteri talebi değildir (K-8 §(3): modül ≠ özel
> geliştirme).
>
> **(13) Kongre modülü tek "geri çekilen" modüldür** *(taşınmış soru 8)*. Bugün çekirdeğe
> sızmış kod — *alımdan bütçe türetme* — **çıkarılır** (K-6 §(2)). Temizliğin sınırı:
> `Doktor` üzerinde teşvik, kredi veya bakiye anlamı taşıyan **hiçbir alan, hiçbir hesap,
> hiçbir formül kalmaz** (K-6 §(4)). **§0.9: ilişkiyi gizlemek değil, kurmamak.**
>
> **(14) Bayi paneli ile `MUSAVIR` rolü aynı sınıfta değildir.** Rol **çekirdektir** (§B-6);
> **panel** modüldür. `MUSAVIR` eklemek **bir enum satırıdır** (D-2 §5); bayi paneli ise
> **dış kullanıcı, internete açık hesap, parola sıfırlama ve destek yükü** getirir
> (D-2 §6, E-2). Birincisi çekirdek migration'ı, ikincisi **Faz 3+ opsiyonel modül, yalnız
> Sınıf 1**.
>
> ### §E · A-9 — cari hesap sahibi tipi (park kaldırıldı)
>
> **(15) Cari hesap sahibi tek tiptir: `Doktor` kaydı.** Ayrı `Kurum`/`Klinik` tablosu
> **açılmaz**; **`Doktor.kurum_id` sigorta kolonu olarak konmaz** (§0.1, **on ikinci
> uygulama**).
> · Tüzel/gerçek ayrımı zaten var: `cari_tip` (A-13 §2); fatura muhatabı `fatura_unvani` ve
>   `vkn_tckn`'den okunur. **İkinci bir varlık gerekmiyor.**
> · **Aynı VKN tekrarına kısıt konmaz** (A-13 teyit). Aynı klinikte üç doktor = üç cari, aynı
>   VKN. Bilinçlidir: bakiye, risk ve prim **doktor bazında** doğar (K-2, A-12, X-1) ve
>   satıcı ilişkisi doktorladır.
> · **Klinik bazında konsolide bakiye talebi bir rapor değil, veri modeli değişikliğidir** ve
>   **ayrı fiyatlı yükseltmedir** (§0.6 C-1 eki). Yükseltmenin şekli bugünden yazılıdır:
>   `Kurum` tablosu + `Doktor.kurum_id` + `hesaplaDoktorBakiye()`'ye **kapsam parametresi** —
>   yeni fonksiyon değil. **Veri taşıma migration'ı gerekir ve pahalıdır** (§0.1.a).
> · **Kolon testi:** 1. soruda hayır (bugün doldurulmaz) · 2. soruda hayır (klinik ilişkisi
>   **her an geriye dönük kurulabilir**, VKN elimizde) · 3. soruda **koyma**. Üç testten de
>   düşer.
> · **Modülerlikle bağı:** klinik konsolidasyonu **modül değildir** — cari yapısı çekirdektir
>   ve §B-8 gereği modül bakiyeye dokunamaz.
>
> ### §F · e-belge ve kargo modülleri — sınırın uygulanışı *(12.10.2026)*
>
> **(16) e-belge (C-1 §3.3.c, K-4 §(4)) ve kargo (D-3) modülleri §A–§D'ye tabidir.** Bu
> modüller çekirdeğe bağımlıdır; **çekirdek bu modüllere bağımlı değildir.** Karşılığı zaten
> yazılı olan kural tekrarlanmaz, eksik olanlar eklenir:
>
> | Kural | Karşılığı |
> |---|---|
> | Veri: modül çekirdek tablosuna kolon eklemez; ek veri modülün kendi tablolarındadır, FK modül → çekirdek | §(1) · §(10) — mevcut |
> | **Veri: modül çekirdek tablolarını yalnız okur, çekirdek kaydını değiştirmez** | **Yeni** |
> | Fonksiyon: çekirdeğe yeni fonksiyon eklenmez; 12'lik tek çağrı noktası listesi kapalıdır | §(9) — mevcut |
> | **Tetikleme: çekirdek modülü hiçbir zaman çağırmaz. Modül yalnız iki yolla çalışır — kullanıcı eylemi (UI yuvası) veya altyapı zamanlayıcısı** | **Yeni** |
> | **UI: çekirdek UI belge ekranlarında eylem/bileşen yuvaları (slot) tanımlar; modül kendini bir kayıt (registry) üzerinden bu yuvalara ekler; çekirdek kaydı okur, modülü import etmez** | **Yeni** |
> | Açık/kapalı kurulum (müşteri örneği) başına yönetilir | §(4) `modulAcikMi()` · §(5) — mevcut |
> | Tek uygulama; ayrı servis ve ayrı deploy yoktur | Karar girişi · kalıcı kapsam dışı — mevcut. **Ek: yapı tek Next.js uygulaması içinde kurulur; ayrı API veya BFF katmanı yoktur** |
> | **Bağımsızlık: çekirdek modül kurulmadan da eksiksiz çalışır; modülün kaldırılması çekirdekte hiçbir değişiklik gerektirmez** | §(2) derleme testi · §(11) — **açık cümle olarak yeni** |
>
> · **Bu iki modül §(3) olay handler'ı kaydetmez.** §(3) diğer modüller (D-1, K-6) için aynen
>   geçerlidir.
> · **Altyapı zamanlayıcısı §(3) anlamında handler değildir** (C-1 §3.3.c revizyon 3-(5));
>   handler'lar için kuyruk ve asenkron iş yasağı aynen geçerlidir.
> · ⚠️ **Açık bulgu — onay bekliyor (12.10.2026):** (i) Partner webhook'u (revizyon 3-(5))
>   üçüncü bir tetikleyicidir; "yalnız iki yol" kuralıyla ilişkisi yazılı değildir.
>   (ii) "Çekirdek kaydını değiştirmez" kuralı §(6) tablosundaki *"modül `uretBelgeNo()`'yu
>   çağırır"* hükmüyle kesişir (`BelgeSayac` çekirdek kaydıdır); e-belge modülünün kendi
>   belgesinin iç `belge_no` taşıyıp taşımayacağı (K-4 §(1)) yazılı değildir.
>
> **Kapsam dışı, kalıcı:** runtime plugin · ayrı servis, ayrı deploy, mikroservis · müşteri
> başına farklı şema veya farklı migration hattı · modül mağazası · kullanıcı tarafından
> modül açma/kapama · modülün çekirdek fonksiyonunu override etmesi · modülün çekirdek
> tabloya kolon eklemesi · asenkron/kuyruklu handler · çoklu cari hiyerarşisi · grup
> şirketi/konsolide bakiye · doktor birleştirme (A-13) · aynı VKN tekilliği kısıtı.

**Karara temel olan desen (referans):**

- Bağımlılık **tek yönlü**: modül çekirdeği tanır, **çekirdek modülü asla tanımaz**
- Çekirdek tablolarda modül kolonu ve modüle FK **bulunmaz**; FK yönü hep modül → çekirdek
- Somut test: *modül klasörü silinince proje derleniyor mu?*
- Bağlantı, çekirdek olaylarına (`onOrderConfirmed`, `onOrderCancelled`, `onBlokAcildi`)
  **aynı transaction içinde** çalışan handler kaydıyla kurulur
- Kurulum düzeyinde açılır/kapanır (`modules.congress`), kullanıcı toggle'ı değil.
  **K-9 eki: açık/kapalı bilgisi tek `modulAcikMi()` fonksiyonundan okunur.**
- Runtime plugin, ayrı servis, ayrı deploy → kapsam dışı
- Bedeli: her modül sınırı "açıkken/kapalıyken" iki test yolu doğurur
- Aday modüller: **kongre ve teşvik (K-6)**, bayi kanalı, **bildirim (D-1)**,
  **kargo entegrasyonu (D-3)**, **dış sistem entegrasyonu (K-4)**,
  **izlenebilirlik (K-10)**, **KVKK imha paketi (C-3)** ·
  Çekirdek: doktor carisi, sipariş, stok, **stok düzeltme (B-7)**, satıcı primi

**Karara bağlanan sorular *(hepsi §A–§E ile kapandı)*:**

1. `OnayBlogu` çekirdektedir, `KONTENJAN_ASIMI`, **`KONGRE_YILLIK_LIMIT` ve
   `KONGRE_YURTDISI_LIMIT`** kural kodları kongre modülüne aittir.
   → **§B-6/§B-7: katalog çekirdektedir, modül yalnız kendi kodunu kullanır; `kural_kodu`
   `varchar`'dır.** *(A-8, K-6)*
2. Aynı soru fiyatlandırma için de geçerli: `cozumleBirimFiyat()` çekirdektir. *(B-6, A-10)*
3. Aynı soru **kodda kapalı katalog** taşıyan her tablo için geçerlidir; `OdemeYontemi.tip`,
   `StokKonum.tip`, cari hareket tipi kataloğu, **K-4 veri seti kataloğu**,
   **A-13 `cari_tip`**, **A-14 belge öneki kataloğu** bu listeye girer.
4. **Bildirim (D-1) ve kargo entegrasyonu (D-3)** modülerlik kararının **ilk gerçek testidir**.
5. **İzlenebilirlik (K-10) ikinci gerçek testtir** ve diğerlerinden farklıdır: ötekiler
   çekirdeğe *bağlanır*, bu çekirdek bir kavramın (stok birimi) *tanımını* değiştirir.
6. **Dış sistem entegrasyonu (K-4)** veri seti sözleşmesine bağlanır.
7. **`modulAcikMi()` üçüncü testtir (K-9).**
8. **Kongre ve teşvik modülü (K-6) dördüncü testtir** ve tek "geri çekilen" modüldür:
   bugün çekirdeğe sızmış kodun (alımdan bütçe türetme) **çıkarılması** gerekiyor.
   Modülerlik kararı bu temizliğin sınırını da belirleyecek.

**Modülerlikten bağımsız geçerli iş kuralı:** kongre desteği doktorun **cari bakiyesine
dokunmaz**; teşviktir, borç/alacak değildir. **K-6 eki: doktorda bakiye de doğurmaz.**

**Bayi kanalı notu (B-4):** Bayi deposu ayrı bir mekanizma değil, `StokKonum` satırıdır.

---

## 2. Müşteriye gönderilecek metin

> Aşağıdaki bölüm doğrudan kopyalanıp Anka West'e gönderilebilir. Teknik terim yok.
> ✅ işaretli maddeler karara bağlandı, listede **teyit amaçlı** kaldı.
> 🔴 işaretliler **canlıya geçiş öncesi yazılı cevap** bekler.

**Konu: Sistem devreye alınmadan önce netleşmesi gereken işleyiş soruları**

**Tahsilat ve iptal**

1. ✅ *(teyit)* Parası tahsil edilmiş sipariş iptal edilebilecek; alınan para doktorun
   hesabında avans olarak kalacak.
2. ✅ *(teyit)* Borcundan fazla ödeme "borcu yok, X TL avansı var" şeklinde gösterilecek.
3. Sevk edilmiş bir siparişin **bir kısmı** iade edilebiliyor mu? **Yılda kaç kez oluyor ve
   çoğunlukla hangi sebeple?**

**Ürün çıkışı**

4. ✅ Numune/bedelsiz çıkış stoktan düşecek, ciro-prim-kongre hakkedişi üretmeyecek.
   **Ek soru:** numune dışında bedelsiz çıkış sebebiniz var mı?
5. ✅ Parça parça sevkiyat desteklenecek.
6. Doktorda veya hastanede duran, **size ait ama henüz satılmamış** ürününüz var mı?
   Varsa kullanıldığını size **kim ve ne zaman bildiriyor**?
6-a. ✅ *(teyit)* **Barkod okuma, depo el terminali ve cihaz takibi bu sürümde yer
   almayacak.**
6-b. ✅ *(teyit)* Sistem **birden çok depoyu** destekleyecek şekilde kurulacak; bugün tek
   deponuz olduğu için ekranlarda depo seçimi görünmeyecek.
6-c. 🔴 **ACİL — 1 Ekim 2026'dan önce.** *(10.10.2026 — geri not: tarih geçti, liste alınmadı; talep canlıya geçiş ön koşulu olarak sürer — K-10 §H, `SOZLESME_EKI.md` 1. madde.)* Tıbbi cihaz ve ilaç faturalarında ÜTS/karekod
   bilgisi zorunluluğunun kapsamı **1 Ekim 2026**'da değişiyor. **Mali müşavirinizden,
   ürün listeniz üzerinde her ürün için "ÜTS/İTS kapsamında mı?" bilgisini işaretlemesini
   ve listeyi tarihli-imzalı olarak bize iletmenizi rica ediyoruz.** Bu liste, 10-c'de
   istediğimiz KDV oranı listesiyle **aynı dosya** olabilir — müşavirinize tek talep gitsin.
   *(Genel bir "kapsam dışıdır" cümlesi yeterli değil.)* → K-10
6-d. 🔴 **Depoda kırılan, kaybolan veya miadı dolan mal için bugün ne yapıyorsunuz?**
   Bir tutanak düzenleniyor mu, mali müşavirinize bildiriliyor mu? **Ayrıca: depo sayımını
   hangi sıklıkla yapıyorsunuz?**
   *(Tıbbi üründe imha, tutanaklı yapıldığında KDV indirimi korunabiliyor; tutanaksız
   "kayıp" olarak kaldığında indirim iptali gerekiyor. Sistem tutanak üretmeyecek, ancak
   **stok düzeltme kaydına tutanak numarasını yazabileceğiniz bir alan** bulunacak.)* → B-7

**Fiyat ve iskonto**

7. ✅ *(teyit)* Baremli fiyat listesi **sipariş kalemi bazında** işleyecek.
8. ✅ Satıcı, fiyatta istediği kadar indirim yapabilecek; **indirimler satıcı bazında
   raporlanacak.**
9. ✅ *(teyit)* Satıcı primi, **indirim sonrası net tutar** üzerinden hesaplanacak.
10. Belli miktar alımda **hediye ürün (10+1 / mal fazlası)** uygulamanız var mı?
10-a. ✅ *(teyit)* Fiyat listelerine **başlangıç/bitiş tarihi** verilebilecek altyapı
    kuruldu; bu sürümde ekranı açılmayacak.
10-b. ✅ *(cevap alındı — 09.09.2026, teyit)* Yayınlanan fiyat listeleriniz **KDV hariçtir**;
    indirim **alınan adede göre kademelidir** (ör. 0–5 adet bir fiyat, 5–10 adet başka fiyat);
    KDV en sonda eklenir. Sistem tam olarak böyle çalışacak: veritabanında **her zaman KDV
    hariç tutar** durur, KDV satır düzeyinde hesaplanır, belge altında **Matrah · KDV · Genel
    Toplam** ayrı ayrı görünür.
    **Tek netleştirme:** **5 adet alan doktor hangi kademeyi görüyor — düşük olanı mı, yüksek
    olanı mı?** *(Kademe sınırı tek bir yere ait olmak zorunda.)* → C-6, B-6, Ü-3
10-c. 🔴 **Sattığınız ürünlerin tamamı %20 KDV'ye mi tabi?** Tıbbi Cihaz Yönetmeliği
    kapsamındaki cihazların teslimi KDV Kararı'nın (II) sayılı listesinde yer alıyor ve
    **%10** oranına tabi. Sistemi **ürün bazında KDV oranı** tutacak şekilde kuruyoruz.
    **Ürün listenizdeki hangi ürünün %10, hangisinin %20 olduğunu mali müşavirinizden
    yazılı olarak isteyip bize iletmeniz gerekiyor.**
    **Aynı dosyaya 6-c'deki ÜTS sütununu da ekletmeniz yeterli.** → C-6

**Teklif ve ihale**

11. Doktora satış yapmadan önce **yazılı teklif** veriyor musunuz?
12. Hastane **ihalesine** giriyor musunuz? *(Girmiyorsanız yazılı teyit rica ediyoruz.)*

**Ürün ve mevzuat**

13. ✅ *(kapandı)* Lot/seri/ÜTS takibi kapsam dışı — 6-c'deki teyide bağlı.
    **Not:** Ürün takibi (lot/seri/karekod) ve barkod okuma, ileride **ayrı bir paket**
    olarak sunulacaktır. Bugün kurulan sistem miktar bazlı çalışır; talep geldiğinde paket
    ayrıca fiyatlanır ve **bir sayım/etiketleme çalışması** gerektirir.

**Mali**

14. ✅ *(teyit)* Muhasebe programı kullanmıyorsunuz, kayıtlar Excel'de; e-Faturayı bir
    arkadaşınız GİB portalından elle kesiyor; ayrıca mali müşaviriniz var.
    **Ek soru:** GİB portalından **günde/haftada yaklaşık kaç fatura** ve **kaç irsaliye**
    kesiliyor?
14-a. ✅ *(revize — 09.09.2026; sizden dosya istemiyoruz)* Mali müşavirinize sistemin
    ürettiği üç çıktıyı **biz göndereceğiz**: **tahsilat hareket listesi** (aylık),
    **cari ekstre** ve **dönem sonu stok miktar listesi** (geçici vergi dönem sonlarında ve
    31 Aralık'ta). İlk dönem sonunda bu çıktıları müşavirinize iletip *"eksik bir kolon var
    mı"* diye sormanız yeterli. *(Sistem muhasebe fişi ve hesap kodu üretmez — bu bilinçli
    bir sınırdır; müşaviriniz satış faturalarını GİB'den, banka hareketlerini bankadan zaten
    alıyor.)* → C-2, D-5
15. ✅ *(teyit)* Bu sistem **fatura kesmeyecek ve muhasebe kaydı üretmeyecek**; müşavirinize
    uygun **Excel çıktısı** üretecek. Müşaviriniz satış faturalarını zaten GİB'den,
    banka hareketlerini bankadan alıyor; sistemin dolduracağı boşluk **tahsilat kırılımı,
    cari mutabakat ve dönem sonu stok miktarıdır**. → C-2
15-a. 🔴 **Bugün mal çıkışında irsaliyeyi nasıl kesiyorsunuz — matbu koçanla mı, e-İrsaliye
    ile mi?** *(2025 brüt satış hasılatınız 10 milyon TL'yi aştıysa 1 Temmuz 2026 itibarıyla
    e-İrsaliye zorunluluğunuz doğmuş olabilir; müşavirinizden yazılı teyit almanızı rica
    ediyoruz.)* Sistem irsaliye de kesmeyecek; ancak **kestiğiniz irsaliyenin numarasını
    sevkiyat kaydına yazabileceğiniz bir alan** bulunacak. → C-1
16. ✅ *(teyit)* **Vadede sistem sınırı olmayacak**; **vade farkı / gecikme faizi
    uygulanmayacak.**
17. ✅ *(teyit)* Sistem **tamamen Türk Lirası** çalışacak.
17-a. ✅ *(teyit)* Tahsilat yöntemleri: nakit, havale, EFT, kredi kartı, ödeme linki.
17-b. ✅ *(teyit)* **Çek ve senet takibi kapsam dışı.**
17-c. **Ödeme linkini** hangi bankanın/sağlayıcının panelinden oluşturuyorsunuz?
17-d. Doktor bazında bir **risk/kredi limiti** tanımlamak ister misiniz? *(Bu sürümde
    yalnızca **uyarı** gösterilecek.)*
17-e. 🔴 **Doktorların vergi bilgilerini nerede tutuyorsunuz?** Doktor/kurum bazında
    **VKN veya TC kimlik numarası, vergi dairesi, unvan ve fatura adresi** gerekiyor. → A-13
17-f. ✅ *(cevap alındı — teyit)* Fatura **genelde doktorun kliniğinin vergi levhasına**,
    klinik yoksa doktora **şahıs olarak** kesiliyor. Sistem her iki durumu da destekleyecek.
17-g. ✅ *(karara bağlandı — 09.09.2026, teyit)* Aynı klinikte birden fazla doktorunuz olsa
    bile **her doktor ayrı cari hesap** olarak açılacak; fatura bilgileri (unvan, VKN) ortak
    olabilir. Klinik bazında **toplu bakiye** görmek ileride istenirse bu ayrı bir çalışmadır.
    → A-9
17-h. 🔴 **Doktorlardan tek seferde veya aynı gün içinde toplam 30.000 TL'yi aşan
    nakit/elden tahsilat yapıyor musunuz?** *(Bu tutarı aşan tahsilatın banka, ödeme kuruluşu
    veya PTT kanalıyla yapılması zorunlu; uyulmadığında ceza hem tahsil edene hem ödeyene
    kesilebiliyor.)* Sistem nakit tahsilatı **engellemeyecek**, yalnız aynı gün toplamı bu
    tutarı aştığında **hatırlatıcı uyarı** gösterecek. **Güncel limiti mali müşavirinizden
    yazılı olarak teyit almanızı rica ediyoruz** — bu sayı sistemde ayarlanabilir bir
    değerdir. → A-15

**Kongre ve teşvik**

18. ✅ Kontenjan aşımı engellenmeyecek, **yönetici onayıyla** ve kayıt tutularak aşılabilecek.
19. 🔴 **Kongre destek modülü hakkında üç konuda yazılı bilgi gerekiyor:**
    **(a)** Firmanız **tıbbi cihaz satış merkezi yetki belgesine** sahip mi?
    *(Yönetmelik yükümlülükleri bu belgeye bağlı.)*
    **(b)** Tıbbi Cihaz Satış, Reklam ve Tanıtım Yönetmeliği md. 22, bir cihazın alınması
    veya kullanılması karşılığında sağlık meslek mensuplarına maddî kazanç veya **ödül sözü**
    verilmesini yasaklıyor. Bugünkü sistemde kongre desteği **doktorun alım tutarından
    otomatik hesaplanıyor**. Bu mekanizmayı **kaldırıyoruz**. Bundan sonra pazarlama bütçesi
    **satıcı/bölge/kampanya bazında** tanımlanacak, destek **etkinlik bazında ve elle,
    gerekçesiyle birlikte** kaydedilecek. Kimi kongreye göndereceğinize siz karar
    vereceksiniz; sistem bir hak hesaplamayacak.
    **(c)** Modülün açık teslim edilmesini istiyorsanız hukuk danışmanınızdan **yazılı
    görüş** almanız gerekiyor. Görüş gelene kadar modül **kapalı** teslim edilir.
    *(Yönetmelik ayrıca kişi başına yıllık dört destek — aynı firmadan en fazla ikisi,
    yurt dışında en fazla ikisi — sınırı ve toplantıdan on beş gün önce Kuruma bildirim
    yükümlülüğü getiriyor; sistem bunlar için **uyarı** gösterecek, bildirimi sizin adınıza
    göndermeyecek.)* → K-6/C-4

**Sevkiyat ve kargo**

19-a. Hangi **kargo firmalarıyla** çalışıyorsunuz?
19-b. Bu firmalarla **kurumsal (API'li) sözleşmeniz** var mı?

**Bildirim**

19-c. Sistemin **otomatik e-posta bildirimi** göndermesini istiyor musunuz? *(Bu sürümde
    gönderilmeyecek; altyapısı hazır bırakılacak.)*

**Devreye alma**

20. ✅ Açılış bakiyeleri aktarılacak, Excel'den. **Dosyaların kendisi paylaşılmalı.**
    **Ek soru:** açılış bakiyesi dosyasında her satırın **vade tarihi** var mı?
20-a. **Sisteme belge veya fotoğraf yükleyebilmeyi bekliyor musunuz?** *(İmha tutanağının
    taraması, teslim fotoğrafı, sözleşme kopyası gibi.)* **Bu sürümde dosya yükleme
    bulunmayacak**; sistem tutanak ve irsaliye **numarasını** kaydediyor, belgenin kendisi
    sizin arşivinizde kalıyor. Beklentiniz varsa şimdiden bilmemiz gerekiyor — **ayrı bir
    kalem** olarak değerlendiriyoruz. → E-3
21. **Doktorlar ve ürünler Excel'de nasıl ayırt ediliyor — kod numarasıyla mı, isimle mi?**
21-a. **Bugün Excel'de siparişlere veya irsaliyelere numara veriyor musunuz?** → A-14
22. ✅ *(varsayılan sabitlendi — teyit)* Sistem, **Türkiye'de bulunan ve bizim yönettiğimiz**
    bir sunucuda çalışacak; kurulum, güncelleme ve **günlük şifreli yedekleme** bize ait
    olacak. **Verileriniz Türkiye dışına çıkmayacak.**
    **Sorumuz:** Kendi sunucunuzda çalışmasını gerektiren bir tercihiniz veya kısıtınız
    var mı?
    **Ayrıca:** Sözleşme sona erdiğinde verilerinizin tamamını açık formatta size teslim
    ediyoruz; ardından sistemimizden siliyoruz. **Veriler her koşulda sizindir.** → K-9
22-a. **Çalışan sayınız 50'nin altında ve yıllık bilanço toplamınız 100 milyon TL'nin
    altında mı?** *(Öyleyse VERBİS kaydı zorunluluğunuz bulunmuyor.)* → C-3
23. Destek beklentiniz nedir — hangi saatler, ne kadar sürede yanıt?
23-a. 🔴 **Satıcı primini ne zaman ödüyorsunuz — mal sevk edildiği ay mı, para tahsil
    edildikten sonra mı?** *(Sistem hakedişi sevkiyat anında hesaplar. Tahsilata göre
    ödüyorsanız sistem size dönem cirosunu, dönem tahsilatını ve doktor bakiyesini verir;
    "hangi tahsilat hangi sevkiyatın primini açtı" eşleştirmesini **yapmaz**.)*
    **Yazılı cevap gerekiyor — bu bilgi bugün varsayım hâlindedir.** → X-1

---

## 3. Eksik gereksinim kova ayrımı

Kovalar: 🔴 canlı öncesi · 🟡 ilk 3 ay · ⚪ sonra · ✅ bilinçli kapsam dışı

### 3.1 Ticari akış

| # | Madde | Öneri | Karar |
|---|---|---|---|
| A-1 | Mal iadesi / kısmi iade | 🔴 | ✅ **KARAR:** İade **ayrı belge**, orijinal sipariş değiştirilmez. İade satırı sipariş satırına referansla **miktar** taşır. İade edilebilir miktar = sevk edilen − önceki iadeler. Oranı kadar cari alacak yazar; prim ve kongre hakkedişini ters kaydeder. **Zorunlu sebep** taşır. **C-6 eki: iade satırı orijinal satırın dondurulmuş `kdv_orani`sini taşır.** **B-7 eki (29.08.2026): "zayiat kaydı" ifadesi buradan çıkarıldı — iadenin karşı tarafı vardır (cari alacak doğar), zayiatın yoktur. Zayiat B-7'nin konusudur.** |
| A-2 | Numune / bedelsiz / promosyon | 🔴 | ✅ **KARAR:** `OrderItem` düzeyinde **bayrak + zorunlu sebep**; ayrı sipariş tipi açılmaz. Stoktan düşer, cariye borç yazmaz, prim/hakkediş üretmez, tutar 0. **Onay kuralı sebebe bağlıdır** → A-8. **C-6 eki: matrah 0, KDV 0 (KDVGUT I/B-10).** |
| A-3 | Kısmi sevkiyat | 🔴 | ✅ **KARAR:** Bir sipariş satırına **birden fazla sevkiyat** bağlanabilir. **Doktor borcu ve satıcı primi sevkiyat anında doğar.** **C-6 eki: her sevkiyat kendi matrah ve KDV'sini yuvarlar.** |
| A-4 | Konsinye stok | 🔴/🟡 | ✅ **KARAR:** Konsinye, stok hareketine eklenen **konum boyutudur**. `StokKonum` tablosu; `StockMovement.konum_id` **zorunlu**. Yerleştirme `KonsinyeCikis` belgesiyle, **mali sonucu yoktur**. **✅ Ek (04.10.2026 · iç karar 10.10.2026) — `StokKonum.tip` kataloğu:** `DEPO` · `KONSINYE` *(kodda kapalı, §0.1.1; ~~kilitlenme anı `CM`~~ → iç karar, §0.6 (2))*. Satış `DEPO`'dan yapılır; `KonsinyeCikis` malı `DEPO`'dan `KONSINYE` konumuna taşır. Bayi deposu (§1.3 bayi kanalı notu) ayrı tip değildir: mal hâlâ bizimse `KONSINYE` satırıdır, bayi satın aldıysa stok bizim değildir ve izlenmez. |
| A-5 | Teklif *(ihale ⚪)* | 🔴 | ✅ **KARAR:** **Teklif ayrı belge değil, siparişin ilk aşamasıdır.** `Siparis.asama` + `teklif_gecerlilik_tarihi`. `TEKLIF` aşaması hiçbir hesaba girmez; dışlama **tek "sayılan belgeler" filtresinde** tanımlanır. **A-14 eki: `SIP` numarası `TEKLIF` aşamasında doğar ve `ONAYLI`'da değişmez.** |
| A-6 | **Açılış bakiyesi** | 🔴 | ✅ **KARAR:** Cari hesapta **`ACILIS` tipli tek hareket**; prim/ciro/kongre hesaplarına dahil edilmez. `vade_tarihi` taşıyabilir. **C-6 eki: KDV kırılımı taşımaz.** **A-14 eki: `ACL` serisinden numara alır.** **D-6 eki (24.09.2026): import tarafında satır `tutar` (pozitif) + `yon` taşır, negatif tutar reddedilir; önizleme özeti mutabakatın girdisidir.** |
| A-7 | **Vade farkı / gecikme faizi** | ⚪/🔴 | ✅ **KARAR:** Vade farkı **otomatik hesaplanmaz**. Borç doğuran her cari harekette `vade_tarihi`; vade **sevkiyat tarihinden** işler. **Kalıcı kalem kapatma tablosu açılmaz.** `VADE_FARKI` **yalnız elle girilir**. Config: `finance.odemeVadesiGunVarsayilan`, `finance.vadeFarkiOrani` (`null`). **A-14 eki: `VDF` serisinden numara alır.** |
| A-8 | Sipariş onay akışı | 🔴 | ✅ **KARAR:** Onay, belgeye yapışan **tek genel blok kaydıdır** (`OnayBlogu`). Belge kaydı engellenmez; açık blok yalnız **sonuç doğuran adımı** durdurur. Kararı **yetki seviyesi** verir; bugün tek seviye: **yönetici**. **Gerekçe her durumda zorunlu.** **✅ Ek (04.10.2026 · iç karar 10.10.2026) — karar kataloğu:** `ONAY` · `RED` *(~~kilitlenme anı `CM`~~ → iç karar, §0.6 (2))*. *"Her durumda"* iki tarafı kapsar: bloğu açan kullanıcı gerekçe yazar (X-4 §(4) `YUMUSAK` — yetkisizse *"onaya gönderildi"*), karar veren de yazar. Yetki seviyesi kolonu **konmaz** — bugün tek seviye vardır, tüketicisi yoktur (§0.1). **✅ Ek (16.10.2026 · ürün sahibi kararı) — `RED`'in sonucu: her kural için son blok geçerlidir.** `RED` sonuç doğuran adımı durdurur; belge iptal edilmek zorunda değildir — açan, **yeni gerekçeyle** yeni blok açabilir ve belge yeniden karara gider. Son blok `ONAY` alırsa adım açılır. Eski bloklar silinmez, izdir (§0.2). Kurallar ayrı değerlendirilir: bir kuralın `ONAY`'ı başka kuralın açık bloğunu geçirmez. **✅ Ek (20.10.2026 · ürün sahibi kararı) — negatif stokta sonuç doğuran adım sevkiyattır.** Stok siparişte değil sevkiyatta düştüğü için (A-3) `NEGATIF_STOK` **yalnız sevkiyatta** denetlenir; sipariş girişinde stok kontrolü yapılmaz. Blok **siparişe** bağlanır. Gerekçesiz sevk → onay diyaloğu. **Yönetici** gerekçeyle sevk eder; blok aynı işlemde `ONAY` alır, iz kalır. **Diğer rol** gerekçe yazarsa **sevkiyat yapılmaz**, sipariş onay bekleyenlere düşer. Kararı verilmemiş blok varken sipariş kimse tarafından sevk edilemez. Son blok `ONAY` ise siparişin sevkiyatları yeniden sorulmadan yapılır. `RED`'den sonra stok hâlâ yetmiyorsa yeni gerekçe yeni blok açar; stok yetiyorsa sevkiyat sorulmadan yapılır (ihlal yok). |
| **A-9** | Cari hesap sahibi tipi (doktor / kurum) | ⚪ | ✅ **KARAR — 09.09.2026 (park kaldırıldı, §1.3 ile birlikte).** **Cari hesap sahibi tek tiptir: `Doktor`.** Ayrı `Kurum`/`Klinik` tablosu açılmaz, **`Doktor.kurum_id` konmaz** (§0.1, on ikinci uygulama). Tüzel/gerçek ayrımı `cari_tip`'te zaten var (A-13); fatura muhatabı `fatura_unvani` + `vkn_tckn`'den okunur. **Aynı VKN tekrarına kısıt konmaz** — bakiye, risk ve prim doktor bazında doğar (K-2, A-12, X-1). Klinik bazında konsolide bakiye talebi bir rapor değil **veri modeli değişikliğidir** ve **ayrı fiyatlı yükseltmedir** (§0.6): `Kurum` tablosu + `kurum_id` + `hesaplaDoktorBakiye()`'ye **kapsam parametresi** — yeni fonksiyon değil, ama **veri taşıma migration'ı**. Bkz. §1.3 §E. *(15.09.2026 — X-8: tablo tek kalır; **bayi de bu tablodadır**, ayrım `hesap_sinifi`.)* |
| A-10 | İskonto / özel fiyat yetkisi | 🔴 | ✅ **KARAR:** **İskonto üst sınırı yoktur**; mekanizma kurulur, değer boş: `pricing.iskontoTavani` = `null`. Satırda `liste_fiyat` ve **`birim_fiyat`** ayrı saklanır; **iskonto oranı türetilir, saklanmaz** *(X-5 §(9)/(10) revizyonu — 13.09.2026)*. **İskonto satır bazındadır.** **C-6 eki: "net tutar" = iskonto sonrası **matrah**.** |
| A-11 | **Ödeme yöntemi / tahsilat kanalı** | 🔴 | ✅ **KARAR:** `OdemeYontemi` **tanım tablosudur**. `tip` kodda kapalı katalog: `NAKIT` · `BANKA` · `POS`. Tahsilatta `odeme_yontemi_id` zorunlu; `komisyon_oran` ve `valor_gun` **kayda kopyalanır ve donar**. **Komisyon cariye dokunmaz.** **(8) Kasa/banka bakiyesi tutulmaz.** **C-2 eki (29.08.2026): `hesap_etiketi` kolonu **konmaz**; müşavir kırılımı ödeme yöntemi adından okur.** |
| A-12 | **Kredi / risk limiti** | 🔴 | ✅ **KARAR:** `Doktor.kredi_limiti` (nullable); `null` = limitsiz. Risk = cari bakiye + `ONAYLI` sevk edilmemiş sipariş tutarı; tek `hesaplaDoktorRisk()`. **Bu fazda bilgi kademesidir.** Limit değişikliği **loglanır**. **C-6 eki: risk tabanı brüttür.** |
| **A-13** | **Doktor kartı vergi kimliği ve fatura adresi** | 🔴 *(şema)* | ✅ **KARAR — 19.08.2026.** Bkz. §3.1.a. Tek `vkn_tckn` alanı · `cari_tip` (varsayılan `TUZEL_KISI`) · `fatura_` önekli alan seti · hepsi nullable · doğrulama **hane sayısından** · eksik kimlik **bilgi kademesi** · **belgeye kimlik dondurulmaz** · değişiklik loglanır · `Sevkiyat.teslimat_adresi`. **C-2 eki: `muhasebe_kodu` salt kayıt alanıdır (§0.3 dördüncü hâl), eşleme girdisi değildir.** |
| **A-14** | **Belge numaralandırma** | 🔴 *(şema)* | ✅ **KARAR — 19.08.2026.** Bkz. §3.1.b. `{ÖNEK}-{YIL}-{SIRA}` · `BelgeSayac` tablosu + satır kilidi · tek `uretBelgeNo()` · `MAX+1` yasak · numara oluşumda doğar, iptalde kalır · global `UNIQUE`. **C-1 eki: `SVK` iç numaradır.** **B-7 eki: 9. önek `DZL` eklendi.** |
| **A-15** | **Nakit tahsilatta tevsik limiti uyarısı** | 🔴 | ✅ **KARAR — 08.09.2026.** Bkz. §3.1.c. Bilgi kademesi uyarısı · **aynı cari + aynı gün + `tip = NAKIT`** toplamı · **şemaya hiçbir alan eklenmez** · config `finance.nakitTevsikLimiti` · nakit tahsilat **engellenmez** · sistem hiçbir zaman "uygundur" demez · teyit metnine 11. madde. |

#### 3.1.a A-13 · Doktor kartı vergi kimliği ve fatura adresi — karar metni

**Mevzuat notu (19.08.2026, teyit edilmeli):** VUK 230, müşterinin adı, ticaret unvanı,
adresi ve **varsa** vergi dairesi ile hesap numarasını zorunlu tutar — "varsa" kelimesi
kritiktir. e-Arşiv tarafında VKN veya TCKN bulunması zorunludur; ancak vergi mükellefi
olmayan nihai tüketiciye düzenlenen faturada vergi dairesi ve VKN/TCKN zorunlu değildir.

**Müşteri beyanı (18.08.2026):** Fatura **genelde doktorun kliniğinin vergi levhasına**
kesiliyor; klinik yoksa **doktora şahıs olarak** kesilebiliyor.

> **KARAR:**
>
> **(1) Tek kimlik alanı.** `Doktor.vkn_tckn` — `varchar(11)`, **nullable**, yalnız rakam.
> Ayrı VKN ve TCKN kolonu **açılmaz**.
>
> **(2) Cari tipi kodda kapalı katalogdur.** `Doktor.cari_tip` — `TUZEL_KISI` | `GERCEK_KISI`,
> **NOT NULL**, **varsayılan `TUZEL_KISI`**.
>
> **(3) Doğrulama `cari_tip`'e değil, hane sayısına bakar.** 10 hane → VKN, 11 hane → TCKN
> kontrol algoritması; başka uzunluk reddedilir. **Sert kısıt.** **Boş bırakmak serbesttir.**
> Varlık doğrulaması (GİB sorgusu) **yoktur**.
>
> **(4) Alan listesi — hepsi nullable:** `fatura_unvani` · `vergi_dairesi` · `fatura_adresi`
> · `fatura_ilce` · `fatura_il` · `eposta` · `telefon` · `muhasebe_kodu`.
> **`fatura_` öneki zorunludur.** Boşsa ad-soyad kullanılır.
> *13.10.2026 — geri not: `telefon`: X-15 §(2) ile NOT NULL + UNIQUE (16.09); varsayım X-15 §(5).*
> **C-2 eki (29.08.2026):** `muhasebe_kodu` **salt kayıt alanıdır** — doğrulanmaz, hiçbir
> hesaba girmez, uyarı üretmez; tüketicisi mutabakatta bakan **insan gözüdür**. Üzerine
> muhasebe eşlemesi kurulmaz.
>
> **(5) Eksik kimlik bilgi kademesidir** (§0.3). `OnayBlogu` **üretilmez**. İki görünürlük
> noktası: doktor listesinde **"eksik fatura bilgisi"** filtresi · `calistirDisaAktarim()`
> çıktısında **eksik satır sayısı uyarısı**. Terfi config noktası
> `finance.faturaBilgisiZorunlu` (`false`).
>
> **(6) Belgeye kimlik dondurulmaz.** Dışa aktarım kimliği **güncel karttan** okur.
> **Kilitlenme anı:** fatura kesme veya e-Fatura entegrasyon modülü.
>
> **(7) Kimlik ve adres değişikliği loglanır.**
>
> **(8) Teslimat adresi belge üstündedir.** `Sevkiyat.teslimat_adresi` (text, nullable) —
> boşsa doktorun adresi kullanılır, doluysa **belgede donar**.
>
> **(9) Ekran düzeni (§0.1 üçüncü kova):** Doktor kartı **iki sekme** — *Genel* ve
> *Fatura bilgileri* (katlanmış).
>
> **Kapsam dışı:** GİB VKN/unvan sorgulama · çoklu adres tablosu · çoklu iletişim tablosu ·
> ülke ve posta kodu alanı · IBAN/banka hesabı · doktor birleştirme.
> *12.10.2026 — geri not: liste **çekirdek doktor kartı** içindir. e-belge modülü yapılandırılmış
> adresi (sokak, bina no, posta kodu) ve mükellef önbelleğini **kendi uzantı tablosunda** tutar;
> `Doktor`'a kolon eklenmez (C-1 §3.3.c revizyon 3-(7)).*

#### 3.1.b A-14 · Belge numaralandırma — karar metni

**Mevzuat notu:** e-Fatura numarası 3 haneli birim kod + 13 haneli müteselsil numaradan
oluşur. **Bu format bizi bağlamaz** — sistem fatura kesmiyor (K-4). Ancak **karıştırılma
riski gerçektir**, bu yüzden format GİB formatına *benzemeyecek* şekilde seçilmiştir.

> **KARAR:**
>
> **(1) Format:** `{ÖNEK}-{YIL}-{SIRA}` · örnek `SIP-2026-000123`. Sıra **6 hane sıfır
> dolgulu**.
>
> **(2) Önek kataloğu kodda kapalıdır** (§0.1.1):
> `SIP` sipariş *(teklif dahil)* · `SVK` sevkiyat · `IAD` iade · `KNS` konsinye çıkış ·
> `TRF` stok transfer · `THS` tahsilat · `ACL` açılış hareketi · `VDF` vade farkı ·
> **`DZL` stok düzeltme (B-7)**.
> Config noktası `belge.onekleri` **belirlenir, açılmaz**.
>
> **(3) Sayaç ayrı tablodadır:** `BelgeSayac` (`onek`, `yil`, `son_deger`) — PK (`onek`,`yil`).
> Numara **satır kilidiyle** (`SELECT … FOR UPDATE`) ve **belgeyi yazan transaction'ın
> içinde** alınır. **`MAX(belge_no)+1` yasaktır.**
>
> **(4) Tek çağrı noktası:** `uretBelgeNo(onek, tx)`.
>
> **(5) Yıl sıfırlaması:** sayaç **kayıt anının takvim yılına** göre çalışır.
> **B-7 eki: `DZL` belgesi geriye tarihlendirilemediği için bu kuralla tam uyumludur.**
>
> **(6) Numara oluşumda doğar, ölmez.** **Aşama değişimi numarayı değiştirmez.** İptal
> edilen belgenin numarası **korunur ve yeniden kullanılmaz**.
>
> **(7) `belge_no` global `UNIQUE`'tir** (tip bazlı değil).
>
> **(8) Kaynaksız kayıt kendi numarasını alır.** `ACILIS` ve `VADE_FARKI` kaynaksızdır.
>
> **(9) Numara değiştirilemez.**
>
> **(10) İç numara ile dış belge numarası ayrıdır *(C-1, 28.08.2026)*.** `belge_no` bizim
> denetim izimizdir; irsaliye/fatura numarası müşterinin yasal belgesidir. **Biri diğerinden
> türetilmez.** **B-7 eki: aynı ayrım `harici_belge_no` (imha/sayım tutanağı) için de
> geçerlidir.**
>
> **Kapsam dışı:** kullanıcı tanımlı numara şablonu · elle numara girişi · şube/depo bazlı
> seri · numara rezervasyonu · boşluk raporu · fatura numarası üretimi.

#### 3.1.c A-15 · Nakit tahsilatta tevsik limiti uyarısı — karar metni *(08.09.2026)*

**Mevzuat notu (08.09.2026 itibarıyla, teyit edilmeli):** Dayanak VUK mük. 257 ve 459 sıra
no'lu Genel Tebliğ; sınır 575 sıra no'lu Tebliğ ile 30.11.2024'ten itibaren 7.000 TL'den
**30.000 TL**'ye çıkarıldı, 572 sıra no'lu Tebliğ ile mükellef olmayanlar da kapsama alındı.
Tebliğ iki kuralı ayrıca örnekliyor: **aynı günde aynı kişiyle** yapılan işlemlerin toplamı
haddi aşarsa **aştığı işlemden itibaren** banka kanalı zorunludur; **kısım kısım** ödemede
**işlemin toplam tutarı** dikkate alınır. Ceza oransaldır, maktu alt sınırları vardır
(2026 tutarları 588 sıra no'lu Tebliğ) ve **hem tahsil edene hem ödeyene** kesilebilir.

**Bulgunun koda karşılığı — biri hesaplanabilir, diğeri asla:**

| Kural | Bizde hesaplanabilir mi |
|---|---|
| Aynı gün + aynı cari + nakit toplamı | ✅ `Tahsilat`, `doktor_id`, tarih, `OdemeYontemi.tip` hepsi bizim verimiz |
| İşlemin toplam tutarı üzerinden kısım kısım | ❌ **Hiçbir fazda** — K-2 tek işaretli bakiye, A-7 kalem kapatma yasağı |

**Genel ERP prensibi:** Kurumsal ERP'lerde nakit tahsilat **kasa hesabına** bağlanır ve
tevsik değerlendirmesi muhasebe tarafında yapılır. **Bizde kasa yoktur** (A-11 §8) → o yol
kapalıdır. Yerli ön muhasebe ürünlerinde konu ağırlıkla **bilgilendirme** düzeyindedir;
sert kontrol standart değildir.

> **KARAR:**
>
> **(1) Bilgi kademesi uyarısı** (§0.3 üçüncü kademe). Tahsilat kaydedilirken
> `OdemeYontemi.tip = NAKIT` ise, **aynı cari + aynı gün + nakit** toplamı limiti aşıyorsa
> uyarı gösterilir; **aşan işlem dâhil**. Kayıt engellenmez, `OnayBlogu` üretilmez.
>
> **(2) Şemaya hiçbir şey eklenmez.** Yeni kolon, yeni tablo yok; hesaplanan toplam
> **saklanmaz**. Kolon testinin üç sorusu da "koyma" der: veri zaten vardır ve her an geriye
> dönük üretilebilir.
>
> **(3) Limit koda gömülmez — config `finance.nakitTevsikLimiti`.** Değer devreye almada
> doldurulur (K-8 §(1)) ve **müşavir teyidine** dayanır; `null` = uyarı kapalı. Limit
> **çalışma anında** okunur, koda gömülü sabit değildir (C-6 deseni). **Kullanıcıya ayar
> ekranı açılmaz** — limit yıllarda bir değişir; §0.1.1'in tanım tablosu eşiğini geçmez.
>
> **(4) Toplama kuralı:** yalnız `tip = NAKIT` sayılır (havale, EFT, kart ve ödeme linki
> finansal kurum kanalıdır). Giriş/çıkış yönü (`yon`) **netleştirilmez, ayrı toplanır**.
> `cari_tip`'e göre **dallanma yapılmaz** — müşterimiz mükellef olduğu için doktorun
> mükellefiyeti kuralı değiştirmez (§0.1.1, K-4 eki: davranış doğurmayan ayrım açılmaz).
>
> **(5) Sistem hiçbir zaman "uygundur" demez.** Yeşil onay, uyum rozeti veya uyum raporu
> yoktur. Uyarı metni **ne kontrol etmediğini** yazar: *"Bu uyarı yalnız aynı gün ve aynı
> cari için yapılan nakit tahsilatları toplar; bir faturanın parça parça tahsil edilmesi
> hâlindeki yükümlülüğü değerlendirmez."* **Gerekçe §0.4:** uyarının yokluğu uyumun varlığı
> sanılırsa sistem sessizce yanlış çalışır.
>
> **(6) Nakit tahsilat engellenmez — kalıcı.** Gerekçe §0.2 tahliye vanası: bloklanan nakit
> tahsilat `HAVALE` olarak kaydedilir ve elimizdeki **tek gerçek veri** bozulur.
>
> **(7) Müşavir tarafında ek iş yoktur.** Tahsilat veri seti ödeme yöntemini zaten taşır
> (C-2 §2, §6); ayrı "nakit" işareti veya yeni veri seti **açılmaz** (§0.8).
>
> **(8) Sözleşme cümlesi — teyit metnine 11. madde:** *"Tahsilatların ödeme kanalına ilişkin
> mevzuata (tevsik zorunluluğu) uygunluğu münhasıran müşterinin ve mali müşavirinin
> sorumluluğundadır. Sistem, girilen ödeme yöntemini kaydeder ve yalnız hatırlatıcı nitelikte
> uyarı gösterir; uygunluk denetimi yapmaz, idareye bildirim göndermez."*
>
> **(9) Pazarlanmaz.** *"Sistemimiz sizi tevsik cezasından korur"* denmez (C-3 §5, K-6 §11).
> Uyarı özellik değil, **teslim şartının parçasıdır**; ayrı fiyatlanmaz.
>
> **Kapsam dışı, kalıcı:** kısım kısım / işlem toplamı kontrolü · kasa hesabı ve nakit çıkışı
> (A-11 §8, C-2 §5) · nakit tahsilatın bloklanması veya onaya bağlanması · beş iş günlük
> düzeltme bildirimi üretimi · ceza tutarı hesabı · yıllık/sözleşme bazlı toplam takibi ·
> `cari_tip`'e göre dallanma · uyum raporu.

### 3.2 Ürün ve stok

| # | Madde | Öneri | Karar |
|---|---|---|---|
| B-1 | Lot / seri no / SKT | — | ✅ **Kapsam dışı** (K-5, K-10) |
| B-2 | ÜTS bildirimi | — | ✅ **Kapsam dışı** (K-5, K-10) |
| B-3 | Barkod / GTIN | — | ✅ **KARAR: Kapsam dışı, sigorta kolonu da konmaz.** `UrunBarkod` tablosu açılmaz, `Urun.barkod` konmaz. Mevcut `Urun.kod` (unique) yeterlidir. **K-10 eki:** barkod okuma **izlenebilirlik modülüyle tek pakettir**. |
| B-4 | **Çoklu depo** | 🔴/🟡 | ✅ **KARAR:** Çoklu depo **şemada zaten desteklidir**; ayrı config veya toggle **yoktur**. **UI davranışı satır sayısından türetilir.** **Tüm stok okumaları tek `hesaplaStok(urun, konum?, tarih?)`'dan geçer; inline `SUM` yasaktır.** `StokTransfer` belgesi (**mali sonucu yok**). **Negatif stok yumuşak kısıttır.** Faz 1'de tek depo seed edilir. **K-10 eki: bu fonksiyon izlenebilirliğin tek geçiş kapısıdır.** **C-2 eki: `tarih?` parametresi eklendi.** **B-7 eki: `DZL` hareketlerini sayar.** |
| B-5 | **Fiyat listesi dönemselliği** | 🟡 | ✅ **KARAR:** `gecerli_baslangic`/`gecerli_bitis` **nullable**. Seçim tek noktadan: `cozumleBirimFiyat(urun, liste, miktar, tarih)`. Tarih aralıkları **çakışamaz — sert kısıt, DB düzeyinde**. Fiyat çözümlenemezse **sessizce son fiyata düşülmez**. Ekranı **Faz 2**'de açılır. *(15.09.2026 — X-10: `liste` parametresinin kaynağı yazıldı: carinin atanmış listesi, yoksa varsayılan liste; atanmış listede satır yoksa varsayılana **düşülmez**.)* |
| B-6 | **Miktar baremli fiyat ve mal fazlası (MF)** | 🔴 | ✅ **KARAR:** Barem ve MF **ayrı mekanizmalardır**. `FiyatListesiSatir.min_adet`; üst sınır tutulmaz. Barem **sipariş satırının toplam miktarına** bakar; **kümülatif/dönemsel barem yapılmaz**. Çözümlenen fiyat satıra yazılarak **dondurulur**. **MF için yeni şema açılmaz.** **Bedelsiz satırlar barem miktarına sayılmaz.** |
| **B-7** | **Stok düzeltme (sayım farkı, fire, kayıp, imha)** | 🔴 *(şema)* | ✅ **KARAR — 29.08.2026.** Bkz. §3.2.a. `StokDuzeltme` belgesi + `DZL` öneki · `StokDuzeltmeSebep` **tanım tablosu** · mali sonucu yok · **geriye tarihlendirilemez** · yönetici + zorunlu gerekçe + log · `harici_belge_no` **salt kayıt alanı** · sayılan belgeler filtresine **6. dışlama**. |

#### 3.2.a B-7 · Stok düzeltme belgesi — karar metni *(29.08.2026)*

**Sorunun kaynağı:** Sistemde stok **hesaplanan** bir sayıdır ve her `StockMovement` bir
belgeden doğar. Fiziksel sayımda fark çıktığında (kırılma, kayıp, miat, sayım hatası,
açılış import hatası) bu farkı kaydedecek **mali sonucu olmayan** hiçbir belge yoktu.
Kullanıcının elindeki tek yol sahte belge girmekti: sahte sevkiyat cariye **borç** ve
satıcıya **prim** yazar (A-3); sahte iade cariye **alacak** yazar ve primi ters kaydeder
(A-1). Yani stok düzeltmek için yapılan hile **mali çekirdeği kirletir** (§0.2 B-7 eki).

**Mevzuat notu (29.08.2026, teyit edilmeli):** Stok düşüşünün vergisel sonucu **sebebe göre
değişir.** Genel kural: imha edilen ya da zayi olan malların alımında ödenen KDV indirim
konusu yapılamaz; daha önce indirilmişse KDV beyannamesinin "İlave Edilecek KDV" satırına
eklenerek indirim hesaplarından çıkarılır. **Ancak tıbbi üründe istisna vardır:** bozulan,
çürüyen, kırılan, yok olan veya kullanım süresi dolan ve insan sağlığı/çevre açısından imha
mecburiyeti bulunan tıbbi ürünler, takdir komisyonu **veya** Sağlık Bakanlığı yetkililerinin
de yer aldığı bir komisyon nezaretinde imha edilirse KDV Kanunu 30/c kapsamında **zayi
sayılmaz** ve yüklenilen KDV indirilebilir. Ayrıca VUK 278/A, bozulma, çürüme veya son
kullanma tarihinin geçmesi gibi nedenlerle imha edilmesi gereken emtianın, bu tür işlemleri
süreklilik arz eden mükelleflerin başvurusuyla takdir komisyonu kararı olmaksızın, tayin
olunan imha oranı dikkate alınarak değerlenmesine imkân verir.

> **Sonuç:** Sebep alanı kozmetik bir etiket değil, **müşavirin karar girdisidir.**

**Genel ERP prensibi:** Düzeltme her ERP'de **çekirdek belgedir** (Odoo *Inventory
Adjustment*, Logo sayım/ambar fişi, SAP physical inventory document) ve **geriye
tarihlendirilemez** — Odoo bunu standart işlevsellikte desteklemez ve iyi bir pratik saymaz,
çünkü stok değeri ile muhasebe kaydı ayrışır. Desenin pahalı yarısı **değerlemedir** ve
bizde maliyet/satın alma olmadığı için o yarı zaten yoktur.

> **KARAR:**
>
> **(1) Yeni belge `StokDuzeltme`, önek `DZL`** (A-14 §2 kataloğunda 9. önek). Başlık +
> satır yapısı; sayım doğası gereği çok satırlıdır.
> Satır alanları: `urun_id` · `konum_id` (zorunlu, A-4) · **`fark_miktar` (±)** ·
> `sebep_id` · `aciklama` (zorunlu, serbest metin).
>
> **(2) Sebep kullanıcı tanım tablosudur** (§0.1.1 B-7 türev kuralı, C-6 `VergiOrani`
> deseni): `StokDuzeltmeSebep` (`kod`, `ad`, `aktif`, `sira`). Satır **silinmez**,
> `aktif = false` yapılır.
> Seed — **mevzuatın ayrımına göre**: `SAYIM_FARKI` · `HASAR` · `KAYIP` · `MIAD_IMHA` ·
> `ACILIS_DUZELTME`. Yeni sebep gerekirse **satır eklenir**, geliştirme gerekmez.
> `DIGER` satırı **konmaz** — analitik değeri öldürür; gerekçe alanı zaten zorunludur.
>
> **(3) Mali sonucu yoktur.** Cari hesaba dokunmaz, prim/ciro/hakkediş üretmez, KDV kırılımı
> taşımaz (C-6 §9 deseni), tahsilata ve risk hesabına girmez. `StokTransfer` ve
> `KonsinyeCikis` ile aynı sınıftır.
>
> **(4) Zaman kilidi: belge tarihi kayıt anıdır, geriye tarihlendirilemez.** Gerekçe:
> C-2'nin tarih parametreli raporları ancak bu kilitle tutarlı kalır — geriye tarihli
> düzeltme, **daha önce müşavire verilmiş bir dönem sonu sayısını sessizce değiştirir**.
>
> **(5) Dış belge referansı — salt kayıt alanı (§0.3 dördüncü hâl, C-1 §2 deseni).**
> `StokDuzeltme.harici_belge_no` — `varchar(64)`, **nullable**, serbest metin. İmha tutanağı,
> komisyon kararı veya sayım tutanağı numarası buraya yazılır.
> · **Doğrulanmaz, formatı zorlanmaz, tekillik aranmaz, zorunlu değildir.**
> · Hiçbir hesaba, filtreye, uyarıya girmez; `OnayBlogu` üretmez.
> · Kolon testi: 2. soruda durur — hangi düzeltmenin hangi tutanağa ait olduğu **sonradan
>   üretilemez**.
>
> **(6) Yönetici yetkisi + zorunlu gerekçe + log.** `OnayBlogu` **kullanılmaz** — belge
> adımını durduran onay değil, yönetimsel eylemdir (§0.3 sınırı, C-3 §6 deseni).
>
> **(7) Negatif stok yumuşak kısıttır** (B-4) — düzeltme stoğu eksiye düşürürse aynı
> mekanizma çalışır, ayrı kural açılmaz.
>
> **(8) Pozitif düzeltme aynı belgeyle yapılır.** Fazla çıkan mal da `DZL` satırıdır.
> *(Fazla çıkan mal müşavir için kayıt dışı alım şüphesi doğurur — gizlenmez, aynı kanaldan
> görünür.)*
>
> **(9) Sistem vergisel sonuç hesaplamaz.** KDV indirim iptali, emsal bedel, gider tutarı,
> 278/A imha oranı ve tutanak düzeni **müşavirin işidir**. Sistem yalnız **miktarı, sebebi,
> tarihi ve varsa tutanak numarasını** kaydeder.
> **Sözleşme cümlesi (teyit metnine 8. madde):** *"Stok düzeltme kayıtlarının vergisel
> sonuçları (KDV indirim düzeltmesi, gider kaydı, imha tutanağı düzeni) müşterinin ve mali
> müşavirinin sorumluluğundadır. Sistem düzeltmenin miktarını ve beyan edilen sebebini
> kaydeder, vergisel değerlendirme yapmaz."*
>
> **(10) C-2 bağlantısı — düzeltmeler görünür olmak zorundadır.** Stok veri setinde `DZL`
> hareketleri **ayrı işaretli** çıkar (bedelsiz satırların C-6 §8'deki deseni), sebep
> kolonuyla birlikte. **Yeni veri seti açılmaz.**
>
> **(11) K-10 bağlantısı:** izlenebilirlik paketi açıldığında `DZL` satırları da kimlik
> taşımak zorunda kalır; geçiş kapısı yine `hesaplaStok()`'tur.
>
> **Maliyet dürüstçe:** Faz 1 şemasına **üç tablo** ekliyor. Gerekçe tablo sayısı değil,
> **alternatifin mali çekirdeği kirletmesidir** (§0.1 B-7 eki).
>
> **Kapsam dışı, kalıcı:** sayım **süreci** yönetimi (sayım listesi basımı, ekip ataması,
> kör sayım, çift sayım, kısmi/döngüsel sayım) · sayım sırasında stok dondurma · barkod veya
> el terminaliyle sayım (B-3, K-10) · fire oranı hesabı ve fire limiti kontrolü · zayiat
> maliyeti, emsal bedel, gider tutarı · KDV indirim iptali hesabı ve "İlave Edilecek KDV"
> üretimi · imha tutanağı **belgesinin** üretimi · takdir komisyonu süreci takibi · geriye
> tarihli düzeltme · düzeltmenin muhasebeleştirilmesi.

### 3.3 Mali ve yasal

| # | Madde | Öneri | Karar |
|---|---|---|---|
| **C-1** | **e-Fatura / e-İrsaliye** | 🔴 | ✅ **KARAR — 28.08.2026 · rev. 09.10 · 10.10 · 12.10.2026.** Bkz. §3.3.c. Sistem hiçbir e-belge üretmez *(kalıcı ürün kararı)* · `Sevkiyat.harici_irsaliye_no` **tek nullable alan** · `harici_fatura_no` **konmaz** · teyit metni **altı madde** *(C-2 ile yedi, B-7 ile sekiz, K-6 ile dokuz oldu)* · ~~🟦 varsayılan: müşteri e-İrsaliye mükellefi değil~~ → **09.10.2026: iç karar, 🟦 kaldırıldı** — kapsam mükellefiyete bağlı değil; e-belge entegrasyonu ~~Faz 3+~~ ayrı fiyatlı modül; Excel çıktısı K-4 §(6). **10.10.2026 (revizyon 2):** e-belge modülü **çekirdek sonrası ilk modül**, ikinci müşteriye satıştan önce hazır · ilk adaptör Anka West'in entegratörü, müşterinin API kullanıcısıyla · tek çatı partnerlikle; özel entegratörlük ve BYOI strateji değil. **12.10.2026 (revizyon 3):** modül sınırı §1.3 §F · ortak e-belge modeli modülde · zamanlayıcı altyapısı modül v1 ile, fiyatsız · durum makinesi (kalıcı kilit `kabul`'de) · cari uzantı tablosu · istisna/tevkifat çekirdek kararı, modül v1 dışında. |
| **C-2** | **Muhasebeye aktarım** | 🟡 | ✅ / 🟦 **KARAR — 29.08.2026.** Bkz. §3.3.d. Sistem **muhasebeleştirme yapmaz** *(kalıcı)* · sorumluluk **ham operasyonel veri düzeyinde** (§0.8) · `hesaplaDoktorBakiye` ve `hesaplaStok` **`tarih?` parametresi alır** · stok veri seti **tutar taşımaz** · `hesap_etiketi` **konmaz** · müşavir erişimi **D-2'ye devredildi**. |
| C-4 | Kongre hukuki görüş | 🔴 *(karar olarak)* | ✅ / 🟦 **K-6 ile tek madde olarak karara bağlandı — bkz. §1.7.** |
| C-5 | **Çoklu para birimi** | ⚪ | ✅ **KARAR: Kapsam dışı; sistem tamamen TL'dir.** **Sigorta kolonu konmaz.** **Ekranda anlık kur çevirisi hiçbir yerde yapılmaz.** |
| **C-6** | **KDV ve fiyatın vergi tabanı** | 🔴 *(şema)* | ✅ **KARAR — 19.08.2026.** Bkz. §3.3.b. `VergiOrani` tanım tablosu · `Urun.vergi_orani_id` · `OrderItem.kdv_orani` **değer olarak donar** · kanonik taban **KDV hariç** · tek `hesaplaSatirTutarlari()` · satır bazlı yuvarlama · **prim/ciro tabanı matrah, cari bakiye brüt**. |
| C-7 | *(K-9'un altyapı/yedekleme maddesi)* | 🔴 | ✅ **K-9 §A-3/§A-4 içinde karara bağlandı** — bkz. §1.6. |
| **C-3** | **KVKK saklama/silme** | 🔴 | ✅ **KARAR — 19.08.2026.** Bkz. §3.3.a. Faz 1: `DELETE` yok · kimlik/ticari ayrımı · özel nitelikli veri yok · rıza mekanizması yok · **belgesiz kayıt fiziksel silinebilir** · teknik tedbir asgarisi · veri işleyen protokolü. Faz 2: **anonimleştirme aracı, ayrı kalem**. Faz 3: otomatik periyodik imha. |

#### 3.3.a C-3 · KVKK saklama ve silme — karar metni

**Mevzuat notu (19.08.2026, teyit edilmeli):** KVKK süre vermez, ilgili mevzuat verir
(VUK 5 yıl, TTK 10 yıl). **Saklama zorunluluğu sürerken silme borcu doğmaz.** İmha üç
yoldan biriyle olur: silme, yok etme veya **anonim hale getirme**. Periyodik imha aralığı
6 ayı geçemez; **saklama ve imha politikası olmayan veri sorumlusu için süre 3 aydır**.

**VERBİS notu:** 04.09.2025 tarihli 2025/1572 sayılı Kurul kararına göre, ana faaliyeti
özel nitelikli veri işleme **olmayan** veri sorumlularında yıllık çalışan sayısı **50'den az
ve** yıllık mali bilanço toplamı **100 milyon TL'den az** olma şartı birlikte aranır.

> **KARAR — Faz 1 (bedelsiz, şimdi):**
>
> **(1)** Ticari kayıt **hiçbir koşulda silinmez veya anonimleştirilmez**; kişisel veriden
> ayrı tutulur. **Sistemde `DELETE` cümlesi kullanılmaz**; kullanım dışı bırakma
> `aktif = false`'tur (§0.2).
>
> | Katman | Örnek | Kural |
> |---|---|---|
> | **Ticari kayıt** | Belge no, tutar, miktar, tarih, prim, bakiye | Asla silinmez/anonimleşmez |
> | **Kimlik verisi** | Ad, soyad, TCKN/VKN, adres, telefon, e-posta | Süre dolunca anonimleştirilir |
>
> **(2) Sistem özel nitelikli kişisel veri tutmaz — yazılı sınır.** Hasta verisi, sağlık
> kaydı, teşhis, hasta kimliği hiçbir tabloda bulunmaz. Doktor bizim için **müşteridir**.
> **K-10 eki:** izlenebilirlik modülü bu sınırı **hastayla ilişki kurulursa** bozar.
> **K-6 eki (29.08.2026):** kongre katılım kaydı doktorun **mesleki faaliyetine** ilişkindir,
> sağlık verisi değildir; sınır bozulmaz.
>
> **(3) Hukuki sebep sözleşmenin ifası ve hukuki yükümlülüktür**; sisteme **rıza toplama
> mekanizması, rıza tablosu veya onay kutusu konmaz** — kalıcı karar.
>
> **(4)** Değişiklik logu (A-13 §7) KVKK md.12 teknik tedbir gereksiniminin karşılığıdır.
> **Görüntüleme/erişim logu kapsam dışı.**
>
> **(5) Sorumluluk sınırı sözleşmeye geçer:** *"Veri sorumlusu sıfatı müşteriye aittir.
> Saklama ve imha politikası, VERBİS kaydı, aydınlatma metni ve ilgili kişi başvurularının
> yönetimi müşterinin sorumluluğundadır."* **Abartılı uyum taahhüdü verilmez** — "sistemimiz
> KVKK uyumludur" gibi bir cümle sorumluluğu kendi elimizle üstlenmek olur.
> **K-6 eki: aynı kural teşvik mimarisi için de geçerlidir (§1.7-11).**
>
> **(6) Hiçbir belgeye bağlı olmayan doktor kaydı fiziksel olarak silinebilir.** Koşul:
> sipariş, sevkiyat, iade, tahsilat ve cari hareket sayısı **sıfır**. **Yönetici yetkisi +
> zorunlu gerekçe**, loglanır. **D-6 eki:** import partisinin geri alınması aynı koşulu
> paylaşır.
>
> **(7) KVKK teknik tedbir asgarisi — teslim şartıdır, ayrı fiyatlanmaz:**
> · Tüm erişim **kimlik doğrulamalı** ve rol bazlı (D-2)
> · Uygulama ve veritabanı **TLS** arkasında; DB dışarıya açık port dinlemez
> · **Yedekler şifreli** ve erişimi sınırlı (K-9 §A-3)
> · Kişisel veri alanlarında **değişiklik logu**
> · Üretim veritabanı kopyası geliştirme ortamına **çıkarılmaz**
>
> **(8) Veri işleyen ek protokolü** — bkz. K-9 §A-6.
>
> **KARAR — Faz 2 (ayrı kalem, "KVKK veri imha paketi"):** Anonimleştirme aracı.
> `Doktor.anonimlestirildi_mi` + `anonimlestirme_tarihi` **kolonları da bu fazda konur**.
> **yönetici + zorunlu gerekçe + log**, geri alınamaz, iki aşamalı teyit.
>
> **KARAR — Faz 3:** Otomatik periyodik imha. **D-1 kademe 2'ye bağımlıdır.**
>
> **Config noktası:** `kvkk.saklamaSuresiYil` (=`10`, TTK 82) Faz 1'de **belirlenir,
> kullanılmaz**.
>
> **Kilitlenme anı: yok.**
>
> **Satış cümlesi (bugün doğrudur):** *"Sistem kişisel veriyi hiç silmez, anonimleştirir;
> ticari kayıt korunur, kimlik kopar. Sistemde hasta verisi bulunmaz. Verileriniz KVKK
> teknik tedbirleri kapsamında Türkiye'de saklanır."*
>
> **Kapsam dışı, kalıcı:** açık rıza toplama ve geri çekme · aydınlatma metni yönetimi ·
> VERBİS kaydı ve envanter üretimi · ilgili kişi başvuru portalı · görüntüleme/erişim logu ·
> rol bazlı alan maskeleme · yurt dışına aktarım mekanizması · veri sınıflandırma motoru.

#### 3.3.b C-6 · KDV ve fiyatın vergi tabanı — karar metni

**Mevzuat notu (19.08.2026, teyit edilmeli):** KDV oranlarını belirleyen Karar'ın ekli
**(II) sayılı listesinde**, "Tıbbi Cihaz Yönetmeliği" ve "İn Vitro Tanı Amaçlı Tıbbi Cihaz
Yönetmeliği" hükümlerine tabi cihazların teslimi ve kiralanması yer alır — yani **indirimli
oran (%10)** kapsamındadır. **Müşterinin "sabit %20" beyanı tek oranlı tasarımı
desteklemez.** Yuvarlamada kuruş esas alınır, iki hane kullanılır. GİB e-Arşiv portalı
**satır KDV'lerini toplar**. Promosyon, eşantiyon ve numunelerin bedelsiz teslimi **KDV'ye
tabi değildir** (KDVGUT I/B-10).

> **KARAR:**
>
> **(1) Vergi oranı kullanıcı tanım tablosudur.** `VergiOrani` (`kod`, `ad`, `oran`
> `Decimal(5,2)`, `aktif`, `sira`). Seed: `KDV20` · `KDV10` · `KDV1` · `KDV0`. Satır
> **silinmez**, `aktif = false` yapılır.
>
> **(2) Ürün orana referans verir.** `Urun.vergi_orani_id` → `VergiOrani`, **NOT NULL**.
> `Urun.kdv_orani` decimal kolonu **konmaz**.
>
> **(2-a) Belgede donan şey FK değil, orandır.** `OrderItem.kdv_orani` — `Decimal(5,2)`,
> **değer olarak** kopyalanır ve donar.
>
> **(2-b) `VergiOrani.oran` değişikliği loglanır** (A-12 deseni).
>
> **(2-c) Config:** `tax.varsayilanVergiOraniKodu` (=`KDV20`).
>
> **(3) Kanonik taban KDV hariçtir.** Birim fiyatlar `Decimal(18,4)`, tutarlar
> `Decimal(18,2)`. **KDV hiçbir yerde saklanmaz, her yerde türetilir.**
>
> **(4) KDV dahil giriş bir çeviri katmanıdır.** Config noktası
> `pricing.fiyatGirisiKdvDahil` (varsayılan `false`). **Veritabanında her zaman matrah
> durur.**
> **Ü-3 eki (09.09.2026) — müşteri beyanı bu katmanı konusuz bıraktı.** Yayınlanan fiyat
> listeleri KDV hariçtir (madde 10-b); dolayısıyla değer **`false` kalır ve config
> AÇILMAZ** — çeviri katmanı, ekranı ve ikinci yuvarlama noktası **Faz 1'de yazılmaz**.
> Barem (B-6) ve satır iskontosu (A-10) da **matrah üzerinde** çalışır; KDV hiçbir indirim
> hesabının girdisi değildir. *Aksi hâlde karma oranlı (%10/%20) bir siparişte aynı adet
> aynı indirimi vermezdi.*
>
> **(5) Satır hesabı ve yuvarlama tek fonksiyondadır.** `hesaplaSatirTutarlari(satir)` →
> `{ matrah, kdv_orani, kdv_tutar, toplam }`. Yuvarlama **2 hane, yarım yukarı**;
> **yalnız bu iki noktada**. **Belge toplamı satır toplamlarının toplamıdır.**
> **Tüm ekran, rapor ve dışa aktarım tutarları bu fonksiyondan geçer; inline
> `fiyat * miktar` yasaktır.**
>
> **(6) Vergi tabanı ayrımı:**
> **Prim, ciro ve kongre hakkedişi tabanı = matrah (KDV hariç).**
> **Cari bakiye, tahsilat, vade ve kredi limiti/risk tabanı = toplam (KDV dahil).**
>
> **(7) Kısmi sevkiyatta KDV sevkiyat satırında hesaplanır.** **Doğru olan cari harekettir**,
> geriye dönük düzeltme yapılmaz (§0.2).
>
> **(8) Bedelsiz satırlarda KDV yoktur.** Dışa aktarımda **ayrı işaretli ve KDV'siz** çıkar.
>
> **(9) `ACILIS` (A-6), `VADE_FARKI` (A-7) ve `DZL` (B-7) KDV kırılımı taşımaz.**
>
> **Kapsam dışı:** KDV tevkifatı · istisna/muafiyet rejimi · oran çözümleme matrisi ·
> iskonto satırının ayrı KDV'si · belge düzeyi yuvarlama farkı kalemi · ÖTV · dövizli KDV.
> *12.10.2026 — geri not: C-6 değişmedi. İstisna/tevkifat oranı ölçümü 🟦 açık maddedir
> (C-1 §3.3.c revizyon 3-(8)); oran anlamlıysa C-6 yeniden açılır ve değişiklik
> `hesaplaSatirTutarlari()` dâhil **çekirdekte** yapılır.*

#### 3.3.c C-1 · e-Fatura / e-İrsaliye — karar metni *(28.08.2026)*

**Mevzuat notu (28.08.2026 itibarıyla, teyit edilmeli):**

- **e-Fatura:** brüt satış hasılatı **3 milyon TL** ve üzeri mükellefler geçmek zorunda.
  Müşteri zaten GİB portalından e-Fatura kesiyor → **mükellef olduğu kesin**.
- **e-İrsaliye:** e-Fatura mükellefi olup 2024 veya 2025 döneminde brüt satış hasılatı
  **10 milyon TL** ve üzeri olanlar **1 Temmuz 2026**'ya kadar geçmek zorundaydı; **bu tarih
  doldu.** Medikal ticaret, ciro sınırı aranmaksızın zorunlu tutulan sektör listesinde
  **yer almıyor**.
- **Kağıt faturanın sonu:** 2027'den itibaren tüm faturaların e-Arşiv olarak düzenlenmesi
  bekleniyor.
- **ÜTS/karekod:** kapsam **1 Ekim 2026**'da değişiyor → K-10 §H.

**Genel ERP prensibi:** SAP, Logo, Netsis ve Odoo'nun tamamında sevk irsaliyesi **çekirdek
belgedir** ve kendi numarasını taşır; e-İrsaliye **ayrı bir dış belgedir**. Çekirdek
sevkiyat belgesinde dış belge için **tek referans alanı** bulunur.

> **KARAR:**
>
> **(1) Sistem hiçbir e-belge üretmez, imzalamaz, göndermez** — e-Fatura, e-Arşiv,
> e-İrsaliye, e-Müstahsil dâhil. **Bu kalıcı bir ürün kararıdır, toggle'ı yoktur.**
> *10.10.2026 — kapsam notu: (1) **çekirdek** için geçerlidir. e-belge modülü (K-4 §(4)) belgeyi
> **entegratör üzerinden** düzenletir; imza ve GİB'e iletim entegratördedir. Modülün öne
> çekilmesi aşağıda, 10.10.2026 revizyonunda.* *(12.10.2026: not onaylandı.)*
>
> **(2) Dış irsaliye numarası için tek alan konur — Faz 1.**
> `Sevkiyat.harici_irsaliye_no` — `varchar(32)`, **nullable**, serbest metin.
> · **Doğrulanmaz, formatı zorlanmaz, tekillik aranmaz.**
> · Hiçbir hesaba, filtreye, prim/ciro/bakiye tabanına girmez.
> · **Uyarı üretmez, `OnayBlogu` üretmez.** §0.3'ün **dördüncü hâli**: salt kayıt alanı.
> · Dışa aktarımda sevkiyat veri setine kolon olarak girer (K-4 §2).
> · **Kolon testi:** 1. soruda durur; geriye dönük üretilemez. **`takip_no` ile aynı sınıf.**
>
> **(3) `SVK` numarası iç numaradır ve dış belgeyle karıştırılmaz** (A-14 §10).
>
> **(4) Fatura numarası kolonu konmaz.** İrsaliye–sevkiyat ilişkisi **1-1**; fatura–sevkiyat
> ilişkisi **N-N**. **Tek kolon bu ilişkiyi yalan söyler.**
>
> **(5) Yazılı teyit metni — on bir madde** *(C-1'de altı, C-2 · B-7 · K-6 ile dokuz, X-1 · A-15 ile on bir oldu)*.
> Sözleşme eki olarak imzalanır:
>
> | # | Beyan | Kaynak |
> |---|---|---|
> | 1 | Satılan ürünlerin ÜTS/İTS tekil takip kapsamında olmadığı ve normal satış faturası düzenlendiği — **kanıt: müşavir imzalı ürün listesi** | K-10 §H-G |
> | 2 | Her ürünün KDV oranının müşavir tarafından ürün bazında bildirildiği | C-6 |
> | 3 | **Sistemin şu an e-belge kesmediği; e-belgelerin müşterinin mevcut entegratör/GİB portalından kesildiği; e-belge entegrasyonunun çekirdek sonrası planlanan modül olduğu (fiyatlama K-8'e göre)** — *bilgilendirme maddesidir; mükellefiyet beyanı istenmez (09.10.2026 · metin 10.10.2026)* | C-1 |
> | 4 | Vade farkı belgesinin sistem dışında elle düzenleneceği | A-7 |
> | 5 | Veri sorumlusu sıfatının müşteride olduğu | C-3 |
> | 6 | Dışa aktarım dosyalarının güvenliğinin müşteriye ait olduğu | K-9 |
> | 7 | **Sistemin muhasebe kaydı üretmediği; stok değerlemesi ve maliyet hesabının müşavire ait olduğu** | **C-2** |
> | 8 | **Stok düzeltme kayıtlarının vergisel sonuçlarının müşteri ve müşavirde olduğu** | **B-7** |
> | 9 | **Kongre desteklerinin mevzuata uygunluğu, TİTCK bildirimi ve destek sınırlarının müşteride olduğu** | **K-6/C-4** |
| 10 | **Satıcı prim ve hakedişlerinin ödeme zamanı ve tutarının müşterinin kararı olduğu; sistemin hakedişi sevkiyat anında hesapladığı, tahsilatla eşleştirme yapmadığı** | **X-1** |
| 11 | **Tahsilatların ödeme kanalına ilişkin mevzuata (tevsik) uygunluğunun müşteri ve mali müşavirde olduğu** | **A-15** |
>
> **(6) Metnin zamanlaması sözleşmeye değil, takvime bağlıdır.** 1. madde **1 Ekim
> 2026'dan önce** imzalanmış olmalıdır. **C-1, Faz 0'ın kalan sırasını beklemez.**
> *09.10.2026 — geri not: 1 Ekim baskısı K-10'dan geliyordu. 08.09.2026'da K-10'un
> kilitlenmesi ikiye ayrıldı (K-10 §I-7: tetikleyici düştü; KDV teyidi canlıya geçişe
> taşındı, K-7 §(7)). C-1 bu ayrımda güncellenmemişti; 09.10.2026 revizyonuyla kapatıldı
> (aşağıda). Teyit metninin imzası bir karar kilidi değil, **canlıya geçiş ön koşuludur**
> (`YOL_HARITASI.md` §5.2).*
>
> **(7) Fatura ve irsaliye hacmi ölçülür.**
>
> **(8) "Opsiyonel" olan ne, olmayan ne:**
>
> | Ne | Durum |
> |---|---|
> | Sistemin e-belge kesmemesi | **Opsiyonel değil** — kalıcı ürün kararı |
> | Sistemin muhasebeleştirme yapmaması (C-2) | **Opsiyonel değil** — kalıcı ürün kararı |
> | `Sevkiyat.harici_irsaliye_no` | **Modül değil** — çekirdekte |
> | e-Fatura entegrasyon modülü (K-4 katman 4) | **Opsiyonel** — ~~Faz 3~~ **çekirdek sonrası ilk modül** *(10.10.2026)*, yalnız Sınıf 1 |
> | İzlenebilirlik paketi (K-10) | **Opsiyonel** — ayrı faz, yalnız Sınıf 1 |
> | Kongre ve teşvik modülü (K-6) | **Opsiyonel** — kapalı teslim, yalnız Sınıf 1 |
>
> ---
> **REVİZYON *(09.10.2026)* — C-1 iç karardır; 🟦 varsayılan kaydı kaldırıldı.**
>
> **Bulgu:** Kayıt *"müşteri e-İrsaliye mükellefi değildir"* varsayılanını taşıyor ve
> kilitlenme anını *"teyit metninin imzası — en geç 1 Ekim 2026"* olarak yazıyordu. Teyit
> metni de müşterinin e-İrsaliye beyanı da **alınmadı**; 1 Ekim geçince kayıt §0.6'nın eski
> otomatik ✅ kuralıyla **sessizce kapanmış görünüyordu**. Asıl hata daha eskidir: C-1'in
> kapsamı müşterinin mükellefiyetine **bağlı değildir** — sistem mükellef olana da olmayana
> da e-belge kesmez. Varsayılan kaydı, cevabı müşteride olmayan bir soruya açılmıştı.
>
> **KARAR (iç karar — müşteri onayına bağlı değildir):**
> · **e-Fatura / e-İrsaliye düzenleme ve gönderimi ürün kapsamında değildir.** Entegrasyon
>   ~~**Faz 3+**~~ *(10.10.2026: çekirdek sonrası ilk modül — aşağıda)*, **ayrı fiyatlı opsiyonel modüldür** (K-4 §(4), §(4)-EK2; K-8 opsiyonel modül
>   kalemi; yalnız Sınıf 1 — K-9).
> · **Müşteri e-belgelerini mevcut entegratör/GİB portalından keser.** Mükellefiyet durumu
>   bu kararı değiştirmez.
> · **İrsaliye numarası `harici_irsaliye_no`'ya elle girilir** (§(2)). Fatura numarası için
>   alan **yoktur** (§(4) — ilişki N-N).
> · **Portala toplu yükleme için Excel çıktısını sistem verir:** K-4 §(6) fatura hazırlık veri
>   seti. Sütun eşlemesi kodda sabitlenmez, `export.sablonTanimi` config noktasından okunur
>   (K-4 §(6)-b); kurulum başına ayrı değer, çünkü her müşteri izole örnektir (K-9). *Bu madde
>   yeni karar değildir, K-4 §(6)'ya atıftır.*
>
> **Gerekçe:** Müşteriler farklı entegratörler kullanıyor; her portala ayrı entegrasyon yazmak
> sürdürülemez (K-4 §(4)-EK2-d: N bakım hattı). ~~Tek çatı altında toplamak şirket ve sermaye
> gerektirir.~~ *(10.10.2026: bu cümle yanlıştı — düzeltilmiş gerekçe aşağıda.)* Öncelik çekirdek yapının oturmasıdır.
>
> **Durum:** C-1 **✅**. Kilitlenme anı alanı **yoktur**. Teyit metninin 3. maddesi beyan
> değil **bilgilendirme maddesidir** (§(5)); metnin imzası **canlıya geçiş ön koşuludur**,
> karar kilidi değildir (`YOL_HARITASI.md` §5.2).
> **Şemaya etki:** yok. `harici_irsaliye_no` → `Shipment.externalDispatchNo`
> `VarChar(32)`; 16 karakterlik GİB e-belge numarasını (3 harf seri + 4 hane yıl + 9 hane
> sıra) alır.
>
> *10.10.2026 — geri not: aşağıdaki not 10.10 revizyonuyla **karara dönüştü** (özel entegratörlük kapsam dışı; tek çatı partnerlikle).*
> **Not — Faz 3, karar değildir:** Tek çatı için **özel entegratör olmak tek yol değildir.**
> Bir entegratörün partner/API programı alternatiftir: daha az sermaye ister, ama müşterinin
> **o entegratöre geçmesini** gerektirir. *Model sıralaması K-4 §(4)-EK2-e'de zaten yazılıdır
> (ilk kurulumda partnerlik/komisyon, bayilik ikinci–üçüncü müşteriden sonra); bu not onu
> değiştirmez, yalnız "müşteri geçişi" bedelini görünür kılar.*
>
> **Kapsam dışı, kalıcı:** e-İrsaliye/e-Arşiv/e-Defter/e-Müstahsil üretimi · irsaliye yanıtı
> takibi · irsaliye–fatura eşleştirme tablosu · irsaliyeli fatura · açık/kapalı fatura
> ayrımı · matbu irsaliye seri/sıra numarası üretimi · ÖKC/yazarkasa fiş entegrasyonu.
> *10.10.2026 — kapsam notu: bu liste **çekirdek** içindir (bkz. (1)'in notu). e-Fatura,
> e-Arşiv ve e-İrsaliye'nin entegratör üzerinden düzenlenmesi modülün konusudur; modülün
> kalıcı kapsam dışı listesi modül yazılırken ayrıca yazılır.* *(12.10.2026: not onaylandı.)*
>
> ---
> **REVİZYON 2 *(10.10.2026)* — e-belge stratejisi: öncelik, model, partner.**
>
> **(a) Gerekçe düzeltmesi.** 09.10 metnindeki *"tek çatı altında toplamak şirket ve sermaye
> gerektirir"* cümlesi yanlıştı. Doğrusu:
> · **Özel entegratörlük kapsam dışıdır** (GİB lisansı, ISO 27001 / ISO 20000-1, sermaye).
> · **Tek çatı, tek bir entegratörle partnerlik üzerinden sağlanır** (K-4 §(4)-EK2-e).
> · **Her müşterinin entegratörüne ayrı adaptör yazmak (BYOI) ürün stratejisi değildir**
>   (K-4 §(4)-EK2-d: N bakım hattı).
>
> **(b) Öncelik — öne çekildi.** e-Fatura / e-Arşiv / e-İrsaliye entegrasyonu ~~Faz 3+~~ →
> **çekirdek sonrası ilk modül.**
> · **Çekirdek deneme teslimi entegrasyonsuz yapılır** (Excel çıktısı — K-4 §(6)).
> · Modül sektör iş akışında kritiktir; **ticarileşmenin ön koşuludur: ikinci müşteriye
>   satıştan önce hazır olmalıdır** (`YOL_HARITASI.md` §5.4, §6).
> · Modül çekirdek denemesiyle **paralel** geliştirilir, Anka West'in entegratörünün test
>   ortamında.
> · Fiyatlama K-8 §(3) opsiyonel modül kuralına göredir (iki parçalı, yalnız Sınıf 1).
>
> **(c) Entegrasyon modeli.**
> · **İlk adaptör Anka West'in mevcut entegratörüne bağlanır** *(entegratör adı tespit
>   edilecek — K-4 §1.5 🟦)*, **müşterinin kendi API kullanıcısıyla.** Bunun için bizim
>   şirket/partnerlik şartımız yoktur; sözleşme müşteri ile entegratör arasındadır.
>   K-4 §(4)-EK2-g aynen geçerlidir: **parola alınmaz**, yalnız müşteri adına düzenlenmiş API
>   kullanıcısı/anahtarı. K-9 §B aynen geçerlidir: **entegratör anahtarı müşteri örneğinde
>   bulunmaz** — saklama yeri modül yazılırken belirlenir.
> · **Bu entegratör partner adayıdır.** Partnerlik uygun değilse başka bir partner seçilir ve
>   Anka West'e geçiş önerilir.
> · **Partner dışı entegratör kullanan müşteri** dosya çıktısıyla çalışır (K-4 §(6)) ya da
>   geçişi partner üzerinden yapılır (*"geçişi biz yapıyoruz"* modeli).
> · **Adaptör tek bir arayüzün arkasında durur.** Arayüz adaptörle birlikte yazılır
>   (K-4 §(4)-EK2-a: sıfır implementasyonlu arayüz yazılmaz). **Yeni entegratör eklemek ürün
>   kararıdır, varsayılan değildir** (§1.3 §(12) deseni).
> · **Partner görüşmesi ilk entegrasyon çalıştıktan sonra yapılır.**
>
> **Not — partner seçim kriterleri (karar değildir):** açık API dokümanı + test ortamı ·
> e-Fatura / e-Arşiv / e-İrsaliye (tercihen kargo) aynı API'de · yazılım firmalarına iş
> ortaklığı/komisyon programı · kontör fiyatı ve geçiş desteği · GİB'in 2026 ISO şartına uyum.
> *12.10.2026 eki:* UBL'i kim üretir (biz/entegratör) — partnerin kabul ettiği girdi formatı
> belirler · müşteri başına alt hesap / ayrı API kimliği desteği var mı · toplu mükellef listesi
> senkronu sunuyor mu · belge durumu için webhook desteği var mı.
>
> **Geri not düşülen yerler:** K-4 §(4) (Sınıf eşlemesi) · K-4 §(4)-EK2 (erteleme ve -e sırası) ·
> (1) ve kalıcı kapsam dışı listesi (çekirdek kapsamı) · (8) tablosu · teyit metni 3. madde.
> **Şemaya etki:** yok. Modül tabloları modül yazıldığı gün girer (§1.3 §(10)).
>
> ---
> **REVİZYON 3 *(12.10.2026)* — modül sınırı, anahtar, zamanlayıcı, durum makinesi, cari
> uzantısı, birim ve istisna.**
>
> Bütün maddeler **§1.3 §F (16)** sınır kurallarına tabidir. Aksi yazılmadıkça **✅ iç
> karardır**; partnere veya ölçüme bağlı kısımlar 🟦'dir.
>
> **(1) Ortak e-belge veri modeli modüle aittir, çekirdekte yer almaz.** Modül çekirdek
> belgelerini **salt okunur** okur ve eşlemeyi kendisi yapar; tutarlar
> `hesaplaSatirTutarlari()`'ndan okunur (C-6 §(5)). **K-4 §(6)-a, §1.3 §(9) ve (1) değişmez;**
> çekirdekteki Excel çıktısı (K-4 §(6)) mevcut hâliyle kalır. *(10.10 turunda önerilen
> "çekirdekte ortak model + UBL-TR dosya çıktısı" geri çekildi; karara hiç girmemişti.)*
>
> **(2) Partner seçim notlarına ek** — revizyon 2 notunda (karar değildir).
>
> **(3) K-8:** bayat BYOI gerekçesi çizildi; kontör/gelir paylaşımı partner anlaşmasında
> belirlenir (🟦); modül ürün açısından ticarileşmenin ön koşulu, müşteri açısından opsiyoneldir
> (K-8 §(3)).
>
> **(4) Anahtar yeri (K-9 §B).**
> · **Kargo anahtarları** müşterinin kendi kargo sözleşmesine aittir; **müşteri örneğinde
>   şifreli tutulabilir** (K-9 §B açıklaması, D-3).
> · ⚠️ **Entegratör anahtarı — uygulanmadı, onay bekliyor.** Önerilen metin (*alt hesap
>   destekleniyorsa müşteriye özgü kimlik müşteri örneğinde durabilir; desteklenmiyorsa ana
>   hesap kimliği konamaz ve modül kontrol düzleminin yalnız anahtar saklayan dilimine bağımlı
>   olur; yol partner seçiminde belirlenir*) K-9 §B'nin *"entegratör anahtarları … hiçbir
>   koşulda müşteri örneğinde bulunmaz"* cümlesiyle çelişir. K-9 §B değişmeden uygulanamaz.
>   Revizyon 2-(c)'deki hüküm yürürlüktedir: anahtar müşteri örneğinde bulunmaz, saklama yeri
>   modül yazılırken belirlenir.
>
> **(5) Zamanlayıcı.**
> · **Altyapı zamanlayıcısı (iş çalıştırıcı):** alan mantığı içermez; modüller kendi işlerini
>   ona kaydeder. **Fiyatlanmaz.** **e-belge modülünün v1 sürümüyle birlikte gelir.** Faz 1
>   kapsamına girmez — Faz 1'de fatura belgesi yoktur (K-4 §(5)). **Kargo modülü aynı altyapıyı
>   kullanır.**
> · **e-belge modülü v1** belge durumunu zamanlayıcıyla **periyodik olarak sorgular**;
>   *"Durumu sorgula"* düğmesi **yedek** olarak kalır. Partner webhook destekliyorsa **webhook
>   birincil kanaldır** (§1.3 §F açık bulgu (i)).
> · **D-1 bildirimleri** (kademe 2) **Faz 3'te ayrı fiyatlı** özellik olarak kalır.
>
> **(6) e-belge durum makinesi ve kilit.**
> · Durumlar: **taslak → iletildi → kabul / hata / beklemede.**
> · **Kalıcı kilit `kabul` durumunda başlar.** `iletildi` ve `beklemede` durumlarında belge
>   **düzenlenemez**, ama kalıcı kilit de yoktur.
> · **`hata` durumundaki belge düzenlenmez ve silinmez;** hata kaydıyla birlikte saklanır.
>   Düzeltme, o belgenin **kopyası olan yeni bir taslakla** yapılır (§0.2 deseni).
> · **Kabul edilmiş belgenin düzeltmesi ters/iade belgesiyle** yapılır (A-1 deseni). Alıcının
>   ticari faturayı **reddetmesi** ayrı bir durumdur; ayrıntısı modül yazılırken belirlenir.
> · GİB/entegratör **hata kodları karara yazılmaz;** kodların bu durumlara eşlenmesi modül
>   yazılırken yapılır.
> · *Not: "entegratöre gönderilmiş belge kilitlenir" ifadesi KARARLAR'da yazılı değildi
>   (10.10.2026 kontrolü: faturaya kilit kuralı yoktu). Bu madde kuralın ilk yazımıdır.*
>
> **🟦 Varsayılan kaydı — hata durumunda numara serisi**
>
> | Alan | İçerik |
> |---|---|
> | **Varsayılan davranış** | `hata` durumundaki belgenin numarası **yeniden kullanılmaz**; numara hata kaydıyla birlikte belgede kalır, düzeltme taslağı yeni numara alır. *(§0.7: GİB sıra kuralı araştırılmadı — teyit edilmeli.)* |
> | **Cevabın değiştirdiği katman** | Yalnız modülün adaptörü ve numara atama mantığı. Çekirdek ve şema etkilenmez. |
> | **Kilitlenme anı** | İlk adaptörün test ortamında **ilk gönderimden önce**; her yeni entegratör/partner adaptöründe yeniden teyit edilir. |
>
> **(7) Cari uzantı tablosu (modül tarafı).**
> · Cari kartla **1:1** ilişkili modül tablosu kurulur; `Doktor`'a kolon eklenmez (§1.3 §(1)).
> · **Yapılandırılmış adres:** sokak · bina no · posta kodu.
> · **Mükellef önbelleği:** mükellef bilgisi + son kontrol tarihi. **Türetilmiş veridir,
>   gerçeğin kaynağı değildir;** tabloda açıkça **önbellek** olarak tanımlanır.
> · **Kural:** belge türü (e-Fatura / e-Arşiv) ve buna bağlı numara serisi **belge
>   oluşturulurken önbellekten** belirlenir. Gönderim anında önbellek belirli bir süreden
>   eskiyse mükellef bilgisi **yeniden sorgulanır**; süre modül yazılırken belirlenir. Partner
>   **toplu liste senkronu** sunuyorsa önbellek o senkronla beslenir.
>
> **(8) Birim kodu, KDV istisnası ve tevkifat.**
> · **Birim kodu** modül tarafında bir eşleme tablosuyla tutulur (FK modül → `Urun`); `Urun`'a
>   kolon eklenmez.
> · **İstisna ve tevkifat çekirdek kararıdır, modül kararı değildir:** müşterinin ödeyeceği
>   tutarı ve dolayısıyla cari alacağı değiştirir. **Modül çekirdekteki tutardan farklı bir
>   fatura tutarı üretemez** (§1.3 §(8)).
> · **C-6 şimdilik değişmez.**
> · Modülde istisnalı/tevkifatlı belgeler **"kalıcı kapsam dışı" değil, "modül v1 dışında"**
>   olarak işaretlenir; v1'de bu belgeler **portalda elle** kesilir.
>
> **🟦 Açık madde — istisnalı/tevkifatlı belge oranı**
>
> | Alan | İçerik |
> |---|---|
> | **Görev** | Anka West'in son 12 ayındaki istisnalı/tevkifatlı belge oranı ölçülür. |
> | **Varsayılan davranış** | İstisnalı/tevkifatlı belgeler modül v1 dışındadır, portalda elle kesilir; C-6 değişmez. |
> | **Cevabın değiştirdiği katman** | Oran anlamlıysa **çekirdek**: C-6 yeniden açılır, değişiklik `hesaplaSatirTutarlari()` dâhil çekirdekte yapılır (§1.3 §(8)). Anlamlı değilse hiçbir katman. |
> | **Kilitlenme anı** | **İkinci müşteriye satıştan önce** (`YOL_HARITASI.md` §5.4). |
>
> **(9) Yer tutucular:** entegratör adı ve kargo firması **tespit edilecek** (K-4 §1.5 🟦, D-3).
>
> **(10) Onay (12.10.2026):** (1)'e ve kalıcı kapsam dışı listesine düşülen *"çekirdek için
> geçerlidir"* notları ile D-3'teki *"kurulum (müşteri örneği) başına"* ifadesi **onaylandı**.
>
> **Geri not düşülen yerler:** §1.3 §F · K-4 §(4) · K-8 §(3) ve kontör parantezi · K-9 §B ·
> D-1 · D-3 · A-13 kapsam dışı · C-6 kapsam dışı · §3.5 · §4 tablosu.
> **Şemaya etki:** yok. Modül tabloları (cari uzantısı, birim eşlemesi, belge ve durum
> tabloları) modül yazıldığı gün girer (§1.3 §(10)).

#### 3.3.d C-2 · Muhasebeye aktarım ve müşavirin veri ihtiyacı — karar metni *(29.08.2026)*

**Mevzuat/pazar bulgusu (29.08.2026 itibarıyla, teyit edilmeli):**

- **Müşavir tarafında gerçek bir muhasebe yazılımı var.** 8 Kasım 2024 tarihli tebliğ
  değişikliğiyle 1 Ocak 2025'ten itibaren bilanço esasına göre defter tutan tüm mükellefler
  için e-Defter zorunlu; müşteri e-Fatura mükellefi olduğuna göre büyük olasılıkla bilanço
  esasındadır.
- **Satış faturaları bize ihtiyaç duymadan müşavire ulaşıyor.** Müşavir yazılımları
  e-Arşiv/e-Fatura'yı GİB'den sorgulayıp KDV oranlarına göre hesap kodu atayarak fişe
  çeviriyor; piyasada bunu yapan ücretsiz aktarım programları var.
- **"Muhasebeye aktarım" hesap planı sahipliği demektir.** Luca'nın Excel fiş aktarımında
  Fiş No, Fiş Tarihi, **Hesap Kodu**, Borç ve Alacak zorunlu; hesap kodlarının sistemde
  önceden açılmış olması gerekiyor.
- **Genel ERP deseni:** Logo'da muhasebe bağlantı kodları hem kart üzerinden hem ayrı bir
  ekrandan tanımlanır, kural bazlı eşleme yapar (ör. "02 ile başlayan malzemeler →
  150.02.001"), masraf merkezi taşır ve **kodu eksik kartta fiş oluşmaz**. Muhasebeleştirme
  tarih aralığı ve periyot seçilerek çalıştırılan ayrı bir işlemdir.
- **Tarihli rapor sektör standardıdır:** Odoo'da "Inventory at the Date" varsayılan bir
  rapordur; stok raporu geçmiş bir tarih itibarıyla da okunabilir. Ancak Odoo **tarihli
  miktar** ile **tarihli değer**i ayırır ve ikincisi maliyet yöntemine bağlıdır.

**Değerlendirilen beş seviye ve seçim:**

| Seviye | Ne | Karar |
|---|---|---|
| 1 · Müşavire salt okunur erişim | Paraşüt deseni | **D-2'ye devredildi** — rol meselesidir |
| 2 · Tarih parametreli veri seti + Excel | Herkeste var | ✅ **Seçildi** |
| 2-b · Tarihli **değer** | Maliyet yöntemi gerekir | ❌ Kapsam dışı |
| 3 · Müşavir şablonu | K-4 §3, Faz 2 | ✅ **Seçildi** (zaten karara bağlıydı) |
| 4 · Bağlantı kodu + fiş üretimi | Logo/Netsis/SAP | ❌ **Kalıcı kapsam dışı** |
| 5 · Müşavir programına otomatik aktarım | Ücretsiz araçlar var | ❌ **Kalıcı kapsam dışı** |

> **KARAR:**
>
> **(0) İlke (§0.8):** *ERP'nin muhasebeye karşı sorumluluğu **ham operasyonel veri**
> düzeyindedir, **hesap kodu** düzeyinde değildir.* K-4 §1'in "fiş üretilmez" kararı,
> "veri verilmez" anlamına gelmez.
>
> **(1) Sistem muhasebeleştirme yapmaz — kalıcı ürün kararı.** Muhasebe fişi, hesap planı,
> hesap eşlemesi, borç/alacak dengeleme, masraf merkezi yoktur. **Toggle'ı yoktur.**
>
> **(2) Müşavirin ERP'den alacağı veri üç başlıktır ve üçü de mevcut veri setleriyle
> karşılanır:**
> · **Tahsilat kırılımı** — GİB faturayı görür, tahsil edilip edilmediğini görmez
> · **Cari mutabakat** — dönem başı `ACILIS` + hareketler + dönem sonu bakiye
> · **Dönem sonu envanter miktarı** — SMM'nin miktar ayağı
> Buna sipariş/doktor/satıcı referansları eşlik eder. **Yeni veri seti açılmaz.**
>
> **(3) Veri setleri tarih parametresi alır; iki tek çağrı noktası fonksiyonunun imzası
> genişler — Faz 1:**
> · `hesaplaDoktorBakiye(doktor, tarih?)`
> · `hesaplaStok(urun, konum?, tarih?)`
> `tarih` boşsa **bugün**; dolu ise **o tarih itibarıyla**. Şema değişmez; veri
> `CariHareket` ve `StockMovement` içinde zaten tarihlidir.
> **Ekranı Faz 2'de açılır** (B-5 deseni: alan hazır, ekran sonra).
> **Gerekçe: dönem sonu dosyası bu imza olmadan yazılırsa inline sorgu doğar.**
>
> **(4) Stok veri seti tutar taşımaz.** Kolonlar: ürün kodu · ürün adı · konum · miktar ·
> tarih (+ B-7 düzeltme işareti ve sebebi). **Maliyet, alış fiyatı ve stok değeri sistemde
> yoktur ve kolon olarak da konmaz** (§0.1 doğrulanabilirlik testi: güncellenmeyen maliyet
> sessizce yanlış SMM üretir). **Değerleme müşavirin işidir**; alış faturaları zaten
> müşavirdedir.
>
> **(5) Tahsilat veri seti kasa defteri değildir.** Sistem para **girişini** kaydeder,
> **çıkışını kaydetmez** (satın alma, gider, personel kalıcı kapsam dışı — §3.5, A-11 §8).
> Çıktının başlığı ve teklif dili **"tahsilat hareket listesi"**dir.
>
> **(6) `OdemeYontemi.hesap_etiketi` konmaz** (§0.1.a C-2 eki). Müşavir kırılımı **ödeme
> yöntemi adından** okur; hesap kodunu kendi tarafında eşler.
>
> **(7) `Doktor.muhasebe_kodu` salt kayıt alanıdır** (§0.3 dördüncü hâl). Üzerine eşleme
> kurulmaz.
>
> **(8) Müşavir yazılımı formatı şablon işidir** (K-4 §3, Faz 2, ayrı kalem). Şablon
> **görünümü** değiştirir; **muhasebeleştirme mantığı içeren şablon yazılmaz**.
>
> **(9) Müşavire salt okunur erişim D-2'nin konusudur.** Bir **rol** meselesidir, C-2'nin
> kapsamı değildir. Not: müşavir kullanıcısı doktor kişisel verisini görür → **ikinci bir
> veri işleyen** doğar ve K-9 §A-6 protokolü ona da gerekir.
>
> **(10) Sözleşme cümlesi — teyit metnine 7. madde:** *"Sistem muhasebe kaydı üretmez;
> operasyonel veri (tahsilat, cari hareket, stok miktarı) sağlar. Stok değerlemesi, maliyet
> hesabı ve muhasebe kayıtlarının mevzuata uygunluğu müşterinin ve mali müşavirinin
> sorumluluğundadır."*
>
> ---
> **🟦 Varsayılan kaydı**
>
> | Alan | İçerik |
> |---|---|
> | **Varsayılan davranış** | **Tahsilat hareket listesi aylık**; **cari ekstre + dönem sonu stok miktar listesi** geçici vergi dönem sonlarında (**31 Mart · 30 Haziran · 30 Eylül**) ve **31 Aralık**'ta. Üçü de mevcut veri setlerinden tarih parametreli üretilir; **yeni veri seti ve tutar kolonu eklenmez**. |
> | **Cevabın değiştirdiği katman** | **Yalnız Faz 2 veri seti kolonları ve şablon satırı.** Şema etkilenmez; (3)'teki imza genişlemesi cevap ne olursa olsun gereklidir. |
> | **Kilitlenme anı** | İmza tarafında **Faz 1** (fonksiyonlar yazılırken). Kolon tarafında Faz 2 dışa aktarım tasarımı. |
>
> **Neden bu varsayılan:** Periyot yanlış çıkarsa **parametre değişir** — sıfır maliyet.
> Tarih parametresini hiç koymamak ise sonradan **her çağıranı gözden geçirmek** demektir.
>
> ---
> **REVİZYON *(09.09.2026)* — 14-a beklenmez; varsayılan çıkarımla sabitlendi.**
>
> **(a) İçerik değişmez.** Üç başlık (§2) **analizle** sabitlendi; müşavirin cevabı bunu
> genişletmez. **Yeni veri seti açılmaz** (D-5 §1).
> **(b) Periyot "genel pratiğe" değil, beyan takvimine bağlanır** *(teyit edilmeli)*:
> geçici vergi beyanı **üç dönemdir** (dördüncü dönem kaldırıldı), son çeyreğin yerini yıllık
> beyanname alır; KDV beyanı aylıktır. Tarihler **E-1'e göre** okunur.
> **(c) Bu bir çıkarımdır, müşteri veya müşavir beyanı değildir** (§0.6, X-1 notu). Karar
> metnine **beyan diye yazılmaz**; teklife ve eğitime **"önerilen kullanım"** olarak girer.
> **(d) Periyot koda girmez.** Zamanlayıcı yoktur (D-1 kademe 2); veri setini kullanıcı
> **elle** çalıştırır. §0.1 triyajında **üçüncü kova**.
> **(e) 14-a kapanmaz, tersine çevrilir — numune yöntemi.** Müşaviriden örnek dosya istemek
> yerine **biz numune veririz**: canlıya çıkıştan sonraki ilk dönemde üç çıktı üretilir,
> müşavire gönderilir, *"eksik kolon var mı"* diye sorulur. **Ölçüm satış konuşmasına değil,
> teslim sürecine konur** (K-10 §H-E deseni). *Boş bir soruya cevap alınamıyor; elde dosya
> varken alınıyor.*
> **(f) Genişleme talebi gelirse — dal bugünden yazılı.** Hesap kodu, mizan, stok değeri veya
> fiş talebi **kapsam dışıdır, ayrı kalem bile değildir** (§0.8, C-2 kalıcı listesi). Talep
> yalnız **kolon adı, sıra veya biçim** düzeyindeyse **Faz 2 şablon katmanına** düşer
> (K-4 §3, ayrı kalem).
> **(g) Durum:** C-2 **🟦 kalır**, ✅ olmaz. Değişen tek şey **beklemenin bitmesidir**.
>
> **Kapsam dışı, kalıcı:** muhasebe fişi üretimi · hesap planı ve hesap eşleme tablosu ·
> masraf merkezi · Ba/Bs formu · KDV beyanname kırılımı · dönem sonu/kapanış fişi ·
> müşavir yazılımına otomatik gönderim · stok değerleme ve maliyet yöntemi.

### 3.4 Operasyon

| # | Madde | Öneri | Karar |
|---|---|---|---|
| D-1 | **Bildirim (e-posta/SMS)** | 🟡 *(olay noktası 🔴)* | ✅ **KARAR:** Bildirim **opsiyonel modül**. Faz 1'de yalnız **olay noktaları** tanımlanır ve çağrılır; handler'ları **boştur**: `onBlokAcildi`, `onBlokKararaBaglandi`, `onSevkiyatTamamlandi`, `onIadeKaydedildi`. **Kademe 1 — Faz 2:** olaya bağlı e-posta. **Kademe 2 — Faz 3: zamanlayıcı altyapısı.** **A-7, D-3, K-4 ve C-3 periyodik imhası buna bağımlıdır.** `notifications.enabled` (`false`). **Geri not (12.10.2026):** zamanlayıcı **altyapısı** (iş çalıştırıcı — alan mantığı yok, fiyatlanmaz) **e-belge modülü v1 ile gelir** (C-1 §3.3.c revizyon 3-(5)); **kademe 2 bildirimleri Faz 3'te ayrı fiyatlı kalır.** Altyapıyı kullanacak diğer işler (A-7, C-3 periyodik imha, zamanlanmış dışa aktarım) kendi kararlarıyla açılır; altyapının gelmesi onları açmaz. |
| D-2 | Rol granülerliği | 🟡 | ✅ **KARAR (07.09.2026) — bkz. §3.4.a.** **Üç rol, kapalı katalog:** `YONETICI` · `OPERASYON` · `SATICI`. `Kullanici.rol` enum; **yetki matrisi ekranı ve kullanıcı tanımlı rol yapılmaz** (§0.1.1 — rol davranış doğurur). `StokDuzeltme` **yalnız `YONETICI`** (B-7). **`MUSAVIR` rolü Faz 1'de YOKTUR** — müşavir verisi dışa aktarımla gider (C-2, D-5); talep gelirse eklenir, **şartı veri işleyen protokolüdür**. Satıcı izolasyonu yapılmaz, **kapısı açılır**: `kapsamliDoktorlariGetir()`. **Bayi cari tipidir, kullanıcı değildir; bayi paneli Faz 3+ opsiyonel modül.** |
| D-3 | **Kargo takip entegrasyonu** | 🔴/Faz 3 | ✅ **KARAR:** `KargoFirma` **tanım tablosu**. `takip_url_sablonu` içinde `{takip_no}`; **entegrasyon olmadan da her firma çalışır**. `Sevkiyat.kargo_firma_id`, `takip_no`, `gonderi_tarihi` **Faz 1'de görünür**. **API entegrasyonu ~~Faz 3~~ e-belge modülünden sonra *(10.10)*, sağlayıcı başına fiyat.** **REVİZYON (10.10.2026):** Kargo entegrasyonu **e-belge modülünden sonra** gelen modüldür (C-1 §3.3.c revizyon 2) · tek **adaptör arayüzü** arkasında durur · **kargoda BYOI doğal modeldir:** kargo anlaşması müşteriye aittir, müşterinin kendi anlaşması ve API bilgileri kullanılır *(e-belgedeki "BYOI strateji değildir" kuralının istisnası değil, farklı sınıfı: orada sözleşmeyi biz kurabiliriz, burada kuramayız)* · **ilk adaptör Anka West'in kargo firmasıdır** *(firma tespit edilecek)*; diğer firmalar talep geldikçe eklenir · müşterinin API bilgileri **kurulum (müşteri örneği) başına şifreli** saklanır *(12.10: ifade onaylandı)* *(~~saklama yeri modül yazılırken K-9 §B ile birlikte belirlenir~~ → 12.10: **müşteri örneğinde şifreli tutulabilir** — K-9 §B açıklaması)* · **Faz 1'e şema kolonu eklenmez** — modül tabloları modül yazıldığı gün girer (§1.3 §(10)). **Geri not (12.10.2026):** kargo modülü §1.3 §F sınır kurallarına tabidir ve e-belge modülüyle gelen **altyapı zamanlayıcısını** kullanır (C-1 §3.3.c revizyon 3-(5)); D-1 kademe 2'ye bağımlılığı kalktı. |
| D-4 | **Satıcı hedefi / kotası** | ⚪ | ✅ **KARAR: Ertelenir, sınırı bugünden sabittir.** Prim **yalnız ciro üzerindendir**. **Prim oranının hedefe / dönemsel ciroya bağlanması kalıcı olarak kapsam dışıdır** (§0.4). |
| **D-5** | Excel dışa aktarım | 🟡 | ✅ **KARAR — 09.09.2026. Bkz. §3.4.b.** Kapsam **altı veri setiyle kapalı** · dönem parametreleri **E-1'e bağlandı** · dışa aktarım **yalnız `YONETICI`** · **her dışa aktarım veritabanında loglanır** (yeni tablo) · üretilen dosya **sunucuda saklanmaz**. *Önceki hâli:* Zaten Ü-5. **K-4 ile mimarisi belirlendi**, **C-2 ile kapsamı sabitlendi**: beş veri seti, tarih parametreli, stokta tutar yok. Kalan iş yalnız kapsam teyidi. **D-2 eki (07.09.2026): müşavir rolü olmadığı için veri setlerini firma sahibi çalıştırır; dışa aktarım `YONETICI` yetkisindedir ve sayılan belgeler filtresine tabidir.** |
| D-6 | Toplu veri girişi (import) | 🔴 | ✅ **KARAR:** Kapsam **doktor, ürün/fiyat listesi, açılış bakiyesi** ile sınırlı. Import **üç aşamalı**: doğrula → önizle → tek transaction'da yaz. Her import **parti numarası** taşır ve **geri alınabilir**. **Canlıya geçiş şartı:** açılış bakiyesi mutabakatının **yazılı teyidi**. **Ekler:** fiyat import'u çok satırlı barem (B-6) · açılış bakiyesi nullable vade (A-7) · doktor import'u nullable `kredi_limiti` (A-12) · açılış stoğu konum bazında (B-4) · ~~**doktor import'u kimlik ve `fatura_` alanları + `cari_tip` (A-13)**~~ → **cari import'u, `YONETICI` cari açma akışının toplu hâlidir · kısmi yazma yok · yalnız `YONETICI` (X-16, 13.10.2026)** · **ürün import'u `VergiOrani` kodu kolonu (C-6)** · **ürün import'u ÜTS sütununu OKUMAZ (K-10)** · **açılış stoğu hatası `DZL`/`ACILIS_DUZELTME` ile düzeltilir, import geri alınmaz (B-7)**. **Ek (24.09.2026) — açılış bakiyesinde işaret:** satır `tutar` (**pozitif**) + `yon` (`BORC`/`ALACAK`) taşır; **negatif tutar `TUTAR_NEGATIF` ile reddedilir** (sert, §0.3). İşaret yöne çevrilmez, mutlak değeri alınmaz — modelde işaret yoktur (X-11 §(3)) ve yanlış yazılan yön sonradan düzeltilemez, ancak ters hareketle kapanır (X-11 §(5), §0.2). Dosyanın müşterinin defterindeki işaret alışkanlığına uyarlanması **ürün kararı değildir** (§0.2). **Ek (24.09.2026) — açılış bakiyesi önizlemesi:** **cari adedi · toplam borç · toplam alacak · net** gösterir; oran gösterilmez, tek birleşik tutar yeterli sayılmaz (§0.4 oran kuralı). Tutarlar brüttür ve **taban etiketi taşır** (Ü-3 §(6)); açılış hareketi KDV kırılımı taşımaz (A-6, C-6 §(3)). **Mutabakatın yazılı teyidi (K-7 §(4)) bu sayılara dayanır** ve teyit **yazmadan önce** alınır. **Ek (01.10.2026) — doktor import'unda sahip:** sahip kolonu ya boştur ya da aktif bir `SATICI`'yı gösterir; `BAYI` satırında doluysa satır reddedilir (`BAYI_SAHIP_ATANAMAZ`). Sahiplik `degistirDoktorSahibi()` ile yazılır, gerekçesi partidir — X-17 §(7). *13.10.2026 — geri not (X-16 §(10)): geri alma tek çare değildir; koşulu (C-3 §(6)) sağlanmayan partinin düzeltme yolu elle düzeltmedir. **Kısmi geri alma yoktur.** Açılış bakiyesi hatası `TERS_KAYIT` ile düzeltilir, parti geri alınmaz.* |

#### 3.4.a · D-2 · Rol tasarımı — ✅ **KARAR (07.09.2026)**

**§0.7 bulgusu *(05.09.2026, teyit edilmeli)*.** Sektörde mali müşavirlerin müşterinin
hesabıyla giriş yaptığı pratik gerçektir; **ancak pazar lideri bunu çözülmesi gereken bir
sorun sayıp akışı tersine çevirmiştir**: mükellef müşaviri davet eder, müşavir **parola
tanımlamasına gerek olmadan** erişir. KVKK Veri Güvenliği Rehberi erişimin sınırlandırılmasını
ve **kullanıcı adı ile parola kullanılarak** erişim sağlanmasını ister; Kurul kararlarında
erişim yetkilendirmesi ve log tutulmaması hâlinde **idari para cezası** uygulanmıştır.
**§0.9 uygulaması:** fiilî pratik ile doğru tasarım ayrıştığında ürün **doğru tasarıma** göre
kurulur — *ilişkiyi gizlemek çözüm değildir, kurmamak çözümdür.*

> **KARAR (D-2):** Faz 1'de **üç rol** vardır ve rol **kapalı katalogdur** (§0.1.1 — rol
> davranış doğurur, etiket farkı değildir): `YONETICI` · `OPERASYON` · `SATICI`.
> `Kullanici.rol` **enum**'dur. **Yetki matrisi ekranı, kullanıcı tanımlı rol ve ayrı `Yetki`
> tablosu yapılmaz.** İzin kümeleri **kodda sabittir**.
>
> **(1) Yetki dağılımı.**
>
> | Rol | Yapar | Yapamaz |
> |---|---|---|
> | `YONETICI` | Tümü; `StokDuzeltme`, fiyat/barem tanımı, tanım tabloları, kullanıcı yönetimi, dışa aktarım | — |
> | `OPERASYON` | Sipariş, sevkiyat, tahsilat, stok hareketi, cari görüntüleme | `StokDuzeltme` · fiyat tanımı · tanım tabloları · kullanıcı yönetimi · **prim/hakediş raporu (X-1 §8)** · **dışa aktarım (D-5 §4)** |
> | `SATICI` | Ürün ve stok görür, sipariş girer, **yalnız kendi doktorları** *(X-13)* ve kargo takibi, **yalnız kendi prim/hakedişi (ekranda)** | Başka satıcının primi · fiyat/barem tanımı · `StokDuzeltme` · tanım tabloları · **dışa aktarım — kendi prim raporunu dosya olarak indiremez (D-5 §4)** |
>
> **(2) `StokDuzeltme` yalnız `YONETICI`'dedir.** B-7'nin *"yönetici + zorunlu gerekçe + log"*
> kuralı ancak **yönetici olmayan bir rol varsa** anlam taşır. **Üç rolün asıl gerekçesi budur;
> iki rolde herkes yönetici olur ve kısıt kaybolur.**
>
> **(3) Satıcı veri izolasyonu Faz 1'de yapılmaz, kapısı açılır.** Satıcıya bağlı veri
> okumaları **tek fonksiyondan** geçer: **`kapsamliDoktorlariGetir(kullanici)`**. Faz 1'de bu
> fonksiyon **herkesi döndürür**. İzolasyon talebi gelirse **tek fonksiyon değişir**.
> **Ekranda gizleyip sorguda gizlemek yasaktır** — veri dışa aktarımdan, rapordan veya
> unutulan bir uçtan sızar ve sistem *sessizce yanlış çalışır* (§0.1 doğrulanabilirlik).
> **Yarım izolasyon, izolasyonsuzluktan pahalıdır.**
> · **Redaksiyon 16.09.2026 (X-13):** Bu maddenin tetikleyicisi (*"izolasyon talebi gelirse"*)
>   **gerçekleşmiş sayıldı**. PRD FR-05 (*zorunlu*) ve bugünkü kod satıcıya yalnız kendi doktorlarını
>   gösteriyordu. **Faz 1'de `kapsamliDoktorlariGetir()` `SATICI`'ya yalnız sahibi olduğu `DOKTOR`
>   carilerini döndürür.** *"Herkesi döndürür"* ifadesi geçersizdir. Kuralın geri kalanı aynen geçerlidir:
>   süzme **sorgudadır**, tek fonksiyondadır, ekranda gizleme yasaktır. Ayrıntı §5.16.
>
> **(4) Faz 1'de uygulanan tek gerçek kısıt:** prim ve hakediş **yalnız kendi verisi**
> (`getSellerReports`). Tek noktada uygulanır, doğrulanabilir.
> ⚠️ **Aynı fonksiyona X-1 (dönem filtresi) düzeltmesi de geliyor — tek seferde yapılmalıdır,
> yoksa ikincisi birincisini bozar.**
>
> **(5) `MUSAVIR` rolü Faz 1'de YOKTUR.** Müşavirin veri ihtiyacı C-2'de kapatılmıştır
> (tahsilat kırılımı, cari mutabakat, dönem sonu stok miktarı) ve **dışa aktarımla** karşılanır
> (D-5); veri **firma sahibinin eliyle** gider. Gerekçe: rol vermek **ikinci veri işleyen**
> yükümlülüğü üretir, vermemek üretmez; ve rol **kapalı katalog** olduğu için sonradan eklemek
> **bir enum satırıdır** — geriye dönük üretilemeyen veri yoktur (§0.1.a ikinci testi bu
> maddede **geçmez**). **Talep gelirse eklenir; açılma şartı veri işleyen protokolüdür**
> (K-9 §A-6). *(C-2'nin D-2'ye devrettiği madde bu kararla kapanmıştır.)*
>
> **(6) Bayi bir cari tipidir, kullanıcı değildir** (A-13 `cari_tip`). Bayi sisteme giriş
> yapmaz; bayi işlemlerini firma girer (`recordDealerPayment`). **Bayi paneli** (sipariş takibi
> + cari görüntüleme) **opsiyonel modüldür**: Faz 3+, **yalnız Sınıf 1** (dış kullanıcı,
> internete açık hesap, parola sıfırlama, destek yükü — K-9). **Faz 1'de şemaya hiçbir alan
> eklenmez**; panel geldiğinde bayi carisine **nullable `Kullanici`** bağlanır.
> · **Redaksiyon 15.09.2026 (X-8):** *"cari tipi"* ifadesi A-13 `cari_tip`'i (tüzel/gerçek
>   kişi) kastetmez; bayi ayrımı **`Doktor.hesap_sinifi = BAYI`** ile yapılır. `recordDealerPayment`
>   sökülür; bayi tahsilatı genel tahsilat akışıdır (§5.11).
>
> **(7) Roller abonelik paketine dâhildir, ayrı fiyatlanmaz.** C-3: rol bazlı erişim KVKK
> teknik tedbir asgarisidir — **teslim şartı, özellik değil** (K-9 §A deseni, K-8 §(2)).
>
> **(8) Sözleşme maddesi:** hesap paylaşımı **yasaktır**; paylaşılan hesapla yapılan
> işlemlerin sorumluluğu müşteriye aittir. **Paylaşılan hesap denetim izini bozmaz —
> sessizce yanlış çalıştırır** (§0.1, A-8): log'daki isim işi yapan kişi olmaz.
>
> **✅ Ek (17.10.2026 · ürün sahibi kararı) — `OPERASYON` ekran matrisinin açık dört noktası.**
> §(1) tablosu `OPERASYON`'un yaptığını sayar; tabloda geçmeyen dört nokta tabloya harfiyen okunarak kapandı:
> · **Cari açmaz.** "Cari görüntüleme" yalnız görmektir. `DOKTOR`'u `SATICI` ya da `YONETICI` açar
>   (X-13 §(2)); `BAYI`'yi **yalnız `YONETICI`** açar (X-8 §(5)).
> · **Ürün kartını görür, açmaz ve düzenlemez.** Ürün tanımı `YONETICI`'dedir; stok hareketi `OPERASYON`'dadır.
> · **Raporlar ekranını görmez** — prim tablosu (X-1 §(8)) dahil hiçbir raporu.
> · **Denetim kaydı (audit log) ekranını görmez.**
> · **Dashboard'u görür; giriş sonrası ana sayfası Dashboard'dur.** Ekran prim/hakediş taşımaz.
> · **Satıcılar ekranını salt okur** — liste ve satıcı detayı. Satıcı ekleme, düzenleme,
>   pasifleştirme ve silme kullanıcı yönetimidir, **yalnız `YONETICI`**.

**Kapsam dışı (D-2), kalıcı:** kullanıcı tanımlı rol · yetki matrisi ekranı · alan bazlı
yetki · onay hiyerarşisi · çoklu şube yetkisi · doktorun kendi paneli (§3.5).

#### 3.4.b D-5 (Ü-5) · Excel dışa aktarım kapsam teyidi — karar metni *(09.09.2026)*

Mimarisi K-4 §2'de, kapsamı C-2'de, yetkisi D-2'de sabitlenmişti. Kalan iş **teyit** ve
**iki gerçek boşluğun** kapatılmasıydı.

**Altı veri seti (K-4 §2 + §(6)):** cari hareket · tahsilat · sipariş · stok · doktor
listesi · **fatura hazırlık**.

**Boşluk 1 — dışa aktarımın kendisi loglanmıyordu.** K-9 §A-5 *"dışa aktarım dosyalarının
güvenliği müşteriye aittir"* diyor (teyit metni 6. madde), ama **kimin ne zaman ne
çıkardığı** hiçbir yerde kayıtlı değildi. Bu dosyalar VKN, unvan, adres, telefon ve tutar
taşıyor — **sistemin en yoğun kişisel veri çıkışı**.
**Boşluk 2 — E-1 burada ilk kez uygulanıyor:** veri setlerinin üçü **aralık**, biri **nokta**
okuyor.

**§0.7 notu:** Yeni araştırma gerekmedi. KVKK Kişisel Veri Güvenliği Rehberi kişisel veri
içeren ortamlara erişimin sınırlandırılmasını ve **erişim kayıtlarının düzenli kontrol
edilmesini** istiyor; Kurul kararlarında erişim yetkilendirmesi ve log tutulmaması idari para
cezasıyla sonuçlandı (D-2 §0.7). **Toplu veri çıkışının izsiz olması, tek kayıt
görüntülemenin izsiz olmasından farklı bir risktir.**

**Genel ERP prensibi:** SAP, Logo ve Odoo'da dışa aktarım **ayrı bir yetkidir**, okuma
yetkisiyle gelmez (Odoo'da `Export` hakkı gruptan ayrı verilir). Gerekçe her yerde aynı:
**ekranda tek kayıt görmekle 4.000 satırı diske indirmek aynı eylem değildir.**

> **KARAR (D-5 / Ü-5):**
>
> **(1) Kapsam altı veri setiyle kapalıdır** (§0.1.1, K-4 §2). **Yedincisi geliştirmedir,
> ayar değil.**
>
> **(2) Hepsi tek fonksiyondan geçer:** `calistirDisaAktarim(kod, parametreler)` →
> `{ kolonlar, satirlar }`. Format katmanı **iş kavramı tanımaz**. **Sayılan belgeler
> filtresi zorunludur; inline `where` yasaktır** (A-5, K-4 §2).
>
> **(3) Dönem parametresi E-1'e bağlanır — ilk uygulama.**
> · **Aralık okuyanlar** (cari hareket · tahsilat · sipariş · fatura hazırlık):
>   `{ baslangic, bitis }` **zorunlu**, **yarı açık** `[baslangic, bitis)` (E-1 §4).
>   *"Tüm zamanlar"* **bilinçli seçimdir**, varsayılan değildir (X-1 §2 deseni).
> · **Nokta okuyan** (stok): tek `tarih`, **o günün Istanbul günü sonu itibarıyla**
>   (E-1 §5, C-2 §3).
> · **Parametresiz** (doktor listesi): güncel kart durumu.
> · **İkisi bir veri setinde birleştirilmez** (X-1 §3).
>
> **(4) Dışa aktarım `YONETICI` yetkisindedir** (D-2 §(1), teyit). `OPERASYON` ve `SATICI`
> **hiçbir veri setini çalıştıramaz** — `SATICI` kendi prim raporunu **ekranda görür, dosya
> olarak indiremez**. Gerekçe X-1 §8'in devamıdır: prim **ücret ekidir**; dosyaya dönünce
> sistemin dışına çıkar. **`MUSAVIR` rolü yoktur** (D-2 §5); veri **firma sahibinin eliyle**
> gider.
>
> **(5) Her dışa aktarım loglanır — YENİ.** Yazılan: zaman (UTC, E-1) · kullanıcı
> **kimliği** · veri seti kodu · **parametreler (tarih aralığı)** · **satır sayısı**.
> **Yazılmayan:** satırların kendisi, doktor adı, VKN, tutar (X-3 §6, C-3 §4).
> · **Kayıt kalıcıdır ve veritabanındadır** — X-3'ün *"log container çıktısına"* kuralının
>   **tek istisnasıdır**. Gerekçe: bu bir teknik hata izi değil, **kişisel veri çıkışının
>   denetim izidir** (C-3 §4 teknik tedbir kapsamı).
> · **Görüntüleme logu değildir ve olmayacaktır** (C-3 §4 kalıcı). Ayrım nettir:
>   **ekranda okumak değil, dosya üretmek** loglanır.
> · **Ekranı yoktur**; kayıt denetim ve olay incelemesi içindir.
> · **Yeni tablo gerektirir** — dürüstçe yazılıdır (§0.1 karmaşıklık ölçeği).
>
> **(6) Kolon testi §(5) için:** **ikinci soruda durur** — kimin ne çıkardığı **sonradan
> üretilemez**. Kaydın yokluğu, sızıntı anında *"bu dosya sistemden mi çıktı"* sorusunu
> **cevapsız** bırakır (§0.1 doğrulanabilirlik).
>
> **(7) Şablon katmanı Faz 2'dir ve açılmaz** (K-4 §3). `export.sablonTanimi`
> **belirlenmiştir, doldurulmaz** — tek istisna **K-4 §(6) fatura hazırlık sütun
> eşlemesidir** ve o **devreye almada** doldurulur; kullanıcıya ayar ekranı açılmaz.
>
> **(8) Fatura hazırlık veri setinin iki ek şartı vardır** (K-4 §(6), K-7 §(7)):
> · **İlk çıktı üretilmeden önce K-7 §(4) yazılı teyidi alınmış olmalıdır.** Sert kısıt
>   değil, **teslim şartıdır**; kod kontrol etmez, süreç kontrol eder.
> · **7 gün uyarısı bilgi kademesidir** (K-4 §6-d), **X-4 §(4) `BILGI` deseniyle** gösterilir
>   ve **takvim günü** üzerinden sayılır (E-1 §9).
>
> **(9) Çıktı biçimi Excel ve CSV'dir**; PDF ve XML **Faz 2+ yazıcı işidir** (K-4 §2). Tarih
> kolonları **`YYYY-MM-DD` yerel gün** (E-1 §8). Tutar kolonları
> `hesaplaSatirTutarlari()`'ndan okunur (C-6); **stok veri setinde tutar kolonu yoktur**
> (C-2 §4).
>
> **(10) Dosya güvenliği müşteriye aittir** (teyit metni 6. madde, K-9). Sistem dosyayı
> **saklamaz**, üretir ve verir — **E-3 ile tutarlıdır. Dosya sunucuda kalmaz.**
>
> **(11) Teslim şartıdır, ayrı fiyatlanmaz.** Şablon katmanı (Faz 2) ayrı kalemdir
> (K-4 §3).
>
> **Kapsam dışı, kalıcı:** yedinci veri seti · formüllü/hesaplanmış kolon · pivot, gruplama,
> ara toplam · veri seti birleştirme · koşullu satır filtresi · kullanıcı tanımlı veri seti ·
> zamanlanmış/otomatik dışa aktarım (D-1 kademe 2) · e-posta ile gönderim · dışa aktarım
> geçmişi **ekranı** · dosyanın sunucuda arşivlenmesi (E-3) · muhasebeleştirme mantığı içeren
> şablon (C-2 §8).

### 3.5 Bilinçli kapsam dışı — sadece teyit et

- Doktorun kendi paneli · Mobil uygulama · Çoklu firma/şube · Satın alma / tedarikçi yönetimi
- Kampanya/MF kuralı motoru (A-2, B-6) · Sevkiyat planlama (A-3)
- Onay iş akışı motoru, çok kademeli onay, vekalet/eskalasyon (A-8)
- İhale süreci yönetimi (A-5) · Konsinye mutabakat, kit/set, saha bildirimi (A-4)
- Kümülatif/dönemsel barem, retroaktif fiyat farkı, maliyet altı satış kontrolü (B-6, A-10)
- Vade farkı/faiz motoru, kalıcı kalem kapatma tablosu, taksitli ödeme planı (A-7)
- Çek/senet, POS mutabakatı, ödeme linki üretimi, **kasa-banka bakiyesi (A-11)**
- Barkod, depo el terminali, IoT cihaz takibi, depo içi ürün takibi (B-3)
- Dövizli fiyat, dövizli cari/tahsilat, kur farkı muhasebesi (C-5)
- SMS/push bildirim, kullanıcı tanımlı şablon, abonelik tercihi (D-1)
- Kargo etiketi basımı, fiyat karşılaştırma, iade kargosu (D-3)
- Prim oranının hedefe/dönemsel ciroya bağlanması (D-4) — **kalıcı**
- Lot/seri/GTIN/karekod izlenebilirliği ve `ILAC_TIBBICIHAZ` fatura senaryosu (K-5, K-10)
  — opsiyonel modül, ayrı faz
- Fatura kesme, muhasebe fişi üretme, e-Fatura/muhasebe API entegrasyonu (K-4)
  — opsiyonel modül
- **e-İrsaliye/e-Arşiv/e-Defter/e-Müstahsil üretimi, irsaliye yanıt yönetimi,
  irsaliye–fatura eşleştirme tablosu, irsaliyeli fatura, ÖKC entegrasyonu (C-1) — kalıcı**
- Dışa aktarımda formüllü kolon, pivot, veri seti birleştirme, kullanıcı tanımlı veri seti
  (K-4) — **kalıcı**
- **KDV tevkifatı, istisna/muafiyet rejimi, oran çözümleme matrisi, ÖTV (C-6) — kalıcı**
  *(12.10.2026: oran ölçümü 🟦 açık madde — C-1 §3.3.c revizyon 3-(8))*
- **Çoklu adres/iletişim tablosu, GİB VKN sorgulama, doktor birleştirme (A-13)**
  *(12.10.2026: çekirdek kart içindir — e-belge modülünün cari uzantısı ve mükellef önbelleği C-1 §3.3.c revizyon 3-(7))*
- **Rıza yönetimi, VERBİS, aydınlatma metni, ilgili kişi başvuru portalı, görüntüleme logu,
  rol bazlı alan maskeleme (C-3) — kalıcı**
- **Kullanıcı tanımlı belge numarası şablonu, elle numara girişi, boşluk raporu (A-14)**
- **Yüksek erişilebilirlik, failover, çoklu bölge, K8s, uptime SLA, 7/24 nöbet, APM (K-9)**
- **Ortak veritabanlı çok kiracılı SaaS (K-9 Sınıf 3) — kalıcı**
- **Genel/resmî muhasebe: tek düzen hesap planı, beyanname, e-defter — kalıcı**
- **Muhasebe fişi üretimi, hesap planı ve hesap eşleme tablosu, masraf merkezi, Ba/Bs formu,
  KDV beyanname kırılımı, dönem sonu/kapanış fişi, müşavir yazılımına otomatik gönderim,
  stok değerleme ve maliyet yöntemi (C-2) — kalıcı**
- **Sayım süreci yönetimi (sayım listesi, kör/döngüsel sayım, stok dondurma), fire oranı
  hesabı, zayiat maliyeti ve emsal bedel, KDV indirim iptali hesabı, imha tutanağı üretimi,
  takdir komisyonu süreci, geriye tarihli düzeltme (B-7) — kalıcı**
- **TİTCK bildirim gönderimi, uygunluk denetimi, başka firmaların desteğini görme,
  seyahat/masraf yönetimi, şeffaflık raporu, doktor bazlı teşvik bakiyesi (K-6/C-4)
  — kalıcı**

---

## 4. Kararlardan doğan kod/kapsam etkileri

| Kaynak | Etki | Nereye |
|---|---|---|
| K-1 | ~~Kongre kredisi iadesi~~ → **K-6 ile mekanizma kaldırıldı, hata konusuz kaldı** | F-05 |
| K-2 | Tek `hesaplaDoktorBakiye(doktor, tarih?)`; tüm ekranlar bunu çağırır · **taban brüt** | F-02 |
| K-3 | ~~Genel `LimitAsimi` tablosu~~ → **A-8 ile iptal** | Faz 1 |
| A-2 | `bedelsiz = false` filtresi → `commission-service.ts:45-54`, `reports-service.ts:36-42` | F-01 |
| A-3 | **Prim ve ciro dayanağı "onaylanan sipariş"ten "sevk edilen mal"a kayıyor** | F-01 |
| A-1 | İade belgesi; kısmi iade miktar alanından türer · **zayiat B-7'ye taşındı** | Faz 1 |
| A-6/D-6 | `ACILIS` hareket tipi; prim/ciro sorgularında hariç tutulur | Ü-4 |
| A-8 | Yeni tablo `OnayBlogu`; tek noktadan `acikBlokVarMi()` | Faz 1, şema |
| A-8 | Tek `blokKontrolleriniCalistir()` giriş noktası · **Onay bekleyenler** ekranı | Faz 1 |
| A-4 | `StokKonum` tablosu + `StockMovement.konum_id` **zorunlu** | Faz 1, şema |
| A-4 | **`KonsinyeCikis` prim/ciro/sevkiyat sorgularına girmemeli** | F-01 |
| B-6 | `FiyatListesiSatir.min_adet` + tarih alanları · tek `cozumleBirimFiyat()` | Faz 1, şema |
| A-5 | `Siparis.asama` + `teklif_gecerlilik_tarihi` | Faz 1, şema |
| A-5 | **Tek "sayılan belgeler" filtresi** — altı dışlamayı birlikte taşır | F-01, kritik |
| A-10 | ~~Satıra `liste_fiyat` + `iskonto_oran`; net fiyat türetilir~~ → **X-5 ile revize:** satıra `liste_fiyat` + **`birim_fiyat`**; **`iskonto_oran` türetilir, saklanmaz** *(redaksiyon 15.09.2026)* | Faz 1, şema |
| A-10 | Prim/ciro/hakkediş tabanı **net tutar = matrah (C-6)** | F-01 |
| A-7 | `CariHareket.vade_tarihi` · belgede `odeme_vadesi_gun` · `Doktor.odeme_vadesi_gun` | Faz 1, şema |
| A-7 | `VADE_FARKI`; sayılan belgeler filtresine dışlama | F-01, kritik |
| A-11 | `OdemeYontemi` + seed · tahsilatta `odeme_yontemi_id` zorunlu | Faz 1, şema |
| A-11 | **Komisyon prim/ciro/hakkediş tabanına girmez · kasa-banka bakiyesi yok** | F-01 |
| A-12 | `Doktor.kredi_limiti` · tek `hesaplaDoktorRisk()` · **taban brüt** | Faz 1, kritik |
| B-4 | `StokTransfer`; **mali sonucu yok** → filtreye dışlama | F-01, kritik |
| B-4 | **Tek `hesaplaStok(urun, konum?, tarih?)`; inline `SUM` yasak** | Faz 1, kritik |
| B-5 | Tarih aralığı çakışması **sert kısıt (DB düzeyi)** | Faz 1, şema |
| C-5 | **Para birimi alanı hiçbir tabloya konmaz** | — |
| D-1 | Olay noktaları koda yerleştirilir, handler'lar **boş** | Faz 1 |
| D-1 | **Zamanlayıcı** — ~~kademe 2, Faz 3 ayrı fiyat~~ *(12.10)* **altyapı e-belge modülü v1 ile gelir, fiyatlanmaz**; A-7, D-3, K-4 ve **C-3 periyodik imhası** altyapıyı kullanır | Altyapı: e-belge v1 · **bildirim kademe 2: Faz 3, ayrı fiyat** |
| D-3 | `KargoFirma` + seed · `Sevkiyat.kargo_firma_id`, `takip_no`, `gonderi_tarihi` | Faz 1, şema |
| **K-4** | **Tüm belgelerde `belge_no` + `guncelleme_tarihi`** | Faz 1, şema, kritik |
| **K-4** | **Tek `calistirDisaAktarim(kod, parametreler)`** | Faz 1, kritik |
| **K-4** | **Veri seti sorguları sayılan belgeler filtresini kullanır; inline `where` yasak** | F-01, kritik |
| **K-4** | Format katmanı iş kavramı tanımaz → PDF/XML sonradan yazıcı ekleme işidir | Faz 2+ |
| **K-4** | Veri seti kataloğu **kodda kapalı** | §1.3 |
| **K-4** | `export.sablonTanimi` belirlenir, **açılmaz** | `policy.ts`, Faz 1 |
| **K-4** | **Çekirdeğe `dis_referans`/`aktarildi_mi` konmaz** | — |
| **K-4** | **Entegratör sözleşmesi bizde olabilir (kontör modeli, Sınıf 1)** | Faz 3+, ayrı kalem |
| **K-4** | **Fatura belgesi eklenirse cari borcun kaynağı değişmez** | Faz 2+, kritik |
| **K-4** | **e-Fatura modülü normal satış faturası gönderir; `ILAC_TIBBICIHAZ` için K-10 gerekir** | C-1, teklif |
| **K-4** | **Modül fail-closed:** sınıfsız veya ÜTS'li fatura gönderilmez | Faz 3, kritik |
| **K-4** | Satılabilirlik ölçüsü **normal senaryolu aylık fatura adedi** | Ticari, §0.6 |
| **K-10** | **Lot/seri/GTIN/SKT/karekod alanları konmaz** | — |
| **K-10** | **Faz 1'e kolon/tablo/bayrak eklenmez; ek dikiş yeri açılmaz** | Faz 1, kritik |
| **K-10** | **`hesaplaStok()` tek çağrı noktası izlenebilirliğin geçiş kapısıdır** | B-4, kritik |
| **K-10** | İzlenebilirlik + barkod okuma **tek modül, ayrılamaz** | B-3 |
| **K-10** | **Geçiş = fiziksel sayım + etiketleme**, pakete dâhil değil | Faz 3, ticari |
| **K-10** | **Tetikleyici: iki bağımsız yazılı talep** | Ürün kuralı |
| **K-10** | **ÜTS kapsam bilgisi şemada tutulmaz** | C-6, D-6 |
| **K-10** | **Kilitlenme anı:** ~~1 Ekim 2026~~ → **teyit metni 1. madde imzası, canlıya geçişten önce** *(10.10.2026)* | §0.6 |
| **A-13** | `Doktor`: `vkn_tckn` · `cari_tip` · `fatura_*` seti · `eposta` · `telefon` · `muhasebe_kodu` | Faz 1, şema |
| **A-13** | Doğrulama **hane sayısından** (10=VKN, 11=TCKN) | Faz 1 |
| **A-13** | Eksik kimlik **bilgi kademesi** · `finance.faturaBilgisiZorunlu` (`false`) | §0.3, K-4 |
| **A-13** | **Belgeye kimlik dondurulmaz** | K-4, §0.1 |
| **A-13** | Kimlik/adres değişikliği **loglanır** · `Sevkiyat.teslimat_adresi` | Faz 1, D-3 |
| **A-14** | **Yeni tablo `BelgeSayac`**; tek `uretBelgeNo(onek, tx)`; `MAX+1` yasak | Faz 1, kritik |
| **A-14** | `belge_no` **global UNIQUE**, salt okunur | Faz 1, şema |
| **A-14** | Önek kataloğu **kodda kapalı** · `belge.onekleri` | §1.3 |
| **C-6** | **Yeni tanım tablosu `VergiOrani`** + seed | Faz 1, şema |
| **C-6** | `Urun.vergi_orani_id` **NOT NULL** · `OrderItem.kdv_orani` **değer olarak donar** | Faz 1, kritik |
| **C-6** | **Tek `hesaplaSatirTutarlari()`; inline `fiyat*miktar` yasak** | Faz 1, kritik |
| **C-6** | **KDV tutarı saklanmaz** · yuvarlama yalnız satırda · **belge toplamı = Σ satır** | Faz 1, kritik |
| **C-6** | **Prim/ciro/hakkediş tabanı matrah · cari bakiye/risk/tahsilat brüt** | F-01, K-2, A-12 |
| **C-3** | **Sistemde `DELETE` yok**; silme = `aktif=false` | Faz 1, kural |
| **C-3** | **Belgesiz doktor kaydı fiziksel silinebilir** · yönetici + gerekçe + log | Faz 1, D-6 |
| **C-3** | **Özel nitelikli veri tutulmaz** · **rıza mekanizması konmaz** | K-10, kalıcı |
| **C-3** | **KVKK teknik tedbir asgarisi teslim şartıdır** | Faz 1, altyapı |
| **C-3** | Anonimleştirme → **Faz 2, "KVKK veri imha paketi"** | Faz 2, ayrı kalem |
| **K-9** | **Sunucu ve yedekler Türkiye'de** — yurt dışı kalıcı kapsam dışı | Ürün kuralı |
| **K-9** | **Müşteri başına izole veritabanı + izole uygulama örneği** | Altyapı, kritik |
| **K-9** | **`tenant_id` hiçbir tabloya konmaz → K-8'in şema riski kalktı** | K-8, kritik |
| **K-9/C-7** | Günlük şifreli yedek · 14/8/12 saklama · **3 ayda bir geri dönüş testi** | Teslim şartı |
| **K-9/C-7** | **Her migration öncesi elle yedek + doğrulama** | Faz 1, kural |
| **K-9** | **Çıkış maddesi:** veri müşterinin; tam kopya + 30 gün içinde imha | Sözleşme |
| **K-9** | **Yeni tek çağrı noktası `modulAcikMi(kod)`** — doğrudan env okuma yasak | Faz 1, kritik |
| **K-9** | İki kurulum sınıfı; **opsiyonel modüller yalnız Sınıf 1'de satılır** | Ürün kuralı |
| **C-1** | **Sistem hiçbir e-belge üretmez — kalıcı ürün kararı** | Ürün kuralı |
| **C-1** | **`Sevkiyat.harici_irsaliye_no`** (`varchar(32)`, nullable, doğrulanmaz) | Faz 1, şema |
| **C-1** | Alan hiçbir hesaba/filtreye girmez — **salt kayıt alanı** | §0.3 |
| **C-1** | **`SVK` iç numaradır; dış irsaliye numarasıyla birbirinin yerine geçmez** | A-14 §10 |
| **C-1** | **`harici_fatura_no` konmaz** — ilişki N-N | K-4 §5 |
| **C-1** | **Teyit metni artık on bir madde** (X-1 ve A-15 ile genişledi) | Sözleşme, canlıya çıkış ön koşulu |
| **C-1** *(09.10)* | **İç karar — 🟦 kaldırıldı, kilitlenme anı yok.** Kapsam mükellefiyete bağlı değil; e-belge entegrasyonu Faz 3+ ayrı fiyatlı modül; 3. madde **bilgilendirme**, beyan değil | §0.6, K-4 §(4)/§(6), K-8 |
| **C-1** *(10.10)* | **e-belge modülü çekirdek sonrası ilk modül**, ticarileşmenin ön koşulu (ikinci müşteriden önce) · ilk adaptör müşterinin entegratörüne müşterinin API kullanıcısıyla · partner görüşmesi ilk entegrasyondan sonra · özel entegratörlük kapsam dışı · BYOI strateji değil | K-4 §(4)/EK2, K-8, K-9 |
| **C-1** *(12.10)* | **Revizyon 3:** modül sınırı §1.3 §F · ortak e-belge modeli modülde (çekirdekte UBL önerisi geri çekildi) · zamanlayıcı altyapısı e-belge v1 ile, fiyatsız · durum makinesi (kalıcı kilit `kabul`'de, `hata` silinmez) · cari uzantı tablosu + mükellef önbelleği · birim eşlemesi modülde · istisna/tevkifat çekirdek kararı, modül v1 dışında · 🟦 numara serisi · 🟦 istisna oranı ölçümü | §1.3, K-4, C-6, D-1 |
| **K-8** *(12.10)* | Bayat BYOI gerekçesi çizildi · **kontör/gelir paylaşımı partner anlaşmasında (🟦)** · modül ürün açısından ön koşul, müşteri açısından opsiyonel | C-1 rev. 3 |
| **K-9 §B** *(12.10)* | Kargo anahtarları müşteri örneğinde şifreli tutulabilir · entegratör anahtarı alt hesap önerisi **uygulanmadı** (§B ile çakışma) | D-3 |
| **D-3** *(10.10)* | Kargo modülü e-belgeden sonra · adaptör arayüzü · **BYOI doğal model** (anlaşma müşterinin) · ilk adaptör Anka West'in kargo firması · API bilgileri kurulum başına şifreli · Faz 1'e kolon yok | §1.3 §(10), K-9 |
| **🟦 tarama** *(10.10)* | X-11 · X-12 · A-4 · A-8 katalogları iç karar → ✅ · K-10 yeni kilit: teyit 1. madde imzası, canlıya geçiş öncesi · K-4 ayrıştı: mimari ✅, entegratör tespiti 🟦 | §0.6 (2) |
| **§0.6** *(09.10)* | **Otomatik ✅ kuralı kaldırıldı:** 🟦 → ✅ yalnız belgelenmiş kilitlenme olayıyla ya da iç karar olarak yeniden sınıflandırmayla; **tarihin geçmesi hiçbir kaydı değiştirmez** | Yöntem |
| **C-2** | **İlke: sorumluluk ham operasyonel veri düzeyinde, hesap kodu düzeyinde değil** | §0.8, ürün kuralı |
| **C-2** | **`hesaplaDoktorBakiye(doktor, tarih?)`** — imza genişler | K-2, Faz 1, kritik |
| **C-2** | **`hesaplaStok(urun, konum?, tarih?)`** — imza genişler | B-4, Faz 1, kritik |
| **C-2** | Cari hareket, tahsilat ve stok veri setleri **tarih parametreli**; ekran Faz 2 | K-4 §2 |
| **C-2** | **Stok veri seti tutar/maliyet kolonu taşımaz**; `Urun.alis_fiyati` konmaz | §0.1, kalıcı |
| **C-2** | Tahsilat veri seti **kasa defteri değildir** — para çıkışı sistemde yok | A-11 §8, teklif |
| **C-2** | `OdemeYontemi.hesap_etiketi` **konmaz** | — |
| **C-2** | `Doktor.muhasebe_kodu` **salt kayıt alanı** olarak sınıflandırıldı | A-13, §0.3 |
| **C-2** | Müşavir salt okunur erişimi **D-2'ye devredildi**; ikinci veri işleyen doğar | D-2, K-9 §A-6 |
| **C-2** | Sistem muhasebeleştirme yapmaz — **kalıcı**; teyit metnine 7. madde | K-4 §1, sözleşme |
| **B-7** | **Yeni belge `StokDuzeltme` + satır tablosu**; önek `DZL` | Faz 1, şema |
| **B-7** | **Yeni tanım tablosu `StokDuzeltmeSebep`** + seed | Faz 1, şema |
| **B-7** | **Sayılan belgeler filtresi 5 → 6 dışlama** | F-01, **kritik** |
| **B-7** | `hesaplaStok()` `DZL` hareketlerini **sayar**; mali hesaplar saymaz | B-4, kritik |
| **B-7** | A-14 önek kataloğuna 9. önek; `belge.onekleri` genişler | A-14 §2 |
| **B-7** | **Geriye tarihlendirme yasağı** — C-2 tarihli raporlarının zırhı | C-2, A-14 §5 |
| **B-7** | `harici_belge_no` **salt kayıt alanı** | C-1 §2, §0.3 |
| **B-7** | Yönetici + zorunlu gerekçe + log; **`OnayBlogu` kullanılmaz** | §0.3, C-3 §6 |
| **B-7** | Stok veri setinde `DZL` **ayrı işaretli**, sebep kolonuyla | C-2, K-4 §2 |
| **B-7** | Sistem **vergisel sonuç hesaplamaz**; teyit metnine 8. madde | Sözleşme |
| **B-7** | K-10 açıldığında `DZL` de kimlik taşır | K-10 §H-A |
| **B-7** | A-1'in "zayiat kaydı" ifadesi buraya devredildi | A-1 |
| **K-6/C-4** | **Hukuki görüş zorunlu** — "alınsın mı" sorusu kapandı | Sözleşme, teslim |
| **K-6/C-4** | **"Doktor bütçesi = toplam alım" kuralı geçersiz** — md. 22 + §0.4 | Modül, **kritik** |
| **K-6/C-4** | FIFO kredi lotu, bir yıllık geçerlilik, iptalde iade **silinir** | F-05, kritik |
| **K-6/C-4** | Modülün tanımı: **ödül motoru → uyum kütüğü**; birim etkinlik+katılımcı | Modül |
| **K-6/C-4** | **`PazarlamaButcesi` sahibi satıcı/bölge/kampanya**; doktorda bakiye doğmaz | Modül, kritik |
| **K-6/C-4** | Bütçe **elle atanır**, harcama **elle düşülür**; otomatik atama yok | Modül |
| **K-6/C-4** | Yıllık sayaç → **yumuşak kısıt**; `KONGRE_YILLIK_LIMIT`, `KONGRE_YURTDISI_LIMIT` | A-8 |
| **K-6/C-4** | **Yıllık 4 (tüm firmalar) sayacı tutulmaz** — doğrulanamaz alan | §0.1 |
| **K-6/C-4** | `Kongre.yurt_disi_mi` · `bildirim_tarihi` · `bildirim_referans_no` — **modülde** | §1.3 |
| **K-6/C-4** | Bildirim eksikliği/15 gün → **bilgi kademesi**; sistem bildirim **göndermez** | §0.3, kalıcı |
| **K-6/C-4** | Modül **opsiyonel, kapalı teslim, yalnız Sınıf 1**; `modulAcikMi('congress')` | K-9, §1.3 |
| **K-6/C-4** | **Uyum taahhüdü verilmez** — "bu mimari sizi korur" denmez | C-3 §5, ticari |
| **K-6/C-4** | Teyit metnine 9. madde | Sözleşme |
| **K-8** | **Üç kalem:** devreye alma · abonelik · opsiyonel modül; teklif tek rakam değil | Sözleşme, ürün kuralı |
| **K-8** | **Opsiyonel modül ≠ özel geliştirme** — ikincisi çekirdeğe girmez, ayrı sözleşme | §0.9, ticari |
| **K-8** | **Kullanıcı ve belge adedi başına fiyatlama yasak — kalıcı** | §0.2, §0.4, B-7, **kritik** |
| **K-8** | **Abonelik ürünü çalışır tutar, değiştirmez**; yeni özellik ayrı iş | §0.9, K-9 §A |
| **K-8** | Operasyonel hazırlık **hiçbir kaleme dâhil değil** (temizlik, sayım, etiketleme) | §0.1.a, K-10 §D, K-7 |
| **K-8** | **Sınıf 2 ucuz değil pahalıdır**; modül/kontör yok — sebep uygulanabilirlik | K-9 §B |
| **K-8** | **Askıya alma sözleşmede + giderme süresi**; yoksa K-9 mimarisi kullanılamaz | Sözleşme |
| **K-8** | **Askıya alma ≠ imha; veri teslimi ödenmemiş bedele bağlanamaz** | K-9 §A-5, KVKK |
| **K-8** | **K-8 koda hiçbir şey eklemez** — kontrol düzlemi/abonelik ekranı yok | Faz 1, K-9 |
| **K-8** | Referans müşteri fiyatı **ürün fiyatı değildir** | §0.5 |
| **K-8** | Rakam, kademe, indirim, paketleme **bu dosyaya işlenmez** | §10 |
| **K-4 EK2** | **e-Fatura modülü ertelendi**; `IEBelgeSaglayici` arayüzü de yazılmaz | Faz 3+, **kritik** |
| **K-4 EK2** | Faz 1'e **hiçbir e-belge/izlenebilirlik alanı konmaz** (sigorta kolonu dâhil) | §0.1, şema |
| **K-4 EK2** | Sıralama: **partnerlik → bayilik**; "bayilik tercih edilen" doğru hedef, yanlış başlangıç | §0.6, ticari |
| **K-4 EK2** | **Entegratör parolası hiçbir koşulda alınmaz** — yalnız entegrasyon anahtarı | KVKK, kalıcı |
| **K-4 EK2** | Hazırlık = **servis katmanı testleri + X-1/X-2/X-3/Ü-3**, yeni kod değil | Faz 1 |
| **K-4 EK2** | Satış dili: "entegrasyonumuz var" / "tüm entegratörler" **denmez** | K-10 §H-C, ticari |
| **K-10 §I** | ÜTS modülü ertelendi; **Sistem Token yolu doğrulandı (2 adet, imza yetkilisi)** | Not, modül değil |
| **K-10 §I** | Erteleme **veri toplamayı ertelemez** — ÜTS sütunu ~~1 Ekim'den önce~~ **canlıya geçişten önce** *(10.10.2026)* | §0.1.a, **acil** |
| **K-10 §I** | ÜTS'de **indirimli KDV** ihtimali → "%20 sabit" beyanı çürüyebilir | C-6, C-1, **acil** |
| **K-7** | Ürün şablonunda **`VergiOrani` KODU** (ham oran değil) + ÜTS sütunu | C-6, D-6 |
| **K-7** | **Açılış stoğu ayrı şablondur**; devreye alma kaleminde ayrı görünür | A-6, B-4, K-8 |
| **K-7** | **Veri standardizasyonu ayrı kalem**; Anka West'te bedelsiz ama **görünen satır** | §0.5, K-8 §(1) |
| **K-7** | Canlıya çıkış öncesi **yazılı teyit**; sorumluluk dili **beyan** üzerinden | C-1, K-4 §(4)-g |
| **D-2** | **`Kullanici.rol` kapalı katalog, üç değer**; matris/özel rol yok | §0.1.1, Faz 1, şema |
| **D-2** | `StokDuzeltme` **yalnız `YONETICI`** — üç rolün asıl gerekçesi | B-7, kritik |
| **D-2** | **Yeni tek çağrı noktası `kapsamliDoktorlariGetir(kullanici)`** — 11. fonksiyon | Faz 1, **kritik** |
| **D-2** | Prim/hakediş **yalnız kendi verisi**; ⚠️ X-1 ile **aynı fonksiyon** | X-1, A-11 |
| **D-2** | **`MUSAVIR` rolü yok**; tetikleyici = veri işleyen protokolü | C-2, D-5, K-9 §A-6 |
| **D-2** | **Bayi = cari tipi** *(15.09: `Doktor` satırı, `hesap_sinifi = BAYI` — X-8)*; bayi paneli **Faz 3+ opsiyonel modül, Sınıf 1** | A-13, K-9, §1.3, X-8 |
| **D-2** | Roller aboneliğe dâhil, **fiyatlanmaz** | C-3, K-8 §(2) |
| **D-2** | Sözleşme: **hesap paylaşımı yasağı** + sorumluluk | Sözleşme, A-8 |
| **X-2** | **BLOCKER** — `recordDealerPayment` transaction; A-14 nedeniyle ertelenemez | Faz 1, kritik |
| **K-4 §6** | **Fatura hazırlık veri seti MVP'de** — altıncı veri seti, **modül değil** | K-4 §2, Faz 1 |
| **K-4 §6** | **C-1 ihlal edilmez** (UBL değil, imzasız, gönderilmez) — ama risk **arttı** | C-1, ürün kuralı |
| **K-4 §6** | **Standart entegratör Excel formatı YOKTUR** → `export.sablonTanimi` ile konfigüre | §0.1, kritik |
| **K-4 §6** | **7 gün uyarısı** (VUK geriye dönük sınırı) — bilgi kademesi, engellemez | §0.3, Faz 1 |
| **K-4 §6** | Sayılan belgeler filtresi **yedinci uygulama** | F-01 |
| **K-4 §6** | `vat_rate` sayısal kolonu **konmaz** — oran `VergiOrani`'den (C-6) | C-6, şema |
| **K-4 §6** | Fatura muhatabı **A-13 alanlarından** gelir; yeni alan gerekmez | A-13 |
| **K-4 §6** | Gönderim/durum/iptal/mükellef sorgulama **§(4) modülünde kalır** | Faz 3+ |
| **K-4 §6** | Çekirdeğin parçası — **ayrı modül olarak fiyatlanmaz** | K-8 §(3) |
| **K-4 §6** | Satış dili: **"veri hazırlığı"**, "entegrasyon" değil | K-10 §H-C |
| **K-10 §I** | **1 Ekim kilitlenmesi ikiye ayrıldı**: K-10 düştü, KDV teyidi K-7'ye geçti | K-7 §(7) |
| **K-10 §I** | ÜTS **"ertelenmiş"tir, kalıcı kapsam dışı DEĞİL** — simetri kuralı | §H-E, §1.3 |
| **K-7 §7** | KDV teyidi **canlıya çıkışta**, ayrı liste istenmez; şablon müşteride | C-6, §0.5 |
| **K-7 §7** | **K-4 §(6) ilk çıktı öncesi §(4) teyidi zorunlu** — yeni çıkış şartı | Teslim |
| **X-1** | **"Tahsilat oranı" kaldırıldı — kalıcı**; yerine iki mutlak sayı, tabanı yazılı | §0.4, C-6 §6, **kritik** |
| **X-1** | `getSellerReports(kullanici, {baslangic, bitis})` — **dönem zorunlu parametre** | `reports-service.ts` |
| **X-1** | **Aralık deseni ≠ `tarih?` deseni** — akım ile an karıştırılmaz | C-2, kural |
| **X-1** | Dönem ekseni **belge tarihi**; **valör kullanılmaz** | A-3, A-11 |
| **X-1** | Ters kayıt **kendi döneminde** görünür; kapanmış dönem değişmez | §0.2, A-1, K-1 |
| **X-1** | **Hakediş doğuşu ≠ ödeme**; tahsilat bazlı prim **kalıcı kapsam dışı** | K-2, A-7, kalıcı |
| **X-1** | Prim **ücret ekidir** (İş K. 32) → geriye dönük eksilten rapor üretilmez | §0.7, sözleşme |
| **X-1** | **`Tahsilat.hesaba_gecti_mi` konmaz** — banka olayı sistemde yok | §0.1, A-11 §8 |
| **X-1/D-2** | Prim raporu **`YONETICI` + kendi verisiyle `SATICI`**; **`OPERASYON` görmez** | **D-2 §(1) düzeltilir** |
| **X-1** | X-1 + D-2 **tek commit**; fonksiyon **ilk servis katmanı testi** | D-2, Faz 1 |
| **A-15** | Nakit tahsilatta **bilgi kademesi uyarısı**; kayıt engellenmez | §0.3, A-11 |
| **A-15** | **Şemaya hiçbir alan eklenmez**; hesaplanan toplam saklanmaz | §0.1.a, Faz 1 |
| **A-15** | Config `finance.nakitTevsikLimiti` (`null` = kapalı), devreye almada doldurulur | `policy.ts`, K-8 §(1) |
| **A-15** | Kural `OdemeYontemi.tip = NAKIT`'e bağlanır — kapalı kataloğun **8. doğrulaması** | §0.1.1 |
| **A-15** | **Kısım kısım kuralı hiçbir fazda hesaplanamaz** | K-2, A-7, kalıcı |
| **A-15** | Sistem **"uygundur" demez**; uyarı metni kapsamını yazar | §0.4, kritik |
| **A-15** | Nakit tahsilat **engellenmez** — bloklama yöntemi yalanlatır | §0.2 tahliye vanası |
| **A-15** | Teyit metnine **11. madde** | Sözleşme |
| **X-3** | `global-error.tsx` + `not-found.tsx` + üç kritik segmentte `error.tsx` | Ü-9, teslim şartı |
| **X-3** | **Ham hata gövdesi ekrana yazılmaz**; sabit metin + referans no | C-3 §7, kritik |
| **X-3** | **Hata referansı `uretBelgeNo()` kullanmaz**, sayaç harcanmaz | A-14 §10, kritik |
| **X-3** | **Sessiz hata yasağı**; yarım yazmayı transaction engeller | X-2 genellemesi, kritik |
| **X-3** | Log'a **kişisel veri ve parametre değeri yazılmaz**; Prisma `meta` ham loglanmaz | C-3 §4/§7 |
| **X-3** | **Harici hata izleme servisi kalıcı kapsam dışı** — KVKK md.9 | K-9 §A-1, kalıcı |
| **X-3** | Hata metni **yetki/varlık sızdırmaz** | D-2 §(3) |
| **Ü-3** | Toggle **kurulum düzeyi**, kullanıcı tercihi değil; tek okuma noktası `pricing.fiyatGirisiKdvDahil` | §0.1, C-6 §4 |
| **Ü-3** | **Müşteri beyanı: fiyat listeleri KDV hariç** → değer `false`, **config AÇILMAZ**; çeviri katmanı Faz 1'de yazılmaz | C-6, **kritik** |
| **Ü-3** | **Cari bakiye / tahsilat / risk ekranlarında toggle konmaz — kalıcı**; kırılım yok, çeviri imkânsız | C-6 §6/§9, A-6, A-7 |
| **Ü-3** | **Prim / hakediş / ciro ekranlarında toggle konmaz — kalıcı** | X-1 §1, C-6 §6 |
| **Ü-3** | **Taban etiketi zorunlu** — her tutarın yanında *KDV hariç/dahil*; §0.4'e genel kural olarak işlendi | §0.4, X-1 §1, **kritik** |
| **Ü-3** | **Karma kolon yasağı**: tek kolonda iki taban gösterilmez | §0.4 |
| **Ü-3** | A sınıfı belge toplamı **üç satır**: Matrah · KDV · Genel Toplam | C-6 §5/§6, K-2 |
| **Ü-3** | Barem `min_adet` **alt sınır** satırlarıyla; üst sınır yok; **KDV indirim hesabının girdisi değil** | B-6, A-10 |
| **Ü-3** | `liste_fiyat` = barem çıktısı; **elle giriş `birim_fiyat`'a yazılır** (X-5); liste üstü satış serbest, türetilen oran negatif | A-10, X-5, kritik |
| **Ü-3** | **Maliyet / geliş fiyatı kolonu yok — kalıcı**; sistem yalnız sapmayı kaydeder | C-2 §4 |
| **Ü-3** | **Dışa aktarım toggle'ı tanımaz**; veri seti tabanı sabit | K-4 §2, §6 |
| **Ü-3** | Tabanı çözülemeyen tutar **boş kalır**, gösterimi X-4'e devredilir | B-5, X-4 |
| **Ü-3** | Teklif çıktısı yazıldığında **KDV Kanunu md. 57 etiket/liste kuralı** gündeme gelir | §0.7, Faz 2 |
| **X-4** | **Tek dönüş sözleşmesi:** `durum` + `kademe` + `kural_kodu` + parametreler | §0.3, Faz 1, **kritik** |
| **X-4** | **İş hatası `throw` edilmez**; `throw` = teknik hata → X-3 | X-3, kural |
| **X-4** | Metin sunucuda üretilmez; `kural_kodu` → UI sözlüğü | A-8, §0.1.1 |
| **X-4** | **Kademe başına tek gösterim deseni** — kapalı liste | §0.3, kritik |
| **X-4** | Yönetimsel eylem UI'da `YUMUSAK` görünür ama **blok kaydı doğurmaz** | B-7, C-3 §6, E-2 |
| **X-4** | **`uyari_gosterildi_mi` konmaz** — §0.1 dokuzuncu uygulama | §0.1.a, şema |
| **X-4** | **Uyarı yutma yasağı**; hepsi döner, **en yüksek kademe akışı belirler** | X-3 §4 |
| **X-4** | İş hatası ve bilgi uyarısı **loglanmaz**; kalıcı kayıt = `OnayBlogu` + değişiklik logu | C-3 §4, §0.2 |
| **X-4** | Log rotasyonu **K-9 §A-7 izleme asgarisine** eklenir | K-9, teslim şartı |
| **X-4** | B-5 *"fiyat çözümlenemedi"* **`SERT`**; satır kaydedilemez | B-5, Ü-3 |
| **E-1** | **An = `timestamptz` (UTC) · takvim günü = `date`** — tip disiplini, yeni kolon yok | Faz 1, şema, **kritik** |
| **E-1** | Zaman dilimi **adla** taşınır: `zaman.saatDilimi` (`Europe/Istanbul`); `+03:00` sabiti yasak | §0.1.1, `policy.ts` |
| **E-1** | Container ve veritabanı **UTC** çalışır | Altyapı, K-9 |
| **E-1** | "Gün" = Istanbul takvim günü — A-15 · B-7 §4 · A-14 §5 · X-1 §2 ortak tanımı | **kritik** |
| **E-1** | **A-14 yıl sayacı Istanbul yılına bakar** — UTC yılı **kalıcı yanlış numara** üretir | A-14 §5, **kritik** |
| **E-1** | Aralıklar **yarı açık `[başlangıç, bitiş)`**; B-5 çakışma yasağı bu tanımla kesinleşir | B-5, X-1 |
| **E-1** | `tarih?` nokta okuma = **o günün sonu**, gün hareketleri dahil | C-2 §3, K-2, B-4 |
| **E-1** | **`new Date()` doğrudan çağrılmaz**; `bugun()` / `gunAraligi()` / `takvimYili()` | Kural, Faz 1 |
| **E-1** | Fonksiyon listesi **11'de kalır** — dönüşüm iş kuralı değildir *(01.10.2026 — X-17 ile liste 12'ye çıktı; bu satırın hükmü değişmedi.)* | §4 |
| **E-1** | İstemci **tarayıcı dilimini okumaz** | Ü-3, X-4 |
| **E-1** | Dışa aktarımda tarih **`YYYY-MM-DD` yerel gün**; K-4 §(6)'da zorunlu | K-4 §2, §6-d |
| **E-1** | 7 gün ve 15 gün **takvim günüdür**; iş günü/tatil takvimi **kalıcı kapsam dışı** | K-4 §6-d, K-6 §7 |
| **E-1** | Ofset değişirse **kod değişmez** — IANA verisi güncellenir | §0.7, kalıcı |
| **E-2** | **`Kullanici.aktif` (NOT NULL, `true`) · `parola_hash` · `parola_degistirmeli`** | **Faz 1, şema** |
| **E-2** | **Yeni tablo: oturum** (veritabanı oturumu) — JWT'de rol dondurulmaz · *redaksiyon 15.09.2026: özgün metin "Auth.js veritabanı oturumu" idi; mekanizma `docs/adr/ADR-003` — `next-auth` sökülür, opak token* | Faz 1, şema, **kritik** |
| **E-2** | Pasifleştirme **açık oturumları anında sonlandırır** | D-2 §3, KVKK, kritik |
| **E-2** | Self-servis kayıt **yok**; hesabı `YONETICI` açar — yetki + gerekçe + log | §0.3, D-2 |
| **E-2** | İlk `YONETICI` **seed edilir**; **kurulum sihirbazı ekranı yazılmaz** | K-8 §(1) |
| **E-2** | Faz 1 parola sıfırlama **yönetici eliyle**; self-servis **Faz 2, D-1 bağımlı** | D-1 kademe 1 |
| **E-2** | Yönetici parola kurtarma **Sınıf 1'e özgüdür**; Sınıf 2'de yoktur | K-8 §(4), K-9 §B |
| **E-2** | Config `auth.oturumHareketsizlikSaat` (`4`) · `auth.oturumMutlakSaat` (`12`) | `policy.ts` |
| **E-2** | **Uygulama içi ekran kilidi / inaktivite uyarısı yazılmaz — kalıcı**; ekran kilidi OS'un işi | §0.9, Ü-9 |
| **E-2** | Devreye alma eğitimine **10 dk OS ekran kilidi önerisi** — teslim notu | K-8 §(1) |
| **E-2** | **Rol bazlı oturum süresi kapsam dışı**; süre kurulum düzeyinde tektir | D-2, §0.1 |
| **E-2** | Başarısız giriş **sınırlanır**, kilit **geçicidir** — kalıcı kilit tahliye vanası doğurur | §0.2, D-2 §8 |
| **E-2** | **Zorunlu periyodik parola değişimi konmaz** — rehber/pratik çelişkisi yazılı | §0.7 |
| **E-2** | Kullanıcı **silinmez**; C-3 §6 istisnası kullanıcıya **uygulanmaz** | §0.2, C-3 |
| **E-2** | **Son aktif yönetici korunur** · kendi hesabını pasifleştirme yasağı — **sert kısıt** | §0.3 |
| **E-2** | Giriş denemeleri **container log'una**; oturum/giriş geçmişi tablosu **açılmaz** · *15.09: mevcut `LoginAttempt` de kalkar (X-9)* | X-3 §7, C-3 §4, X-9 |
| **E-2** | **`son_giris_at` konmaz** — §0.1 onuncu uygulama | §0.1.a, şema |
| **E-2** | **MFA ertelendi**, kalıcı kapsam dışı değil; bugün hiçbir alan konmaz | K-10 §H-B, §I-6 |
| **E-2** | Teslim şartı, **ayrı fiyatlanmaz** | C-3 §7, K-8 §(2) |
| **E-3** | **K-9 §A-3 düzeltildi** — "yüklenen dosyalar" ifadesi çıktı; **varsayım yanlıştı** | **K-9, düzeltme** |
| **E-3** | **Kalıcı dosya eki yok**; yükleme yalnız D-6 import'ta ve **geçici** | Faz 1, ürün kuralı |
| **E-3** | Import dosyası işlem sonunda **silinir** — §0.2 ihlali değil (C-3 §6 mantığı) | D-6, kural |
| **E-3** | Geçici yüklemede **sert kısıt**: tek dosya, boyut, tip + içerik imzası | §0.3, D-6 |
| **E-3** | Config `import.azamiDosyaBoyutMb` — belirlenir ve **doldurulur** | `policy.ts` |
| **E-3** | **`ImportParti.dosya_adi` salt kayıt alanı** (nullable, doğrulanmaz) | Faz 1, şema, §0.3 |
| **E-3** | **Sigorta kolonu konmaz** (`dosya_url`, `ek_var_mi`) — §0.1 on birinci uygulama | §0.1.a, şema |
| **E-3** | Dosya eki **ertelendi, kalıcı kapsam dışı değil**; ayrı kalem | §0.6, K-8 §(3) |
| **E-3** | Açılırsa **depolama + yetki + imha politikası tek paket**, bölünmez | K-10 §H-A |
| **E-3** | Açılırsa **ayrı KVKK uyum kalemi**; C-3 §2 sınırı sözleşme diline döner | C-3 §2, K-10 §H-F |
| **E-3** | Açılırsa **Türkiye'de**, **yalnız Sınıf 1** | K-9 §A-1/§B, kalıcı |
| **E-3** | UI'da **ataç / sürükle-bırak / "yakında" yok** | K-10 §H-C |
| **D-5** | **Altı veri seti — kodda kapalı katalog**; yedincisi geliştirmedir | §0.1.1, K-4 §2 |
| **D-5** | **Dönem parametreleri E-1'e bağlandı** — aralık yarı açık, nokta gün sonu | E-1 §4/§5, kritik |
| **D-5** | Dışa aktarım **yalnız `YONETICI`**; `SATICI` prim raporunu **dosya olarak indiremez** | D-2 §(1), X-1 §8 |
| **D-5** | **Her dışa aktarım veritabanında loglanır**: kullanıcı, veri seti, parametre, **satır sayısı** | **Faz 1, şema, kritik** |
| **D-5** | Log'a **satır içeriği, ad, VKN, tutar yazılmaz** | X-3 §6, C-3 §4 |
| **D-5** | **X-3'ün "log container'a" kuralının tek istisnası** — teknik iz değil, **denetim izi** | X-3 §7 |
| **D-5** | **Görüntüleme logu kalıcı kapsam dışı kalır**; ayrım: **dosya üretmek ≠ ekranda okumak** | C-3 §4, kalıcı |
| **D-5** | Dışa aktarım geçmişi **ekranı yoktur** | Ü-9 |
| **D-5** | K-4 §(6) ilk çıktı öncesi **K-7 §(4) teyidi** — teslim şartı, kod kontrol etmez | K-7 §(7) |
| **D-5** | Üretilen dosya **sunucuda saklanmaz** | E-3, K-9 |
| **§1.3** | **Bağımlılık tek yönlü**; çekirdek tabloda modül kolonu/FK yok | Ürün kuralı, **kritik** |
| **§1.3** | Kapalı modül **fail-closed**: menü, rota **ve server action** kapalı | D-2 §3, X-3 §1 |
| **§1.3** | **Modülü müşteri açamaz** — kullanıcı toggle'ı, modül mağazası yok | K-9 §B, K-8 §(4) |
| **§1.3** | **Katalog çekirdektedir; genişlemesi çekirdek migration'ıdır** — taşınmış soru 1/2/3/7 | §0.1.1, **kritik** |
| **§1.3** | **`kural_kodu` enum değil `varchar`** — kapalı modülün geçmiş kayıtları okunur | A-8, §0.2, kritik |
| **§1.3** | **Modül fiyata dokunamaz — kalıcı**; `cozumleBirimFiyat()` sarılmaz | B-5, B-6, C-6 |
| **§1.3** | **Modül çekirdek fonksiyon listesine ekleme yapamaz**; liste **11'de kapalı** *(01.10.2026 — X-17 ile liste 12'ye çıktı; bu satırın hükmü değişmedi.)* | §4 |
| **§1.3** | **Modül yazılmadan tablosu yazılmaz**; yazıldığında **tek migration hattı** | K-9 §A-2, **kritik** |
| **§1.3** | **Müşteri başına farklı şema kalıcı kapsam dışı** | K-9, kalıcı |
| **§1.3** | Modül kapatılınca **veri silinmez**, görünmez olur | §0.2 |
| **§1.3** | Çekirdek/modül listesi **kapalı**; yeni modül **ürün kararıdır** | K-8 §(3), §0.9 |
| **§1.3** | Kongre modülü **geri çekilir**: `Doktor`'da teşvik anlamı taşıyan alan/hesap kalmaz | K-6, F-05, **kritik** |
| **§1.3** | **Rol çekirdektir, modül rol ekleyemez**; `MUSAVIR` = enum satırı, bayi paneli = modül | D-2 §5/§6, E-2 |
| **A-9** | ✅ **Cari sahibi tek tip: `Doktor`**; `Kurum` tablosu ve `kurum_id` **konmaz** | Faz 1, şema, kalıcı |
| **A-9** | Aynı VKN tekrarına **kısıt yok** — bilinçli | A-13 |
| **A-9** | Klinik konsolidasyonu **ayrı fiyatlı yükseltme**, **veri taşıma migration'ı** | §0.6, ticari |
| **A-9** | §0.1 **on ikinci uygulama**: `kurum_id` üç testten de düştü | §0.1.a |
| **C-2 rev.** | 14-a **beklenmez**; periyot **beyan takvimine** bağlandı, **numune yöntemi** | §0.6, §0.7, Bölüm 2 |
| **C-2 rev.** | Hesap kodu / mizan / stok değeri talebi → **kapsam dışı**, kalem bile değil | §0.8, kalıcı |

| **X-5** | **Parasal tip `Decimal`** — `BigInt` kuruş terk edilir; RULE-10'un "tam sayı kuruş" yarısı geçersiz | Faz 1A, şema, **kritik** |
| **X-5** | **Ölçek kodda değil şemada yaşar** — `Decimal(18,4)` / `(18,2)` / `(5,2)` | §0.1 |
| **X-5** | **Ham aritmetik yalnız `hesaplaSatirTutarlari()` ve `cozumleBirimFiyat()` içinde** | C-6, B-6, kural |
| **X-5** | **Lint kuralı teslim şartı** — `Decimal` üzerinde `Number()`/`+`/`*` yasak | CI, **kritik** |
| **X-5** | **Tek biçimlendirme çıkışı `formatla()`**; istemciye `string` gider — 11'li listeye girmez *(01.10.2026 — X-17 ile liste 12'ye çıktı; bu satırın hükmü değişmedi.)* | E-1 §6 deseni |
| **X-5** | Yuvarlama **sıfırdan uzağa**; **satır tutarları daima pozitif**, işaret hareket tipinde | C-6 §5, §0.2 |
| **X-5** | **`OrderItem.birim_fiyat` konur; `iskonto_oran` KONMAZ — türetilir** | **A-10 revize**, Ü-3 §(10) revize |
| **X-5** | **Miktar alanları tam sayıdır**; küsuratlı miktar kalıcı kapsam dışı | §0.1, şema |
| **X-6** | **`PaymentAllocation` kaldırıldı — kalıcı** | Faz 1A, **kritik** |
| **X-6** | **Runtime FIFO eşleştirme de yasak** — tahminî sayı üretilmez | §0.4, X-1 §(7), **kritik** |
| **X-6** | **"Otomatik mahsup" aritmetiktir**, mekanizma değil | **K-2 netleştirmesi** |
| **X-6** | **Yaşlandırma Faz 2+**; Faz 1'de vadesi geçmiş **tutar gösterilmez** | X-1 ⚪, **kritik** |
| **X-6** | Kural kodu **`VADESI_GECMIS_HAREKET`** eklenir | A-8, §1.3 §B-7 |
| **X-7** | **`PRD_V2.md` arşivlenir**; önce 71 FR + 15 RULE **taranır** | §6 çıkış kalemi |
| **X-7** | **`KABUL_KRITERLERI.md`** açılır — karar içermez, yalnız doğrulanabilir cümle | Faz 1A |
| **X-7** | Numaralandırma **karar kimliğinden türer** (`A-3-1`); `FR-*` terk edilir | İzlenebilirlik |
| **X-7** | `TRACEABILITY.md` → **kod × test × karar**; kriteri olmayan karar doğrulanamaz | Faz 1 sonu |
| **X-8** | **Bayi = `Doktor` satırı, `hesap_sinifi = BAYI`** — `Dealer`, `DealerPrice`, `DealerShipment`, `DealerShipmentItem`, `DealerPayment` **şemadan çıkar** | Faz 1A, şema, **kritik** |
| **X-8** | Yeni çekirdek enum `HesapSinifi`: `DOKTOR` · `BAYI` · `Doktor.hesap_sinifi` **NOT NULL, DB varsayılanı yok** | Faz 1A, şema |
| **X-8** | **`BAYI` sınıfına satıcı atanmaz** → bayi sevkiyatından **prim doğmaz** (bugünkü RULE-15 davranışı) | X-1 §(7), RULE-02, **kritik** |
| **X-8** | Bayi işlemleri **genel belge akışlarıdır** (`SIP`/`SVK`/`IAD`/`THS`); ayrı bayi akışı, ayrı bakiye formülü yazılmaz | A-1…A-14, K-2, 1B |
| **X-8** | Doktor listesi veri seti (K-4), doktor import'u (D-6), geçiş şablonu (K-7) **`hesap_sinifi` taşır**; import'ta zorunlu | K-4, D-6, K-7 |
| **X-8** | **X-2'nin konusu değişti** — `recordDealerPayment` sökülür; ilke **bütün tahsilatlar** için A-14 kabul kriteridir | X-2, A-14, 1B madde 2 |
| **X-9** | **`LoginAttempt` tablosu kaldırılır** — giriş denemesi tutan hiçbir tablo açılmaz | E-2 §(8), Faz 1A, şema |
| **X-9** | Deneme sınırı **bellek içi**; eşik ve kilit süresi `policy.ts`'te (`auth.girisDenemeSiniri`, `auth.girisKilitDakika`) | E-2 §(5), ADR-004 |
| **X-9** | **Tek süreç varsayımı yazılıdır** — birden fazla uygulama süreci çalıştırıldığı gün karar yeniden açılır | K-9 kapsam dışı, tetikleyici |
| **X-10** | **Yeni tablolar `FiyatListesi` + `FiyatListesiSatir`** · `Doktor.fiyat_listesi_id` **nullable** (boş = varsayılan liste) | Faz 1A, şema, **kritik** |
| **X-10** | **`Product.netListPrice` kalkar** — ürünün liste fiyatı varsayılan listenin satırıdır | Faz 1A, şema, GÇ-15 |
| **X-10** | Liste seçimi **tek noktadan**: `cozumleBirimFiyat()` önce carinin listesine, atanmamışsa varsayılana bakar; **atanmış listede satır yoksa varsayılana düşülmez** → `SERT` *"fiyat çözümlenemedi"* | B-5, X-4, RULE-06, **kritik** |
| **X-10** | Config `pricing.varsayilanFiyatListesiKodu` — varsayılan liste **kodla** seçilir (`tax.varsayilanVergiOraniKodu` deseni) | `policy.ts`, seed |
| **X-10** | Cariye liste atamak **fiyat tanımıdır** → yalnız `YONETICI` (D-2); atama ve satır değişikliği **denetim kaydına** yazılır | D-2, RULE-13 |
| **X-11** | **Yeni çekirdek tablo `CariHareket`** — borç/alacak doğuran her olay tek satır; `ACL`/`VDF` bu tablonun kayıtlarıdır; `vade_tarihi` buradadır | Faz 1A, şema, **kritik** |
| **X-11** | Tutar pozitif, yön ayrı (`BORC`/`ALACAK`); belge ve hareket **aynı transaction'da**; düzeltme ters harekettir | X-5 §(7), X-3, §0.2 |
| **X-11** | `hesaplaDoktorBakiye()` ve cari hareket veri seti bu tablodan okur; eşleştirme yok, bakiye kolonu yok | K-2, K-4, X-6, RULE-08 |
| **X-12** | **Yeni çekirdek tablo `ImportParti`** · `dosya_adi` salt kayıt (E-3 §(4)) · içe aktarılan kayıtlar **nullable parti FK** taşır | Faz 1A, şema |
| **X-12** | Geri alma C-3 §(6) koşuluyla; **açılış stoğu partisi geri alınmaz** (`DZL` ile düzeltilir) *(13.10.2026 — X-16 §(10): açılış bakiyesi partisi de geri alınmaz, `TERS_KAYIT`; kısmi geri alma yok)* | D-6, B-7 |
| **X-13** | **Satıcı yalnız kendi `DOKTOR` carilerini görür** — `kapsamliDoktorlariGetir()` süzer; **D-2 §(3) redakte edildi** | D-2, Faz 1, **kritik** |
| **X-13** | Siparişin satıcısı **sipariş anındaki sahiptir**, sonra değişmez → hakediş ona yazılır · `BAYI` siparişinde satıcı **boş** | X-1 §(6)/(7), X-8 §(3), şema |
| **X-13** | Devir yalnız `YONETICI` · gerekçeli · **izli** (bugünkü devir tablosu kalır) · pasif satıcının doktorları sahipsiz, sahipsiz doktora sipariş girilmez *(01.10.2026 — pasifleştirmede portföy seçimi zorunlu, X-17)* | E-2, RULE-13 |
| **X-14** | Varsayılan prim oranı **`finance.primOraniVarsayilan`** (`policy.ts`, **23. anahtar**) · satıcı kartında **nullable özel oran** (`Decimal(5,2)`) | `policy.ts`, şema |
| **X-14** | **Uygulanan oran sevkiyat satırına donar**; `BAYI` ve bedelsiz satırda boş · oran değişikliği loglanır | X-1 §(6), A-2, RULE-13, **kritik** |
| **X-15** | `vade_tarihi` sonradan değişebilir — yalnız `YONETICI`, gerekçe zorunlu, **iz tablosu cari harekete bağlı** (bugünkü vade değişiklik tablosu kalır) | A-7, X-11, şema |
| **X-15** | Telefon **NOT NULL + normalize hâliyle UNIQUE** (A-13 `telefon` bu alandır) · klinik/bölge `DOKTOR` için zorunlu, `BAYI` için boş olabilir · bayiye ayrı kod/yetkili alanı yok | A-13, X-8, şema |
| **X-17** | **Sahiplik tek fonksiyondan değişir** — `degistirDoktorSahibi()`, **12. tek çağrı noktası** · sahip daima aktif `SATICI` · `BAYI`'de sahip boş (**DB `CHECK`**) · `hesap_sinifi` değişmez | X-13, X-8, Faz 1A şema, **kritik** |
| **X-17** | Devir **toplu** (cari listesinde çoklu seçim) · pasifleştirme/rol değişikliğinde portföy seçimi **zorunlu** (devret ya da sahipsiz bırak) · iz her geçişi yazar (olay kaydı) · sipariş ve devir doktor satırı kilidiyle yarışmaz | E-2 §(6), RULE-13, ADR-008 |
| **X-16** | Import, elle girişin toplu hâlidir · şablon tek tanımdan üretilir (ADR-006) · **kısmi yazma yok** · `CARI` import'unu yalnız `YONETICI` çalıştırır · import kayıt güncellemez, kısmi geri alma yok | D-6, K-7, 1B madde 7 |
| **X-16** | `CARI` tanımında sorumlu satıcı (X-17 §(7)) ve fiyat listesi kodu · `FIYAT_LISTESI` şablonunda Faz 1'de tarih kolonu yok · `CARI` listesi de yazılı teyit ister | X-10, X-13, K-7 §(4) |
| **X-15 §(5)** | `DOKTOR` kişiye ait telefonla açılır (🟦, kilit: doktor listesi teslimi; `BAYI`'de etiket "Telefon", firma numarası) · `TELEFON_KAYITLI` · import'ta aynı numaralı bütün satırlar reddedilir | A-9, X-16, devreye alma |

> 📐 **Ad rejimi — redaksiyon 15.09.2026 (`docs/adr/ADR-001`).** Aşağıdaki özetteki ve bu kitabın
> genelindeki **tablo ve kolon adları kavramsaldır**: şemada İngilizce `camelCase` karşılıkları
> kullanılır, eşleme ADR-001'dedir. **Normatif olan** — yani koda ve şemaya aynen giren — adlar:
> enum değerleri (`YONETICI`, `TUZEL_KISI`, kural kodları …), belge önekleri, **11 tek çağrı
> noktası fonksiyonu** ve `policy.ts` anahtarları. *Karar metni değişmedi; yalnız okuma kuralı
> yazıldı.*
> *01.10.2026 — geri not: X-17 ile tek çağrı noktası listesi **12**'ye çıktı (`degistirDoktorSahibi()`); bu maddenin hükmü değişmedi.*

**Faz 1 şema özeti (tek bakışta):**

Yeni tablolar → `OnayBlogu` · `StokKonum` · `OdemeYontemi` · `KargoFirma` ·
**`VergiOrani`** · **`BelgeSayac`** · **`StokDuzeltme`** · **`StokDuzeltmeSatir`** ·
**`StokDuzeltmeSebep`** · **oturum tablosu (E-2)** · **dışa aktarım kütüğü (D-5)** ·
**`FiyatListesi`** · **`FiyatListesiSatir`** *(X-10)* · **`CariHareket`** *(X-11)* · **`ImportParti`** *(X-12)* — *16.09: toplam **15***
Yeni belgeler → `KonsinyeCikis` · `StokTransfer` · iade belgesi (A-1) ·
**`StokDuzeltme` (mali sonucu yok)**
*📐 Okuma notu (16.09.2026 — karar değil):* **belge = başlık + satır**. Satır yapıları belge sayımına
dahildir: iade satırı (A-1), konsinye ve transfer satırları. `StokDuzeltmeSatir` yukarıda ayrıca
sayılmıştır. **Sevkiyat satırı** mevcut `SVK` belgesinin yeni satır yapısıdır. A-3 (bir sipariş
satırına birden çok sevkiyat), C-6 §(7) (KDV sevkiyat satırında) ve X-14 §(3) (oran sevkiyat
satırına donar) bunu varsayar. Bugünkü sevkiyat siparişe 1-1 bağlı ve satırsızdır; satır Faz 1A
migration'ında doğar.
Kolonlar → `StockMovement.konum_id` (zorunlu) · `FiyatListesiSatir.min_adet`,
`gecerli_baslangic`, `gecerli_bitis` · `Siparis.asama`, `teklif_gecerlilik_tarihi`,
`odeme_vadesi_gun` · `OrderItem.liste_fiyat`, **`birim_fiyat` (X-5)**, **`kdv_orani`** ·
`CariHareket.vade_tarihi`, **`tip`, `yon`, `tutar`, `belge_no` (X-11)** · **`Siparis.satici_id` nullable (X-13)** · **`Kullanici.prim_orani` (nullable), sevkiyat satırı `prim_orani` (donmuş) (X-14)** · **vade değişiklik izi → cari harekete bağlı (X-15)** · **içe aktarılan kayıtlarda nullable parti FK — `Doktor`, `Urun`, `FiyatListesiSatir`, `CariHareket`, `StockMovement` (X-12)** · `Doktor.odeme_vadesi_gun`, `kredi_limiti`, **`vkn_tckn`,
`cari_tip`, `fatura_unvani`, `vergi_dairesi`, `fatura_adresi`, `fatura_ilce`, `fatura_il`,
`eposta`, `telefon` (**NOT NULL, normalize, UNIQUE — X-15**), `muhasebe_kodu`** · **`Doktor.klinik`/`bolge` nullable — `DOKTOR` için zorunlu (X-15)** · **`Doktor.hesap_sinifi` (NOT NULL — X-8)** · **`Doktor.fiyat_listesi_id` (nullable — X-10)** · **`Urun.vergi_orani_id` (NOT NULL)** ·
`Tahsilat.odeme_yontemi_id`, `komisyon_oran`, `komisyon_tutar`, `beklenen_valor_tarihi`,
`yon` · `Sevkiyat.kargo_firma_id`, `takip_no`, `gonderi_tarihi`, `kargo_durum`,
`kargo_son_sorgu`, **`teslimat_adresi`**, **`harici_irsaliye_no`** ·
**`StokDuzeltme.harici_belge_no`** ·
**`Kullanici.aktif`, `parola_hash`, `parola_degistirmeli` (E-2)** ·
**`ImportParti.dosya_adi` (E-3)**, **parti numarası, veri türü (X-12)** ·
**tüm belgelerde `belge_no` + `guncelleme_tarihi` (K-4, A-14)**
Yeni tipler → cari hareket `ACILIS`, `VADE_FARKI` *(tam katalog ✅ X-11: `SEVKIYAT` · `IADE` · `TAHSILAT` · `ACILIS` · `VADE_FARKI` · `TERS_KAYIT`; yön `BORC`/`ALACAK`)* · **import veri türü ✅ X-12: `CARI` · `URUN` · `FIYAT_LISTESI` · `ACILIS_BAKIYESI` · `ACILIS_STOGU`** · kural kodu `NEGATIF_STOK`, `KREDI_LIMITI`, **`VADESI_GECMIS_HAREKET` (X-6 §(6) — 24.09'da eklendi, karar 13.09)**, **`TUTAR_NEGATIF` (D-6, 24.09)**, **`SAHIP_AKTIF_SATICI_DEGIL`, `BAYI_SAHIP_ATANAMAZ`, `SAHIP_DEGISTI` (X-17, 01.10)**, **`TELEFON_KAYITLI` (X-15 §(5)), `ICE_AKTARIM_KOLON_EKSIK`, `ICE_AKTARIM_KOLON_TANINMIYOR`, `URUN_KODU_KAYITLI`, `FIYAT_SATIRI_CAKISIYOR` (X-16, 13.10)** ·
`cari_tip`: `TUZEL_KISI`/`GERCEK_KISI` · **`HesapSinifi`: `DOKTOR`/`BAYI` (X-8)** · **✅ `StokKonum.tip`: `DEPO`/`KONSINYE` (A-4, 04.10)** · **✅ `OnayBlogu` kararı: `ONAY`/`RED` (A-8, 04.10)** · **`Kullanici.rol`: `YONETICI`/`OPERASYON`/`SATICI` (D-2)** ·
belge önekleri `SIP`/`SVK`/`IAD`/`KNS`/`TRF`/`THS`/`ACL`/`VDF`/**`DZL`**
Kısıtlar → `FiyatListesiSatir` tarih aralığı çakışma yasağı (DB) · `belge_no` global UNIQUE · **cari telefonu UNIQUE (X-15)** · **`BAYI`'de sahip boş — `CHECK` (DB, X-17)** ·
VKN/TCKN format doğrulaması · **`tenant_id` yok** · **izlenebilirlik alanı yok** ·
**`DZL` geriye tarihlendirilemez** · **stok/tutar kolonu yok (maliyet yok)** ·
**e-belge/entegratör alanı yok (K-4 EK2)** · **`Yetki` tablosu yok, bayi `Kullanici`'si yok (D-2)** ·
**en az bir aktif `YONETICI` (E-2)** · **`son_giris_at` yok, giriş geçmişi tablosu yok (E-2)** ·
**dosya/ek alanı yok (E-3)** · **`Kurum` tablosu ve `Doktor.kurum_id` yok (A-9)** ·
**`PaymentAllocation` yok (X-6)** · **`OrderItem.iskonto_oran` yok — türetilir (X-5)** ·
**`Dealer*` tabloları yok — bayi `Doktor` satırıdır (X-8)** · **`LoginAttempt` yok (X-9)** ·
**ürün tablosunda liste fiyatı kolonu yok — varsayılan listenin satırıdır (X-10)**
Sayısal tipler **(X-5, teyit edildi)** → birim fiyat `Decimal(18,4)` · tutar `Decimal(18,2)` ·
oran `Decimal(5,2)` · **miktar tam sayı** · **`BigInt` kuruş kullanılmaz**
**Zaman tipleri (E-1) → an: `timestamptz` (UTC) · takvim günü: `date` (dilim taşımaz)**

~~**Karara bağlanmayı bekleyen şema kalemi kalmadı**~~ *(15.09.2026 — X-10 kapandı; `FiyatListesi`/`FiyatListesiSatir` yeni tablolar sayımına eklendi)*.
~~⬜ 16.09.2026: iki şema kalemi karar bekliyor (X-11 · X-12)~~ → ✅ **aynı gün kapandı** (§5.14, §5.15; tablo sayısı **15**).
~~⬜ 16.09.2026 — PRD taramasının açtığı üç madde şemaya dokunabilir~~ → ✅ **aynı gün kapandı** (§5.16–§5.18).
**Karara bağlanmayı bekleyen şema kalemi kalmadı** *(16.09.2026)*. Şema etkileri:
- **X-13:** `Siparis.satici_id` nullable (`BAYI`); devir izi tablosu **kalır**.
- **X-14:** `Kullanici.prim_orani` (nullable) + sevkiyat satırında donmuş `prim_orani`.
- **X-15:** vade değişiklik izi **kalır**, cari harekete bağlanır; `Doktor.telefon` NOT NULL UNIQUE;
  `klinik`/`bolge` nullable.
- *(Ürün tablosunda stok miktarı kolonu yoktur — `docs/adr/ADR-005`; mekanizma kararıdır.)*
⚠️ **15.09.2026 turu:** **X-8** bir enum + bir kolon ekler, beş `Dealer*` tablosunu çıkarır; **X-9** `LoginAttempt`'i çıkarır. İkisi de **Faz 1A migration'ında** netleşir.
**08.09.2026 ikinci oturumu (X-1 · A-15 · X-3) şemaya hiçbir şey eklemedi.**
⚠️ **13.09.2026 turu şemayı iki yönde değiştirdi:** **X-5** parasal tipi `BigInt`ten `Decimal`e
çevirdi ve `OrderItem.iskonto_oran` yerine **`birim_fiyat`** koydu; **X-6** `PaymentAllocation`
tablosunu **kaldırdı**. İkisi de **Faz 1A migration'ında** netleşir.
⚠️ **09.09.2026 turu iki ekleme yaptı:** **E-2** (oturum tablosu + `Kullanici` alanları) ve
**D-5** (dışa aktarım kütüğü). İkisi de **teslim şartıdır**, özellik değildir; ayrıca
**E-1 mevcut kolonların tipini netleştirir** (yeni kolon eklemez). Aynı turda **A-9** ve
**E-3** şemaya **eklememe** kararı verdi (`kurum_id`, dosya alanları).

**Tekrar eden desen — aynı risk altı ayrı maddeden çıktı:** finansal ve stok sorgularından
dışlanması gereken belgeler **tek filtrede** toplanmalı:
`TEKLIF` · `ACILIS` · `KonsinyeCikis` · `VADE_FARKI` · `StokTransfer` ·
**`StokDuzeltme`** (+ bedelsiz satırlar).
**K-4 ile kapsamı genişledi: dışa aktarım veri setleri de aynı filtreyi kullanır.**
**K-4 §(6) ile yedinci kez uygulandı: fatura hazırlık veri seti de bu filtreye tabidir.**
**Bu filtre Faz 1'in tek en kritik ortak fonksiyonudur.**

**Tek çağrı noktası olan fonksiyonlar (kural) — 11 adet; C-2 ile ikisinin imzası genişledi,
D-2 ile biri eklendi:**
`hesaplaDoktorBakiye(doktor, tarih?)` (K-2, C-2) · `hesaplaDoktorRisk()` (A-12) ·
`hesaplaStok(urun, konum?, tarih?)` (B-4, K-10, C-2) · `cozumleBirimFiyat()` (B-6/B-5) ·
`acikBlokVarMi()` / `blokKontrolleriniCalistir()` (A-8) · sayılan belgeler filtresi (A-5) ·
`calistirDisaAktarim()` (K-4) · `hesaplaSatirTutarlari()` (C-6) · `uretBelgeNo()` (A-14) ·
`modulAcikMi()` (K-9) · **`kapsamliDoktorlariGetir(kullanici)` (D-2)**.
Hiçbiri inline tekrarlanmaz.
*(Modül tarafında ayrıca `hesaplaButceBakiye()` (K-6) vardır; çekirdek listesine girmez.)*

**Config noktaları (belirlenir, açılmaz):**
**`finance.odemeVadesiGunVarsayilan` (`30` — bugünkü kod değeri; 30.09.2026 kullanıcı teyidi, devreye almada yazılı teyit)** · `finance.vadeFarkiOrani` (`null`) ·
`finance.vadeFarkiGunSayimBazi` · `finance.kredilimitiBloklar` (`false`) ·
`finance.faturaBilgisiZorunlu` (`false`) · **`finance.nakitTevsikLimiti` (`null` — A-15)** ·
`pricing.iskontoTavani` (`null`) ·
`pricing.fiyatGirisiKdvDahil` (`false`) · **`pricing.varsayilanFiyatListesiKodu` (X-10 — seed ile aynı kod)** · `tax.varsayilanVergiOraniKodu` (`KDV20`) ·
`kvkk.saklamaSuresiYil` (`10`) · **`finance.primOraniVarsayilan` (X-14 — bugünkü değer `5.00`; devreye almada teyit)** · **`export.sablonTanimi` (K-4 §6 — entegratör sütun eşlemesi;
kodda sabit format YOK)** · **`export.faturaGeriyeDonukUyariGun` (`7` — K-4 §6-d)** ·
`belge.onekleri` ·
`notifications.enabled` (`false`) · `modules.congress` (**`false` — K-6**) ·
**`zaman.saatDilimi` (`Europe/Istanbul` — E-1; ofset değil, dilim adı)** ·
**`auth.oturumHareketsizlikSaat` (`4` — E-2, doldurulur)** ·
**`auth.oturumMutlakSaat` (`12` — E-2, doldurulur)** ·
**`auth.girisDenemeSiniri` · `auth.girisKilitDakika` (X-9 — değer bugünkü koddan taşınır, doldurulur)** ·
**`import.azamiDosyaBoyutMb` (E-3, doldurulur)** *(15.09: değer D-6 yazılmadan — 1B — önce gerekir; kesin değer devreye almada, §6)*

*(Not: `pricing.fiyatGirisiKdvDahil` **belirlendi ve `false` olarak kapalı kalıyor** — Ü-3,
müşteri beyanı. `export.sablonTanimi` yalnız K-4 §(6) sütun eşlemesi için devreye almada
doldurulur.)*

---

## 5. Denetimde çıkmış ama hiçbir listede olmayan maddeler
*(X-2 07.09.2026'da; X-1 ve X-3 08.09.2026'da karara bağlandı. X-4 bu turda açıldı.)*

| # | Bulgu | Öneri | Karar |
|---|---|---|---|
| X-1 | `getSellerReports` tahsilat toplamı **dönem filtresi taşımıyor** (`reports-service.ts:36-42`) | — | ✅ **KARAR (07.09.2026, rev. 08.09.2026) — bkz. §5.1.** "Tahsilat oranı" **kaldırıldı, kalıcı** · dönem **zorunlu aralık parametresi** · `tarih?` deseni kullanılmaz · **hakediş doğuşu ≠ ödeme** · D-2 kısıtıyla **tek commit**. |
| X-2 | `recordDealerPayment` **(bayi tahsilatı)** transaction kullanmıyor (`dealers/actions.ts:370-379`) | ✅ **KARAR (07.09.2026): BLOCKER — canlıya çıkmadan önce düzeltilir.** "Bilinçli erteleme" notu **geçersizdir**: A-14 gereği **`uretBelgeNo()` belgeyle aynı transaction içinde** olmak zorundadır; aksi hâlde numara üretilir belge yazılmaz ve **`BelgeSayac` deliği kalıcı olur**. *(Sistemde fatura kesimi yoktur — C-1; madde yalnız bayi tahsilatıdır.)* | ✅ · ⚠️ **15.09.2026 — X-8 ile konusu değişti:** `recordDealerPayment` Faz 1A C5'te sökülür; bayi tahsilatı genel tahsilat akışıdır. **BLOCKER'ın ilkesi bütün tahsilatlara genişler** — ödeme kaydı ve `uretBelgeNo()` aynı transaction'da; A-14 kabul kriteri, 1B madde 2'de doğrulanır (§5.11 (7)). |
| X-3 | `global-error.tsx` yok (D-06) | Ü-9 kapsamına ekle | ✅ **KARAR (08.09.2026) — bkz. §5.2.** Sabit metin + **referans no** (belge numarası değil) · ham hata gövdesi ekrana yazılmaz · **sessiz hata yasağı** · log'a kişisel veri yazılmaz · **harici hata izleme kalıcı kapsam dışı** (KVKK md.9). |
| **X-4** | **İş hatası ve uyarı gösterim sözleşmesi yok.** `error.tsx` yalnız **fırlatılan** hatayı yakalar; server action'dan **dönen** iş hatası oraya uğramaz. A-8 blok · K-3/B-4 yumuşak kısıt · A-12/A-13/K-6/**A-15** bilgi uyarıları · B-5 "fiyat çözümlenemedi" ayrı ayrı çözülürse **§0.3'ün üç kademesi UI'da kaybolur**. Log kalıcılığı ve log saklama süresi de bu maddede | Tek sözleşme; kademe başına tek gösterim deseni | ✅ **KARAR (09.09.2026) — bkz. §5.4.** Tek dönüş sözleşmesi (`durum` + `kademe` + `kural_kodu`) · **iş hatası `throw` edilmez** · metin sunucuda üretilmez · kademe başına **tek gösterim deseni** · **uyarı yutma yasağı** · `uyari_gosterildi_mi` **konmaz** · log kalıcılığı sorusu **konusuz kaldı**. |

| **X-5** | **Parasal tip çelişkisi.** Kod `BigInt` kuruş kullanıyor (RULE-10), §4 "Sayısal tipler" `Decimal` diyor; ikisi aynı anda doğru olamaz ve seçim **şemaya dokunuyor**. Ayrıca `Decimal(5,2)` iskonto oranı için **yetersiz** — türetilen net fiyat satıcının girdiği rakamı tutmuyor | Tek tip · ölçek şemada · iskonto **türetilir** | ✅ **KARAR (13.09.2026) — bkz. §5.8.** `Decimal` · **satırda `birim_fiyat`, `iskonto_oran` türetilir** · yuvarlama modu yazılı · **lint kuralı teslim şartı** |
| **X-6** | **`PaymentAllocation` yasağı yazılı değildi.** A-7 + K-2 + X-1 §(7) tabloyu yasaklıyor; kod onun üstüne kurulu. Yaşlandırmanın (FR-26) hangi veriden türeyeceği hiçbir yerde yazılı değil | Tablo kalkar · dinamik eşleştirme de yasak | ✅ **KARAR (13.09.2026) — bkz. §5.9.** Tablo **kaldırıldı, kalıcı** · **runtime FIFO de yasak** · **yaşlandırma Faz 2+** · Faz 1'de **tutar değil, varlık uyarısı** · "otomatik mahsup" **aritmetiktir** |
| **X-7** | **`PRD_V2.md` bu dosyayla çelişiyor** (22 FR + 7 RULE) ama hâlâ `TRACEABILITY.md` ve `DUZELTME_BRIFI.md`'nin kaynağı. Üç ayrı numara evreni var (`FR-*`, `Ü-*`, `C-*`) ve her turda çakışma notu yazılıyor | PRD arşiv · kaynak KARARLAR | ✅ **KARAR (13.09.2026) — bkz. §5.10.** PRD **arşivlenir** (önce taranır) · yerine **`KABUL_KRITERLERI.md`** · numaralandırma **karar kimliğinden** · `TRACEABILITY.md` → **kod × test × karar** |
| **X-8** | **Bayinin veri modeli üç yerde farklı anlatılıyordu.** D-2 §(6) bayiyi *"cari tipi"* sayıp işlemlerini `recordDealerPayment`'a bağlıyor; A-9 cari sahibini tek tip (`Doktor`) sayıyor; A-13 `cari_tip` bayi değeri taşımıyor; plan (§D C5) bayi yönetim ekranlarını söküyordu, X-2 ise o ekranların dosyasına bakıyordu | Bayi `Doktor` satırı olur | ✅ **KARAR (15.09.2026) — bkz. §5.11.** `hesap_sinifi = BAYI` · beş `Dealer*` tablosu **kalkar** · bayi işlemleri **genel belge akışlarıdır** · bayiye satıcı atanmaz, **prim doğmaz** · 1B'de tek cari ekranı · X-2 ilkesi bütün tahsilatlara genişler |
| **X-9** | **`LoginAttempt` E-2 §(8) ile çelişiyordu.** Tablo deneme sınırı için var ve geri çekme listesinde yoktu; E-2 §(8) giriş denemelerini tabloya değil log'a yazıyor, §(5) ise deneme sınırı istiyor | Tablo kalkar | ✅ **KARAR (15.09.2026) — bkz. §5.12.** Tablo **kaldırılır** · deneme sınırı **bellek içi** (ADR-004) · eşikler `policy.ts`'te · **tek süreç varsayımı ve tetikleyici yazılı** |
| **X-10** | **Fiyat listesinin cariye bağlanışı yazılı değil.** `cozumleBirimFiyat(urun, liste, miktar, tarih)` bir `liste` alıyor, ama hangi carinin hangi listeyi kullandığı hiçbir yerde yok; `FiyatListesi`/`FiyatListesiSatir` §4 *"yeni tablolar"* sayımında da yok. Bugün doktor fiyatı `Product.netListPrice`, bayi fiyatı `DealerPrice` — **X-8 ikincisini kaldırıyor**. RULE-06 (*listede olmayan ürün bayiye sevk edilemez*) ve D-6 fiyat listesi import'u bu cevaba bağlı | **(a)** `FiyatListesi` + `FiyatListesiSatir` yeni tablo · `Doktor.fiyat_listesi_id` nullable (boş = varsayılan liste) · ürün liste fiyatı varsayılan listeye taşınır · **(b)** cariye özel liste yok; tek liste, bayi fiyatı satırda elle girilir (A-10) | ✅ **KARAR (15.09.2026) — bkz. §5.13.** **(a) seçildi:** cariye atanan liste · iki yeni tablo · boş atama = varsayılan liste · varsayılana düşülmez (RULE-06 yaşar) · `Product.netListPrice` kalkar (GÇ-15) · elle fiyat girişi serbest kalır |
| **X-11** | **`CariHareket` şemada tanımsız.** Bu kitap onu dört yerde anıyor: `CariHareket.vade_tarihi` kolonu (A-7, E-1) · `ACILIS` / `VADE_FARKI` cari hareket tipleri (A-6, A-7) · *"tahsilat … cari hareket doğurur"* (X-6 §(3)) · işaretin hareket tipinde taşınması (X-5 §(7)). Ama `CariHareket` §4'ün **ne 13 yeni tablosunda ne 4 yeni belgesinde** var. Bugünkü şemada da karşılığı yok; bugün cari `Order` + `DoctorPayment` üzerinden hesaplanıyor. `ACL` ve `VDF` önekli belgelerin nerede yaşadığı belirsiz. `hesaplaDoktorBakiye()` (K-2), cari hareket veri seti (K-4 §2) ve K-1 ters kaydı bu cevaba bağlı | **(a)** `CariHareket` **yeni çekirdek tablo.** Borç veya alacak doğuran her belge (`SVK`, `IAD`, `THS`, `ACL`, `VDF`, iptal ters kaydı) bir satır yazar. `vade_tarihi` ve işareti taşıyan tip bu tablodadır. `ACL` ve `VDF` bu tablonun kendi belgeleridir. *Bedeli:* belge ile hareket satırı aynı transaction'da yazılmak zorundadır (X-3). · **(b)** `CariHareket` **kavramsaldır**, tablo yoktur. Bakiye, borç/alacak doğuran belgelerin toplamıdır (§0.4). `vade_tarihi` borç doğuran belgelerde durur. `ACL` ve `VDF` için ayrı belge tabloları açılır. *Bedeli:* bakiye sorgusu beş belge tipini birleştirir | ✅ **KARAR (16.09.2026) — bkz. §5.14.** **(a) seçildi:** `CariHareket` yeni çekirdek tablo · `ACL`/`VDF` bu tablonun kayıtları · tutar pozitif, yön ayrı · belge ile aynı transaction · tip kataloğu ~~🟦~~ ✅ *(iç karar, 10.10.2026)* |
| **X-12** | **`ImportParti` tablo sayımında yok.** D-6 her import'un **parti numarası** taşıdığını ve **geri alınabildiğini** yazıyor; E-3 §(4) `ImportParti.dosya_adi` kolonunu koyuyor. Ama `ImportParti` §4 *"yeni tablolar"* sayımında yok. Bu, X-10'da `FiyatListesi` için yaşanan boşluğun aynısı. Geri almanın hangi kayıtları kapsadığı da bu cevaba bağlı: doktor, fiyat listesi satırı, açılış bakiyesi, açılış stoğu | **(a)** `ImportParti` **yeni çekirdek tablo** (parti numarası, `dosya_adi`). İçe aktarılan kayıtlar parti kimliğini taşır · **(b)** Tablo yok; kayıtlar yalnız parti numarası taşır. Bu durumda `dosya_adi` kolonunun yeri kalmaz ve **E-3 §(4) değişir** | ✅ **KARAR (16.09.2026) — bkz. §5.15.** **(a) seçildi:** `ImportParti` yeni çekirdek tablo · içe aktarılan kayıtlar parti FK taşır · E-3 §(4) aynen · veri türü kataloğu ~~🟦~~ ✅ *(iç karar, 10.10.2026)* |
| **X-13** | **Satıcı–doktor sahipliği yarım yazılı** *(PRD taraması — FR-03…FR-08)*. Sahiplik bu kitapta var: RULE-02, X-8 §(3) ve X-1 §(7) (*hakediş sahiplikten doğar*). Ama **görünürlüğü, atanması, devri ve pasif satıcı durumu** yazılı değil. **Çelişki:** D-2 §(3) *"satıcı veri izolasyonu Faz 1'de yapılmaz; `kapsamliDoktorlariGetir()` herkesi döndürür"* diyor. D-2 §(1) tablosu ise `SATICI` için *"kendi doktorları"* yazıyor. Bugünkü kod ve PRD FR-05 (*zorunlu*) satıcıya **yalnız kendi doktorlarını** gösteriyor. Devir bugün `DoctorAssignment` tablosunda izleniyor; tablonun akıbeti yazılı değil | **(a) İzolasyon korunur.** D-2 §(3)'ün kendi tetikleyicisi (*"izolasyon talebi gelirse tek fonksiyon değişir"*) PRD FR-05 ile gerçekleşmiş sayılır. `kapsamliDoktorlariGetir()` Faz 1'de `SATICI`'ya yalnız sahibi olduğu `DOKTOR` carilerini döndürür. · **(b) D-2 §(3) aynen.** Faz 1'de okuma serbest; bugünkü süzme sökülür (yeni GÇ). · **İki okumada ortak:** satıcının açtığı doktorun sahibi kendisidir (FR-03) sipariş yalnız sahibi olunan doktora girilir (FR-04) devir yalnız `YONETICI` işidir ve izi tutulur — `DoctorAssignment` kalır (FR-06) hakediş **siparişi giren satıcıya** yazılır; devir geçmişi taşımaz (FR-07, X-1 §(6)) pasifleştirilen satıcının doktorları sahipsiz kalır ve yeniden atanana kadar sipariş girilmez (FR-08) | ✅ **KARAR (16.09.2026) — bkz. §5.16.** **(a) seçildi:** izolasyon korunur (D-2 §(3) redakte) · siparişin satıcısı sipariş anındaki sahip · devir izli · pasif satıcının doktorları sahipsiz |
| **X-14** | **Prim oranının yeri yazılı değil** *(FR-30, FR-31)*. Hakedişin sevkiyatta doğduğu (X-1 §(7)) ve primin yalnız ciro üzerinden olduğu (D-4) yazılı; ama **oranın kendisi** hiçbir maddede yok ve `policy.ts` anahtarları arasında da yok. Bugün oran `DEFAULT_COMMISSION_RATE` sabiti (%5) ve `User.commissionRate` alanıdır (satıcı bazlı, formu yok). Ayrıca X-1 §(6) *"geçmiş dönem raporu yeniden çalıştırıldığında aynı sonucu verir"* der: oran değişince geçmiş hakediş değişmemeli, yani oran bir yere **dondurulmalı** | **(a)** Varsayılan oran `policy.ts`'tedir — `finance.primOraniVarsayilan`, **23. anahtar**; kurulum düzeyindedir, ekranı yoktur (GÇ-11). Satıcı kartında **nullable override** vardır (`Kullanici.prim_orani`, `Decimal(5,2)`; formu Ü-2). Oran değişikliği loglanır (RULE-13). **Uygulanan oran, hakedişin doğduğu sevkiyat satırına dondurulur.** · **(b)** Tek oran, yalnız `policy.ts`'te; satıcı bazlı override **kalkar** (`User.commissionRate` → GÇ). Oran yine sevkiyata dondurulur | ✅ **KARAR (16.09.2026) — bkz. §5.17.** **(a) seçildi:** `finance.primOraniVarsayilan` + satıcı kartında nullable özel oran · oran sevkiyat satırına donar |
| **X-15** | **Bugün çalışan iki davranışın bu kitapta karşılığı yok** *(FR-22, FR-09, FR-01, FR-39)*. **(i) Vade değişikliği.** Müşteri kararı D-02 *"vade esneyebilir"*. Bugün siparişe bağlı `DueDateChange` tablosu ve `changeDueDate` var (ekranı yok). A-7 `vade_tarihi`'ni koyuyor ama sonradan değişip değişmeyeceğini yazmıyor; X-11 §(5) hareketin tutar, yön ve tipini donduruyor. **(ii) Mükerrer cari engeli.** Bugün `Doctor.phoneNormalized` **NOT NULL + UNIQUE**; `clinic` ve `region` NOT NULL. A-13 ayrıca bir `telefon` alanı sayıyor. X-8 ile bayi de bu tabloda ve bayinin kliniği ya da bölgesi yok. PRD bayi için *kod* ve *yetkili* de istiyordu | **(a) İkisi de korunur:** **(i)** `vade_tarihi` sonradan değiştirilebilir. Yalnız `YONETICI` değiştirir; gerekçe zorunludur. Her değişiklik eski ve yeni tarih, kişi ve zamanla **ayrı iz tablosuna** yazılır (bugünkü `DueDateChange`); iz **cari harekete** bağlanır. Tutar değişmediği için hiçbir hesap etkilenmez (A-7: vade farkı otomatik değildir). **(ii)** Telefon **zorunlu ve normalize hâliyle benzersiz** kalır; A-13'ün `telefon`'u bu alandır, ikinci alan açılmaz. Klinik ve bölge `DOKTOR` için zorunlu, `BAYI` için boş olabilir. Bayiye ayrı *kod* ya da *yetkili* alanı konmaz (`muhasebe_kodu` ve `fatura_unvani` yeter). Ad + klinik benzerlik uyarısı Faz 2'dir (Ü-10). · **(b)** Maddeler tek tek karara bağlanır | ✅ **KARAR (16.09.2026) — bkz. §5.18.** **(a) seçildi:** vade değişikliği izli (yalnız `YONETICI`) · telefon zorunlu ve benzersiz · `BAYI`'de klinik/bölge boş olabilir |
| **X-17** | **Sahipliği altı yol yazacak, devir tek tek, pasif satıcının portföyü sahipsiz düşüyor** *(19.09 incelemesi, bulgu 3)*. X-13 sahipliğin ne olduğunu yazdı, nasıl değiştiğini yazmadı; bugünkü devir izi dönem kaydı tutuyor ve sahipsizliğe geçiş izsiz. `BAYI` sahipsizliği DB'de kısıt değil | **(a)** Tek yazma noktası + toplu devir + pasifleştirmede zorunlu portföy seçimi · **(b)** bugünkü davranış (sahipsiz düşer, tek tek atanır) | ✅ **KARAR (01.10.2026) — bkz. §5.19.** **(a) seçildi:** `degistirDoktorSahibi()` 12. tek çağrı noktası · `BAYI`'de sahip boş (`CHECK`) · iz olay kaydı · pasifleştirmede devret ya da sahipsiz bırak |
| **X-16** | **Cari şablonunun kararlarla bağı yok** *(19.09 incelemesi, bulgu 1 + genişletme)*. K-7 §(2) şablonu *"D-6'daki A-13 alanları"* diye tarif ediyor; sonra X-8 §(6) `hesap_sinifi`'yi, X-15 §(3) klinik ve bölgeyi zorunlu yaptı, ikisi de şablona yansımadı. Fiyat listesi ataması ve import yetkisi yazılı değil. Ayrıca telefon UNIQUE (X-15 §(2)) ile aynı klinikte çok doktor (A-9) arasında yazılmamış varsayım *(bulgu 2)* | **(a)** Import elle girişin toplu hâli, şablon tek tanımdan · **(b)** K-7'ye açık kolon tablosu | ✅ **KARAR (13.10.2026) — bkz. §5.20.** **(a) seçildi:** import'a özgü doğrulama yok · kısmi yazma yok · `CARI` yalnız `YONETICI` · import kayıt güncellemez · kısmi geri alma yok · mekanizma `docs/adr/ADR-006`. Telefon varsayımı **X-15 §(5) 🟦** |

> **Serinin kapsamı genişledi (13.09.2026).** `X-*` bugüne kadar *"kod denetiminde çıkmış ama
> hiçbir listede olmayan"* maddeleri taşıyordu. **X-5…X-7 belge uyum denetiminden** doğdu:
> bu dosya ile diğer dosyalar arasındaki çelişkilerden. Ortak nokta aynı — **hiçbir listede
> olmayan, ama karar verilmeden ilerlenemeyen madde.**

**Ü-3 · D-08 toggle önceliğinin kapsamı** → ✅ **KARAR (09.09.2026) — bkz. §5.3.**
Tespit doğru, beklenti yanlıştı: doktor detayı ve tahsilat ekranlarında eksik olan **toggle
değil, taban etiketiydi**.

**08.09.2026'da açılan üç temel madde — üçü de 09.09.2026'da karara bağlandı:**

- **E-1 · Zaman dilimi ve gün sınırı** → ✅ **bkz. §5.5.** Saklama UTC, yorum
  `Europe/Istanbul`; **an** ile **takvim günü** şema düzeyinde ayrıldı; aralıklar yarı açık.
- **E-2 · Hesap yaşam döngüsü** → ✅ **bkz. §5.6.** Kapalı hesap modeli; **veritabanı
  oturumu**; hesap silinmez, pasifleştirilir. **Şemaya ekleme yapar.**
- **E-3 · Dosya eki** → ✅ **bkz. §5.7.** **Kalıcı dosya eki yoktur**; K-9 §A-3'ün varsayımı
  **yanlıştı ve düzeltildi**. *Beklenen sonuç çıktı: kapsam dışı, ama yazılı.*

### 5.1 X-1 · Satıcı raporu, dönem ve hakediş tanımı — karar metni *(07.09.2026, rev. 08.09.2026)*

**§0.7 bulgusu (teyit edilmeli):** Prim, yargı kararlarında temel ücretin üzerine ödenen
**ücret eki** olarak tanımlanıyor (İş K. md. 32) ve sigorta primine esas kazanca dâhil.
Sözleşmede yazılı olmasa bile düzenli ödenen prim **işyeri şartı** hâline gelir; tek taraflı
azaltılması İş K. md. 22 kapsamındadır. → Sistemin ürettiği prim sayısı gösterge değil,
**ödemenin dayanağıdır**.

**İkinci bulgu — oran zaten bozuktu:** pay **brüt**, payda **matrah** (C-6 §6); pay vadeye,
payda sevkiyata bağlı (A-7 vs. A-3). Dönem filtresi bunlardan yalnız birini düzeltir.

**Genel ERP prensibi:** Satış ve hakediş raporlarında tarih aralığı **opsiyonel değildir**;
"tüm zamanlar" ayrı bir seçimdir. Tahsilat performansı oranla değil, **alacak yaşlandırma**
ve **DSO** ile ölçülür. Tahsilata bağlı prim **açık kalem kapatma** gerektirir (SAP, Logo,
Netsis) — bizde yoktur ve **kalıcı olarak olmayacaktır** (K-2, A-7).

> **KARAR:**
>
> **(1) "Tahsilat oranı" metriği kaldırılır — kalıcı.** Yerine **iki mutlak sayı**, tabanı
> ekranda yazılı: **dönem cirosu (matrah, sevkiyat bazlı)** ve **dönem tahsilatı (brüt)**.
> Bölme yapılmaz. Tahsilat takibinin doğru yeri `hesaplaDoktorBakiye()` ve
> `hesaplaDoktorRisk()`'tir. *(§0.4 oran kuralı buradan doğdu.)*
>
> **(2) Dönem parametresi zorunludur ve aralıktır.**
> `getSellerReports(kullanici, { baslangic, bitis })`. Zorunlu parametre hatayı **derleme
> zamanına** taşır; opsiyonel parametre aynı hatayı bir sonraki çağıranda geri getirir.
> UI varsayılanı içinde bulunulan aydır; "tüm zamanlar" **bilinçli seçimdir**.
>
> **(3) `tarih?` deseni burada kullanılmaz — ayrım kalıcıdır.**
> · **Nokta (an):** `hesaplaDoktorBakiye(doktor, tarih?)`, `hesaplaStok(urun, konum?, tarih?)`
> · **Aralık (akım):** satıcı raporu, ciro, tahsilat toplamı
> Bir fonksiyona ikisi birden konmaz; "tarihe kadar ciro" diye bir sayı üretilmez.
>
> **(4) Dönemin ekseni belge tarihidir.** Ciro → sevkiyat tarihi (A-3), tahsilat → tahsilat
> tarihi. **`beklenen_valor_tarihi` kullanılmaz** — valör **beklentidir, gerçekleşme
> değildir** ve bankası bizde olmayan bir olayı temsil eder (§0.4).
>
> **(5) Sorgu sayılan belgeler filtresini kullanır; inline `where` yasaktır** (A-5, K-4).
>
> **(6) Geçmiş dönem raporu yeniden çalıştırıldığında aynı sonucu verir.** İade/iptal
> (A-1, K-1) primi **ters kaydeder**; ters kayıt **kendi belge tarihinde** doğar, kapanmış
> dönemi değiştirmez (§0.2). **Ödenmiş bir ücret ekini geriye dönük eksilten rapor
> üretilmez.**
>
> **(7) Hakediş doğuşu ile hakediş ödemesi kalıcı olarak ayrıdır.**
> · **Doğuş: sevkiyat anı** (A-3, taban matrah) — değişmez.
> · **Ödeme: müşterinin kararı**, sistemin dışında. Sistem **"ödenebilir prim"** sayısı
>   üretmez. Tahsilata bağlı prim hesaplanamaz: hangi tahsilatın hangi sevkiyatı kapattığı
>   sistemde yoktur (K-2, A-7). **Tahminî bir sayı üretmek, üretmemekten kötüdür.**
>
> **(8) D-2 kısıtı aynı fonksiyonda, aynı commit'te.** `SATICI` yalnız kendi prim/hakedişini
> görür; kısıt **sorguda** uygulanır (D-2 §3). **D-2 §(1) tablosu düzeltilir: prim raporu
> `YONETICI` + kendi verisiyle `SATICI`'dadır; `OPERASYON` prim raporunu görmez** — prim
> ücret ekidir, başka çalışanın ücret bilgisidir ve `OPERASYON`'un iş akışında tüketicisi
> yoktur.
>
> **(9) Bu fonksiyon servis katmanının ilk test edilen fonksiyonudur.** Dönem, yetki ve
> sayılan belgeler filtresi tek yerde kesişir. **X-1 + D-2 tek seferde yapılır.**
>
> **(10) Yeni tek çağrı noktası fonksiyonu açılmaz.** Liste **11'de kalır**; dönem bir
> parametredir, bir mekanizma değil.
> *01.10.2026 — geri not: X-17 ile tek çağrı noktası listesi **12**'ye çıktı (`degistirDoktorSahibi()`); bu maddenin hükmü değişmedi.*
>
> **(11) "Para hesaba geçti" olayı sistemde yoktur ve bayrağı konmaz.**
> `Tahsilat.hesaba_gecti_mi` benzeri hiçbir alan konmaz (§0.1, sekizinci uygulama).
> **Tahsilat kaydının kendisi "para alındı" beyanıdır.**
>
> **✅ Ek (17.10.2026 · ürün sahibi kararı) — dönem tahsilatının satıcısı.** Tahsilat siparişe
> eşlenmez (X-6); satıcı raporundaki dönem tahsilatı, **tahsilat anında doktorun sahibi olan
> satıcıya** sayılır. Sahip, sahiplik iz kaydından okunur (X-17 §(3)). Devir geçmiş tahsilatı
> taşımaz; geçmiş dönem raporu devirden etkilenmez (§(6), X-13 §(4) deseni). Tahsilat anında
> sahipsiz olan doktorun ve `BAYI`'nin tahsilatı hiçbir satıcıya sayılmaz.
>
> **Kapsam dışı, kalıcı:** tahsilat oranı metriği · tahsilat bazlı prim hakedişi · prim
> tahakkuk belgesi, prim ödeme kaydı, bordro, prim onay iş akışı · dönem kapatma/kilitleme ·
> hedef/kota (D-4) · geriye dönük prim düzeltme ekranı.
> **⚪ Faz 2+:** alacak yaşlandırma / DSO — **ayrı rapordur, oran değildir**.
>
> ---
> **🟦 Varsayılan kaydı — prim ödeme tetikleyicisi**
>
> | Alan | İçerik |
> |---|---|
> | **Varsayılan davranış** | Sistem hakedişi **sevkiyat anında** hesaplar ve dönem bazında gösterir. Ödeme zamanlaması modellenmez; tahsilatla eşleştirme müşteride kalır. "Ödenebilir prim" üretilmez. |
> | **Cevabın değiştirdiği katman** | Yalnız **eğitim, teklif ve sözleşme dili**. §0.1 triyajında **üçüncü kova**. |
> | **Kilitlenme anı** | **Canlıya geçişten sonraki ilk prim ödemesi.** O ay hangi sayıya bakıldığı, tanımın kendisi hâline gelir. |
>
> **Not (08.09.2026):** *"Prim, para şirket hesabına geçtikten sonra ödenir"* ifadesi bugün
> **bizim çıkarımımızdır, müşteri beyanı değildir** (§0.6 sorumluluk sınırı). Bölüm 2
> madde 23-a ile **yazılı teyide** çevrilecektir.

### 5.2 X-3 · Hata yüzeyi ve `global-error.tsx` — karar metni *(08.09.2026)*

**§0.7 notu:** Yeni araştırma gerekmedi; iki mevzuat bağı mevcut kararlardan geliyor.
(a) Harici hata izleme servisleri (Sentry vb.) hata gövdesini **yurt dışına** yazar → KVKK
md.9 ve **K-9 §A-1** kapatır. (b) Ham hata ekranı bir sızıntı yüzeyidir; Prisma hataları alan
adını, kısıt adını, zaman zaman **değerin kendisini** mesaja koyar → C-3 §7.

**Genel ERP prensibi:** Kullanıcı hata değil **referans** görür (SAP kısa dump kimliği, Logo
hata kodu, Odoo geliştirici modu). Desen üç maddedir: sabit metin · destekle konuşulacak
referans · ayrıntı yalnız log'da.

> **KARAR:**
>
> **(1) `global-error.tsx` eklenir — teslim şartıdır, özellik değil.** Yanına `not-found.tsx`
> ve **üç kritik segmentte** `error.tsx`: sipariş/sevkiyat · tahsilat · stok. Kalan segmentler
> global sınıra düşer; **her rotaya ayrı hata ekranı yazılmaz.**
> *(Teknik kısıt: `global-error.tsx` kök layout'un yerine geçer, kendi `<html>`/`<body>`'siyle
> gelir ve istemci bileşenidir — içinde oturum, yetki veya veri okuması yapılamaz.)*
>
> **(2) Kullanıcıya gösterilen metin sabittir; hata gövdesi hiçbir koşulda ekrana yazılmaz.**
> Ne stack, ne SQL, ne Prisma mesajı, ne alan adı. Ekranda üç şey vardır: sabit açıklama ·
> **hata referans numarası** · geri dönüş bağlantısı.
>
> **(3) Hata referansı belge numarası değildir.** `uretBelgeNo()` **kullanılmaz**,
> `BelgeSayac` harcanmaz. Referans istek başına üretilir, log'a yazılır, **veritabanında
> saklanmaz**. A-14 §10 iç/dış belge ayrımının üçüncü uygulamasıdır.
>
> **(4) Sessiz hata yasaktır.** `catch` bloğunda hatayı yutup başarılı sonuç dönmek
> **yasaktır**. Kullanıcıya "işlem tamamlanamadı" denen her durumda veritabanında **hiçbir
> kalıntı olmamalıdır** — bunu sağlayan `try/catch` değil **transaction**'dır (X-2 kuralının
> genellemesi).
>
> **(5) Hata sonrası telafi/temizlik kodu yazılmaz.** Geri alma transaction'ın işidir; telafi
> amaçlı `DELETE` veya elle düzeltme kodu yasaktır (§0.2).
>
> **(6) Log içeriği asgaridir ve kişisel veri taşımaz.** Yazılan: zaman, referans no, rota,
> kullanıcı **kimliği** (adı değil), hata sınıfı, stack. **Yazılmayan:** sorgu parametre
> değerleri, form gövdesi, doktor adı/VKN/telefon, tutarlar. Prisma hata nesnesinin `meta`
> alanı **ham loglanmaz** (C-3 §4, §7).
>
> **(7) Harici hata izleme servisi kullanılmaz — kalıcı ürün kararı** (K-9 §A-1).
> Türkiye'de kendi barındırdığımız toplayıcı da **K-9 kapsam dışıdır** (merkezi log, APM).
> Faz 1'de log hedefi **container çıktısıdır**; izleme asgarisi K-9 §A-7'dedir.
>
> **(8) Hata ekranı yetki sızdırmaz.** Metin, kullanıcının yetkisi olmayan bir kaydın
> **varlığını** ima etmez ("bu doktora erişim yetkiniz yok" denmez, genel metin gösterilir).
> D-2 §(3)'ün hata yüzeyindeki karşılığıdır.
>
> **(9) Ü-9 kapsamındadır, ayrı fiyatlanmaz** (D-2 §7 deseni).
>
> **Kapsam dışı, kalıcı:** harici hata izleme servisi · APM, dağıtık izleme, merkezi log
> toplama (K-9) · veritabanında hata kaydı tablosu · kullanıcıya hata bildirimi e-postası
> (D-1) · otomatik yeniden deneme, kuyruk, offline mod · her rota için ayrı hata ekranı ·
> kullanıcıya teknik ayrıntı gösteren geliştirici modu.
>
> **Açık kalan ve X-4'e devredilen:** **iş hatası** (fırlatılan değil, server action'dan
> **dönen** hata) gösterim sözleşmesi ve **log kalıcılığı / log saklama süresi**.

---

### 5.3 Ü-3 · D-08 toggle kapsamı ve taban etiketi — karar metni *(09.09.2026)*

**§0.7 bulgusu (teyit edilmeli):** KDV Kanunu md. 57, **perakende** satışı yapılan mallara
ait **etiketlerde** KDV'nin satış fiyatına dahil olup olmadığının açıkça belirtilmesini
zorunlu tutuyor; Genel Tebliğ perakendede etiket ve listelerin **KDV dahil tek tutar** olarak
ifade edilmesini uygun görüyor. Perakende tanımı, malın **tekrar satışa arz edilmemesi** ve
tüketilmek/sarf malzemesi olarak kullanılmasına bakıyor — kliniğin hastada kullandığı tıbbi
malzeme bu tanıma girebilir. **Çelişkinin kendisi bulgudur** (§0.7), **ama bizi bugün
bağlamıyor:** yükümlülük **etiket ve listeye** aittir, iç ekrana değil; ve Faz 1'de sistemden
müşteriye giden hiçbir fiyat çıktısı yoktur (K-4 §2 format katmanı Excel/CSV; PDF Faz 2+;
fatura ve irsaliye yok — C-1 §1). **Yükümlülük teklif çıktısı yazıldığı gün doğar.**

**Müşteri beyanı (09.09.2026):** yayınlanan fiyat listeleri **KDV hariçtir**; indirim
**alınan adede göre kademelidir**; KDV **sonradan** eklenir.

**Genel ERP prensibi:** Logo, Netsis, Odoo ve Paraşüt'te desen üç parçalıdır — depoda **tek
taban** durur (matrah), "KDV dahil" bir **giriş/gösterim çevirisidir**, tercih **belge/liste
düzeyindedir, kullanıcı düzeyinde değildir**. Hiçbirinde cari hesap ve tahsilat ekranlarında
böyle bir tercih yoktur: tahsil edilen para brüttür, bölünecek bir tabanı yoktur.

**Ekran sınıfları:**

| Sınıf | Ekranlar | Taban | Toggle |
|---|---|---|---|
| **A · Matrah girilen** | Fiyat listesi satırı (B-5/B-6), sipariş ve teklif satırı (A-10) | matrah, kanonik | Anlamlı — ama beyanla konusuz kaldı |
| **B · Brüt zorunlu** | Doktor detayı ve cari bakiye (K-2), cari ekstre, tahsilat (A-11), risk/kredi limiti (A-12) | brüt | **İmkânsız** |
| **C · Matrah zorunlu** | Satıcı prim/hakediş raporu, dönem cirosu (X-1), kongre hakkedişi | matrah | **Yasak** |

> **B sınıfında toggle açmak teknik olarak imkânsızdır, tercih meselesi değildir:** cari
> bakiye `ACILIS` (A-6) ve `VADE_FARKI` (A-7) hareketlerini içerir, ikisi de **KDV kırılımı
> taşımaz** (C-6 §9). Toggle açılırsa sistem **eksik veriden bir sayı uydurur** ve §0.1
> doğrulanabilirlik testine takılır.

> **KARAR (Ü-3):** D-08 bir **kurulum düzeyi görünüm/giriş tercihidir**, kullanıcı toggle'ı
> değildir. Kapsamı **matrah girilen ekranlarla sınırlıdır**; kalan ekranlarda toggle yerine
> **taban etiketi zorunluluğu** gelir.
>
> **(1) Tercih tek noktadan okunur:** `pricing.fiyatGirisiKdvDahil` (C-6 §4). Kullanıcı
> başına tercih, ekran başına hafıza ve tarayıcı saklaması **yoktur** (§0.1: her toggle test
> matrisini ikiye katlar, servis katmanında hâlâ test yok).
>
> **(2) Toggle yalnız A sınıfı ekranlarda anlamlıdır** (fiyat listesi satırı, sipariş/teklif
> satırı). Ü-3'ün bugünkü kapsamı **budur ve genişletilmez**.
>
> **(3) Müşteri beyanı gereği Faz 1'de toggle hiçbir ekranda görünmez.**
> `pricing.fiyatGirisiKdvDahil` = `false`; **config belirlenmiştir, AÇILMAZ**. Çeviri
> katmanı, ekranı ve **ikinci yuvarlama noktası riski Faz 1'de yazılmaz**. İkinci bir müşteri
> KDV dahil çalışıyorsa o gün açılır.
>
> **(4) B sınıfında toggle konmaz — kalıcı.** Doktor detayı, cari bakiye, cari ekstre,
> tahsilat, risk ve kredi limiti daima **brüttür** (C-6 §6).
>
> **(5) C sınıfında toggle konmaz — kalıcı.** Prim, hakediş ve dönem cirosu daima
> **matrahtır** (X-1 §1, C-6 §6).
>
> **(6) Toggle'ın yerini alan kural: taban etiketi zorunludur** (§0.4'e genel kural olarak
> işlendi). Ekranda gösterilen **her para tutarının** yanında tabanı yazılıdır. Etiket A
> sınıfında `hesaplaSatirTutarlari()` çıktısından, B ve C sınıfında **ekranın sabit
> sınıfından** türer. **Ü-3'ün "(2) doktor detayı + tahsilat ekranları eksik" tespiti bu
> kuralla kapanır, toggle ile değil.**
>
> **(7) Karma kolon yasağı.** Tek kolonda iki farklı tabanlı tutar gösterilmez; iki taban da
> gerekiyorsa **iki ayrı kolon**, her birinin başlığında tabanı yazılı.
>
> **(8) A sınıfı ekranlarda belge toplamı üç satırdır: Matrah · KDV · Genel Toplam.**
> Satırlar matrah gösterir. Gerekçe: doktorun ödeyeceği ve cari hesabına düşecek tutar
> **brüttür** (C-6 §6, K-2); yalnız matrah gösterilirse satıcı doktora **eksik rakam söyler**.
> Bu bir toggle değildir — **üç sayı da aynı anda görünür** ve her birinin adı tabanıdır.
>
> **(9) Barem ve iskonto matrah üzerinde çalışır — teyit.** `cozumleBirimFiyat()` matrah
> döndürür; **KDV hiçbir indirim hesabının girdisi değildir** (B-6, A-10, C-6 §5). *Aksi
> hâlde karma oranlı (%10/%20) bir siparişte aynı adet aynı indirimi vermezdi.*
> Kademeli fiyat `FiyatListesiSatir.min_adet` **alt sınır satırlarıyla** kurulur; **üst sınır
> tutulmaz**; seçim `miktar >= min_adet` olan **en yüksek** satırdır (B-6).
>
> **(10) Satıcının elle fiyat girmesi serbesttir ve tavanı yoktur** (A-10, madde 8).
> · `liste_fiyat` **daima `cozumleBirimFiyat()` çıktısıdır** (bareme göre çözülmüş); elle
>   giriş bu alanı değiştirmez.
> · Satıcının girdiği net fiyat **`birim_fiyat` olarak, aynen saklanır**; iskonto oranı
>   **gösterimde türetilir** *(X-5 §(9)/(10) revizyonu — 13.09.2026; `Decimal(5,2)` oran
>   yuvarlaması geri türetilen fiyatı kaydırıyordu)*.
> · **Liste üstü satış da serbesttir**; türetilen oran **negatif çıkar** — ayrı bir işaret
>   gerekmez (X-5 §(11)). `pricing.iskontoTavani` `null` kalır.
> · **Sistem maliyet/geliş fiyatı tutmaz — kalıcı** (C-2 §4). Satıcının kafasındaki geliş
>   fiyatı sistemin girdisi değildir; sistem yalnız **sapmayı** kaydeder ve satıcı bazında
>   raporlar.
>
> **(11) Toggle görünümü değiştirir, hesabı değiştirmez.** Veritabanında her zaman matrah
> durur; yuvarlama **tek noktada**, `hesaplaSatirTutarlari()`'ndadır (C-6 §5); belge toplamı
> = Σ satır kuralı toggle'dan bağımsızdır. *(Config açılırsa: birim fiyat `Decimal(18,4)`
> olduğu için çeviri farkı satır kuruşuna genellikle yansımaz, ama **birebir geri dönüş
> garanti edilmez** ve bu kullanıcıya söylenir.)*
>
> **(12) Dışa aktarım toggle'ı tanımaz.** Veri seti kolonlarının tabanı **sabittir**
> (K-4 §2, C-6); ekran tercihinin dosyaya sızması yasaktır — K-4 §(6) çıktısı faturaya
> gidiyor.
>
> **(13) X-4 ile sınır:** Ü-3 **statik taban sözleşmesidir**, X-4 **olay sözleşmesidir**.
> Taban etiketi bilgi kademesi **değildir** (§0.3), uyarı ve `OnayBlogu` üretmez; §0.1
> üçüncü kovadadır. **Tabanı çözülemeyen tutar ekranda boş kalır** — sıfır veya son fiyat
> gösterilmez (B-5) — ve gösterimi **X-4'e devredilir**.
>
> **(14) Şemaya ve tek çağrı noktası listesine etki yoktur.** Liste **11'de kalır**.
> *01.10.2026 — geri not: X-17 ile tek çağrı noktası listesi **12**'ye çıktı (`degistirDoktorSahibi()`); bu maddenin hükmü değişmedi.*
>
> **(15) Faz 2 devri — mevzuat izi.** Sistem müşteriye giden bir fiyat çıktısı üretmeye
> başladığı gün (teklif PDF'i, K-4 §2 format katmanı) KDV Kanunu md. 57'nin etiket/liste
> kuralı gündeme gelir. **Bugün dokunmuyor, o gün dokunur; değerlendirme müşavirindir.**
>
> **Kapsam dışı, kalıcı:** kullanıcı bazlı görünüm tercihi ve saklanması · ekran başına
> hafıza · B/C sınıfı ekranlarda taban seçimi · KDV dahil fiyatın saklanması · rapor bazlı
> taban seçimi · para birimi/format tercihi (C-5).

### 5.4 X-4 · İş hatası ve uyarı gösterim sözleşmesi — karar metni *(09.09.2026)*

**§0.7 notu:** Yeni araştırma gerekmedi. Log içeriği C-3 §4/§7 ve X-3 §6'da kapalı; **KVKK
saklama süresi tartışması ancak log kişisel veri taşırsa doğar** ve X-3 §6 taşımayı zaten
yasakladı. Madde saf tasarım maddesidir.

**Genel ERP prensibi:** SAP'ın mesaj tipleri (`A` abort · `E` error · `W` warning · `I` info ·
`S` success) **§0.3'ün üç kademesinin ta kendisidir** ve tek bir sözleşmeyle taşınır: iş
mantığı bir mesaj **döndürür**, ekranı seçmez. Odoo'da `UserError`/`ValidationError` akışı
durdurur, `warning` durdurmaz. Ortak nokta: **kademeyi iş mantığı söyler, gösterimi tek bir
UI katmanı yapar.**

**Teknik ayrım — X-3 yarısını zaten çözdü:**

| Ne | Nasıl bildirilir | Kim yakalar |
|---|---|---|
| **Teknik hata** (beklenmeyen) | `throw` | `error.tsx` / `global-error.tsx` → **X-3** |
| **İş hatası ve uyarı** (beklenen) | **dönüş değeri** | **X-4** |

> **KARAR (X-4):** Server action'lardan dönen her sonuç **tek bir sözleşme** taşır. Kademeyi
> **servis katmanı** belirler, gösterimi **tek UI bileşeni** yapar.
>
> **(1) Tek dönüş sözleşmesi.** Her server action `{ durum, kademe, kural_kodu,
> parametreler }` döner. `durum`: `BASARILI` | `ENGELLENDI` | `ONAY_GEREKLI` |
> `BASARILI_UYARILI`. `kademe` §0.3'ün kademeleridir: **`SERT` · `YUMUSAK` · `BILGI`**.
> **Dördüncü hâl (salt kayıt alanı) hiçbir şey döndürmez** — tanımı gereği görünmezdir.
>
> **(2) İş hatası `throw` edilmez — kalıcı kural.** `throw` yalnız **beklenmeyen teknik
> hata** içindir ve X-3'e gider. Ters kullanım iki sistemi karıştırır: fırlatılan iş hatası
> kullanıcıya **hata referans numarası** gösterir ve gereksiz destek çağrısı üretir.
>
> **(3) Metin sunucuda üretilmez.** Sunucu **`kural_kodu`** (A-8 kural kodu kataloğu) ve
> **parametreleri** döner; metin UI tarafında **tek sözlükten** gelir. Aynı kural iki ekranda
> iki farklı cümleye dönerse kullanıcı **iki farklı kural sanır**. Kural kodu kataloğu
> **kodda kapalıdır** (§0.1.1) ve **`varchar` olarak saklanır** (§1.3 §B-7).
>
> **(4) Kademe başına tek gösterim deseni — kapalı liste.**
>
> | Kademe | Akış | Gösterim | Örnek |
> |---|---|---|---|
> | **`SERT`** | **Durur.** Kayıt oluşmaz | Alanın altında, alan işaretli | B-5 tarih çakışması ve **"fiyat çözümlenemedi"** · A-13 VKN hane sayısı · C-3 §6 belgeli kayıt |
> | **`YUMUSAK`** | Durur; **yetki + zorunlu gerekçe** ile devam | Onay diyaloğu + **gerekçe alanı zorunlu**; yetkisizse *"onaya gönderildi"* | A-8 · K-3 kontenjan · B-4 negatif stok · K-6 limitleri |
> | **`BILGI`** | **Durmaz.** İşlem tamamlanır | Sonuç ekranında **kapatılabilir şerit** | A-12 kredi limiti · A-13 eksik fatura bilgisi · **A-15 nakit tevsik** · K-6 bildirim · **K-4 §(6)-d 7 gün** |
>
> **(5) Yumuşak kısıt `OnayBlogu`'dur, ikinci mekanizma açılmaz** (A-8). Yönetimsel eylemler
> (B-7 stok düzeltme, C-3 §6 silme, E-2 kullanıcı pasifleştirme) `OnayBlogu` **kullanmaz**;
> deseni **yetki + zorunlu gerekçe + log**'dur ve UI'da `YUMUSAK` gibi görünür ama **blok
> kaydı doğurmaz** (§0.3 sınırı).
>
> **(6) Bilgi kademesi hiçbir yere yazılmaz.** `uyari_gosterildi_mi` benzeri bir alan
> **konmaz** — kolon testinin üçüncü sorusunda düşer ve **doğrulanamaz** (§0.1, **dokuzuncu
> uygulama**): uyarının gösterildiğine dair kayıt, gösterilmediğinde de doğru görünür.
>
> **(7) Uyarılar yutulmaz — sessiz hata yasağının UI hâli** (X-3 §4). Bir işlem birden çok
> uyarı üretiyorsa **hepsi döner ve hepsi gösterilir**; sıralama kademeye göredir ve
> **akışı en yüksek kademe belirler**. İlkini gösterip kalanını atmak yasaktır.
>
> **(8) Log kalıcılığı — soru konusuz kaldı.** Faz 1'de kalıcı kayıt üreten tek şey
> **`OnayBlogu`** (A-8) ve **değişiklik logudur** (C-3 §4, A-13 §7); ikisi de ticari/denetim
> kaydıdır, **§0.2 gereği silinmez**, saklama süreleri `kvkk.saklamaSuresiYil` kapsamındadır.
> **İş hataları ve bilgi uyarıları loglanmaz** — normal iş akışıdır, hata değildir. Teknik
> hata logu **container çıktısındadır** (X-3 §7); rotasyonu altyapı ayarıdır ve **K-9 §A-7
> izleme asgarisine bir satır olarak eklenir**. Log kişisel veri taşımadığı için (X-3 §6)
> ayrı bir KVKK saklama süresi kararı gerekmez.
> *(Tek istisna D-5 §5'tir: dışa aktarım kütüğü veritabanındadır ve denetim izidir.)*
>
> **(9) Hata ve uyarı metni yetki/varlık sızdırmaz** (X-3 §8, D-2 §3).
>
> **(10) Şemaya etki yoktur ve yeni tek çağrı noktası açılmaz.** Sözleşme bir **dönüş
> tipidir**, mekanizma değil; liste **11'de kalır**.
> *01.10.2026 — geri not: X-17 ile tek çağrı noktası listesi **12**'ye çıktı (`degistirDoktorSahibi()`); bu maddenin hükmü değişmedi.*
>
> **(11) Ü-9 kapsamındadır, ayrı fiyatlanmaz** (X-3 §9, D-2 §7 deseni).
>
> **Kapsam dışı, kalıcı:** uyarı geçmişi tablosu ve ekranı · kullanıcı bazlı uyarı susturma ·
> uyarının e-posta ile bildirimi (D-1) · çok kademeli onay, vekalet, eskalasyon (A-8, §3.5) ·
> kullanıcı tarafından düzenlenebilir mesaj metni · çoklu dil.

### 5.5 E-1 · Zaman dilimi ve gün sınırı — karar metni *(09.09.2026)*

**§0.7 bulgusu (teyit edilmeli):** Türkiye 2016'da alınan kararla **kalıcı yaz saatine**
geçti; kış saati kaldırıldı ve ülke yıl boyunca **UTC+3** kullanıyor (Avrupa'nın Mart 2026
geçişi Türkiye'yi kapsamadı). Bulgunun iki yüzü var: **(a)** ofset bugün sabit, yılda iki kez
atlama yok; **(b)** ama bu bir **karardır, doğa kanunu değil** — 2016'da bir kararla değişti,
bir kararla geri dönebilir. C-6'nın kuralı aynen geçerlidir: **mevzuatın belirlediği sayı
koda gömülmez** (§0.1.1). `+03:00` yazmak, `VergiOrani` yerine `0.20` yazmakla aynıdır — fark,
KDV değişimini herkesin görmesi, **saat değişiminin sessizce yanlış çalışmasıdır**.

**Güne dayanan altı kural ve hiçbirinin yazılı tanımı yoktu:** A-15 "aynı gün" · B-7 §4
"bugün" · A-14 §5 takvim yılı · X-1 §2 dönem aralığı · C-2 §3 `tarih?` · B-5 geçerlilik
aralığı.

> **En keskin örnek A-14:** 1 Ocak 01:00'de (TR) kesilen sipariş, UTC'de hâlâ 31 Aralık'tır.
> Sayaç UTC yılına bakarsa numara **geçen yılın serisinden** çıkar — ve `belge_no`
> **değiştirilemez** (A-14 §9), **global UNIQUE**'tir. Hata **kalıcıdır ve geri alınamaz**.
> **İkinci örnek A-15:** 23:30 ve 00:30'daki iki nakit tahsilat UTC gününe göre **aynı güne**
> düşer → uyarı yanlış tetiklenir.

**Genel ERP prensibi:** SAP, Odoo ve Logo'da iki kavram vardır ve **aynı kolonda taşınmazlar**
— **an** (UTC saklanır, kullanıcının diliminde gösterilir) ve **takvim günü** (zaman dilimi
taşımaz). Vade tarihini `timestamptz` tutan ERP, vadeyi bir gün kaydıran ERP'dir.

> **KARAR (E-1):** Saklama **UTC**, yorumlama **`Europe/Istanbul`**. Dönüşüm **tek
> noktadadır** ve iki kavram **şema düzeyinde** ayrılır.
>
> **(1) An ile takvim günü ayrı tiplerdir — şema kuralı.**
> · **An** (`timestamptz`, UTC): `guncelleme_tarihi`, kayıt zamanı, log zamanı, `OnayBlogu`
>   karar zamanı, `kargo_son_sorgu`.
> · **Takvim günü** (`date`, dilim taşımaz): `CariHareket.vade_tarihi` (A-7) ·
>   `Siparis.teklif_gecerlilik_tarihi` (A-5) · `FiyatListesiSatir.gecerli_baslangic` /
>   `gecerli_bitis` (B-5) · `Sevkiyat.gonderi_tarihi` (D-3) · `Kongre.baslangic_tarihi` /
>   `bitis_tarihi` / `bildirim_tarihi` (K-6) · `PazarlamaButcesi.donem_*` (K-6) · belge
>   tarihleri.
> **Yeni kolon eklenmez; mevcut kolonların tipi netleşir.**
> ⚠️ **Ucuz olan tek an bugündür:** tip yanlış konursa düzeltmesi **veri taşıma
> migration'ıdır** (§0.1.a maliyet asimetrisi).
>
> **(2) Zaman dilimi adla taşınır, ofsetle değil.** Config `zaman.saatDilimi`
> (= `Europe/Istanbul`) **belirlenir, kullanıcıya açılmaz**. `+03:00` sabiti koda
> **yazılmaz**. Uygulama container'ı ve veritabanı **UTC** çalışır.
>
> **(3) "Gün" daima `Europe/Istanbul` takvim günüdür.** A-15'in "aynı gün"ü, B-7'nin
> "bugün"ü, A-14'ün takvim yılı ve X-1'in dönem sınırları bu tanımı kullanır. **Sunucunun
> bulunduğu makinenin dilimi hiçbir yerde belirleyici değildir.**
>
> **(4) Aralıklar yarı açıktır: `[başlangıç, bitiş)`.** Bitiş sınırı **dahil değildir**.
> Gerekçe: `23:59:59` hilesi milisaniye kaybeder ve **B-5'in çakışma yasağı sert kısıttır** —
> yarı açık aralıkta çakışma tanımı tek ve kesindir. Kullanıcıya gösterilen aralık
> ("1–31 Ağustos") **kapalı** okunur; çeviri UI'dadır.
>
> **(5) Nokta okuma günün sonunu okur.** `hesaplaDoktorBakiye(doktor, tarih?)` ve
> `hesaplaStok(urun, konum?, tarih?)` için `tarih` verildiğinde sonuç **o günün Istanbul günü
> sonu itibarıyladır** (`[.., tarih+1 gün)`). "31 Ağustos itibarıyla bakiye" 31 Ağustos
> hareketlerini **içerir**. X-1 §3'ün nokta/aralık ayrımı korunur.
>
> **(6) `new Date()` doğrudan çağrılmaz.** Gün ve yıl türeten okumalar tek modülden geçer:
> `bugun()` · `gunAraligi(tarih)` · `takvimYili(an)`. **Bu fonksiyonlar 11'li listeye
> girmez** — iş kuralı taşımazlar, dönüşüm yaparlar (K-6 `hesaplaButceBakiye()` deseni).
> *01.10.2026 — geri not: X-17 ile tek çağrı noktası listesi **12**'ye çıktı (`degistirDoktorSahibi()`); bu maddenin hükmü değişmedi.*
>
> **(7) İstemci tarafı kendi dilimini kullanmaz.** Tarih seçici ve gösterim
> `zaman.saatDilimi`'ne sabittir; tarayıcı dilimi **okunmaz**. Yurt dışından bağlanan bir
> kullanıcı aynı belgeyi farklı günde görürse **mutabakat ölür** ve sunucu/istemci render'ı
> ayrışır.
>
> **(8) Dışa aktarımda tarihler yerel takvim günüdür:** `YYYY-MM-DD`, Istanbul gününe göre;
> UTC damgası veya ofset **yazılmaz** (K-4 §2). **K-4 §(6)'da zorunludur** — dosya faturaya
> gidiyor ve VUK 7 gün sınırı takvim günü üzerinden işler.
>
> **(9) Süre sayımları takvim günüdür.** VUK 7 gün (K-4 §6-d) ve Yönetmelik 15 gün (K-6 §7)
> **iş günü değildir**; **tatil ve iş günü takvimi kalıcı kapsam dışıdır.** Sistem gün farkı
> hesaplar, **hukuki sonucu hesaplamaz** (B-7 §9 deseni).
>
> **(10) Ofset değişirse ne olur — bugünden yazılı.** Türkiye kış saatine dönerse **hiçbir
> kod değişmez**; işletim sistemi/IANA verisi güncellenir. **Geçmiş kayıtlar UTC olarak doğru
> kalır**, yalnız gösterimleri kayar. Ofset yerine dilim adı kullanmanın tek ve yeterli
> gerekçesi budur.
>
> **Kapsam dışı, kalıcı:** kullanıcı bazlı zaman dilimi · çoklu dilim · tarayıcı diliminden
> okuma · iş günü/tatil takvimi · çalışma saati kısıtı · UTC dışında saklama · dönem
> kapatma/kilitleme (X-1).

### 5.6 E-2 · Hesap yaşam döngüsü — karar metni *(09.09.2026)*

⚠️ **Bu madde şemaya dokunur.** Gerekçe B-7 ile aynı sınıftandır: alternatif, kimlik
doğrulamasız veya **yarım kurulmuş** bir erişim katmanıdır — ve **C-3 §7 kimlik doğrulamalı
erişimi teslim şartı saymıştır**, özellik değil.

**§0.7 bulgusu (teyit edilmeli):** KVKK Kişisel Veri Güvenliği Rehberi erişimin
sınırlandırılmasında dört yöntem sayıyor: parolaların kolay tahmin edilir olmaması,
**şifre girişi deneme sayısının sınırlandırılması**, yönetici yetkisinin yalnız ihtiyaç
hâlinde açılması ve **ilişiği kesilen çalışan için zaman kaybetmeksizin hesabın kapatılması**.
**İki çelişki bulgudur:** (a) rehber **periyodik parola değişimi** öneriyor, güncel güvenlik
pratiği zorunlu rotasyonun parola kalitesini **düşürdüğünü** söylüyor; (b) ikincil
kaynaklardaki *"her erişim loglanmalı, loglar en az bir yıl saklanmalı"* ifadesi **Kurul metni
değil, danışmanlık yorumudur** ve C-3 §4'ün *"görüntüleme/erişim logu kapsam dışı"* kararıyla
çelişir. **C-3 yürürlüktedir; E-2 onu değiştirmez.**

**Belirleyici kısıt:** Faz 1'de **e-posta yoktur** (D-1 kademe 1 Faz 2'dedir). Self-servis
parola sıfırlama **çalışan bir e-posta altyapısı varsayar**.

**Genel ERP prensibi:** Logo, Netsis ve Odoo'da desen ortaktır — **kayıt olma yoktur**,
**hesap silinmez** (log ve belge referansı ona bağlıdır), **en az bir yönetici kalmak
zorundadır**.

**Auth.js oturum stratejisi — D-2'yi doğrudan etkiliyor:** JWT'de rol ve aktiflik **token
içinde donar**; pasifleştirilen kullanıcı süre dolana kadar **çalışmaya devam eder**.
D-2 §3'ün kuralı burada da geçerli: *"yarım izolasyon, izolasyonsuzluktan pahalıdır."*

> **KARAR (E-2):** Sistem **kapalı hesap modelidir**: kayıt olunmaz, hesap açılır. Hesap
> **silinmez**, pasifleştirilir. Oturum **veritabanındadır**.
>
> **(1) Self-servis kayıt yoktur — kalıcı.** Kullanıcıyı yalnız `YONETICI` açar. Açma, rol
> değiştirme ve pasifleştirme **yönetimsel eylemdir**: yetki + zorunlu gerekçe + log;
> `OnayBlogu` **kullanılmaz** (§0.3 sınırı, B-7 §6 deseni).
>
> **(2) İlk kullanıcı kurulumda seed edilir, ekranla değil.** Devreye almada (K-8 §(1)) tek
> bir `YONETICI` hesabı **geçici parolayla** oluşturulur; ilk girişte parola değişimi
> **zorunludur** (`parola_degistirmeli = true`). **Kurulum sihirbazı ekranı yazılmaz** —
> hayatında bir kez çalışan, test edilmeyen ve internete açık bir ekrandır.
>
> **(3) Faz 1'de parola sıfırlama yöneticinin işidir.** `YONETICI` **geçici parola** atar;
> ilk girişte değişim zorunludur; işlem loglanır. **Self-servis e-posta ile sıfırlama Faz
> 2'dedir ve D-1 kademe 1'e bağımlıdır.**
> · **`YONETICI` kendi parolasını unutursa:** Sınıf 1 kurulumda (K-9 §B) sıfırlama **bizim
>   destek yolumuzdan**, yazılı talep üzerine yapılır ve loglanır. **Sınıf 2'de bu yol
>   yoktur** — teklifte **kapsam farkı** olarak yazılır (K-8 §(4)).
> · **Bu bir eksiklik değil, sıralamadır.**
>
> **(4) Oturum veritabanındadır.** Rol ve aktiflik **her istekte kaynaktan okunur**, token'da
> dondurulmaz. Gerekçe D-2 §3 ve KVKK rehberinin *"zaman kaybetmeksizin kapatma"* ifadesidir.
> · Config: **`auth.oturumHareketsizlikSaat` (`4`)** · **`auth.oturumMutlakSaat` (`12`)**.
>   **Belirlenir ve doldurulur**; kullanıcıya ayar ekranı açılmaz (A-15 §3 deseni).
> · Hareketsizlik süresi **kayar**, mutlak süre **kaymaz** — bir oturum **ertesi güne hiçbir
>   koşulda sarkmaz**.
> · **Gerekçe (09.09.2026):** 4 saat bir yarım mesaidir; öğle arasını, depoya inmeyi ve sahaya
>   çıkıp dönmeyi kapsar — kullanıcı gün içinde **hiç parola sormaz**. Akşam açık kalan ekran
>   ise gece yarısını göremeden kapanır.
>
> **(4-a) Ekran kilidi ürünün işi değildir.** Kullanıcı başındayken ekranı kilitlemek
> **işletim sisteminin** görevidir; devreye alma eğitiminde (K-8 §(1)) **10 dakikalık OS ekran
> kilidi** önerilir ve **teslim notuna yazılır**. Uygulama içinde ayrı kilit ekranı, PIN,
> inaktivite sayacı veya *"oturumunuz kapanmak üzere"* uyarısı **yazılmaz — kalıcı**.
> **Gerekçe (§0.9):** yanlış katmanda çözülen güvenlik önlemi güvenlik üretmez; kullanıcıyı
> kaçış yolu aramaya iter (§0.2 tahliye vanası, D-2 §8). *Günde altı kez parola giren kullanıcı
> parolayı basitleştirir veya hesabını açık bırakır.*
>
> **(4-b) Rol bazlı oturum süresi kapsam dışıdır.** Operasyonun bölündüğü daha büyük
> firmalarda değişen şey **rol dağılımıdır** (D-2), oturum uzunluğu değil. Süre **kurulum
> düzeyinde tektir**; ikinci müşteri farklı süre isterse **config değeri değişir, mekanizma
> değişmez**.
>
> **(5) Parola politikası asgaridir ve tek yerdedir.** Asgari uzunluk, yaygın parola reddi,
> `bcrypt`/`argon2` ile saklama. **Başarısız giriş denemesi sınırlanır** (KVKK rehberi);
> eşik aşılınca hesap **geçici olarak** kilitlenir. **Kalıcı kilit yoktur** — kalıcı kilit bir
> tahliye vanası sorunu doğurur (§0.2): kullanıcı başkasının hesabını kullanır ve **denetim izi
> bozulur** (D-2 §8).
> · **Zorunlu periyodik parola değişimi konmaz.** Gerekçe §0.7 (a) çelişkisidir; karar metninde
>   **yazılıdır ki denetimde "unutulmuş" sayılmasın**. Müşteri isterse config'e alınır, ayrı
>   kalem değildir.
>
> **(6) Kullanıcı silinmez, pasifleştirilir** (§0.2). `Kullanici.aktif = false`.
> · Pasifleştirme **açık oturumları anında sonlandırır**.
> · Geçmiş belgeler, `OnayBlogu` kayıtları ve log referansları **korunur**.
> · **C-3 §6'nın "belgesiz kayıt silinebilir" istisnası kullanıcıya uygulanmaz:** kullanıcı
>   hiç belge girmemiş olsa bile **log'a yazmıştır**.
> · Pasif `SATICI`'nın doktorları **elle** başka satıcıya atanır; **otomatik devir mekanizması
>   yoktur** (`kapsamliDoktorlariGetir()` deseni değişmez).
>   *→ 01.10.2026: seçim pasifleştirme formundadır, toplu yapılır — X-17 §(5).*
>
> **(7) İki sert kısıt** (§0.3 birinci kademe):
> · Sistemde **en az bir aktif `YONETICI`** kalmak zorundadır — son yönetici pasifleştirilemez,
>   rolü düşürülemez.
> · Kullanıcı **kendi hesabını pasifleştiremez ve kendi rolünü değiştiremez**.
>
> **(8) Giriş denemeleri container log'una yazılır, tabloya değil.** Yazılan: zaman, kullanıcı
> **kimliği** (adı değil), sonuç. **Veritabanında oturum/giriş geçmişi tablosu açılmaz**
> (X-3 §7, C-3 §4). **Görüntüleme/erişim logu kapsam dışı kalır.**
> · **15.09.2026 (X-9):** mevcut `LoginAttempt` tablosu bu maddenin kapsamındadır ve
>   **kaldırılır**. §(5)'in deneme sınırı §5.12'ye göre uygulanır.
>
> **(9) `Kullanici.son_giris_at` konmaz.** Kolon testi **üçüncü soruda** düşer: tüketicisi
> ancak "atıl hesap raporu" gibi bir mekanizmayla doğar, o mekanizma yoktur (§0.1, **onuncu
> uygulama**). **Pasifleştirme gerekçesi de kolon değildir — log'a yazılır** (C-3 §4).
>
> **(10) Çok faktörlü doğrulama ertelenmiştir, kalıcı kapsam dışı DEĞİLDİR.** Sınıf 1
> kurulumda hesap internete açıktır; talep gelirse Faz 2+'ta değerlendirilir. Bugün **hiçbir
> alan, hiçbir arayüz, hiçbir "yakında" etiketi konmaz** (K-10 §H-B/H-C deseni; §I-6 simetri
> kuralı).
>
> **(11) Teslim şartıdır, ayrı fiyatlanmaz** (C-3 §7, K-8 §(2), D-2 §7). Devreye almada
> yapılan iş: **ilk yönetici hesabının açılması ve kullanıcıların tanımlanması** (K-8 §(1)).
>
> **(12) Sözleşme bağı:** D-2 §8'in hesap paylaşımı yasağı bu maddenin gerekçesidir ve
> **yeni madde açılmaz** — teyit metni **on bir maddede kalır**.
>
> **Kapsam dışı, kalıcı:** self-servis kayıt · SSO/LDAP/sosyal giriş · kullanıcı davet akışı ·
> eşzamanlı oturum sınırı · IP/cihaz kısıtı · oturum geçmişi ekranı · kullanıcı profil/tercih
> ekranı · kurulum sihirbazı · uygulama içi ekran kilidi · görüntüleme ve erişim logu (C-3).
>
> **✅ Ek (20.10.2026 · ürün sahibi kararı) — kullanıcı yönetiminin açık dört noktası.**
> §(1), §(3) ve §(5) mekanizmayı koyar, değeri yazmaz; dört nokta 1B madde 4b öncesinde kapandı:
> · **Tek ekran: Kullanıcılar.** Satıcılar ekranı Kullanıcılar ekranı olur; `YONETICI` hesabı
>   açarken rolü (`SATICI` · `OPERASYON` · `YONETICI`) seçer. Rol **açılışta verilir, sonra
>   değişmez** — rol değişikliği ekranı Faz 1'de yoktur (X-17 §(5) notu). `OPERASYON` ekranı
>   D-2 17.10 ekindeki gibi salt okur ve yalnız satıcıları görür.
> · **Asgari parola uzunluğu 8 karakterdir**; karmaşıklık kuralı (büyük harf, rakam, sembol)
>   konmaz. Yaygın parola listesi koda gömülüdür; listedeki parola büyük/küçük harf farkı
>   gözetilmeden reddedilir.
> · **Yöneticinin verdiği her parola geçicidir:** hesap açılışında da sıfırlamada da
>   `parola_degistirmeli = true` olur — §(2)'nin ilk yönetici deseni bütün hesaplara uygulanır.
> · **Sıfırlama açık oturumları sonlandırır** — pasifleştirmeyle aynı transaction deseni (§(6)).

### 5.7 E-3 · Dosya eki — karar metni *(09.09.2026)*

**Çelişkinin kaynağı:** K-9 §A-3 *"yüklenen dosyalar ve yapılandırma yedeğe dahildir"* diyerek
**bir yeteneği varsaymıştı**, ama hiçbir madde o yeteneğe karar vermemişti. Dosyada "dosya"
geçen dört yerin **hiçbiri kalıcı yükleme değil**: D-6 import (veri yazılır, dosya değil) ·
K-7 geçiş dosyaları (sistemin dışında) · B-7 imha tutanağı (yalnız `harici_belge_no`) ·
K-4 dışa aktarım (çıktı).

> **Sonuç: varsayım yanlıştır, eksik bir karar yoktur.** K-9 §A-3 düzeltildi.

**§0.7 bağı — maddenin en güçlü gerekçesi:** C-3 §2 yazılı bir sınır koydu: *"Sistem özel
nitelikli kişisel veri tutmaz."* **Dosya eki bu sınırı kolonla değil, içerikle deler.**
Kullanıcı imha tutanağı yüklerken üzerinde **hasta adı** olan bir belgeyi de yükleyebilir.
**Sistem dosyanın içini hiçbir koşulda doğrulayamaz** — §0.1 doğrulanabilirlik testinin tam
tarifi. Fark şudur: `lot_no` yanlış dolduğunda **bir sayı** yanlış olur; dosya eki yanlış
dolduğunda **veri sorumlusunun sınıfı değişir** (KVKK md.6) ve kimse fark etmez. K-10 §H-F'nin
kuralının aynısı, ama burada ilişkiyi **kullanıcı sessizce** kurar.

**Tahliye vanası kontrolü — B-7'nin tersi çıktı (§0.2).** B-7'de cevap kötüydü: stok düzeltme
yolu olmayan kullanıcı **sahte sevkiyat** girip mali çekirdeği kirletiyordu. Burada cevap
zararsız: **tutanak dolapta durur, numarası `harici_belge_no`'ya yazılır, fotoğraf telefonda
kalır.** Hiçbir mali belge amacı dışında kullanılmaz.

**Genel ERP prensibi:** SAP (ArchiveLink/DMS), Logo (doküman yönetimi) ve Odoo'da
(`ir.attachment`) dosya eki **çekirdeğin parçası değil, ayrı bir alt sistemdir**: kendi
depolama katmanı, kendi yetki modeli, kendi saklama/imha politikası. **Yarım kurulmuş dosya
eki piyasada standart değildir**; standart olan ya **tam alt sistemdir** ya **hiç yoktur**.

> **KARAR (E-3):** Sistemde **kullanıcı tarafından yüklenen kalıcı dosya yoktur.** Faz 1'de
> dosya yükleme yalnız **D-6 import akışında** ve **geçici** olarak vardır.
>
> **(1) K-9 §A-3 düzeltilir** — bkz. §1.6 §A-3. *"Yüklenen dosyalar"* ifadesi çıkar.
>
> **(2) Import dosyası saklanmaz.** D-6 akışında yüklenen Excel bellekte/geçici dizinde
> işlenir, parti yazıldıktan sonra **silinir**. **Bu bir §0.2 ihlali değildir:** silinen şey
> muhasebe kaydı değil, **geçici girdidir** (C-3 §6 mantığı). Denetim izi **parti
> kaydındadır**, dosyada değil.
>
> **(3) Geçici yüklemede sert kısıtlar** (§0.3 birinci kademe): tek dosya · azami boyut ·
> yalnız beklenen tip (**uzantı ve içerik imzası**). Aşan istek **reddedilir**, `OnayBlogu`
> üretmez. Config `import.azamiDosyaBoyutMb` — **belirlenir ve doldurulur**.
>
> **(4) `ImportParti.dosya_adi` konur — salt kayıt alanı** (§0.3 dördüncü hâl).
> `varchar(255)`, nullable, **doğrulanmaz, hiçbir hesaba girmez, uyarı üretmez**. Kolon testi
> **ikinci soruda durur**: hangi partinin hangi dosyadan geldiği **sonradan üretilemez** ve
> mutabakatta bakan **insan gözü** için tek ipucudur. `harici_belge_no` ve `takip_no` ile aynı
> sınıftır. **Dosyanın kendisi saklanmadığı için ad tek başına anlamlıdır** — §0.1'in
> "mekanizmayla birlikte anlamlı" tuzağına düşmez.
>
> **(5) Dosya eki ertelenmiştir; kalıcı kapsam dışı DEĞİLDİR.** Talep gelirse **ayrı kalem**
> olarak fiyatlanır. Açıldığı gün üç şey **birlikte** gelir ve **bölünemez** (K-10 §H-A
> deseni): **depolama katmanı + yetki modeli + saklama/imha politikası**.
>
> **(6) Açılırsa fiyata ayrı bir KVKK uyum kalemi girer** (K-10 §H-F, C-3 §2). Gerekçe
> §0.7'dedir: dosya içeriği doğrulanamaz, dolayısıyla *"özel nitelikli veri tutmayız"* beyanı
> **teknik bir sınır olmaktan çıkıp sözleşme diline döner**. Bu, paketin fiyatını değil
> **sınıfını** değiştirir.
>
> **(7) Açılırsa dosyalar Türkiye'de durur** (K-9 §A-1, kalıcı) ve **yalnız Sınıf 1'de
> satılır** (K-9 §B). Yurt dışı nesne deposu **kalıcı kapsam dışıdır**.
>
> **(8) Bugün hiçbir dikiş yeri açılmaz.** Şemaya `dosya_url`, `ek_var_mi` benzeri **sigorta
> kolonu konmaz** (§0.1, **on birinci uygulama**); `modulAcikMi()`'ye kod eklenmez; UI'da
> **ataç ikonu, sürükle-bırak alanı veya "yakında" etiketi bulunmaz** (K-10 §H-C: *gösterilen
> özellik dâhil sayılır*).
>
> **(9) Satış dili — bugünden bağlayıcı.** *"Belgelerinizi sisteme yükleyebilirsiniz"*
> **denmez**. Denecek olan: *"Sistem tutanak ve belge numarasını kaydeder; belgenin kendisi
> sizin arşivinizde kalır."*
>
> **Kapsam dışı, kalıcı:** doküman yönetimi (versiyonlama, önizleme, tam metin arama, klasör) ·
> e-imza · OCR · virüs tarama altyapısı · dosyanın dışa aktarıma dahil edilmesi · kullanıcıya
> dosya indirme/paylaşma bağlantısı.

### 5.8 X-5 · Parasal tip, ölçek ve iskonto mimarisi — karar metni *(13.09.2026)*

**Çelişkinin kaynağı:** §4 "Sayısal tipler" satırı `Decimal` diyor; kod `BigInt` kuruş kullanıyor
ve RULE-10 bunu *"değişmez kural"* olarak yazmış. Fark bugüne kadar görünmedi çünkü **Faz 0'da
kod yazılmadı** — ilk migration'da görünecekti ve o noktada düzeltmesi **veri taşıma
migration'ıdır** (§0.1.a maliyet asimetrisi).

> ⚠️ **Elenen gerekçe — yazılı ki tekrar gündeme gelmesin.** *"BigInt küsuratı yönetemez"*
> **doğru değildir.** BigInt ölçeklenmiş tam sayıdır; kuruş yerine on-binde bir birimiyle
> saklanırsa aynı hassasiyeti verir. Sorun **tipte değil, kodun seçtiği ölçektedir.**
> Kararın gerekçesi aşağıdaki üçüdür, hassasiyet değil.

**Genel ERP prensibi:** SAP, Logo ve Odoo'da parasal alan veritabanı tarafında **ondalık
tiptedir** (`NUMERIC`/`DECIMAL`); ölçek şemada tanımlıdır. Tam sayı kuruş deseni ağırlıkla
**tek para birimli, tek ölçekli** uygulamalarda ve JavaScript float'ından kaçınmak için
kullanılır — ama ölçeği **koda emanet eder**.

> **KARAR:**
>
> **(1) Parasal alanlar `Decimal`dir. `BigInt` kuruş kullanılmaz.**
> · Birim fiyat: `Decimal(18,4)` · Tutar: `Decimal(18,2)` · Oran: `Decimal(5,2)`
> · §4 "Sayısal tipler" satırı **teyit edildi**; RULE-10'un *"tam sayı kuruş"* yarısı
>   **geçersizdir** (kanonik net yarısı geçerlidir — C-6 §3).
>
> **(2) Gerekçe — üç madde, hassasiyet değil:**
> · **Ölçek kodda değil şemada yaşar (§0.1 doğrulanabilirlik).** `BigInt`te ölçek bir
>   **konvansiyondur**: veritabanına bakan müşavir, denetçi veya ikinci geliştirici
>   `71400000` sayısının kuruş mu on-binde bir mi olduğunu **göremez**. Doğrulanamayan
>   alan patlamaz, **sessizce yanlış çalışır**.
> · **Veri artık dışarı çıkıyor.** K-4 §(6) ile ürettiğimiz satır entegratöre, oradan
>   faturaya gidiyor. `BigInt`te her çıkış noktası bir bölme doğurur; bölme noktası
>   çoğaldıkça C-6 §(5)'in *"yuvarlama yalnız tek noktada"* kuralı aşınır.
> · **C-2 veri setleri insan gözüne gidiyor.** Müşavir mutabakatında ham kolon okunabilir
>   olmalıdır (§0.3 dördüncü hâl deseni: tüketicisi insan gözü olan alan).
>
> **(3) 🔴 Değiş tokuş yazılıdır — Decimal'in kaybettirdiği tek şey.**
> `BigInt`te tip hatası **gürültülüdür**: `bigint` ile `number` karıştırılamaz, çalışma
> zamanı `TypeError` fırlatır. `Decimal` bir nesnedir; `+` ve `*` operatörleri **sessizce**
> string birleştirme veya `NaN` üretir, ve `Number(tutar)` yazan biri **float'a düşer,
> kimse fark etmez.** Yani bu karar, dosyanın en çok korktuğu hata sınıfını
> (**sessizce yanlış çalışan hesap**) tip sisteminden **koda taşır.** Telafisi (4) ve (5)'tir
> ve **teslim şartıdır, tercih değildir.**
>
> **(4) Ham aritmetik iki fonksiyonla sınırlıdır.** `Decimal` üzerinde toplama, çıkarma,
> çarpma, bölme yalnız **`hesaplaSatirTutarlari()` (C-6)** ve **`cozumleBirimFiyat()` (B-6/B-5)**
> içinde yapılır. Toplama işlemleri (Σ satır, Σ hareket) veritabanı tarafında `SUM()` ile
> alınır. Başka hiçbir dosyada parasal aritmetik bulunmaz.
>
> **(5) Lint kuralı teslim şartıdır.** `no-restricted-syntax` ile `Decimal` üzerinde
> `Number()`, `parseFloat()`, `+`, `*`, `-`, `/` **yasaklanır**; (4)'teki iki dosya istisnadır.
> Kural CI'da koşar (`npm run lint` zaten CI'da). **Kuralsız Decimal, BigInt'ten kötüdür.**
>
> **(6) Tek çıkış noktası: `formatla()`.** İstemciye giden her parasal değer **tek bir
> dönüşüm fonksiyonundan** geçer ve **`string` olarak** geçer. Gerekçe teknik ve kaçınılmazdır:
> `Decimal` nesnesi sunucu–istemci sınırında serileştirilemez. Bu fonksiyon (5)'in **tek
> meşru istisnasıdır**; başka yerde `toString()`/`toNumber()` çağrılması **kaçış yoludur**
> ve yasaktır. Fonksiyon **11'li tek çağrı noktası listesine girmez** — iş kuralı taşımaz,
> biçimlendirme yapar (E-1 §6 `bugun()` deseni).
> *01.10.2026 — geri not: X-17 ile tek çağrı noktası listesi **12**'ye çıktı (`degistirDoktorSahibi()`); bu maddenin hükmü değişmedi.*
>
> **(7) Yuvarlama modu yazılıdır ve belirsizlik bırakılmaz.** C-6 §(5) *"2 hane, yarım
> yukarı"* der; *"yarım"ın hangi yöne gittiği* negatif tutarda ayrışır. İki katlı çözüm:
> · **Mod:** yarım **sıfırdan uzağa** yuvarlanır (`decimal.js` `ROUND_HALF_UP`;
>   PostgreSQL `round()` ile aynı davranış). Mod **tek yerde**, `hesaplaSatirTutarlari()`
>   yapılandırmasında tanımlanır.
> · **Ve asıl koruma:** **satır düzeyinde yuvarlanan tutarlar daima pozitiftir.**
>   İşaret tutarın kendisinde değil, **cari hareket tipinde** taşınır (§0.2: kayıt
>   silinmez, **ters kayıtla** kapatılır). İade ve iptal **ayrı belgedir** (A-1, K-1);
>   kendi satırları pozitif hesaplanır, işareti hareket tipi verir.
>   *Böylece yuvarlama modu pratikte hiçbir yerde belirleyici olmaz — ama yazılıdır.*
>
> **(8) Miktar alanları tam sayıdır.** `OrderItem.miktar`, `Sevkiyat` miktarları,
> `StokDuzeltmeSatir.fark_miktar` (±) **tam sayı**dır; küsuratlı miktar **kalıcı kapsam
> dışıdır**. Gerekçe §0.1: küsuratlı miktarın bugün tüketicisi yok, mekanizması yok;
> gerektiğinde eklenir ve **geriye dönük üretilebilir**.
>
> ---
> ### İskonto mimarisi — A-10 ve Ü-3 §(10) revizyonu
>
> **Bulgu:** `Decimal(5,2)` ile **türetilen net fiyat, satıcının girdiği fiyatı tutmuyor.**
> Somut örnek: liste 1.000,00 · satıcı **873,45** giriyor · iskonto %12,655 →
> `Decimal(5,2)` ile **12,66** → geri türetilen fiyat **873,40**.
> **Satıcının doktora söylediği rakam ile sistemin cariye yazdığı rakam ayrışır.**
> Ü-3 §(8) tam bunu engellemek için yazılmıştı: *"yalnız matrah gösterilirse satıcı
> doktora eksik rakam söyler."*
>
> Kolon testi (§0.1.a) ikinci soruda durur: **satıcının girdiği net fiyat, yuvarlanmış
> orandan geriye dönük üretilemez.** → *"ŞİMDİ koy."*
>
> **(9) Satırda saklanan iki alan: `liste_fiyat` ve `birim_fiyat`.**
> · `OrderItem.liste_fiyat` — `Decimal(18,4)`, **daima `cozumleBirimFiyat()` çıktısı**
>   (bareme göre çözülmüş, B-6). Elle giriş bu alanı **değiştirmez**.
> · `OrderItem.birim_fiyat` — `Decimal(18,4)`, **satıcının girdiği net fiyat, aynen.**
>   Elle giriş yoksa `liste_fiyat` ile aynıdır.
>
> **(10) `iskonto_oran` veritabanında tutulmaz — türetilir.**
> `iskonto_oran = (liste_fiyat − birim_fiyat) / liste_fiyat`, **yalnız gösterim ve rapor
> anında** hesaplanır. **Kayıpsızdır**, çünkü girdilerinin ikisi de saklanıyor.
> · **A-10 revize edildi:** *"Satırda `liste_fiyat` ve `iskonto_oran` ayrı saklanır"* →
>   **`liste_fiyat` ve `birim_fiyat` saklanır, oran türetilir.**
> · **Ü-3 §(10) revize edildi:** *"girdiği net fiyattan `iskonto_oran` türetilir **ve
>   satırda saklanır**"* → **saklanmaz, gösterimde türetilir.**
> · **§4 etki tablosu** A-10 satırı buna göre düzeltildi.
>
> **(11) Değişmeyenler — teyit.**
> · **İskonto tavanı yoktur**; `pricing.iskontoTavani` `null` kalır (A-10).
> · **Liste üstü satış serbesttir** — artık ayrı bir işaret gerekmez: `birim_fiyat >
>   liste_fiyat` olduğunda türetilen oran **negatif çıkar**. Mekanizma sadeleşti.
> · **Sistem maliyet/geliş fiyatı tutmaz — kalıcı** (C-2 §4, Ü-3 §(10)); yalnız
>   **sapmayı** kaydeder ve satıcı bazında raporlar.
> · **Fiyat sipariş anında donar** (RULE-04, C-6 §2-a): `liste_fiyat`, `birim_fiyat` ve
>   `kdv_orani` satırda **değer olarak** durur.
>
> **(12) D-6 import etkisi.** Fiyat listesi import'u `liste_fiyat` ve baremi (`min_adet`)
> okur; **iskonto oranı sütunu yoktur** ve istenmez.
>
> **(13) Şemaya etki:** `OrderItem.iskonto_oran` **konmaz**, yerine `birim_fiyat` konur.
> **Kolon sayısı değişmez**, anlamı değişir. Tek çağrı noktası listesi **11'de kalır**.
> *01.10.2026 — geri not: X-17 ile tek çağrı noktası listesi **12**'ye çıktı (`degistirDoktorSahibi()`); bu maddenin hükmü değişmedi.*
>
> **Kapsam dışı, kalıcı:** çoklu ölçek · para birimi başına farklı ölçek (C-5: sistem
> tamamen TL) · küsuratlı miktar · belge düzeyinde iskonto satırı (C-6 kapsam dışı listesi) ·
> iskonto oranının şemada saklanması · iskonto tavanı mekanizması.
>
> **Kilitlenme anı:** **Faz 1 migration'ının yazımı.** Sonrası veri taşımadır.

---

### 5.9 X-6 · Kalem kapatma yasağı ve mahsubun tanımı — karar metni *(13.09.2026)*

**Çelişkinin kaynağı:** Üç karar aynı şeyi söylüyordu ama hiçbiri `PaymentAllocation`'ı
**adıyla** yasaklamamıştı: **A-7** *"Kalıcı kalem kapatma tablosu açılmaz"* · **K-2**
*"Ayrı avans kaydı tutulmaz; cari bakiye tek ve işaretli"* · **X-1 §(7)** *"hangi tahsilatın
hangi sevkiyatı kapattığı sistemde yoktur"*. Kod ise bu tablonun üstüne kurulu ve
`DUZELTME_BRIFI.md`'nin üç görevi (F-01, F-02, F-04) onu **düzeltmeye** çalışıyordu.

**Genel ERP prensibi:** Açık kalem kapatma (SAP *clearing*, Logo kapatma fişi) **muhasebe
çekirdeğinin** parçasıdır ve fatura + fiş üretimiyle birlikte anlam taşır. Bizde ikisi de
**kalıcı kapsam dışıdır** (C-1 §1, C-2 §1) — dolayısıyla kapatılacak bir kalem de yoktur.

> **KARAR:**
>
> **(1) `PaymentAllocation` kaldırılır — kalıcı.** Tahsilat ile sipariş/sevkiyat arasında
> **hiçbir eşleştirme kaydı tutulmaz.** A-7'nin yasağı bu maddeyle **adlandırılmıştır**.
>
> **(2) 🔴 Dinamik (runtime) FIFO de yasaktır.** Tabloyu kaldırıp aynı eşleştirmeyi
> **sorgu anında** yapmak, kalıcı eşleştirmenin **kaydedilmemiş hâlidir**: tablo gider,
> mekanizma kalır. Üç kurala birden çarpar:
> · **§0.4 ekran kuralı:** *"Her gün değişen, mutabakatı imkânsız hiçbir tutar ekranda
>   gösterilmez... gösterge sayı, karar verilen sayı hâline gelir."* Araya geriye tarihli
>   bir hareket veya bir iade girdiğinde **dünkü çıktı bugün başka olur** ve hiçbir kayıt
>   bunu açıklayamaz.
> · **§0.1 doğrulanabilirlik:** çıktının doğruluğu hiçbir koşulda kontrol edilemez —
>   karşılaştırılacak kayıt yoktur.
> · **X-1 §(7):** *"Tahminî bir sayı üretmek, üretmemekten kötüdür."*
>
> ⚠️ **A-15 ile karıştırılmamalıdır.** A-15 de hesabı saklamaz, ama orada üretilen şey
> **veridir** (tahsilat, tarih, `tip = NAKIT` — üçü de gerçek kayıt). Burada üretilecek
> olan **yorumdur**: hangi paranın hangi borcu kapattığı sistemde **hiç yoktur**.
>
> **(3) Tahsilat belgesi kalır, bağı kalkar.** `Tahsilat` (A-11) kendi alanlarıyla durur
> (`odeme_yontemi_id` zorunlu, komisyon ve valör kayda donar) ve cari hareket doğurur.
> Kalkan tek şey **sipariş/sevkiyat ile kurulan bağdır**.
>
> **(4) "Otomatik mahsup" bir mekanizma değil, aritmetiktir — K-2 netleştirmesi.**
> K-2 *"avans sonraki siparişte otomatik mahsup olur"* der. Bu cümle bir **sonucu**
> anlatır, bir **işlemi** değil: bakiye tek ve işaretlidir (Σborç − Σalacak); negatif
> bakiye varken yeni borç doğduğunda bakiye **kendiliğinden** azalır. **Mahsup eden bir
> kod, bir tablo veya bir iş yoktur.**
> *Bu cümle yazılmazsa birisi "otomatik mahsup"u bir özellik sanıp tabloyu geri getirir.*
>
> **(5) Yaşlandırma (FR-26) Faz 2+'ya taşındı.** X-1 zaten *"⚪ Faz 2+: alacak yaşlandırma /
> DSO — **ayrı rapordur**, oran değildir"* demişti; bu madde onu **Faz 1'den çıkarır**.
> Yeniden tanımı ve veri kaynağı o fazın konusudur.
>
> **(6) Faz 1'de vade görünürlüğü: tutar değil, varlık.**
> Doktor kartında ve tahsilat ekranında gösterilen iki şey vardır:
> · `hesaplaDoktorBakiye(doktor, tarih?)` çıktısı — **tek işaretli, brüt**, yön etiketiyle
>   (K-2, C-6 §6) ve **taban etiketiyle** (Ü-3 §6).
> · **Bilgi kademesi uyarısı** (§0.3, X-4 §(4) `BILGI` deseni): *"vadesi geçmiş hareket var"*
>   + **en eski vade tarihi**. Kural kodu **`VADESI_GECMIS_HAREKET`** (A-8 kural kodu
>   kataloğuna eklenir; `varchar` — §1.3 §B-7).
>
> **(7) 🔴 Vadesi geçmiş **tutar** gösterilmez — kalıcı.** *"X TL vadesi geçmiş"* demek,
> tahsilatı belgelere dağıtmayı gerektirir; dağıtım (1) ve (2) ile yasaklandı.
> Gösterilebilen şey **hareketin varlığı ve tarihidir**, tutarı değil.
> *Bu ayrım maddenin en kolay ihlal edilecek yeridir: ekranda bir sayı istemek doğaldır,
> ve o sayı ancak yasaklanan mekanizmayla üretilebilir.*
>
> **(8) Etkilenmeyenler — teyit.**
> · **A-12 risk hesabı değişmez:** risk = cari bakiye + `ONAYLI` sevk edilmemiş sipariş
>   tutarı; `hesaplaDoktorRisk()` eşleştirme kullanmaz.
> · **K-1 iptal akışı değişmez:** ters kayıt cari harekettedir, mahsup satırında değil.
> · **C-2 müşavir veri setleri değişmez:** tahsilat kırılımı, cari mutabakat ve dönem sonu
>   stok miktarı **eşleştirme içermez**.
>
> **(9) Görev etkisi — `DUZELTME_BRIFI.md`:**
> · **F-04 tamamen düşer.** TOCTOU açığı, açığın bulunduğu mekanizmayla birlikte gidiyor.
> · **F-01 görev olarak düşer, işi devredilir.** İptal edilen belgenin matrahtan çıkması
>   ayrı bir düzeltme değil, **sayılan belgeler filtresinin** işidir (A-5; §4: *"altı
>   dışlamayı birlikte taşır"*).
> · **F-02 küçülür:** dokuz yerdeki formül **tek** `hesaplaDoktorBakiye(doktor, tarih?)`
>   fonksiyonuna indirilir; *"açık alacak"* ikinci fonksiyonu **yazılmaz**.
> · **D-01 ve D-04 bulguları** (`DENETIM_BULGULARI.md`) bu kararla **konusuz kalır**.
>
> **(10) §1.1 K-1 redaksiyonu — X-1 kalıntısı temizlendi.** K-1 metni *"İptal; satıcı primi,
> **ciro/tahsilat oranı** ve kongre hakkedişi türevlerini ters kaydeder"* diyordu.
> **X-1 §(1)** tahsilat oranını **kalıcı olarak kaldırmıştı**; **K-6 §(2)** kongre türevini
> düşürmüştü. Doğru metin: *"İptal; **satıcı primi ve ciro** türevlerini ters kaydeder."*
>
> **Kapsam dışı, kalıcı:** kalem kapatma tablosu · runtime FIFO eşleştirme · manuel mahsup
> düzeltme ekranı · vadesi geçmiş **tutar** gösterimi · kısmî kapatma · ödeme planı ·
> mahsup iptali · Faz 1'de yaşlandırma kovaları.
>
> **Kilitlenme anı:** **Faz 1A söküm turu.** Tablo kaldırıldıktan sonra geri getirmek
> yeni bir karardır.
>
> **✅ Ek (20.10.2026 · ürün sahibi kararı) — §(6) uyarısının koşulu.** Eşleştirme olmadığı için
> (§(1)/(2)) hangi borç hareketinin açık kaldığı bilinemez; uyarının koşulu şöyle kapandı:
> · `VADESI_GECMIS_HAREKET` **yalnız cari borçluyken** gösterilir: `hesaplaDoktorBakiye()` yönü
>   `BORC` **ve** vadesi bugünden (İstanbul günü, E-1) önce olan en az bir `BORC` hareketi var.
>   Bakiye sıfır ya da alacaklıyken uyarı yoktur.
> · Gösterilen tarih **vadesi geçmiş `BORC` hareketlerinin en eski vadesidir.** Bu tarih o borcun
>   hâlâ açık olduğunu söylemez; uyarı metni bunu yazar (§0.4: yokluğu/varlığı yanlış okunmasın).
> · Tutar gösterilmez — §(7) aynen geçerlidir.

---

### 5.10 X-7 · Kabul kriterleri ve izlenebilirlik mimarisi — karar metni *(13.09.2026)*

**Çelişkinin kaynağı:** `TRACEABILITY.md` ve `DUZELTME_BRIFI.md`'nin kaynağı `PRD_V2.md`
v2.2'dir. Belge uyum denetimi (13.09.2026) PRD'nin **22 FR ve 7 RULE** maddesinin KARARLAR
ile çeliştiğini gösterdi — matrisin **%30'undan fazlası**. Bir belge tek kaynakla
çelişiyorsa **kaynak olamaz**.

**İkinci bulgu — üç numara evreni.** `FR-*` (PRD) · `Ü-*` (yol haritası **ve** KARARLAR) ·
`C-*` (canlıya alma **ve** KARARLAR). Her turda ayrı bir *"numara çakışması notu"* yazılıyordu
(`YOL_HARITASI.md` §4.2 ve §5). Not yazmak çözüm değil, **semptomdur**.

> **KARAR:**
>
> **(1) `PRD_V2.md` arşivlenir** — `UYGULAMA_PLANI.md` ile aynı statü (📦 arşiv, işi bitti).
> Referans olarak **anılmaz**, atıf **yapılmaz**.
>
> **(2) Arşivden önce tarama zorunludur — çıkış kalemi.** 71 FR ve 15 RULE tek tek geçilir;
> her biri için tek soru: *"bu KARARLAR'da bir maddeye bağlandı mı?"* **§A geri çekme listesi
> 22'sini kapsıyor; kalan 49'un tamamının KARARLAR'da karşılığı olduğu VARSAYILMAZ.**
> Karşılığı çıkmayan madde bir **eksik karardır** ve §0 çerçevesine göre karara bağlanır.
> Taramanın sonucu **§6 çıkış listesine işaretlenir**.
>
> **(3) Yeni dosya `KABUL_KRITERLERI.md`'dir ve PRD değildir.** Fark önemlidir:
> · **PRD** *"ne istiyoruz"* der → **karar verir** → KARARLAR ile **çelişebilir**.
> · **Kabul kriteri** *"nasıl doğrularız"* der → **karar vermez** → çelişemez.
> Dosya **gerekçe, tartışma, alternatif ve mevzuat notu içermez** — bunların yeri KARARLAR'dır.
> Yalnız **test edilebilir davranış cümleleri** taşır.
>
> **(4) Numaralandırma karar kimliğinden türer.** Biçim: `<karar-kodu>-<sıra>` —
> `A-3-1`, `C-6-2`, `X-1-4`. Karar çerçevesinden doğan kriterler `§0.2-1` biçimindedir.
> **`FR-*` numaralandırması terk edilir.**
> · **Her kriterin tek bir sahibi vardır.** Birden çok karara dayanıyor görünüyorsa,
>   davranışı **doğuran** karar sahiptir; diğerleri satır içinde anılır. *Tek kaynak
>   disiplininin kriter düzeyindeki karşılığıdır.*
> · Yan fayda: numara çakışması notları **konusuz kalır**.
>
> **(5) `TRACEABILITY.md` "kod × test × **karar**" matrisine dönüşür.** Kolonlar:
> kriter kodu · davranış · kod yeri · kanıtlayan test · durum (KANITLI/TESTSIZ/YOK) ·
> **kaynak karar**. Böylece *"bu satırın hedefte karşılığı var mı"* sorusu **matrisin
> içinden** cevaplanır — 13.09'da §6.4'ün elle yazılmasını gerektiren boşluk kapanır.
>
> **(6) Yazım zamanlaması.** İskelet **Faz 1A**'da kurulur (kriter kodları ve boş satırlar);
> her kriterin metni, ilgili işi yapan **Faz 1B görevinde** yazılır — testten **önce**.
> *Gerekçe `DUZELTME_BRIFI.md` çalışma disiplinidir: önce testi yaz, kırmızı olduğunu gör.
> Kriterini yazmadan testini yazamazsın.*
>
> **(7) Bakım kuralı.** Yeni karar → KARARLAR'a yazılır → **aynı turda** kabul kriteri
> türetilir. Kriteri olmayan karar **doğrulanamaz karardır**; kararı olmayan kriter
> **kaynaksızdır** ve silinir.
>
> **Kapsam dışı, kalıcı:** PRD'nin revize edilerek sürdürülmesi · `FR-*` numaralandırması ·
> kabul kriterlerinde gerekçe/mevzuat metni · kriterlerin KARARLAR'dan bağımsız
> numaralandırılması · üçüncü bir gereksinim kaynağı.
>
> **Kilitlenme anı:** **`TRACEABILITY.md`'nin Faz 1 sonunda yeniden koşulması.**

---

### 5.11 X-8 · Bayinin veri modeli — karar metni *(15.09.2026)*

**Çelişkinin kaynağı:** Üç madde bayiyi üç farklı biçimde anlatıyordu. D-2 §(6) *"bayi bir cari
tipidir"* diyor ve bayi işlemlerini bugünkü `recordDealerPayment`'a bağlıyor. A-9 cari hesap
sahibini **tek tip** (`Doktor`) sayıyor. A-13 `cari_tip` ise yalnız `TUZEL_KISI`/`GERCEK_KISI`
taşıyor — bayi değeri yok. Kodda bayi beş ayrı tabloda (`Dealer`, `DealerPrice`,
`DealerShipment`, `DealerShipmentItem`, `DealerPayment`) ve ayrı bir cari fonksiyonunda
(`dealer-cari.ts`) yaşıyor. `FAZ1_UYGULAMA_KAPSAMI.md` §D.1 C5 bayi yönetim ekranlarını söküm
listesine almıştı; X-2 ise 1B'de o ekranların dosyasına bakıyordu.

> **KARAR (X-8):** **Bayi ayrı bir tablo değildir; `Doktor` (cari) tablosunun bir satırıdır.**
>
> **(1) Ayrım `hesap_sinifi` ile yapılır.** Yeni çekirdek enum `HesapSinifi`: `DOKTOR` · `BAYI`
> (kodda kapalı katalog — §1.3 madde 3). `Doktor.hesap_sinifi` **NOT NULL**; **DB varsayılanı
> konmaz**, değeri kaydı açan akış belirler. `cari_tip` (A-13) **ayrı bir eksendir** ve
> tüzel/gerçek kişi ayrımını taşımaya devam eder.
> *→ 01.10.2026: `hesap_sinifi` cari açıldıktan sonra değişmez; `BAYI` satırında sahip boştur (DB `CHECK`) — X-17 §(2).*
>
> **(2) `Dealer*` tabloları kalkar — kalıcı.** Canlı veri olmadığı için taşıma yoktur (ADR-002).
> Bayi için ayrı tablo, ayrı cari fonksiyonu veya ayrı bakiye formülü **yazılmaz**; bakiye tek
> `hesaplaDoktorBakiye()`'dir (K-2).
>
> **(3) Bayiye satıcı atanmaz; bayi sevkiyatından prim doğmaz.** Satıcı sahipliği (RULE-02,
> `kapsamliDoktorlariGetir()`) yalnız `DOKTOR` sınıfına uygulanır. Hakediş satıcı–cari
> sahipliğinden doğduğu için (X-1 §(7)) `BAYI` sevkiyatı **prim matrahına girmez**. *Bu, bugünkü
> davranışın (RULE-15: bayi prime dokunmaz) korunmasıdır.* `SATICI` `BAYI` sınıfında cari
> **açamaz ve göremez**.
>
> **(4) Bayi işlemleri genel belge akışlarıdır.** Bayi siparişi `SIP`, sevkiyatı `SVK`, iadesi
> `IAD`, tahsilatı `THS` — doktorunkiyle aynı belgeler, aynı `uretBelgeNo()`, aynı sayılan
> belgeler filtresi. **Ayrı bayi sevkiyat talebi mekanizması yoktur;** onaysız talebin karşılığı
> `Siparis.asama` teklif aşamasıdır (A-5). Bayi deposu `StokKonum` satırıdır (§1.3 bayi kanalı notu).
>
> **(5) Yönetim ekranı tektir.** Faz 1B'de bayiler **cari ekranlarından** yönetilir; liste
> `hesap_sinifi` ile süzülür. Hangi rolün `BAYI` açabileceği D-2 ekran matrisinde yazılır;
> `SATICI` açamaz.
>
> **(6) İçeri ve dışarı akan veride kolon.** Doktor listesi veri seti (K-4), doktor import'u
> (D-6) ve geçiş şablonu (K-7) **`hesap_sinifi` kolonunu taşır**. Import'ta kolon **zorunludur**;
> boş satır reddedilir (§(1): varsayılan yok).
> *13.10.2026 — geri not: şablon ve doğrulama tek tanımdan türer (X-16).*
>
> **(7) X-2'nin konusu değişti.** `recordDealerPayment` Faz 1A'da sökülür. X-2'nin BLOCKER
> ilkesi — ödeme kaydı ve `uretBelgeNo()` **aynı transaction'da** — artık **bütün tahsilatlar**
> için A-14 kabul kriteridir ve 1B madde 2'de doğrulanır. *Hata, bulunduğu kodla birlikte gider;
> ilke gitmez.*
>
> **(8) Bayi paneli kararı değişmez** (D-2 §(6)): Faz 3+ opsiyonel modül; panel geldiğinde
> `BAYI` satırına **nullable `Kullanici`** bağlanır.
>
> **(9) Fiyat açık kalır.** Bayiye özel fiyat bugün `DealerPrice`'ta ve bu tablo kalkıyor.
> Fiyatın cariye nasıl bağlanacağı **X-10**'dur ve `CM`'den önce kapanır. *(→ 15.09.2026'da kapandı, §5.13: cariye atanan liste.)*
>
> **Kapsam dışı, kalıcı:** bayi için ayrı cari tablosu · bayiye özel bakiye formülü ·
> bayi–satıcı sahipliği.
>
> **Şemaya etki:** bir enum + bir kolon eklenir, beş tablo çıkar.
> **Geri çekme:** `FAZ1_UYGULAMA_KAPSAMI.md` §A **GÇ-6 genişler**.

### 5.12 X-9 · Giriş denemesi sayacı — karar metni *(15.09.2026)*

**Çelişkinin kaynağı:** E-2 §(5) başarısız giriş denemesinin **sınırlanmasını** ve eşik aşılınca
hesabın **geçici olarak kilitlenmesini** istiyor. E-2 §(8) ise giriş denemelerinin **tabloya
değil container log'una** yazılmasını ve **giriş geçmişi tablosu açılmamasını** söylüyor. Kodda
deneme sınırı bir tabloyla (`LoginAttempt`) uygulanıyor ve bu tablo geri çekme listesinde yoktu.

> **KARAR (X-9):** **E-2 §(8) harfiyen uygulanır.**
>
> **(1) `LoginAttempt` tablosu kaldırılır.** Giriş denemesi tutan hiçbir tablo açılmaz — sayaç
> amaçlı olsa bile.
>
> **(2) Deneme sınırı bellek içi sayaçla uygulanır.** Mekanizma **ADR-004**'tedir. Sayacın
> anahtarı ve eşikleri **bugünkü koddakiyle aynıdır**; değerler `policy.ts`'e taşınır:
> **`auth.girisDenemeSiniri`** · **`auth.girisKilitDakika`**. *Değer bugünkü koddan okunur ve
> doldurulur (Faz 1A, C7b).*
>
> **(3) Kabul edilen sınırlar** — yazılıdır ki denetimde *"unutulmuş"* sayılmasın:
> · Uygulama süreci yeniden başlarsa sayaçlar ve geçici kilitler **sıfırlanır**.
> · Sayaç **tek süreç** varsayar. Varsayım K-9'un kapsam dışı listesine dayanır (replika,
>   otomatik ölçekleme, Kubernetes yok).
>
> **(4) Tetikleyici:** Aynı kurulumda **birden fazla uygulama süreci** çalıştırılacağı gün bu
> karar yeniden açılır. Paylaşılan sayaç **yeni bir karar ve yeni bir ADR'dir**; E-2 §(8)
> değişmedikçe tablo açılmaz.
>
> **(5) Log tarafı değişmez** (E-2 §(8)): zaman, kullanıcı **kimliği**, sonuç. Kişisel veri
> log'a yazılmaz (X-3).
>
> **Şemaya etki:** bir tablo çıkar. **Geri çekme:** yeni kalem **GÇ-14**.

### 5.13 X-10 · Fiyat listesinin cariye bağlanışı — karar metni *(15.09.2026)*

**Boşluğun kaynağı:** B-5 fiyat seçimini tek noktaya bağladı —
`cozumleBirimFiyat(urun, liste, miktar, tarih)` — ama **`liste`nin nereden geldiğini** yazmadı.
`FiyatListesiSatir` §4'te kolonlarıyla anılıyor, `FiyatListesi` ve `FiyatListesiSatir` ise
*"yeni tablolar"* sayımında yoktu. Bugünkü kodda karşılıkları da yok: doktor fiyatı
`Product.netListPrice` kolonunda, bayi fiyatı `DealerPrice` tablosunda. X-8 ikincisini
kaldırınca bayiye özel fiyatın yeri tanımsız kaldı.

> **KARAR (X-10):** **Fiyat listesi cariye atanır.** *(Değerlendirilen (b) — tek liste, bayi
> fiyatı satırda elle — reddedildi: RULE-06'yı düşürür ve bayi fiyat disiplinini kullanıcıya
> bırakır.)*
>
> **(1) İki yeni çekirdek tablo.** `FiyatListesi` (başlık: `kod` **UNIQUE**, ad, aktiflik) ve
> `FiyatListesiSatir` (`fiyat_listesi_id`, `urun_id`, `liste_fiyat`, `min_adet`,
> `gecerli_baslangic`, `gecerli_bitis`). B-5'in tarih çakışması yasağı **aynı liste, aynı ürün,
> aynı `min_adet`** için DB düzeyinde uygulanır. Faz 1 tablo sayısı **11 → 13**.
>
> **(2) Atama cari kartındadır.** `Doktor.fiyat_listesi_id` **nullable**. Boşsa **varsayılan
> liste** kullanılır. Varsayılan liste **kodla** seçilir: `pricing.varsayilanFiyatListesiKodu`
> (`tax.varsayilanVergiOraniKodu` ile aynı desen); seed bu kodla bir liste açar. `hesap_sinifi`
> (X-8) atamayı **zorunlu kılmaz** — bayi de doktor da varsayılanla çalışabilir.
>
> **(3) Seçim tek noktadandır ve sessiz düşüş yoktur.** `cozumleBirimFiyat()` önce carinin
> atanmış listesine, atanmamışsa varsayılan listeye bakar. **Atanmış listede ürünün geçerli
> satırı yoksa varsayılan listeye düşülmez** → X-4 `SERT` *"fiyat çözümlenemedi"*, satır
> kaydedilemez (B-5). **RULE-06 bu biçimde yaşar** ve artık bütün carilere uygulanır.
>
> **(4) Elle fiyat girişi değişmez.** Ü-3 §(10) ve A-10 aynen geçerlidir: satıcı `birim_fiyat`'ı
> elle girebilir, **tavan yoktur**. Liste yalnız **`liste_fiyat`'ın kaynağıdır** (X-5 §(9)); oran
> ona göre türetilir. *Listenin sağladığı koruma şudur:* listede olmayan ürün satıra girmez ve
> iskonto doğru listeye göre ölçülür. **Elle girilen fiyatın kendisini sınırlamaz.**
>
> **(5) `Product.netListPrice` kalkar.** Ürünün liste fiyatı **varsayılan listenin satırıdır**;
> ürün tablosunda fiyat kolonu kalmaz (**GÇ-15**). Çözümlenen fiyat satıra **dondurulur**
> (B-6, RULE-04) — liste sonradan değişse de eski satır değişmez.
>
> **(6) Yetki ve iz.** Liste satırı yazmak ve cariye liste atamak **fiyat tanımıdır** → yalnız
> `YONETICI` (D-2: `OPERASYON` fiyat tanımı yapamaz). İkisi de **denetim kaydına** yazılır
> (RULE-13).
>
> **(7) Ekran sınırı.** Faz 1'de liste başlığı, satırları (fiyat, `min_adet`) ve cari kartında
> atama ekranı vardır. **Tarih alanlarının ekranı Faz 2'dir** (B-5); Faz 1'de tarih alanları
> boş (süresiz) kalabilir. Toplu giriş D-6 import'uyla yapılır; import satırı **liste kodunu**
> taşır.
>
> **(8) Modül sınırı değişmez** (§1.3): modül fiyata dokunamaz; bayi paneli (Faz 3+) listeyi
> yalnız **okur**.
>
> **Kapsam dışı, kalıcı:** listeler arası kalıtım/katmanlama · bir cariye birden fazla aktif
> liste · atanmış listede bulunmayan ürün için sessiz geri düşüş.
>
> **Şemaya etki:** iki tablo + bir FK kolonu eklenir, bir kolon çıkar.
> **Geri çekme:** yeni kalem **GÇ-15**.

---


### 5.14 X-11 · Cari hareket tablosu — karar metni *(16.09.2026)*

**Boşluğun kaynağı:** Bu kitap `CariHareket`'i dört yerde anıyor. `CariHareket.vade_tarihi` kolonu (A-7, E-1), `ACILIS` / `VADE_FARKI`
hareket tipleri (A-6, A-7), *"tahsilat … cari hareket doğurur"* kuralı (X-6 §(3)) ve işaretin hareket
tipinde taşınması (X-5 §(7)). Ama §4'ün ne 13 yeni tablosunda ne 4 yeni belgesinde vardı.
Bugünkü şemada da karşılığı yok: cari, `Order` ve `DoctorPayment` üzerinden hesaplanıyor.
`ACL` ve `VDF` belgelerinin yeri tanımsızdı.

> **KARAR (X-11):** **`CariHareket` yeni çekirdek tablodur.** *(Değerlendirilen (b) — tablo yok,
> bakiye belgelerin toplamı, `ACL`/`VDF` için ayrı belge tabloları — reddedildi.)*
>
> **Gerekçe (Veysel, 16.09.2026):** Bu kitap `CariHareket`'in varlığını temel bir doğru olarak
> kabul ediyor. `CariHareket.vade_tarihi` kolonu ile `ACILIS` ve `VADE_FARKI` hareket tipleri
> zaten karara bağlanmış durumda. Tablonun şema sayımında unutulması bir **dokümantasyon
> hatasıdır**; `CM` commit'inde yer alır.
>
> **(1) Borç veya alacak doğuran her olay tek satır yazar.** Kaynaklar sevkiyat (`SVK`), iade
> (`IAD`), tahsilat (`THS`), açılış (`ACL`), vade farkı (`VDF`) ve ters kayıttır. Satır kaynak
> belgenin numarasını taşır.
>
> **(2) `ACL` ve `VDF` bu tablonun kendi kayıtlarıdır**; ayrı belge tablosu açılmaz. Numaralarını
> `uretBelgeNo()`'dan alırlar (A-6, A-7, A-14) ve `belge_no` + `guncelleme_tarihi` taşırlar (K-4).
>
> **(3) Tutar pozitiftir; yön ayrı taşınır** (X-5 §(7)). Tutar KDV dahil toplamdır (C-6 §(6)).
> Borç doğuran belgede hareket anında `hesaplaSatirTutarlari()` ile üretilir ve satıra yazılır.
> *C-6 §(7): "doğru olan cari harekettir".* KDV ayrıca saklanmaz (C-6 §(3)).
> *24.09.2026 — geri not: bu kuralın açılış bakiyesi import'undaki karşılığı `yon` sütunu ve `TUTAR_NEGATIF` reddidir (D-6 eki).*
>
> **(4) `vade_tarihi` (`date`) bu tablodadır** (A-7, E-1). Borç doğuran harekette dolar; vade
> sevkiyat tarihinden işler. Siparişte yalnız gün sayısı (`odeme_vadesi_gun`) durur.
>
> **(5) Belge ve hareket aynı transaction'da yazılır** (X-3 sessiz hata yasağı; X-8 §(7) deseni).
> Hareketin **tutarı, yönü ve tipi** sonradan değişmez; düzeltme **ters harekettir** (§0.2).
> *`vade_tarihi`'nin sonradan değişip değişemeyeceği X-15'in konusudur.*
>
> **(6) Değişmeyenler — teyit:**
> - Bakiye kolonu yoktur, bakiye hareketlerin toplamıdır (RULE-08, K-2).
> - Hareketler birbirine eşleştirilmez (X-6 §(1)/(2)).
> - `hesaplaDoktorBakiye(doktor, tarih?)` bu tablodan okur.
> - Cari hareket veri seti (K-4 §2) bu tablodur.
> - Prim ve ciro sorgularında `ACILIS` ve `VADE_FARKI` sayılan belgeler filtresiyle dışlanır.
>
> ---
> **✅ Katalog kaydı — tip ve yön** *(10.10.2026: 🟦 varsayılan kaydından iç karara yeniden sınıflandırıldı — §0.6 (2))* *(normatif ad — `docs/adr/ADR-001`; §1.3 çekirdek katalog)*
>
> | Alan | İçerik |
> |---|---|
> | **Karar** | **`yon`:** `BORC` · `ALACAK` — A-11 `Tahsilat.yon` deseni. **`tip`** ve yönü: `SEVKIYAT` → borç · `IADE` → alacak · `TAHSILAT` → yönü tahsilattan (A-11) · `ACILIS` → iki yön de olabilir, avanslı açılış alacaktır · `VADE_FARKI` → borç · `TERS_KAYIT` → çevirdiği satırın tersi; o satıra bağ taşır. Katalog kodda kapalıdır |
> | **Katman** | Şema (enum değerleri) |
> | **Durum** | ✅ **iç karar** — cevabı müşteride olan bir soru değildir. Kilitlenme anı yoktur; katalog değişikliği yeni karar ve migration ister. *~~`CM` commit'i — o güne kadar itiraz yoksa ✅ sayılır~~ (09.10.2026: §0.6'nın otomatik ✅ kuralı kaldırıldı)* |
>
> **Kapsam dışı, kalıcı:** hareketler arası eşleştirme · bakiye kolonu · hareket satırının silinmesi.
>
> **Şemaya etki:** bir tablo eklenir (**13 → 14**).
> **Geri çekme:** yeni kalem yok. Bugünkü cari hesabı (`Order` + `DoctorPayment`) F-02 ile tek
> fonksiyona iner (1B). Siparişteki vade tarihi → **GÇ-19**.

### 5.15 X-12 · İçe aktarım partisi tablosu — karar metni *(16.09.2026)*

**Boşluğun kaynağı:** D-6 her import'un **parti numarası** taşıdığını ve **geri alınabildiğini**
yazıyor. E-3 §(4) de `ImportParti.dosya_adi` kolonunu koyuyor. Ama `ImportParti` §4'ün
*"yeni tablolar"* sayımında yoktu; X-10'daki desenin aynısı.

> **KARAR (X-12):** **`ImportParti` yeni çekirdek tablodur.** *(Değerlendirilen (b) — tablo yok,
> kayıtlar yalnız parti numarası taşır — reddedildi: E-3 §(4)'ü geri almayı gerektirirdi.)*
>
> **Gerekçe (Veysel, 16.09.2026):** E-3 §(4) `ImportParti.dosya_adi`'yi **salt kayıt alanı** olarak
> açıkça tanımlıyor: hiçbir hesaba girmeyen, uyarı üretmeyen bir denetim izi. Tablo ve kolon,
> dosyanın kendisi silinse bile hangi verinin hangi dosyadan geldiğini geçmişe dönük mutabakatta
> bulabilmek için şarttır. E-3'ü geri almak yerine bu küçük tabloyu migration'a almak kararlarla
> tam uyumludur.
>
> **(1) Her import bir parti satırı yazar.** Satır şunları taşır:
> - parti numarası
> - veri türü
> - içe aktaran kullanıcı
> - zaman (`timestamptz` — E-1)
> - `dosya_adi` (`varchar(255)`, nullable, doğrulanmaz — E-3 §(4))
> - geri alındıysa geri alma zamanı, kişisi ve gerekçesi
>
> *Satır sayısı saklanmaz* — partiye bağlı kayıtlardan türer (§0.1).
>
> **(2) İçe aktarılan kayıt partisini taşır** (nullable FK). Bu tablolar: `Doktor` (cari import'u —
> `hesap_sinifi` zorunlu, X-8 §(6)), `Urun`, `FiyatListesiSatir`, `CariHareket` (`ACILIS`, X-11) ve
> `StockMovement` (açılış stoğu, B-4). Elle girilen kayıtta alan boştur.
>
> **(3) Geri alma D-6'daki gibidir; koşulu C-3 §(6)'dır:**
> - Partiye bağlı kayıtlar başka hiçbir belgeye bağlı olmamalıdır.
>   *13.10.2026 — geri not: koşul partinin **tamamına** bakar; kısmi geri alma yoktur (X-16 §(10)).*
> - Geri almayı yalnız yönetici yapar, gerekçe zorunludur, işlem loglanır.
> - **Açılış stoğu partisi geri alınmaz**; hata `DZL` ile düzeltilir (D-6, B-7).
>   *13.10.2026 — geri not: **açılış bakiyesi partisi de geri alınmaz**; hata `TERS_KAYIT` ile
>   düzeltilir (X-16 §(10); `ACL` numaralı kayıttır, A-14 §(6)/(8)).*
>
> **(4) Dosya saklanmaz** (E-3 §(2)).
>
> ---
> **✅ Katalog kaydı — veri türü** *(10.10.2026: 🟦 varsayılan kaydından iç karara yeniden sınıflandırıldı — §0.6 (2))* *(normatif ad — `docs/adr/ADR-001`)*
>
> | Alan | İçerik |
> |---|---|
> | **Karar** | `CARI` · `URUN` · `FIYAT_LISTESI` · `ACILIS_BAKIYESI` · `ACILIS_STOGU` — D-6 kapsamının birebir karşılığı; kodda kapalı |
> | **Katman** | Şema (enum değerleri) |
> | **Durum** | ✅ **iç karar** — kilitlenme anı yoktur; katalog değişikliği yeni karar ve migration ister. *~~`CM` commit'i~~ (10.10.2026)* |
>
> **Şemaya etki:** bir tablo (**14 → 15**) + beş tabloya nullable FK.
> **Geri çekme:** yok — bugün import kodu yok.


### 5.16 X-13 · Satıcı–doktor sahipliği — karar metni *(16.09.2026)*

**Boşluğun kaynağı (PRD taraması — FR-03…FR-08):** Sahiplik bu kitapta vardı: RULE-02, X-8 §(3) ve
X-1 §(7). Ama görünürlüğü, atanması, devri ve pasif satıcı durumu yazılı değildi. D-2 §(3)
*"Faz 1'de herkesi döndürür"* diyordu. Bugünkü kod ve PRD FR-05 (*zorunlu*) ise izolasyon uyguluyordu.

> **KARAR (X-13):** **Satıcı–doktor sahipliği Faz 1'de tam uygulanır; satıcı yalnız kendi
> doktorlarını görür.** *(Değerlendirilen (b) — D-2 §(3) aynen, okuma serbest — reddedildi.)*
>
> **(1) Görünürlük.** `kapsamliDoktorlariGetir(kullanici)` `SATICI`'ya yalnız **sahibi olduğu
> `DOKTOR` carilerini** döndürür. `YONETICI` ve `OPERASYON` hepsini görür. Süzme **sorgudadır**;
> ekranda gizleme yasağı ve tek fonksiyon kuralı aynen geçerlidir (D-2 §(3), redakte). `SATICI`
> `BAYI` göremez (X-8 §(3)).
>
> **(2) Atama.** `SATICI`'nın açtığı doktorun sahibi kendisidir. `YONETICI` doktor açarken sahip
> seçebilir ya da boş bırakabilir.
> *13.10.2026 — geri not: import'ta da aynı kural geçerlidir (X-17 §(7), X-16 §(5)).*
>
> **(3) Sipariş.** `SATICI` yalnız sahibi olduğu doktora sipariş girer. **Sahipsiz doktora kimse
> sipariş giremez.** Siparişin satıcısı **sipariş anındaki sahiptir** ve sonradan değişmez;
> siparişi `OPERASYON` ya da `YONETICI` girse de değişmez. `BAYI` siparişinde satıcı alanı **boştur**
> (X-8 §(3)) — alan bu yüzden nullable'dır.
>
> **(4) Hakediş siparişin satıcısına yazılır** (X-1 §(7)). Devir geçmiş siparişleri ve onların
> sonraki sevkiyatlarını **taşımaz**. Geçmiş dönem raporu devirden etkilenmez (X-1 §(6)).
>
> **(5) Devir** yalnız `YONETICI` işidir; gerekçe zorunludur. Her devir **iz tablosuna** yazılır:
> eski ve yeni sahip, kişi, zaman, gerekçe. Bugünkü devir tablosu kalır (ad eşlemesi `docs/adr/ADR-001`).
> Devir **loglanır** (RULE-13).
>
> **(6) Pasif satıcı.** Satıcı pasifleştirilince (E-2) doktorları **sahipsiz** kalır; yeniden
> atanana kadar onlara sipariş girilmez. Açık siparişlerin satıcısı değişmez.
> *→ 01.10.2026: pasifleştirmede portföy seçimi zorunlu, X-17 §(5).*
>
> **Kapsam dışı, kalıcı:** ortak sahiplik · bölge bazlı görünürlük · satıcının başka satıcının
> doktorunu salt okuma görmesi.
> **Şemaya etki:** `Siparis.satici_id` nullable olur · devir iz tablosu kalır.
> *→ 01.10.2026: iz tablosunun biçimi dönem kaydından olay kaydına geçer, X-17 §(3).*
> **Geri çekme:** yok — bugünkü davranış korunur. Siparişte satıcı alanının nullable olması `CM`'dedir.

### 5.17 X-14 · Prim oranı — karar metni *(16.09.2026)*

**Boşluğun kaynağı (FR-30, FR-31):** Hakedişin doğuşu (X-1 §(7)) ve tabanı (D-4, C-6 §(6)) yazılıydı;
oranın kendisi yazılı değildi. X-1 §(6) geçmiş hakedişin değişmemesini istediği için oranın bir
yere dondurulması da gerekiyordu.

> **KARAR (X-14):** **Varsayılan oran config'tedir; satıcıya özel oran kartındadır; uygulanan oran
> sevkiyata donar.** *(Değerlendirilen (b) — tek oran, satıcıya özel oran yok — reddedildi.)*
>
> **(1) Varsayılan oran** `finance.primOraniVarsayilan` (`policy.ts`, **23. anahtar**) —
> `Decimal(5,2)`, yüzde. Değer bugünkü koddan (**`5.00`**) taşınır; **devreye almada yazılı
> teyit** edilir. Kurulum düzeyindedir, **ekranı yoktur** (§0.1.1).
>
> **(2) Satıcıya özel oran** `Kullanici.prim_orani` — nullable `Decimal(5,2)`. Boşsa varsayılan
> geçerlidir. Yalnız `YONETICI` yazar. Değişiklik **loglanır** (RULE-13). Form ekranı Faz 2'dir (Ü-2).
>
> **(3) Uygulanan oran sevkiyat satırına donar.** Hakedişin doğduğu anda (A-3), siparişin
> satıcısının (X-13 §(3)) o anki oranı satıra yazılır. Sonraki oran değişiklikleri **geçmişi
> değiştirmez** (X-1 §(6)).
> - `BAYI` sevkiyatında alan boştur (X-8 §(3)).
> - Bedelsiz satırda alan boştur (A-2).
>
> **(4) Hakediş = matrah × donmuş oran** (C-6 §(6)). Hesap hakediş raporunda (X-1) yapılır;
> tutar saklanmaz.
>
> **Kapsam dışı, kalıcı:** kademeli oran · ürün bazlı oran · hedefe bağlı oran (D-4) · geriye dönük
> oran düzeltmesi.
> **Şemaya etki:** `Kullanici.prim_orani` (bugünkü `commissionRate`, tip `Decimal(5,2)`) · sevkiyat
> satırında `prim_orani`.
> **Geri çekme:** yok. `DEFAULT_COMMISSION_RATE` sabiti `policy.ts`'e taşınır (C7).

### 5.18 X-15 · Vade değişikliği ve mükerrer cari engeli — karar metni *(16.09.2026)*

**Boşluğun kaynağı (FR-22, FR-09, FR-01, FR-39):** İki davranış bugün kodda çalışıyor ama bu kitapta
karşılığı yoktu:
- vade tarihinin sonradan değişmesi (müşteri kararı D-02);
- telefonun zorunlu ve benzersiz olması.

X-8 ile bayi de doktor tablosuna girdi; bayinin kliniği ve bölgesi yoktur.

> **KARAR (X-15):** **İki davranış da korunur.** *(Değerlendirilen (b) — tek tek karar — gerek
> görülmedi.)*
>
> **(1) Vade tarihi sonradan değiştirilebilir.**
> - Yalnız `YONETICI` değiştirir; gerekçe zorunludur.
> - Her değişiklik **iz tablosuna** yazılır: eski tarih, yeni tarih, kişi, zaman, gerekçe.
> - Bugünkü vade değişiklik tablosu kalır ve **cari harekete bağlanır** (bugün siparişe bağlı —
>   GÇ-19, X-11 §(4)).
> - Değişiklik loglanır (RULE-13).
> - **Tutar, yön ve tip değişmez** (X-11 §(5)); değişiklik hiçbir mali hesabı etkilemez.
>   Etkilediği tek şey `VADESI_GECMIS_HAREKET` uyarısıdır (X-6 §(6)).
> - Vadede **üst sınır yoktur** (Bölüm 2 madde 16).
>
> **(2) Telefon zorunlu ve benzersizdir.**
> - Cari telefonu **NOT NULL**'dır.
> - Normalize edilmiş hâliyle (`+90XXXXXXXXXX`) **DB düzeyinde UNIQUE**'tir. Kural `DOKTOR` ve
>   `BAYI` satırlarının ikisine de uygulanır.
> - A-13'ün `telefon` alanı **bu alandır**; ikinci telefon alanı açılmaz.
> - Ad + klinik benzerlik uyarısı **Faz 2**'dir (Ü-10).
> - *13.10.2026 — geri not:* kişisel numara varsayımı: §(5) 🟦.
>
> **(3) Klinik ve bölge** nullable'dır. `DOKTOR` için **zorunludur** (uygulama kuralı, import dahil —
> D-6); `BAYI` için boş kalabilir.
>
> **(4) Bayiye ayrı kod veya yetkili alanı konmaz.** Tanıma `muhasebe_kodu` ve `fatura_unvani`
> yeter (A-13; §0.1 kolon testi).
>
> **(5) Varsayım yazılıdır: cari, kişiye ait bir telefonla açılır** (doktorun cep telefonu; klinik
> santrali değil). *(13.10.2026 eki — 19.09 incelemesi, bulgu 2.)*
> - **Kaynak:** A-9 aynı klinikte birden çok doktoru öngörüyor (aynı VKN, üç cari); §(2) telefonu
>   UNIQUE yapıyor. İkisi de doğru, ama aralarında yazılmamış bir varsayım vardı: **her carinin
>   kendine ait bir telefonu vardır.** Satıcının elinde yalnız klinik santrali varsa ikinci doktoru
>   kaydedemez; meşru bir yol görmezse numara uydurur — §0.2'nin B-7 ekine göre bu tasarım hatasıdır.
> - Alan etiketi **"Cep telefonu (kişisel)"**dir — **yalnız `DOKTOR`'da**. `BAYI` bir firmadır, kişisel
>   telefonu olmayabilir; etiketi **"Telefon"**dur ve firma numarası girilir. *(13.10.2026 — kullanıcı
>   kararı.)* UNIQUE ve `TELEFON_KAYITLI` iki sınıfta da aynen geçerlidir (§(2)); varsayım ve aşağıdaki
>   🟦 kaydı **`DOKTOR` içindir** — çoklu kayıt sorunu A-9'un aynı klinikteki doktorlarından doğar.
> - UNIQUE ihlali `SERT`'tir; kural kodu **`TELEFON_KAYITLI`**'dır. Hata metni numaranın kime ait
>   olduğunu söylemez (X-4 §(9), X-13 §(1)) ve kullanıcıyı yöneticiye yönlendirir.
> - **Meşru yol yöneticidir.** Yönetici bütün carileri görür. Ya gerçek bir mükerrer kayıt bulur
>   (FR-09 amacına uygun çalışmıştır) ya da ilk kayıttaki santral numarasını düzeltir.
> - Import'ta aynı numarayı paylaşan **bütün satırlar** reddedilir, yalnız ikincisi değil. İlk satırı
>   kabul etmek, santral numarasıyla açılmış bir kaydı meşrulaştırmak olurdu. Kural hem dosya içinde
>   hem kayıtlı carilere karşı uygulanır (X-16 §(1)).
>
> **🟦 Varsayılan kaydı — kişisel telefon varsayımı**
>
> | Alan | İçerik |
> |---|---|
> | **Varsayılan davranış** | UNIQUE korunur. Mükerrer numara X-16 önizlemesinde kural koduna göre sayılır ve X-16 §(4) gereği yazmayı durdurur. |
> | **Cevabın değiştirdiği katman** | Şema (UNIQUE kısıtı) — yalnız aşağıdaki dal tetiklenirse. |
> | **Kilitlenme anı** | **Doktor listesinin teslimi** (devreye alma). |
>
> **Ölçüm ayrı bir araç değildir.** `CARI` import'unun doğrula ve önizle aşamaları yazmadan çalışır;
> önizlemedeki `TELEFON_KAYITLI` adedi ölçümün kendisidir. Liste import ekranı hazır olmadan gelirse
> aynı sayım elle yapılır: benzersiz normalize numara adedi, satır adedine eşit mi?
>
> **Dal (bugünden yazılı):**
> 1. Adetler eşit değilse **önce veri tarafına** gidilir: satıcılardan kişisel numaralar toplanır.
> 2. Kalan satırlar için §(2) yeniden açılır (`FAZ1_UYGULAMA_KAPSAMI.md` §C).
> 3. **İkinci telefon alanı seçenek değildir** (§(2)).
>
> *Varsayılan seçimi (§0.6, geri dönüşü en ucuz olan):* UNIQUE'i sonradan kaldırmak tek satırlık bir
> migration'dır. Sonradan koymak ise mükerrer canlı veriyi temizlemeyi gerektirir.
>
> **Şemaya etki:**
> - Vade değişiklik izi kalır, bağı cari harekete taşınır.
> - Telefon NOT NULL + UNIQUE kalır.
> - Klinik ve bölge nullable olur.
>
> **Geri çekme:** yok — bugünkü davranış korunur.

### 5.19 X-17 · Sahipliğin tek yazma noktası, toplu devir ve pasif satıcının portföyü — karar metni *(01.10.2026)*

**Boşluğun kaynağı (19.09 incelemesi, bulgu 3):** X-13 sahipliğin **ne olduğunu** yazdı, **nasıl
değiştiğini** yazmadı. Sahiplik bugün iki yoldan değişiyor (doktor açma, devir); Faz 1 sonunda
altı yoldan değişecek: satıcının açtığı doktor · yöneticinin açtığı doktor · içe aktarım (D-6) ·
devir · pasifleştirme (E-2) · rol değişikliği (E-2 §(1)). Her yol kendi yazarsa kural bir yolda
unutulur. Somut eksik: X-13 §(6) pasif satıcının doktorlarını sahipsiz bırakıyor, devir ise tek
tek yapılıyor. *Örnek:* ayrılan bir satıcının 38 doktoru, yönetici tek tek atayana kadar siparişe
kapalı kalır. Ayrıca bugünkü devir izi (`DoctorAssignment`) **dönem kaydı** tutuyor: satıcı alanı
boş olamaz, dönemi kimin ve neden kapattığı yazılmaz. Sahipsizliğe geçiş **izsiz** kalıyor.

> **KARAR (X-17):** **Sahiplik tek fonksiyondan değişir; devir topludur; pasifleştirme
> portföyü bekletmez.** *(Değerlendirilen (b) — bugünkü davranış: doktorlar sahipsiz düşer,
> yönetici tek tek atar — reddedildi.)*
>
> **(1) Tek yazma noktası.** Doktorun sahibi yalnız
> `degistirDoktorSahibi(doktorlar, yeniSahip | null, gerekce, tx)` ile değişir. Altı yolun
> hepsi bu fonksiyonu çağırır; başka hiçbir kod sahip alanına yazmaz.
> · Fonksiyon **tek çağrı noktası listesinin 12. maddesidir**; liste bu kararla **11'den 12'ye
>   açılır**. §1.3 (9)'un yasağı **modüller** içindir; bu bir çekirdek eklemesidir.
> · CI'da sahip alanına fonksiyon dışından yazan kodu yakalayan bir kontrol bulunur.
>
> **(2) İki sert kısıt** (§0.3 birinci kademe):
> · **Sahip daima aktif bir `SATICI`'dır.** Kural tablolar arasıdır; fonksiyonun içinde,
>   aynı transaction'da denetlenir. Kural kodu **`SAHIP_AKTIF_SATICI_DEGIL`**.
> · **`BAYI`'nin sahibi olmaz** (X-8 §(3)). Fonksiyon reddeder (kural kodu
>   **`BAYI_SAHIP_ATANAMAZ`**); kural ayrıca **DB'de `CHECK` kısıtıdır**: `hesap_sinifi = 'BAYI'`
>   ise sahip boştur. Prisma ifade etmediği için `CM` migration'ına elle SQL olarak girer ve bir
>   testle doğrulanır.
> · `hesap_sinifi` cari açıldıktan sonra **değişmez**.
>
> **(3) İz her geçişi yazar.** Bugünkü devir tablosu kalır (ad eşlemesi `docs/adr/ADR-001`),
> biçimi **dönem kaydından olay kaydına** geçer. Her sahiplik değişikliği bir satırdır:
> doktor · eski sahip (boş olabilir) · yeni sahip (boş olabilir) · yapan · zaman (`timestamptz`,
> E-1 §(1)) · gerekçe. Açılışta atama, devir, sahipsiz bırakma ve sahipsizden atama aynı biçimde
> yazılır. Dönem sorgusuna tüketici yoktur; siparişin satıcısı sipariş anında donar (X-13 §(3)).
> İz ve log (RULE-13) **sahiplik değişikliğiyle aynı transaction'dadır**.
>
> **(4) Toplu devir.** Devir cari listesinden **çoklu seçimle** yapılır (1 ya da 38 doktor);
> ayrı ekran açılmaz. Yalnız `YONETICI` yapar (X-13 §(5)). Gerekçe bir kez girilir, her doktora
> ayrı iz satırı yazılır. Toplu işlemi gruplayan kolon açılmaz (§0.1 kolon testi — tüketicisi yok).
>
> **(5) Pasifleştirme ve rol değişikliği portföyü bekletmez.** Bir `SATICI` pasifleştirilirken
> ya da rolü değiştirilirken, sahibi olduğu doktorlar için seçim **aynı formun zorunlu alanıdır**:
> · **tek bir aktif satıcıya devret**, ya da
> · **sahipsiz bırak**.
> Seçim pasifleştirmeyi **hiçbir koşulda geciktirmez** (E-2 §(6), KVKK); "sahipsiz bırak" tek
> adımdır. Portföyü birden fazla satıcıya bölmek sonradan toplu devirle (§(4)) yapılır. Hedefi
> her zaman yönetici seçer — **otomatik devir yoktur** (E-2 §(6) korunur). Formun gerekçesi iz
> satırlarına da yazılır. Yeniden aktifleştirilen satıcıya doktorlar **geri dönmez**.
>
> **(6) Sahipsiz doktorlar görünür kalır.** Cari listesinde **"Sahipsiz" süzgeci** bulunur;
> yeni ekran açılmaz. Sahipsiz doktora sipariş girilmez (X-13 §(3), değişmez).
>
> **(7) Açılış ve içe aktarım.** `SATICI`'nın açtığı doktorun sahibi kendisidir; `YONETICI`
> sahip seçer ya da boş bırakır (X-13 §(2)). İçe aktarımda (D-6) sahip kolonu ya boştur ya da
> aktif bir `SATICI`'yı gösterir; `BAYI` satırında doluysa satır reddedilir
> (`BAYI_SAHIP_ATANAMAZ`). Gerekçe içe aktarım partisidir (X-12).
>
> **(8) Sipariş ve devir çakışmaz.** Sipariş girişi, devir, pasifleştirme ve rol değişikliği
> ilgili `Doktor` satırlarını transaction içinde **kilitler**; sıra `docs/adr/ADR-008`'dir
> (doktor satırları → ürün satırları → `BelgeSayac`). Sipariş, sahibi kilit alındıktan sonra okur
> ve satıcı alanına onu yazar. Toplu işlemler satırları **id sırasıyla** kilitler. Devir önce
> tamamlanırsa eski sahibin siparişi **X-4 iş hatasıyla** reddedilir (kural kodu
> **`SAHIP_DEGISTI`**); sipariş önce tamamlanırsa satıcısı eski sahiptir ve değişmez
> (X-13 §(3)/(4)).
>
> **(9) Kabul (1B):**
> · Aynı doktora eşzamanlı sipariş ve devir: sipariş tutarlı bir satıcıya yazılır, ikinci
>   işlem ya bekler ya da iş hatası alır.
> · `BAYI` satırına sahip yazma DB'de reddedilir.
> · Satıcı pasifleştirilirken seçim yapılmadan form gönderilemez; "sahipsiz bırak" seçilince
>   her doktor için iz satırı oluşur.
> · Sahip alanına fonksiyon dışından yazan kod CI'da kırmızıdır.
> · Belgesiz doktor silinince ya da cari partisi geri alınınca iz satırları gider, işlem log'da kalır (§(10)).
>
> **(10) Silme ve geri alma — iz doktorun kendi tarihçesidir, belge değildir.** Profesyonel
> ERP deseni: ana kaydın değişiklik tarihçesi o kayda aittir; ana kayıt yalnız hiçbir **belge**
> ona bağlı değilken silinebilir, silme işleminin kendisi denetim log'unda kalır.
> · Doktor C-3 §(6) istisnasıyla (belgesiz kayıt) silinirken ya da cari partisi X-12 §(3) ile geri
>   alınırken **sahiplik iz satırları doktorla birlikte silinir** (iz satırının doktor FK'si
>   `ON DELETE CASCADE`).
> · Silme ve geri alma işlemi — silinen doktorun **son sahibi** dahil — RULE-13 log'una yazılır
>   (C-3 §4); izin kanıt değeri log'da korunur.
> · İz satırı X-12 §(3)'ün *"başka belgeye bağlı olmamalı"* koşulunu bozmaz: iz belge değildir.
>   **Belgesi olan doktor silinmez** — bunu belgeler engeller, iz değil.
>
> **Kapsam dışı, kalıcı:** kural tabanlı otomatik dağıtım · ileri tarihli/zamanlanmış devir ·
> pasifleştirme formunda portföyü birden fazla satıcıya bölme · devri geri alma düğmesi
> (ters devir sıradan bir devirdir).
> **Şemaya etki (`CM`):**
> · `Doktor`'da `hesap_sinifi`–sahip `CHECK` kısıtı.
> · Devir iz tablosu olay biçimine geçer: eski/yeni sahip nullable; bugünkü başlangıç/bitiş
>   tarihi alanları kalkar; doktor FK'si `ON DELETE CASCADE` (§(10)).
> · Sahip FK'si `SET NULL` değil **`RESTRICT`** olur (kullanıcı silinmez — E-2 §(6); sahibi
>   fonksiyon dışında boşaltan tek yol kapanır).
> **Katalog:** kural kodları `SAHIP_AKTIF_SATICI_DEGIL` · `BAYI_SAHIP_ATANAMAZ` · `SAHIP_DEGISTI`
> (A-8 kural kodu kataloğu, X-4 §(3)).
> **Geri çekme:** X-13 §(6) ve E-2 §(6) redakte edilir (tarihli not); tek çağrı noktası listesi
> 11 → 12.

**Bu kararla güncellenen yerler (01.10.2026)** — eski hükümlerin gövdesi değişmez, tarihli not düşülür:
- **KARARLAR X-13 §(6)** ve **Şemaya etki** satırı · **E-2 §(6)** · **X-8 §(1)** (`hesap_sinifi` değişmez) ·
  **D-6** (doktor import'unda sahip kolonu).
- **KARARLAR "liste 11'de" geçen yerler** — §1.3 (9) · E-1 · §1.3 · X-5 satırları · ad rejimi notu ·
  X-1 §(10) · §3.x ve §5.x'teki *"11'de kalır"* hükümleri: her birine *"X-17 ile liste 12'ye çıktı"* notu.
- **KARARLAR §4 özeti** — kural kodu kataloğu ve kısıtlar satırı · özet ve X tablolarına X-17 satırları.
- **`FAZ1_UYGULAMA_KAPSAMI.md`** — §B.4 kural kodları · §B.5 iki satır · §B.6 (11 → 12) · §B.3
  devir izi satırı · §D.1 `CM` şema kalemleri · §D.7-10 / §C-z kapanışı.
- **`docs/adr/ADR-001`** eki (normatif adlar, devir izi biçimi). **`docs/adr/ADR-008` değişmez** (README §2.2 —
  gövde dondurulmuş): doktor satırı kilidinin karar dayanağı artık X-17 §(8)'dir, sıra ADR-008 §1 ile aynıdır;
  yeni kilit noktaları (sipariş, devir, pasifleştirme, rol değişikliği) ADR-008 §6 yazım testine uygulamada girer.
- **`IS_AKISI_OZETI.md`** sahiplik bölümü.

### 5.20 X-16 · İçe aktarım sözleşmesi ve cari şablonu — karar metni *(13.10.2026)*

*Öneri 19.09.2026 incelemesinden (bulgu 1 + genişletme; 24.09'da bulgu 6 ile §(12) eklendi);
onay 13.10.2026. Öneri belgesi `docs/arsiv/KARAR_ONERISI_2026-09-19.md`.*

**Boşluğun kaynağı:** K-7 §(2) (07.09) cari şablonunu *"D-6'daki A-13 alanları"* diye tarif ediyor.
D-6 ekleri de *"kimlik ve `fatura_` alanları + `cari_tip` (A-13)"* diyor. Sonra iki karar import'ta
zorunlu alan ekledi ve ikisi de şablona yansımadı: X-8 §(6) `hesap_sinifi`; X-15 §(3) klinik ve bölge
(*"import dahil"*). Cariye fiyat listesi ataması (X-10 §(6)) import'ta yazılı değildi; kimin import
çalıştırabileceği de yazılı değildi. *(Sorumlu satıcı kolonu 01.10.2026'da X-17 §(7) ile yazıldı.)*

Sonuçları:
- **`hesap_sinifi` kolonu olmadan** ya bütün dosya reddedilir ya da bir geliştirici uygulama
  katmanında `?? "DOKTOR"` yazar. İkincisinde bayiden prim doğar ve RULE-15 sessizce delinir.
- **Sorun tek kolon değildir.** Şablon ile karar kitabı arasında bağ yok; her yeni karar kolon
  ekledikçe şablon kopuyor.

> **KARAR (X-16):** **İçe aktarım, elle girişin toplu hâlidir. Şablon sistemden üretilir; belgede
> kolon listesi tutulmaz.**
> *(Değerlendirilen (b) — K-7'ye açık kolon tablosu yazılır, kod ona uyar — reddedildi: iki kaynak
> kalır ve ilk yeni kararda aynı kopma tekrarlanır.)*
>
> **(1) Import'a özgü doğrulama yoktur.** Her import satırı, aynı kaydı elle açan akışın
> doğrulamasından **aynen** geçer.
> - Elle girişte reddedilen satır, import'ta da **aynı kural koduyla** reddedilir.
> - Import'a özgü gevşeme ya da varsayılan yoktur.
> - `CARI` satırının karşılığı **`YONETICI`'nin cari açma akışıdır**.
> - *Elle giriş yolu olmayan türlerde (`ACILIS_BAKIYESI`, `ACILIS_STOGU`) doğrulama, import
>   tanımının kendisidir.*
>
> **Küme kuralları partinin tamamına uygulanır.** Tekillik ve aralık çakışması gibi kurallar tek
> satıra değil **yazma sonrası duruma** bakar. Elle girişte bu küme *veritabanı + eklenen satır*,
> import'ta *veritabanı + partinin bütün satırlarıdır* — sınırı §(4)'ün tek transaction'ı çizer.
> **Kural aynıdır; değişen kümenin sınırıdır.** Bu, import'a özgü bir kural ya da gevşeme değildir.
>
> **Çakışmada reddedilenler:**
> - **Dosya içi çakışmada çakışan satırların hepsi** reddedilir, yalnız ikincisi değil (X-15 §(5)
>   deseni).
> - **Kayıtlı veriyle çakışmada** yalnız dosyadaki satır reddedilir.
> - Her iki hâlde de kural kodu, aynı kuralın elle girişte döndürdüğü koddur; parametreler çakışan
>   satır numaralarını taşır (X-4 §(3)).
>
> **(2) Her veri türünün tek bir içe aktarım tanımı vardır** (X-12 kataloğu). Şablon, doğrulama ve
> önizleme özeti bu tanımdan türer; mekanizma `docs/adr/ADR-006`'dır. Bir alanın zorunlu olup
> olmadığı **o alanı koyan kararda** yazılıdır (A-13, X-8, X-15, X-17, bu madde). Kolonların dökümü
> hiçbir belgede kopyalanmaz.
>
> **(3) Dosya düzeyi sert kısıt.** Zorunlu bir kolonu eksik olan ya da tanınmayan bir kolon taşıyan
> dosya **bütünüyle reddedilir**; satır doğrulamasına geçilmez. Eski sürüm bir şablon bu kontrolde
> kendiliğinden yakalanır, ayrı sürüm alanı gerekmez.
>
> **(4) Kısmi yazma yoktur.** Reddedilen satır varken yazma adımı açılmaz. Satır hatalarının hepsi
> birlikte döner (X-4 §(7)).
> *Gerekçe: "geçerlileri yaz" akışında 6 bayi satırı reddedilip 240 doktor yazılırsa, sistem bayisiz
> canlıya çıkar ve bu hiçbir ekranda görünmez.*
>
> **(5) `CARI` tanımı iki alan taşır:**
> - **Sorumlu satıcı:** aktif `SATICI`'nın kullanıcı e-postası. Kuralı X-17 §(7)'dedir ve burada
>   kopyalanmaz: `DOKTOR`'da boş bırakılabilir (doktor sahipsiz açılır, X-13 §(2)); `BAYI`'de doluysa
>   satır `BAYI_SAHIP_ATANAMAZ` ile reddedilir; atama `degistirDoktorSahibi()` ile yazılır.
> - **Fiyat listesi kodu:** boşsa varsayılan liste geçerlidir (X-10). Tanınmayan kod reddedilir.
>
> **(6) `CARI` içe aktarımını yalnız `YONETICI` çalıştırır.** (5)'teki iki alanı yalnız yönetici
> yazabilir (X-13 §(5), X-10 §(6)); daha geniş bir yetki bu iki kuralı import üzerinden deler.
> Diğer türlerin yetkisi D-2 ekran matrisinde yazılır (`FAZ1_UYGULAMA_KAPSAMI.md` §C-n).
>
> **(7) Önizleme özeti, yazma onayıdır.** "Yaz" düğmesi özetin altında durur; özetsiz yazma yolu
> yoktur. `CARI` özeti şunları gösterir:
> - sınıf dağılımı (`DOKTOR` / `BAYI` adedi)
> - satıcı başına doktor adedi ve sahipsiz doktor adedi
> - fiyat listesi boş `BAYI` adedi (`BILGI`)
> - reddedilen satırların kural koduna göre adedi
> - açılacak kayıt adedi (§(9))
>
> *Gerekçe: yanlış sınıflanmış bir bayiyi ay sonu prim raporundan önce görebilecek tek insan gözü
> burasıdır.*
>
> **Diğer türlerin özeti kendi tanımındadır** (ADR-006 §1); kural burada kopyalanmaz.
> `ACILIS_BAKIYESI` özeti D-6 ekindedir (24.09.2026).
>
> **(8) Hesap sınıfının kaynağı her akışta açıktır** (X-8 §(1)):
> - `SATICI` akışı `DOKTOR` değerini **açıkça** verir.
> - Import değeri satırdan okur.
> - `YONETICI` formunda sınıf **seçili gelmez** ve seçilmeden kayıt yapılamaz.
>
> *Ekranda önceden seçili gelen değer, adı konmamış bir varsayılandır.*
>
> **(9) İçe aktarım yalnız kayıt açar; var olan kaydı güncellemez.** Anahtarı (`CARI` için normalize
> telefon, X-15 §(2)) kayıtlı bir satır `TELEFON_KAYITLI` ile reddedilir ve §(4) gereği dosyanın
> tamamı bekler. **Kayıtlı satırın "atlanması" diye bir davranış yoktur** — atlamak, dosyadaki satır
> ile kayıtlı kayıt arasındaki farkı gizler ve yönetici dosyanın uygulandığını sanır.
> - **Dosya yalnız açılacak kayıtları taşır.** Önizlemedeki *"açılacak kayıt adedi"*, gönderenin
>   beyan ettiği adetle karşılaştırılır; tutmuyorsa dosya yanlıştır.
> - **Açılmış bir kaydın düzeltme yolu, onu açan akışın kendisidir:** tek cari ekranı
>   (`FAZ1 §D.3` madde 7). Aynı alanlar, aynı doğrulama, aynı log (A-13, RULE-13).
> - *Gerekçe: import bir **devreye alma aracıdır** (D-6 kapsamı, §(6) yetkisi). Sonraki eklemelerin
>   olağan yolu cari ekranıdır. Toplu güncelleme ayrı bir yetenektir; §0.6 gereği en dar varsayılan
>   seçilir.*
> - **Kapsam dışı, Faz 2 adayı:** iş anahtarına göre toplu güncelleme (upsert). *Bu kararın koşulu:
>   müşteri cari listesini düzenli olarak dosyayla güncelleyecekse D-6'nın kapsam cümlesi yeniden
>   yazılır ve asıl karar upsert değil, import'un ne olduğudur.*
>
> **(10) Geri alma, ana verinin düzeltme yolu değildir.** Geri alma D-6 ve X-12 §(3)'teki gibi
> durur; koşulu C-3 §(6)'dır.
> - **Kısmi geri alma yoktur.** Koşul partinin **tamamına** bakar: partiye bağlı tek bir kayıt bile
>   belgeye bağlıysa parti geri alınmaz ve **hiçbir kayıt silinmez**. *Gerekçe §(4)'ün aynasıdır —
>   234 kayıt silinip 12'si kalırsa sistem eksik cari listesiyle yaşar, yönetici "geri aldım" der ve
>   bu hiçbir ekranda görünmez.*
> - **Koşul sağlanmadığında düzeltme yolu elle düzeltmedir** (§(9)). Geri alma bir kolaylıktır, tek
>   çare değildir.
> - **Açılış bakiyesi hatası `TERS_KAYIT` ile düzeltilir** (X-11 tip kataloğu); parti geri alınmaz.
>   *Açılış stoğunun `DZL`/`ACILIS_DUZELTME` yolunun (D-6, B-7) cari tarafındaki karşılığıdır.
>   `ACL` hareketi kendisi numaralı bir kayıttır (A-14 §(8)); numara oluşumda doğar, ölmez
>   (A-14 §(6)).*
> - Geri alma tek transaction'dır ve **ADR-006'nın geri alıcısıdır**. Sahiplik izini silen yol da
>   bu tanımın içindedir (X-17 §(10)) ve X-17 §(1)'in CI kontrolünün kapsamına girer.
>
> **(11) `CARI` listesi de yazılı teyit ister.** K-7 §(4)'ün açılış bakiyesi ve oranlar için koyduğu
> kural cari listesine genişletilir: nihai liste yüklenmeden önce müşteriden **yazılı onay** alınır.
> - *Gerekçe: üç aşamalı import dosyanın **biçimini** doğrular, **doğruluğunu** değil. Doğruluğun tek
>   ölçüsü müşterinin onayıdır.*
> - **Sınır — garanti değildir:** müşteri bayat bir listeyi de onaylayabilir. Kural hatayı imkânsız
>   yapmaz; **görünür ve sahipli** yapar.
>
> **(12) İçe aktarım, o fazda düzeltme yolu olmayan bir alanı yazmaz** *(24.09.2026 — bulgu 6)*.
> Bir alan şablonda yer alıyorsa, yanlış geldiğinde düzeltileceği bir yol **aynı fazda**
> bulunmalıdır. Düzeltme yolu §(9)'daki gibi elle giriş ekranı, ya da tipe özgü bir ters kayıt
> olabilir.
> - **Uygulaması — `FIYAT_LISTESI` şablonunda tarih kolonu yoktur.** `gecerli_baslangic` /
>   `gecerli_bitis` şemada ve DB kısıtında **vardır** (X-10 §(1), B-5) ama Faz 1'de **doldurulmaz**:
>   satırlar süresizdir.
>   *Gerekçe: X-10 §(7) tarih alanlarının **ekranını Faz 2'ye** bıraktı. Şablon tarih taşısaydı
>   import, Faz 1'de hiçbir ekranın gösteremediği ve düzeltemediği bir veri yazardı; yanlış tarihli
>   satır `cozumleBirimFiyat()`'ta **`SERT` "fiyat çözümlenemedi"** üretir (X-10 §(3)) ve o ürüne
>   sipariş girilemez. §(9) gereği yeniden yükleme de düzeltmez — import kayıt güncellemez. §0.2'nin
>   tahliye vanası kuralı bunu **kullanıcı hatası değil tasarım hatası** sayar.*
>   *§0.6 aynı yeri gösterir: kolonsuz şablon Faz 2'de **eklenerek** büyür; kolonlu şablonun hatası
>   ancak **silinerek** düzelir ve Faz 1'de silme ekranı yoktur.*
> - **Faz 1'de B-5 çakışma kısıtının fiilî karşılığı** `(liste, ürün, min_adet)` tekilliğidir —
>   bütün satırlar süresiz olduğu için iki satır daima çakışır.
> - **Diğer türlerde bu madde bir şey değiştirmez:** `CARI` → tek cari ekranı (§(9)) ·
>   `ACILIS_BAKIYESI` → `TERS_KAYIT` (§(10)) · `ACILIS_STOGU` → `DZL`/`ACILIS_DUZELTME` (D-6, B-7) ·
>   `URUN` → ürün ekranı. Düzeltme yolu olmayan tek alan tarih alanlarıydı.
> - **Faz 2'de tarih ekranı açıldığında** şablon kendiliğinden tarih kolonu kazanır (ADR-006 §3:
>   şablon elle giriş şemasından üretilir); bu maddenin ayrıca değiştirilmesi gerekmez.
>
> **Kapsam dışı, kalıcı:** import'a özgü doğrulama kuralı · kısmi yazma · **kısmi geri alma** ·
> **kayıtlı satırın atlanması** · **import'tan cari silme** (silme C-3 §(6) yoludur) · kolon eşleme
> ekranı · müşteriye özel şablon.
> **Şemaya etki:** yok. İki alan zaten `Doktor`'da (X-10, X-13); parti FK X-12'de.
> **Katalog:** kural kodu `ICE_AKTARIM_KOLON_EKSIK` · `ICE_AKTARIM_KOLON_TANINMIYOR` ·
> `URUN_KODU_KAYITLI` · `FIYAT_SATIRI_CAKISIYOR` (X-4 §(3)). *Son kod tek bir kuralın adıdır — "bu
> satır zaten var": Faz 1'de `(liste, ürün, min_adet)` anahtarı, Faz 2'de tarih aralığı da dahil
> (B-5). Öneride 24.09'da `FIYAT_ARALIGI_CAKISIYOR` idi; §(12) ile Faz 1'de tarih kolonu kalmayınca
> ad, henüz var olmayan bir mekanizmayı anlatır olmuştu.* *(`TELEFON_KAYITLI` X-15 §(5)'tedir.)*
> **Geri çekme:** yok — bugün import kodu yok.
> **Geri not:** K-7 §(2) · K-7 §(4) · D-6 (ekler ve *"geri alınabilir"*) · A-13 §(4) · X-8 §(6) ·
> X-12 §(3) · X-13 §(2) · X-15 §(2) (bu turda düşüldü).

**Bu kararla güncellenen yerler (13.10.2026)** — eski hükümlerin gövdesi değişmez, tarihli not düşülür:
- **KARARLAR** K-7 §(2) ve §(4) · D-6 (§3.4 tablosu) · A-13 §(4) · X-8 §(6) · X-12 §(3) ve §4 satırı ·
  X-13 §(2) · X-15 §(2) ve yeni §(5) · §4 etki ve katalog satırları · §5 tablosu · §6.
- **`docs/adr/ADR-006`** yazıldı (öneri taslağından; ADR-007 atıfları X-17'ye çevrildi). `docs/adr/README.md` dizini.
- **`FAZ1_UYGULAMA_KAPSAMI.md`** — §B.4 kural kodları · §B.5 satırları · §C-y · §C-aa · §D.3 madde 7.
- **`KABUL_KRITERLERI.md`** — `X-16-1` ve `X-15-5-1` iskelet satırları (metin 1B madde 7'de, testten önce — X-7 §(6)).
- **`YOL_HARITASI.md`** §7.1 — geri not kuralı (öneri §8).

## 6. Faz 0 çıkış kontrol listesi

**Tamamlananlar**

- [x] K-1, K-2, K-3 cevaplandı ve §1.1'e işlendi
- [x] K-5 cevaplandı *(kapsam dışı)* · **K-10 ile teyit edildi**
- [x] A-1, A-2, A-3, A-6, D-6 karara bağlandı
- [x] A-8, A-4, B-6, A-5, A-10, A-7, A-11, A-12 karara bağlandı
- [x] A-9 açıldı ve ⚪ park edildi
- [x] B-3, B-4, B-5, C-5, D-1, D-3, D-4 karara bağlandı
- [x] §0.6 "varsayılan kaydı" yöntemi ve 🟦 durum işareti eklendi — 17.08.2026
- [x] K-4 ve K-10 varsayılanları sabitlendi (🟦) — 17.08.2026
- [x] **§0.1.a kolon testi ve §0.7 araştırma kuralı eklendi** — 19.08.2026
- [x] **C-6, A-13, A-14, C-3, K-9 + C-7 karara bağlandı** — 19.08.2026
- [x] **K-8'in şema riski kapandı** — 19.08.2026
- [x] **C-1 karara bağlandı**; **K-10 revize edildi (§H)** — 28.08.2026
- [x] **K-4 §(4) eki yazıldı** *(karma portföy · fail-closed · segment yok · mutlak adet)* — 28.08.2026
- [x] **C-2 karara bağlandı** *(§0.8 ilkesi · tarih parametresi · stokta tutar yok ·
      `hesap_etiketi` konmaz · müşavir erişimi D-2'ye)* — **29.08.2026**
- [x] **B-7 açıldı ve karara bağlandı** *(`StokDuzeltme` + `DZL` · `StokDuzeltmeSebep`
      tanım tablosu · zaman kilidi · `harici_belge_no` · filtre 6. dışlama)* — **29.08.2026**
- [x] **K-6 + C-4 karara bağlandı** *(hukuki görüş zorunlu · alımdan bütçe türetme
      geçersiz · uyum kütüğü · `PazarlamaButcesi` satıcı/bölge bazlı · kapalı teslim)*
      — **29.08.2026**
- [x] **§0.8 (muhasebe sorumluluk sınırı) ve §0.9 (çekirdek sektörden bağımsızdır)
      eklendi** — 29.08.2026
- [x] **Faz 1 şemasını blokleyen madde kalmadı** *(B-7 ile açıldı, aynı gün kapandı)*
- [x] **K-8 karara bağlandı** *(üç kalem · modül≠özel geliştirme · kullanıcı/belge başına
      fiyatlama yasağı · askıya alma ≠ imha · §0.5 · koda etki yok)* — **07.09.2026**
- [x] **K-7 karara bağlandı** *(şablon `VergiOrani` kodu + ÜTS sütunu · ayrı açılış stoğu
      şablonu · veri standardizasyonu ayrı kalem · yazılı teyit)* — **07.09.2026**
- [x] **D-2 karara bağlandı** *(üç rol kapalı katalog · `StokDuzeltme` yalnız YONETICI ·
      `kapsamliDoktorlariGetir()` · MUSAVIR rolü yok · bayi cari tipidir)* — **07.09.2026**
- [x] **X-2 blocker olarak karara bağlandı** — **07.09.2026**
- [x] **e-Fatura API modülü (K-4 §(4)-EK2) ve ÜTS modülü (K-10 §I) ertelendi**;
      arayüz dâhil hiçbir kod ve şema alanı yazılmaz — **07.09.2026**
- [x] **K-4 §(6) fatura hazırlık veri seti MVP'ye alındı** *(altıncı dışa aktarım veri seti;
      konfigüre edilebilir sütun eşlemesi; 7 gün uyarısı; C-1 ihlal edilmez)* — **08.09.2026**
- [x] **1 Ekim kilitlenme anı ikiye ayrıldı** *(K-10 tetikleyicisi düştü; KDV oranı teyidi
      K-7 §(7) ile canlıya çıkışa taşındı)* — **08.09.2026**
- [x] **X-1 karara bağlandı** *(tahsilat oranı kaldırıldı · dönem zorunlu aralık ·
      hakediş doğuşu ≠ ödeme · `hesaba_gecti_mi` konmaz · D-2 ile tek commit)* — **08.09.2026**
- [x] **A-15 açıldı ve karara bağlandı** *(nakit tevsik uyarısı · bilgi kademesi · şemaya
      etki yok · config limiti · sistem "uygundur" demez)* — **08.09.2026**
- [x] **X-3 karara bağlandı** *(hata yüzeyi politikası · sabit metin + referans · sessiz
      hata yasağı · harici izleme kalıcı kapsam dışı)* — **08.09.2026**
- [x] **§0.4 oran kuralı ve §0.1 X-1 eki eklendi**; teyit metni **on bir maddeye** çıktı
      — **08.09.2026**
- [x] **Ü-3 karara bağlandı** *(toggle kurulum düzeyi ve Faz 1'de kapalı · **taban etiketi
      zorunluluğu** §0.4'e işlendi · B/C sınıfı ekranlarda toggle kalıcı olarak yok · belge
      toplamı üç satır · elle fiyat girişi **`birim_fiyat`**'a yazılır)* — **09.09.2026**
      ⚠️ **X-5 redaksiyonu (14.09.2026):** özgün metin *"elle fiyat girişi `iskonto_oran`'a
      yazılır"* idi. X-5 §(10) Ü-3 §(10)'u revize etti ve `iskonto_oran`'ı şemadan çıkardı;
      bu satır 13.09 turunda atlanmıştı. **Türetim gösterimde yapılır, saklanmaz.**
- [x] **Müşteri beyanı alındı:** fiyat listeleri **KDV hariç**, indirim **adet baremli**,
      KDV sonradan eklenir → `pricing.fiyatGirisiKdvDahil` **`false`, açılmaz** — **09.09.2026**
- [x] **X-4 karara bağlandı** *(tek dönüş sözleşmesi · iş hatası `throw` edilmez · kademe
      başına tek gösterim deseni · uyarı yutma yasağı · **log kalıcılığı sorusu konusuz
      kaldı**)* — **09.09.2026**
- [x] **E-1 karara bağlandı** *(saklama UTC, yorum `Europe/Istanbul` · **an ile takvim günü
      şema düzeyinde ayrıldı** · aralıklar yarı açık · `new Date()` yasak)* — **09.09.2026**
- [x] **E-2 karara bağlandı** *(kapalı hesap modeli · **veritabanı oturumu** · pasifleştirme
      anında etkili · son yönetici korunur · oturum 4/12 saat · ekran kilidi OS'un işi)*
      — **09.09.2026** · ⚠️ **şemaya ekler**
- [x] **E-3 karara bağlandı** *(kalıcı dosya eki yok · **K-9 §A-3 düzeltildi** · import
      dosyası saklanmaz · `ImportParti.dosya_adi` salt kayıt alanı)* — **09.09.2026**
- [x] **D-5 (Ü-5) karara bağlandı** *(altı veri seti kapalı · dönem parametreleri E-1'e
      bağlandı · yalnız `YONETICI` · **her dışa aktarım loglanır**)* — **09.09.2026** ·
      ⚠️ **şemaya ekler**
- [x] **§1.3 modülerlik karara bağlandı ve A-9 parkı çözüldü** *(tek yönlü bağımlılık ·
      **katalog çekirdektedir** · `kural_kodu` `varchar` · modül fiyata dokunamaz · modül
      yazılmadan tablosu yazılmaz · **cari sahibi tek tip: `Doktor`**)* — **09.09.2026**
- [x] **C-2 🟦 periyot varsayılanı çıkarımla sabitlendi**; madde 14-a **numune yöntemine**
      çevrildi — **09.09.2026**

- [x] **X-5 karara bağlandı** *(parasal tip **`Decimal`** · ölçek şemada · ham aritmetik iki
      fonksiyonda · **lint kuralı teslim şartı** · tek `formatla()` çıkışı · `birim_fiyat`
      saklanır, **`iskonto_oran` türetilir** · yuvarlama modu ve pozitif satır kuralı)*
      — **13.09.2026** · ⚠️ **şemayı değiştirir**
- [x] **X-6 karara bağlandı** *(`PaymentAllocation` **kaldırıldı** · **runtime FIFO de yasak** ·
      yaşlandırma **Faz 2+** · vadesi geçmiş **tutar gösterilmez** · "otomatik mahsup"
      **aritmetiktir** · `VADESI_GECMIS_HAREKET` kural kodu · **K-1 redaksiyonu**)*
      — **13.09.2026** · ⚠️ **şemadan çıkarır**
- [x] **X-7 karara bağlandı** *(PRD **arşivlenir** · **`KABUL_KRITERLERI.md`** açılır ·
      numaralandırma **karar kimliğinden** · `TRACEABILITY.md` → **kod × test × karar**)*
      — **13.09.2026**
- [x] **X-8 karara bağlandı** *(bayi = `Doktor` satırı, `hesap_sinifi = BAYI` · `Dealer*` tabloları
      kalkar · bayiye prim doğmaz · X-2 ilkesi bütün tahsilatlara genişler)* — **15.09.2026** ·
      ⚠️ **şemaya ekler ve şemadan çıkarır**
- [x] **X-9 karara bağlandı** *(`LoginAttempt` kalkar · deneme sınırı bellek içi · tek süreç
      varsayımı yazılı)* — **15.09.2026** · ⚠️ **şemadan çıkarır**
- [x] **X-10 karara bağlandı** *(cariye atanan liste · `FiyatListesi` + `FiyatListesiSatir` ·
      boş atama = varsayılan liste · varsayılana düşülmez · `Product.netListPrice` kalkar ·
      elle fiyat serbest)* — **15.09.2026** · ⚠️ **şemaya ekler ve şemadan çıkarır**
- [x] **X-11 karara bağlandı** *(`CariHareket` yeni tablo · `ACL`/`VDF` bu tabloda · tutar pozitif, yön ayrı · tip kataloğu 🟦)* — **16.09.2026** · ⚠️ **şemaya ekler**
- [x] **X-12 karara bağlandı** *(`ImportParti` yeni tablo · kayıtlar parti FK taşır · veri türü kataloğu 🟦)* — **16.09.2026** · ⚠️ **şemaya ekler**
- [x] **X-13 karara bağlandı** *(satıcı yalnız kendi doktorlarını görür · D-2 §(3) redakte · siparişin satıcısı sipariş anındaki sahip · devir izli)* — **16.09.2026** · ⚠️ **şemayı değiştirir**
- [x] **X-14 karara bağlandı** *(`finance.primOraniVarsayilan` · satıcıya özel oran · oran sevkiyata donar)* — **16.09.2026** · ⚠️ **şemaya ekler**
- [x] **X-15 karara bağlandı** *(vade değişikliği izli · telefon zorunlu ve benzersiz · `BAYI`'de klinik/bölge boş olabilir)* — **16.09.2026** · ⚠️ **şemayı değiştirir**
- [x] **C-1 iç karar olarak yeniden sınıflandırıldı; §0.6 otomatik ✅ kuralı kaldırıldı** *(🟦 → ✅ · kilitlenme anı alanı kalktı · teyit metni 3. madde bilgilendirme · §(6) geri notu)* — **09.10.2026** · şemaya etki yok
- [x] **🟦 tarama uygulandı; C-1 revizyon 2 (e-belge stratejisi) ve D-3 revizyonu** *(X-11 · X-12 · A-4 · A-8 → ✅ · K-10 yeni kilit · K-4 ayrıştı · e-belge modülü çekirdek sonrası ilk modül · kargo e-belgeden sonra, BYOI)* — **10.10.2026** · şemaya etki yok
- [x] **C-1 revizyon 3 — modül sınırı ve e-belge modülü kararları** *(§1.3 §F · ortak model modülde · zamanlayıcı altyapısı · durum makinesi · cari uzantısı · birim/istisna · K-8 kontör 🟦 · K-9 §B kargo anahtarı açıklaması)* — **12.10.2026** · şemaya etki yok
- [x] **X-16 karara bağlandı** *(import elle girişin toplu hâli · şablon tek tanımdan, ADR-006 · kısmi yazma yok · `CARI` yalnız `YONETICI` · kısmi geri alma yok · açılış bakiyesi partisi geri alınmaz)* + **X-15 §(5) 🟦** *(kişisel telefon varsayımı, kilit: doktor listesi teslimi)* — **13.10.2026** · şemaya etki yok
- [x] **Belge uyum denetimi yapıldı** *(13.09.2026)*: bu dosya ile diğer altı dosya arasındaki
      çelişkiler tarandı; **on üç kalemlik geri çekme listesi** *(15.09: X-9 ve X-10 ile on beş)* `FAZ1_UYGULAMA_KAPSAMI.md` §A'da
      açıldı ve **`YOL_HARITASI.md` §7.1 belge rejimi** yazıldı.

> **Faz 0'ın karar adımları tamamlandı — açık (⬜) madde kalmadı.**
> *15.09.2026: Faz 1A'da açılan X-8 · X-9 · X-10 aynı gün kapandı.*
> *16.09.2026: X-11…X-15 aynı gün kapandı; PRD taraması kapandı — `CM`'in önünde açık karar yok.*

**Kalanlar — karar değil, iş**

- [ ] 🔴 **SIRA DIŞI — canlıya çıkış ön koşulu:** C-1 teyit metni (**on bir madde**) yazılı
      olarak alınır. *Bu iş hiçbir sırayı beklemez.*
      **Not (08.09.2026):** müşavir ürün listesinin **KDV sütunu** K-7 §(7) ile şablona
      taşındı; **ÜTS sütunu** K-10 §I-4 gereği **hâlâ istenir** (veri geriye dönük
      üretilemez), ancak **1 Ekim artık blokleyici tarih değildir** (K-10 §I-7).
- [x] **PRD taraması — arşivlemenin ön koşulu (X-7 §(2)).** — ✅ **kapandı 16.09.2026** `PRD_V2.md`'nin **71 FR + 15 RULE**
      maddesi tek tek geçilir; her biri için tek soru: *"bu, KARARLAR'da bir maddeye bağlandı mı?"*
      **Geri çekme listesi 22'sini kapsıyor; kalan 49'un karşılığı olduğu VARSAYILMAZ.**
      Karşılığı çıkmayan madde bir **eksik karardır** ve §0 çerçevesine göre karara bağlanır.
      ✅ **Tarama yapıldı — 16.09.2026** (`FAZ1_UYGULAMA_KAPSAMI.md` §E). Sonuç: 38 ✅ · 8 ⛔ · 3 🔵 · **10 ❌**.
      ❌'ler üç maddede toplandı: **X-13 · X-14 · X-15** — üçü de aynı gün kapandı → **59/59 karşılıklı**.
      `PRD_V2.md` artık arşive gidebilir (C10); `FAZ1_UYGULAMA_KAPSAMI.md` §E kayıt olarak kalır.
- [ ] **`KABUL_KRITERLERI.md` iskeleti kurulacak** *(Faz 1A, commit **C10** — `FAZ1_UYGULAMA_KAPSAMI.md` §D.1)*; numaralandırma
      **karar kimliğinden** türeyecek (`A-3-1`, `C-6-2`), **`FR-*` terk edilecek** (X-7 §(4)).
      ⚠️ **14.09.2026 düzeltmesi:** bu satır geçmiş zamanla yazılmıştı (*"kuruldu … türüyor …
      terk edildi"*) ama kutusu işaretsizdi — **iş yapılmadı**, okuma hatasına yol açıyordu.
- [ ] **Şema kapanışı:** E-2 (oturum tablosu + `Kullanici.aktif`, `parola_hash`,
      `parola_degistirmeli`) ve D-5 (dışa aktarım kütüğü) migration'a eklenir; **E-1 tip
      disiplini** (`timestamptz` / `date`) aynı migration'da netleşir.
      *Tip yanlış konursa düzeltmesi veri taşıma migration'ıdır (§0.1.a) — ucuz olan tek an
      bugündür.*
      ⚠️ **13.09.2026 genişlemesi:** bu kalem artık yalnız E-2 + D-5 değildir. Aynı migration
      **X-5 `Decimal` dönüşümünü** ve **X-6 `PaymentAllocation` kaldırmasını** da taşır; ayrıca
      daha önce karara bağlanmış ama **hiç koda girmemiş** şema kalemlerinin tamamını
      (11 tablo — *15.09: X-10 ile 13* —, 4 belge, 40+ kolon). Tam döküm: **`FAZ1_UYGULAMA_KAPSAMI.md` §B.**

**Karar adımı değil, uygulama işi:** X-2 (blocker — *15.09: bütün tahsilatların kabul testi, X-8 §(7)*) · **servis katmanı testleri** ·
X-1 + D-2 **tek commit** · X-3 hata yüzeyi · **X-4 sözleşmesi** · **Ü-3 taban etiketi** ·
**E-1 tek dönüşüm modülü** · **E-2 kimlik katmanı** · **D-5 dışa aktarım kütüğü**.

**Karar adımı değil, ön koşul:** **şirket kuruluşu** (K-8 §Ön koşul notu) — mali müşavire
sorulur. **Ve pazar geri bildirimi:** Anka West canlıya geçtikten sonra aynı sektörden
müşteri adaylarıyla görüşülür; her görüşmede **iki standart soru** sorulur
(K-10 §H-E ve K-4 §(4)-EK2-h). *Tetikleyicilerin sayacı ancak böyle işler.*

**Faz 0 kapanış işleri**

- [ ] Bölüm 2'deki metin Anka West'e gönderildi (tarih: ______)
- [ ] Müşavire giden **tek yazı** hazırlandı: KDV oranı sütunu · ÜTS sütunu · örnek dosya
- [ ] 🔴 çıkanlar `YOL_HARITASI.md` Faz 1'e eklendi
- [ ] 🟡 çıkanlar `YOL_HARITASI.md` Faz 2'ye eklendi
- [ ] Faz 2 ayrı kalemler (`DisaAktarimSablonu`, **KVKK veri imha paketi**, B-5 tarih ekranı,
      **C-2 tarihli rapor ekranları**) `YOL_HARITASI.md`'ye ve fiyat teklifine eklendi
- [ ] Faz 3 opsiyonel paketler (D-1 kademe 2, D-3 API, K-4 entegrasyon + kontör,
      K-10 izlenebilirlik + geçiş sayım kalemi, C-3 periyodik imha,
      **K-6 kongre ve teşvik modülünün yeniden yazımı**) **ayrı kalem** olarak eklendi
- [ ] 🟦 maddelerin kilitlenme anları takvime işlendi — **K-10 ve C-1: 1 Ekim 2026**
      *09.10.2026 — geri not: C-1 iç karar olarak ✅ oldu, kilitlenme anı yok (§3.3.c revizyonu). K-10'un 1 Ekim kilidi 08.09'da düşmüştü (§I-7); 10.10.2026: yeni kilit teyit metni 1. madde imzası, canlıya geçişten önce (§1.4 §H). Tarihin geçmesi bir 🟦'yi kapatmaz (§0.6, 09.10).*
- [ ] **Sözleşme metni hazırlandı (on bir madde)** — bkz. §3.3.c (5)
- [ ] Satış sürecine **K-10 §H-E standart sorusu** eklendi *(her müşteri adayına)*
- [ ] Satış sürecine **K-4 §(4)-EK2-h standart sorusu** eklendi *(entegratör tespiti)*
- [ ] **Teklif şablonu üç kalemli** hazırlandı (K-8) + veri standardizasyonu **görünen satır** (K-7)
- [ ] **Anka West'in entegratörü tespit edildi** ve **onun Excel şablonu** elde edildi (K-4 §6-b)
- [ ] **K-4 §(6) ilk çıktı öncesi K-7 §(4) yazılı teyidi** alındı
- [ ] **Sözleşmeye eklendi:** askıya alma + giderme süresi · askıya alma ≠ imha ·
      hesap paylaşımı yasağı (D-2 §8) · beyan dili (K-7 §5)
- [ ] **Devreye alma notuna eklendi:** ilk `YONETICI` hesabının açılması · **10 dakikalık
      işletim sistemi ekran kilidi önerisi** (E-2 §4-a) · `finance.nakitTevsikLimiti` ve
      `import.azamiDosyaBoyutMb` değerlerinin doldurulması
- [ ] **Canlıya çıkış sonrası ilk dönem sonunda** üç veri seti çıktısı **müşavire gönderildi**
      ve geri bildirim alındı (C-2 numune yöntemi) — tarih: ______
- [ ] **F-05 revize edildi:** kongre kredisi lot mekanizması ve alımdan bütçe türetme
      kodu kaldırıldı
- [ ] **`PRD_V2.md` arşive taşındı** (tarama sonrası); ona atıf yapan `TRACEABILITY.md` ve
      `DUZELTME_BRIFI.md` **yeni kaynağa** yönlendirildi (X-7 §(1))
- [x] **`docs/adr/README.md` sınır kuralı yazıldı** *(15.09.2026 — `docs/adr/README.md` §1)*: *"Bir karar müşteriye, fiyata, sözleşmeye veya
      kapsama dokunuyorsa KARARLAR'a yazılır; yalnız 'nasıl' sorusuna cevap veriyorsa ADR'ye.
      ADR hiçbir koşulda KARARLAR'ı geçersiz kılmaz."*
- [ ] **`SOZLESME_EKI.md` hazırlandı** — on bir madde + **zamanlama kolonu** (her maddenin
      hangi ana ait olduğu); **hukukçu kontrolü beklemede** işaretiyle (K-7 §(5))
- [ ] **Lint kuralı yazıldı ve CI'da yeşil** — `Decimal` üzerinde `Number()`/`parseFloat`/
      aritmetik operatör yasağı (X-5 §(5)); **teslim şartıdır**
- [ ] `DUZELTME_BRIFI.md` "Karar bekleyenler" → "bkz. KARARLAR.md §1.1"
- [ ] `IS_AKISI_OZETI.md` §7 aynı şekilde
- [ ] `YOL_HARITASI.md` §2.1 aynı şekilde

**Bu liste tamamlanmadan `DUZELTME_BRIFI.md` açılmaz.**
