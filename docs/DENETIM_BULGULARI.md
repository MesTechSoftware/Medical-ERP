# Denetim Bulguları — Adım 1

> Tarih: 8 Ağustos 2026 · Kapsam: `medikal_satis_operasyon` kod tabanı vs `PRD_V2.md` v2.2
> Yöntem: yalnız okuma. Hiçbir üretim kodu değiştirilmedi, test eklenmedi.
> Eşlik eden çıktı: [`docs/TRACEABILITY.md`](./TRACEABILITY.md)
>
> **🔄 Güncel durum notu — 11.09.2026.** Bu rapor **tarihli bir kayıttır**; gövdesi 8 Ağustos'taki
> haliyle korunur (bulguların gerekçesi değişmedi). Aşağıdaki tablo her bulgunun **bugünkü karşılığını**
> gösterir. Kararlar `KARARLAR.md`'de, düzeltme görevleri `DUZELTME_BRIFI.md`'dedir — kod henüz yazılmadı,
> yani **teknik bulgular hâlâ açık**; kapanan tek şey, düzeltmenin **nasıl** yapılacağına dair karardır.
>
> | Bulgu | Bugünkü durum *(13.09.2026'da KARARLAR'a göre gözden geçirildi · 15.09'da X-2 satırı)* |
> |---|---|
> | **D-01** mahsup planı transaction dışında | ⛔ **KONUSUZ KALDI (KARARLAR X-6, 13.09.2026).** `PaymentAllocation` **kaldırıldı, kalıcı**; **runtime FIFO de yasak**. TOCTOU açığı, açığın bulunduğu mekanizmayla birlikte gidiyor → **F-04 düşer**. *Bulgunun ardındaki ilke — check-then-act yarışı — korunuyor ve F-06'da sınanıyor* |
> | **D-04** bakiye iki formül / iptal mahsubu prim matrahında | ⚠️ **Yarısı konusuz (X-6).** *"İki formül"* sorunu ortadan kalkıyor: **tek** `hesaplaDoktorBakiye(doktor, tarih?)` kalıyor, *"açık alacak"* ikinci fonksiyonu **yazılmıyor** → **F-02 küçülür**. İptal mahsubu yarısı **sayılan belgeler filtresine** devredildi → **F-01 görev olarak düşer**. Prim tabanı **sevkiyata** kayıyor (X-1 §(7), A-3) |
> | **D-05** expiry job zamanlanmıyor | ⛔ **KONUSUZ** — K-6 §(2) ile 12 ay expiry mekanizmasının **tamamı siliniyor**; F-08 yapılmayacak. Zamanlayıcı altyapısı zaten **D-1 kademe 2 · Faz 3** |
> | **D-02** RULE-01 eşzamanlılık testi yok | → **F-06** ⚠️ kabul kriteri değişti: **B-4 negatif stoğu yumuşak kısıt** yaptı — beklenen sonuç "biri başarılı" değil, **"aşım izli"** |
> | **D-06** route group hata sınırı yok | **X-3 ✅** hata yüzeyi + `global-error.tsx` + `not-found.tsx` + **üç kritik segmentte** `error.tsx` → ⚠️ **Faz 1 teslim şartı**, Faz 2 değil. Kalan route group `error.tsx`/`loading.tsx` UX kalemi → Faz 2 (Ü-9). ⚠️ `(dealer)` route group **geri çekiliyor** (D-2 §(6)) — ona hata sınırı yazılmayacak |
> | **D-08** KDV toggle dar | **Ü-3 ✅** → ⚠️ **Faz 1**, Faz 2 değil (`YOL_HARITASI.md` §3.2). Ve tespit **tersine döndü**: eksik olan toggle değil **taban etiketiydi**; toggle Faz 1'de **hiçbir ekranda görünmez**, çerez tercihi **geri çekilir** |
> | Kongre kontenjanı transaction dışında | **K-3 ✅** yumuşak kısıt → **F-05**. ⚠️ Asıl iş **K-6 geri çekmesi**; modül **kapalı teslim** edileceği için (`modules.congress = false`) eşzamanlılık düzeltmesinin aciliyeti düşük |
> | Audit best-effort (RULE-13) | **F-07** (para hareketinde audit tx'in parçası) ✅. ⚠️ **X-4 bu bulgunun cevabı değildir** — X-4 *iş hatası/uyarı gösterim sözleşmesidir*; X-4 §(8) ayrıca **iş hataları ve bilgi uyarıları loglanmaz** der. Kalıcı kayıt = **`OnayBlogu` + değişiklik logu** |
> | İki belge hatası (RULE-12, rapor sayısı) | **✅ düzeltildi** (`PROJE_DURUMU.md`, 11.09.2026) |
> | Servis katmanının hiç testi yok | → **F-00** (entegrasyon test altyapısı, Faz 1'in ilk işi) ✅ |
> | **X-2** `recordDealerPayment` transaction kullanmıyor | 🔴 **BLOCKER** (KARARLAR §5, 07.09.2026) — **bu tabloda eksikti, 13.09'da eklendi**. *"Bilinçli erteleme" notu geçersizdir:* A-14 gereği `uretBelgeNo()` belgeyle **aynı transaction'da** olmalı, aksi hâlde **`BelgeSayac` deliği kalıcı olur**. Brife de eklendi · ⛔ **15.09.2026 — KARARLAR X-8:** bayi `Doktor` satırı oldu; `recordDealerPayment` Faz 1A C5'te **kodla birlikte sökülüyor**. İlke **bütün tahsilatlara** genişledi — kabul testi 1B madde 2 |
> | **D-03** 15 adımlık kabul senaryosu yok | → **F-11** ⚠️ **senaryo yeniden yazılmalı**: rakamlar tahsilat bazlı prim ve kongre EARN varsayıyor; ikisi de geri çekiliyor (`FAZ1_UYGULAMA_KAPSAMI.md` §C-e) |
> | **D-07** FR-60 "ay içi prim yükü" kartı yok | → Faz 2 (Ü-10) ⚠️ kartın **tanımı** değişiyor: prim artık **sevkiyat anında** doğuyor, "ay içi tahakkuk" başka bir sayı |
>
> 🔴 **Okuma uyarısı (13.09.2026):** Bu rapor **8 Ağustos'un fotoğrafıdır** ve gövdesi öyle
> korunuyor. Ama fotoğraftaki bazı yapılar **artık hedefte yok**: kongre defteri, FIFO mahsup,
> bayi paneli, taban fiyat kontrolü, tahsilat bazlı prim. Bulgunun *gerekçesi* hâlâ öğretici —
> *düzeltmesi* ise bazen "düzeltme" değil **geri çekmedir**. Tam liste:
> **`FAZ1_UYGULAMA_KAPSAMI.md` §A**.

---

### D-01 — RULE-12 anlam kaymış mı? (EN ÖNCELİKLİ)

**Bulgu:**

**1. PRD bugün ne diyor?** `PRD_V2.md:261`:

> **RULE-12** — Bir tahsilat kaydı; mahsuplaşma + doktor bakiyesi + prim matrahı + kongre kazanımını **tek transaction'da** işler.

Yani PRD, `UYGULAMA_PLANI.md` §6 ile **birebir aynı**. Kayma kodda değil, **`PROJE_DURUMU.md`'nin RULE-12 satırındadır** — orada yazan "Sipariş + kalemler + stok düşümü + hareket tek transaction" ifadesi v1 dönemine ait bir cümledir ve PRD'deki RULE-12'yi yanlış özetler. (Kodda o davranış da mevcut ve doğru — `src/app/(seller)/my-orders/actions.ts:71-162` — ama adı RULE-12 değildir.) **Belge hatası, kod hatası değil.**

**2. Dört bileşen tek `$transaction` içinde mi?** Transaction sınırı: `src/app/(admin)/collections/actions.ts:59` (`prisma.$transaction(async (tx) => {`) → `:110` (`return payment.id;` / `});`).

| RULE-12 bileşeni | Nerede | Sınır içinde mi |
|---|---|---|
| (a) mahsuplaşma | `collections/actions.ts:77-83` (`tx.paymentAllocation.createMany`) | ✅ İÇERİDE |
| (b) doktor bakiyesi | Ayrı yazım **yok** — türetiliyor: `src/lib/doctor-cari.ts:29-48` | ✅ Yapısal olarak atomik |
| (c) prim matrahı | Ayrı yazım **yok** — `PaymentAllocation`'dan türetiliyor: `src/lib/commission-service.ts:45-54` | ✅ Yapısal olarak atomik |
| (d) kongre `EARN` | `collections/actions.ts:101-107` → `src/lib/congress-service.ts:67-79` (`tx.congressLedger.create`) | ✅ İÇERİDE |

Yani **RULE-12 karşılanıyor.** (b) ve (c) için ayrı kayıt yazılmaması bir eksik değil, RULE-08'in ("bakiye saklanmaz, hesaplanır") doğru sonucudur: mahsup satırı transaction içinde yazıldığı için hem doktor bakiyesi hem prim matrahı aynı commit'le tutarlı hale gelir.

**3. Transaction dışında ne kaldı?** İki şey:

- 🔴 **Mahsup planı transaction'dan ÖNCE hesaplanıyor.** `collections/actions.ts:52` `getOpenOrders(doctorId)` ve `:55` `allocateFIFO(...)` sınırın dışındadır. Bu bir check-then-act (TOCTOU) açığıdır: aynı doktor için iki tahsilat eşzamanlı girilirse ikisi de **aynı açık sipariş listesini** okur, ikisi de aynı siparişe mahsup planlar ve iki `createMany` de başarıyla yazılır. Ortada hata olursa değil — **hiç hata olmadan** siparişe kalan borcundan fazla mahsup yazılır. Sonuç: doktorun açık alacağı olduğundan az, satıcının prim matrahı olduğundan fazla görünür. Veritabanında bunu engelleyen kısıt yok.
- **Audit kaydı transaction dışında** (`:115-121`). `createAuditLog` hatayı yutuyor (`src/lib/audit.ts:160-162`), dolayısıyla tahsilat yazılıp denetim izi yazılmayabilir (RULE-13 "istisnasız" der).

**4. Atomikliği doğrulayan test var mı?** **Yok.** Transaction'ın ara adımını bilerek patlatan (ör. `earnFromPayment` fırlatınca `DoctorPayment` ve `PaymentAllocation` yazılmamış olmalı) hiçbir test bulunmuyor. `e2e/admin/collections.spec.ts` mutlu yolu ve iptali doğruluyor, geri alma yolunu değil.

**Değerlendirme:** RİSKLİ

**Etki:** Tahsilat girişi yoğunlaştığında (ör. ay sonu iki kullanıcı aynı doktorun ödemelerini işlerken) sessizce fazla mahsup yazılır ve o satıcının primi hatalı yüksek hesaplanır.

**Öneri:** `getOpenOrders` + `allocateFIFO` çağrılarını `$transaction` bloğunun İÇİNE taşıyın ve mahsup yazımını koşullu hale getirin — her `PaymentAllocation` satırı, hedef siparişin kalan borcunu aşmadığını veritabanı düzeyinde doğrulayan bir koşulla yazılmalı (RULE-01/RULE-09'daki koşullu `updateMany` deseninin aynısı). Ek olarak, `Order` üzerine mahsup toplamını sınırlayan bir kısıt veya `PaymentAllocation` yazımını serialize eden bir kilit değerlendirilmeli. Ayrıca ara adımı patlatan bir atomiklik testi yazılmalı.

---

### D-02 — Yarış koşulları kanıtlı mı?

**Bulgu:**

**1. Koşullu `updateMany` deseni gerçekten kullanılmış mı?** Evet, her iki kural için de doğru kurulmuş:

- **RULE-01 (stok), satıcı kanalı:** `src/app/(seller)/my-orders/actions.ts:110-113`
  `tx.product.updateMany({ where: { id, stock: { gte: line.quantity } }, data: { stock: { decrement: ... } } })`
- **RULE-01 (stok), bayi kanalı:** `src/app/(admin)/dealers/actions.ts:140-143` — aynı desen, sevkiyat onayında.
- **RULE-09 (kongre bakiyesi):** `src/lib/congress-service.ts:158-161`
  `tx.congressLedger.updateMany({ where: { id: c.lotId, remainingAmount: { gte: c.amount } }, ... })`

**2. `count === 0` her yerde hata olarak ele alınmış mı?** Üç kritik yolun üçünde de evet:

- `my-orders/actions.ts:114-117` → `throw new Error("...yeterli stok yok")`
- `dealers/actions.ts:144-153` → `throw` (FR-43: sevkiyat tamamen geri alınır)
- `congress-service.ts:162-166` → `throw` (transaction geri alınır)

Sessizce geçilen tek yer `src/lib/congress-service.ts:262`'de `if (res.count === 0) continue;`. Bu **kasıtlı ve doğru**: expiry job'ı sırasında lot bu arada harcanmışsa o lotu atlamak gerekir. Kritik yolda sessiz geçiş yok.

**3. Eşzamanlılığı test eden herhangi bir test var mı?** 18 e2e spec + 10 birim test dosyası tarandı. **Tek bir eşzamanlılık testi var:** `e2e/admin/congress.spec.ts:213` — `await Promise.all([runOnce(), runOnce()])` ile iki ayrı tarayıcı bağlamından aynı anda kayıt talebi açıyor ve `:221-226`'da "en fazla bir aktif kayıt" + "bakiye negatife düşmemiş" doğrulaması yapıyor. Bu **gerçek bir yarış testidir** ve RULE-09'u kanıtlar.

🔴 **RULE-01 için hiçbir eşzamanlılık testi yok.** `e2e/admin/dealer.spec.ts:159` yalnız ardışık senaryoyu (stok zaten yetersizken onay reddi) doğruluyor — iki kanalın aynı son birimi yarıştırdığı durumu değil. `UYGULAMA_PLANI.md` §11'in "kritik" dediği iki testten biri eksik.

**Değerlendirme:** EKSİK

**Etki:** İki kanal (satıcı siparişi + bayi sevkiyatı) aynı son stok birimini aynı anda talep ettiğinde davranışın doğruluğu kanıtsızdır; desen doğru görünse de bir regresyon fark edilmeden geçebilir.

**Öneri:** RULE-09 testini şablon alan bir stok yarış testi yazılmalı: tek ürünün stoğu tam olarak N adede sabitlenir; biri satıcı oturumundan sipariş, diğeri admin oturumundan bayi sevkiyat onayı olmak üzere **iki ayrı tarayıcı bağlamı** `Promise.all` ile aynı anda N adet talep eder. Doğrulama: `Product.stock >= 0`, başarılı işlem sayısı tam olarak 1, ve `StockMovement` toplamı stok düşümüyle tutarlı. Aynı desen `PaymentAllocation` için de kurulmalı (bkz. D-01).

---

### D-03 — Uçtan uca kabul senaryosu var mı?

**Bulgu:**

**1. `PRD_V2.md:474-497`'deki 15 adımlık senaryo:**

| # | Adım |
|---|------|
| 1 | Admin: Ürün X → net liste 1.000 ₺, net taban 800 ₺, KDV %20 |
| 2 | Admin: depoya 1.000 adet stok girer |
| 3 | Satıcı A: "Dr. Ayşe Demir" kaydı (klinik+bölge+telefon) → sahiplik A'ya kilitlenir |
| 4 | Satıcı B: aynı telefonla kayıt dener → REDDEDİLİR (FR-09) |
| 5 | Satıcı B: Dr. Ayşe'ye sipariş dener → REDDEDİLİR (RULE-02) |
| 6 | Satıcı A: 700 × net 850 ₺ sipariş → brüt 714.000 ₺, stok düşer, fiyat dondurulur, vade +30 gün |
| 7 | Admin: vadeyi +15 gün uzatır → `DueDateChange` + audit |
| 8 | Şirket: 714.000 ₺ tahsil → tek transaction: borç 0 · prim matrahı +595.000 · kongre EARN +595.000 |
| 9 | Admin: kongre + "Tam Paket" 200.000 ₺ |
| 10 | Satıcı A: Dr. Ayşe'yi kaydeder → TALEP (bakiye rezerve) |
| 11 | Admin: onaylar → SPEND −200.000 (en eskiden) → bakiye 395.000 |
| 12 | Ay sonu: dönem kapanır → matrah 595.000 → prim 29.750 (%5) |
| 13a | Bayi C: panelinden 50 adet sevkiyat talebi → TALEP (stok/cari değişmez) |
| 13b | Admin: onaylar, net 600 ₺'den sevk → borç 36.000 ₺ |
| 14 | Bayi C: 20.000 ₺ öder → bakiye 16.000 ₺ |
| 15 | 12 ay sonra: kalan 395.000 ₺ kullanılmadıysa EXPIRE ile sıfırlanır |

**2. Bu zinciri tek akışta koşan bir test var mı?** **Yok.** 18 e2e spec dosyasının hiçbiri bu 15 adımı tek bir akışta zincirlemiyor; her spec kendi `test.beforeAll`/yardımcılarıyla izole veri kurup tek bir konuyu doğruluyor (`e2e/helpers.ts`). `UYGULAMA_PLANI.md` §11'in son satırı ("15 adımlık örnek senaryo tek bir E2E testi olarak yazılır") karşılanmamış.

**3. Parça parça kapsam:**

| Adım | Durum | Nerede |
|---|---|---|
| 1 | ✅ kapsanıyor | `e2e/admin/products.spec.ts:4` |
| 2 | ⚠️ dolaylı | Stok girişi ekranı `e2e/admin/smoke.spec.ts:15` ile yalnız açılıyor; giriş davranışı için ayrı test yok |
| 3 | ✅ kapsanıyor | `e2e/seller/doctors.spec.ts:46` |
| 4 | ✅ kapsanıyor | `e2e/seller/doctors.spec.ts:67` (farklı yazımla bile) |
| 5 | ✅ kapsanıyor | `e2e/seller/doctors.spec.ts:132` |
| 6 | ✅ kapsanıyor | `e2e/seller/orders.spec.ts:3` + `e2e/seller/pricing.spec.ts:25` |
| **7** | 🔴 **hiç kapsanmıyor** | `changeDueDate` (`collections/actions.ts:205`) için hiçbir test yok |
| 8 | ⚠️ parçalı | Mahsup+bakiye `e2e/admin/collections.spec.ts:50`; kongre EARN `e2e/admin/congress.spec.ts:85`; prim matrahı `e2e/admin/commissions.spec.ts:85`. **Üçünün tek bir tahsilatta birlikte doğrulandığı test yok** |
| 9 | ✅ kapsanıyor | `e2e/admin/congress-edit.spec.ts:42` |
| 10 | ✅ kapsanıyor | `e2e/admin/congress.spec.ts:168` |
| 11 | ✅ kapsanıyor | `e2e/admin/congress.spec.ts:314` (FIFO) |
| 12 | ✅ kapsanıyor | `e2e/admin/commissions.spec.ts:85` + `src/lib/commission.test.ts:99` (PRD'nin 595.000→29.750 örneği birim testte birebir var) |
| 13a | ✅ kapsanıyor | `e2e/dealer/panel.spec.ts:52` |
| 13b | ✅ kapsanıyor | `e2e/admin/dealer.spec.ts:90` |
| 14 | ⚠️ dolaylı | Bayi ödemesi `recordDealerPayment` için ayrı test yok; cari doğrulaması `e2e/admin/dealer.spec.ts:120` içinde dolaylı |
| **15** | 🔴 **hiç kapsanmıyor** | `expireLots()`'ın `EXPIRE` satırı yazışı hiç test edilmiyor (yalnız saf `expiredLots` fonksiyonu — `src/lib/congress-ledger.test.ts:190`) |

**Değerlendirme:** EKSİK

**Etki:** Adımlar tek tek çalışsa bile aralarındaki veri devri (bir adımın çıktısının sonraki adımın girdisi olması) hiç doğrulanmadığı için, entegrasyon seviyesinde bir kopukluk canlıda ilk gerçek ay kapanışına kadar fark edilmez.

**Öneri:** Tek bir `e2e/acceptance/full-scenario.spec.ts` dosyasında, 15 adımı sırayla `test.step()` blokları olarak koşan tek bir test yazılmalı; her adımın sonunda PRD'de yazan **somut rakamlar** (714.000 / 595.000 / 200.000 / 395.000 / 29.750 / 36.000 / 16.000) doğrudan assert edilmeli. Adım 15 için sistem saatini ileri almak yerine `earnedAt`/`expiresAt` değerlerini geriye kurup `expireLots()` çağrılmalı. Öncelik: adım 7 ve 15, çünkü bunların başka hiçbir testte karşılığı yok.

---

### D-04 — Bakiye hesabı tek kaynaktan mı?

**Bulgu:**

**1. `src/lib/cari.ts` silinmiş mi?** **Evet, silinmiş.** Dosya mevcut değil; yerini `src/lib/doctor-cari.ts` ve `src/lib/dealer-cari.ts` almış (BRK-01 gereği). Kod tabanında `cari.ts`'e hiçbir referans kalmamış.

**2. Bakiye kaç ayrı yerde hesaplanıyor?** Dashboard'daki inline hesaplama **kaldırılmamış**; aksine formül **iki farklı biçimde ve dokuz ayrı yerde** yaşıyor:

**Formül A — doktor seviyesi (FR-20'nin tanımı):** `Σ Order.grossTotal (≠CANCELLED) − Σ DoctorPayment.amount (AKTIF)`

| # | Yer |
|---|-----|
| 1 | `src/lib/doctor-cari.ts:29-48` — `getDoctorCari` |
| 2 | `src/lib/doctor-cari.ts:51-83` — `getAllDoctorsCari` |

**Formül B — sipariş seviyesi (mahsup bazlı):** `Σ (Order.grossTotal − Σ PaymentAllocation.amount)`

| # | Yer |
|---|-----|
| 3 | `src/lib/doctor-cari.ts:104-111` — `getOpenOrders` |
| 4 | `src/lib/doctor-cari.ts:157-164` — `getSellerReceivables` |
| 5 | `src/lib/doctor-cari.ts:195-201` — `getAgingSummary` |
| 6 | `src/app/(seller)/account/page.tsx:44-54` — **inline** |
| 7 | `src/app/(admin)/doctors/[id]/page.tsx:224` — **inline** (`const rest = o.grossTotal - paid`) |
| 8 | `src/lib/commission-service.ts:118-122` — **inline** (`openReceivable`) |
| 9 | `src/lib/reports-service.ts:110-116` — **inline** (`gecikmisBorc`) |

**3. Formüller birebir aynı mı? Hayır — üç kenar durumda ayrışıyorlar:**

🔴 **(a) Mahsup edilmemiş tahsilat (avans).** `recordCollection` fazla ödemeyi bilerek destekliyor: `collections/actions.ts:128-130` "Açık borcu aşan kısım avans olarak kaldı." Bu durumda **Formül A** ödemenin tamamını sayar (bakiye düşer, hatta negatife geçer), **Formül B** ise mahsup edilmeyen kısmı hiç görmez. Somut sonuç: doktor 100.000 ₺ borcuna 150.000 ₺ öderse **doktor detayında bakiye −50.000 ₺** (`doctors/[id]/page.tsx:112`), **dashboard'da "Açık Alacak" 0 ₺** (`dashboard/page.tsx:69`) görünür. İki ekran aynı doktor için farklı gerçek anlatır.

🔴 **(b) İptal edilen sipariş, mahsupları silinmeden iptal ediliyor.** `cancelOrder` (`src/app/(admin)/orders/actions.ts:81-102`) stoğu geri yükler ve durumu `CANCELLED` yapar ama o siparişe yazılmış `PaymentAllocation` satırlarını **silmez veya işaretlemez**. Sonuç: Formül A siparişi düşürür, ödemeyi düşürmez → bakiye yapay olarak azalır; Formül B siparişi tamamen görmez.

🔴 **(c) En ağırı — prim matrahı iptal edilen siparişi hâlâ sayıyor.** `src/lib/commission-service.ts:45-54`'teki sorguda `order: { sellerId }` filtresi var ama **`order.status` filtresi yok**. Yani (b)'deki artık mahsuplar prim matrahına dahil olmaya devam eder. Aynı eksik `src/lib/reports-service.ts:36-42`'deki `tahsilat` toplamında da var; oradaki `ciro` ise `status: { not: "CANCELLED" }` ile filtreleniyor — bu yüzden `tahsilatOrani` (`reports.ts` `collectionRate`) **%100'ü aşabilir**.

**Değerlendirme:** RİSKLİ

**Etki:** Tahsilat sonrası iptal edilen bir sipariş, satıcının prim matrahında kalıcı olarak kalır ve firma hak edilmemiş prim öder — üstelik hiçbir hata mesajı üretmeden.

**Öneri:** (1) FR-20 bakiyesi için **tek bir fonksiyon** kanonik ilan edilmeli ve 6-9 numaralı inline hesaplamalar bu fonksiyona (veya paylaşılan bir `outstandingOf(order)` yardımcısına) indirgenmeli. (2) Avans (mahsup edilmemiş tahsilat) tutarının hangi ekranda nasıl görüneceğine dair açık bir karar alınıp iki formül arasındaki fark bilinçli hale getirilmeli. (3) `cancelOrder` ya mahsupları geri almalı ya da sipariş iptali tahsilatı olan siparişlerde engellenmeli. (4) `getNetAllocations` ve `getSellerReports` sorgularına `order: { status: { not: "CANCELLED" } }` filtresi eklenmeli. (4) maddesi tek satırlık ama doğrudan para etkisi olduğu için önceliklidir.

---

### D-05 — Kongre expiry gerçekten çalışıyor mu?

**Bulgu:**

**1. Script ne yapıyor, idempotent mi?** `scripts/expire-congress-balances.ts:16-23` tek iş yapıyor: `expireLots()` çağırıp sonucu logluyor. Asıl mantık `src/lib/congress-service.ts:235-281`:

- Süresi dolmuş lotları bulur (`:236-250`), `expiredLots()` ile süzer (`:252`).
- Her lot için **koşullu** güncelleme yapar: `updateMany({ where: { id, remainingAmount: lot.remainingAmount }, data: { remainingAmount: 0n } })` (`:258-261`). Bu arada lot harcanmışsa `count === 0` döner ve `continue` ile atlanır (`:262`).
- `EXPIRE` tipinde defter satırı **yazıyor** (`:265-276`), tutar negatif, `refId` = tüketilen lot.

**İdempotent mi? Evet.** İkinci koşuda aynı lotlar `remainingAmount: { gt: 0 }` filtresine (`:239`) takılmaz, dolayısıyla çift `EXPIRE` satırı yazılmaz. Koşullu update, iki job örneğinin aynı anda koşması durumunda da çift yazımı engeller.

**2. Bu job'ı zamanlayan bir şey var mı?** 🔴 **Yok — hiçbir yerde.** Arananlar ve sonuçları:

- `package.json:21` → yalnızca `"job:expire": "tsx scripts/expire-congress-balances.ts"` (elle çalıştırılan npm script)
- `.github/workflows/` → tek dosya `ci.yml`, içinde bu job'a hiçbir referans yok, `schedule:` tetikleyicisi yok
- `docker-compose.yml` → yalnız `postgres` servisi; job servisi/cron container'ı yok
- systemd timer, crontab dosyası, `node-cron`/`bullmq` benzeri kütüphane: **yok**

Yani üretimde bu job **hiç koşmayacaktır** — kurulum sırasında elle bir cron yazılmadıkça.

**3. Okuma anında lazy doğrulama var mı? Evet, ve çalışıyor.** Süresi dolmuş bakiye **bugün harcanamaz**:

- `availableBalance` (`src/lib/congress-ledger.ts:57-68`) → `isExpired` olan lotu toplama katmaz
- `planFifoSpend` (`:118-119`) → `.filter((l) => ... && !isExpired(l, asOf))`; süresi dolmuş lot FIFO'ya hiç girmez ve yetersizliğe sebep olur (`src/lib/congress-ledger.test.ts:149`)
- `getCongressLiability` (`src/lib/reports-service.ts:177`) → `expiresAt: { gt: new Date() }` filtresiyle raporlama da doğru

Dolayısıyla job hiç koşmasa bile **para kaçağı olmaz**; kaybolan şey **denetim izidir**: doktorun hareket defterinde `EXPIRE` satırı olmadığı için bakiye "sessizce" kaybolmuş görünür. Bu, `PRD_V2.md` §11'in (hukuk/uyum) zorunlu tuttuğu eksiksiz denetim izini zayıflatır.

**4. Rolling 12 ay + 29 Şubat → 28 kuralı hangi testle kanıtlanıyor?** `src/lib/congress-ledger.test.ts`:

- `:38` "kazanımdan 12 ay sonrasını verir"
- `:42` "takvim yılı sonuna DEĞİL, kazanım gününe göre hesaplar" (D-22 rolling)
- `:51` **"🔴 29 Şubat'ı 28 Şubat'a kırpar (1 Mart'a TAŞMAZ)"** — istenen kenar durum birebir kanıtlanmış
- `:59` "saat bileşenini korur"

Uygulama: `expiryFor` (`src/lib/congress-ledger.ts:37-49`), `Math.min(d, lastDay)` ile ay sonu taşmasını engelliyor.

**Değerlendirme:** EKSİK

**Etki:** Doktorun kongre bakiyesi doğru şekilde kullanılamaz hale gelir ama defterde bunu açıklayan `EXPIRE` satırı hiç oluşmaz; "bakiyem nereye gitti?" sorusuna sistem cevap veremez.

**Öneri:** Job'ı gerçekten zamanlayan bir mekanizma eklenmeli — en düşük maliyetli seçenek `.github/workflows/` altına `schedule: cron` ile gecelik bir workflow, ya da `docker-compose.yml`'e `npm run job:expire` çalıştıran bir cron servisi. Kurulum dokümanına da yazılmalı, çünkü şu an "gecelik job" varsayımı belgede var, çalışan sistemde yok. Ayrıca `expireLots()`'ın `EXPIRE` satırı yazışını doğrulayan bir entegrasyon testi eklenmeli (adım 15, bkz. D-03).

---

### D-06 — Hata sınırları route group başına var mı?

**Bulgu:**

**1. Tam liste.** Kod tabanında yalnız **kök seviyede üç dosya** var:

| Dosya | Var mı |
|---|---|
| `src/app/error.tsx` | ✅ |
| `src/app/loading.tsx` | ✅ |
| `src/app/not-found.tsx` | ✅ |
| `src/app/global-error.tsx` | ❌ yok |

Route group'lar için:

| Route group | `error.tsx` | `loading.tsx` | `not-found.tsx` |
|---|---|---|---|
| `(admin)` | ❌ | ❌ | ❌ |
| `(seller)` | ❌ | ❌ | ❌ |
| `(dealer)` | ❌ | ❌ | ❌ |

Yani `UYGULAMA_PLANI.md` 0.7'nin istediği "kök **+ her route group için**" karşılanmamış; `PROJE_DURUMU.md`'nin "kök seviyede mevcut" ifadesi doğru ama planın yalnız yarısını anlatıyor.

**2. `(dealer)` içinde bir server action hata fırlatırsa kullanıcı ne görüyor?**

Önce önemli bir nüans: bayi action'larının çoğu hata **fırlatmıyor**, hatayı yakalayıp `{ error: "..." }` state'i olarak forma döndürüyor (`src/app/(dealer)/bayi/talep/actions.ts:57-61`). Bu yollarda kullanıcı bayi panelinde kalır ve mesajı formun içinde görür — davranış doğrudur.

Yakalanmayan bir hata oluştuğunda (ör. bir server component'te veritabanı hatası) ise en yakın hata sınırı **kök `src/app/error.tsx`**'tir. Next.js App Router'da bu sınır, kendisinden aşağıdaki her şeyin — **`src/app/(dealer)/layout.tsx` dahil** — yerine geçer. Sonuç: kullanıcı bayi bağlamını (bayi menüsü, `AppShell`, kendi kimliği) **tamamen kaybeder** ve `src/app/error.tsx:17-42`'deki jenerik "Bir şeyler ters gitti" kartını görür. Kartta rol/panel bilgisi, panele dönüş bağlantısı yoktur; yalnız "Tekrar dene" düğmesi (`:36`) vardır.

**Değerlendirme:** EKSİK

**Etki:** Bayi panelinde beklenmedik bir hata alan kullanıcı, kendi paneline dönüş yolu olmayan kimliksiz bir hata ekranında kalır ve genelde login'e geri gitmeyi dener.

**Öneri:** En azından `(dealer)` ve `(seller)` için birer `error.tsx` eklenmeli; bunlar ilgili layout'un altında kaldığı için panel kabuğunu korur ve role uygun bir dönüş bağlantısı ("Bayi paneline dön" / "Siparişlerime dön") sunabilir. `loading.tsx` dosyaları ise özellikle rapor ve liste ekranlarının bulunduğu `(admin)` için değerlidir (bu sayfalar çok sayıda paralel sorgu koşuyor, ör. `dashboard/page.tsx:29-56`). `global-error.tsx` de kök layout'un kendisinin patladığı durum için eklenmeli.

---

### D-07 — Faz F tamamlanmış mı?

**Bulgu:**

**1. Hangi raporlar var, hangileri yok?** Planın istediği dört raporun **dördü de mevcut**:

| Rapor | Durum | Yer |
|---|---|---|
| Satıcı performans karşılaştırması (FR-62) | ✅ var | `src/lib/reports-service.ts:18-66` → `src/app/(admin)/reports/page.tsx:59-111` |
| Doktor ciro sıralaması + kongre + gecikmiş borç (FR-63) | ✅ var | `src/lib/reports-service.ts:78-132` → `reports/page.tsx:113-167` |
| **Kanal karşılaştırma (satıcı vs bayi)** | ✅ **var** | `src/lib/reports-service.ts:142-169` (`getChannelReport`) → `reports/page.tsx:47-57` |
| Yaşlandırma (FR-26) | ✅ var | `src/lib/doctor-cari.ts:175-202` → `dashboard/page.tsx:129-138` ve `collections/page.tsx:57` |

Yani `PROJE_DURUMU.md`'nin "üç rapor" sayımı eksik — kanal karşılaştırması `getChannelReport` olarak yazılmış ve rapor sayfasında "Satıcı Kanalı Ciro" / "Bayi Kanalı Ciro" kartları olarak gösteriliyor. Ayrıca hepsi KDV toggle'ına bağlı (`mode` parametresi).

**2. Admin dashboard'da açık kongre bakiyesi toplamı gösteriliyor mu?** ✅ **Evet.** `src/app/(admin)/dashboard/page.tsx:120-125`:

```
<StatCard label="Açık Kongre Bakiyesi" value={formatTRY(congressLiability)}
          hint="Potansiyel yükümlülük" />
```

Kaynağı `getCongressLiability()` (`src/lib/reports-service.ts:172-182`) ve süresi dolmuş lotları doğru şekilde dışlıyor (`:177`). Aynı kart rapor sayfasında da var (`reports/page.tsx:50-55`).

🔴 Buna karşılık FR-60'ın saydığı kalemlerden **"ay içi prim yükü" dashboard'da yok.** Dashboard'daki finansal kartlar (`:106-126`): satıcı kanalı ciro, toplam tahsilat, açık alacak, bayi kanalı ciro, bayi alacağı, açık kongre bakiyesi. Firmanın o ay tahakkuk etmekte olan prim borcu hiçbir yerde toplu görünmüyor (`getPeriodPreview` satıcı bazında var ama admin tarafında toplanmıyor).

**3. Satıcı dashboard'ında planın kalemleri var mı?** Kalemler var ama **iki ayrı sayfaya** dağılmış; tek bir "satıcı dashboard'ı" yok:

| FR-61 kalemi | Durum | Yer |
|---|---|---|
| Aylık tahsilat / prim ilerlemesi | ✅ | `src/app/(seller)/my-commissions/page.tsx:40-60` (matrah, oran, tahmini prim) |
| "Sipariş açıldı, henüz tahsil edilmedi" | ✅ | `my-commissions/page.tsx:52-58` ← `commission-service.ts:118-122` |
| Açık alacak ve gecikmeler | ✅ | `src/app/(seller)/account/page.tsx:64-84` (+ yaşlandırma kovaları) |
| Doktor portföyü | ✅ | `account/page.tsx:66` (doktor sayısı) |
| Ortalama iskonto | ✅ | `account/page.tsx:41` (`weightedDiscount`) |

**Değerlendirme:** UYGUN

**Etki:** Faz F'in bilgi içeriği büyük ölçüde tamam; eksik olan tek yönetim kalemi (ay içi prim yükü) firmanın aylık nakit yükümlülüğünü tek bakışta görmesini engelliyor.

**Öneri:** Dashboard'a, aktif satıcılar için `getPeriodPreview(...).commissionAmount` toplamını gösteren bir "Ay İçi Prim Yükü" kartı eklenmeli. Ayrıca `PROJE_DURUMU.md`'nin "üç rapor" ifadesi düzeltilmeli — dördü de mevcut. Satıcı tarafındaki iki sayfanın tek dashboard'a birleştirilmesi kozmetik bir tercihtir, FR-61 içerik olarak karşılanıyor.

---

### D-08 — KDV dahil/hariç toggle kapsamı

**Bulgu:**

**1. Toggle hangi ekranlarda var, hangilerinde yok?** Mekanizma sağlam kurulmuş ama kapsamı çok dar — **yalnız iki ekranda** var:

| Ekran | Toggle | Yer |
|---|---|---|
| Raporlar | ✅ var | `src/app/(admin)/reports/page.tsx:43` (`<VatToggle current={mode} />`) |
| Satıcı yeni sipariş | ✅ var | `src/app/(seller)/my-orders/OrderForm.tsx:52,180` (kendi inline anahtarı) |

Toggle **bulunmayan** ekranlar (FR-18 "tüm fiyat girişi ve listelerde" diyor):

| Ekran | Dosya |
|---|---|
| Admin dashboard | `src/app/(admin)/dashboard/page.tsx` (ciro kartları sabit "KDV dahil" — `:107,114`) |
| Ürün listesi / ürün formu (**fiyat girişi**) | `products/page.tsx`, `products/ProductForm.tsx` |
| Sipariş listesi ve sipariş detayı | `orders/page.tsx`, `orders/[id]/page.tsx`, `components/OrderDetail.tsx` |
| Doktor detayı (cari, sipariş, tahsilat) | `doctors/[id]/page.tsx` |
| Tahsilatlar | `collections/page.tsx` |
| Bayi detayı ve **bayi fiyat girişi** | `dealers/[id]/page.tsx` |
| Bayi paneli (cari, fiyat listesi, sevkiyat) | `(dealer)/bayi/*` |
| Primler | `commissions/page.tsx`, `my-commissions/page.tsx` |
| Satıcı "Hesabım" | `(seller)/account/page.tsx` |
| Satıcı sipariş listesi | `my-orders/page.tsx` |
| Stok | `stock/page.tsx` |

Özellikle **fiyat giriş ekranları** (ürün formu ve bayi fiyat tanımı) toggle'sız: `ProductForm.tsx` net fiyat istiyor, `setDealerPrice` (`dealers/actions.ts:94`) net bekliyor. KDV dahil düşünen bir kullanıcı burada dönüştürmeyi elle yapmak zorunda.

**2. Tercih çerezle hatırlanıyor mu?** ✅ **Evet, doğru kurulmuş.** Çerez adı `vatMode` (`src/lib/vat-mode.ts:14`), yazım `document.cookie = ...; path=/; max-age=31536000; SameSite=Lax` (`src/components/VatToggle.tsx:7` ve `OrderForm.tsx:22` — **aynı sabiti paylaşıyorlar**). Sunucu ilk render'da okuyor (`reports/page.tsx:20`, `my-orders/new/page.tsx:12-14`), böylece hydration uyuşmazlığı yok. `vat-mode.ts`'in bilerek `"use client"` içermemesi (`:6-10`'daki not) doğru bir karar.

Kanıtlayan testler: `e2e/admin/reports.spec.ts:75` ("KDV tercihi çerezde kalıcı") ve `e2e/seller/pricing.spec.ts:44` ("seçim tutarları dönüştürür ve tercih hatırlanır"). Yani **sıfırlanmıyor** — mevcut olduğu iki ekran arasında da paylaşılıyor.

**3. Σ kalem = sipariş toplamı kuralını kanıtlayan birim test hangisi?**

- `src/lib/vat.test.ts:67` — `describe("sumLineTotals — 🔴 kalemler toplamı = sipariş toplamı")`
- `src/lib/vat.test.ts:76` — `it("kalem bazında yuvarlanan KDV'lerin toplamı, sipariş toplamına eşittir")`
- `src/lib/vat.test.ts:97` — `it("toplam üzerinden hesaplamakla kalem bazından farkı gösterir")` (yuvarlama farkını açıkça belgeliyor)
- `src/lib/vat.test.ts:18` — kuruş altı yarımı yukarı yuvarlama

Uygulama tarafı: `sumLineTotals` (`src/lib/vat.ts`) ve çağrıldığı yer `src/app/(seller)/my-orders/actions.ts:133`. PRD'nin (`:145-147`) "kalem bazında yuvarla, sipariş toplamında değil" kuralı hem uygulanmış hem test edilmiş.

**Değerlendirme:** EKSİK

**Etki:** KDV dahil düşünen bir kullanıcı ürün ve bayi fiyatlarını girerken dönüşümü zihinden yapmak zorunda kalır; yanlış girilen bir taban fiyat, RULE-03 kontrolünden geçtiği için sessizce kabul edilir.

**Öneri:** `VatToggle` bileşeni zaten yeniden kullanılabilir durumda; öncelik sırası: (1) **fiyat giriş ekranları** — `ProductForm` ve bayi fiyat formu (yanlış giriş burada kalıcı hasar veriyor), (2) doktor detayı ve tahsilat ekranları (müşteriyle konuşulan rakamlar), (3) kalan listeler. Mekanizma değişikliği gerekmiyor, yalnız `parseVatMode(cookie)` okuyup `<VatToggle>` yerleştirmek ve gösterilen alanı `mode`'a göre seçmek yeterli.

---

### D-09 — Faz A kenar durumları

**Bulgu:**

**1. `Doctor.phoneNormalized` şemada gerçekten `@unique` mi? Boş/null telefon kısıtı deler mi?**

Şemada (`prisma/schema.prisma`, `Doctor` modeli):

```prisma
// 🔴 FR-09: mükerrer kaydı engelleyen tek mekanizma. Kanonik biçim +90XXXXXXXXXX.
phoneNormalized String @unique
```

Alan **`String`** — yani `String?` değil, **NOT NULL**. Veritabanında da karşılığı var: `prisma/migrations/20260723175607_init_v2/migration.sql:59` (`"phoneNormalized" TEXT NOT NULL`) ve `:412` (`CREATE UNIQUE INDEX "Doctor_phoneNormalized_key"`).

`normalizePhone()` davranışı (`src/lib/phone.ts:25-46`):

| Girdi | Sonuç |
|---|---|
| `"0532 123 45 67"`, `"+90 532 123 4567"`, `"90 532 123 45 67"`, `"0090532..."` | Hepsi → `"+905321234567"` |
| `""` (boş) | `InvalidPhoneError` fırlatır (`:33`) |
| `null` / `undefined` | `InvalidPhoneError` fırlatır (`:26`) |
| 10 haneden farklı, ya da 0 ile başlayan 10 hane | `InvalidPhoneError` (`:41-43`) |

**Kısıt delinemiyor.** İki kat koruma var: (a) kolon NOT NULL olduğu için "birden çok NULL benzersizlik kısıtını atlatır" klasik açığı **yapısal olarak imkânsız**; (b) action seviyesinde `tryNormalizePhone` null dönerse kayıt reddediliyor (`src/app/(seller)/my-doctors/actions.ts:24-30`), yani boş telefonla doktor oluşturulamıyor. Ayrıca `createDoctor` hem ön kontrol yapıyor (`:58-70`) hem de yarış durumunda UNIQUE ihlalini yakalıyor (`:89-93`) — eşzamanlı iki kayıt denemesinde mükerrer oluşmaz. Testler: `src/lib/phone.test.ts:12,43,48,54,71` ve `e2e/seller/doctors.spec.ts:67`.

⚠️ Tek eksik: FR-09'un ikinci yarısı olan **"ad-soyad + klinik benzerliğinde uyarı (yumuşak kontrol)" kodda yok** — benzerlik/fuzzy eşleme mantığı hiçbir yerde bulunmuyor. Sert kural (telefon) çalıştığı için mükerrer kaydın ana yolu kapalı, ama farklı telefonla aynı doktorun ikinci kez girilmesi hâlâ uyarısız mümkün.

**2. Doktor devri (`DoctorAssignment`) `createAuditLog` yazıyor mu?** ✅ **Evet.**

- `transferDoctor` (`src/app/(admin)/doctors/actions.ts:47-70`): tek transaction içinde açık atamayı kapatıyor (`:49-52`), sahipliği güncelliyor (`:54-57`), yeni `DoctorAssignment` satırı yazıyor (`:61-68`).
- Hemen ardından `createAuditLog` (`:73-80`), `DOCTOR_TRANSFER` aksiyonuyla, `before: { ownerSellerId }` / `after: { ownerSellerId, reason }` alanlarıyla. RULE-13 karşılanıyor.
- İlk kayıtta da atama zinciri başlatılıyor (`my-doctors/actions.ts:79-86`, `reason: "İlk kayıt"`) ve audit yazılıyor (`:95-101`).

⚠️ Not: audit yazımı transaction'ın **dışında** ve `createAuditLog` hatayı yutuyor (`src/lib/audit.ts:160-162`). Devir commit olup audit satırı yazılmayabilir — düşük olasılık, ama RULE-13'ün "istisnasız" ifadesiyle tam örtüşmüyor.

**3. Devir sonrası eski siparişler eski satıcıda mı kalıyor?** ✅ **Kalıyor — hem sipariş hem prim hem rapor tarafında.**

- `transferDoctor` yalnız `Doctor.ownerSellerId`'yi güncelliyor; **`Order.sellerId`'ye hiç dokunmuyor** (`doctors/actions.ts:54-57`, niyet `:12-13`'te de belgelenmiş).
- Prim matrahı siparişin satıcısını kullanıyor: `src/lib/commission-service.ts:45-54` → `order: { sellerId }`. Kod içindeki not (`:37`) bunu açıkça yazıyor: "Prim, siparişi açan satıcıya aittir — doktorun GÜNCEL sahibine değil."
- Satıcı raporu da aynı alanı kullanıyor (`src/lib/reports-service.ts:29,39`), açık alacak dağılımı da (`src/lib/doctor-cari.ts:161` → `o.sellerId`). Yalnız "doktor sayısı" güncel sahipliğe bakıyor (`doctor-cari.ts:166-168`, `reports-service.ts:43`) — bu FR-07 ile tutarlı, çünkü portföy büyüklüğü bugünkü durumu anlatmalı.

**Kanıtlayan test:** `e2e/admin/doctor-transfer.spec.ts:44` — "admin doktoru devreder; geçmiş siparişler eski satıcıda kalır (FR-06/FR-07)". Sahipsiz havuz durumu da ayrıca test edilmiş (`:132`).

**Değerlendirme:** UYGUN

**Etki:** Faz A'nın para etkisi olan iki kenar durumu (mükerrer doktor, devirde prim kayması) doğru çözülmüş; kalan eksik yalnız yumuşak bir uyarı.

**Öneri:** FR-09'un yumuşak kontrolü için, kayıt sırasında aynı klinik içinde benzer ad-soyad taşıyan doktorları listeleyen bloklamayan bir uyarı eklenebilir (basit normalize edilmiş `LIKE` yeterlidir; fuzzy kütüphaneye gerek yok). Öncelik düşüktür — sert kural zaten çalışıyor.

---

## Rapor Sonu — Özet

### 1. Canlıya alma blokörleri

Gerçek veri girilmeden **önce** çözülmesi gerekenler, öncelik sırasıyla:

1. **İptal edilen siparişin mahsupları prim matrahında kalıyor** (`src/lib/commission-service.ts:45-54`'te `order.status` filtresi yok) — firma hak edilmemiş prim öder; düzeltmesi tek satır, etkisi doğrudan nakit.
2. **Tahsilat mahsup planı transaction dışında hesaplanıyor** (`collections/actions.ts:52-55`) — eşzamanlı iki tahsilatta fazla mahsup yazılır, doktor bakiyesi ve prim matrahı birlikte bozulur.
3. **`cancelOrder` mahsupları geri almıyor** (`orders/actions.ts:81-102`) — tahsilatı olan bir sipariş iptal edilince veri iki formül arasında kalıcı olarak tutarsızlaşır.
4. **Doktor bakiyesi iki farklı formülle hesaplanıyor** (D-04) — aynı doktor için doktor detayı ile dashboard farklı rakam gösterebilir; hangisinin doğru olduğuna karar verilmeden canlıya çıkılmamalı.
5. **Expiry job'ını zamanlayan hiçbir şey yok** (D-05) — para kaçağı yok ama `EXPIRE` denetim izi hiç oluşmaz; §11 uyum gereksinimi karşılanmaz.
6. **RULE-01 için eşzamanlılık testi yok** (D-02) — desen doğru görünüyor ama iki kanalın aynı stoğu yarıştırdığı durum kanıtsız; canlıda stok negatife düşerse sipariş ve sevkiyat birlikte bozulur.
7. **Kongre kontenjanı transaction dışında kontrol ediliyor** (`my-congresses/actions.ts:65-71`) — eşzamanlı taleplerde kontenjan aşılabilir (bakiye korunuyor, kontenjan korunmuyor).

### 2. Sessiz finansal risk taşıyanlar (en tehlikelileri)

Yanlış çalıştığında **hata vermeyen**, yalnız yanlış rakam üretenler:

| # | Risk | Yer |
|---|------|-----|
| 1 | İptal sipariş mahsubu prim matrahında kalıyor — prim fazla hesaplanır | `src/lib/commission-service.ts:45-54` |
| 2 | `tahsilatOrani` %100'ü aşabilir (tahsilatta iptal filtresi yok, ciroda var) | `src/lib/reports-service.ts:29,36-42` |
| 3 | Eşzamanlı tahsilatta fazla mahsup — açık alacak eksik, prim fazla | `collections/actions.ts:52-55` |
| 4 | Avans (mahsup edilmemiş tahsilat) iki ekranda iki farklı bakiye üretiyor | `doctor-cari.ts:29-48` vs `:195-201` |
| 5 | İptal edilen siparişin ödemesi bakiyeyi yapay olarak düşürüyor | `orders/actions.ts:98-101` |
| 6 | Kongre kontenjanı eşzamanlı taleplerde aşılabilir | `my-congresses/actions.ts:65-71` |
| 7 | Audit best-effort — para hareketi yazılıp denetim izi yazılmayabilir | `src/lib/audit.ts:160-162` |

Bunların **hiçbiri** bir hata mesajı üretmez; yalnızca mutabakat yapıldığında fark edilir.

### 3. Sonraya bırakılabilirler

- FR-28 — vadesi geçmiş doktora sipariş uyarısı (PRD zaten "blok yok, uyarı" diyor; **YOK**)
- FR-18 toggle kapsamının genişletilmesi — fiyat giriş ekranları dışındakiler
- FR-09 yumuşak benzerlik uyarısı (sert kural çalışıyor)
- FR-58 "toplam kullanılan bakiye", FR-60 "ay içi prim yükü" kartları
- Route group başına `error.tsx` / `loading.tsx` (D-06) — kullanıcı deneyimi, veri bütünlüğü değil
- Admin ayar ekranı (`setSetting` çağrılmıyor: vade parametreleri, prim oranı, KDV oranı sabit varsayılanlarda)
- `validateManualAllocation`'ın UI'a bağlanması (FR-24'ün manuel düzeltme yarısı)
- FR-31 satıcı bazlı prim oranı için form alanı
- 15 adımlık kabul senaryosu testi (D-03) — canlıya çıkmadan yazılması **çok** tercih edilir ama tek başına blokör değil

### 4. Bu brifte sorulmayan, denetim sırasında fark edilen bulgular

**Para ve transaction sınırı:**

1. **`createShipment` iki ayrı transaction kullanıyor.** `dealers/actions.ts:228-241` sevkiyatı `TALEP` olarak yazıyor, `:242` ayrı bir transaction'da onaylıyor. Onay adımı patlarsa (ör. stok yetersiz) ortada **sahipsiz bir `TALEP` kaydı kalır** — stok/cari etkilemediği için zararsız, ama admin'in onay kuyruğunu kirletir ve elle temizlik gerektirir.
2. **`refundReservation` iade edilecek lotun hâlâ var olduğunu doğrulamıyor.** `congress-service.ts:204-207` `tx.congressLedger.update({ where: { id: s.refId } })` çağrısını koşulsuz yapıyor; kaynak lot bu arada `expireLots` tarafından sıfırlanmışsa iade **süresi dolmuş bir lota** yazılır ve bakiye sessizce geri gelmez. FR-56'nın "süre uzamasın" amacıyla tutarlı ama sonucu kullanıcıya görünmez.
3. **`getSellerReports` tahsilat toplamı dönem filtresi taşımıyor** (`reports-service.ts:36-42`) — tüm zamanların tahsilatını o anki ciroyla oranlıyor. Rapor "tahsilat oranı" olarak sunuluyor; tanımı belgelenmemiş.

**Yetki (IDOR):**

4. **Kontrol edilen okuma yolları temiz.** Örnekleme yapıldı ve üçü de doğru kapsamlanmış: `my-orders/[id]/page.tsx:16-24` (`findFirst({ where: { id, sellerId } })` + `notFound()`), `my-doctors/[id]/edit/page.tsx:18-21` (`ownerSellerId` kısıtı), `bayi/sevkiyatlar/page.tsx:23-29` (`dealerId` oturumdan). Bayi tarafında `dealerId` **hiçbir zaman istemciden alınmıyor** (`talep/actions.ts:17-27`), `withdrawRequest` de sahiplik doğruluyor (`:88-91`). Bu alan iyi durumda — bulgu olarak değil, **doğrulanmış güçlü yön** olarak kaydedilmiştir.

**Audit kapsamı:**

5. **Audit yazımı istisnasız değil.** `createAuditLog` hem iş transaction'ının dışında hem de hatayı yutuyor (`audit.ts:147-163`). RULE-13'ün "istisnasız" ifadesi kod düzeyinde garanti edilmiyor. Denetim izinin hukuki gerekçesi (§11) düşünüldüğünde, en azından **para hareketi doğuran** aksiyonlarda (tahsilat, iptal, manuel bakiye düzeltmesi, prim kapanışı) audit'in transaction'ın parçası olması değerlendirilmeli.
6. **`recordDealerPayment` transaction kullanmıyor** (`dealers/actions.ts:370-379`) — tek yazım olduğu için bugün sorun değil, ama bayi tarafına mahsuplaşma eklenirse D-01'deki aynı tuzağa düşer.
7. **`rejectShipment` ve `withdrawRequest` audit tutarsızlığı:** `rejectShipment` audit yazıyor (`dealers/actions.ts:285-291`), bayinin kendi talebini geri çektiği `withdrawRequest` ise **audit yazmıyor** (`talep/actions.ts:96-106`). Aynı durum geçişi (`TALEP → REDDEDILDI`) bir yoldan izli, diğerinden izsiz gerçekleşiyor.

**Test altyapısı:**

8. **DB'ye dokunan servis katmanının hiç testi yok.** `doctor-cari.ts`, `dealer-cari.ts`, `congress-service.ts`, `commission-service.ts`, `reports-service.ts`, `dealer-shipment.ts`, `settings.ts` için birim/entegrasyon testi bulunmuyor. 10 birim test dosyasının tamamı saf fonksiyonlara yönelik ve kaliteli; ancak bu denetimde bulunan **finansal risklerin tamamı** test edilmeyen bu katmanda yaşıyor. Saf fonksiyon testleri bu hataları yapıları gereği yakalayamaz.
