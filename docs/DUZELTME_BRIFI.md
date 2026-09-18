# Düzeltme Brifi — Adım 2

> **🔄 16.09.2026 (2) — ADR-005 ve X-11…X-15 notu.**
> - **F-06:** `Product.stock` kalkıyor (`docs/adr/ADR-005`). Testin sınadığı şey artık koşullu
>   `updateMany` değil, **ürün satırı kilidi** ve `NEGATIF_STOK` kaydıdır. Görev 1B madde 8'de bu tanımla yazılır.
> - **F-02:** bakiyenin kaynağı artık `CariHareket` tablosudur (KARARLAR X-11).
> - **F-11:** senaryo, sahiplik ve prim oranı için X-13 ve X-14'e dayanır.
>
> **🔧 16.09.2026 — bayat başlıklar düzeltildi (karar üretmedi).** F-01 ve F-04 başlıkları hâlâ
> *"§C-b'ye bağlı / ASKIDA"* diyordu. Oysa §C-b 13.09'da **X-6** ile kapandı ve bu brifin kendi
> 13.09 (2. tur) tablosu iki görevi de **düşmüş** sayıyor. Başlıklar ve §C-b notları buna
> hizalandı; görev gövdeleri **tarihçe** olarak duruyor. `FAZ1_UYGULAMA_KAPSAMI.md` 16.09'da
> yeniden kuruldu. Bu brifin atıf verdiği bölümler (§A, §C-b, §C-e, §D) oradadır.
>
> **🔧 14.09.2026 — biçim düzeltmesi (içerik değişmedi).** §"13.09.2026 — blokeleyen üç madde
> kapandı" tablosunda **önceki sürümden kalmış dört kolonlu bir başlık satırı** duruyordu
> (`| # | Soru | Blokladığı | Neden bekleyemez |`); tablo bozuk render oluyordu. Satır silindi.
> **Görevlerde, kararlarda ve atıflarda değişiklik yok.**
>
> **🔄 15.09.2026 — `FAZ1_UYGULAMA_KAPSAMI.md` §D commit dizisiyle senkronizasyon (karar üretmedi).**
> §D artık **commit bazlıdır** (C0…C10 + `CM`). Bu brifte düzeltilenler: **F-00** C1'in tarifine
> hizalandı — üçüncü DB `medikal_itest` ve vitest `projects`; eski *"Playwright'ın test DB'sini
> yeniden kullan"* talimatı **uygulanamazdı** (e2e her koşuda `migrate reset` yapıyor) ·
> `makeCongressLot` fixture'ı çıkarıldı · **F-00'ın Faz 1A'da olduğu** yazıldı · test sayısı
> kuralı §D.2'ye bağlandı · çalışma sırası §D.3'e bağlandı · **X-2'ye §D.7-1 bağımlılığı** eklendi.
> ⚠️ **Sıra bu brifin grup numaralarından değil `FAZ1_UYGULAMA_KAPSAMI.md` §D'den okunur.**
>
> **🔄 15.09.2026 (2. tur) — KARARLAR X-8 · X-9 işlendi.** **X-2** kod düzeltmesi olmaktan çıktı:
> `recordDealerPayment` Faz 1A **C5**'te kodla birlikte sökülüyor (bayi artık `Doktor` satırı);
> görev **bütün tahsilat yollarının kabul testine** dönüştü (1B madde 2). **F-12'nin RULE-06
> kısmı** X-10'a bağlandı — *3. oturumda kapandı: cariye atanan liste, test tanımı aşağıda.* 1A sonu birim test hedefi **~52**
> (C4'ün 32 testi silinir). `LoginAttempt` sökümü bu brifin değil **Faz 1A C7b**'nin işidir.
>
> **🔄 KARARLAR senkronizasyonu — 11.09.2026.** Faz 0 kapandı; **K-1, K-2, K-3 karara bağlandı**
> (`KARARLAR.md` §1.1). Bu yüzden 🟡 işaretli **F-03 ve F-05 artık açık** — aşağıdaki "Karar
> bekleyenler" bölümüne cevaplar işlendi. Yalnız KARARLAR'a atıf yapılır, karar burada tekrarlanmaz.
> Ayrıca Faz 0'da doğan yeni maddeler (X-1, X-3, X-4, A-15, Ü-3, E-1, E-2, E-3, D-2) bu brifin
> **kapsamı dışındadır** — onlar Faz 1 uygulama işi ve Faz 2 kalemleri olarak `YOL_HARITASI.md`'ye eklendi.
>
> **Bu dosya Claude Code için talimattır.** Kaynak: [`docs/DENETIM_BULGULARI.md`](./DENETIM_BULGULARI.md)
> ve [`docs/TRACEABILITY.md`](./TRACEABILITY.md) (8 Ağustos 2026) + kararlar için [`KARARLAR.md`](./KARARLAR.md).
>
> Amaç: denetimde bulunan **sessiz finansal riskleri** kapatmak ve bunları bir daha
> üretmeyecek test altyapısını kurmak.
>
> ## 🔵 13.09.2026 (2. tur) — AÇIK MADDELER KAPANDI, GÖREV LİSTESİ KESİNLEŞTİ
>
> `KARARLAR.md` **X-5 · X-6 · X-7** karara bağlandı. Bu brif üzerindeki etkisi kesindir:
>
> | Görev | Akıbet |
> |---|---|
> | **F-01** | ⛔ **Görev olarak düşer.** İşi **sayılan belgeler filtresine** devredildi (A-5; X-6 §(9)). İptal edilen belgenin matrahtan çıkması ayrı bir düzeltme değil, filtrenin altı dışlamasından biridir |
> | **F-02** | ⚠️ **Küçüldü.** Dokuz yerdeki formül **tek** `hesaplaDoktorBakiye(doktor, tarih?)`'ye indirilir. *"Açık alacak"* ikinci fonksiyonu **yazılmaz** |
> | **F-04** | ⛔ **Tamamen düşer.** `PaymentAllocation` kaldırıldı (X-6 §(1)); TOCTOU açığı, açığın bulunduğu mekanizmayla birlikte gidiyor |
> | **F-08 · F-09** | ⛔ **Konusuz** (K-6 — daha önce işaretlenmişti) |
> | **F-11** | ⚠️ Senaryo `KABUL_KRITERLERI.md`'ye taşınır ve **yeniden yazılır** (X-7) |
> | **Yeni** | **GÇ-13 parasal tip dönüşümü** (X-5) — bu brifin değil, **Faz 1A'nın** işi |
>
> 🔵 **Bu brif artık Faz 1B'nin bir parçasıdır — tek istisna F-00** (Faz 1A, commit **C1**). Faz 1A (söküm + şema + `Decimal` dönüşümü)
> **önce** yapılır; brifin görevleri sökülmüş ve dönüştürülmüş kod üzerinde koşar.
> Sıra: `FAZ1_UYGULAMA_KAPSAMI.md` §D.
>
> ---
>
> ## 🔴 13.09.2026 (1. tur) — KARARLAR UYUM DENETİMİ: BU BRİF TEK BAŞINA UYGULANAMAZ
>
> Brif **8 Ağustos denetimine** göre yazıldı. Faz 0 kararları araya girdi ve üç şey oldu:
>
> 1. **İki görev konusuz kaldı** — F-08 ve F-09 (kongre expiry ve lot iadesi): K-6 §(2) ile
>    **mekanizmanın tamamı siliniyor**.
> 2. **İki görev askıda** — F-01 ve F-04: `PaymentAllocation` ve FIFO mahsup üzerine kurulu,
>    ama A-7 *"kalıcı kalem kapatma tablosu açılmaz"* + K-2 *"tek işaretli bakiye"* + X-1 §(7)
>    *"hangi tahsilatın hangi sevkiyatı kapattığı sistemde yoktur"* üçlüsü bu tabloyu **yasaklıyor**.
>    Açık madde: `FAZ1_UYGULAMA_KAPSAMI.md` **§C-b** — ✅ *13.09'da X-6 ile kapandı: F-01 ve F-04 düştü (yukarıdaki tablo).*
> 3. **Beş görevin kapsamı değişti** — F-02, F-03, F-05, F-06, F-11, F-12 (aşağıda ⚠️ ile işaretli).
>
> Ayrıca brif, KARARLAR'ın **BLOCKER** ilan ettiği **X-2**'yi hiç içermiyordu — aşağıya eklendi.
>
> ⚠️ **Her görevin başındaki ⛔ / ⚠️ / ✅ işaretlerini önce oku.**
> Faz 1'in tam kapsamı bu brif değil, **`FAZ1_UYGULAMA_KAPSAMI.md`**'dir.
>
> ## KESİN KAPSAM SINIRI
> Yalnız aşağıdaki F-00…F-12 görevleri **ve X-2**. Yeni özellik ekleme. İlgisiz refactor yapma.
> **🟡 görevlerin kararları geldi (K-1/K-2/K-3 ✅)** — "Karar bekleyenler" bölümündeki uygulama yolunu izle.
>
> Her görev: tek commit, `npm run lint && npm run typecheck && npm test` yeşil,
> **beyan dışı kırmızı test olmadan** — beklenen sayılar `FAZ1_UYGULAMA_KAPSAMI.md` §D.2
> tablosundadır (1A: birim 134 → **~52**, e2e 66 → ~28). *(15.09: önceki metin "134 birim + ~65 e2e
> bozulmadan" diyordu.)*
> **İstisna:** §A geri çekme kalemlerine dokunan görevlerde **testler de geri çekilir** —
> silinen bir mekanizmanın testi yeşil kalamaz; hangi testin neden silindiği commit mesajına yazılır.

---

## 0. Neden bu tur var — tek cümlelik teşhis

Saf fonksiyonlar (`vat.ts`, `allocation.ts`, `commission.ts`, `congress-ledger.ts`) **doğru ve
test edilmiş**. Hataların tamamı, bu fonksiyonları çağıran **veritabanına dokunan servis
katmanında** (`*-service.ts`, `*-cari.ts`) ve bu katmanın **hiç testi yok**.

Bu yüzden ilk görev bug düzeltmek değil, o katmanı test edilebilir hale getirmektir.

---

## F-00 — Servis katmanı entegrasyon test altyapısı (ÖNCE BU) · **Faz 1A, commit C1**

> **15.09.2026 — tarif `FAZ1_UYGULAMA_KAPSAMI.md` §D.1 C1'e hizalandı.** Önceki sürüm
> Playwright'ın test DB'sinin yeniden kullanılmasını söylüyordu; bu **yapılamaz**: e2e
> `medikal_test`'i her koşuda `migrate reset` ediyor (`playwright.config.ts:35`) ve iki
> süreç aynı DB'yi paylaşamaz.

**Neden ilk:** F-01…F-07'nin düzeltildiğini kanıtlayacak hiçbir mekanizma bugün yok.
E2E ile kanıtlamak mümkün ama pahalı ve kırılgan; bu hatalar sorgu seviyesinde yaşıyor.

- **Oluştur:** üçüncü veritabanı **`medikal_itest`** — `docker/init-test-db.sql` + `ci.yml`
  adımı. `medikal_test` ile **paylaşılmaz**.
- **Güncelle:** vitest yapılandırması **`projects`** ile ikiye ayrılır: `unit`
  (`src/**/*.test.ts`) ve `integration` (`src/**/*.itest.ts`). Ayrı bir
  `vitest.integration.config.ts` **açılmaz**.
- **`globalSetup`:** `medikal_itest` üzerinde `prisma migrate deploy`.
- **Temizlik:** her testten önce **TRUNCATE** fixture'ı; `workers: 1` *(hız sorun değil)*.
  Fixture'lar `prisma/seed.ts`'e **dokunmaz**, ondan bağımsızdır.
- **Alan fixture'ları bu commit'te yazılmaz** (`makeDoctor`, `makeOrder`, `makePayment` …):
  `CM` şemayı baştan değiştirir. Her biri ilgili fonksiyonla birlikte **1B'de** yazılır
  (`FAZ1_UYGULAMA_KAPSAMI.md` §D.5). ~~`makeCongressLot`~~ — kongre C2'de sökülüyor.
- **Güncelle:** `package.json` (`test:integration`), `.github/workflows/ci.yml` (mevcut
  Postgres service container'ı + yeni DB adımı).
- **Kabul:** `npm run test:integration` boş `medikal_itest` üzerinde koşar ve **en az bir duman
  testi** (bağlantı + TRUNCATE) geçer; CI'da yeşil; birim testler ve e2e'nin `medikal_test`'i
  etkilenmez. *(Bugün DB'ye dokunan test **0**; altyapının gerçekten çalıştığının tek kanıtı
  bu duman testidir.)*

---

## Grup 1 — Para doğruluğu (canlıya alma blokörü)

### F-01 — İptal edilen sipariş prim matrahından çıkarılmalı ⛔ **GÖREV OLARAK DÜŞTÜ** (X-6 §(9), 13.09) — *işi sayılan belgeler filtresine devredildi; aşağısı tarihçe*

> ⚠️ **KARARLAR:** Bu görevin **iki yarısı da** etkilendi.
> · **Birinci yarı** (`commission-service.ts`) **§C-b'ye bağlı**: prim matrahı `PaymentAllocation`
>   yerine **sevkiyattan** doğacak (X-1 §(7), A-3 — GÇ-1). O zaman düzeltilecek filtre de değişir:
>   `order.status` değil, **sayılan belgeler filtresi** (altı dışlama) uygulanır.
> · **İkinci yarı** (`reports-service.ts` `tahsilatOrani`) **tamamen düşüyor**: X-1 §(1)
>   *"tahsilat oranı metriği kaldırılır — kalıcı"* (GÇ-2). Filtre eklemek yerine **metrik silinir**;
>   yerine **iki mutlak sayı** gelir — dönem cirosu (matrah, sevkiyat bazlı) ve dönem tahsilatı
>   (brüt), **tabanı ekranda yazılı**, bölme yapılmaz.
> · Dolayısıyla *"`tahsilatOrani ≤ 1`"* kabul kriteri **geçersizdir** — o sayı artık üretilmeyecek.
> **Bu görev X-1 ile birlikte yapılmalıdır, ondan önce değil.**

- **Sorun:** `src/lib/commission-service.ts:45-54` — `PaymentAllocation` sorgusunda
  `order: { sellerId }` var ama **`order.status` filtresi yok**. İptal edilen siparişin
  mahsupları matrahta kalıyor → firma hak edilmemiş prim öder, hata mesajı çıkmaz.
- **Yap:** sorguya `order: { status: { not: "CANCELLED" } }` ekle.
- **Aynı eksik ikinci yerde:** `src/lib/reports-service.ts:36-42` — `tahsilat` toplamında
  filtre yok, `ciro`'da var. Bu yüzden `tahsilatOrani` **%100'ü aşabiliyor**. Aynı filtreyi ekle.
- **Test (F-00 altyapısıyla):** sipariş oluştur → sevk et → iptal et → **prim matrahını** doğrula.
  Bu test bugün yazılsa **kırmızı** olmalı.
- **Kabul (KARARLAR'a göre güncellendi):** iptal edilen sipariş **sayılan belgeler filtresiyle**
  matrahın dışında; **`tahsilatOrani` diye bir sayı üretilmiyor**; satıcı raporu **iki mutlak
  sayı** döndürüyor ve **dönem zorunlu aralık parametresi** alıyor (X-1 §(2)).

### F-02 — Bakiye tanımları kanonikleştirilmeli ⚠️ **HEDEF DEĞİŞTİ: İKİ DEĞİL TEK FONKSİYON**

> ⚠️ **KARARLAR K-2 + C-2 §(3):** Hedef *"iki fonksiyon"* değil, **tek çağrı noktasıdır**:
> **`hesaplaDoktorBakiye(doktor, tarih?)`** — tek ve işaretli (Σborç − Σalacak), taban **brüt**
> (C-6 §6), `tarih` verilirse **o Istanbul gününün sonu** itibarıyla (E-1 §5).
> Aşağıdaki **Formül B / `getOpenReceivable()`** kalem kapatmaya dayanıyordu. ✅ *§C-b kapandı (X-6, 13.09):*
> **bu fonksiyon yazılmaz** (A-7 *"kalıcı kalem kapatma tablosu açılmaz"*).
> **İsimlendirme:** KARARLAR'ın 11'li tek çağrı noktası listesi **Türkçe adlandırılmıştır**;
> yeni fonksiyonlar o listeyle aynı adı taşımalı, yoksa "tek çağrı noktası" kuralı denetlenemez.

- **Sorun:** Bakiye formülü **iki farklı biçimde, dokuz ayrı yerde** yaşıyor
  (`DENETIM_BULGULARI.md` D-04). Aynı doktor için doktor detayı **−50.000 ₺**,
  dashboard **0 ₺** gösterebiliyor.
- **Teşhis:** Bu tek bir formülün iki kopyası değil — **iki farklı soru**:
  - **Formül A** = `Σ sipariş(brüt, iptal hariç) − Σ tahsilat` → *doktorun cari bakiyesi*,
    negatif olabilir (avans)
  - **Formül B** = `Σ (sipariş.brüt − o siparişe mahsup)` → *açık alacak*, negatif olamaz
  İkisi de doğru; **hata ikisinin aynı etiketle gösterilmesi.**
- **Yap:**
  1. `src/lib/doctor-cari.ts` içinde iki fonksiyonu isimleriyle ayır ve tek kanonik
     kaynak yap: `getDoctorBalance()` (A) ve `getOpenReceivable()` (B). Her ikisinin de
     üstüne formülü ve hangi soruyu cevapladığını yazan bir yorum koy.
  2. Denetimde listelenen **inline hesapları** (`(seller)/account/page.tsx:44-54`,
     `(admin)/doctors/[id]/page.tsx:224`, `commission-service.ts:118-122`,
     `reports-service.ts:110-116`) bu iki fonksiyona veya paylaşılan bir
     `outstandingOf(order)` yardımcısına indirge. **Yeni formül yazma, sadece çağır.**
  3. Ekran etiketlerini düzelt: bakiye gösteren yer "Cari Bakiye", açık alacak gösteren yer
     "Açık Alacak". **K-2 (`KARARLAR.md` §1.1) gereği:** ayrı avans kaydı tutulmaz; negatif bakiye
     **çıplak sayı olarak gösterilmez**, **yön etiketiyle** sunulur (ör. "Avans / lehte bakiye").
     Avans, tek işaretli bakiyenin **yönüdür** — ayrı bir stored kayıt değil. `getDoctorBalance()`
     tüm ekranlarda **tek** çağrı noktası olsun (KARARLAR: "tüm ekranlar tek bakiye fonksiyonunu çağırır").
- **Test:** aynı doktor için üç senaryoda (borçlu / tam ödenmiş / fazla ödenmiş) iki
  fonksiyonun döndürdüğü değerler ayrı ayrı doğrulanmalı; fazla ödemede dashboard ile doktor detayı
  **aynı** yön etiketini göstermeli (D-04'teki −50.000 vs 0 tutarsızlığı kalmamalı).
- **Kabul:** bakiye formülü kod tabanında **iki fonksiyonda** yaşıyor, dokuz yerde değil;
  her ekran hangisini gösterdiğini etiketiyle belli ediyor.

### F-03 ✅ karar geldi — İptal edilen siparişin mahsupları

- **Sorun:** `src/app/(admin)/orders/actions.ts:81-102` — `cancelOrder` stoğu geri yüklüyor
  ama o siparişe yazılmış `PaymentAllocation` satırlarını silmiyor/işaretlemiyor.
- **KARAR (K-1, `KARARLAR.md` §1.1): yol (b) seçildi.** Tahsilatı yapılmış sipariş **iptal edilebilir**;
  sipariş `CANCELLED` olur ve **kayıt silinmez**. Tahsilat cari hesapta kalır; sipariş borcu **ters
  kayıtla** düşer → bakiye avansa döner. İptal; satıcı primi, ciro/tahsilat oranı ve kongre hakedişi
  türevlerini de **ters kaydeder**. Muhasebe çekirdeği kuralı gereği `DELETE` yok — mahsup satırları
  silinmez, ters kayıtla kapatılır (`KARARLAR.md` §0.2).
  ⚠️ **Sevk edilmiş sipariş bu yoldan iptal edilemez** — o iade sürecidir (A-1, ayrı kalem).
- **Uygula:** İptal, tek `$transaction` içinde ters kayıtları üretsin (**borç + prim matrahı**)
  ve audit yazsın.
  ⚠️ **13.09 düzeltmesi:** ters kayıt listesinden **"tahsilat oranı" çıkarıldı** (X-1 §(1) ile
  metrik kalıcı olarak kaldırıldı) ve **kongre `EARN`** çıkarıldı (K-6 §(2) ile mekanizma siliniyor;
  KARARLAR K-1 eki zaten *"tüketilen kredinin lota iadesi hükmü düştü"* diyor). Ödeme avansa döner (K-2 ile tutarlı: ayrı avans
  kaydı yok, işaretli tek bakiye).
- **Kabul:** tahsilatı olan bir siparişin iptalinden sonra bakiye, açık alacak ve prim matrahı
  üçü birden tutarlı; bunu doğrulayan entegrasyon testi var.

---

## Grup 2 — Eşzamanlılık (çok kullanıcı öncesi blokör)

### F-04 — Mahsup planı transaction içine alınmalı ⛔ **DÜŞTÜ** (X-6 §(1), 13.09) — *`PaymentAllocation` kalktı; aşağısı tarihçe*

> 🔴 **Bu görev tamamen konusuz kalabilir.** KARARLAR üç ayrı yerden aynı şeyi söylüyor:
> **A-7** *"Kalıcı kalem kapatma tablosu açılmaz"* · **K-2** *"Ayrı avans kaydı tutulmaz;
> cari bakiye tek ve işaretli"* · **X-1 §(7)** *"hangi tahsilatın hangi sevkiyatı kapattığı
> sistemde yoktur (K-2, A-7)"*. `PaymentAllocation` bu üçünün tarif ettiği şeyin kendisidir.
>
> **Önce `FAZ1_UYGULAMA_KAPSAMI.md` §C-b KARARLAR'da kapatılmalı.** Cevap *"geri çekiliyor"* ise
> bu görev **silinir** (ve F-01'in birinci yarısı, F-02'nin Formül B yarısı da).
> Cevap *"kalıyor"* ise A-7 metni düzeltilmeli — aksi hâlde iki kaynak birbirini yalanlar.
> **Bu belirsizlikle kod yazmak, iki kez yazmak demektir.**

- **Sorun:** `src/app/(admin)/collections/actions.ts:52` (`getOpenOrders`) ve `:55`
  (`allocateFIFO`) transaction sınırının **dışında**. Klasik TOCTOU: aynı doktor için iki
  tahsilat eşzamanlı girilirse ikisi de aynı açık sipariş listesini okur, ikisi de aynı
  siparişe mahsup planlar, **ikisi de hatasız yazılır**. Sonuç: açık alacak olduğundan az,
  prim matrahı olduğundan fazla.
- **Yap:**
  1. `getOpenOrders` + `allocateFIFO` çağrılarını `$transaction` bloğunun **içine** taşı
     (tx client ile).
  2. Yalnız transaction'a taşımak yetmez — okuma anı ile yazma anı arasında hâlâ boşluk
     kalabilir. Mahsup yazımını **koşullu** hale getir: her `PaymentAllocation` satırı,
     hedef siparişin kalan borcunu aşmadığını **veritabanı düzeyinde** doğrulayan bir
     koşulla yazılmalı. RULE-01 ve RULE-09'daki koşullu `updateMany` deseninin aynısı —
     `count === 0` ise transaction geri alınmalı.
     *(Alternatif: doktor bazında `pg_advisory_xact_lock` ile serialize etmek. Hangisini
     seçersen gerekçesini commit mesajına yaz.)*
- **Test:** iki tahsilatı `Promise.all` ile aynı anda gönder; `Σ PaymentAllocation ≤ Σ sipariş
  brüt` invariantını doğrula. Bu testin düzeltmeden **önce kırmızı** olduğunu göster.

### F-05 ✅ karar geldi — Kongre kontenjanı transaction içine alınmalı

- **Sorun:** `src/app/(seller)/my-congresses/actions.ts:65-71` — kontenjan kontrolü
  transaction dışında; eşzamanlı taleplerde kontenjan aşılabilir. (Bakiye korunuyor —
  RULE-09 doğru kurulmuş — ama kontenjan korunmuyor.)
- **KARAR (K-3, `KARARLAR.md` §1.1): yumuşak kısıt.** Kontenjan aşımı **kesin engellenmez**;
  yetkili rol (**yönetici/admin**) gerekçeyle onaylar. Her aşım **ve her kapasite değişikliği loglanır**
  (`OnayBlogu` tablosunda somutlaştı). Yani kontenjan bir "hard reject" değil, aşımı **izli** kılan bir eşiktir.
- **Yap:** Eşzamanlılık düzeltmesi yine gerekli — kontrolü transaction içine al; ama kural **aşımı bloklamaz**,
  aşımda gerekçeli onay + audit üretir. RULE-09'un `congress-service.ts:158-161`'deki koşullu-update deseni,
  burada "sessiz aşım olmaz, aşım izli olur" biçiminde uygulanır (bakiye tarafı zaten sert).
- **⚠️ Aynı görevde K-6 revizyonu (KARARLAR §6 "F-05 revize edildi"):** Kongre modülünün eski iş kuralı
  **geçersiz sayıldı** (K-6/C-4, `KARARLAR.md` §1.7). Bu turda **ölü kod temizlenir**: (a) **kongre kredisi
  lot mekanizması** kaldırılır (K-1 eki: "tüketilen kredinin lota iadesi" hükmü düştü); (b) **alımdan bütçe
  türetme** kodu kaldırılır — bütçe artık `PazarlamaButcesi` üzerinden satıcı/bölge/kampanya bazlı ve **elle**
  atanır. Modül "ödül motoru" değil **uyum kütüğüdür** ve kapalı teslim edilir; F-05 bunu bozmadan yapmalı.
- **Test:** `e2e/admin/congress.spec.ts:213`'teki mevcut yarış testi şablon; kontenjanı 1'e
  sabitleyip iki eşzamanlı talep gönder → tam olarak biri başarılı olmalı.

### F-06 — RULE-01 için eşzamanlılık testi ⚠️ **KABUL KRİTERİ DEĞİŞTİ**

> ⚠️ **KARARLAR B-4:** *"Negatif stok **yumuşak kısıttır**."* Yani doğru davranış artık
> "tam olarak biri başarılı" değil; **aşım engellenmez ama izlidir** — yetki + zorunlu gerekçe +
> `OnayBlogu` kaydı. Test bunu doğrulamalı: yarış sonunda stok negatife düşebilir, ama
> **her negatife düşüşün bir blok kaydı** olmalı ve `hesaplaStok()` ile `Σ StockMovement`
> **tutmalıdır**. *(Eşzamanlılık kanıtı hâlâ gerekli — değişen, beklenen sonuçtur.)*

- **Sorun:** Koşullu `updateMany` deseni her iki kanalda da **doğru kurulmuş**
  (`my-orders/actions.ts:110-117`, `dealers/actions.ts:140-153`) ama iki kanalın aynı son
  stok birimini yarıştırdığı durum **hiç test edilmemiş**. `UYGULAMA_PLANI.md` §11'in
  "kritik" dediği iki testten biri eksik.
- **Yap:** yeni e2e testi. Tek ürünün stoğu N'e sabitlenir; **iki ayrı tarayıcı bağlamından**
  (biri satıcı siparişi, biri admin bayi sevkiyat onayı) `Promise.all` ile aynı anda N adet
  talep edilir.
- **Kabul:** `Product.stock >= 0`, başarılı işlem sayısı tam olarak 1, `StockMovement`
  toplamı stok düşümüyle tutarlı.

---

## Grup 3 — Denetim izi ve iş sürekliliği

### F-07 — Para hareketlerinde audit transaction'ın parçası olmalı

- **Sorun:** `src/lib/audit.ts:147-163` — `createAuditLog` hem iş transaction'ının **dışında**
  hem de hatayı **yutuyor**. RULE-13 "istisnasız" diyor; kod bunu garanti etmiyor.
  Para hareketi yazılıp denetim izi yazılmayabilir. §11 (hukuk/uyum) açısından zayıf nokta.
- **Yap:** `createAuditLog`'a tx client kabul eden bir varyant ekle. **Para hareketi doğuran**
  aksiyonlarda (tahsilat, tahsilat iptali, sipariş iptali, manuel `ADJUST`, prim dönem
  kapanışı, bayi ödemesi, sevkiyat onay/iptal) audit transaction'ın **içine** alınsın ve
  hatası **yutulmasın**. Kalan best-effort çağrılar (okuma/giriş vb.) olduğu gibi kalsın.
- **Ek tutarsızlık:** `rejectShipment` audit yazıyor (`dealers/actions.ts:285-291`),
  `withdrawRequest` yazmıyor (`talep/actions.ts:96-106`) — aynı durum geçişi
  (`TALEP → REDDEDILDI`) bir yoldan izli, diğerinden izsiz. Eşitle.
- **Kabul:** para hareketi doğuran her aksiyonda audit satırı transaction ile birlikte
  commit oluyor; ara adım patlatıldığında ikisi de yazılmıyor.

### F-08 — ⛔ **KONUSUZ KALDI — YAPILMAYACAK** *(Expiry job'ı gerçekten zamanlanmalı)*

> ⛔ **KARARLAR K-6 §(2):** *"FIFO kredi lotu, bir yıllık geçerlilik ve iptalde lota iade
> mekanizmalarının tamamı **gereksizleşir ve silinir**."* Zamanlanacak bir job kalmıyor.
> · Bu görevin yerini **F-05'in temizlik yarısı** alır (GÇ-4: defterin sökülmesi).
> · Zamanlayıcı altyapısının kendisi zaten **D-1 kademe 2 · Faz 3 · ayrı fiyat**;
>   A-7, D-3, K-4 ve C-3 periyodik imhası da ona bağlı. Faz 1'de **zamanlayıcı yoktur**.
>
> *Aşağıdaki metin tarihsel kayıt olarak duruyor.*

- **Sorun:** `scripts/expire-congress-balances.ts` doğru yazılmış ve **idempotent**, ama
  onu çalıştıran hiçbir şey yok: cron, systemd timer, Actions `schedule:`, compose servisi —
  hiçbiri. Üretimde bu job **hiç koşmayacak**.
- **Etki:** Para kaçağı **yok** (lazy doğrulama çalışıyor, süresi dolmuş bakiye harcanamıyor),
  ama defterde `EXPIRE` satırı hiç oluşmuyor → "bakiyem nereye gitti?" sorusuna sistem
  cevap veremiyor. §11 denetim izi gereksinimi karşılanmıyor.
- **Yap:** `docker-compose.yml`'e gecelik `npm run job:expire` çalıştıran bir servis ekle
  (deploy ortamı belirsizse `.github/workflows/` altında `schedule: cron` da kabul edilebilir
  ama üretim DB'sine erişim gerektirir — gerekçeyi ADR'ye yaz). Kurulum dokümanına yaz.
- **Test:** entegrasyon testi — `earnedAt`/`expiresAt` geriye kurulmuş bir lot için
  `expireLots()` çağrılınca `EXPIRE` satırı yazılıyor ve ikinci çağrıda **çift yazmıyor**.

### F-09 — ⛔ **KONUSUZ KALDI — YAPILMAYACAK** *(`refundReservation` süresi dolmuş lota iade yapıyor)*

> ⛔ **KARARLAR K-6 §(2):** kongre kredi lotu kavramı kaldırıldığı için iade edilecek lot da yok.
> Bulgunun ardındaki ilke — **sessiz kayıp kabul edilemez** — korunuyor ve genel kural hâline
> geldi: **X-3 §(4) sessiz hata yasağı** + **X-4 §(7) uyarı yutma yasağı**.
>
> *Aşağıdaki metin tarihsel kayıt olarak duruyor.*

- **Sorun:** `src/lib/congress-service.ts:204-207` — iade edilecek lotun hâlâ geçerli olduğunu
  doğrulamadan koşulsuz `update` yapıyor. Lot bu arada `expireLots` ile sıfırlandıysa iade
  süresi dolmuş bir lota yazılır; **bakiye sessizce geri gelmez** ve kullanıcı bunu göremez.
- **Yap:** iade öncesi lotun geçerliliğini kontrol et. Süresi dolmuşsa iade tutarını
  kaybettirme — ya yeni bir `ADJUST` satırıyla açıkça kaydet ya da kullanıcıya görünür bir
  bilgi mesajı üret. **Sessiz kayıp kabul edilemez.**
- **Not:** FR-56 "süre uzamaz" der; bu düzeltme onu ihlal etmemeli — amaç süreyi uzatmak
  değil, kaybı **görünür** kılmak.

### F-10 — `createShipment` iki ayrı transaction kullanıyor

- **Sorun:** `dealers/actions.ts:228-241` sevkiyatı `TALEP` yazıyor, `:242` ayrı transaction'da
  onaylıyor. Onay patlarsa ortada **sahipsiz `TALEP`** kalır — stok/cari etkilemediği için
  zararsız, ama admin onay kuyruğunu kirletir.
- **Yap:** ikisini tek transaction'da birleştir veya onay başarısızlığında `TALEP` kaydını
  geri al. Öncelik düşük — veri bütünlüğü değil, operasyon hijyeni.

---

## Grup 4 — Kanıt

### F-11 — 15 adımlık kabul senaryosu testi ⚠️ **SENARYO YENİDEN YAZILMALI**

> ⚠️ **Aşağıdaki rakamlar geçersiz.** Senaryo iki geri çekilen mekanizmaya dayanıyor:
> **tahsilat bazlı prim** (adım 8, 12 — GÇ-1) ve **kongre EARN/SPEND/EXPIRE** (adım 8–11, 15 — GÇ-4).
> Ayrıca adım 6 **taban fiyat** kontrolüne (GÇ-8), adım 13 **bayi paneline** (GÇ-6) dayanıyor.
> · Senaryo KARARLAR'a göre yeniden yazılmalı: **hakediş sevkiyat anında** doğar, **kısmi
>   sevkiyat** vardır (A-3), **teklif aşaması** vardır (A-5), her belge **`belge_no`** taşır.
> · Görevin **değeri korunuyor** — "PRD'deki örnek senaryo her commit'te doğrulanıyor" cümlesi
>   satış argümanıdır. Değişen, senaryonun kendisi.
> · **Bağlı açık madde:** `FAZ1_UYGULAMA_KAPSAMI.md` §C-e (senaryo) ve §C-c (PRD'nin durumu).
>   Senaryo PRD'de duruyorsa **önce PRD'nin akıbeti** kararlaştırılmalı.

- **Sorun:** `PRD_V2.md:474-497`'deki 15 adımlık zinciri tek akışta koşan test **yok**.
  Adımların 11'i parça parça kapsanıyor, **adım 7 (vade değişikliği) ve adım 15 (EXPIRE)
  hiçbir testte yok**.
- **Yap:** `e2e/acceptance/full-scenario.spec.ts` — 15 adımı sırayla `test.step()` blokları
  olarak koşan **tek bir test**. Her adımın sonunda PRD'deki **somut rakamlar** doğrudan
  assert edilmeli: `714.000 / 595.000 / 200.000 / 395.000 / 29.750 / 36.000 / 16.000`.
- **Adım 15 için:** sistem saatini ileri almak yerine `earnedAt`/`expiresAt` değerlerini
  geriye kurup `expireLots()` çağır.
- **Neden değerli:** Bu test müşteri görüşmesinde de kullanılır — "PRD'deki örnek senaryo
  otomatik olarak her commit'te doğrulanıyor" cümlesi satış argümanıdır.

### F-12 — Kalan TESTSIZ RULE'lar

`TRACEABILITY.md`'de TESTSIZ görünen 5 kuraldan üçü F-04/F-06/F-07 ile kapanıyor.
Kalan ikisi için test yaz:

- **RULE-04** (sipariş anı fiyat/KDV dondurulur): ürün fiyatını sipariş sonrası değiştir →
  eski siparişin tutarları değişmemeli.
  ✅ **KARARLAR ile güçlendi** — C-6 §(2-a): `OrderItem.kdv_orani` **FK değil, değer olarak**
  kopyalanır ve donar. Test bunu da doğrulamalı: `VergiOrani.oran` sonradan değişse bile
  eski satırın oranı **değişmez**.
- **RULE-06** (fiyat listesinde olmayan ürün bayiye sevk edilemez):
  `dealer-shipment.ts:57-62` kodda var, testi yok.
  ~~✅ Kalır — bayi ticari ilişkisi çekirdekte kalıyor; giden yalnız panel ve `DEALER` rolü.~~
  ✅ **15.09.2026 — KARARLAR X-10 (a) ile yaşar.** `dealer-shipment.ts` C5'te sökülüyor (X-8);
  kural artık **bütün carilere** uygulanır ve tek adresi `cozumleBirimFiyat()`'tır.
  **Yazılacak testler (entegrasyon, 1B madde 8):**
  1. Cariye `L1` listesi atanmış; ürün `L1`'de yok ama **varsayılan listede var** → satır
     **kaydedilemez**, X-4 `SERT` *"fiyat çözümlenemedi"*. *Varsayılana düşülmediğini kanıtlar.*
  2. Cariye liste atanmamış → fiyat **varsayılan listeden** çözülür.
  3. Satır kaydedildikten sonra liste fiyatı değiştirilir → eski satırın `liste_fiyat`'ı
     **değişmez** (RULE-04 ile birlikte).
  4. Satıcı listede olan ürün için `birim_fiyat`'ı **liste üstüne ve altına** elle girer →
     kayıt **başarılı**, oran türetilir (Ü-3 §(10) — liste elle girişi sınırlamaz).
- ⛔ **RULE-03 listeden çıkarıldı** (GÇ-8): taban fiyat reddi A-10 ve Ü-3 §(10) ile kaldırılıyor;
  test yazmak yerine **kuralın kendisi geri çekilir**.

---

### X-2 — `recordDealerPayment` transaction kullanmıyor 🔴 **BLOCKER** *(13.09'da eklendi · 15.09: kabul testine dönüştü)*

> **Bu madde brifte yoktu.** KARARLAR §5 onu *"denetimde çıkmış ama hiçbir listede olmayan"*
> maddeler arasında sayıyor ve **07.09.2026'da BLOCKER** olarak karara bağlamış:
> *"canlıya çıkmadan önce düzeltilir; 'bilinçli erteleme' notu geçersizdir."*

- **Sorun:** `src/app/(admin)/dealers/actions.ts:370-379` — bayi tahsilatı transaction dışında.
- **Neden ertelenemez (KARARLAR gerekçesi):** A-14 gereği **`uretBelgeNo()` belgeyle aynı
  transaction içinde** olmak zorundadır; aksi hâlde **numara üretilir, belge yazılmaz** ve
  **`BelgeSayac` deliği kalıcı olur** (A-14 §6: numara oluşumda doğar, ölmez; §9: değiştirilemez).
- **Sıra bağımlılığı:** `uretBelgeNo()` ve `BelgeSayac` **Faz 1'de yazılacak yeni kalemlerdir**
  (`FAZ1_UYGULAMA_KAPSAMI.md` §B.1) — X-2 **A-14 uygulandıktan sonra** kapatılabilir.
  Bugün yapılabilecek olan, ödeme yazımını transaction'a almaktır; numara bağı sonra eklenir.
- **Kapsam notu:** Sistemde **fatura kesimi yoktur** (C-1 §1) — madde yalnız bayi tahsilatıdır.
- **Sıra:** `FAZ1_UYGULAMA_KAPSAMI.md` §D.3 **madde 2** — A-14'ün hemen ardından.
- ✅ **15.09.2026 — KARARLAR X-8 ile görevin biçimi değişti.** Bayi artık `Doktor` satırıdır
  (`hesap_sinifi = BAYI`); `recordDealerPayment` ve `dealers/actions.ts` Faz 1A **C5**'te
  sökülür. Bayi tahsilatı **genel tahsilat akışıdır** (`THS`).
  - **Bugünkü dosyada düzeltme yapılmaz** — silinecek kodu düzeltmek boşa iştir. Hata, bulunduğu
    kodla birlikte gider.
  - **Görev kabul testine dönüşür (1B madde 2, A-14'ten hemen sonra):** **her tahsilat yolu**
    için — `hesap_sinifi` `DOKTOR` ve `BAYI` ayrı ayrı — ödeme kaydı ile `uretBelgeNo()`'nun
    **aynı transaction'da** olduğu entegrasyon testiyle kanıtlanır. Test, numara üretildikten
    sonra yazımı bilerek patlatır ve **`BelgeSayac`'ta delik kalmadığını** doğrular.
  - **Kural değişmez; kapsamı genişler:** KARARLAR X-8 §(7).

---

## Karar bekleyenler → ✅ ÇÖZÜLDÜ (bkz. `KARARLAR.md` §1.1)

Üçü de Faz 0'da karara bağlandı. Karar metni burada tekrarlanmaz; özet + atıf:

| # | Etkilediği görev | Karar (özet — tam metin KARARLAR §1.1) |
|---|------|------|
| **K-1** ✅ | F-03 | İptal **edilebilir**; sipariş `CANCELLED`, kayıt **silinmez**; tahsilat cari hesapta kalır, borç **ters kayıtla** düşer → bakiye avansa döner; prim/tahsilat-oranı/kongre türevleri **ters kaydedilir**. Sevk edilmiş sipariş bu yoldan iptal edilemez (→ iade, A-1). |
| **K-2** ✅ | F-02 (etiketleme) | Ayrı avans kaydı **tutulmaz**; cari bakiye **tek ve işaretli** (Σborç − Σalacak, negatif = avans, **KDV dahil/brüt**); çıplak negatif gösterilmez, **yön etiketiyle** sunulur; tüm ekranlar **tek bakiye fonksiyonunu** çağırır (`tarih?` parametreli); avans sonraki siparişte **otomatik mahsup**. |
| **K-3** ✅ | F-05 | **Yumuşak kısıt.** Aşım engellenmez; **yönetici** gerekçeyle onaylar; her aşım ve her kapasite değişikliği **loglanır** (`OnayBlogu`). |

Artık F-02, F-03 ve F-05'in tamamı uygulanabilir. F-02'nin etiketleme kısmı K-2'ye göre "Cari Bakiye"
(yön etiketli) / "Açık Alacak" ayrımıyla yapılır; avans ayrı satır değil, işaretli tek bakiyenin yönüdür.

---

### ✅ 13.09.2026 — blokeleyen üç madde **kapandı**

K-1/K-2/K-3 kapandı, ama Faz 0'ın devamı üç yeni belirsizlik doğurdu. Üçü de
`FAZ1_UYGULAMA_KAPSAMI.md` §C'de duruyor ve **KARARLAR'da kapatılmaları gerekiyor**
(bu brif karar veremez — YOL_HARITASI §7-6: her ticari/kapsam kararı ana kitaba yazılır).

| # | Karar | Bu brife etkisi |
|---|---|---|
| **X-5** | Parasal alanlar **`Decimal`**; `OrderItem.iskonto_oran` **konmaz**, yerine **`birim_fiyat`**; ham aritmetik yalnız `hesaplaSatirTutarlari()` ve `cozumleBirimFiyat()`; **lint kuralı teslim şartı** | Dönüşüm **Faz 1A'nın** işi; bu brifin görevleri **dönüştürülmüş kod üzerinde** koşar |
| **X-6** | `PaymentAllocation` **kaldırıldı, kalıcı**; **runtime FIFO de yasak**; yaşlandırma **Faz 2+**; vadesi geçmiş **tutar gösterilmez** | **F-04 düşer · F-01 filtreye devredilir · F-02 küçülür**; `DENETIM_BULGULARI.md` D-01 ve D-04 **konusuz kalır** |
| **X-7** | PRD **arşive** (önce taranır); yerine **`KABUL_KRITERLERI.md`**; numaralandırma **karar kimliğinden**; matris **kod × test × karar** | Brifin kaynağı değişir: `PRD_V2.md`'ye değil **KARARLAR + kabul kriterlerine** atıf. F-11 senaryosu oraya taşınır |

**Kural aynı kalıyor:** *bir kararın uygulama ayrıntısında boşluk görürsen KARARLAR'daki ilgili
maddeye atıfla not düş, kararı yeniden yorumlama.* Yeni bir **karar boşluğu** görürsen
(ayrıntı değil, kararın kendisi eksikse) `FAZ1_UYGULAMA_KAPSAMI.md` **§C açık madde defterine**
yaz; orada KARARLAR'a taşınır ve kapatılır. **Not düşerek geçme.**

---

## Bu turda YAPMA

Denetimde çıkan ama bu tura girmeyenler — ayrı bir turda, ürünleştirme işiyle birlikte:

- FR-28 (vadesi geçmiş doktora sipariş uyarısı) — PRD zaten "blok yok, uyarı" diyor
- ⛔ ~~FR-18 toggle kapsamının genişletilmesi~~ — **13.09 düzeltmesi:** Ü-3 §(3) gereği toggle
  **hiçbir ekranda genişletilmeyecek**; `pricing.fiyatGirisiKdvDahil` **`false` kalır ve açılmaz**
  (müşteri beyanı: fiyat listeleri KDV hariç). B ve C sınıfı ekranlarda **kalıcı olarak yoktur**.
  Yerini **taban etiketi zorunluluğu** alır ve **o Faz 1 işidir** (bu brifin dışında,
  `YOL_HARITASI.md` §3.2). Çerez/`vat-mode.ts` tercihi **geri çekilir** (GÇ-9).
- ⚠️ Admin ayar ekranı (`setSetting` hiç çağrılmıyor: vade / prim oranı / KDV oranı) →
  **13.09 düzeltmesi:** KARARLAR'da config noktaları `policy.ts`'te **belirlenir, kullanıcıya
  açılmaz** (A-15 §(3), E-2 §(4)). Ekranı olan tek şey **tanım tablolarıdır** (`VergiOrani`,
  `OdemeYontemi`, `KargoFirma`, `StokKonum`, `StokDuzeltmeSebep`, fiyat listeleri — §0.1.1).
  Vade varsayılanı ve nakit tevsik limiti **config'tir, ekran almaz**.
- FR-31 satıcı bazlı prim oranı form alanı → Faz 2 (Ü-2)
- Route group başına `error.tsx` / `loading.tsx` (D-06) — UX, veri bütünlüğü değil
- `validateManualAllocation`'ın UI'a bağlanması (FR-24'ün manuel yarısı)
- FR-09 yumuşak benzerlik uyarısı — sert kural (telefon) çalışıyor
- FR-58 / FR-60 eksik kartlar

---

## Çalışma disiplini

- **Sıra `FAZ1_UYGULAMA_KAPSAMI.md` §D'dedir** *(15.09.2026)*: **F-00** = 1A commit C1 ·
  **X-2** = 1B madde 2 (A-14'ten sonra) · **F-02, F-03, F-05, F-06, F-07, F-10, F-12** = 1B
  madde 8 · **F-11** = 1B madde 9. Bu brifteki **grup numaraları konu gruplamasıdır, sıra
  değildir.** *(Önceki metin: "F-00 önce. Sonra Grup 1 → Grup 2 → Grup 3 → Grup 4.")*
- Her bug düzeltmesi için **önce testi yaz, kırmızı olduğunu gör**, sonra düzelt. Bu turda
  bulunan hatalar tam olarak "test yokken sessizce yanlış çalışan" sınıfı; testsiz düzeltme
  aynı sınıfı yeniden üretir.
- Her görev ayrı commit; commit mesajında hangi denetim bulgusunu (D-0X / F-0X) kapattığını yaz.
- ~~`PROJE_DURUMU.md`'deki iki belge hatası~~ → **11.09.2026'da düzeltildi** (RULE-12 satırı + rapor sayısı).
- **Her görev sonunda üç dosya güncellenir** (YOL_HARITASI §7-4): `PROJE_DURUMU.md`,
  `docs/TRACEABILITY.md`, `YOL_HARITASI.md`. **13.09'dan itibaren dördüncüsü:**
  `FAZ1_UYGULAMA_KAPSAMI.md` — geri çekilen her kalem orada işaretlenir, yoksa neyin sökülüp
  neyin sökülmediği takip edilemez. **Commit hash yalnız §A'ya yazılır** (§D izleme kuralı).
- Belirsizlikte varsayım yapıp ilerle, kısa bir not düş. **🟡 kalmadı** — K-1/K-2/K-3 karara bağlandı
  (`KARARLAR.md` §1.1), F-03/F-05 seçilen yolla uygulanır. Yine de bir kararın **uygulama ayrıntısında**
  boşluk görürsen KARARLAR'daki ilgili maddeye atıfla not düş, kararı yeniden yorumlama.
