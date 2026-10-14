# Karar önerisi — içe aktarım · sahiplik · telefon varsayımı

> **Tarih:** 19.09.2026 · **Durum:** ⬜ **öneri — karar değildir** (`YOL_HARITASI.md` §7.1-A: plan karar üretemez).
> **Kaynak:** 19.09 inceleme bulguları (üç bulgu + bayat iddialar) ve bu belgedeki genişletme.
> **Kullanım:** Onaylanan her bölüm hedef dosyaya **aynen** işlenir (§6 ve §7 tabloları). Ardından bu dosya `arsiv/`e gider.
> **01.10.2026 — §2 (X-17) karara bağlandı:** KARARLAR **§5.19**'a revize hâliyle işlendi (iz olay kaydı, sahip FK `RESTRICT`, kural kodları, silme/geri alma hükmü). Bu belgedeki §2 ve ADR-007 taslağı **artık geçerli metin değildir**. X-16, X-15 §(5) eki ve ADR-006 öneri olarak kalır.
> *Satır numaraları proje kopyalarına göredir; depoda kaymış olabilir.*
> **13.10.2026 — kalan bölümler karara bağlandı, belge arşivlendi** (eski adı `docs/KARAR ONERISI.md`).
> X-16 → KARARLAR **§5.20** · X-15 §(5) → KARARLAR **§5.18 (5)** 🟦 · ADR-006 → **`docs/adr/ADR-006-ice-aktarim-tek-tanim.md`** ·
> geri not kuralı (§8) → `YOL_HARITASI.md` §7.1-G. **Bu belgedeki hiçbir metin artık geçerli değildir**; ADR-007 taslağı
> yazılmadı (numara boş kalır). §10'daki kabul kriteri taslakları 1B madde 7'de kriter yazılırken **girdi** olarak okunur.

---

## 0. Özet — dört kök neden, dört mekanizma

Bulgular üç ayrı sorun gibi görünüyor, ama dört kök nedene iniyor. Her kök tek bir mekanizmayla kapanıyor. Mekanizmalar birbirini **kullanıyor, kopyalamıyor**.

| Kök neden | Belirtisi | Mekanizma | Nerede |
|---|---|---|---|
| **K1 · Aynı kural birden çok yerde yazılıyor** (şablon · import doğrulaması · form) | K-7 şablonunda `hesap_sinifi`, klinik ve bölge yok | **İçe aktarım, elle girişin toplu hâlidir;** şablon tek tanımdan üretilir | X-16 · ADR-006 |
| **K2 · Aynı veriyi birden çok yol yazıyor** (sahiplik) | Toplu devir yok · import doktorları sahipsiz açar · rol değişikliği yazılı değil | **Tek yazma yolu** `degistirDoktorSahibi()` + iki değişmez | X-17 · ADR-007 |
| **K3 · Yazılmamış varsayım** | Klinik santrali → UNIQUE ihlali → uydurma numara | **§0.6 varsayılan kaydı;** ölçüm import'un kendisidir | X-15 §(5) 🟦 |
| **K4 · Karar yayılımı denetlenmiyor** | K-7 (07.09) ve A-13 §(4), sonraki kararlarla bayatladı | **Geri not kuralı:** karar, değiştirdiği maddeye not düşülmeden kapanmaz | `YOL_HARITASI.md` §7.1 |

**Bağımlılık yönü:** X-16'nın cari import'u sahipliği X-17'nin fonksiyonuyla yazar. X-15 §(5)'in ölçümü X-16'nın önizlemesidir. Ters yönde bağ yoktur.

**Şemaya etki toplamı:** tek bir `CHECK` kısıtı (X-17). Yeni tablo, yeni kolon ve yeni enum yoktur.

---

## 1. X-16 · İçe aktarım sözleşmesi ve cari şablonu

*KARARLAR §5.19 olarak işlenir.*

**Boşluğun kaynağı:** K-7 §(2) (07.09) cari şablonunu *"D-6'daki A-13 alanları"* diye tarif ediyor. D-6 ekleri de *"kimlik ve `fatura_` alanları + `cari_tip` (A-13)"* diyor. Sonra iki karar import'ta zorunlu alan ekledi ve ikisi de şablona yansımadı:
- X-8 §(6): `hesap_sinifi`
- X-15 §(3): klinik ve bölge (*"import dahil"*)

İki alan ise hiçbir yerde yazılı değil:
- **Sorumlu satıcı.** X-13 §(2) yöneticinin sahip seçmesine izin veriyor, import'u anmıyor.
- **Cariye fiyat listesi ataması** (X-10 §(6)).

Kimin import çalıştırabileceği de yazılı değil.

Sonuçları:
- **Sorumlu satıcı kolonu olmadan** 240 doktor sahipsiz açılır. X-13 §(3) gereği hiçbirine sipariş girilemez ve devreye alma günü durur.
- **`hesap_sinifi` kolonu olmadan** ya bütün dosya reddedilir ya da bir geliştirici uygulama katmanında `?? "DOKTOR"` yazar. İkincisinde bayiden prim doğar ve RULE-15 sessizce delinir.

**Sorun tek kolon değildir.** Şablon ile karar kitabı arasında bağ yok; her yeni karar kolon ekledikçe şablon kopuyor.

> **KARAR (X-16):** **İçe aktarım, elle girişin toplu hâlidir. Şablon sistemden üretilir; belgede kolon listesi tutulmaz.**
> *(Değerlendirilen (b) — K-7'ye açık kolon tablosu yazılır, kod ona uyar — reddedildi: iki kaynak kalır ve ilk yeni kararda aynı kopma tekrarlanır.)*
>
> **(1) Import'a özgü doğrulama yoktur.** Her import satırı, aynı kaydı elle açan akışın doğrulamasından **aynen** geçer.
> - Elle girişte reddedilen satır, import'ta da **aynı kural koduyla** reddedilir.
> - Import'a özgü gevşeme ya da varsayılan yoktur.
> - `CARI` satırının karşılığı **`YONETICI`'nin cari açma akışıdır**.
> - *Elle giriş yolu olmayan türlerde (`ACILIS_BAKIYESI`, `ACILIS_STOGU`) doğrulama, import tanımının kendisidir.*
>
> **Küme kuralları partinin tamamına uygulanır.** Tekillik ve aralık çakışması gibi kurallar tek satıra değil **yazma sonrası duruma** bakar. Elle girişte bu küme *veritabanı + eklenen satır*, import'ta *veritabanı + partinin bütün satırlarıdır* — sınırı §(4)'ün tek transaction'ı çizer. **Kural aynıdır; değişen kümenin sınırıdır.** Bu, import'a özgü bir kural ya da gevşeme değildir.
>
> **Çakışmada reddedilenler:**
> - **Dosya içi çakışmada çakışan satırların hepsi** reddedilir, yalnız ikincisi değil (X-15 §(5) deseni).
> - **Kayıtlı veriyle çakışmada** yalnız dosyadaki satır reddedilir.
> - Her iki hâlde de kural kodu, aynı kuralın elle girişte döndürdüğü koddur; parametreler çakışan satır numaralarını taşır (X-4 §(3)).
>
> **(2) Her veri türünün tek bir içe aktarım tanımı vardır** (X-12 kataloğu). Şablon, doğrulama ve önizleme özeti bu tanımdan türer; mekanizma `docs/adr/ADR-006`'dır. Bir alanın zorunlu olup olmadığı **o alanı koyan kararda** yazılıdır (A-13, X-8, X-15, bu madde). Kolonların dökümü hiçbir belgede kopyalanmaz.
>
> **(3) Dosya düzeyi sert kısıt.** Zorunlu bir kolonu eksik olan ya da tanınmayan bir kolon taşıyan dosya **bütünüyle reddedilir**; satır doğrulamasına geçilmez. Eski sürüm bir şablon bu kontrolde kendiliğinden yakalanır, ayrı sürüm alanı gerekmez.
>
> **(4) Kısmi yazma yoktur.** Reddedilen satır varken yazma adımı açılmaz. Satır hatalarının hepsi birlikte döner (X-4 §(7)).
> *Gerekçe: "geçerlileri yaz" akışında 6 bayi satırı reddedilip 240 doktor yazılırsa, sistem bayisiz canlıya çıkar ve bu hiçbir ekranda görünmez.*
>
> **(5) `CARI` tanımı iki alan taşır:**
> - **Sorumlu satıcı:** aktif `SATICI`'nın kullanıcı e-postası.
>   - `DOKTOR`'da boş bırakılabilir; doktor sahipsiz açılır (X-13 §(2)).
>   - `BAYI`'de doluysa satır reddedilir (X-8 §(3)).
>   - Atama X-17 yolundan yazılır.
> - **Fiyat listesi kodu:** boşsa varsayılan liste geçerlidir (X-10). Tanınmayan kod reddedilir.
>
> **(6) `CARI` içe aktarımını yalnız `YONETICI` çalıştırır.** (5)'teki iki alanı yalnız yönetici yazabilir (X-13 §(5), X-10 §(6)); daha geniş bir yetki bu iki kuralı import üzerinden deler. Diğer türlerin yetkisi D-2 ekran matrisinde yazılır (§C-n).
>
> **(7) Önizleme özeti, yazma onayıdır.** "Yaz" düğmesi özetin altında durur; özetsiz yazma yolu yoktur. `CARI` özeti şunları gösterir:
> - sınıf dağılımı (`DOKTOR` / `BAYI` adedi)
> - satıcı başına doktor adedi ve sahipsiz doktor adedi
> - fiyat listesi boş `BAYI` adedi (`BILGI`)
> - reddedilen satırların kural koduna göre adedi
>
> *Gerekçe: yanlış sınıflanmış bir bayiyi ay sonu prim raporundan önce görebilecek tek insan gözü burasıdır.*
>
> **Diğer türlerin özeti kendi tanımındadır** (ADR-006 §1); kural burada kopyalanmaz. `ACILIS_BAKIYESI` özeti — cari adedi · toplam borç · toplam alacak · net, taban etiketli — **24.09.2026'da `KARARLAR.md` D-6 ekine yazıldı**; aynı ek satırın `yon` sütununu ve `TUTAR_NEGATIF` reddini de koyar. Bu ek X-16'dan bağımsızdır ve onun onayını beklemez.
>
> **(8) Hesap sınıfının kaynağı her akışta açıktır** (X-8 §(1)):
> - `SATICI` akışı `DOKTOR` değerini **açıkça** verir.
> - Import değeri satırdan okur.
> - `YONETICI` formunda sınıf **seçili gelmez** ve seçilmeden kayıt yapılamaz.
>
> *Ekranda önceden seçili gelen değer, adı konmamış bir varsayılandır.*
>
> **(9) İçe aktarım yalnız kayıt açar; var olan kaydı güncellemez.** Anahtarı (`CARI` için normalize telefon, X-15 §(2)) kayıtlı bir satır `TELEFON_KAYITLI` ile reddedilir ve §(4) gereği dosyanın tamamı bekler. **Kayıtlı satırın "atlanması" diye bir davranış yoktur** — atlamak, dosyadaki satır ile kayıtlı kayıt arasındaki farkı gizler ve yönetici dosyanın uygulandığını sanır.
> - **Dosya yalnız açılacak kayıtları taşır.** Önizlemedeki *"açılacak kayıt adedi"*, gönderenin beyan ettiği adetle karşılaştırılır; tutmuyorsa dosya yanlıştır.
> - **Açılmış bir kaydın düzeltme yolu, onu açan akışın kendisidir:** tek cari ekranı (`FAZ1 §D.3` madde 7). Aynı alanlar, aynı doğrulama, aynı log (A-13, RULE-13).
> - *Gerekçe: import bir **devreye alma aracıdır** (D-6 kapsamı, §(6) yetkisi). Sonraki eklemelerin olağan yolu cari ekranıdır. Toplu güncelleme ayrı bir yetenektir; §0.6 gereği en dar varsayılan seçilir.*
> - **Kapsam dışı, Faz 2 adayı:** iş anahtarına göre toplu güncelleme (upsert). *Bu kararın koşulu: müşteri cari listesini düzenli olarak dosyayla güncelleyecekse D-6'nın kapsam cümlesi yeniden yazılır ve asıl karar upsert değil, import'un ne olduğudur.*
>
> **(10) Geri alma, ana verinin düzeltme yolu değildir.** Geri alma D-6 ve X-12 §(3)'teki gibi durur; koşulu C-3 §(6)'dır.
> - **Kısmi geri alma yoktur.** Koşul partinin **tamamına** bakar: partiye bağlı tek bir kayıt bile belgeye bağlıysa parti geri alınmaz ve **hiçbir kayıt silinmez**. *Gerekçe §(4)'ün aynasıdır — 234 kayıt silinip 12'si kalırsa sistem eksik cari listesiyle yaşar, yönetici "geri aldım" der ve bu hiçbir ekranda görünmez.*
> - **Koşul sağlanmadığında düzeltme yolu elle düzeltmedir** (9). Geri alma bir kolaylıktır, tek çare değildir.
> - **Açılış bakiyesi hatası `TERS_KAYIT` ile düzeltilir** (X-11 tip kataloğu); parti geri alınmaz. *Açılış stoğunun `DZL`/`ACILIS_DUZELTME` yolunun (D-6, B-7) cari tarafındaki karşılığıdır.*
> - Geri alma tek transaction'dır ve **ADR-006'nın geri alıcısıdır**. Sahiplik izini silen yol da bu tanımın içindedir; ADR-007 §6 yazım testinin kapsamına girer.
>
> **(11) `CARI` listesi de yazılı teyit ister.** K-7 §(4)'ün açılış bakiyesi için koyduğu kural cari listesine genişletilir: nihai liste yüklenmeden önce müşteriden **yazılı onay** alınır.
> - *Gerekçe: üç aşamalı import dosyanın **biçimini** doğrular, **doğruluğunu** değil. Doğruluğun tek ölçüsü müşterinin onayıdır.*
> - **Sınır — garanti değildir:** müşteri bayat bir listeyi de onaylayabilir. Kural hatayı imkânsız yapmaz; **görünür ve sahipli** yapar.
>
> **(12) İçe aktarım, o fazda düzeltme yolu olmayan bir alanı yazmaz** *(24.09.2026 — bulgu 6)*.
> Bir alan şablonda yer alıyorsa, yanlış geldiğinde düzeltileceği bir yol **aynı fazda** bulunmalıdır. Düzeltme yolu (9)'daki gibi elle giriş ekranı, ya da tipe özgü bir ters kayıt olabilir.
> - **Uygulaması — `FIYAT_LISTESI` şablonunda tarih kolonu yoktur.** `gecerli_baslangic` / `gecerli_bitis` şemada ve DB kısıtında **vardır** (X-10 §(1), B-5) ama Faz 1'de **doldurulmaz**: satırlar süresizdir.
>   *Gerekçe: X-10 §(7) tarih alanlarının **ekranını Faz 2'ye** bıraktı. Şablon tarih taşısaydı import, Faz 1'de hiçbir ekranın gösteremediği ve düzeltemediği bir veri yazardı; yanlış tarihli satır `cozumleBirimFiyat()`'ta **`SERT` "fiyat çözümlenemedi"** üretir (X-10 §(3)) ve o ürüne sipariş girilemez. §(9) gereği yeniden yükleme de düzeltmez — import kayıt güncellemez. §0.2'nin tahliye vanası kuralı bunu **kullanıcı hatası değil tasarım hatası** sayar.*
>   *§0.6 aynı yeri gösterir: kolonsuz şablon Faz 2'de **eklenerek** büyür; kolonlu şablonun hatası ancak **silinerek** düzelir ve Faz 1'de silme ekranı yoktur.*
> - **Faz 1'de B-5 çakışma kısıtının fiilî karşılığı** `(liste, ürün, min_adet)` tekilliğidir — bütün satırlar süresiz olduğu için iki satır daima çakışır. X-16-12 testinin dayandığı varsayım artık **kuraldır**.
> - **Diğer türlerde bu madde bir şey değiştirmez:** `CARI` → tek cari ekranı (9) · `ACILIS_BAKIYESI` → `TERS_KAYIT` (10) · `ACILIS_STOGU` → `DZL`/`ACILIS_DUZELTME` (D-6, B-7) · `URUN` → ürün ekranı. Düzeltme yolu olmayan tek alan tarih alanlarıydı.
> - **Faz 2'de tarih ekranı açıldığında** şablon kendiliğinden tarih kolonu kazanır (ADR-006 §3: şablon elle giriş şemasından üretilir); bu maddenin ayrıca değiştirilmesi gerekmez.
>
> **Kapsam dışı, kalıcı:** import'a özgü doğrulama kuralı · kısmi yazma · **kısmi geri alma** · **kayıtlı satırın atlanması** · **import'tan cari silme** (silme C-3 §(6) yoludur) · kolon eşleme ekranı · müşteriye özel şablon.
> **Şemaya etki:** yok. İki alan zaten `Doktor`'da (X-10, X-13); parti FK X-12'de.
> **Katalog:** kural kodu `ICE_AKTARIM_KOLON_EKSIK` · `ICE_AKTARIM_KOLON_TANINMIYOR` · `URUN_KODU_KAYITLI` · `FIYAT_SATIRI_CAKISIYOR` (X-4 §(3)). *Son kod tek bir kuralın adıdır — "bu satır zaten var": Faz 1'de `(liste, ürün, min_adet)` anahtarı, Faz 2'de tarih aralığı da dahil (B-5). **24.09'da `FIYAT_ARALIGI_CAKISIYOR` idi**; §(12) ile Faz 1'de tarih kolonu kalmayınca ad, henüz var olmayan bir mekanizmayı anlatır olmuştu.* *(`TELEFON_KAYITLI` X-15 §(5)'tedir.)*
> **Geri çekme:** yok — bugün import kodu yok.
> **Geri not:** K-7 §(2) · D-6 ekleri · X-8 §(6) · X-13 §(2) · **D-6** (*"geri alınabilir"* → tek çare değil) · **X-12 §(3)** (kısmi geri alma yasağı) · **K-7 §(4)** (yazılı teyit `CARI`'ye genişler) (§6 tablosu).

---

## 2. X-17 · Sahipliğin tek yazma yolu ve portföy devri

> ✅ **Karara bağlandı (01.10.2026) — KARARLAR §5.19.** Aşağıdaki metin önerinin tarihçesidir; geçerli metin KARARLAR'dadır.

*KARARLAR §5.19 olarak işlendi (01.10.2026).*

**Boşluğun kaynağı:** X-13 §(5)/(6) ve E-2 §(6) devri tek tek ve elle tanımlıyor; pasif satıcının doktorları sahipsiz kalıyor. Toplu devir hiçbir yerde planlı değil: ne 1B madde 3 matrisinde ne §D.5'te var. Ayrılan bir satıcının 38 doktoru, yönetici hepsini tek tek atayana kadar sipariş alamıyor. **Rol değişikliği** (`SATICI` → başka rol) ise hiç yazılı değil.

Kökteki sorun şu: sahipliği **beş yol** yazacak.
- `SATICI` cari açma
- `YONETICI` cari açma
- import (X-16)
- devir
- pasifleştirme

Bugün iki yol (`createDoctor`, `transferDoctor`) sahip kolonunu ve atama izini **ayrı ayrı** yazıyor. Log transaction'ın dışında ve hata yutuluyor (`DENETIM_BULGULARI.md`, madde 2). Beş ayrı yazan yol, bu kitabın dokuz bakiye formülünden çıkardığı dersin aynısıdır (§0.6).

> **KARAR (X-17):** **Sahiplik tek yoldan yazılır. Devir 1..N doktor üzerinde çalışır. Sahibi pasifleşen ya da rolü değişen satıcının portföyü aynı işlemde çözülür.**
> *(Değerlendirilen (b) — ayrı toplu devir ekranı ve fonksiyonu — reddedildi: tekil ve toplu devir iki ayrı kod yolu olur.)*
>
> **(1) `degistirDoktorSahibi()` tek çağrı noktasıdır — listenin 12. fonksiyonu.**
> - Sahip kolonunu başka hiçbir kod yazmaz.
> - Çağıranlar: cari açma (`SATICI`, `YONETICI`), import (X-16), devir, pasifleştirme, rol değişikliği.
> - §1.3 (9) aynen geçerlidir: **modül** listeye ekleme yapamaz. Bu ekleme bir çekirdek kararıdır.
>
> **(2) İki değişmez — ikisi de sert:**
> - **Sahip daima aktif bir `SATICI`'dır.** Pasif ya da başka roldeki bir kullanıcı sahip yapılamaz.
> - **`BAYI`'nin sahibi olmaz** (X-8 §(3)). Fonksiyon reddeder; DB `CHECK` kısıtı ikinci savunma hattıdır.
>
> **(3) Her değişiklik iz ve log yazar; ikisi de aynı transaction'dadır** (RULE-13).
> - Atama izinde eski aralık kapanır, yenisi açılır. Sahipsiz bırakmada yeni aralık açılmaz.
> - **Sahip kolonu gerçektir, atama izi tarihçedir** (X-15 §(1)'deki vade izi deseni). Sahip, tarihçeden türetilmez.
>
> **(4) Yetki.**
> - `SATICI` yalnız kendi açtığı doktorun ilk sahibi olur (X-13 §(2)).
> - Diğer her değişiklik **`YONETICI` + zorunlu gerekçe** ister (X-13 §(5); yönetimsel eylem deseni, X-4 §(5)).
>
> **(5) Devir 1..N'dir; ayrı bir toplu devir ekranı açılmaz.**
> - Devir, cari listesinde seçilen carilere uygulanır. Tekil devir, N=1 hâlidir.
> - Gerekçe **işlem başına bir kez** yazılır ve her doktorun iz ve log kaydına aynen geçer.
> - **İşlem kimliği kolonu açılmaz.** Aynı işlemin satırları aynı zaman damgasını ve aynı atayanı taşır (X-5 eki: türetilebilir alan konmaz).
>   - Damga **`DoctorAssignment.fromDate`**'tir ve **`timestamptz`**'dir (E-1 §(1)'in *an* listesine eklenir). Sahiplik geçişi anlıktır: X-13 §(3) siparişin satıcısını *sipariş anındaki* sahipten okur. `date` seçilseydi aynı gün yapılan iki devir ayırt edilemez, aynı gün kapanan aralık da E-1 §(4) gereği **boş küme** olurdu.
>   - Değer **veritabanında** üretilir (`transaction_timestamp()`); uygulama katmanı yazmaz. Aynı transaction'daki bütün atama satırları bu sayede aynı damgayı taşır — gruplama buna dayanır.
>   - *X-12'nin tablo açmasıyla fark: `ImportParti` bir **FK hedefidir**, kayıtlar ona bağlanır ve geri alma onu referans alır. Devir grubunun aşağı akış başvurusu yoktur; yalnız denetimde okunur.*
> - Cari listesine `DOKTOR` için **"sahipsiz" süzgeci** eklenir.
>
> **(6) Portföy çözülmeden pasifleştirme ve rol değişikliği tamamlanmaz.** Doktoru olan bir `SATICI` pasifleştirilirken ya da rolü değiştirilirken ekran doktor adedini gösterir. İki seçenekten biri zorunludur:
> - **bir `SATICI`'ya devret**
> - **sahipsiz bırak**
>
> Seçim, pasifleştirmeyle aynı transaction'dadır.
> - E-2 §(6)'nın *"açık oturumlar anında sonlanır"* kuralı korunur. "Sahipsiz bırak" her zaman seçilebildiği için pasifleştirme hiçbir koşulda gecikmez.
> - Faz 1'de hedef tektir. Portföyü bölmek isteyen, işlemden sonra (5)'i kullanır.
> - Yeniden aktifleştirme portföyü geri getirmez.
>
> **(7) "Otomatik devir yoktur" (E-2 §(6)), sistemin hedef seçmemesi demektir.** Yöneticinin açıkça yaptığı toplu seçim, elle devirdir.
>
> **(8) Sipariş ile devir yarışmaz.** Sipariş girişi sahibi **doktor satırı kilidi altında** okur; devir aynı satırları kilitler (`docs/adr/ADR-007`). Devirle yarışan bir sipariş ya devirden önceki sahibi yazar ya da reddedilir. Böylece X-13 §(3) (*siparişin satıcısı, sipariş anındaki sahiptir*) yarış altında da doğru kalır.
>
> **Kapsam dışı, kalıcı:** sistemin hedef seçtiği devir (bölge ya da yük bazlı dağıtım) · zamanlanmış devir · devrin geri alınması (ters devir yeni bir devirdir) · ortak sahiplik (X-13).
> **Şemaya etki:** `Doktor` üzerinde `CHECK (hesap_sinifi = 'DOKTOR' OR sahip IS NULL)`. `DoctorAssignment.fromDate` tipi `timestamptz` olarak netleşir (E-1 deseni: yeni kolon değil, tip). Yeni tablo ve kolon yok.
> **Katalog:** kural kodu `SAHIP_AKTIF_SATICI_DEGIL` · `BAYI_SAHIP_ATANAMAZ` (X-4 §(3)).
> **Geri çekme:** `createDoctor` ve `transferDoctor`'un sahiplik yazan kısımları bu fonksiyona taşınır; transaction dışındaki log içeri alınır.
> **Geri not:** X-13 §(5)/(6) · E-2 §(6) · §1.3 (9) · §4 §1.3 satırı · ADR-001 (11 → 12) · **E-1 §(1)** (`fromDate` *an* listesine).

---

## 3. X-15 §(5) eki · Telefon varsayımı — 🟦

*KARARLAR §5.18'e (5) olarak eklenir.*

**Kaynak:** A-9 (09.09) aynı klinikte birden çok doktoru açıkça öngörüyor: aynı VKN, üç cari. X-15 §(2) (16.09) ise telefonu hem `DOKTOR` hem `BAYI` için **UNIQUE** yapıyor. İki karar da doğru, ama aralarında yazılmamış bir varsayım var: **her carinin kendine ait bir telefonu vardır.**

Satıcının elinde yalnız klinik santrali varsa ikinci doktoru kaydedemez. Meşru bir yol görmezse numara uydurur. §0.2'nin B-7 ekine göre bu bir tasarım hatasıdır.

> **(5) Varsayım yazılıdır: cari, kişiye ait bir telefonla açılır** (doktorun cep telefonu; klinik santrali değil).
> - Alan etiketi **"Cep telefonu (kişisel)"**dir.
> - UNIQUE ihlali `SERT`'tir; kural kodu `TELEFON_KAYITLI`'dır. Hata metni numaranın kime ait olduğunu söylemez (X-4 §(9), X-13 §(1)) ve kullanıcıyı yöneticiye yönlendirir.
> - **Meşru yol yöneticidir.** Yönetici bütün carileri görür. Ya gerçek bir mükerrer kayıt bulur (FR-09 amacına uygun çalışmıştır) ya da ilk kayıttaki santral numarasını düzeltir.
> - Import'ta aynı numarayı paylaşan **bütün satırlar** reddedilir, yalnız ikincisi değil. İlk satırı kabul etmek, santral numarasıyla açılmış bir kaydı meşrulaştırmak olurdu. Kural hem dosya içinde hem kayıtlı carilere karşı uygulanır.
>
> **🟦 Varsayılan kaydı**
>
> | Alan | İçerik |
> |---|---|
> | **Varsayılan davranış** | UNIQUE korunur. Mükerrer numara X-16 önizlemesinde kural koduna göre sayılır ve X-16 §(4) gereği yazmayı durdurur. |
> | **Cevabın değiştirdiği katman** | Şema (UNIQUE kısıtı) — yalnız aşağıdaki dal tetiklenirse. |
> | **Kilitlenme anı** | **Doktor listesinin teslimi** (devreye alma). |
>
> **Ölçüm ayrı bir araç değildir.** `CARI` import'unun doğrula ve önizle aşamaları yazmadan çalışır; önizlemedeki `TELEFON_KAYITLI` adedi ölçümün kendisidir. Liste import ekranı hazır olmadan gelirse aynı sayım elle yapılır: benzersiz normalize numara adedi, satır adedine eşit mi?
>
> **Dal (bugünden yazılı):**
> 1. Adetler eşit değilse **önce veri tarafına** gidilir: satıcılardan kişisel numaralar toplanır.
> 2. Kalan satırlar için X-15 §(2) §C'de yeniden açılır.
> 3. **İkinci telefon alanı seçenek değildir** (X-15 §(2)).
>
> *Varsayılan seçimi (§0.6, geri dönüşü en ucuz olan):* UNIQUE'i sonradan kaldırmak tek satırlık bir migration'dır. Sonradan koymak ise mükerrer canlı veriyi temizlemeyi gerektirir.

---

## 4. ADR-006 taslağı

### ADR-006 — İçe aktarım: tek tanım, şablon şemadan üretilir

- **Durum:** Önerildi
- **Tarih:** 19.09.2026
- **Kaynak soru:** `FAZ1_UYGULAMA_KAPSAMI.md` §C-y
- **Bağlı KARARLAR maddeleri:** X-16 · D-6 · K-7 · X-12 · X-8 §(6) · X-15 §(3) · A-13 · E-3

#### Bağlam

X-16, import'u elle girişin toplu hâli yaptı ve şablonu belgeden çıkardı. Bu ADR bunun nasıl kurulacağını anlatır.

Aşağıdaki tablo 19.09 itibarıyla cari şablonunda belge ile kararlar arasındaki farkı gösterir. **Tarihçedir, normatif değildir.**

| Alan | Kural | Kaynak | K-7 / D-6'da |
|---|---|---|---|
| `hesap_sinifi` | zorunlu, varsayılansız | X-8 §(1)/(6) | ❌ |
| klinik · bölge | `DOKTOR`'da zorunlu | X-15 §(3) | ❌ |
| telefon | zorunlu, benzersiz | X-15 §(2) | ⚠️ A-13 §(4) "nullable" diyor |
| sorumlu satıcı | `DOKTOR`'da opsiyonel, `BAYI`'de yasak | X-16 §(5) | ❌ (kararsızdı) |
| fiyat listesi kodu | opsiyonel | X-16 §(5) | ❌ (kararsızdı) |
| `cari_tip` · `vkn_tckn` · `fatura_*` · `eposta` · `muhasebe_kodu` | A-13'teki gibi | A-13 | ✅ |
| `kredi_limiti` | opsiyonel | A-12 | ✅ (D-6 eki) |

#### Karar

1. **Her veri türü için tek bir tanım nesnesi.** İçeriği:
   - **Satır şeması:** elle giriş akışının girdi şemasıdır. Import için yeniden yazılmaz, olduğu gibi kullanılır. `CARI` için bu, `YONETICI` cari açma şemasıdır.
   - **Kolonlar:** şemadaki her alan için başlık metni, açıklama, örnek, izinli değerler ve kaynak karar.
   - **Çözümleyiciler:** yalnız import'ta olan dönüşümler (e-posta → kullanıcı, liste kodu → liste). Kural taşımazlar; kuralı şema taşır.
   - **Özet:** önizleme sayımları (X-16 §(7)).
   - **Yazıcı:** tek transaction içinde çalışır; `ImportParti` satırını yazar (X-12), sahipliği `degistirDoktorSahibi()` ile yazar (X-17).
   - **Küme kuralları:** her tür, satır şemasının tek başına doğrulayamadığı kuralları **açıkça bildirir**: anahtar ifadesi · kapsam (*veritabanı + parti*) · kural kodu (X-4 §(3)). Kural metni burada yazılmaz; yalnız **anahtarı ve kapsamı** yazılır — kuralın kendisi onu koyan karardadır (X-15 §(2), X-10 §(1), B-5). `CARI` için normalize telefon; `URUN` için `kod`; `FIYAT_LISTESI` için liste `kod`'u ve (liste, ürün, `min_adet`) + tarih aralığı. *Faz 1'de tarih alanları şablonda yoktur (X-16 §(12)), dolayısıyla çakışma kuralı `(liste, ürün, min_adet)` tekilliğine iner; tarih boyutu Faz 2'de ekranla birlikte açılır.*
   - **Geri alıcı:** partiyi geri alan yol da tanımın parçasıdır; tek transaction'da çalışır, koşulu C-3 §(6)'dır (X-16 §(10)). Sahiplik izini silen kısmı ADR-007 §6 yazım testinin kapsamındadır.
2. **Tek koşturucu:** `calistirIceAktarim(tur, dosya, asama)`. Aşamalar: doğrula · önizle · yaz.
   **Tek çağrı noktası listesine girmez**, çünkü tek çağıranı import ekranıdır. Listeye yalnız birden çok çağıranı olan ve iş kuralı taşıyan fonksiyon girer (bkz. ADR-007).
3. **Şablon aynı tanımdan üretilir.** İçeriği:
   - başlık satırı
   - "Açıklama" sayfası: kolon, zorunluluk, izinli değerler, kaynak karar
   - kapalı katalog kolonlarında (`hesap_sinifi`, `cari_tip`) Excel açılır listesi

   İki çıkışı vardır: ekranda **"Şablonu indir"** düğmesi ve bir geliştirici komutu. Komut, import ekranı yazılmadan önce devreye alma hazırlığında şablon gönderebilmeyi sağlar.
4. **Başlık eşlemesi, başlık metniyle yapılır.** Yalnız büyük/küçük harf farkı (`tr-TR`) ve baştaki/sondaki boşluk tolere edilir.
5. **Üç koruma testi (CI):**
   - **Şema kapsama testi:** hedef tablonun NOT NULL ve varsayılansız her kolonu, ya tanımda ya da açık bir "sistem doldurur" listesinde bulunur. Kolon bilgisi Prisma şemasından okunur. *`hesap_sinifi` boşluğu bu testle yakalanırdı.*
   - **Varsayılan yasağı testi:** `hesap_sinifi` alanı olmayan bir `CARI` satırı reddedilir; şemada bu alana varsayılan tanımlanamaz.
   - **Küme kuralı kapsama testi:** hedef tablo üzerindeki her `UNIQUE`, `EXCLUDE` ve çok kolonlu `CHECK` kısıtı, ya bir küme kuralına bağlıdır ya da açık bir **"import'tan erişilemez"** listesindedir. Kısıtlar **`information_schema`'dan** okunur — Prisma şemasından değil; tarih aralığı çakışma kısıtı ham SQL'dir ve şemadan türetilse kaçardı. C8 anti-şema testinin `information_schema` desenini kullanır, ikinci bir mekanizma doğurmaz.

#### Sonuçlar

- ✅ Yeni bir zorunlu alan eklendiğinde şablon, doğrulama ve önizleme kendiliğinden değişir.
- ✅ Form ile import kuralları birbirinden ayrışamaz.
- ⚠️ Şablon, kod sürümüne bağlıdır. Devreye almadan haftalar önce gönderilen bir şablon sonradan eskiyebilir. Eski dosya X-16 §(3) kolon kontrolünde reddedilir; sessizce yanlış yazılmaz.
- ⚠️ Elle giriş şeması import'un ihtiyacına göre bükülemez. Import'ta farklı bir davranış gerekiyorsa bu bir **karardır** (X-16 değişir), şemanın bir dalı değildir.

#### Değerlendirilen alternatifler

- **K-7'de elle kolon tablosu.** Reddedildi: iki kaynak kalır (X-16 (b)).
- **Import için ayrı doğrulama şeması.** Reddedildi: her kural iki kez yazılır.
- **Kolon eşleme ekranı.** Reddedildi: müşterinin dosya hatasını sisteme taşır; kapsam dışıdır (X-16).

#### Açık uygulama kalemleri (atıf)

- `import.azamiDosyaBoyutMb` değeri (E-3, §6)
- Başlık metinlerinin nihai hâli (1B madde 7)
- Aynı kapsama testinin K-4 dışa aktarım veri setlerine uygulanıp uygulanmayacağı (1B madde 6)

#### Geçerlilik sınırı

X-16 §(1) ya da §(4) değişirse bu ADR'nin yerini yenisi alır.

---

## 5. ADR-007 taslağı

### ADR-007 — Sahiplik: tek yazma yolu, satır kilidi

- **Durum:** Önerildi
- **Tarih:** 19.09.2026
- **Kaynak soru:** `FAZ1_UYGULAMA_KAPSAMI.md` §C-z
- **Bağlı KARARLAR maddeleri:** X-17 · X-13 · E-2 §(6) · X-8 §(3) · RULE-13 · (desen: `docs/adr/ADR-005`)

#### Bağlam

X-17 sahipliği tek fonksiyona bağladı. Bugün sahiplik iki yerde duruyor: `Doctor.ownerSellerId` ve `DoctorAssignment` aralıkları. İki kod yolu (`createDoctor`, `transferDoctor`) ikisini ayrı ayrı yazıyor. Log transaction'ın dışında ve `createAuditLog` hatayı yutuyor.

#### Karar

1. **İmza:** `degistirDoktorSahibi(tx, doktorIdleri, yeniSahipId | null, gerekce, kullanici)`.
   Fonksiyon **çağıranın transaction'ında** çalışır; kendi transaction'ını açmaz. Böylece cari açma, import ve pasifleştirme, sahipliği kendi işlemleriyle aynı transaction'da yazar.
2. **Tek yazımda üç şey:**
   - sahip kolonu
   - atama izi (açık aralık kapanır, yenisi açılır)
   - log

   Log transaction'ın içindedir; log hatası devri geri alır. *(Bu, DENETIM bulgusunu kapatır.)*
3. **Kilit sırası `ADR-008`'dedir** *(24.09.2026 — bulgu 5; bu madde sırayı **kopyalamaz**, `README` §2.3)*.
   Küresel sıra: doktor satırları (id) → ürün satırları (id) → `BelgeSayac`.
   - Bu fonksiyonun payına düşen: doktor satırları **id sırasıyla** `FOR UPDATE` ile kilitlenir.
   - Devir ürün satırlarına ve sayaca dokunmadığı için sırada yalnız ilk basamağı tutar.
   - *Önceki hâli "önce doktor, sonra ürün" diyordu ve `BelgeSayac`'ı hiç anmıyordu — bulgu 5 buydu.*
4. **Değişmezler fonksiyonun içindedir, çağıranda değil:** hedef aktif bir `SATICI` mı · cari `BAYI` mi · yetki. `BAYI` için DB `CHECK` kısıtı ikinci hattır.
5. **Doğruluk kaynağı sahip kolonudur.** Atama izi tarihçedir; rapor ya da görünürlük sorgusu sahibi izden okumaz.
6. **Zorlama:**
   - **Yazım testi:** sahip kolonuna yazan tek dosya, bu fonksiyonun dosyasıdır (grep/lint; X-5 lint kuralı deseni).
   - **Değişmez testi:** e2e koşusunun sonunda üç sayımın hepsi sıfırdır:
     - pasif kullanıcıya ait doktor
     - sahibi olan `BAYI`
     - sahibi, açık aralığın satıcısından farklı olan doktor

#### Sonuçlar

- ✅ Tekil devir, toplu devir, import ve pasifleştirme tek bir kod yolundan geçer.
- ✅ RULE-13 istisnasız hâle gelir.
- ⚠️ 38 doktorluk bir devir 38 satır kilidi alır. Faz 1 hacminde önemsizdir; yüzlerce doktorluk devirde kilit süresi ölçülür.

#### Değerlendirilen alternatifler

- **Sahip kolonunu kaldırıp sahibi açık aralıktan türetmek** (ADR-005 deseni). Reddedildi:
  - X-17 §(3) doğruluk kaynağını kolona koydu (X-15 §(1) vade deseni).
  - Tek sahip kuralı ve `BAYI` sahipsizliği tek tabloda, basit DB kısıtlarıyla korunuyor. Türetilmiş hâlde ikincisi tablolar arası bir kısıt ister.
  - Tutarlılık, tek yazma yolu ve değişmez testiyle sağlanır.
- **Ayrı `devretToplu()` fonksiyonu.** Reddedildi: X-17 (b).

#### Açık uygulama kalemleri (atıf)

- Pasifleştirme diyaloğunun biçimi (1B madde 4)
- Cari listesinde çoklu seçim (1B madde 7)

---

## 6. Redaksiyon tablosu — onaydan sonra

### KARARLAR.md

| Yer | Bugün | Olacak |
|---|---|---|
| **K-7 §(2)**, ikinci cümle | *"Doktor/cari şablonu D-6'daki A-13 alanlarını taşır."* | *"Cari şablonu sistemden üretilir; kolonları `YONETICI` cari açma akışının alanlarıdır (X-16). Belgede kolon listesi tutulmaz."* |
| **D-6** (§3.4 tablosu), ekler | *"doktor import'u kimlik ve `fatura_` alanları + `cari_tip` (A-13)"* | *"cari import'u, `YONETICI` cari açma akışının toplu hâlidir · kısmi yazma yok · yalnız `YONETICI` (X-16)"* |
| **A-13 §(4)** | `telefon`, *"hepsi nullable"* listesinde | Listeye not: *"`telefon`: X-15 §(2) ile NOT NULL + UNIQUE (16.09); varsayım X-15 §(5)."* |
| **X-8 §(6)** | *"…geçiş şablonu (K-7) `hesap_sinifi` kolonunu taşır"* | Sonuna: *"Şablon ve doğrulama tek tanımdan türer (X-16)."* |
| **X-13 §(2)** | *"`YONETICI` doktor açarken sahip seçebilir ya da boş bırakabilir."* | Sonuna: *"Import'ta da aynı kural geçerlidir (X-16 §(5))."* |
| **X-13 §(5)** | *"Devir yalnız `YONETICI` işidir…"* | Sonuna: *"Devir 1..N doktor üzerinde çalışır; yazma yolu `degistirDoktorSahibi()`'dir (X-17)."* |
| **X-13 §(6)** | *"…doktorları sahipsiz kalır; yeniden atanana kadar…"* | *"Satıcı pasifleştirilirken ya da rolü değişirken portföyü **aynı işlemde** devredilir ya da açıkça sahipsiz bırakılır (X-17 §(6)). Sahipsiz doktora, atanana kadar sipariş girilmez. Açık siparişlerin satıcısı değişmez."* |
| **E-2 §(6)**, dördüncü madde | *"Pasif `SATICI`'nın doktorları elle başka satıcıya atanır; otomatik devir mekanizması yoktur"* | *"Pasifleştirme, `SATICI`'nın portföyünü aynı işlemde çözer: yöneticinin seçtiği satıcıya devir ya da açıkça sahipsiz bırakma (X-17 §(6)). Otomatik devir yoktur; sistem hedef seçmez (X-17 §(7))."* |
| **"11'de kalır" diyen diğer maddeler** — `:2803` (E-1) · `:2873` (X-5) · `:2916` · `:3121` (X-1 §(10)) · `:3308` · `:3387` · `:3453` · `:3725` · `:3785` | *"Liste **11**'de kalır"* / *"11'li listeye girmez"* | **Gövde değişmez** — her biri kendi tarihinde doğrudur. Her birine tarihli geri not: *"X-17 ile liste **12**'ye çıktı; bu maddenin hükmü değişmedi."* §8 geri not kuralının gereğidir; yazılmazsa kitap iki farklı sayı söyler |
| **D-2 `:2726`** | *"`kapsamliDoktorlariGetir` — **11. fonksiyon**"* | **Değişmez.** Sıra sayısıdır, toplam değil; `degistirDoktorSahibi()` 12. sıradadır |
| **§1.3 (9)** ve **§4**'teki §1.3 satırı | *"liste 11'de kapalıdır"* | *"liste **12**'de kapalıdır (19.09: X-17 ile `degistirDoktorSahibi()`)"* |
| **E-1 §(1)**, *an* listesi | `DoctorAssignment.fromDate` yok | Listeye eklenir: *"`DoctorAssignment.fromDate` (X-17 §(5))"*. Tarihli geri not: *"19.09: X-17 §(5) gruplaması bu alana dayanır."* |
| **D-6** (§3.4 tablosu) | *"Her import parti numarası taşır ve **geri alınabilir**"* | Sonuna: *"Geri alma tek çare değildir; koşulu (C-3 §(6)) sağlanmayan partinin düzeltme yolu elle düzeltmedir (X-16 §(10)). **Kısmi geri alma yoktur.** Açılış bakiyesi hatası `TERS_KAYIT` ile düzeltilir."* |
| **X-12 §(3)** | *"Partiye bağlı kayıtlar başka hiçbir belgeye bağlı olmamalıdır."* | Ardına: *"Koşul partinin **tamamına** bakar; kısmi geri alma yoktur (X-16 §(10))."* |
| **K-7 §(4)** | Yazılı onay yalnız açılış bakiyesi listesi için | Sonuna: *"Aynı şart **cari listesi** için de geçerlidir (X-16 §(11))."* |
| **D-6** (§3.4 tablosu), **açılış bakiyesi ekleri** | — | ✅ **24.09.2026'da yazıldı** (bulgu 4): açılış bakiyesinde işaret kuralı (`yon` + `TUTAR_NEGATIF`) ve önizleme özeti. X-16'dan bağımsız; onaydan sonra **tekrar işlenmez**, §(7) yalnız atıf yapar |
| **A-6** · **X-11 §(3)** | — | ✅ **24.09.2026'da yazıldı**: import tarafına geri not |
| **§4** kural kodu kataloğu | — | ✅ **24.09.2026'da yazıldı**: `TUTAR_NEGATIF` |
| **X-16 §(12)** (bulgu 6) | — | ✅ **24.09.2026'da yazıldı**: düzeltme yolu olmayan alan yazılmaz → `FIYAT_LISTESI` şablonunda tarih kolonu yok. **KARARLAR değişmez** — X-10 §(7) ve B-5 zaten Faz 2 diyor |
| **X-15 §(2)**, son madde | *"Ad + klinik benzerlik uyarısı Faz 2'dir"* | Ardına: *"Kişisel numara varsayımı: §(5) 🟦."* |
| **§4** tablosu | — | Aşağıdaki dört satır |
| **§5** tablosu | — | X-16 ve X-17 satırları (bulgu · öneri · karar) |
| **§6** kontrol listesi | — | X-16 ve X-17 ✅ satırları; X-15 🟦 notu |
| Başlık | *"Son güncelleme: **24 Eylül 2026** … · 16 Eylül 2026"* *(24.09'da D-6 ekleriyle güncellendi)* | 19.09 turu notu eklenir |

**§4'e eklenecek satırlar:**

| # | Etki | Bağlam |
|---|---|---|
| **X-16** | Import, elle girişin toplu hâlidir · şablon tek tanımdan üretilir · **kısmi yazma yok** · `CARI` import'unu yalnız `YONETICI` çalıştırır | D-6, K-7, 1B madde 7 |
| **X-16** | `CARI` tanımında sorumlu satıcı ve fiyat listesi kodu; `BAYI`'de satıcı doluysa satır reddedilir | X-8 §(3), X-10, X-13 |
| **X-17** | **`degistirDoktorSahibi()` — tek çağrı noktası #12** · sahip daima aktif `SATICI` · `BAYI` sahipsiz (`CHECK`) | §1.3 (9), CM, **kritik** |
| **X-17** | Pasifleştirme ve rol değişikliği portföyü aynı transaction'da çözer | E-2 §(6), 1B madde 4 |

### FAZ1_UYGULAMA_KAPSAMI.md

| Yer | Değişiklik |
|---|---|
| **§B.3** Kolonlar | `DoctorAssignment.fromDate` → `timestamptz`, `CM`, E-1 · X-17 §(5) |
| **§B.5** Kısıtlar | Yeni satırlar: `BAYI` sahipsiz — sert, **DB**, CM, X-17 · sahip aktif `SATICI` — sert, 1B madde 3, X-17 · portföy çözülmeden pasifleştirme ve rol değişikliği yok — sert, 1B madde 4, X-17 · import'ta eksik/tanınmayan kolon ve kısmi yazma yasağı — sert, 1B madde 7, X-16 · telefon UNIQUE — sert, **DB**, CM, X-15 *(listede yoksa)* |
| **§B.6** başlığı ve tablosu | *"11"* → *"12"*. Satır 12: `degistirDoktorSahibi(tx, doktorIdleri, yeniSahipId \| null, gerekce, kullanici)` · X-13 · X-17 · `docs/adr/ADR-007` · **1B madde 3** (#11 ile aynı commit) |
| **§B.4** katalog | Yeni kural kodları: `URUN_KODU_KAYITLI` · `FIYAT_SATIRI_CAKISIYOR` *(`TELEFON_KAYITLI` X-15 §(5)'ten)* |
| **§C** defteri | §C-y · §C-z · §C-aa (aşağıda) |
| **§D.3** madde 3 · 4 · 7 | §9'daki eklemeler |

**§C'ye eklenecek satırlar:**

| # | Soru | Durum | Kapatan |
|---|---|---|---|
| §C-y | Cari şablonunun kararlarla bağı yok; sorumlu satıcı ve fiyat listesi import'ta yazılı değil *(19.09 inceleme, bulgu 1 + genişletme)* | ⬜ öneri | KARARLAR **X-16** · `docs/adr/ADR-006` |
| §C-z | Sahipliği beş yol yazıyor; toplu devir ve rol değişikliği yazılı değil *(bulgu 3)* | ⬜ öneri | KARARLAR **X-17** · `docs/adr/ADR-007` |
| §C-aa | Telefon UNIQUE ile A-9'daki çoklu doktor arasında yazılmamış varsayım *(bulgu 2)* | ⬜ öneri | KARARLAR **X-15 §(5)** 🟦 |

### ADR/

| Yer | Değişiklik |
|---|---|
| `ADR_README.md` §4 Dizin | ADR-006 ve ADR-007 satırları |
| **`ADR-008`** (bulgu 5) | — | ✅ **24.09.2026'da yazıldı**: kilit sırası tek belgede. `ADR-007 §3` ona atıf yapar; `ADR-005 §3` dondurulmuş olduğu için **düzenlenmedi** (`README` §2.2), ADR-008 onu tamamlar |
| `ADR-001` Karar tablosu | *"11 tek çağrı noktası fonksiyonu"* → *"12"*. Karar değişmez; 16.09'daki "ek güncellemesi" notu deseniyle işlenir. |

---

## 7. Bayat iddialar — karar gerektirmez, hemen işlenebilir

*19.09 incelemesinin tespiti; proje kopyalarında doğrulandı.*

| Yer | Bugün | Olacak |
|---|---|---|
| `PROJE_DURUMU.md:208` | remote `memirdemir/medikal-satis-operasyon` | 19.09'da değişen yeni remote (adres teyit edilip yazılır) |
| `PROJE_DURUMU.md:210-213` | *"`docs/` sürüm kontrolünde değil… Üçü de C0'ın işi"* | *"✅ C0'da kapandı: `docs/` ve `ADR/` izleniyor, `git status` temiz, port 5432 (19.09 teyidi)"* |
| `PROJE_DURUMU.md:21` | *"`docs/` sürüm kontrolü dışında"* | Tarihli günlük satırıdır, gövdesi değişmez. Sonuna: *"(19.09: C0'da kapandı)"* |
| `YOL_HARITASI.md:129-130` | *"⚠️ `docs/` bugün git'te değil — C0"* (iki kez) | İfade silinir |
| `ADR_README.md:5` | *"Faz 1A C0'da git'e eklenir"* | *"C0'da git'e eklendi"* |
| `FAZ1_UYGULAMA_KAPSAMI.md:472` (C0 satırı) | *"bugün izlenmiyor"* | Durum ✅ |
| `FAZ1_UYGULAMA_KAPSAMI.md:391`, `:460`, `:738` | `PRD_V2.md` *"repo kökünde"* | Taşımadan sonraki yol (teyit edilip yazılır) |

---

## 8. Süreç kuralı — geri not (K4)

*`YOL_HARITASI.md` §7.1'e eklenir.*

> **Geri not kuralı.** Bir karar, daha önceki bir maddenin söylediğini değiştiriyor ya da genişletiyorsa, o maddeye **aynı gün** tarihli bir not düşülür. Karar metni sonunda bir **"Geri not:"** satırı taşır. Atıf yaptığı her maddeye not düşülmeden karar ✅ olmaz.
>
> **İçe aktarılan bir tabloya zorunlu alan ekleyen karar**, bunu "Şemaya etki" bölümünde yazar. Şablon kendiliğinden güncellenir (X-16); bu satır, önizleme özetinin de değişmesi gerekip gerekmediğinin kararda düşünülmesini sağlar.

**Gerekçe:** A-13 §(4)'teki telefon ve K-7 §(2)'deki şablon aynı hatanın iki örneğidir. X-15, A-13'ün alanını değiştirdi; X-8 ve X-15, K-7'nin şablonunu genişletti. İki durumda da eski maddeye not düşülmedi. Kuralın maliyeti karar başına birkaç dakikadır.

---

## 9. Plan etkisi

### CM

- X-17'nin `CHECK` kısıtı `CM`'e girer.
- **X-17 `CM`'den önce kapanır** *(24.09.2026 kararı)*. Sebebi `§D.2`'nin çıkış kriteridir: *"`prisma/migrations` altında **tek klasör** var"*. Kısıt sonraki bir migration'a düşerse ikinci klasör doğar ve **Faz 1A kapanamaz**; `ADR-002` fresh init'in dayanağı da budur.
- Bekleme belirsiz değildir: `CM`'in önünde `C0…C7b` duruyor, X-17 ise tek sayfalık bir onaydır. *Bu yüzden `§0.6`'nın C-1 eki ("durdurarak düzelen varsayılan kötüdür") burada devreye girmez — durduran bir şey yok.*
- Plan tarafındaki kaydı: `FAZ1_UYGULAMA_KAPSAMI.md` **§D.7-10** (24.09'da açıldı).
- *Önceki hâli "`CM` beklemez, kısıt sonraki migration'a düşer" diyordu ve farkında olmadan §D.2'yi deliyordu — 24.09 denetiminin 2. bulgusu.*

### Faz 1B

| Madde | Eklenen | Neden orada |
|---|---|---|
| **3** | `degistirDoktorSahibi()` · `createDoctor` ve `transferDoctor`'un sahiplik kısımlarının sökümü · logun transaction içine alınması · satır kilidi yardımcısı | #11 (`kapsamliDoktorlariGetir`) ile aynı commit: sahipliğin okuması ve yazması birlikte |
| **4** | Pasifleştirme ve rol değişikliği diyaloğu: portföy seçimi | E-2 kimlik katmanıyla birlikte; madde 3'ün fonksiyonunu kullanır |
| **7** | Cari girdi şeması (tek cari ekranı) → `CARI` tanımı → şablon üretici ve komutu → önizleme özeti · **küme kuralı bildirimleri ve kapsama testi** · cari listesinde çoklu seçimle devir ve "sahipsiz" süzgeci · sipariş girişinde sahiplik kilidi | Tanım şemaya dayandığı için önce şema yazılır; kapsama testi `C8`'in `information_schema` desenini kullanır |

### Devreye alma sırası

*§D sıra kısıtıdır, karar değildir.*

1. Kullanıcılar (satıcı hesapları)
2. Fiyat listeleri
3. `CARI` — **telefon ölçümü burada yapılır** (doğrula + önizle)
4. Açılış bakiyesi
5. Açılış stoğu

**Gerekçe:** `CARI` satırı satıcıya ve fiyat listesine, açılış bakiyesi de cariye başvurur. Şablon, import ekranı hazır olmadan gerekiyorsa geliştirici komutuyla üretilir (ADR-006).

---

## 10. Kabul kriterleri

*`KABUL_KRITERLERI.md`'ye işlenir; numaralar karar kimliğinden türer (X-7).*

**X-16**
- **X-16-1** · `hesap_sinifi` kolonu olmayan bir `CARI` dosyası bütünüyle reddedilir; hiçbir satır ve `ImportParti` kaydı yazılmaz.
- **X-16-2** · Tanınmayan bir kolon taşıyan dosya reddedilir.
- **X-16-3** · Elle cari açmada reddedilen her kural (VKN hane sayısı · `DOKTOR`'da boş klinik/bölge · telefon), import satırında aynı kural koduyla reddedilir. *Test, paylaşılan şema üzerinde parametreli koşar.*
- **X-16-4** · Sorumlu satıcısı dolu olan `BAYI` satırı `BAYI_SAHIP_ATANAMAZ` ile reddedilir.
- **X-16-5** · Reddedilen satır varken yazma adımı açılmaz.
- **X-16-6** · Önizleme şunları gösterir: sınıf dağılımı · satıcı başına adet · sahipsiz adedi · fiyat listesi boş `BAYI` adedi.
- **X-16-7** · `OPERASYON` ve `SATICI` `CARI` import'unu çalıştıramaz; kontrol sunucudadır.
- **X-16-8** · Şema kapsama testi yeşildir.
- **X-16-9** · `YONETICI` cari formunda hesap sınıfı seçili gelmez.
- **X-16-10** · Dosya içi çakışmada çakışan satırların **hepsi** reddedilir. *Test: aynı telefonu taşıyan iki `CARI` satırı → ikisi de reddedilir, ilki yazılmaz.*
- **X-16-11** · Küme kuralı kapsama testi yeşildir: import hedefi her tablodaki `UNIQUE` / `EXCLUDE` / çok kolonlu `CHECK` kısıtı ya bir küme kuralına bağlıdır ya da "import'tan erişilemez" listesindedir. Kaynak: `information_schema`.
- **X-16-12** · Aynı `(liste, ürün, min_adet)` anahtarını taşıyan iki satır içeren `FIYAT_LISTESI` dosyasında önizleme `FIYAT_SATIRI_CAKISIYOR` kodunu ve iki satır numarasını gösterir; "Yaz" adımı açılmaz. *Faz 1'de tarih alanları **şablonda yoktur** (§(12)), yani çakışma anahtar üzerindedir. Test, düzeltmeden önce **kırmızı** olmalıdır (`DUZELTME_BRIFI.md:501`).*

- **X-16-13** · Kayıtlı bir telefonu taşıyan `CARI` satırı yeni kayıt **açmaz** ve **güncellemez**; `TELEFON_KAYITLI` ile reddedilir. Dosyada böyle bir satır varsa yazma adımı açılmaz (§(4)).
- **X-16-14** · Önizleme **açılacak kayıt adedini** gösterir.
- **X-16-15** · Partiye bağlı tek bir kayıt belgeye bağlıysa geri alma reddedilir; **hiçbir kayıt silinmez**.
- **X-16-16** · Geri alma, sahiplik izini silerken de `ADR-007 §6` yazım testinin kapsamındadır.
- **X-16-17** · Negatif tutar taşıyan bir `ACILIS_BAKIYESI` dosyasında önizleme `TUTAR_NEGATIF` kodunu ve satır numarasını gösterir; "Yaz" adımı açılmaz (`KARARLAR.md` D-6 eki).
- **X-16-18** · `ACILIS_BAKIYESI` önizlemesi cari adedini, toplam borcu, toplam alacağı ve neti **taban etiketiyle** gösterir; tek birleşik tutar ya da oran göstermez (§0.4).
- **X-16-19** · `FIYAT_LISTESI` şablonu tarih kolonu **içermez**; tarih kolonu taşıyan bir dosya `ICE_AKTARIM_KOLON_TANINMIYOR` ile **bütünüyle** reddedilir (§(3), §(12)).

**X-17**
- **X-17-1** · Sahip kolonuna yazan kod, yalnız `degistirDoktorSahibi()`'nin dosyasındadır.
- **X-17-2** · Pasif ya da `SATICI` olmayan bir kullanıcıya atama `SERT` olarak reddedilir.
- **X-17-3** · `BAYI`'ye atama reddedilir; DB `CHECK` kısıtı doğrudan yazımı da reddeder.
- **X-17-4** · 38 doktorlu bir `SATICI`'nın pasifleştirilmesi tek işlemdir: pasifleştirme + 38 iz satırı + 38 log kaydı. Herhangi biri başarısız olursa hiçbiri yazılmaz.
- **X-17-5** · Portföy seçimi yapılmadan pasifleştirme ya da rol değişikliği tamamlanamaz.
- **X-17-6** · Devirle eşzamanlı sipariş girişinde, devir işlendikten sonra eski sahip adına sipariş oluşmaz.
- **X-17-7** · e2e sonunda değişmez sayımlarının üçü de sıfırdır (ADR-007 §6).
- **X-17-8** · Log hatası devri geri alır.
- **X-17-9** · Tek devirdeki 38 atama satırının `fromDate` değeri birbirinin **aynısıdır**; aynı gün yapılan ikinci devir **farklı** bir damga taşır ve iki grup ayırt edilebilir.

**X-15 §(5)**
- **X-15-5-1** · `TELEFON_KAYITLI` metni, numaranın ait olduğu carinin adını ya da sahibini içermez.
- **X-15-5-2** · Import'ta aynı numarayı paylaşan bütün satırlar reddedilir.
- **X-15-5-3** · Önizleme `TELEFON_KAYITLI` adedini gösterir.

---

## 11. Onayını bekleyen dört seçim

| # | Seçim | Önerim | Bedeli |
|---|---|---|---|
| 1 | X-16 §(4) — kısmi yazma yok | **Evet** | Tek hatalı satır bütün dosyayı bekletir. Buna karşılık sistem eksik cari listesiyle sessizce canlıya çıkamaz. |
| 2 | X-16 §(6) — `CARI` import'unu yalnız `YONETICI` çalıştırır | **Evet** (§0.6: en dar varsayılan) | Devreye almada tek seferlik bir iş; operasyonel yükü yok denecek kadar az. |
| 3 | X-17 §(1) — tek çağrı noktası listesini 11'den 12'ye açmak | **Evet** | Alternatifi kuralı konvansiyonda bırakmaktır. Beş yazan yolla bu, dokuz bakiye formülünün tekrarı olur. |
| 4 | §C harf sırası — z'den sonra `§C-aa` | Öneri | Başka bir şema kullanıyorsan onunla değişir. |
