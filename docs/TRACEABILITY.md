# İzlenebilirlik Matrisi — PRD_V2.md v2.2

> Üretim tarihi: 8 Ağustos 2026 · Kaynak: `PRD_V2.md` (FR-01…FR-64, FR-46a…g, RULE-01…15)
> Yöntem: kod okuması + test adı/gövde eşlemesi. **Kötümser değerlendirme** — emin olunamayan satır `TESTSIZ` yazıldı.
>
> **🔄 KARARLAR senkronizasyonu — 11.09.2026.** Bu matris **kodun aynasıdır**; KANITLI/TESTSIZ/YOK
> durumları yalnız kod + test değişince güncellenir (Faz 1 sonunda yeniden koşulur). Faz 0'da
> **hiç kod yazılmadı**, o yüzden buradaki sayaçlar **hâlâ 8 Ağustos denetimindeki gibidir**. Faz 0'ın
> yaptığı, bu boşluklara **karar** vermektir; hangi boşluğun hangi karara/göreve bağlandığı **§6'da**
> (aşağıda yeni eklendi). Ana kitap `KARARLAR.md`.
>
> **🔄 16.09.2026 (2) — PRD taraması tamamlandı (sayaçlar değişmedi).** §6.4'e taramanın bulduğu
> ⛔ satırları eklendi (§6.4 sonu). Sonuç: `FAZ1_UYGULAMA_KAPSAMI.md` §E.3.
>
> **🔧 16.09.2026 — atıf düzeltmesi (sayaçlar değişmedi).** §6.4 sonundaki *"PRD'nin akıbeti §C-c'de açık"*
> ifadesi bayattı (§C-c 13.09'da X-7 ile kapandı). 59 maddelik PRD taramasının çıktı tablosu artık
> `FAZ1_UYGULAMA_KAPSAMI.md` **§E**'dir.
>
> **🔄 15.09.2026 — KARARLAR X-8 · X-9 · X-10 işlendi (matris sayaçları değişmedi — kod değişmedi).**
> Yalnız **§6.4** güncellendi: bayi yönetimi FR'leri (FR-39…FR-46) ve FR-60 **yeniden tanımlanır**
> satırına alındı (bayi artık `Doktor` satırı — X-8); **RULE-14 tamamen düşer**, **RULE-06 ve
> RULE-15 yeniden tanımlanır**. `LoginAttempt` (X-9) matriste FR/RULE satırı olmadığı için burada
> görünmez — geri çekme listesinde **GÇ-14**.
>
> **🔴 KARARLAR uyum denetimi — 13.09.2026.** §6 bir soruyu cevaplıyordu: *"hangi boşluk hangi
> karara bağlandı?"* Cevaplamadığı soru şuydu: **"hangi KANITLI satır KARARLAR ile geçersizleşti?"**
> Bu fark önemli — çünkü o satırlar Faz 1 sonunda **KANITLI kalmayacak, silinecek**.
> Bir okuyucu bugün FR-49'u *"KANITLI, sorun yok"* diye okuyor; oysa o gereksinim
> **K-6 ile geçersiz**. Yeni **§6.4** bu listeyi taşıyor.
>
> ⚠️ **İki uyarı:**
> 1. **KANITLI ≠ KARARLAR'a uygun.** İlki "kod + test var" demektir, ikincisi ayrı bir sorudur.
> 2. **🔵 Bu matris dönüşüyor — `KARARLAR.md` X-7 (13.09.2026).** `PRD_V2.md` **arşivlenir**
>    (önce 71 FR + 15 RULE taranır); yerini **`KABUL_KRITERLERI.md`** alır. Matris
>    **"kod × test × karar"** hâline gelir: kolonlar **kriter kodu · davranış · kod yeri ·
>    kanıtlayan test · durum · kaynak karar**. Numaralandırma **karar kimliğinden türer**
>    (`A-3-1`, `C-6-2`); **`FR-*` terk edilir**.
>    · **İskelet Faz 1A'da** kurulur, **metinler Faz 1B görevlerinde** — testten **önce**.
>    · Yan fayda: §6.4'ün elle yazılması gereken *"bu satırın hedefte karşılığı var mı"*
>      sorusu **matrisin içinden** cevaplanır; `Ü-*` ve `C-*` numara çakışması notları da
>      konusuz kalır.
>    · **Bakım kuralı (X-7 §(7)):** kriteri olmayan karar **doğrulanamaz**; kararı olmayan
>      kriter **kaynaksızdır ve silinir**.

## Durum tanımları

- **KANITLI** — kodda var **ve** FR'nin tarif ettiği davranışı doğrulayan birim/e2e testi var
- **TESTSIZ** — kodda var, ama davranışını doğrulayan test yok **veya** gereksinimin zorlanabilir bir parçası eksik
- **YOK** — kodda karşılığı bulunamadı

### Uygulanan karar kuralı (kısmi uygulamalar için)

PRD bazı FR'lerde birden çok şart sayıyor. Tutarlılık için:

- Gereksinimin **zorlanabilir** bir alt maddesi eksikse → `TESTSIZ` (Özet kolonunda eksik açıkça yazıldı)
- Eksik olan alt madde PRD'de **tavsiye/yumuşak kontrol** diye nitelenmişse → çekirdek kural kanıtlıysa `KANITLI` + not

---

## 1. Fonksiyonel Gereksinimler (FR)

### 5.1 Doktor Yönetimi ve Satıcı–Doktor Eşleşmesi

| FR | Özet | Uygulandığı yer (dosya:satır) | Kanıtlayan test | Durum |
|----|------|-------------------------------|-----------------|-------|
| FR-01 | Doktor kaydı alanları (ad, klinik, bölge, telefon…) | `src/app/(seller)/my-doctors/actions.ts:12-44` | — (zorunlu alan reddi için test yok) | TESTSIZ |
| FR-02 | Doktorun en fazla bir sorumlu satıcısı | `prisma/schema.prisma` `Doctor.ownerSellerId` (tekil FK); `src/lib/doctor.ts:35` | `src/lib/doctor.test.ts:16` | KANITLI |
| FR-03 | Satıcı doktor açar, sahiplik otomatik atanır | `src/app/(seller)/my-doctors/actions.ts:76` | `e2e/seller/doctors.spec.ts:46` | KANITLI |
| FR-04 | Sahibi olmadığı doktora sipariş **oluşturamaz** (sunucu) | `src/app/(seller)/my-orders/actions.ts:43-50`; `src/lib/doctor.ts:35` | `src/lib/doctor.test.ts:16`; `e2e/seller/doctors.spec.ts:132` | KANITLI |
| FR-05 | Satıcı yalnız kendi doktorlarını görür | `src/lib/doctor.ts:42`; `src/app/(seller)/my-doctors/page.tsx:24` | `src/lib/doctor.test.ts:63`; `e2e/seller/doctors.spec.ts:90` | KANITLI |
| FR-06 | Admin doktoru devreder; devir kaydı tutulur | `src/app/(admin)/doctors/actions.ts:47-70` | `e2e/admin/doctor-transfer.spec.ts:44` | KANITLI |
| FR-07 | Devir sonrası geçmiş **eski satıcıda kalır** | `src/app/(admin)/doctors/actions.ts:54-57` (`Order.sellerId` dokunulmaz); `src/lib/commission-service.ts:45-54` | `e2e/admin/doctor-transfer.spec.ts:44` | KANITLI |
| FR-08 | Pasif satıcının doktorları sahipsiz havuza düşer | `src/lib/doctor.ts:27`; `src/app/(admin)/doctors/actions.ts:30-31` | `src/lib/doctor.test.ts:34`; `e2e/admin/doctor-transfer.spec.ts:132` | KANITLI |
| FR-09 | Normalize telefon **benzersiz** (+ ad/klinik benzerlik uyarısı) | `src/lib/phone.ts:25-46`; `prisma/schema.prisma` `phoneNormalized @unique`; `src/app/(seller)/my-doctors/actions.ts:57-70` | `src/lib/phone.test.ts:11`; `e2e/seller/doctors.spec.ts:67` | KANITLI ¹ |
| FR-10 | Doktor detayı: cari, vade, geçmiş, kongre defteri | `src/app/(admin)/doctors/[id]/page.tsx:33-129` | `e2e/admin/doctor-detail.spec.ts:42` | KANITLI |

¹ Telefon benzersizliği (sert kural) tam ve yarış-güvenli. PRD'nin "yumuşak kontrol" dediği **ad-soyad + klinik benzerlik uyarısı kodda YOK**.

### 5.2 Fiyatlandırma, Taban Fiyat ve KDV

| FR | Özet | Uygulandığı yer (dosya:satır) | Kanıtlayan test | Durum |
|----|------|-------------------------------|-----------------|-------|
| FR-11 | Ürün bazlı liste + taban fiyat | `src/app/(admin)/products/actions.ts:18-44` | `e2e/admin/products.spec.ts:4,22` | KANITLI |
| FR-12 | Satıcı birim fiyatı değiştirir; taban altı **reddedilir** | `src/app/(seller)/my-orders/actions.ts:93-104` | `e2e/seller/pricing.spec.ts:25` | KANITLI |
| FR-13 | Fiyat sipariş anında **snapshot** | `src/app/(seller)/my-orders/actions.ts:121-130` | — (fiyat sonradan değişince eski sipariş korunuyor mu: test yok) | TESTSIZ |
| FR-14 | Kalem bazında iskonto oranı hesaplanıp **saklanır** | `src/app/(seller)/my-orders/actions.ts:127`; `src/lib/vat.ts:90` | `src/lib/vat.test.ts:107` (yalnız saf hesap; saklanma doğrulanmıyor) | TESTSIZ |
| FR-15 | Fiyat değişiklikleri audit log'a yazılır | `src/app/(admin)/products/actions.ts:117` | — (audit satırını doğrulayan test yok) | TESTSIZ |
| FR-16 | KDV %20 **sistem parametresi**; ürün bazında override | `src/lib/vat.ts:15` (sabit); `src/app/(admin)/products/actions.ts:44` (override) | `src/lib/vat.test.ts:122` | TESTSIZ ² |
| FR-17 | Kanonik net saklama + snapshot alanları | `src/lib/vat.ts` `lineTotals`; `src/app/(seller)/my-orders/actions.ts:121-130` | `src/lib/vat.test.ts:52,67` | KANITLI |
| FR-18 | **Tüm** fiyat girişi ve listelerde KDV Dahil/Hariç + tercih hatırlanır | `src/lib/vat-mode.ts`; `src/components/VatToggle.tsx`; `src/app/(seller)/my-orders/OrderForm.tsx:52,180` | `e2e/seller/pricing.spec.ts:44`; `e2e/admin/reports.spec.ts:75` | TESTSIZ ³ |
| FR-19 | Taban fiyat net; karşılaştırma net üzerinden | `src/app/(admin)/products/actions.ts:17-19`; `src/app/(seller)/my-orders/actions.ts:99` | `e2e/seller/pricing.spec.ts:25` | KANITLI |

² %20 varsayılanı ve ürün override'ı var; **admin'in sistem geneli KDV oranını değiştirebileceği bir yol yok** (`SETTING_KEYS` içinde KDV anahtarı yok — `src/lib/settings.ts:10-16`).
³ Toggle yalnız **2 ekranda**: `reports/page.tsx:43` ve `my-orders/OrderForm.tsx`. Diğer tüm liste/giriş ekranlarında yok (bkz. D-08).

### 5.3 Doktor Cari, Vade ve Tahsilat

| FR | Özet | Uygulandığı yer (dosya:satır) | Kanıtlayan test | Durum |
|----|------|-------------------------------|-----------------|-------|
| FR-20 | Bakiye = Σ sipariş (brüt, iptal hariç) − Σ tahsilat | `src/lib/doctor-cari.ts:29-48` | `e2e/admin/collections.spec.ts:87,139` | KANITLI |
| FR-21 | Vade tarihi; varsayılan gün ve üst sınır **admin parametresi** | `src/app/(seller)/my-orders/actions.ts:64-67`; `src/lib/settings.ts:23-37` | — | TESTSIZ ⁴ |
| FR-22 | Vade değiştirilebilir; geçmiş + audit | `src/app/(admin)/collections/actions.ts:205-263` | — (e2e yok) | TESTSIZ |
| FR-23 | Tahsilat kaydı alanları | `src/app/(admin)/collections/actions.ts:60-74` | `e2e/admin/collections.spec.ts:50` | KANITLI |
| FR-24 | FIFO mahsuplaşma **+ admin manuel düzeltme** | `src/lib/allocation.ts:30-54` (FIFO); `src/lib/allocation.ts:60-89` (manuel doğrulama) | `src/lib/allocation.test.ts:19`; `e2e/admin/collections.spec.ts:50` | TESTSIZ ⁵ |
| FR-25 | Kısmi tahsilat; prim ve kongre **orantılı** | `src/lib/commission.ts:52-59`; `src/app/(admin)/collections/actions.ts:94-99` | `src/lib/commission.test.ts:66`; `src/lib/allocation.test.ts:36`; `e2e/admin/collections.spec.ts:139` | KANITLI |
| FR-26 | Yaşlandırma kovaları (0/1-30/31-60/61-90/90+) | `src/lib/allocation.ts:127-153`; `src/lib/doctor-cari.ts:175-202` | `src/lib/allocation.test.ts:145,181`; `e2e/admin/collections.spec.ts:156` | KANITLI |
| FR-27 | Satıcı panelinde kendi doktorlarının vadesi yaklaşan/geçen alacakları | `src/app/(seller)/account/page.tsx:44-54` | — (e2e yok) | TESTSIZ |
| FR-28 | Vadesi geçmiş borcu olan doktora yeni siparişte **uyarı** | — bulunamadı (`my-orders/new/page.tsx` hiç gecikme verisi çekmiyor) | — | **YOK** |
| FR-29 | Tahsilat iptali; ters kayıt; kongre negatife düşerse uyarı | `src/app/(admin)/collections/actions.ts:139-199`; `src/lib/congress-service.ts:89-132` | `e2e/admin/collections.spec.ts:87` | KANITLI |

⁴ `setSetting()` (`src/lib/settings.ts:39`) hiçbir yerden **çağrılmıyor** — admin ayar ekranı yok; değerler sabit varsayılanlara (30/180) düşüyor.
⁵ `validateManualAllocation` yazılmış ve birim testi var, ama **hiçbir action/UI'dan çağrılmıyor** — manuel mahsup düzeltmesi kullanıcıya açık değil.

### 5.4 Satıcı Primi

| FR | Özet | Uygulandığı yer (dosya:satır) | Kanıtlayan test | Durum |
|----|------|-------------------------------|-----------------|-------|
| FR-30 | Varsayılan prim %5, **sistem parametresi (admin değiştirebilir)** | `src/lib/commission.ts:17` (sabit) | `src/lib/commission.test.ts:15` | TESTSIZ ⁶ |
| FR-31 | Satıcı bazında oran override | `src/lib/commission-service.ts:24-31` (yalnız okuma) | `src/lib/commission.test.ts:161` (saf hesap) | TESTSIZ ⁷ |
| FR-32 | Dönem = takvim ayı | `src/lib/commission.ts:21-24`; `src/lib/commission-service.ts:17-22` | `src/lib/commission.test.ts:20` | KANITLI |
| FR-33 | Matrah: tahsil edilen tutar, KDV hariç | `src/lib/commission-service.ts:39-59`; `src/lib/commission.ts:52-59` | `src/lib/commission.test.ts:57,66,72` | KANITLI |
| FR-34 | Dönem kapat → matrah/oran/prim **dondurulur** | `src/app/(admin)/commissions/actions.ts:37-108` | `e2e/admin/commissions.spec.ts:85,151,205` | KANITLI |
| FR-35 | Kapanmış dönem iptali → sonraki döneme negatif kayıt | `src/lib/commission-service.ts:140-201` | `src/lib/commission.test.ts:134`; `e2e/admin/commissions.spec.ts:85` | KANITLI |
| FR-36 | HESAPLANDI → ONAYLANDI → ÖDENDİ | `src/app/(admin)/commissions/actions.ts:110-148` | `e2e/admin/commissions.spec.ts:173` | KANITLI |
| FR-37 | Satıcı paneli: anlık tahsilat, tahmini prim, "henüz tahsil edilmedi" | `src/app/(seller)/my-commissions/page.tsx`; `src/lib/commission-service.ts:81-131` | — (e2e yok) | TESTSIZ |
| FR-38 | Kongre harcaması primi **etkilemez** | Yapısal: prim yalnız `PaymentAllocation` okur (`src/lib/commission-service.ts:45-54`) | — (kongre→prim izolasyonu için test yok; `e2e/admin/dealer.spec.ts:186` yalnız bayi tarafını kanıtlıyor) | TESTSIZ |

⁶ Oran `DEFAULT_COMMISSION_RATE` sabiti; `SystemSetting` üzerinden yönetilmiyor, admin UI yok.
⁷ `User.commissionRate` şemada var ve okunuyor; **yazacak bir form/action yok** (`SellerForm.tsx` alanları: ad, e-posta, telefon, şifre, durum).

### 5.5 Bayi Yönetimi

| FR | Özet | Uygulandığı yer (dosya:satır) | Kanıtlayan test | Durum |
|----|------|-------------------------------|-----------------|-------|
| FR-39 | Bayi kaydı + opsiyonel DEALER hesabı | `src/app/(admin)/dealers/actions.ts:23-83` | `e2e/admin/dealer.spec.ts:225` | KANITLI |
| FR-40 | Bayi × ürün sabit net fiyat; fiyatsız ürün sevk edilemez | `src/app/(admin)/dealers/actions.ts:86-120`; `src/lib/dealer-shipment.ts:57-62` | — | TESTSIZ |
| FR-41 | Fiyat değişikliği geriye etki etmez (snapshot) | `src/lib/dealer-shipment.ts:64-72` | — | TESTSIZ |
| FR-42 | Sevkiyat onayı: stok düşer + cariye yazılır, **tek transaction** | `src/app/(admin)/dealers/actions.ts:127-175` | `e2e/admin/dealer.spec.ts:90` | KANITLI |
| FR-43 | Stok yetersizse sevkiyat tamamen reddedilir | `src/app/(admin)/dealers/actions.ts:140-153` | `e2e/admin/dealer.spec.ts:159` | KANITLI |
| FR-44 | Sevkiyat iptali: stok `IN`, borç geri alınır | `src/app/(admin)/dealers/actions.ts:298-354` | `e2e/admin/dealer.spec.ts:120` | KANITLI |
| FR-45 | Bayi cari = Σ sevkiyat (iptal hariç) − Σ ödeme | `src/lib/dealer-cari.ts:23-42` | `e2e/admin/dealer.spec.ts:90,120` | KANITLI |
| FR-46 | Bayi ödemesi + vade takibi ve yaşlandırma | `src/app/(admin)/dealers/actions.ts:357-391`; `src/lib/dealer-cari.ts:79-110` | — | TESTSIZ |
| FR-46a | DEALER login; erişim yalnız kendi verisi (sunucu) | `src/lib/dealer-session.ts:10` | `e2e/dealer/panel.spec.ts:83,106` | KANITLI |
| FR-46b | Bayi dashboard (read-only) | `src/app/(dealer)/bayi/page.tsx:16` | `e2e/dealer/panel.spec.ts:46` | KANITLI |
| FR-46c | Bayi yalnız kendi fiyat listesini görür | `src/app/(dealer)/bayi/fiyatlar/page.tsx:7` | `e2e/dealer/panel.spec.ts:83` | KANITLI |
| FR-46d | Sevkiyat talebi; TALEP'te stok/cari **değişmez** | `src/app/(dealer)/bayi/talep/actions.ts:19-70` | `e2e/dealer/panel.spec.ts:52` | KANITLI |
| FR-46e | Bayi talebini geri çeker; admin gerekçeli reddeder | `src/app/(dealer)/bayi/talep/actions.ts:74-110`; `src/app/(admin)/dealers/actions.ts:260-295` | — | TESTSIZ |
| FR-46f | Bayi sipariş veremez / stok göremez / fiyat değiştiremez | `src/app/(dealer)/bayi/talep/actions.ts:17-27` (dealerId oturumdan) | `e2e/dealer/panel.spec.ts:106` | KANITLI |
| FR-46g | Pasif bayi login olamaz | `src/app/(admin)/dealers/actions.ts:404-413`; `src/lib/session.ts:31-33` | `e2e/admin/dealer.spec.ts:225` | KANITLI |

### 5.6 Kongre ve Doktor Kongre Bakiyesi

| FR | Özet | Uygulandığı yer (dosya:satır) | Kanıtlayan test | Durum |
|----|------|-------------------------------|-----------------|-------|
| FR-47 | Kongre CRUD | `src/app/(admin)/congresses/actions.ts` | `e2e/admin/congress-edit.spec.ts:42` | KANITLI |
| FR-48 | Kongre paketi (değer kuruş, kontenjan) | `src/app/(admin)/congresses/actions.ts` | `e2e/admin/congress-edit.spec.ts:59,77,126` | KANITLI |
| FR-49 | Tahsilatta `EARN`, %100, matrah net | `src/lib/congress-service.ts:54-81`; `src/lib/congress-ledger.ts:145-148` | `src/lib/congress-ledger.test.ts:225`; `e2e/admin/congress.spec.ts:85` | KANITLI |
| FR-50 | Her `EARN`'ün son kullanma tarihi = +12 ay | `src/lib/congress-ledger.ts:37-49` | `src/lib/congress-ledger.test.ts:37,51`; `e2e/admin/congress.spec.ts:85` | KANITLI |
| FR-51 | Harcama FIFO (en eski kazanım önce) | `src/lib/congress-ledger.ts:111-139` | `src/lib/congress-ledger.test.ts:111`; `e2e/admin/congress.spec.ts:314` | KANITLI |
| FR-52 | `EXPIRE`: gecelik job **+ lazy doğrulama** | `src/lib/congress-service.ts:235-281`; `scripts/expire-congress-balances.ts` | `src/lib/congress-ledger.test.ts:77,190` (lazy taraf) | TESTSIZ ⁸ |
| FR-53 | Kayıt akışı: TALEP (rezerve) → admin onayı | `src/app/(seller)/my-congresses/actions.ts:76-100`; `src/app/(admin)/congresses/actions.ts:273` | `e2e/admin/congress.spec.ts:168,229,314` | KANITLI |
| FR-54 | Bakiye yetersizse **sert red** + eksik tutar | `src/app/(seller)/my-congresses/actions.ts:94-108`; `src/lib/congress-ledger.ts:126-128` | `e2e/admin/congress.spec.ts:120` | KANITLI |
| FR-55 | Kontenjan; rezerve talepler de düşer | `src/app/(seller)/my-congresses/actions.ts:65-71` | — (kontenjan dolu reddi test edilmiyor) | TESTSIZ ⁹ |
| FR-56 | İptalde bakiye iade; **son kullanma uzamaz** | `src/lib/congress-service.ts:191-229` | `e2e/admin/congress.spec.ts:229` | KANITLI |
| FR-57 | Hareket defteri + gerekçeli manuel `ADJUST` + audit | `src/app/(admin)/doctors/[id]/actions.ts:13-90`; `src/app/(admin)/doctors/[id]/page.tsx:129` | `e2e/admin/doctor-detail.spec.ts:59,87,102` | KANITLI |
| FR-58 | Kongre ekranı: katılımcı, kalan kontenjan, **toplam kullanılan bakiye** | `src/app/(admin)/congresses/page.tsx:114,126` (Onaylı/Kontenjan) | — ("toplam kullanılan bakiye" görünmüyor) | TESTSIZ |
| FR-59 | Satıcı: bakiye, yakında dolacak uyarısı, yeterli paketler | `src/app/(seller)/my-congresses/page.tsx:19-103`; `src/lib/congress-ledger.ts:79-91` | `src/lib/congress-ledger.test.ts:202` (yalnız saf hesap) | TESTSIZ |

⁸ Lazy doğrulama gerçekten çalışıyor (`availableBalance`/`planFifoSpend` süresi dolmuş lotu saymıyor). Ancak job'ı **zamanlayan hiçbir şey yok** ve `expireLots()`'ın `EXPIRE` satırı yazışı test edilmemiş.
⁹ Kontenjan kontrolü transaction **dışında** (`:67`) — eşzamanlı iki talepte aşılabilir.

### 5.7 Dashboard ve Raporlama

| FR | Özet | Uygulandığı yer (dosya:satır) | Kanıtlayan test | Durum |
|----|------|-------------------------------|-----------------|-------|
| FR-60 | Admin dashboard: kanal ciro, açık alacak + aging, **ay içi prim yükü**, bayi alacağı, açık kongre bakiyesi | `src/app/(admin)/dashboard/page.tsx:106-138`; `src/lib/reports-service.ts:172-182` | `e2e/admin/smoke.spec.ts:15` (yalnız sayfa açılıyor mu) | TESTSIZ ¹⁰ |
| FR-61 | Satıcı dashboard: tahsilat/prim ilerlemesi, gecikmeler, portföy, ortalama iskonto | `src/app/(seller)/account/page.tsx:37-54`; `src/app/(seller)/my-commissions/page.tsx` | — | TESTSIZ |
| FR-62 | Satıcı performans karşılaştırması | `src/lib/reports-service.ts:18-66`; `src/app/(admin)/reports/page.tsx:59` | `src/lib/reports.test.ts:26`; `e2e/admin/reports.spec.ts:25` | KANITLI |
| FR-63 | Doktor ciro sıralaması + kongre bakiye + gecikmiş borç | `src/lib/reports-service.ts:78-132`; `src/app/(admin)/reports/page.tsx:113` | `e2e/admin/reports.spec.ts:25` | KANITLI |
| FR-64 | Tüm raporlarda KDV dahil/hariç seçeneği | `src/app/(admin)/reports/page.tsx:43`; `src/components/VatToggle.tsx` | `src/lib/reports.test.ts:74`; `e2e/admin/reports.spec.ts:40,75` | KANITLI |

¹⁰ Dashboard'da **"ay içi prim yükü" kalemi yok** — diğer beş kalem mevcut (açık kongre bakiyesi dahil, `:120-125`).

---

## 2. Değişmez İş Kuralları (RULE)

| RULE | Özet | Uygulandığı yer (dosya:satır) | Kanıtlayan test | Durum |
|------|------|-------------------------------|-----------------|-------|
| RULE-01 | Stok hiçbir koşulda eksiye düşemez | `src/app/(seller)/my-orders/actions.ts:110-117`; `src/app/(admin)/dealers/actions.ts:140-153` | `e2e/admin/dealer.spec.ts:159` (yalnız ardışık senaryo) | TESTSIZ ¹¹ |
| RULE-02 | Bir doktora aynı anda tek satıcı | `src/lib/doctor.ts:35`; `prisma/schema.prisma` `Doctor.ownerSellerId` | `src/lib/doctor.test.ts:16`; `e2e/seller/doctors.spec.ts:132` | KANITLI |
| RULE-03 | Satış fiyatı taban fiyatın (net) altına inemez | `src/app/(seller)/my-orders/actions.ts:99-104` | `e2e/seller/pricing.spec.ts:25` | KANITLI |
| RULE-04 | Sipariş anındaki fiyat/KDV/tutar dondurulur | `src/app/(seller)/my-orders/actions.ts:121-130` | — | TESTSIZ |
| RULE-05 | Kapanmış prim dönemi asla değişmez | `src/app/(admin)/commissions/actions.ts:53-62`; `src/lib/commission-service.ts:174-199` | `e2e/admin/commissions.spec.ts:85` | KANITLI |
| RULE-06 | Fiyat listesinde olmayan ürün bayiye sevk edilemez | `src/lib/dealer-shipment.ts:57-62` | — | TESTSIZ |
| RULE-07 | Kongre bakiyesi negatife düşürülerek harcanamaz | `src/lib/congress-ledger.ts:126-128` | `src/lib/congress-ledger.test.ts:133`; `e2e/admin/congress.spec.ts:120`; `e2e/admin/doctor-detail.spec.ts:102` | KANITLI |
| RULE-08 | Bakiyeler ayrı kolonda tutulmaz, hesaplanır | `src/lib/doctor-cari.ts:29-48`; `src/lib/congress-ledger.ts:57-68` | `e2e/admin/collections.spec.ts:87`; `e2e/admin/congress.spec.ts:85` | KANITLI |
| RULE-09 | Aynı bakiye iki pakete aynı anda kullanılamaz | `src/lib/congress-service.ts:158-166` (koşullu `updateMany`) | `e2e/admin/congress.spec.ts:168` (**gerçek eşzamanlı yarış testi**) | KANITLI |
| RULE-10 | Parasal alanlar tam sayı kuruş; kanonik net | `src/lib/money.ts`; `prisma/schema.prisma` (BigInt) | `src/lib/money.test.ts:4,33` | KANITLI |
| RULE-11 | Kongre harcaması FIFO | `src/lib/congress-ledger.ts:111-139` | `src/lib/congress-ledger.test.ts:111`; `e2e/admin/congress.spec.ts:314` | KANITLI |
| RULE-12 | Tahsilat: mahsup + doktor bakiyesi + prim matrahı + kongre **tek transaction** | `src/app/(admin)/collections/actions.ts:59-110` | — (ara adımı bilerek patlatan atomiklik testi yok) | TESTSIZ ¹² |
| RULE-13 | Kritik değişiklikler **istisnasız** audit log'a | `src/lib/audit.ts:148-163` | `src/lib/audit.test.ts:9`; `e2e/admin/doctor-detail.spec.ts:59` | TESTSIZ ¹³ |
| RULE-14 | Bayi yalnız kendi verisi; onaysız talep stok/cari etkilemez | `src/lib/dealer-session.ts`; `src/app/(dealer)/bayi/talep/actions.ts` | `e2e/dealer/panel.spec.ts:52,83,106` | KANITLI |
| RULE-15 | Bayi prim/kongreye hiç dahil olmaz | Yapısal (bayi yolları `CongressLedger`/`CommissionPeriod`'a hiç yazmıyor) | `e2e/admin/dealer.spec.ts:186` | KANITLI |

¹¹ Koşullu `updateMany` deseni her iki kanalda da doğru kurulmuş; eksik olan **eşzamanlılık kanıtı** (bkz. D-02).
¹² Sınır doğru çizilmiş ama mahsup planı transaction **dışında** hesaplanıyor (`:52-55`) — bkz. D-01.
¹³ `createAuditLog` **best-effort**: hatayı yutuyor (`src/lib/audit.ts:160-162`) ve iş transaction'ının dışında çalışıyor. "İstisnasız" garantisi kod düzeyinde sağlanmıyor.

---

## 3. Özet Sayaçlar

### Fonksiyonel Gereksinimler (FR-01…FR-64 + FR-46a…g = 71 madde)

| Durum | Adet | Oran |
|-------|------|------|
| **KANITLI** | 46 | %64,8 |
| **TESTSIZ** | 24 | %33,8 |
| **YOK** | 1 | %1,4 |

**YOK olan tek madde:** FR-28 (vadesi geçmiş borcu olan doktora yeni sipariş uyarısı).

### İş Kuralları (RULE-01…RULE-15 = 15 madde)

| Durum | Adet | Oran |
|-------|------|------|
| **KANITLI** | 10 | %66,7 |
| **TESTSIZ** | 5 | %33,3 |
| **YOK** | 0 | %0 |

**TESTSIZ kurallar:** RULE-01, RULE-04, RULE-06, RULE-12, RULE-13.

---

## 4. Kısmi uygulamalar (kodda var ama gereksinimin bir parçası eksik)

Bu maddeler yukarıda `TESTSIZ` sayıldı; eksik olan **zorlanabilir** parça:

| FR | Eksik olan |
|----|-----------|
| FR-16 | Sistem geneli KDV oranını değiştirecek admin yolu yok (sabit) |
| FR-18 | Toggle yalnız 2 ekranda; "tüm listelerde" karşılanmıyor |
| FR-21 | `setSetting()` hiç çağrılmıyor — vade parametreleri admin'e açık değil |
| FR-24 | `validateManualAllocation` hiçbir yerden çağrılmıyor — manuel mahsup düzeltmesi UI'da yok |
| FR-30 | Prim oranı sabit; sistem parametresi değil |
| FR-31 | `User.commissionRate` yazılamıyor (form alanı yok) |
| FR-52 | Job'ı zamanlayan cron/timer/Actions/compose kaydı yok |
| FR-58 | "Toplam kullanılan bakiye" gösterilmiyor |
| FR-60 | "Ay içi prim yükü" gösterilmiyor |
| FR-09 | Ad-soyad + klinik benzerlik uyarısı yok (PRD'de "yumuşak kontrol") |

---

## 5. Test altyapısı gözlemi

- **Birim test:** 10 dosya, tamamı `src/lib/` içindeki **saf fonksiyonlara** yönelik. Kapsam kaliteli (FIFO, KDV yuvarlama, prim, expiry, telefon).
- **Test edilmeyen katman:** veritabanına dokunan servisler — `doctor-cari.ts`, `dealer-cari.ts`, `congress-service.ts`, `commission-service.ts`, `reports-service.ts`, `dealer-shipment.ts`, `settings.ts` için **hiç birim/entegrasyon testi yok**. Transaction sınırları ve yarış davranışı bu katmanda yaşıyor.
- **E2E:** 18 spec dosyası. İçlerinde **yalnız bir tane gerçek eşzamanlılık testi** var (`e2e/admin/congress.spec.ts:213`, `Promise.all`).
- **Uçtan uca kabul senaryosu:** PRD Ek'teki 15 adımlık zinciri tek akışta koşan bir test **yok** (bkz. D-03).

---

## 6. KARARLAR senkronizasyonu — boşlukların karar/görev karşılığı *(11.09.2026)*

Bu bölüm matrisin durumlarını **değiştirmez**; §4'teki "kısmi uygulamalar" ile §2/§3'teki TESTSIZ/YOK
maddelerin Faz 0'da **hangi karara ve hangi göreve** bağlandığını gösterir. Kod bu görevlerle yazılınca
ilgili satırlar KANITLI'ya döner ve matris yeniden koşulur.

### 6.1 TESTSIZ/YOK maddeler → Faz 1 düzeltme görevleri

| Madde | Matris durumu | Bağlandığı | Karar / görev |
|---|---|---|---|
| RULE-01 | TESTSIZ ¹¹ | **F-06** | İki kanalın aynı stoğu yarıştırdığı eşzamanlılık testi yazılır |
| RULE-04 | TESTSIZ | **F-12** | Sipariş anı fiyat/KDV dondurma testi |
| RULE-06 | TESTSIZ | **F-12** | Fiyat listesinde olmayan ürün bayiye sevk edilemez testi |
| RULE-12 | TESTSIZ ¹² | **F-04** | Mahsup planı transaction içine + koşullu yazım; atomiklik testi |
| RULE-13 | TESTSIZ ¹³ | **F-07** + **X-3/X-4** | Para hareketi doğuran aksiyonlarda audit transaction'ın parçası; hata/uyarı sözleşmesi (`KARARLAR.md` §5.2, §5.4) |
| FR-28 | **YOK** | **Ü-10** | Vadesi geçmiş doktora sipariş uyarısı — Faz 2 küçük tamamlama |
| FR-52 | TESTSIZ ⁸ | **F-08** | Expiry job'ı gerçekten zamanlanır + `EXPIRE` satırı testi |
| FR-13/FR-15/FR-22 | TESTSIZ | **F-11** | 15 adımlık kabul senaryosu (adım 7 vade değişikliği dâhil) |

### 6.2 Kısmi uygulamalar (§4) → Faz 2 ürünleştirme kalemleri

| Madde | Eksik | Bağlandığı | Not |
|---|---|---|---|
| FR-16 | Sistem geneli KDV oranı admin'e kapalı | **Ü-1** + C-6 | KDV oranı **tanım tablosu** (`VergiOrani`), enum değil — mevzuat değişince satır ekleme (`KARARLAR.md` §0.1.1) |
| FR-18 | Toggle yalnız 2 ekranda | **Ü-3** | KDV taban etiketi zorunluluğu + toggle **kurulum düzeyi, Faz 1'de kapalı**; B/C sınıfı ekranlarda kalıcı yok (`KARARLAR.md` §5.3) |
| FR-21 | `setSetting()` çağrılmıyor (vade) | **Ü-1** | Admin ayar ekranı — instance-config işiyle birleşir |
| FR-24 | `validateManualAllocation` UI'a bağlı değil | Ü-10 | Manuel mahsup düzeltmesi |
| FR-30 | Prim oranı sabit | **Ü-1** | Sistem parametresi yapılır |
| FR-31 | `User.commissionRate` form yok | **Ü-2** | Satıcı bazlı prim oranı form alanı |
| FR-58 | "Toplam kullanılan bakiye" yok | Ü-10 | Kongre ekranı kartı |
| FR-60 | "Ay içi prim yükü" yok | Ü-10 | Admin dashboard kartı |
| FR-09 | Yumuşak benzerlik uyarısı yok | Faz 2 (düşük) | Sert kural (telefon) çalışıyor; PRD "yumuşak kontrol" der |
| Raporlar | "üç" sayımı düzeltildi (dört) | X-1 | X-1: "tahsilat oranı" kaldırılır, zorunlu dönem aralığı + hakediş tanımı gelir (`KARARLAR.md` §5.1) |

### 6.3 Faz 0'da doğan, PRD'de olmayan yeni maddeler

Bunlar `PRD_V2.md` FR/RULE listesinde **yok**; izlenebilirlikleri `KARARLAR.md`'dedir. Kod yazıldıkça
buraya kendi satırları (ve testleri) eklenecek.

| Yeni madde | Şemaya etkisi | Kaynak |
|---|---|---|
| **X-1** satıcı raporu, dönem, hakediş tanımı | yok | `KARARLAR.md` §5.1 |
| **X-3** hata yüzeyi / `global-error.tsx` | yok | §5.2 |
| **X-4** iş hatası ve uyarı gösterim sözleşmesi | yok | §5.4 |
| **A-15** nakit tahsilatta tevsik uyarısı | yok (config) | §3.1.c |
| **Ü-3** KDV tabanı ve taban etiketi | yok | §5.3 |
| **E-1** zaman dilimi ve gün sınırı | tip disiplini (`timestamptz`/`date`) | §5.5 |
| **E-2** hesap yaşam döngüsü | ⚠️ **ekler** — oturum tablosu + `Kullanici.aktif`, `parola_hash`, `parola_degistirmeli` (**`son_giris_at` konmaz**) | §5.6 |
| **E-3** dosya eki | yok — kapsam dışı, `ImportParti.dosya_adi` salt kayıt | §5.7 |
| **D-5 (Ü-5)** dışa aktarım kütüğü | ⚠️ **ekler** — dışa aktarım log tablosu | §3.4.b |
| **D-2** rol tasarımı | ⚠️ **değiştirir** — `Kullanici.rol` enum **üç değer**; `DEALER` rolü ve `Yetki` tablosu **yok** | §3.4.a |
| **B-7** stok düzeltme | ⚠️ **ekler (3 tablo)** — `StokDuzeltme` + **`StokDuzeltmeSatir`** + `StokDuzeltmeSebep` + `DZL` öneki (29.08) | §3.2.a |
| **A-9** cari hesap sahibi tipi | ⚠️ **eklememe kararı** — `Kurum` tablosu ve `Doktor.kurum_id` **konmaz** (§0.1 on ikinci uygulama) | §3.1 · §1.3 §E |
| **§1.3** modülerlik | ⚠️ **kural** — çekirdek tabloda modül kolonu/FK **yok**; FK yönü daima modül → çekirdek; modül yazılmadan **tablosu da yazılmaz** | §1.3 |
| **A-13 / A-14 / C-6 / A-4 / A-11 / D-3 / A-8 / A-5 / A-10 / B-5 / B-6 / A-6 / A-7 / A-12 / C-1** | ⚠️ **hepsi ekler** — 19.08 ve öncesinde karara bağlandı, **hiçbiri kodda yok**; tam liste `FAZ1_UYGULAMA_KAPSAMI.md` §B | §3.1–§3.3 |

> **İki belge hatası** (`PROJE_DURUMU.md`): RULE-12 satırı ve rapor sayısı → **düzeltildi** (11.09.2026).

---

### 6.4 🔴 KARARLAR ile **geçersizleşen** FR/RULE satırları *(13.09.2026'da eklendi)*

Aşağıdaki satırlar matriste bugün **KANITLI veya TESTSIZ** görünüyor — yani kod var. Ama
KARARLAR bu gereksinimleri **geçersiz kıldı**: Faz 1 sonunda KANITLI'ya dönmeyecekler,
**matristen düşecekler**. Gerekçeler ve geri çekme sırası: `FAZ1_UYGULAMA_KAPSAMI.md` §A.

> **Neden bu tablo şart:** matris "kodun aynası" olduğu için, aynadaki bir satırın **hedefte
> karşılığı olmadığını** başka hiçbir yer söylemiyordu. Faz 1'de bir geliştirici FR-49'u
> düzeltmeye çalışabilirdi — oysa FR-49 **silinecek**.

| Matris satırı | Bugünkü durum | KARARLAR | Sonuç |
|---|---|---|---|
| **FR-24** FIFO mahsuplaşma + manuel düzeltme | TESTSIZ ⁵ | **X-6 §(1)/(2)** — tablo **kaldırıldı**; **runtime FIFO de yasak** | ⛔ **düşer, kesin** |
| **FR-25** Kısmi tahsilat; prim ve kongre orantılı | KANITLI | X-1 §(7) + K-6 §(2) | ⚠️ **prim ve kongre yarısı düşer** |
| **FR-26** Yaşlandırma kovaları | KANITLI | **X-6 §(5)** — **Faz 2+'ya taşındı**. Faz 1'de yalnız bakiye + *"vadesi geçmiş hareket var"* uyarısı; 🔴 **tutar gösterilmez** | ⛔ **Faz 1'den çıkar** |
| **FR-30 · FR-33 · FR-37** Prim oranı, matrah, satıcı paneli | TESTSIZ / KANITLI | **X-1 §(7), A-3** — hakediş **sevkiyat anında** doğar; tahsilat bazlı prim **kalıcı kapsam dışı** | ⚠️ **matrah tanımı değişir** |
| **FR-38** Kongre harcaması primi etkilemez | TESTSIZ | K-6 — kongre harcaması **doktor bakiyesinden düşmüyor** artık | ⛔ konusuz |
| **FR-46a…46g** Bayi paneli (7 madde) | 6 KANITLI + 1 TESTSIZ | **D-2 §(6)** — bayi **cari tipidir, kullanıcı değildir**; panel **Faz 3+ modül** | ⛔ **7 madde birden düşer** |
| **FR-49 · FR-50 · FR-51 · FR-52 · FR-53 · FR-54 · FR-56 · FR-57 · FR-58 · FR-59** Kongre defteri (10 madde) | 7 KANITLI + 3 TESTSIZ | **K-6 §(2)/(4)** — EARN/SPEND/EXPIRE, FIFO lot, 12 ay geçerlilik, doktor bakiyesi **silinir** | ⛔ **10 madde birden düşer** |
| **FR-12 · FR-19** Taban fiyat altı reddedilir | KANITLI | **A-10** (`iskontoTavani` = `null`) + **Ü-3 §(10)** (liste üstü satış serbest, negatif iskonto) | ⛔ düşer |
| **FR-16** Sistem geneli KDV oranı | TESTSIZ ² | **C-6 §(2)** — `Urun.kdv_orani` kolonu **konmaz**; `VergiOrani` tanım tablosu | ⚠️ **yeniden tanımlanır** |
| **FR-18 · FR-64** KDV dahil/hariç toggle + çerez tercihi | TESTSIZ ³ / KANITLI | **Ü-3 §(1)/(3)/(6)** — kullanıcı tercihi ve tarayıcı saklaması **yok**; Faz 1'de toggle **görünmez**; yerine **taban etiketi** | ⚠️ **yerini taban etiketi alır** |
| **FR-62'nin `tahsilatOrani` kalemi** | KANITLI | **X-1 §(1)** — metrik **kalıcı olarak kaldırıldı** | ⛔ düşer |
| **RULE-03** Taban fiyat altına inilemez | KANITLI | A-10, Ü-3 §(10) | ⛔ düşer |
| **RULE-07 · RULE-09 · RULE-11** Kongre bakiyesi kuralları | KANITLI ×3 | K-6 §(2) | ⛔ **üçü de konusuz** |
| **RULE-12** Tahsilat dört bileşen tek transaction | TESTSIZ ¹² | GÇ-1/GÇ-3/GÇ-4 | ⚠️ **dört bileşenin üçü düşer** |
| **RULE-14** Bayi yalnız kendi verisi; onaysız talep stok/cari etkilemez | KANITLI | D-2 §(6) · **X-8 §(4)** | ⛔ **düşer** *(15.09: "onaysız talep" yarısı da gitti — ayrı bayi talep mekanizması yok; karşılığı A-5 teklif aşaması)* |
| **RULE-06** Fiyat listesinde olmayan ürün bayiye sevk edilemez | TESTSIZ | **X-8** (`dealer-shipment.ts` sökülür) · **X-10 §(3)** — atanmış listede satır yoksa çözümlenmez, varsayılana düşülmez; bütün carilere | ⚠️ **yeniden tanımlanır** *(15.09)* |
| **RULE-15** Bayi prim/kongreye hiç dahil olmaz | KANITLI | **X-8 §(3)** — `BAYI` sınıfına satıcı atanmaz, prim doğmaz | ⚠️ **biçim değiştirir** *(15.09)* |
| **FR-39 · FR-40 · FR-41 · FR-42 · FR-43 · FR-44 · FR-45 · FR-46** Bayi yönetimi (8 madde) | 5 KANITLI + 3 TESTSIZ | **X-8** — bayi `Doktor` satırı; `Dealer*` tabloları kalkar; kayıt/sevkiyat/iptal/cari/ödeme **genel belge akışlarıdır**. FR-39'un `DEALER` hesabı yarısı D-2 ile düşer. **FR-40/41 (bayi × ürün fiyatı) → X-10: cariye atanan fiyat listesi** | ⚠️ **yeniden tanımlanır** *(15.09)* |
| **FR-11** Ürün bazlı liste + taban fiyat | KANITLI | taban yarısı **A-10/GÇ-8** · liste yarısı **X-10 §(5)** — ürün kartında fiyat yok, varsayılan listenin satırı | ⚠️ **yeniden tanımlanır** *(15.09)* |
| **FR-60** Dashboard — kanal ciro, bayi alacağı kalemleri | TESTSIZ ¹⁰ | **X-8** — kırılım `hesap_sinifi`'nden türer; kart Faz 2 (Ü-10) | ⚠️ **yeniden tanımlanır** *(15.09)* |
| **RULE-01** Stok eksiye düşemez | TESTSIZ ¹¹ | **B-4** — negatif stok **yumuşak kısıt** | ⚠️ **kural yeniden tanımlanır** |
| **RULE-10** Tam sayı kuruş | KANITLI | **X-5** — parasal alanlar `Decimal`; ölçek şemada | ⛔ **ilk yarısı düşer** *(kanonik net yarısı kalır)* |
| **FR-14** Kalem bazında iskonto oranı **saklanır** | TESTSIZ | **X-5 §(9)/(10)** — satırda `birim_fiyat` saklanır, **oran türetilir** | ⚠️ **yeniden tanımlanır** |

**Sayısal etki:** 71 FR'nin **en az 22'si** ve 15 RULE'un **en az 7'si** doğrudan etkileniyor.
*15.09.2026 (X-8 sonrası):* **22 FR tamamen düşer, 19 FR yeniden tanımlanır** *(X-10 ile FR-11 eklendi)*; **5 RULE düşer**
(03 · 07 · 09 · 11 · 14), **5 RULE yeniden tanımlanır** (01 · 06 · 10 · 12 · 15). PRD taramasında
karşılığı aranacak: **49 FR + 10 RULE = 59 madde** (`FAZ1_UYGULAMA_KAPSAMI.md` §D.1 Şerit A — defter **§E**).
Bu, matrisin %30'undan fazlasıdır — dolayısıyla Faz 1 sonunda matris **yeniden koşulmaz,
yeniden kurulur**. Kaynak listesinin (PRD) akıbeti bu yüzden §C-c'de açık maddeydi — ✅ *13.09'da X-7 ile kapandı: taranır, arşivlenir.*

**16.09.2026 — PRD taramasının eklediği ⛔ satırları** (`FAZ1_UYGULAMA_KAPSAMI.md` §E):

| Matris satırı | Bugünkü durum | KARARLAR | Sonuç |
|---|---|---|---|
| **FR-34 · FR-35 · FR-36** Dönem kapatma, sonraki döneme düzeltme, prim durumları | KANITLI ×3 | **X-1** §(6)/(7) + kapsam dışı | ⛔ **düşer** (GÇ-16) |
| **FR-43** Stok yetersizse sevkiyat reddedilir | KANITLI | **B-4** — yumuşak kısıt | ⛔ **düşer** (GÇ-17) |
| **FR-17** KDV ve brüt tutarın satırda saklanması | KANITLI | **C-6** §(3) | ⚠️ saklama yarısı düşer (GÇ-18) |
| **FR-21** Vade üst sınırı · siparişte vade | TESTSIZ | KARARLAR §2 madde 16 · **A-7** | ⚠️ üst sınır ve sipariş tarihi düşer (GÇ-11, GÇ-19) |
| **FR-23** Çek yöntemi | KANITLI | §2 madde 17-b | ⚠️ çek düşer |
| **FR-29 · FR-37** Tahsilat iptalinde prim geri alma · tahmini prim | KANITLI / TESTSIZ | **X-1** §(7) · X-6 | ⚠️ prim yarısı düşer |
| **FR-10 · FR-60 · FR-61 · FR-63** Gecikme tutarı · kongre bakiyesi | karışık | **X-6** §(7) · K-6 | ⚠️ tutar ve kongre yarısı düşer |
| **FR-55** Kontenjan sert sınırı | TESTSIZ | **K-3** | ⚠️ yumuşak kısıt (modül, Faz 3+) |
| **RULE-13** Mahsup ve kongre bakiyesi düzeltmesi | TESTSIZ | X-6 · K-6 | ⚠️ iki kalem düşer |

✅ *Karşılığı çıkmayanlar (FR-03…09, FR-22, FR-30, FR-31) aynı gün KARARLAR **X-13 · X-14 · X-15** ile karşılık buldu; davranışları korunur.*

