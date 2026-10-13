# İş Akışı ve İş Mantığı Özeti — Medikal Satış Operasyon v2.2
<!-- Belge sınıfı: 3 · Ayna (YOL_HARITASI.md §7.1-A) · Tetikleyici: kod değişince -->

> **Bu doküman ne için:** Sistemin bugün fiilen **ne yaptığını** iş diliyle anlatır (kod değil).
> Amaç: eksik kalmış bir iş gereksinimi varsa **buradan yakalamak**. Sonundaki
> "Sistemde OLMAYAN şeyler" bölümü asıl kontrol listesidir.
>
> Kaynak: `docs/arsiv/PRD_V2.md` v2.2 *(C10'da arşive alındı — X-7)* + `docs/TRACEABILITY.md` (8 Ağustos 2026 denetimi).
> Teknik durum için `PROJE_DURUMU.md`'ye bak.
>
> **🔄 KARARLAR senkronizasyonu — 11.09.2026.** Bölüm 6'daki eksik listesi ve Bölüm 7'deki cevap
> bekleyen kararların tamamı Faz 0'da karara bağlandı. Kararlar burada **tekrarlanmaz**; her maddenin
> karşısına **durum + `KARARLAR.md` atfı** eklendi. Ana kitap KARARLAR'dır.
>
> **🔴 KARARLAR uyum denetimi — 13.09.2026.** Önceki tur yalnız Bölüm 6 ve 7'ye dokundu; oysa asıl
> sorun **Bölüm 1–5'teydi**. Bu bölümler sistemin *bugün ne yaptığını* doğru anlatıyor — ama
> anlattığı şeylerin bir kısmı **KARARLAR ile geçersizleşti** ve dosya bunu hiçbir yerde söylemiyordu.
> Bir okuyucu Bölüm 2.6'yı okuyup *"prim tahsilata bağlı"* diye anlıyor; KARARLAR X-1 §(7) ise
> **sevkiyat anı** diyor.
>
> Bu tur her ilgili bölüme **⛔ KARARLAR** kutusu kondu. Tam liste ve gerekçeler:
> **`FAZ1_UYGULAMA_KAPSAMI.md` §A** (**on üç** kalemlik geri çekme listesi — *15.09.2026'da **on beş**: GÇ-14, GÇ-15*).
>
> ⚠️ **Okuma kuralı:** Bölüm 1–5 **bugünün fotoğrafıdır**, hedef durum değil.
> Hedef durum KARARLAR'dadır.
>
> **📐 Belge sınıfı: 3 · Ayna** *(14.09.2026'da atandı — `YOL_HARITASI.md` §7.1-A).* Bu dosya
> canlıydı ama belge rejiminin hiçbir tablosunda yoktu; sınıfı olmayan dosyanın güncelleme
> tetikleyicisi ve bakım bütçesi de olmaz. **Tetikleyici: kod değişince** — karar değişince
> değil. Bir karar buradaki bir anlatımı geçersiz kılarsa yapılacak şey kararı buraya yazmak
> değil, **⛔ işareti + atıf** koymaktır.
>
> **🔄 16.09.2026 — PRD taraması (kod değişmedi, yalnız işaretler).** Bölüm 2.2, 2.3, 2.4 ve 2.6'ya
> ⛔/⬜ kondu. Kalkanlar: GÇ-16 prim dönem kapatma · GÇ-17 negatif stok reddi · GÇ-18 saklı toplamlar ·
> GÇ-19 siparişteki vade. Karar bekleyenler: X-13 sahiplik ve devir · X-14 prim oranı ·
> X-15 vade değişikliği ve telefon benzersizliği. *Aynı gün üçü de kapandı: davranışlar **korunur** (⬜ → ✅).*
>
> **🔄 15.09.2026 — KARARLAR X-8 · X-9 (kod değişmedi, yalnız ⛔ işaretleri).** **X-8:** bayi
> ayrı bir kanal ve ayrı tablolar olmaktan çıkıyor; `Doktor` (cari) tablosunda
> **`hesap_sinifi = BAYI`** satırı olur ve işlemleri genel belge akışlarıyla yürür → Bölüm 1,
> Bölüm 3 ve Bölüm 5'e ⛔ kondu. **X-9:** giriş deneme sayacı tablosu (`LoginAttempt`) kalkıyor —
> bu dosya o mekanizmayı anlatmadığı için burada işaret yok.

---

## 1. Aktörler

| Aktör | Sistemde | Ne yapar |
|---|---|---|
| **Admin** | `Role.ADMIN` | Ürün/fiyat, stok, satıcı, bayi, kongre tanımlar; tahsilat girer; prim dönemi kapatır; sevkiyat onaylar |
| **Satıcı** | `Role.SELLER` (~10 kişi) | Kendi doktorunu kaydeder, sipariş açar, kongre kaydı talep eder, primini izler |
| **Bayi** | `Role.DEALER` | Kendi panelinden sevkiyat talep eder; carisini/fiyatını **salt okur** |
| **Doktor** | Sistem kullanıcısı **değil** — bir varlık (`Doctor`) | Sipariş ve cari hesabın sahibi; kongre bakiyesi ona ait |

> Doktor sisteme **giriş yapmaz**. Tüm işlemler satıcı veya admin tarafından yapılır.

> ⛔ **KARARLAR — bu tablo Faz 1'de değişiyor (D-2 §3.4.a):**
> · Roller **`YONETICI` · `OPERASYON` · `SATICI`** olur; `Kullanici.rol` **kapalı katalog**
>   (yetki matrisi ekranı ve kullanıcı tanımlı rol **yapılmaz**).
> · **`OPERASYON` yeni bir roldür** — sipariş/sevkiyat/tahsilat girer; `StokDuzeltme`, fiyat
>   tanımı, tanım tabloları, kullanıcı yönetimi, **prim raporu** ve **dışa aktarım** yapamaz.
>   *Üç rolün asıl gerekçesi budur: iki rolde herkes yönetici olur ve B-7'nin kısıtı kaybolur.*
> · **Bayi bir cari tipidir, kullanıcı değildir** (GÇ-6). Bayi sisteme **giriş yapmaz**;
>   bayi işlemlerini firma girer. Bayi paneli **Faz 3+ opsiyonel modül, yalnız Sınıf 1**.
>   **15.09 — X-8:** bayi `Doktor` tablosunda **`hesap_sinifi = BAYI`** satırıdır; **satıcı atanmaz**.
> · **`MUSAVIR` rolü Faz 1'de yoktur** — müşavirin veri ihtiyacı **dışa aktarımla** karşılanır
>   ve veri **firma sahibinin eliyle** gider (C-2, D-5).
> · Doktorun kendi paneli **kalıcı kapsam dışıdır** (§3.5).

---

## 2. Uçtan uca akış — Satıcı kanalı (ana iş)

```
Ürün tanımı → Stok girişi → Doktor kaydı → Sipariş → Sevkiyat → Tahsilat
                                                          ├→ Mahsup (FIFO)
                                                          ├→ Doktor bakiyesi
                                                          ├→ Prim matrahı
                                                          └→ Kongre hak edişi
                                                                 ↓
                                          Ay sonu prim kapanışı · Kongre kaydı · 12 ay expiry
```

### 2.1 Ürün ve fiyat (Admin)

Her ürünün üç fiyat bilgisi var, hepsi **KDV hariç (net)** saklanır:

- **Net liste fiyatı** — referans satış fiyatı ⛔ *X-10 / GÇ-15: ürün kartından çıkar; varsayılan fiyat listesinin satırı olur, cariye ayrı liste atanabilir*
- **Net taban fiyat** — satıcının altına inemeyeceği sınır *(RULE-03)*
- **KDV oranı** — varsayılan %20, ürün bazında değiştirilebilir

Fiyat değişiklikleri denetim kaydına yazılır. **Geçmiş siparişleri etkilemez** — sipariş anındaki fiyat dondurulur *(RULE-04)*.

> ⛔ **KARARLAR — iki değişiklik:**
> · **Taban fiyat kalkıyor (GÇ-8).** A-10: *"İskonto üst sınırı yoktur"*, `pricing.iskontoTavani` = `null`.
>   Ü-3 §(10): satıcının elle fiyat girmesi **serbesttir**, **liste üstü satış da serbesttir** ve
>   **negatif iskonto** olarak işaretiyle kaydedilir. `liste_fiyat` daima `cozumleBirimFiyat()`
>   çıktısıdır; satıcının girdiği net fiyattan **`iskonto_oran` türetilir**.
>   **Sistem maliyet/geliş fiyatı tutmaz — kalıcı** (C-2 §4); yalnız **sapmayı** kaydeder ve
>   satıcı bazında raporlar.
> · **KDV oranı kolonu kalkıyor (GÇ-10).** C-6 §(2): `Urun.kdv_orani` decimal kolonu **konmaz**;
>   `Urun.vergi_orani_id` → **`VergiOrani` tanım tablosu** (NOT NULL). Mevzuat değişince
>   **satır eklenir, deployment gerekmez**. Tıbbi Cihaz Yönetmeliği kapsamındaki cihazlar
>   **%10** olabilir — "sabit %20" varsayımı C-6 ile geçersizleşti.
> · **İskonto oranı artık saklanmıyor (X-5 §(9)/(10)):** satırda `liste_fiyat` ve **`birim_fiyat`**
>   (satıcının girdiği net fiyat, **aynen**) durur; oran **gösterimde türetilir** ve kayıpsızdır.
>   Gerekçe somut: `Decimal(5,2)` ile liste 1.000,00 · giriş 873,45 → oran 12,66 → geri türetilen
>   fiyat **873,40**. **Satıcının doktora söylediği rakam ile cariye yazılan ayrışıyordu.**
>   Liste üstü satış ayrı işaret istemez — türetilen oran **negatif** çıkar.
> · **Barem eklendi (B-6):** `FiyatListesiSatir.min_adet` **alt sınır satırlarıyla**; üst sınır
>   tutulmaz; seçim `miktar >= min_adet` olan **en yüksek** satır. Barem **sipariş satırının
>   toplam miktarına** bakar; **kümülatif/dönemsel barem kalıcı kapsam dışıdır** (§0.4).

### 2.2 Stok (Admin)

Merkezî tek depo. Giriş/çıkış `StockMovement` olarak izlenir.
Stok **hiçbir koşulda eksiye düşemez** *(RULE-01)* — hem satıcı siparişi hem bayi sevkiyatı aynı stoğa yazar.
⛔ *GÇ-17 — B-4: negatif stok yumuşak kısıttır (engellenmez, izlenir).*

### 2.3 Doktor kaydı (Satıcı)

- Satıcı doktoru kaydeder → **sahiplik otomatik ona kilitlenir** *(RULE-02)*
- Telefon `+90XXXXXXXXXX` biçimine normalize edilir ve **benzersizdir** — aynı doktor iki satıcıya kaydedilemez
- Bir doktorun **aynı anda tek sorumlu satıcısı** olur
- Admin doktoru başka satıcıya **devredebilir** — tek tek ya da listeden **toplu** seçerek; devir geçmişi ve denetim kaydı tutulur
- **Devir sonrası eski siparişler eski satıcıda kalır** — primi de o alır
- Satıcı pasife alınırken yönetici doktorlarını **bir satıcıya devreder ya da bilerek sahipsiz bırakır** — seçim pasifleştirme formunda zorunludur, pasifleştirmeyi geciktirmez *(X-17)*
- Bayinin sorumlu satıcısı olmaz

> ✅ *16.09: sahiplik, görünürlük, devir ve pasif satıcı bugünkü gibi korunur (**X-13**).
> Telefon benzersizliği korunur (**X-15**).*
> ✅ *01.10: sahiplik tek noktadan değişir, devir topludur, pasif satıcının portföyü bekletilmez (**X-17**).*

### 2.4 Sipariş (Satıcı)

- Satıcı **yalnız kendi doktoruna** sipariş açabilir (sunucu tarafında zorlanır)
- Kalem bazında birim fiyat girilir; **taban fiyatın altı reddedilir**
- İskonto oranı hesaplanıp saklanır
- KDV **kalem bazında** yuvarlanır → Σ kalem = sipariş toplamı
  ⛔ *GÇ-18 — C-6 §(3): KDV ve toplamlar saklanmaz, türetilir.*
- Stok atomik olarak düşer; sipariş + kalemler + stok + hareket **tek transaction**
- **Vade tarihi** atanır: varsayılan +30 gün, admin üst sınır belirler (varsayılan 180)
- Admin vadeyi sonradan değiştirebilir → değişiklik geçmişi + denetim kaydı
  ⛔ *GÇ-19 — A-7: vade siparişte değil cari harekette, sevkiyattan işler.*
  ⛔ *Üst sınır — KARARLAR §2 madde 16: vadede sistem sınırı yok (GÇ-11).*
  ✅ *Değişiklik izli olarak korunur; yalnız yönetici (**X-15**).*

> ⛔ **KARARLAR — sipariş akışı genişliyor:**
> · **Teklif, siparişin ilk aşamasıdır** (A-5): `Siparis.asama` + `teklif_gecerlilik_tarihi`.
>   `TEKLIF` hiçbir hesaba girmez; `SIP` numarası `TEKLIF`'te doğar ve `ONAYLI`'da **değişmez**.
> · **Kısmi sevkiyat (A-3):** bir sipariş satırına **birden fazla sevkiyat** bağlanır ve
>   **doktor borcu ile satıcı primi sevkiyat anında doğar** — sipariş anında değil (GÇ-12).
> · **Bedelsiz/numune satırı (A-2):** `OrderItem` düzeyinde bayrak + **zorunlu sebep**;
>   stoktan düşer, cariye borç yazmaz, prim/hakediş üretmez, **matrah 0 / KDV 0**.
> · **Onay bloğu (A-8):** belge kaydı engellenmez; açık blok yalnız **sonuç doğuran adımı**
>   durdurur. Gerekçe **her durumda zorunludur**.
> · **Negatif stok artık yumuşak kısıttır** (B-4) — sert red değil; aşım **yetki + gerekçe + log**
>   ile geçilir.
> · **Her belge `belge_no` + `guncelleme_tarihi` taşır** (K-4 §1, A-14); numara **tek
>   `uretBelgeNo(onek, tx)`** ile, satır kilidiyle ve **belgeyi yazan transaction içinde** alınır.
>   **`MAX(belge_no)+1` yasaktır.**

### 2.5 Tahsilat (Admin) — sistemin kalbi

Bir tahsilat kaydı **tek transaction içinde dört şeyi birden** tetikler *(RULE-12)*:

| # | Etki | Nasıl |
|---|---|---|
| 1 | **Mahsuplaşma** | FIFO — **vadesi en eski sipariş önce** kapatılır |
| 2 | **Doktor bakiyesi** | Mahsup satırlarından türetilir (saklanmaz) |
| 3 | **Prim matrahı** | Tahsil edilen tutarın **KDV hariç** kısmı |
| 4 | **Kongre hak edişi** | Net matrah üzerinden `EARN` satırı |

Herhangi biri hata verirse **hepsi geri alınır**.

- **Kısmi tahsilat** desteklenir — prim ve kongre **orantılı** işler
- **Fazla ödeme** desteklenir → mahsup edilmeyen kısım **avans** olarak kalır
- Tahsilat **iptal edilebilir** → ters kayıtlar üretilir
- **Yaşlandırma:** 0 / 1-30 / 31-60 / 61-90 / 90+ gün kovaları

> ⛔ **KARARLAR — RULE-12'nin dört bileşeninden üçü düşüyor. Bu bölüm en çok değişen yerdir.**
> · **(1) Mahsuplaşma (GÇ-3):** A-7 *"kalıcı kalem kapatma tablosu açılmaz"*, K-2 *"ayrı avans
>   kaydı tutulmaz, cari bakiye tek ve işaretli"*, X-1 §(7) *"hangi tahsilatın hangi sevkiyatı
>   kapattığı sistemde yoktur"*. **Avans, bakiyenin yönüdür — ayrı bir kayıt değil.** Ekranda
>   **çıplak negatif sayı gösterilmez**, yön etiketiyle sunulur.
> · **(3) Prim matrahı (GÇ-1):** hakediş **sevkiyat anında** doğar (A-3); **tahsilat bazlı prim
>   kalıcı kapsam dışıdır** (X-1 §(7)).
> · **(4) Kongre hak edişi (GÇ-4):** mekanizmanın tamamı kaldırılıyor (K-6 §(2)).
> · **Geriye kalan:** tahsilat kaydı + cari hareket, **tek transaction**.
>
> **Eklenenler:**
> · **`OdemeYontemi` zorunlu** (A-11): `tip` kapalı katalog `NAKIT`/`BANKA`/`POS`;
>   `komisyon_oran` ve `valor_gun` **kayda kopyalanır ve donar**; **komisyon cariye dokunmaz**;
>   **kasa/banka bakiyesi tutulmaz**.
> · **Nakit tevsik uyarısı (A-15):** aynı cari + aynı gün + `tip = NAKIT` toplamı limiti aşarsa
>   **bilgi kademesi uyarısı**. Kayıt **engellenmez**, `OnayBlogu` üretilmez, şemaya hiçbir alan
>   eklenmez. **Sistem hiçbir zaman "uygundur" demez.**
> · **Yaşlandırma ⛔ Faz 2+'ya taşındı (X-6 §(5)).** Faz 1'de ekranda **iki şey** vardır:
>   `hesaplaDoktorBakiye()` çıktısı (tek işaretli, brüt, **yön + taban etiketli**) ve
>   **bilgi kademesi uyarısı**: *"vadesi geçmiş hareket var"* + **en eski vade tarihi**
>   (kural kodu `VADESI_GECMIS_HAREKET`).
> · 🔴 **Vadesi geçmiş TUTAR gösterilmez — kalıcı (X-6 §(7)).** *"X TL vadesi geçmiş"* demek
>   tahsilatı belgelere dağıtmayı gerektirir; dağıtım hem tablo hem **runtime** olarak yasaktır.
>   *Maddenin en kolay ihlal edilecek yeri burasıdır: ekranda bir sayı istemek doğaldır ve
>   o sayı ancak yasaklanan mekanizmayla üretilebilir.*
> · **"Otomatik mahsup" bir mekanizma değil, aritmetiktir (X-6 §(4)):** negatif bakiye varken
>   yeni borç doğduğunda bakiye kendiliğinden azalır. **Mahsup eden bir kod veya tablo yoktur.**

### 2.6 Prim (Satıcı hak edişi)

> ⛔ **KARARLAR — bu bölümün tanımı değişti (X-1, §5.1). En kritik iş kuralı değişikliğidir.**
> · **Hakediş doğuşu = sevkiyat anı** (A-3), taban **matrah** (C-6 §6). **Değişmez.**
> · **Hakediş ödemesi = müşterinin kararı**, sistemin dışında. Sistem **"ödenebilir prim" sayısı
>   üretmez**; tahsilata bağlı prim **hesaplanamaz** (hangi tahsilatın hangi sevkiyatı kapattığı
>   sistemde yok — K-2, A-7). *Tahminî bir sayı üretmek, üretmemekten kötüdür.*
> · **Dönem zorunlu bir aralık parametresidir**, `[başlangıç, bitiş)` yarı açık (E-1 §4);
>   `getSellerReports(kullanici, { baslangic, bitis })`. "Tüm zamanlar" **bilinçli seçimdir**.
> · **"Tahsilat oranı" metriği kaldırıldı — kalıcı** (GÇ-2). Yerine **iki mutlak sayı**,
>   tabanı ekranda yazılı: **dönem cirosu (matrah, sevkiyat bazlı)** ve **dönem tahsilatı (brüt)**.
>   Bölme yapılmaz.
> · **Prim bir ücret ekidir** (İş K. md. 32) → **geriye dönük eksilten rapor üretilmez**;
>   iade/iptal ters kaydı **kendi belge tarihinde** doğar, kapanmış dönemi değiştirmez.
> · **`OPERASYON` prim raporunu görmez**; `SATICI` yalnız kendi verisini **ekranda** görür,
>   **dosya olarak indiremez** (D-5 §(4)).
> · Teyit metnine **10. madde** eklendi: ödeme zamanı ve tutarı müşterinin kararıdır.

- **Dönem = takvim ayı** ⚠️ *(X-1: dönem artık zorunlu aralık parametresi)*
- **Matrah = o dönemde TAHSİL EDİLEN tutar, KDV hariç** *(sipariş açılışı değil — tahsilat)*
  ⛔ **GÇ-1: sevkiyat anında doğan matraha dönüyor**
- Varsayılan oran %5; satıcı bazında farklı oran tanımlanabilir ✅ *korunur (**X-14**); uygulanan oran sevkiyata donar*
- Ay kapatılınca **matrah/oran/tutar dondurulur ve bir daha değişmez** *(RULE-05)*
- Kapanmış döneme ait bir tahsilat sonradan iptal edilirse → **sonraki döneme negatif düzeltme**
- Durum akışı: `HESAPLANDI → ONAYLANDI → ÖDENDİ`
  ⛔ *GÇ-16 — X-1 kapsam dışı: dönem kapatma, onay iş akışı ve ödeme kaydı kalkar; ters kayıt kendi tarihinde doğar.*
- Satıcı kendi panelinde ay içi tahsilatını, tahmini primini ve "sipariş açıldı ama henüz tahsil edilmedi" tutarını ayrı ayrı görür
- **Kongre harcaması primi etkilemez** — iki sistem birbirinden bağımsız

### 2.7 Kongre bakiyesi (doktor hak edişi)

> ⛔ **KARARLAR — bu bölümün tamamı geçersiz (K-6/C-4, §1.7). En pahalı Faz 0 bulgusudur.**
> Tıbbi Cihaz Satış, Reklam ve Tanıtım Yönetmeliği **md. 22**, bir cihazın alınması veya
> kullanılması karşılığında sağlık meslek mensuplarına maddî kazanç **veya ödül sözü** verilmesini
> yasaklıyor. *"Doktor bütçesi = alım/tahsilat"* kuralı tam olarak bunun tarifidir — üstelik
> otomatik olduğu için **vaadin ispatı da sistemin içindedir**. İkinci ve bağımsız itiraz:
> kural §0.4'ün yasakladığı **kümülatif birikim hesabıdır**.
>
> **Sonuç:**
> · **Alımdan/tahsilattan bütçe türetme kaldırıldı.** FIFO kredi lotu, 12 aylık geçerlilik,
>   `EARN`/`SPEND`/`EXPIRE`/`ADJUST` defteri ve iptalde lota iade **gereksizleşir ve silinir**.
> · **Doktorda hiçbir hak, bakiye veya kredi doğmaz** — doktor kartında teşvik bakiyesi gösteren
>   **hiçbir alan bulunmaz** (GÇ-5).
> · Modülün yeni tanımı: **ödül motoru değil, uyum kütüğü**. Kayıt birimi doktorun bakiyesi değil,
>   **etkinlik + katılımcıdır**.
> · Bütçe sahibi **satıcı · bölge · kampanya** + dönem (`PazarlamaButcesi`); **elle atanır**,
>   hiçbir satış verisinden türetilmez; her tahsis **zorunlu gerekçe** taşır.
> · Sayaç ikiye ayrılır: **bizim verdiğimiz yıllık destek (2)** ve **yurt dışı (2)** sayılabilir →
>   **yumuşak kısıt**; **doktorun tüm firmalardan aldığı toplam (4) doğrulanamaz** → sayaç tutulmaz.
> · Bildirim alanları **salt kayıt alanıdır**; **sistem TİTCK'ya bildirim göndermez — kalıcı**.
> · **Hukuki görüş opsiyonel değildir**; görüş gelene kadar modül **kapalı teslim edilir**
>   (`modules.congress = false`) ve açılacaksa **yeniden yazılır, ayrı kalem olarak fiyatlanır**.
> · **"Bu mimari sizi korur" denmez** — uyum taahhüdü verilmez (C-3 §5).
>
> Aşağıdaki anlatım **bugünün kodudur**, hedef değil:

Tahsilata bağlı bir **hak ediş defteri**. Doktor adına birikir, kongre katılım paketi olarak harcanır.

| Hareket | Ne zaman | Etki |
|---|---|---|
| `EARN` | Tahsilat yapıldığında | Net matrah kadar bakiye eklenir, **+12 ay** son kullanma |
| `SPEND` | Kongre kaydı onaylandığında | **FIFO** — en eski kazanımdan düşer |
| `EXPIRE` | 12 ayı dolduğunda | Kalan bakiye sıfırlanır |
| `ADJUST` | Admin manuel düzeltmesi | Gerekçe + denetim kaydı zorunlu |

- **Rolling 12 ay** — takvim yılı sonu değil, kazanım gününe göre (29 Şubat → 28'e kırpılır)
- Satıcı kongre kaydı **talep eder** → bakiye **rezerve** edilir → admin **onaylar** → kesinleşir
- **Aynı bakiye iki pakete aynı anda harcanamaz** *(RULE-09)*
- Bakiye yetersizse **sert red** + eksik tutar gösterilir — sistem üzerinden fark ödemesi yok
- Kayıt iptal edilirse bakiye iade edilir ama **son kullanma tarihi uzamaz**
- Harcama **kısmi olamaz** — paket ya tam karşılanır ya reddedilir *(RULE-11)*

---

## 3. Uçtan uca akış — Bayi kanalı

Satıcı kanalından **tamamen ayrı** bir ticari ilişki. ⛔ *X-8: Faz 1'de ayrı kanal olmaktan çıkar — aşağıdaki kutu.*

```
Bayi tanımı → Bayi fiyat listesi → Sevkiyat talebi → Admin onayı → Bayi ödemesi
                                    (stok/cari                (stok düşer,
                                     DEĞİŞMEZ)                 cariye borç)
```

> ⛔ **KARARLAR (D-2 §(6), §1.3 §D-14):** Bayi **cari tipidir, kullanıcı değildir** (GÇ-6).
> Bayi sisteme **giriş yapmaz**; sevkiyat talebi dâhil bütün bayi işlemlerini **firma girer**.
> **Bayi paneli Faz 3+ opsiyonel modül, yalnız Sınıf 1** — dış kullanıcı, internete açık hesap,
> parola sıfırlama ve destek yükü getirir. **Faz 1'de bayi carisine `Kullanici` bağlanmaz.**
> Aşağıdaki ticari akış (fiyat listesi, sevkiyat, ödeme, cari) **çekirdekte kalır**;
> giden tek şey **panel ve `DEALER` rolüdür**.
>
> ⛔ **KARARLAR X-8 (15.09.2026) — yukarıdaki kutunun son cümlesi artık eksik.** Giden şey yalnız
> panel değil, **bu bölümün anlattığı ayrı kanalın kendisidir**:
> · Beş `Dealer*` tablosu kalkar; bayi `Doktor` satırıdır (`hesap_sinifi = BAYI`).
> · Sevkiyat talebi → onay akışı **yoktur**; bayi siparişi ve sevkiyatı doktorunkiyle **aynı
>   belgelerdir** (`SIP`/`SVK`/`IAD`/`THS`). Onaysız talebin karşılığı **teklif aşamasıdır** (A-5).
> · Bayi cari bakiyesi ayrı formülle değil **tek `hesaplaDoktorBakiye()`** ile hesaplanır (K-2).
> · *"Bayi × ürün sabit fiyat"* ve *"listede olmayan ürün sevk edilemez"* **X-10 ile yaşar**: bayiye
>   atanan fiyat listesi; listede satırı olmayan ürün satıra girmez, varsayılan listeye düşülmez.
> · *"Tamamen reddedilir (kısmi sevk yok)"* ifadesi de değişir — kısmi sevkiyat A-3 ile geliyor.
> · *"Bayi prim ve kongreye dahil olmaz"* **kalır**: `BAYI` sınıfına satıcı atanmaz, prim doğmaz.
>
> ⚠️ Ayrıca **bayi deposu ayrı bir mekanizma değildir** — `StokKonum` satırıdır (B-4).

- Admin bayiyi tanımlar, opsiyonel olarak **panel hesabı** açar ⛔ GÇ-6
- **Bayi × ürün** bazında sabit net fiyat listesi; **fiyat listesinde olmayan ürün sevk edilemez** *(RULE-06)*
- Fiyat değişikliği **geçmiş sevkiyatları etkilemez** (snapshot)
- Bayi kendi panelinden **sevkiyat talebi** oluşturur → `TALEP` durumunda **stok ve cari değişmez**
- Admin onaylar → stok düşer + cariye borç yazılır, **tek transaction**
- Stok yetersizse sevkiyat **tamamen** reddedilir (kısmi sevk yok)
- Sevkiyat iptalinde stok geri döner, borç geri alınır
- Bayi cari = Σ sevkiyat (iptal hariç) − Σ ödeme
- Bayi kendi verisi dışında **hiçbir şey göremez**; sipariş veremez, fiyat değiştiremez
- **Bayi prim ve kongreye hiç dahil olmaz** *(RULE-15)*

---

## 4. Para ve KDV mantığı

- Tüm parasal alanlar **tam sayı kuruş** olarak saklanır (ondalık yuvarlama hatası yok)
- **Kanonik saklama net (KDV hariç)** — brüt hesaplanır
- **KDV kalem bazında yuvarlanır**, sipariş toplamında değil → "kalemler toplamı ≠ sipariş toplamı" sorunu yapısal olarak imkânsız
- Ekranlarda **KDV Dahil / KDV Hariç** seçeneği; tercih çerezde hatırlanır
  *(bugün yalnız 2 ekranda — bkz. eksikler)*
- **Cari bakiyeler saklanmaz, her seferinde hesaplanır** *(RULE-08)* — tek gerçek kaynak

> ⛔ **KARARLAR (Ü-3, §5.3) — toggle gidiyor, yerine taban etiketi geliyor (GÇ-9):**
> · Tercih **kurulum düzeyidir**, kullanıcı toggle'ı değil. **Kullanıcı başına tercih, ekran
>   başına hafıza ve tarayıcı/çerez saklaması yoktur** — her toggle test matrisini ikiye katlar.
> · **Müşteri beyanı (09.09.2026):** yayınlanan fiyat listeleri **KDV hariçtir**, indirim
>   **adet baremlidir**, KDV sonradan eklenir → `pricing.fiyatGirisiKdvDahil` **`false` kalır ve
>   AÇILMAZ**. Çeviri katmanı, ekranı ve **ikinci yuvarlama noktası Faz 1'de yazılmaz**.
> · **Toggle'ın yerini alan kural: taban etiketi zorunludur.** Ekranda görünen **her para
>   tutarının** yanında tabanı yazılıdır — *KDV hariç* / *KDV dahil*. **Tek kolonda iki farklı
>   tabanlı tutar gösterilmez** (karma kolon yasağı).
> · **B sınıfı ekranlarda toggle kalıcı olarak yoktur** (doktor detayı, cari bakiye, cari ekstre,
>   tahsilat, risk/kredi limiti — daima **brüt**): bakiye `ACILIS` ve `VADE_FARKI` hareketlerini
>   içerir, ikisi de **KDV kırılımı taşımaz** → toggle açılırsa sistem **eksik veriden bir sayı
>   uydurur**.
> · **C sınıfı ekranlarda da kalıcı olarak yoktur** (prim, hakediş, dönem cirosu — daima **matrah**).
> · **A sınıfı belge toplamı üç satırdır: Matrah · KDV · Genel Toplam** — üçü **aynı anda** görünür.
> · **Dışa aktarım toggle tanımaz**; veri seti kolonlarının tabanı sabittir.
> · **Tabanı çözülemeyen tutar ekranda boş kalır** — sıfır veya son fiyat gösterilmez (B-5).
>
> ✅ **Değişmeyen:** kanonik taban **KDV hariç**, satır bazlı yuvarlama, **belge toplamı = Σ satır**.
> Faz 1'de tümü tek `hesaplaSatirTutarlari()` altında toplanır; **inline `fiyat * miktar` yasaktır**.

---

## 5. Değişmez kurallar (RULE) — özet

> **⚠️ 13.09.2026:** Üçüncü kolon eklendi. *"Değişmez"* sıfatı bu kurallar için artık koşulludur —
> beşi KARARLAR ile **geçersizleşti**, üçü **yeniden tanımlandı**. Gerekçeler:
> `FAZ1_UYGULAMA_KAPSAMI.md` §A.

| # | Kural | KARARLAR durumu |
|---|---|---|
| 01 | Stok hiçbir koşulda eksiye düşemez | ⚠️ **yeniden tanımlandı** — B-4: negatif stok **yumuşak kısıt** (yetki + gerekçe + log ile aşılır) |
| 02 | Bir doktora aynı anda tek satıcı | ✅ geçerli |
| 03 | Satış fiyatı taban fiyatın (net) altına inemez | ⛔ **geçersiz (GÇ-8)** — A-10: iskonto tavanı `null`; Ü-3 §(10): **liste üstü satış da serbest**, negatif iskonto |
| 04 | Sipariş anındaki fiyat/KDV/tutar dondurulur | ✅ geçerli — C-6 §(2-a) ile güçlendi (`OrderItem.kdv_orani` **değer olarak** donar) |
| 05 | Kapanmış prim dönemi asla değişmez | ✅ geçerli — X-1 §(6): ters kayıt **kendi döneminde** doğar |
| 06 | Fiyat listesinde olmayan ürün bayiye sevk edilemez | ✅ geçerli — **biçim değişir (X-10)**: carinin atanmış fiyat listesinde satır yoksa fiyat çözümlenmez, varsayılan listeye düşülmez; artık **bütün carilere** uygulanır |
| 07 | Kongre bakiyesi negatife düşürülerek harcanamaz | ⛔ **konusuz (GÇ-4)** — doktor bazlı bakiye yok (K-6 §(4)) |
| 08 | Bakiyeler ayrı kolonda tutulmaz, hesaplanır | ✅ geçerli — K-2 ile güçlendi: **tek işaretli bakiye**, tek fonksiyon, `tarih?` parametreli |
| 09 | Aynı bakiye iki pakete aynı anda kullanılamaz | ⛔ **konusuz (GÇ-4)** |
| 10 | Parasal alanlar tam sayı kuruş; kanonik net | ⛔ **ilk yarısı geçersiz (X-5)** — parasal alanlar **`Decimal`**; ölçek kodda değil **şemada**. *Kanonik net yarısı ✅ geçerli (C-6 §3)* |
| 11 | Kongre harcaması FIFO; kısmi harcama yok | ⛔ **konusuz (GÇ-4)** |
| 12 | Tahsilat: mahsup + bakiye + prim + kongre tek transaction | ⚠️ **dört bileşenin üçü düştü** (GÇ-1/GÇ-3/GÇ-4); transaction sınırı kuralı ✅ kalır |
| 13 | Kritik değişiklikler istisnasız denetim kaydına | ✅ geçerli — C-3 §4 KVKK md.12 teknik tedbir karşılığı; F-07 ile *istisnasız* hâle gelir |
| 14 | Bayi yalnız kendi verisi; onaysız talep stok/cari etkilemez | ⛔ **konusuz (GÇ-6 + X-8)** — bayi giriş yapmıyor; ayrı talep mekanizması da kalkıyor. İlkenin karşılığı **A-5**: teklif aşamasındaki sipariş stok/cariye dokunmaz |
| 15 | Bayi prim/kongreye hiç dahil olmaz | ✅ geçerli — **biçim değişir (X-8 §(3))**: `BAYI` sınıfına satıcı atanmaz, bu yüzden prim doğmaz |

**KARARLAR'ın eklediği, bu listede olmayan çekirdek kurallar:**

| Kural | Kaynak |
|---|---|
| Sistemde **`DELETE` cümlesi kullanılmaz**; kullanım dışı = `aktif = false` | §0.2, C-3 §(1) |
| **Kayıt geriye dönük düzeltilmez**, ters kayıtla kapatılır | §0.2 |
| **Hesaplar belge bazlıdır** — dönemsel birikime bakan hesap yapılmaz | §0.4 |
| **Taban etiketi zorunludur** — tabanı yazılmayan tutar gösterilmez | Ü-3 §(6), §0.4 |
| **Payı ve paydası farklı olan oran gösterilmez** | X-1, §0.4 |
| **"Gün" daima `Europe/Istanbul` takvim günüdür**; aralıklar yarı açık `[b, s)` | E-1 |
| **İş hatası `throw` edilmez** — dönüş değeriyle bildirilir | X-4 §(2) |
| **Sessiz hata yasağı** — `catch` içinde hatayı yutup başarı dönmek yasak | X-3 §(4) |
| **Uyarı yutma yasağı** — hepsi döner, **en yüksek kademe akışı belirler** | X-4 §(7) |
| **Tek çağrı noktası listesi 11'de kapalıdır**; modül ekleme yapamaz | §4, §1.3 §B-9 |
| **`MAX(belge_no)+1` yasaktır**; numara satır kilidiyle ve belge transaction'ında alınır | A-14 §(3) |
| **Dışa aktarımda inline `where` yasaktır**; sayılan belgeler filtresi zorunlu | K-4 §2 |
| **En az bir aktif `YONETICI` kalmak zorundadır**; kullanıcı kendi hesabını pasifleştiremez | E-2 §(7) |

---

## 6. 🔍 SİSTEMDE OLMAYAN ŞEYLER — kontrol listesi

**Bu bölüm asıl gözden geçirmen gereken yer.** Her madde için tek soru: *"Anka West bunu
yapıyor mu? Yapıyorsa sistem olmadan nasıl idare edecek?"*

> **✅ Faz 0 durumu (11.09.2026) — hepsi karara bağlandı.** Aşağıdaki tablolar özgün "neden sorabilir"
> gerekçesini korur; **kararın kendisi `KARARLAR.md`'dedir**. Durum haritası:
>
> | Madde | Durum | Nereye bakılır (KARARLAR) |
> |---|---|---|
> | **A-1** Mal iadesi / kısmi iade | ✅ karara bağlandı — iade **ayrı belge**, orijinal sipariş değişmez; oran kadar cari alacak + ters kayıt | §3.1 · K-1 §1.1 |
> | **A-2** Numune / bedelsiz ürün | ✅ karara bağlandı — `OrderItem` **bayrak + zorunlu sebep**, tutar 0, stoktan düşer | §3.1 |
> | **A-3** Kısmi sevkiyat | ✅ karara bağlandı — bir satıra çok sevkiyat; borç/prim sevkiyat anında | §3.1 |
> | **A-4** Konsinye stok | ✅ karara bağlandı — `StokKonum` + `konum_id`; `KonsinyeCikis` mali sonuçsuz | §3.1 |
> | **A-5** İhale / teklif süreci | ✅ karara bağlandı — teklif = siparişin ilk **aşaması** (`asama`); ihale ⚪ | §3.1 |
> | **A-6** Açılış bakiyesi | ✅ karara bağlandı — `ACILIS` tipli tek hareket, `ACL` serisi | §3.1 |
> | **A-7** Vade farkı / gecikme faizi | ✅ karara bağlandı — otomatik hesaplanmaz; `VADE_FARKI` yalnız elle | §3.1 |
> | **A-8** Sipariş onay akışı | ✅ karara bağlandı — `OnayBlogu`, tek yetki seviyesi (yönetici) | §3.1 |
> | **A-9** Cari hesap sahibi tipi *(yeni)* | ✅ 09.09 — **tek tip: `Doktor`**; `Kurum` tablosu ve `Doktor.kurum_id` **konmaz**; aynı VKN tekrarına kısıt yok; klinik konsolidasyonu **ayrı fiyatlı yükseltme** | §3.1 · §1.3 §E |
> | **A-10** İskonto / özel fiyat yetkisi *(yeni)* | ✅ karara bağlandı — **iskonto üst sınırı yoktur** (`pricing.iskontoTavani` = `null`); satırda **`liste_fiyat` + `birim_fiyat`** saklanır, **`iskonto_oran` türetilir** (⚠️ **X-5 §(10) düzeltmesi, 14.09.2026** — özgün metin *"`liste_fiyat` + `iskonto_oran` ayrı saklanır"* diyordu); iskonto **satır bazında** | §3.1 · **X-5** |
> | **A-11** Ödeme yöntemi / tahsilat kanalı *(yeni)* | ✅ karara bağlandı — `OdemeYontemi` **tanım tablosu**; `tip` kapalı katalog; komisyon ve valör **kayda donar**; **kasa/banka bakiyesi yok** | §3.1 |
> | **A-12** Kredi / risk limiti *(yeni)* | ✅ karara bağlandı — `Doktor.kredi_limiti` nullable; `hesaplaDoktorRisk()`; **bu fazda bilgi kademesi**; taban **brüt** | §3.1 |
> | **A-13** Doktor kartı vergi kimliği ve fatura adresi *(yeni)* | ✅ 19.08 — tek `vkn_tckn` + `cari_tip` + `fatura_*` seti, hepsi nullable; doğrulama **hane sayısından**; **belgeye kimlik dondurulmaz** | §3.1.a |
> | **A-14** Belge numaralandırma *(yeni)* | ✅ 19.08 — `{ÖNEK}-{YIL}-{SIRA}`; `BelgeSayac` + satır kilidi; tek `uretBelgeNo()`; **`MAX+1` yasak**; numara oluşumda doğar, iptalde kalır | §3.1.b |
> | **A-15** Nakit tahsilatta tevsik uyarısı *(yeni)* | ✅ 08.09 — bilgi kademesi, `finance.nakitTevsikLimiti`, şemaya etkisiz | §3.1.c |
> | **B-1** Lot / seri / SKT | ✅ **kapsam dışı** (K-5); izlenebilirlik paketi **ertelendi** (K-10) | §3.2 · §1.2 (K-5) · §1.4 (K-10) |
> | **B-2** ÜTS bildirimi | ✅ **kapsam dışı** (K-5); ÜTS **ertelendi**, kalıcı değil (K-10) | §3.2 · §1.4 (K-10) |
> | **B-3** Barkod / GTIN | ✅ karara bağlandı — kapsam dışı, sigorta kolonu **konmaz** | §3.2 |
> | **B-4** Çoklu depo | ✅ karara bağlandı — şemada **zaten destekli**, mod/toggle yok; `hesaplaStok()` tek kapı | §3.2 |
> | **B-5** Fiyat listesi dönemselliği | ✅ karara bağlandı — `gecerli_baslangic/bitis`, ekran **Faz 2** | §3.2 |
> | **B-6** Miktar baremi / mal fazlası *(yeni)* | ✅ karara bağlandı — barem + MF ayrı mekanizma; fiyat dondurulur | §3.2 |
> | **B-7** Stok düzeltme *(yeni)* | ✅ 29.08 — `StokDuzeltme`+`DZL`, `StokDuzeltmeSebep` tanım tablosu | §3.2.a |
> | **C-1** e-Fatura / e-İrsaliye | ✅ *(09.10 — iç karar, 🟦 kalktı)* — sistem e-belge üretmez (kalıcı); `harici_irsaliye_no` tek alan; entegrasyon **çekirdek sonrası ilk modül** *(10.10)*, ayrı fiyatlı; modül çekirdeği yalnız okur, fatura tutarını değiştiremez *(12.10)*; teyit metni canlıya geçiş ön koşulu | §3.3.c |
> | **C-2** Muhasebe programına aktarım | ✅/🟦 — muhasebeleştirme yapılmaz; sorumluluk ham veri düzeyinde; `tarih?` param | §3.3.d · §0.8 |
> | **C-3** KVKK saklama / silme | ✅ 19.08 — Faz 1 `DELETE` yok + asgari tedbir; anonimleştirme Faz 2; periyodik imha Faz 3 | §3.3.a |
> | **C-4** Kongre modülü hukuki görüş | ✅ karara bağlandı — hukuki görüş **zorunlu**; modül uyum kütüğü, kapalı teslim | §1.7 (K-6) |
> | **C-5** Çoklu para birimi | ✅ karara bağlandı — kapsam dışı, sistem tamamen TL; sigorta kolonu konmaz | §3.3 |
> | **C-6** KDV / verginin tabanı *(yeni)* | ✅ 19.08 — `VergiOrani` tanım tablosu, kanonik taban KDV hariç | §3.3.b |
> | **D-1** Bildirim (e-posta/SMS) | ✅ karara bağlandı — **opsiyonel modül**; Faz 1 boş olay noktaları, kademe 1 Faz 2, kademe 2 Faz 3 | §3.4 |
> | **D-2** Rol granülerliği | ✅ 07.09 — **üç rol kapalı katalog** (`YONETICI`/`OPERASYON`/`SATICI`), MUSAVIR yok, bayi cari tipi | §3.4.a |
> | **D-3** Kargo takip entegrasyonu | ✅ karara bağlandı — `KargoFirma` tanım tablosu, Faz 1 görünür; API ~~Faz 3~~ **e-belge modülünden sonra, müşterinin kendi kargo anlaşmasıyla (BYOI)** *(10.10)* | §3.4 |
> | **D-4** Satıcı hedefi / kotası | ✅ karara bağlandı — ertelenir; prim yalnız ciro; hedefe bağlama **kalıcı kapsam dışı** | §3.4 |
> | **D-5** Excel dışa aktarım (Ü-5) | ✅ 09.09 — **altı veri seti**, yalnız `YONETICI`, her aktarım loglanır ⚠️şema | §3.4.b |
> | **D-6** Toplu veri girişi (import) | ✅ karara bağlandı — üç aşamalı (doğrula→önizle→yaz), parti no, geri alınabilir | §3.4 · §1.9 (K-7) |
>
> | **§1.3** Modülerlik *(yeni)* | ✅ 09.09 — modül = **klasör + bayrak**; bağımlılık **tek yönlü**; çekirdek tabloda modül kolonu/FK **yok**; **katalog çekirdektedir**; modül **fiyata dokunamaz**; modül yazılmadan **tablosu da yazılmaz** | §1.3 |
> | **K-8** Ticari model *(yeni)* | ✅/🟦 07.09 — hibrit **üç kalem**; kullanıcı ve belge adedi başına fiyatlama **kalıcı yasak**; **K-8 koda hiçbir şey eklemez** | §1.8 |
> | **K-9** Sunucu ve barındırma *(yeni)* | ✅/🟦 19.08 — **Türkiye zorunlu**, müşteri başına **izole veritabanı**, `tenant_id` **konmaz**; yedek 14/8/12 + **3 ayda bir geri dönüş testi**; `modulAcikMi()` tek okuma noktası | §1.6 |
>
> Yeni doğan teslim/denetim maddeleri (**X-1** satıcı raporu · **X-2** `recordDealerPayment`
> transaction — 🔴 **BLOCKER** · **X-3** hata yüzeyi · **X-4** hata/uyarı sözleşmesi ·
> **Ü-3** KDV taban etiketi · **E-1** zaman dilimi · **E-2** hesap yaşam döngüsü ·
> **E-3** dosya eki) bu listede yoktu; ayrıntı için `KARARLAR.md` §5 ve §1.3.
>
> ⚠️ **13.09.2026 notu:** Yukarıdaki "✅ karara bağlandı" işaretleri **kararın verildiğini**
> gösterir, **uygulandığını değil**. Kod tarafında hiçbiri yazılmadı — Faz 0'da kod yazılmadı.
> Uygulama dökümü: `FAZ1_UYGULAMA_KAPSAMI.md`.

### 6.1 Ticari akış boşlukları

| # | Yok olan | Neden sorabilir |
|---|---|---|
| A-1 | **Mal iadesi / kısmi iade** | Sipariş **tamamen** iptal edilebiliyor, ama "700 adetin 50'si hasarlı geldi, iade" akışı yok. Stok geri dönüşü, cari düzeltmesi, prim etkisi tanımsız |
| A-2 | **Numune / bedelsiz ürün** | Medikalde çok yaygın. Stoktan düşmeli ama ciro/prim/kongre üretmemeli. Bugün her çıkış satıştır |
| A-3 | **Kısmi sevkiyat** | 700 adetlik siparişin 300'ü bugün, 400'ü sonra sevk edilebiliyor mu? Bugün sipariş tek parça |
| A-4 | **Konsinye stok** | Doktorda/hastanede duran, henüz satılmamış ürün. Distribütörlerde yaygın |
| A-5 | **İhale / teklif süreci** | Hastane ihalesi varsa teklif→kazanma→sipariş zinciri yok |
| A-6 | **Açılış bakiyesi** | Canlıya geçerken doktorların mevcut borcu nasıl girilecek? Bugün "bakiye" kavramı yok, hesaplanıyor — açılış için sahte sipariş üretmek gerekir |
| A-7 | **Vade farkı / gecikme faizi** | Geç ödeyen doktora faiz uygulanıyor mu? |
| A-8 | **Sipariş onay akışı** | Satıcı sipariş açar açmaz kesinleşiyor. Yüksek iskontolu siparişte yönetici onayı gerekiyor mu? |

### 6.2 Ürün ve stok

| # | Yok olan | Neden sorabilir |
|---|---|---|
| B-1 | **Lot / seri no / son kullanma tarihi** | Tıbbi cihaz/sarfta genelde zorunlu. Geri çağırma (recall) durumunda "hangi lot kime gitti" sorusuna sistem cevap veremez |
| B-2 | **ÜTS bildirimi** | Ürünler ÜTS kapsamındaysa TİTCK'ye tekil bildirim zorunluluğu var. Şema buna hazır değil |
| B-3 | **Barkod / GTIN** | Depo operasyonu elle giriyor |
| B-4 | **Çoklu depo** | Tek merkezî depo varsayımı |
| B-5 | **Fiyat listesi dönemselliği** | Bugün ürünün tek güncel fiyatı var; "1 Ocak'tan itibaren geçerli yeni liste" tanımlanamıyor |

### 6.3 Mali ve yasal

| # | Yok olan | Neden sorabilir |
|---|---|---|
| C-1 | **e-Fatura / e-İrsaliye** | Bilinçli ertelendi (D-24). Sistem fatura **kesmiyor** — muhasebe programına da veri **aktarmıyor**. Çift veri girişi doğar |
| C-2 | **Muhasebe programına aktarım** | Logo/Mikro/Netsis/Paraşüt hangisi kullanılıyor? En azından CSV export gerekir |
| C-3 | **KVKK saklama/silme** | Privacy sayfası var; **saklama süresi politikası ve silme mekanizması yok**. Doktor verisi + finansal veri işleniyor |
| C-4 | **Kongre modülü hukuki görüş** | Hak ediş **tahsilata orantılı** üretiliyor. Tanıtım mevzuatı açısından yazılı görüş alınmadı — `UYGULAMA_PLANI.md` bunu Faz E ön koşulu saymıştı, atlandı |
| C-5 | **Çoklu para birimi** | İthal ürün varsa döviz bazlı fiyat/kur farkı |

### 6.4 Operasyon

| # | Yok olan | Neden sorabilir |
|---|---|---|
| D-1 | **Bildirim (e-posta/SMS)** | "Vaden yaklaşıyor", "kongre bakiyen doluyor", "sevkiyat talebin onaylandı" — hiçbiri yok, kullanıcı sisteme girmek zorunda |
| D-2 | **Rol granülerliği** | Yalnız 3 rol var. Gerçek bir distribütörde **muhasebe** (parayı görür, stok işlemez), **depo** (stok görür, fiyat/prim görmez), **satış müdürü** (tüm satıcıları görür, fiyat değiştiremez) ayrı rollerdir |
| D-3 | **Kargo takip entegrasyonu** | Sevkiyat kaydı var, kargo firması API'si yok |
| D-4 | **Satıcı hedefi / kotası** | Prim var ama hedef yok; "hedefin %80'indesin" gösterilemiyor |
| D-5 | **Excel dışa aktarım** | Rapor ekranları var; indirilebilir dosya yok. Muhasebe kesin isteyecek |
| D-6 | **Toplu veri girişi (import)** | Ürün listesi, doktor listesi, açılış bakiyeleri elle mi girilecek? |

### 6.5 Bilinçli kapsam dışı (teyit et, sorun değilse geç)

- Doktorun kendi paneli (sisteme giriş yapmıyor)
- Mobil uygulama
- Çoklu firma/şube (tek tüzel kişilik varsayımı)
- Satın alma / tedarikçi yönetimi (stok girişi elle)

---

## 7. Cevap bekleyen kararlar → ✅ ÇÖZÜLDÜ (bkz. `KARARLAR.md` §1.1)

Bu üçü kod yazımını blokluyordu; Faz 0'da karara bağlandı. Karar metni **KARARLAR'dadır**, burada özet:

| # | Karar (özet) |
|---|---|
| **K-1** ✅ | İptal **edilebilir**: sipariş `CANCELLED`, kayıt **silinmez**; tahsilat cari hesapta kalır, borç **ters kayıtla** düşer → bakiye avansa döner; **satıcı primi ve ciro türevleri ters kaydedilir**. Sevk edilmiş sipariş → iade süreci (A-1). ⚠️ *13.09: türev listesinden **"tahsilat oranı" çıkarıldı** — X-1 §(1) metriği kalıcı olarak kaldırdı; **kongre türevi** de K-6 ile düştü. KARARLAR §1.1 K-1 metninde bu kalıntı hâlâ duruyor (`FAZ1_UYGULAMA_KAPSAMI.md` §C-d).* |
| **K-2** ✅ | Ayrı avans kaydı **yok**; cari bakiye **tek ve işaretli** (negatif = avans, KDV dahil); çıplak negatif değil **yön etiketiyle**; tüm ekranlar tek bakiye fonksiyonunu çağırır; avans otomatik mahsup. |
| **K-3** ✅ | **Yumuşak kısıt**: aşım engellenmez, yönetici gerekçeyle onaylar, her aşım ve kapasite değişikliği loglanır (`OnayBlogu`). |

Bunlar **teknik değil ticari** kararlardı; cevaplar Anka West sürecinden alınıp KARARLAR'a işlendi.

---

## 8. Nasıl gözden geçir

1. **Bölüm 2 ve 3'ü** oku — akış Anka West'in gerçekte çalıştığı gibi mi? Eksik bir adım var mı?
2. **Bölüm 6'yı** satır satır geç — her madde için "bu bizde var mı?" diye sor
3. Eksik bulduklarını üç kovaya ayır:
   - 🔴 **Canlıya çıkmadan gerekli** → düzeltme turuna eklenir
   - 🟡 **İlk 3 ay içinde gerekli** → ürünleştirme turuna eklenir
   - ⚪ **Sonra** → kapsam dışı listesine yazılır, unutulmaz
4. Sonucu `YOL_HARITASI.md`'ye işle

> **Not:** Bölüm 6'daki her madde bir eksiklik **değildir** — bilinçli kapsam kararı da
> olabilir. Önemli olan kararın **verilmiş** olması, farkına varılmamış olmaması.
