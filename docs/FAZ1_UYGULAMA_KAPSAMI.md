# Faz 1 Uygulama Kapsamı — KARARLAR §4'ün iş dökümü

> **Sınıf 2 · Plan** (`YOL_HARITASI.md` §7.1-A). Bu dosya **karar üretmez**. Her satırın kaynağı
> `KARARLAR.md`'dir; çelişkide KARARLAR kazanır. Mimari *"nasıl"* kararları `docs/adr/`'dedir.
>
> **Bölümler:** §A geri çekme listesi (söküm takibi, commit hash'i **yalnız burada**) ·
> §B yeni yazılacaklar · §C açık madde defteri · §D 1A commit dizisi ve 1B sırası ·
> §E Şerit A (PRD taraması) defteri.
>
> ✅ **13.10.2026 — Faz 1A kapandı (07.10.2026).** §D.2'nin tamamı işaretli; §A'nın 20 kalemi kapandı (GÇ-12 `şema ✅ / davranış 1B`). **Sıradaki iş §D.3 (Faz 1B).** İlk tahmin: `YOL_HARITASI.md` §8.1.
>
> ✅ **13.10.2026 — 1B'nin son karar engeli kalktı:** KARARLAR **X-16** (§5.20) · **X-15 §(5)** 🟦 · `docs/adr/ADR-006`. Defter: §C-y · §C-aa. Plan etkisi: §B.4 · §B.5 · §D.3 madde 7.
>
> **🔧 16.09.2026 — dosya yeniden kuruldu (kapsam ve sıra değişmedi).** 13.09'da açılan ana
> dosyanın güncel sürümü kayıptı; elde yalnız §D (`FAZ1_UYGULAMA_KAPSAMI_D.md`) ve 15.09 yaması
> vardı. **§A, §B ve §C** şu kaynaklardan yeniden yazıldı: `KARARLAR.md` §4 (şema özeti,
> fonksiyon ve config listeleri) · `PROJE_DURUMU.md` GÇ tablosu · 15.09 yaması · §D ·
> `MEVCUT_SISTEM_DURUMU.md` §4 (silinecek tablolar). **§D** = `_D` dosyası + yama.
> **§E yeni** — Şerit A'nın çıktı tablosu; 59 madde `TRACEABILITY.md`'den listelendi.
> `FAZ1_UYGULAMA_KAPSAMI_D.md` ve yama dosyası **artık kullanılmaz**.
> ⚠️ Aynı tur **iki şema boşluğu** buldu: §C-r (`CariHareket`) ve §C-s (`ImportParti`).
> İkisi KARARLAR'da **X-11 · X-12** olarak açıldı ve **`CM`'i bloklar** (§D.6 R-9).
> **✅ 16.09.2026 (4) — açık karar kalmadı.**
> - **X-13 · X-14 · X-15** kapandı (KARARLAR §5.16–§5.18). **ADR-005** yazıldı: `Product.stock` kalkar.
> - Şerit A kapandı: **59/59** → 48 ✅ · 8 ⛔ · 3 🔵 · 0 ❌ (§E.3).
> - `policy.ts` **23 anahtar** oldu. GÇ-17'nin kod tarafı `CM`'e kaydı. Yeni borç: **R-10**.
> - **`CM`'in önünde yalnız C0…C7b sırası var.**
>
> **✅ 16.09.2026 (3) — X-11 · X-12 kapandı; Şerit A tarandı.**
> - **X-11 · X-12:** `CariHareket` ve `ImportParti` yeni tablo oldu (**13 → 15**).
> - **Şerit A:** 59 madde tarandı → 38 ✅ · 8 ⛔ · 3 🔵 · **10 ❌**. ❌'ler üç karar maddesinde toplandı:
>   **X-13 · X-14 · X-15** (§C-u/v/w).
> - Tarama, geri çekme listesinde olmayan **beş yetenek** buldu → **GÇ-16…GÇ-20** (§A: 15 → 20).
> - Bir **ADR sorusu** açıldı: §C-x (`Product.stock`).
> - **`CM`'i bekletenler:** X-13 · X-14 · X-15 · §C-x.
>
> Eski ana dosyanın bir kopyası bulunursa **bu dosya esastır**. Eski dosyadaki bir bilgi burada
> yoksa §C'ye açık madde olarak yazılır.

---

## §A · Geri çekme listesi — **20 kalem**

> Kodda **bugün çalışan**, ama KARARLAR'ın geçersiz kıldığı yetenekler.
> *(13.09: 12 → 13 · 15.09: GÇ-14 X-9 ile, GÇ-15 X-10 ile → 15 · **16.09: GÇ-16…GÇ-20 PRD taramasından** → 20.)*
> *16.09 satırlarının kararları eski tarihlidir (X-1, B-4, C-6, A-7, C-1); geri çekme kaydı eksik kalmıştı.*
>
> **Okuma:**
> - `Durum` ⬜ = kodda duruyor · ✅ = eski yapı **kodda ve şemada kalmadı** (yerine gelen
>   davranışın yazılması 1B'dir; §D.2).
> - `Kod` / `Şema` kolonları §D.1'deki commit'i gösterir. Sıranın gerekçesi §D'dedir.
> - **Commit hash'i yalnız bu tabloya** yazılır.
> - **Şemadan çıkan 14 tablo:** `MEVCUT_SISTEM_DURUMU.md` §4'ün ölçtüğü 11 tablo + `LoginAttempt`
>   + *(16.09, GÇ-16)* `CommissionPeriod` ve `CommissionAdjustment`.
>   11 tablo: `PaymentAllocation` · `Congress` · `CongressPackage` · `CongressRegistration` ·
>   `CongressLedger` · beş `Dealer*` · `SystemSetting`.
> - **Kalanlar (16.09):** `DoctorAssignment` (X-13) ve `DueDateChange` (X-15) **kalır**; `DueDateChange`'in bağı
>   cari harekete taşınır. Ayrıca `Product.stock` **kolonu** çıkar (ADR-005 → GÇ-17).
>   Hepsi `CM`'de çıkar; o güne kadar şemada durur, **okunmaz**.

| # | Ne (bugün kodda) | Yerine | KARARLAR | Kod | Şema | Durum | Commit |
|---|---|---|---|---|---|---|---|
| **GÇ-1** | Prim matrahı = tahsil edilen tutar (`commission-service.ts`) + `/commissions` ve `/my-commissions` ekranları | Hakediş **sevkiyat anında** doğar; yeni prim kodu 1B'de yazılır. Arada tabansız prim ekranı bırakılmaz | X-1 §(7) · A-3 | **C4** | — | ✅ | `9993a42` |
| **GÇ-2** | `tahsilatOrani` / `collectionRate` metriği (`reports-service.ts:36-42`, `reports.ts`) | **Kaldırılır, kalıcı.** Yerine iki mutlak sayı (1B madde 3) | X-1 §(1) | **C4** | — | ✅ | `9993a42` |
| **GÇ-3** | `PaymentAllocation` + FIFO mahsup (`allocation.ts`) + yaşlandırma (`agingBucket`, `summarizeAging`) | Kalem kapatma yok; bakiye tek ve işaretli (`hesaplaDoktorBakiye`). Yaşlandırma **Faz 2+**. Runtime FIFO da yasak | A-7 · K-2 · **X-6** | **C3** | **CM** | ✅ | `ba3d75f` (kod) · `ee22ca7` (şema) |
| **GÇ-4** | `CongressLedger` + EARN/SPEND/EXPIRE + 12 ay expiry job (`job:expire`) + kongre ekranları (`(admin)/congresses/**`, `(seller)/my-congresses/**`) | Modül **uyum kütüğü** olarak yeniden yazılır (Faz 3+, `modules.congress = false`). Modül yazılmadan tablosu yazılmaz | K-6 §(2) · §1.3 | **C2** | **CM** — `Congress`, `CongressPackage`, `CongressRegistration`, `CongressLedger` | ✅ | `59b9d3c` (kod) · `ee22ca7` (şema) |
| **GÇ-5** | Doktor bazlı kongre/teşvik bakiyesi — doktor detayındaki defter bölümü + `adjustCongressBalance` | Doktorda teşvik anlamı taşıyan alan veya hesap **yok** | K-6 §(4) · §1.3 | **C2** | GÇ-4 ile | ✅ | `59b9d3c` (kod) · `ee22ca7` (şema) |
| **GÇ-6** | `Role.DEALER` + `(dealer)` paneli **ve** beş `Dealer*` tablosu (`Dealer`, `DealerPrice`, `DealerShipment`, `DealerShipmentItem`, `DealerPayment`) + bayi yönetim ekranları (`(admin)/dealers/**`, `/dealer-shipments`) + `dealer-cari.ts` · `dealer-shipment.ts` · `recordDealerPayment` + bayi okuyan rapor/dashboard parçaları | Bayi **`Doktor` satırı**, `hesap_sinifi = BAYI`. İşlemleri genel belge akışlarıdır. 1B'de tek cari ekranı | D-2 §(6) · **X-8** | **C5** | **CM** | ✅ | `f2b17da` (kod) · `ee22ca7` (şema) |
| **GÇ-7** | `Role` = `ADMIN` / `SELLER` / `DEALER` | `YONETICI` / `OPERASYON` / `SATICI`. 1A'da **mekanik** yeniden adlandırma; `OPERASYON` davranışı 1B madde 3'te | D-2 §(1) | **CM** (kuyruk) | **CM** | ✅ | `ee22ca7` |
| **GÇ-8** | `netMinPrice` taban fiyat + RULE-03 sert reddi (`OrderForm` `belowMin`, `products/actions.ts:33-36`, `my-orders/actions.ts:99-102`) | İskonto tavanı yok (`pricing.iskontoTavani = null`); liste üstü satış serbest. Yerine taban **etiketi** (1B, Ü-3) | A-10 · Ü-3 §(10) | **C6** | **CM** | ✅ | `e804016` (kod) · `ee22ca7` (şema) |
| **GÇ-9** | KDV dahil/hariç toggle + çerez tercihi (`vat-mode.ts`, `VatToggle.tsx`, `reports/page.tsx`, `OrderForm` KDV düğmeleri) | Taban etiketi zorunluluğu. Toggle kurulum düzeyidir, Faz 1'de görünmez | Ü-3 §(1)/(3)/(6) | **C6** | — | ✅ | `e804016` |
| **GÇ-10** | `Product.vatRate` (Int) | `Urun.vergi_orani_id` → `VergiOrani` tanım tablosu. `hesaplaSatirTutarlari()` 1B madde 5'te | C-6 §(2) | **CM** (okuma noktaları, kuyruk) | **CM** | ✅ | `ee22ca7` |
| **GÇ-11** | `SystemSetting` + `settings.ts` (admin ayarı beklentisi) · *16.09:* **vade üst sınırı kontrolü** (`getDueSettings`, `createOrder`, `changeDueDate`) | Config **`policy.ts`**'te, **açılmaz** (§B.7) · vadede **sistem sınırı yok** | §0.1.1 · KARARLAR §2 madde 16 | **C7** | **CM** — `SystemSetting` | ✅ | `fedc2cc` (kod) · `ee22ca7` (şema) |
| **GÇ-12** | Sipariş = tek parça sevkiyat | **Kısmi sevkiyat**; borç ve prim sevkiyatta doğar | A-3 | 1B madde 7 | **CM** | **şema ✅ / davranış 1B** | `ee22ca7` |
| **GÇ-13** | `BigInt` kuruş + `money.ts` `divRound` | **`Decimal`** + `formatla()` + lint kuralı | **X-5** | **CM** | **CM** | ✅ | `ee22ca7` |
| **GÇ-14** | `LoginAttempt` tablosu ve onu okuyan/yazan deneme sınırı kodu | Bellek içi sayaç. Eşikler `policy.ts`'te (`auth.girisDenemeSiniri`, `auth.girisKilitDakika`). Denemeler container log'una | **X-9** · E-2 §(5)/(8) · `docs/adr/ADR-004` | **C7b** | **CM** | ✅ | `4320f82` (kod) · `ee22ca7` (şema) |
| **GÇ-15** | `Product.netListPrice` — ürün kartındaki liste fiyatı ve onu okuyan/yazan kod | **Varsayılan fiyat listesinin satırı** (`pricing.varsayilanFiyatListesiKodu`). Okuyanlar `cozumleBirimFiyat()` ilk sürümüne bağlanır | **X-10** · B-5 · B-6 | **CM** (§D.1 not 3) | **CM** | ✅ | `ee22ca7` |
| **GÇ-16** *(16.09)* | Prim **dönem kapatma** + `HESAPLANDI → ONAYLANDI → ÖDENDİ` durumları + sonraki döneme düzeltme kaydı (`closePeriod`, `CommissionPeriod`, `CommissionAdjustment`, enum `CommissionStatus`) — FR-34/35/36 | Kilit yok. Geçmiş dönem ters kayıtla değişmez; ters kayıt kendi belge tarihinde doğar. Ödeme ve onay sistem dışıdır | **X-1** §(6)/(7) + *kapsam dışı, kalıcı* | **C4** (ekranlarla birlikte) | **CM** | ✅ | `9993a42` (kod) · `ee22ca7` (şema) |
| **GÇ-17** *(16.09)* | Negatif stoğun **sert reddi** (RULE-01, FR-43) **ve saklı stok miktarı** — `Product.stock` + koşullu `updateMany` + `_sum.stock` | Stok hareketlerden türer (`hesaplaStok()`); eşzamanlılık ürün satırı kilidiyle. **Yumuşak kısıt:** negatife düşüş engellenmez; `OnayBlogu` izi 1B'de (R-10) | **B-4** · A-8 · `docs/adr/ADR-005` | **CM** (§D.1 not 3-c) | **CM** | ✅ | `ee22ca7` |
| **GÇ-18** *(16.09)* | **Saklı KDV ve toplam alanları:** `OrderItem.vatAmount` · `lineNetTotal` · `lineGrossTotal` · `Order.netTotal` · `vatTotal` · `grossTotal` | Türetilir — `hesaplaSatirTutarlari()`; belge toplamı Σ satır. İlk sürüm `CM`'de (§D.1 not 3) | **C-6** §(3)/(5) | **CM** (kuyruk) | **CM** | ✅ | `ee22ca7` |
| **GÇ-19** *(16.09)* | **Siparişteki vade tarihi** (`Order.dueDate`) | Vade **cari harekettedir** ve sevkiyat tarihinden işler. Siparişte yalnız `odeme_vadesi_gun` durur | **A-7** · **X-11** §(4) | **CM** (kuyruk) | **CM** | ✅ | `ee22ca7` |
| **GÇ-20** *(16.09)* | **Tahsilattaki fatura numarası** (`DoctorPayment.invoiceNo`) | Fatura numarası kolonu konmaz (fatura–belge ilişkisi N-N). §D.2 anti-şema listesindeki `harici_fatura_no` karşılığıdır | **C-1** §(4) · X-6 | **CM** (kuyruk) | **CM** | ✅ | `ee22ca7` |

---

## §B · Yeni yazılacaklar

> KARARLAR §4 *"Faz 1 şema özeti"*nin **iş dökümü**. Karar metni burada tekrarlanmaz; her
> satır kaynağına atıf yapar.
> **Şema adları:** buradaki Türkçe tablo/kolon adları **kavramsaldır**. Şemadaki İngilizce
> karşılık `docs/adr/ADR-001` ekinden alınır; ek `CM`'de tamamlanır.
> **Kolonlar:** `Şema` = hangi commit'te şemaya girer · `Davranış` = §D.3'teki 1B maddesi.

### §B.1 · Tablolar — **15** *(X-10 ile 11 → 13 · X-11/X-12 ile → 15)*

| Tablo | Kaynak | Şema | Seed (C9) | Davranış |
|---|---|---|---|---|
| `OnayBlogu` | A-8 | CM | — | 1B madde 1 (`acikBlokVarMi`) |
| `StokKonum` | A-4 · B-4 | CM | tek depo (B-4) | 1B madde 1 (`hesaplaStok`) · 7 |
| `OdemeYontemi` | A-11 · A-15 | CM | ✅ | 1B madde 7 |
| `KargoFirma` | D-3 | CM | ✅ | 1B madde 7 |
| `VergiOrani` | C-6 | CM | ✅ (`KDV20`) | 1B madde 5 |
| `BelgeSayac` | A-14 | CM | — | 1B madde 2 (`uretBelgeNo`) |
| `StokDuzeltme` · `StokDuzeltmeSatir` | B-7 | CM | — | 1B madde 7 |
| `StokDuzeltmeSebep` | B-7 | CM | ✅ | 1B madde 7 |
| oturum tablosu | E-2 · `docs/adr/ADR-003` | CM | — | 1B madde 4 |
| dışa aktarım kütüğü | D-5 | CM | — | 1B madde 6 |
| `FiyatListesi` · `FiyatListesiSatir` | **X-10** · B-5 · B-6 | CM | ✅ varsayılan liste | ilk sürüm CM (§D.1 not 3) · 1B madde 5 · 7 |
| `CariHareket` | **X-11** · A-6 · A-7 | CM | — | 1B madde 1 (`hesaplaDoktorBakiye`) · 2 · 7 |
| `ImportParti` | **X-12** · D-6 · E-3 | CM | — | 1B madde 7 (D-6) |

- **Kısıt:** `FiyatListesiSatir` tarih aralığı çakışma yasağı **aynı liste + ürün + `min_adet`**
  için, DB düzeyinde (B-5, X-10 §(1)). Aralıklar yarı açıktır (E-1).
- **Seed (C9, `db:seed`):** ilk `YONETICI` hesabı (E-2) · tanım tablolarının başlangıç satırları
  (K-8 §(1) listesi) · varsayılan fiyat listesi (X-10). Demo veri yalnız `db:seed:demo`'dadır.
- ✅ *16.09:* sayımda eksik kalan `CariHareket` ve `ImportParti` X-11 / X-12 ile eklendi.
- ✅ *16.09:* bugünkü `DoctorAssignment` (devir izi — X-13 §(5)) ve `DueDateChange` (vade izi — X-15 §(1)) **kalır**.
  Yeni tablo sayılmazlar. `DueDateChange`'in bağı siparişten **cari harekete** taşınır (`CM`).

### §B.2 · Belgeler — **4**

| Belge | Önek | Kaynak | Mali sonuç | Davranış |
|---|---|---|---|---|
| `KonsinyeCikis` | `KNS` | A-4 | yok | 1B madde 7 |
| `StokTransfer` | `TRF` | B-4 | yok | 1B madde 7 |
| iade belgesi | `IAD` | A-1 | var (cari alacak, ters kayıt) | 1B madde 7 |
| `StokDuzeltme` | `DZL` | B-7 | yok · geriye tarihlendirilemez | 1B madde 7 |

Hepsinin şeması `CM`'dedir. Tüm belgelerde `belge_no` (global UNIQUE, salt okunur) +
`guncelleme_tarihi` vardır (K-4, A-14).

**Belge = başlık + satır** *(16.09 okuma notu — KARARLAR §4)*.
- Satır yapıları belge sayımına dahildir: iade satırı (A-1), konsinye ve transfer satırları.
- `StokDuzeltmeSatir` §B.1'de ayrıca sayılmıştır.
- **Sevkiyat satırı** mevcut belgenin (`SVK`) yeni satır yapısıdır. Bugünkü `Shipment` siparişe **1-1**
  bağlıdır ve satırı yoktur. Satır `CM`'de doğar (A-3 · C-6 §(7) · X-14 §(3) — GÇ-12'nin şema tarafı).

### §B.3 · Kolonlar — **40+** · hepsi `CM`

| Tablo (kavramsal) | Kolonlar | Kaynak |
|---|---|---|
| `StockMovement` | `konum_id` **zorunlu** | A-4 |
| `FiyatListesiSatir` | `min_adet` · `gecerli_baslangic` · `gecerli_bitis` | B-5 · B-6 · X-10 |
| `Siparis` | `asama` · `teklif_gecerlilik_tarihi` · `odeme_vadesi_gun` | A-5 · A-7 |
| `OrderItem` | `liste_fiyat` · **`birim_fiyat`** · **`kdv_orani`** (değer olarak donar) · bedelsiz bayrağı + sebep | A-10 · X-5 · C-6 · A-2 |
| `CariHareket` | `tip` · `yon` · `tutar` (`Decimal(18,2)`, pozitif) · `vade_tarihi` (`date`) · `belge_no` · kaynak belge bağı · ters kayıtta çevrilen satır bağı · parti FK | **X-11** · A-7 · X-12 |
| `Doktor` | `odeme_vadesi_gun` · `kredi_limiti` · `vkn_tckn` · `cari_tip` · `fatura_unvani` · `vergi_dairesi` · `fatura_adresi` · `fatura_ilce` · `fatura_il` · `eposta` · `telefon` · `muhasebe_kodu` | A-7 · A-12 · A-13 |
| `Doktor` | **`hesap_sinifi`** — NOT NULL, **DB varsayılanı yok** | **X-8** |
| `Doktor` | **`fiyat_listesi_id`** — nullable FK; boşsa varsayılan liste | **X-10** |
| `Urun` | **`vergi_orani_id`** — NOT NULL | C-6 |
| `Tahsilat` | `odeme_yontemi_id` (zorunlu) · `komisyon_oran` · `komisyon_tutar` · `beklenen_valor_tarihi` · `yon` | A-11 |
| `Sevkiyat` | `kargo_firma_id` · `takip_no` · `gonderi_tarihi` · `kargo_durum` · `kargo_son_sorgu` · `teslimat_adresi` · `harici_irsaliye_no` (`varchar(32)`, nullable) | D-3 · A-13 · C-1 |
| `StokDuzeltme` | `harici_belge_no` (salt kayıt) | B-7 |
| `Kullanici` | `aktif` (NOT NULL, `true`) · `parola_hash` · `parola_degistirmeli` | E-2 |
| `Kullanici` | `prim_orani` — nullable `Decimal(5,2)` (bugünkü `commissionRate`) | **X-14** §(2) |
| `Siparis` | satıcı alanı **nullable** (`BAYI` siparişinde boş); sipariş anındaki sahip, sonra değişmez | **X-13** §(3) |
| sevkiyat satırı | sipariş satırı bağı · miktar (tam sayı) · **`prim_orani`** (donmuş; `BAYI` ve bedelsizde boş) | A-3 · X-5 §(8) · **X-14** §(3) |
| vade değişiklik izi (bugünkü `DueDateChange`) | bağı **cari harekete** taşınır; eski/yeni tarih · kişi · zaman · gerekçe | **X-15** §(1) |
| devir izi (bugünkü `DoctorAssignment`) | **olay kaydı**: doktor · eski sahip (nullable) · yeni sahip (nullable) · yapan · zaman (`timestamptz`) · gerekçe · başlangıç/bitiş alanları **kalkar** · doktor FK `ON DELETE CASCADE` | **X-17** §(3)/(10) |
| `Doktor` | sahip FK **`RESTRICT`** (bugün `SET NULL`) · `CHECK (hesap_sinifi = 'DOKTOR' OR sahip IS NULL)` — elle SQL | **X-17** §(2) |
| `Doktor` | `telefon` **NOT NULL + normalize + UNIQUE** (bugünkü `phoneNormalized`) · `klinik`, `bolge` **nullable** (`DOKTOR` için uygulama kuralıyla zorunlu) | **X-15** §(2)/(3) |
| `Product` | `stock` **kalkar** | `docs/adr/ADR-005` · GÇ-17 |
| oturum tablosu | `lastSeenAt` + token hash (ayrıntı `docs/adr/ADR-003`, §D.4) | E-2 |
| `ImportParti` | parti numarası · veri türü · kullanıcı · zaman · `dosya_adi` (`varchar(255)`, nullable) · geri alma zamanı / kişi / gerekçe | **X-12** · E-3 |
| `Doktor` · `Urun` · `FiyatListesiSatir` · `StockMovement` | içe aktarım parti FK (nullable) | **X-12** §(2) |
| tüm belgeler | `belge_no` · `guncelleme_tarihi` | K-4 · A-14 |

**Tip disiplini (aynı migration):**
- **E-1:**
  - an = `timestamptz` (UTC)
  - takvim günü = `date`
  - bugün 41 kolonun tamamı `TIMESTAMP(3)`.
- **X-5:**
  - birim fiyat `Decimal(18,4)`
  - tutar `Decimal(18,2)`
  - oran `Decimal(5,2)`
  - miktar tam sayı
  - `BigInt` kuruş yok.

### §B.4 · Yeni tipler ve katalog değerleri *(normatif — `docs/adr/ADR-001`)*

| Tür | Değerler | Kaynak |
|---|---|---|
| Rol | `YONETICI` · `OPERASYON` · `SATICI` | D-2 |
| `HesapSinifi` | `DOKTOR` · `BAYI` *(çekirdek, kapalı katalog)* | **X-8** |
| `cari_tip` | `TUZEL_KISI` · `GERCEK_KISI` | A-13 |
| Cari hareket tipi 🟦 | `SEVKIYAT` · `IADE` · `TAHSILAT` · `ACILIS` · `VADE_FARKI` · `TERS_KAYIT` | **X-11** · A-6 · A-7 |
| Cari hareket yönü 🟦 | `BORC` · `ALACAK` | **X-11** · A-11 deseni |
| Import veri türü 🟦 | `CARI` · `URUN` · `FIYAT_LISTESI` · `ACILIS_BAKIYESI` · `ACILIS_STOGU` | **X-12** · D-6 |
| Stok konumu tipi 🟦 *(04.10)* | `DEPO` · `KONSINYE` | A-4 · B-4 |
| Onay bloğu kararı 🟦 *(04.10)* | `ONAY` · `RED` | A-8 |
| Kural kodu (`varchar`, enum değil — §1.3) | `NEGATIF_STOK` · `KREDI_LIMITI` · `VADESI_GECMIS_HAREKET` · `TUTAR_NEGATIF` · `SAHIP_AKTIF_SATICI_DEGIL` · `BAYI_SAHIP_ATANAMAZ` · `SAHIP_DEGISTI` · `TELEFON_KAYITLI` · `ICE_AKTARIM_KOLON_EKSIK` · `ICE_AKTARIM_KOLON_TANINMIYOR` · `URUN_KODU_KAYITLI` · `FIYAT_SATIRI_CAKISIYOR` | B-4 · A-12 · X-6 · D-6 · **X-17** · **X-15 §(5)** · **X-16** *(13.10)* |
| Belge önekleri | `SIP` · `SVK` · `IAD` · `KNS` · `TRF` · `THS` · `ACL` · `VDF` · `DZL` | A-14 · B-7 |

🟦 = KARARLAR'da **varsayılan kaydı**. Kilitlenme anı `CM`; o güne kadar itiraz yoksa ✅ sayılır (KARARLAR §0.6).

### §B.5 · Kısıtlar

| Kısıt | Kademe | Nerede | Kaynak |
|---|---|---|---|
| Fiyat listesi satırı tarih çakışması | sert, **DB** | CM | B-5 · X-10 |
| `belge_no` global UNIQUE | sert, **DB** | CM | A-14 |
| `BAYI`'nin sahibi olmaz | sert, **DB** (`CHECK`) | CM | **X-17** §(2) |
| Sahip aktif `SATICI` | sert (fonksiyon içi) | 1B madde 3 · ✅ *(CM'de yazıldı; 3b'de kilit altında)* | **X-17** §(2) |
| VKN/TCKN biçimi (10 = VKN, 11 = TCKN) | sert | 1B madde 7 | A-13 |
| En az bir aktif `YONETICI` · kendini pasifleştirme yasağı | sert | 1B madde 4 | E-2 |
| `DZL` geriye tarihlendirilemez | sert | 1B madde 7 | B-7 |
| Negatif stok | **yumuşak** (izli) | 1B madde 1/7 | B-4 |
| Sistemde `DELETE` yok (istisna: belgesiz doktor) | kural | 1B | C-3 |
| Cari telefonu normalize hâliyle UNIQUE | sert, **DB** | CM | X-15 §(2) · §(5) 🟦 |
| Import'ta eksik / tanınmayan kolon → dosya bütünüyle reddedilir | sert | 1B madde 7 | **X-16** §(3) |
| Import'ta kısmi yazma yok · kısmi geri alma yok | sert | 1B madde 7 | **X-16** §(4)/(10) |
| `CARI` import'unu yalnız `YONETICI` çalıştırır (kontrol sunucuda) | sert | 1B madde 7 | **X-16** §(6) |

**Yasak liste** (şemada **olmayacaklar**) → §D.2 anti-şema testi. Kaynak: KARARLAR §4 *"Kısıtlar"*.
Burada kopyalanmaz.

### §B.6 · Tek çağrı noktası fonksiyonları — **12** *(normatif ad — `docs/adr/ADR-001`; 01.10.2026: X-17 ile 11 → 12)*

Bayi için **ayrı fonksiyon yazılmaz** (X-8 §(2)). Liste **12'de kapalıdır** (§1.3; 12. madde X-17 çekirdek eklemesi).

| # | Fonksiyon | Kaynak | Yazıldığı yer |
|---|---|---|---|
| 1 | **sayılan belgeler filtresi** — altı dışlama: `TEKLIF` · `ACILIS` · `KonsinyeCikis` · `VADE_FARKI` · `StokTransfer` · `StokDuzeltme` (+ bedelsiz satırlar) | A-5 · B-7 · K-4 | **1B madde 1 — ilk iş** · ✅ *(14.10.2026)* `sayilanBelgeler` (`src/lib/sayilan-belgeler.ts`) — dört küme: `siparis` (+ `IPTAL`, X-6 §(9)) · `sevkSatiri` · `cariHareket` · `stokHareketi`; raporlar bu filtreyle okur |
| 2 | `hesaplaDoktorBakiye(doktor, tarih?)` | K-2 · C-2 · E-1 | 1B madde 1 · F-02 (madde 8) · ✅ *(14.10.2026)* `src/lib/doctor-cari.ts` — tarih İstanbul günü sonu, `yon` (`BORC`/`ALACAK`/`KAPALI`); tek kaynak `tek-cagri.test.ts` ile korunur |
| 3 | `hesaplaDoktorRisk()` | A-12 | 1B madde 1 · ✅ *(16.10.2026)* `src/lib/doctor-cari.ts` — bakiye + sayılan siparişlerin sevk edilmemiş brüt tutarı; `limitAsildi` (bilgi kademesi). Limit değişikliği logu cari formunun işidir (1B madde 7) |
| 4 | `hesaplaStok(urun, konum?, tarih?)` | B-4 · K-10 · C-2 · `docs/adr/ADR-005` | **ilk sürüm `CM`** — saklı stok kalkar (§D.1 not 3-c) · kilit biçimi ve `NEGATIF_STOK` izi **1B madde 1** · ✅ *(16.10.2026)* `src/lib/stok.ts` — tek yazım yolu `stokHareketiYaz()`; kilit **ürün satırı** (`SELECT … ORDER BY id FOR UPDATE`, ADR-005 açık kalemi), siparişte `uretBelgeNo()`'dan önce (ADR-008); `NEGATIF_STOK` kalemi döner, `OnayBlogu` kaydı #6 |
| 5 | `cozumleBirimFiyat()` | B-5 · B-6 · **X-10** | **ilk sürüm `CM`** (liste seçimi) · tamamı **1B madde 5** (barem, tarih, X-4 `SERT`) — §D.1 not 3 |
| 6 | `acikBlokVarMi()` / `blokKontrolleriniCalistir()` | A-8 | 1B madde 1 · ✅ *(16.10.2026)* `src/lib/onay-blogu.ts` — her kural için son blok belirler (A-8 eki 16.10); gerekçesiz → `ONAY_GEREKLI`, `YONETICI` bloğu aynı işlemde `ONAY`'lar, diğer roller onaya gönderir. **Akışlara bağlanması** (sipariş gerekçe diyaloğu, sevkiyatta `acikBlokVarMi`) X-4 yüzeyiyle **1B madde 4/7**; karar ekranı (*Onay bekleyenler*) **1B madde 7** |
| 7 | `calistirDisaAktarim(kod, parametreler)` | K-4 · D-5 | 1B madde 6 |
| 8 | `hesaplaSatirTutarlari()` | C-6 · X-5 | **ilk sürüm `CM`** — saklı toplamlar kalkar (GÇ-18); lint istisnası da bu fonksiyonu arar · tamamı **1B madde 5** |
| 9 | `uretBelgeNo(onek, tx)` | A-14 | 1B madde 2 · ✅ *(16.10.2026)* `src/lib/belge-no.ts` (ilk sürüm `CM`) — İstanbul yılı ve yıl sıfırlaması testli; sayaç tablosu ve elle kurulmuş numara `tek-cagri.test.ts` ile kapalı |
| 10 | `modulAcikMi(kod)` | K-9 · §1.3 | 1B madde 1 · ✅ *(16.10.2026)* `src/lib/modul.ts` — `policy.modules`'tan okur; başka dosya okumaz. Kongre kodu C2'de söküldüğü için bugün çağıranı yok |
| 11 | `kapsamliDoktorlariGetir(kullanici)` | D-2 · **X-13** §(1) (`SATICI`'ya yalnız kendi `DOKTOR` carileri) | 1B madde 3 · ✅ *(17.10.2026)* `src/lib/doctor.ts` — Prisma `where` parçası döner (süzme sorguda); `YONETICI`/`OPERASYON` hepsini görür. Satıcı ekranlarının altı doktor okuması bağlandı; satıcı rota grubunda elle sahip süzgeci `tek-cagri.test.ts` ile kapalı |
| 12 | `degistirDoktorSahibi(doktorlar, yeniSahip \| null, gerekce, tx)` | **X-17** (01.10.2026) | **ilk sürüm `CM`** (şema değişikliğiyle bugünkü `createDoctor`/`transferDoctor` yazımları buraya taşınır) · tamamı **1B madde 3** · ✅ *(17.10.2026, 3b)* `src/lib/sahiplik.ts` — doktor satırı kilidi (id sırası, ADR-008 başı); iz ve denetim kaydı aynı transaction'da; siparişte `siparisSahibiniKilitle()` → `SAHIP_DEGISTI`; toplu devir ve Sahipsiz süzgeci cari listesinde; pasifleştirmede `portfoyuDevret()`. Sahip alanına başka dosyanın yazması ve sayılı liste dışında `FOR UPDATE` `tek-cagri.test.ts` ile kırmızı. *Rol değişikliği ekranı yok; içe aktarım yolu 1B madde 7* |

**Listeye girmeyen tek çıkışlar** (iş kuralı taşımaz):
- `formatla()` — X-5, `CM`
- `bugun()` · `gunAraligi()` · `takvimYili()` — E-1, `CM` (`format.ts` `timeZone`)
- modül tarafında `hesaplaButceBakiye()` — K-6, Faz 3+

### §B.7 · `policy.ts` anahtarları — **23** *(normatif ad — `docs/adr/ADR-001`; 16.09: X-14 ile 22 → 23)*

İskelet **C7**'de yazılır; değeri belli olmayanlar `null` bırakılır.
*"Belirlenir, açılmaz"*: kullanıcıya ayar ekranı yoktur (GÇ-11).

| # | Anahtar | Değer | Ne zaman dolar | Kaynak |
|---|---|---|---|---|
| 1 | `finance.odemeVadesiGunVarsayilan` | `30` — bugünkü kod değeri *(30.09.2026 kullanıcı teyidi; devreye almada yazılı teyit)* | **C7** | A-7 · KARARLAR §4 config listesi |
| 2 | `finance.vadeFarkiOrani` | `null` | — | A-7 |
| 3 | `finance.vadeFarkiGunSayimBazi` | *yazılı değil* | 1B | A-7 |
| 4 | `finance.kredilimitiBloklar` | `false` | C7 | A-12 |
| 5 | `finance.faturaBilgisiZorunlu` | `false` | C7 | A-13 |
| 6 | `finance.nakitTevsikLimiti` | `null` = kapalı | **devreye alma** | A-15 |
| 7 | `pricing.iskontoTavani` | `null` | C7 | A-10 |
| 8 | `pricing.fiyatGirisiKdvDahil` | `false` — **açılmaz** | C7 | Ü-3 |
| 9 | `pricing.varsayilanFiyatListesiKodu` | seed'in açtığı listenin kodu | **C9** | **X-10** |
| 10 | `tax.varsayilanVergiOraniKodu` | `KDV20` | C7 | C-6 |
| 11 | `kvkk.saklamaSuresiYil` | `10` | C7 | C-3 |
| 12 | `export.sablonTanimi` | entegratör sütun eşlemesi; kodda sabit format yok | **devreye alma** | K-4 §6 |
| 13 | `export.faturaGeriyeDonukUyariGun` | `7` | C7 | K-4 §6-d |
| 14 | `belge.onekleri` | §B.4'teki dokuz önek | C7 | A-14 · B-7 |
| 15 | `notifications.enabled` | `false` | C7 | D-1 |
| 16 | `modules.congress` | `false` | C7 | K-6 |
| 17 | `zaman.saatDilimi` | `Europe/Istanbul` (ofset değil, dilim adı) | **C7 — 1A çıkışı** | E-1 |
| 18 | `auth.oturumHareketsizlikSaat` | `4` (kayar) | **C7 — 1A çıkışı** | E-2 |
| 19 | `auth.oturumMutlakSaat` | `12` (kaymaz) | **C7 — 1A çıkışı** | E-2 |
| 20 | `auth.girisDenemeSiniri` | `5` — eski `LoginAttempt` kodundan *(C7b'de dolduruldu)* | **C7b — 1A çıkışı** | **X-9** |
| 21 | `auth.girisKilitDakika` | `10` — eski `LoginAttempt` kodundan *(C7b'de dolduruldu)* | **C7b — 1A çıkışı** | **X-9** |
| 22 | `import.azamiDosyaBoyutMb` | kesin değer devreye almada | **1B madde 7 (D-6) öncesi** — 1A çıkışında değil | E-3 |
| 23 | `finance.primOraniVarsayilan` | `5.00` — bugünkü `DEFAULT_COMMISSION_RATE`; devreye almada yazılı teyit | **C7 — 1A çıkışı** | **X-14** §(1) |

---

## §C · Açık madde defteri

> **Kural:** Uygulama sırasında çıkan her **karar boşluğu** buraya yazılır ve **KARARLAR'da**
> kapatılır. Mimari *"nasıl"* soruları `docs/adr/`'de kapatılır; sıra soruları §D'de. Plan dosyası
> boşluğu kendisi doldurmaz (`YOL_HARITASI.md` §7.1-A). Harfler **yeniden kullanılmaz**.

| # | Soru | Durum | Kayıt |
|---|---|---|---|
| §C-a | Parasal tip (`BigInt` ↔ `Decimal`) | ✅ 13.09.2026 | KARARLAR **X-5** |
| §C-b | `PaymentAllocation` kalıyor mu | ✅ 13.09.2026 — kalkar | KARARLAR **X-6** |
| §C-c | `PRD_V2.md`'nin akıbeti | ✅ 13.09.2026 — taranır, arşivlenir | KARARLAR **X-7** |
| §C-d | K-1 metnindeki *"tahsilat oranı"* kalıntısı | ✅ 13.09.2026 — redakte edildi | KARARLAR K-1 · X-6 §(10) |
| §C-e | F-11 kabul senaryosunun rakamları geri çekilen mekanizmalara dayanıyor | 🔵 **uygulama kalemi** — karar var (X-7) | 1B madde 9 · `KABUL_KRITERLERI.md`'ye göre yeniden yazılır |
| §C-f | PRD taramasının sırası | ✅ 15.09.2026 — **sıra kısıtı**, §D.0. **Taramanın kendisi iş olarak sürüyor → §E** | §D.1 Şerit A |
| §C-g | E-2 oturum yolu | ✅ 15.09.2026 — yol (b) | `docs/adr/ADR-003` |
| §C-h · §C-i · §C-k | *16.09 yeniden kurulumunda **kayıt bulunamadı***. Hiçbir belge bu harflere atıf yapmıyor; kapanmış ya da başka maddeye katılmış sayılır | ❔ | Eski dosya bulunursa buraya işlenir |
| §C-j | Audit sanitize kapsamı | ✅ 15.09.2026 — **`CM`'in teslim şartı** | §D.0 |
| §C-l | İsimlendirme rejimi | ✅ 15.09.2026 — karma | `docs/adr/ADR-001` |
| §C-m | Migration stratejisi | ✅ 15.09.2026 — fresh init | `docs/adr/ADR-002` |
| §C-n | `OPERASYON` ekran matrisi | ✅ 17.10.2026 — D-2 §(1) + 17.10 eki; `requireStaff()` / `requireAdmin()` ayrımı, matris `src/lib/yetki.test.ts`'te | 1B madde 3c (X-1 ile tek commit) |
| §C-o | Bayi yönetim ekranları ve tabloları (C5 ↔ D-2 §(6) ↔ A-9 ↔ X-2) | ✅ 15.09.2026 | KARARLAR **X-8** |
| §C-p | `LoginAttempt` ↔ E-2 §(8) | ✅ 15.09.2026 | KARARLAR **X-9** · `docs/adr/ADR-004` |
| §C-q | Fiyat listesinin cariye bağlanışı | ✅ 15.09.2026 — cariye atanan liste | KARARLAR **X-10** |
| §C-r | `CariHareket` şemada nedir? | ✅ 16.09.2026 — yeni tablo | KARARLAR **X-11** (§5.14) |
| §C-s | `ImportParti` tablosu sayımda yok | ✅ 16.09.2026 — yeni tablo | KARARLAR **X-12** (§5.15) |
| §C-t | Anti-şema listesinin iki uygulama boşluğu. Ayrıntı aşağıda | ✅ 16.09.2026 — **karar değil, listenin tamamlanması** | §D.2 · `docs/adr/ADR-001` ek |
| §C-u | Satıcı–doktor sahipliği — görünürlük, atama, devir, pasif satıcı, hakedişin aidiyeti *(§E: FR-03…08)* | ✅ 16.09.2026 — izolasyon korunur; D-2 §(3) redakte | KARARLAR **X-13** (§5.16) |
| §C-v | Prim oranının yeri ve dondurulması *(§E: FR-30, FR-31)* | ✅ 16.09.2026 — config + satıcıya özel oran, sevkiyata donar | KARARLAR **X-14** (§5.17) |
| §C-w | Vade tarihi değişikliği · mükerrer cari engeli · cari kartı zorunlu alanları *(§E: FR-22, FR-09, FR-01, FR-39)* | ✅ 16.09.2026 — ikisi de korunur | KARARLAR **X-15** (§5.18) |
| §C-x | `Product.stock` kalır mı? *("nasıl" sorusu)* | ✅ 16.09.2026 — kalkar, stok hareketlerden türer | `docs/adr/ADR-005` |
| §C-y | Cari şablonunun kararlarla bağı yok; fiyat listesi ataması ve import yetkisi yazılı değil *(19.09 incelemesi, bulgu 1 + genişletme)* | ✅ 13.10.2026 — import elle girişin toplu hâli, şablon tek tanımdan | KARARLAR **X-16** (§5.20) · `docs/adr/ADR-006` |
| §C-z | Sahipliğin yazma yolları ve `BAYI` sahipsizliği *(19.09 incelemesi, bulgu 3)* | ✅ 01.10.2026 — tek yazma noktası `degistirDoktorSahibi()` | KARARLAR **X-17** (§5.19) · §D.0 · §D.7-10 |
| §C-aa | Telefon UNIQUE ile A-9'daki çoklu doktor arasında yazılmamış varsayım *(bulgu 2)* | ✅ 13.10.2026 — varsayım yazıldı (🟦, kilit: doktor listesi teslimi) | KARARLAR **X-15 §(5)** |
| §C-bb | Kilit sırası tek belgede değildi; `BelgeSayac` sırada yoktu *(19.09 incelemesi, bulgu 5 — "nasıl" sorusu)* | ✅ 24.09.2026 — tek küresel sıra | `docs/adr/ADR-008` |

> *13.10.2026 — §C-z ve §C-bb satırları sonradan eklendi.* İki harf 19.09 önerisinde ayrılmış ve atıflarda
> kullanılmıştı (§C-z: §D.0 ve §D.7-10; §C-bb: `ADR-008` başlığı ve `docs/adr/README.md` dizini), ama bu
> deftere satır olarak hiç yazılmamıştı — öneri §6'daki defter eklemesi uygulanmadan X-17 (01.10) ve
> ADR-008 (24.09) kapandı. Harfler yeniden kullanılmaz kuralı gereği satırlar tarihçe olarak eklendi.

**§C-r — `CariHareket`** *(✅ X-11 ile kapandı; tarihçe)*

KARARLAR bu varlığı şu yerlerde anıyor:
- `CariHareket.vade_tarihi` (A-7, E-1)
- cari hareket tipleri `ACILIS` / `VADE_FARKI` (A-6, A-7, §4)
- *"tahsilat … cari hareket doğurur"* (X-6 §(3))
- işaretin hareket tipinde taşınması (X-5 §(7))

Buna karşın:
- 13 tabloluk sayımda da 4 belgelik sayımda da yok.
- Bugünkü şemada karşılığı yok. Bugün cari, `Order` ve `DoctorPayment` üzerinden hesaplanıyor.
- `ACL` ve `VDF` belgelerinin şemadaki yeri tanımsız.

**§C-s — `ImportParti`** *(✅ X-12 ile kapandı; tarihçe)*

- D-6: her import **parti numarası** taşır ve **geri alınabilir**.
- E-3 §(4): `ImportParti.dosya_adi` kolonu konur.
- Buna karşın tablo, 13 tabloluk sayımda yok. X-10'daki boşlukla aynı desendir.

**§C-t — anti-şema listesi**

1. KARARLAR §4 kısıtlar listesindeki *"ürün tablosunda liste fiyatı kolonu yok (X-10)"*
   §D.2'ye işlenmemişti.
2. `vatRate` yasağı kolon adıyla yazılmıştı. Oysa bugün `OrderItem.vatRate` da var ve C-6'nın
   **konmasını istediği** `OrderItem.kdv_orani`'nin karşılığıdır.

**§C-x — `Product.stock`** *(✅ ADR-005 ile kapandı; tarihçe)*

**Bugün:**
- Stok miktarı `Product.stock` kolonunda saklı tutuluyor.
- Kolon koşullu `updateMany` ile güncelleniyor; negatife düşüş bu yolla reddediliyor (RULE-01).
- Dashboard toplamı da bu kolondan okunuyor (`_sum.stock`).

**KARARLAR:**
- Bütün stok okumaları tek `hesaplaStok(urun, konum?, tarih?)`'tan geçer; inline `SUM` yasaktır (B-4).
- Konum boyutu zorunludur (A-4).
- Tarihli okuma istenir (C-2).
- Negatif stok yumuşak kısıttır (B-4 → GÇ-17).

**Soru:** Ürün düzeyinde tek bir sayı konum ve tarih sorularını karşılayamaz. Kolon ya bir önbellek
olarak kalır (tutarlılık yükü doğar) ya da kalkar (eşzamanlılık kilidi başka yerde kurulur).
Bu bir *"nasıl"* sorusudur → **ADR-005**, `CM`'den önce.

**Önerilen:** kolon kalkar. Stok yalnız hareketlerden türer. Aynı ürüne eşzamanlı yazım, hareket
yazılırken ürün satırı kilitlenerek sıraya sokulur (A-14 `BelgeSayac` satır kilidi deseni).
Kalkarsa GÇ-17'nin kod tarafı da `CM`'e kayar.

---
## §D · Faz 1 — 1A / 1B ayrımı

> **Faz 1 ikiye bölündü (13.09.2026).** Gerekçe: **1B bugün tahmin edilemez**, çünkü söküm
> sırasında ne çıkacağı bilinmiyor. 1A bittiğinde bilinmeyen büyük ölçüde kapanır ve **o
> noktada verilen tarih tutar**. Anka West'e bugün verilebilecek tek dürüst tarih **1A'nın
> tarihidir**. *Bu faz atlamak değildir — sıra korunuyor (§7-1).*
>
> **Güncelleme 15.09.2026 — commit bazlı sıra.** `MEVCUT_SISTEM_DURUMU.md` (teknik envanter,
> 14.09.2026, HEAD `3825241`) ölçümleri üzerine 1A'nın commit dizisi yazıldı ve dört açık
> madde karara bağlandı: **§C-l** (isimlendirme rejimi) · **§C-m** (migration stratejisi) ·
> **§C-g** (oturum yolu → **(b)**) · **§C-f/§C-j sıralama kısıtı**. Ayrıca iki sıralama
> düzeltmesi yapıldı (madde 4+5 birleşti, GÇ-1'in ekran kuyruğu tanımlandı) ve 1A çıkış
> kriteri **sayıya** bağlandı. *Bu tur kapsam üretmedi, sıra üretti.*
>
> **Güncelleme 15.09.2026 (2. tur) — belge rejimi uyumu.** *Kapsam ve sıra değişmedi.*
> (1) §D.0'daki üç **"nasıl"** kararı **`docs/adr/`'ye taşındı** (ADR-001 · ADR-002 · ADR-003);
> §D.0 artık yalnız plan sonucu ve atıf taşır — `YOL_HARITASI.md` §7.1-A: *plan bir karar
> üretemez*. (2) Şerit A aritmetiği düzeltildi: **22 FR** `TRACEABILITY.md` §6.4'ten gelir,
> RULE'ler hesaba katıldı → **~60 madde**. (3) Şerit B'de *"Ölen test"* kolonu **"Etkilenen
> test"** oldu; C4'ün 32 birim testi §D.2 ile uyumlu olarak **yeniden yazılır** işaretlendi.
> (4) `CM` yeniden adlandırma kuyruğuna eksik **`vatRate`** eklendi; `User.status` notu ad
> rejimine (ADR-001) göre düzeltildi. (5) §D.2'de *"13 kalem ✅"*nin anlamı yazıldı (GÇ-12
> istisnası) ve **anti-şema yasak listesi KARARLAR §4 ile tamamlandı**. (6) §D.4'e iki uygulama
> notu eklendi. (7) **İki yeni açık soru `CM`'i blokluyor** (§D.7): bayi yönetim ekranlarının
> akıbeti ve `LoginAttempt` tablosu.
>
> **Güncelleme 15.09.2026 (3. tur) — KARARLAR X-8 · X-9 işlendi, X-10 açıldı.**
> **X-8:** bayi `Doktor` satırıdır (`hesap_sinifi = BAYI`) → **C5 tam söküm** (panel + yönetim
> ekranları + `dealer-cari.ts` + `dealer-shipment.ts` + bayi okuyan rapor/dashboard parçaları);
> beş `Dealer*` tablosu **`CM`'de** şemadan çıkar; X-2 bütün tahsilatların kabul testine dönüştü.
> **X-9:** `LoginAttempt` kalkar → yeni commit **C7b** (bellek içi sayaç, ADR-004); tablo `CM`'de
> çıkar; geri çekme listesi **13 → 14 kalem** (GÇ-14). **C4'ün 32 birim testi silinir** (teyit)
> → 1A sonu birim hedefi **~52**. `import.azamiDosyaBoyutMb` 1A çıkışından çıkarıldı (KARARLAR
> §6 ile çelişiyordu). **`CM`'i bloklayan tek karar: X-10** (fiyat listesi — §D.7-3).
>
> **Güncelleme 15.09.2026 (4. tur) — KARARLAR X-10 kapandı: cariye atanan fiyat listesi.**
> `FiyatListesi` + `FiyatListesiSatir` ve `Doktor.fiyat_listesi_id` `CM`'e girer; `Product.netListPrice`
> kalkar → **GÇ-15** (geri çekme listesi **15 kalem**). `CM`, `cozumleBirimFiyat()`'ın **ilk
> sürümünü** doğurur (derlenmesi için zorunlu — not 2); fonksiyon 1B madde 5'te tamamlanır.
> `policy.ts` **22 anahtar**. **Faz 1A'nın önünde açık karar kalmadı; `CM` yalnız Şerit A'yı bekler.**
>
> **Güncelleme 16.09.2026 — biçim.** *Kapsam ve sıra değişmedi.* §D.0 altındaki not, yama
> uygulandıktan sonra silinecek dosyayı gösteriyordu; atıf kaldırıldı. §D.7 başlığı kapanmış
> durumu yansıtacak biçimde düzeltildi.
>
> **Güncelleme 16.09.2026 (2) — ana dosyaya taşındı; iki yeni blokaj.** Bu bölüm artık
> `FAZ1_UYGULAMA_KAPSAMI.md`'nin içindedir; `_D` dosyası ve yama kullanılmaz.
> Değişiklikler:
> - **§C-r / §C-s** (KARARLAR **X-11 · X-12**) `CM`'i bloklar (R-9).
> - **C0**'a proje belgelerinin repoya eklenmesi ve `UYGULAMA_PLANI.md`'nin sınıflandırılması eklendi.
> - **`CM`** satırına şemadan çıkan 12 tablo yazıldı.
> - **§D.2** anti-şema listesi tamamlandı (§C-t).
> - Şerit A'nın çıktı tablosu **§E** oldu. `PRD_V2.md`'nin repo kökünde olduğu yazıldı.
> *Sıra değişmedi.*
>
> **Güncelleme 16.09.2026 (4) — X-13…X-15 ve ADR-005 işlendi.**
> - `CM` satırındaki blokaj kalktı. Şema etkileri `CM`'e yazıldı.
> - Not 3-c eklendi: `hesaplaStok()` ilk sürümü.
> - C7 artık **23 anahtar** taşır. GÇ-17 `CM`'e kaydı ve §D.2 istisnası kalktı.
> - R-2 ve R-9 kapandı; **R-10** eklendi. §D.7 kapandı.
> - *Commit sırası değişmedi.*
>
> **Güncelleme 16.09.2026 (3) — X-11/X-12 işlendi, Şerit A tarandı.**
> - `CM` satırı ve §D.2 buna göre güncellendi: 15 tablo, 14 çıkan tablo, 20 GÇ.
> - `CM` yeniden adlandırma kuyruğuna GÇ-18/19/20 eklendi.
> - `CM`, `hesaplaSatirTutarlari()`'nın da ilk sürümünü doğurur (not 3-b).
> - C0'da `UYGULAMA_PLANI.md` arşive gider (X-7 §(1)).
> - **`CM`'i bekletenler: X-13 · X-14 · X-15 · §C-x** (R-9).

> **İzleme kuralı — iki izleyici, tek yazım yeri.**
> **§A** = söküm durumu ve **commit hash'i**. **§D** = sıra ve gerekçe.
> **`docs/adr/`** = mimari *"nasıl"* kararları; §D bir mimari seçimi **yeniden yazmaz, atıf yapar**.
> Commit hash'i **yalnız §A'ya** yazılır, §D'de tekrarlanmaz. *Gerekçe: aynı listenin iki
> yerde yaşaması §7-6'nın uyardığı desendir — biri bayatlar.*

---

### §D.0 · Faz 1A'da kapanan sorular (15.09.2026)

> Kararın metni **ADR'dedir**; bu tablo yalnız **plan sonucunu** taşır.
> *(15.09 2. tur: önceki sürüm kararların tam metnini burada taşıyordu — aynı kararın iki yerde
> yaşaması §7-6'nın uyardığı desendir.)*

| # | Soru | Kayıt | Plan sonucu |
|---|---|---|---|
| **§C-l** | İsimlendirme rejimi | ✅ **`docs/adr/ADR-001`** — karma rejim | KARARLAR §4'teki Türkçe **tablo/kolon** adları kavramsaldır (KARARLAR §4 redaksiyon notu, 15.09). Enum değerleri, belge önekleri, 11 fonksiyon ve `policy.ts` anahtarları **normatiftir**. **Ad eşleme tablosu `CM`'de doldurulur**; anti-şema testi (C8) ondan beslenir |
| **§C-m** | Migration stratejisi | ✅ **`docs/adr/ADR-002`** — fresh init | `20260723175607_init_v2` silinir, tek yeni `init` üretilir. Canlı/pilot veri **yok** (teyit edildi). `README.md:19,76`, `playwright.config.ts:35-37`, `ci.yml:58-59` gözden geçirilir |
| **§C-g** | E-2 oturumu | ✅ **`docs/adr/ADR-003`** — yol (b), opak token | `next-auth` tamamen sökülür; **çerez imzalama ve `AUTH_SECRET` düşer** (`.env.example:10`, `ci.yml:17`). **Şema 1A'da, uygulama 1B'de** (§D.3) |
| **§C-f** | PRD taraması | ✅ **sıra kısıtı** — §D'de kalır | **Migration'dan önce bitmek zorunda.** Tarama yeni şema kalemi doğurabilir; migration tek atıştır |
| **§C-j** | Audit sanitize kapsamı | ✅ **sıra kısıtı** — §D'de kalır | **Migration'ın teslim şartı.** `vkn_tckn` + `fatura_*` seti A-13 ile aynı migration'da geliyor. Bugünkü `SENSITIVE_KEYS` altı anahtar (`audit.ts:102-109`) ve VKN/TCKN içermiyor; sonraya kalırsa **ilk `createAuditLog` çağrısı VKN'yi açık yazar** |
| **§C-o** | Bayi yönetim ekranları ve tabloları | ✅ **KARARLAR X-8** (15.09) | Bayi `Doktor` satırı (`hesap_sinifi = BAYI`). C5 **tam söküm**; beş `Dealer*` tablosu `CM`'de çıkar; 1B'de tek cari ekranı (madde 3 ve 7) |
| **§C-p** | `LoginAttempt` ↔ E-2 §(8) | ✅ **KARARLAR X-9** (15.09) · mekanizma **`docs/adr/ADR-004`** | Yeni commit **C7b**; tablo `CM`'de çıkar; **GÇ-14** |
| **§C-z** | Sahipliğin yazma yolları ve `BAYI` sahipsizliği | ✅ **KARARLAR X-17** (01.10) | Şema kalemleri `CM`'de: `CHECK` · iz olay biçimi · sahip FK `RESTRICT` · iz FK `CASCADE`. Fonksiyonun ilk sürümü `CM`, tamamı 1B madde 3 |
| **§C-q** | Fiyat listesinin cariye bağlanışı | ✅ **KARARLAR X-10** (15.09) — (a) cariye atanan liste | İki yeni tablo + `Doktor.fiyat_listesi_id` `CM`'e girer; `Product.netListPrice` kalkar (**GÇ-15**); `cozumleBirimFiyat()` ilk sürümü `CM`'de |

> **§C defterinde** §C-l · m · g · f · j · **o · p · q** **kapandı** olarak işaretlidir (atıf: bu tablo).

---

### §D.1 · Faz 1A — söküm ve şema

**İki şerit paralel yürür.** Şerit A koda dokunmaz, Şerit B commit dizisidir.
Buluşma noktası **`CM`** (tek migration). `CM`'den önce iki şey kapanmış olmalıdır:
Şerit A ve karar maddeleri — ✅ **ikisi de 16.09'da kapandı** (X-11…X-15, ADR-005).

#### Şerit A — §C-f PRD taraması *(koda dokunmaz)*

71 FR + 15 RULE taranır. **`TRACEABILITY.md` §6.4'te tamamen düşen 22 FR** *(FR-26 kalıcı
düşmez, Faz 2+'ya taşınır)* **ve 5 RULE** (RULE-03 · 07 · 09 · 11 · 14) ayrılır; kalan
**49 FR + 10 RULE = 59 maddenin** KARARLAR'da karşılığı **aranır, varsayılmaz**.
*(15.09 3. tur: X-8 RULE-14'ü tamamen düşürdü — önceki sayım 49 + 11 = 60'tı.)*
*(15.09 düzeltmesi: önceki metin "§A'nın kapsadığı 22 madde, kalan 49" diyordu — 22 sayısı
§A'nın 13 GÇ kaleminden değil §6.4'ten gelir ve RULE'ler hesapta yoktu.)*

⚠️ **Kalan 49 FR'nin 19'u** (FR-14 · 16 · 18 · 25 · 30 · 33 · 37 · 62 · 64, X-8 ile
**FR-39 · 40 · 41 · 42 · 43 · 44 · 45 · 46 · 60** ve X-10 ile **FR-11**) ve **5 RULE** (RULE-01 · 06 · 10 · 12 · 15)
§6.4'te **yeniden tanımlanır / kısmen düşer** durumundadır: eski
metinleri geçerli değildir, karşılık **yeni tanıma göre** aranır. Taramanın en riskli kısmı budur. **FR-11, FR-40, FR-41 ve RULE-06'nın karşılığı X-10'dur**
(15.09 — cariye atanan liste; atanmış listede satır yoksa varsayılana düşülmez).

Karşılığı çıkmayan madde **eksik karardır** ve KARARLAR'a açık madde olarak düşer. Şema kalemi doğuran her madde **`CM`'e girer**.

**Kaynak dosya:** `PRD_V2.md` *(C10'dan beri `docs/arsiv/PRD_V2.md`)* — tarama sırasında **repo kökündeydi** (git'te izleniyor, 498 satır —
`MEVCUT_SISTEM_DURUMU.md` §1.1). Proje bilgisine **repodan** yüklenir ve tarama sohbette yapılır.
Tarama karar boşluğu aradığı için Claude Code'a bırakılmaz.
**Çıktı tablosu, grup sırası ve sonuç kodları: §E.** ✅ *16.09.2026: tarandı ve kapandı — 10 ❌ aynı gün X-13…X-15 ile karşılık buldu → 48 ✅ · 8 ⛔ · 3 🔵.*

> 🔴 **1A'nın en büyük süre bilinmezi bu şerittir.** Koda dokunmadığı için commit dizisiyle
> paralel yürür, ama `CM`'i bloklar. Erken başlatılır.

#### Şerit B — commit dizisi

| # | Commit | İçerik | Etkilenen test | Not |
|---|---|---|---|---|
| **C0** | **Hijyen** | **İlk iş:** `docs/` ve **`docs/adr/`** git'e eklenir *(bugün izlenmiyor — `TRACEABILITY.md` ve `DENETIM_BULGULARI.md` sürüm kontrolü dışında)*. **`docs/adr/`** — *redaksiyon 18.09.2026:* özgün metin ADR dizinini **kök dizine** koyuyordu (atıflar yolsuz yazılmıştı); dizin `docs/` altına alındı ve bütün atıflar `docs/adr/...` biçiminde toplu güncellendi · `docker-compose.yml` portu **5432**'ye hizalanır *(`.env.example:6`, `playwright.config.ts:14`, `ci.yml:15-16` zaten 5432)* · `excalidraw.log` gitignore · `DENETIM_BRIFI_1.md` sınıflandırılır · **proje belgeleri repoya eklenir** *(16.09)*: `KARARLAR.md`, `YOL_HARITASI.md`, `FAZ1_UYGULAMA_KAPSAMI.md`, `DUZELTME_BRIFI.md`, `IS_AKISI_OZETI.md` ve `MEVCUT_SISTEM_DURUMU.md` bugün repoda **yok** (`MEVCUT_SISTEM_DURUMU.md` §1.1). *Redaksiyon 18.09.2026:* özgün metin bu dosyaları **kök dizine** koyuyordu; `PROJE_DURUMU.md` ve `PRD_V2.md` ile birlikte hepsi **`docs/` altında** toplandı · **`UYGULAMA_PLANI.md`** (450 satır) **`docs/arsiv/`'e taşınır** — KARARLAR X-7 §(1) onu zaten arşiv statüsünde sayıyor | — | Kod değişikliği yok. Çıkış: `git status --short` **boş** ve `git ls-files docs` **boş değil** |
| **C1** | **F-00 altyapı** | Üçüncü veritabanı `medikal_itest` (`docker/init-test-db.sql` + `ci.yml` adımı) · vitest **`projects`** ayrımı: `unit` (`src/**/*.test.ts`) + `integration` (`src/**/*.itest.ts`) · `globalSetup` = `migrate deploy` · test başı **TRUNCATE** fixture'ı (`workers: 1`, hız sorun değil) · CI'a adım | — | E2E `medikal_test`'i her koşuda `migrate reset` ediyor (`playwright.config.ts:35`); **paylaşılamaz**. Bugün DB'ye dokunan birim test **0** |
| **C2** | **GÇ-4 + GÇ-5** kongre sökümü | `congress-service.ts` (281 sat.) · `congress-ledger.ts` · `scripts/expire-congress-balances.ts` + `job:expire` · `(admin)/congresses/**` · `(seller)/my-congresses/**` · `doctors/[id]` defter bölümü + `adjustCongressBalance` | **silinir:** birim 27 (`congress-ledger.test.ts`) · e2e 10 (`congress.spec`, `congress-edit.spec`) + `doctor-detail` 3 | **Önce kongre gider** — prim ve tahsilat kodu ona bağlı |
| **C3** | **GÇ-3** mahsup sökümü | `allocation.ts` · `collections/actions.ts` FIFO çağrıları (`:77`, `:170`) · `allocations` ilişki okumaları (8 dosya) · `reports-service.ts:36` | **silinir:** birim 23 (`allocation.test.ts`) · e2e 4 (`collections.spec`) | Yaşlandırma **Faz 2+**; `agingBucket`/`summarizeAging` da gider (X-6) |
| **C4** | **GÇ-1 + GÇ-2 + GÇ-16** prim tabanı, tahsilat oranı, dönem kapatma | `commission-service.ts` prim matrahı · `commissions/actions.ts` `closePeriod` ve durum geçişleri *(GÇ-16 — tablolar `CM`'de)* · `reports-service.ts:36-42` `tahsilatOrani` · `reports.ts` `collectionRate` · **`/commissions` ve `/my-commissions` ekranları** | **silinir:** birim 32 (`commission.test.ts` 21 + `reports.test.ts` 11) · e2e 5 | ⚠️ **Ekranlar da söküm kapsamındadır.** Hakediş tabanı sevkiyata kayıyor (A-3) ve yenisi 1B'de yazılıyor; arada "tabansız prim ekranı" bırakılmaz. *(15.09 3. tur: **silinir** olarak kesinleşti — testler sökülen mekanizmayı sınıyor; 1B'de yeni kurallarla yeniden yazılır. RULE-05 dahil prim kuralları 1A boyunca testsizdir — R-3.)* |
| **C5** | **GÇ-6** bayi sökümü — **tam** *(X-8)* | **Panel:** `(dealer)` route group (5 sayfa) · `dealer-session.ts` · `auth.setup.ts` bayi adımı + `playwright.config.ts` `dealer` projesi · **Yönetim:** `(admin)/dealers/**` + `/dealer-shipments` · `dealer-cari.ts` · `dealer-shipment.ts` · `recordDealerPayment` · **Okuyanlar:** rapor sayfasındaki kanal karşılaştırması (`getChannelReport`) · dashboard'daki kanal ciro ve bayi alacağı kartları · **Seed:** `prisma/seed.ts` bayi kayıtları ve `bayi@` hesabı | **silinir:** e2e 10 (`dealer.spec` 5 + `panel.spec` 4 + setup 1) + kanal raporu/dashboard testleri *(sayı C5'te ölçülür; §D.2 e2e hedefi bu ölçümle kesinleşir)* | Bayi **`Doktor` satırıdır** (X-8); yönetimi 1B'de tek cari ekranından (madde 7). Panel Faz 3+ opsiyonel modül (D-2 §(6)). Tablolar **`CM`'e kadar şemada kalır, okunmaz** — kod söküm burada, şema söküm `CM`'de (C6 `netMinPrice` deseni). **X-2'nin hatası bu commit'te kodla birlikte gider**; ilkesi 1B madde 2'de test edilir |
| **C6** | **GÇ-9 + GÇ-8** KDV toggle ve taban fiyat | `vat-mode.ts` · `VatToggle.tsx` · `reports/page.tsx` toggle · `OrderForm` KDV düğmeleri (`:181-202`) ve `belowMin` kilidi · `products/actions.ts:33-36` sunucu reddi · `my-orders/actions.ts:99-102` | **silinir:** e2e 6 (`pricing.spec` 3 + `reports.spec` 2 + `products.spec` 1) | `netMinPrice`'ın **şema** tarafı `CM`'de. Yerini **taban etiketi zorunluluğu** alır (1B, Ü-3) |
| **C7** | **GÇ-11** config noktaları | `settings.ts` + `SystemSetting` okuma/yazma çağrıları sökülür · **`policy.ts` iskeleti** (§B.7'nin **23** anahtarı *— 15.09: X-9 ile iki, X-10 ile bir · 16.09: X-14 ile bir anahtar eklendi*; doldurulacaklar `null`) · `DEFAULT_COMMISSION_RATE` sabiti `finance.primOraniVarsayilan`'a taşınır (X-14) | — | `SystemSetting`'e yazan çağrı noktası bugün **0** (`setSetting` çağrılmıyor). Ayar ekranı yalnız **tanım tabloları** için anlamlı |
| **C7b** | **GÇ-14** deneme sınırı taşıması *(X-9 — 15.09)* | `LoginAttempt` okuma/yazma çağrıları → **bellek içi sayaç** (`docs/adr/ADR-004`) · deneme olayları container log'una (E-2 §(8)) · bugünkü **anahtar, eşik ve kilit süresi** koddan okunur → `policy.ts` `auth.girisDenemeSiniri` · `auth.girisKilitDakika` doldurulur · sayaç mantığına **birim testi** (sahte saat, E-1) | **eklenir:** sayaç birim testleri · etkilenen mevcut test C7b'de ölçülür | Tablo **`CM`'e kadar şemada kalır, okunmaz**. *Neden `CM`'de değil:* `CM` zaten 1A'nın en büyük commit'i (R-1); davranış değişikliği ayrı commit'te sınanır |
| **CM** | 🔴 **Tek migration + parasal tip** *(1A'nın en büyük commit'i)* | `init_v2` silinir → tek yeni `init` · **§B.1** **15** tablo (oturum tablosu, dışa aktarım kütüğü, *15.09 — X-10* `FiyatListesi`/`FiyatListesiSatir` ve *16.09 — X-11/X-12* `CariHareket`/`ImportParti` dahil) · **§B.2** 4 belge · **§B.3** 40+ kolon · **E-1** `timestamptz`/`date` ayrımı (bugün 41 kolonun tamamı `TIMESTAMP(3)`) · **X-5 `Decimal`** + `money.ts` sarmalayıcısı + `formatla()` + **lint kuralı** + para testlerinin yeniden yazımı · **GÇ-7** enum üç değer ve mekanik yeniden adlandırma · **GÇ-10**, **GÇ-12** şema tarafı · **X-8** beş `Dealer*` tablosu çıkar + `HesapSinifi` enum + `Doktor.hesap_sinifi` (NOT NULL, varsayılansız) · **X-9 / GÇ-14** `LoginAttempt` çıkar · **X-10** `FiyatListesi` + `FiyatListesiSatir` + `Doktor.fiyat_listesi_id` (nullable) · **GÇ-15** `Product.netListPrice` çıkar · **şemadan çıkan 14 tablo** (§A üst notu) · **X-11 `CariHareket` + X-12 `ImportParti`** (tablolar, katalog enum'ları, beş tabloya parti FK) · **GÇ-18/19/20** alan çıkışları · **X-13/X-14/X-15 şema etkileri** (siparişte satıcı nullable · `Kullanici.prim_orani` · sevkiyat satırı + donmuş `prim_orani` · vade izinin cari harekete bağlanması · telefon NOT NULL UNIQUE · klinik/bölge nullable) · **X-17** *(01.10)* `Doktor` `CHECK` (elle SQL, testle doğrulanır) · devir izi olay biçimi · sahip FK `RESTRICT` · `degistirDoktorSahibi()` ilk sürümü · **ADR-005** `Product.stock` çıkar · **§C-j** `SENSITIVE_KEYS` genişletmesi · **TZ=`UTC`** (`docker-compose.yml`, `ci.yml`, `.env.example`) *(04.10 düzeltmesi: önceki metin `Europe/Istanbul` diyordu; E-1 §(2) "container ve veritabanı UTC çalışır" der — plan karara göre düzeltildi, YOL_HARITASI §7.1-D. Dilim adı kodda `zaman.saatDilimi`'dir)* + `format.ts`'e `timeZone` + `stock/page.tsx:5-13` kopya `formatDate` silinir | **yeniden yazılır:** birim 22 (`money.test` 7 + `vat.test` 15) | ⬇️ Aşağıdaki üç not **bağlayıcıdır** · ✅ *16.09: karar engeli yok — C0…C7b'den sonra başlar* |
| **C8** | **Anti-şema testi** | `information_schema`'ya sorgu atan tek test | — | Repoda bugün `$queryRaw` **0**, `information_schema` **0** — kod tabanının ilk ham SQL'i |
| **C9** | **Seed ayrımı** | `db:seed` = **referans veri** (canlıda da çalışır) — **varsayılan fiyat listesi** `pricing.varsayilanFiyatListesiKodu` koduyla bu seed'de açılır *(X-10)* · `db:seed:demo` = yalnız geliştirme | — | Bugün ayrım yok; 353 satır, 21 tablo siler, 61 kayıt basar |
| **C10** | **Belge kapanışı** | `KABUL_KRITERLERI.md` iskeleti (kriter kodları, boş satırlar) · `PRD_V2.md` arşive + atıf yapan dosyaların yönlendirilmesi | — | X-7 §(6). §C-f **bitmiş olmalı** |

---

#### 🔴 `CM` hakkında iki bağlayıcı not

**1. `CM` ile GÇ-13 ayrılamaz — eski §D sırası burada yanlıştı.**
Eski liste madde 4'ü (migration) ve madde 5'i (GÇ-13 parasal tip) ayrı adımlar sayıyordu.
Şema `BigInt` → `Decimal` olduğu anda `bigint` üzerinde işlem yapan **126 ifade / 29 dosya**
derlenmez. Aradaki commit'te `npm run typecheck` **kırmızıdır**. CI yeşil kuralı (§7)
ile bu uzlaşmaz, dolayısıyla ikisi **tek commit'tir**.
*Karşılığında söküm sırası bunu ucuzlatıyor: C2–C6 sonrası bigint yüzeyinin **~%40'ı**
(468 literalin ~190'ı, 126 ifadenin ~38'i) zaten gitmiş olur — GÇ-13'ün en sona bırakılma
gerekçesi ölçüyle doğrulandı.*

**2. `CM` yeniden adlandırma kuyruğu taşır.** Kaldırılan veya adı değişen her alan, **aynı
commit'te** çağrı noktalarında düzeltilmek zorundadır; yoksa derlenmez. Bilinen kuyruk:
`User.status` → aktiflik alanı *(kavramsal `Kullanici.aktif`; şema adı ADR-001 eşleme tablosundan — `auth.ts:30` `status !== "ACTIVE"` kontrolü dahil)* · rol string'leri
**26 geçiş / 20 dosya** (`"ADMIN"` 5, `"SELLER"` 17, `"DEALER"` 4) · `netMinPrice` 15 geçiş · **`vatRate` okuma noktaları** *(GÇ-10 — 15.09'da eklendi, kuyrukta eksikti; sayı `MEVCUT_SISTEM_DURUMU.md`'den alınır)* ·
28 `BigInt` alanın tüm okuma noktaları · `Dealer*` ve `LoginAttempt` tip importları *(C5/C7b'den kalan varsa)* · `Doctor` oluşturan bütün çağrılar **`hesap_sinifi` vermek zorunda** *(varsayılan yok — satıcı akışı `DOKTOR`, seed ve test fixture'ları açıkça)* ·
**`netListPrice` okuma/yazma noktaları** *(GÇ-15 — sayı `MEVCUT_SISTEM_DURUMU.md`'den alınır)* · *16.09:* **saklı toplam alanlarının okuma noktaları** *(GÇ-18 → `hesaplaSatirTutarlari()` ilk sürümü)* · **`Order.dueDate` okuma noktaları** *(GÇ-19 — kaldırılır ya da `CariHareket`'e bağlanır; yöntem `CM` talimatında)* · **`DoctorPayment.invoiceNo`** *(GÇ-20)* · **`CommissionPeriod`/`CommissionAdjustment` tip importları** *(GÇ-16 — C4'ten kalan varsa)*.

**3. `CM` `cozumleBirimFiyat()`'ın ilk sürümünü doğurur** *(15.09 4. tur — X-10)*. `netListPrice`
kalkınca onu okuyan sipariş ve ürün kodu derlenmez; aradaki boşluğa ikinci bir fiyat yolu
**yazılmaz** (tek çağrı noktası kuralı). İlk sürüm yalnız **liste seçimini** yapar: carinin
atanmış listesi, yoksa `pricing.varsayilanFiyatListesiKodu` listesi; satır yoksa **hata döner,
varsayılana düşmez**. Barem (`min_adet`), tarih aralığı ve X-4 `SERT` gösterimi **1B madde 5'te**
tamamlanır. Ürün ekranındaki fiyat alanı geçici olarak **varsayılan listenin satırına** yazar;
liste ekranı ve cari kartında atama 1B madde 7'dedir.

**3-b. `CM` `hesaplaSatirTutarlari()`'nın da ilk sürümünü doğurur** *(16.09 — GÇ-18)*.
Saklı KDV ve toplam alanları kalkınca onları okuyan kod derlenmez. Ayrıca X-5 lint kuralının dosya
istisnası bu fonksiyonu arıyor. İlk sürüm bugünkü `vat.ts` `lineTotals`'ın `Decimal` karşılığıdır;
yeniden yazılan `vat.test` (15 test) bu sürümü sınar. Bedelsiz satır, kısmi sevkiyat ve taban
etiketi **1B madde 5**'te tamamlanır.

**3-c. `CM` `hesaplaStok()`'ın da ilk sürümünü doğurur** *(16.09 — ADR-005, GÇ-17)*.
`Product.stock` kalkınca onu okuyan ve yazan kod derlenmez. Bu kod bugün sipariş, bayi sevkiyatı
(C5'te gider) ve dashboard `_sum.stock`'tur. İlk sürüm hareket toplamıdır ve `konum?` ile `tarih?`
parametrelerini taşır. Koşullu `updateMany` kolonla birlikte gider; bu yüzden negatife düşüş
`CM` → 1B arası **ne engellenir ne izlenir** (R-10). Ürün satırı kilidi ve `NEGATIF_STOK` izi
**1B madde 1**'dedir. Okuma ve yazma noktalarının sayısı `CM` talimatında `MEVCUT_SISTEM_DURUMU.md`'den çıkarılır.

> ⚠️ **GÇ-7'nin sınırı.** 1A yalnız **mekanik** yeniden adlandırma yapar
> (`ADMIN`→`YONETICI`, `SELLER`→`SATICI`, `DEALER` düşer) ve enum'u üç değere sabitler.
> **D-2'nin özü — `OPERASYON`'un ekran matrisi ve guard ayrımı — 1B'dedir** ve orada
> **X-1 ile tek commit** olmak zorundadır (D-2 §(4)). 1A'da `OPERASYON` şemada vardır,
> davranışı yoktur.

> ⚠️ **§C-g'nin 1A/1B sınırı** *(mekanizma: `docs/adr/ADR-003`)*. Oturum tablosu ve `Kullanici.aktif` / `parola_hash` /
> `parola_degistirmeli` kolonları **`CM`'e girer** (şema kalemidir). **Mekanizmanın
> uygulanması 1B'dedir** (§D.3 madde 4). Bunun kabul edilen sonucu: 1A boyunca uygulama
> hâlâ Auth.js JWT ile çalışır, oturum tablosu **boş ve kullanılmaz durur**, `AUTH_SECRET`
> hâlâ gereklidir. *Bu bir borçtur, 1B'nin ilk işlerindendir.*

---

### §D.2 · Faz 1A çıkış kriteri — **sayıya bağlı**

- [x] §A'nın **20 kalemi** *(C10 itibarıyla: 19 ✅ + GÇ-12 `şema ✅ / davranış 1B`; hash'ler §A'da)* *(15.09: GÇ-14/15 · 16.09: GÇ-16…20)* `Durum = ✅`, her birinin commit hash'i §A tablosunda
      *`✅` = eski yapı **kodda ve şemada kalmadı** — yerine gelen davranışın yazılması değildir
      (o 1B'dir). **İstisna GÇ-12:** 1A'da yalnız şema tarafı yapılır; tek parça sevkiyat
      varsayımı kodda A-3 ile (1B madde 7) kalkar → §A'da `Durum = şema ✅ / davranış 1B` yazılır
      ve 1A çıkışı için **yeterli sayılır**. GÇ-7 (`OPERASYON` davranışı) ve GÇ-10 (`VergiOrani`
      ekranı, `hesaplaSatirTutarlari()`) için de yeni davranış 1B'dedir, ama eski yapı `CM`'de
      tamamen gittiği için `✅` yazılır. *GÇ-17 (16.09) ADR-005 ile `CM`'de kapanır;
      yumuşak kısıtın izi 1B'dedir (R-10).*
- [x] **Tek migration** uygulandı; `prisma/migrations` altında **tek klasör** var *(`ee22ca7`)*
- [x] **Anti-şema testi yeşil** *(C8 — `src/lib/anti-sema.itest.ts`; liste ADR-001 ekinden)* — yasak liste **gerçek adlarla**: `tenantId` · `lastLoginAt` ·
      `institutionId` · `discountRate` · `PaymentAllocation` · izlenebilirlik alanları
      (`lotNumber`, `serialNumber`, `gtin`, `expiryDate`) · dosya alanları (`fileUrl`,
      `hasAttachment`) · `OdemeYontemi.hesap_etiketi` karşılığı · `Kurum` tablosu ve
      `Doktor.kurum_id` karşılığı · `Yetki` tablosu karşılığı
      · **15.09.2026'da KARARLAR §4 ile tamamlandı** *(önceki liste yasakların yaklaşık yarısını
      kapsıyordu; `YOL_HARITASI.md` §3 ise yasak listesinin tamamını bu teste bağlamıştı)*:
      `Urun.kdv_orani` karşılığı *(C-6 — aşağıda tablo + kolon çiftiyle)* · karekod ve `Urun.uts_sinifi`
      karşılığı *(K-10, §1.5-b)* · `UrunBarkod` tablosu ve `Urun.barkod` karşılığı *(B-3)* ·
      `dis_referans` / `aktarildi_mi` karşılığı *(K-4)* · `harici_fatura_no` karşılığı *(C-1)* ·
      para birimi kolonu karşılığı *(C-5)* · stok tutar/maliyet kolonu karşılığı *(§4)* ·
      `Tahsilat.hesaba_gecti_mi` karşılığı *(X-1)* · `uyari_gosterildi_mi` karşılığı *(X-4)*
      · **Tablo adıyla (`information_schema.tables`) — 15.09 3. tur:** `Dealer` · `DealerPrice` ·
      `DealerShipment` · `DealerShipmentItem` · `DealerPayment` *(X-8)* · `LoginAttempt` *(X-9)*
      · **Tablo + kolon çiftiyle — 16.09 (§C-t):** `Product.netListPrice` *(X-10 — ürün
      tablosunda liste fiyatı kolonu yok)* · `Product.vatRate` *(C-6)* · `Product.stock` *(ADR-005)*.
      ⚠️ `vatRate` **yalnız `Product`'ta** aranır. `OrderItem`'daki dondurulmuş oran C-6'nın
      **istediği** kolondur (`OrderItem.kdv_orani`); şema adı ADR-001 ekinde `CM`'de seçilir.
      · **Kolon adıyla yakalanamayan — test dışında, yazılı kalır:** bayi `Kullanici`'si
      *(D-2 — gerekirse FK kontrolüyle)*
      · İngilizce karşılıklar **ADR-001 eşleme tablosundan** alınır; *"karşılığı"* diye bırakılan
      hiçbir kalem `CM` bitmeden adsız kalamaz
      ⚠️ Karşılaştırma **`lower(column_name)`** ile yapılır; Prisma `camelCase` kolonları
      tırnaklı üretir ve büyük/küçük harf varyantı listeden kaçar
- [x] **Lint kuralı CI'da yeşil.** *(`ee22ca7` — `eslint.config.mjs`; CI koşusu 37393233606)* Kural **sözdizimseldir**, tip-farkında değil:
      `Decimal * Decimal` TypeScript'te zaten derleme hatası; sessiz float riski
      **`.toNumber()` / `Number()` / `parseFloat`** kaçışından gelir. `no-restricted-syntax`
      + `files` kapsamlı istisna (`hesaplaSatirTutarlari`, `cozumleBirimFiyat`, `formatla`)
      *(Gerekçe: `parserOptions.project` açmak `npm run lint`'in bugünkü **56 sn**'sini
      ikiye katlardı. Bedava kazanç: gitignored `src/generated`'ın **33 dosyası** ESLint
      ignore listesine alınır.)*
- [x] **Test sayısı beyan edilmiş.** *(aşağıda `CM` ölçümü)* "Yeşil CI" tek başına kriter değildir:

  | | Başlangıç | Silinir | Yeniden yazılır | Dokunulmaz | 1A sonu (beklenen) |
  |---|---|---|---|---|---|
  | Birim | 134 | 82 | 22 | 30 | **~52** |
  | E2E | 66 | ~38 | — | ~28 | **~28** |

  *15.09 3. tur: C4'ün 32 testi **silinir** olarak kesinleşti (önceki beyan: silinir 50 · yeniden
  yazılır 54 · 1A sonu ~84). C7b'nin ekleyeceği sayaç testleri bu tabloya **eklenir**, beyan
  C7b'de güncellenir. E2E ~28, C5 ve C7b ölçümleriyle kesinleşir.*

  *C7b ölçümü (01.10.2026) — C2…C7b sonrası fiilî sayılar:* **Birim 76** = 134 − 75 silinen
  (`congress-ledger` 27 · `allocation` 23 · `commission` 21 · `reports` `collectionRate` 3 ·
  `ciroField` 1) + 17 eklenen (`policy` 3 · giriş sayacı 14). Beyandan sapma: `reports.test`'in
  hâlâ kullanılan fonksiyonları sınayan 8 testi **tutuldu** (C4 PR'ı). `CM`'de yeniden yazılacak
  22 test (`money` 7 + `vat` 15) bu sayının içindedir. · **E2E 33** = 66 − 35 silinen + 2 eklenen
  (bayi girişi reddi · ciro KDV hariç); C3'te `collections.spec`'in FR-29/FR-25 testleri tutuldu.
  · **Entegrasyon 21** — beyanda yoktu, C1 ile geldi.

  *`CM` ölçümü (04.10.2026):* **Birim 81** — silinen: `money.test` · `vat.test` · `reports.test`
  (fonksiyonları kalktı; yerine `hesaplaSatirTutarlari()`) · yeniden yazılan/eklenen:
  `satir-tutarlari.test` 16 (`vat.test`'in Decimal karşılığı + bedelsiz, karma oran, ağırlıklı
  iskonto, komisyon) · `money.test` 8 (`formatla`, `paraOku`) · `zaman.test` 6 · `validation.test` 4.
  · **Entegrasyon 46** — `rate-limit.itest` silindi (sınadığı `LoginAttempt` tablosu şemadan
  çıktı; yokluğu C8'in konusu) · `collections` 13 · `orders` 11 (tek fiyat yolu, belge no,
  negatif stok) · **yeni** `sahiplik` 9 (X-17 + `CHECK` + FK) · `kisitlar` 8 (`EXCLUDE`, belge no
  eşzamanlılığı, `hesaplaStok` konum/tarih) · `reports-service` 3 · `db` 2. Kongre/mahsup/prim
  dönemi tablolarına "yazmaz" testleri tablolarla birlikte gitti. · **E2E** — 6 spec yeni şemaya
  uyarlandı; `collections.spec` FR-25 ve iki bakiye/ciro tutarı doğrulaması **1B'ye taşındı** (R-11).
  **E2E 32** — `main` CI koşusu 37393233606: 32 geçti, 0 başarısız (33 − FR-25).

  ⚠️ **Dokunulmadan kalan 30 birim testi** (`doctor`, `pagination`, `phone`, `audit`)
  sistemin kanıtı değildir. 1A çıkışında bu fark **yazılı olarak** kabul edilir; kapanması
  1B'nin işidir.
- [x] Silinen her testin **gerekçesi commit mesajında** *(C2…C7b ve `ee22ca7`)*
- [x] `PRD_V2.md` arşivde *(C10 — `docs/arsiv/PRD_V2.md`; §C-f taraması ✅ 16.09 kapandı — §E; doğan kararlar X-13…X-15 ✅)*
- [x] `policy.ts` var; doldurulması gerekenler dolduruldu (`zaman.saatDilimi`,
      `auth.oturumHareketsizlikSaat`, `auth.oturumMutlakSaat`, **`auth.girisDenemeSiniri`,
      `auth.girisKilitDakika`**, **`pricing.varsayilanFiyatListesiKodu`**, **`finance.primOraniVarsayilan`** *(X-14)*) ve seed varsayılan
      listeyi **aynı kodla** açıyor *(C9 — `prisma/referans.ts`, `referans-seed.itest`; `varsayilanFiyatListesiKodu` CM'de doldu)*
      *15.09: `import.azamiDosyaBoyutMb` bu listeden **çıkarıldı** — KARARLAR §6 değerini
      **devreye almaya** bağlıyor ve 1A'da import kodu yok. Değer **1B madde 7'den (D-6) önce**
      gerekir.*
- [x] **X-11 · X-12'nin şeması `CM`'de** *(`ee22ca7`)* (`CariHareket`, `ImportParti`, katalog enum'ları, parti FK'ları)
- [x] **X-13 · X-14 · X-15'in şema etkileri `CM`'de** *(`ee22ca7`)* · **ADR-005 uygulandı** (`Product.stock` yok, `hesaplaStok()` ilk sürümü testli) *(kararlar ✅ 16.09)*
- [x] **X-10'un şeması `CM`'de** *(`ee22ca7`; `orders.itest` tek fiyat yolu)* (iki tablo + FK) ve `cozumleBirimFiyat()` ilk sürümü sipariş akışında tek fiyat yolu *(karar 15.09'da kapandı)*
- [x] **`CM` sonrası `TZ=UTC` üç dosyada tanımlı** *(04.10: E-1 §(2))* ve `format.ts` `timeZone` taşıyor

---

### §D.3 · Faz 1B — yeniden inşa *(sıra korunuyor)*

1. **Tek çağrı noktası fonksiyonları** — **sayılan belgeler filtresi önce** *(altı dışlama)* · ✅ *(16.10.2026 — §B.6 #1 · #2 · #3 · #4 · #6 · #10; PR #19–#23 + #10)*
2. ✅ *(16.10.2026 — A-14-1…5, X-2-1)* **A-14 `uretBelgeNo()` + `BelgeSayac`** → ardından **X-2 blocker** *(sırası zorunlu. X-2 artık kod düzeltmesi değil **bütün tahsilat yollarının** — `BAYI` dahil — kabul testidir: ödeme kaydı ve `uretBelgeNo()` aynı transaction'da; KARARLAR X-8 §(7))*
3. **X-1 + D-2 tek commit** *(D-2 §(4): ayrı yapılırsa ikincisi birincisini bozar)* — *(17.10.2026: üç PR'a bölündü — **3a** #11 kapsam ✅ · **3b** #12 `degistirDoktorSahibi` tamamı (X-17) ✅ · **3c** X-1 + D-2 `getSellerReports` ve `OPERASYON` ekran matrisi, tek commit ✅ *(17.10.2026 — dönem zorunlu, hakediş `hesaplaSatirTutarlari()`'nda (X-5 §(4)), tahsilat tahsilat anındaki sahibe (X-1 eki); `OPERASYON` girişi açıldı, ana sayfası Dashboard; satıcı ekranı `/my-report`; yönetici cari/`BAYI` açma ekranı 1B-7)*. KARARLAR'ın tek commit hükmü yalnız `getSellerReports`'u bağlar; matrisin açık dört noktası KARARLAR D-2 eki 17.10)* —
   **`OPERASYON` ekran matrisi burada doğar** (§C-n) · **`BAYI` açma yetkisi de bu matriste yazılır** (X-8 §(5)); `SATICI` `BAYI` göremez ve açamaz (X-8 §(3))
4. ✅ *(20.10.2026 — PR #29–#35; 4a–4g)* **E-2 kimlik katmanı — Yol (b)** *(`docs/adr/ADR-003`)* → **X-3/X-4 hata yüzeyi** → **Ü-3 taban etiketi** →
   **A-15** → **X-6 §(6) vade uyarısı**
5. ✅ *(20.10.2026 — B-5-1, B-6-1, C-6-1, X-5-1, X-10-1)* **C-6 `hesaplaSatirTutarlari()`** + **B-5/B-6 `cozumleBirimFiyat()`** *(X-5 ham aritmetiğin iki adresi · `CM`'deki ilk sürüm burada tamamlanır: barem, tarih, X-4 `SERT` — X-10 §(3))*
6. ✅ *(20.10.2026 — D-5-1, D-5-2, K-4-1)* **D-5 dışa aktarım + kütük**, **K-4 §(6) fatura hazırlık veri seti**
7. **B-7 stok düzeltme**, **A-1…A-13 belge akışları** *(bayi dahil — X-8 §(4))*, **tek cari ekranı** *(`hesap_sinifi` süzgeci — X-8 §(5); **fiyat listesi ataması** — X-10 §(2)/(6), yalnız `YONETICI`)*, **fiyat listesi ekranı** *(başlık + satır; tarih ekranı Faz 2 — X-10 §(7))*, **D-6 import** *(`hesap_sinifi` zorunlu kolon; **ön koşul:** `import.azamiDosyaBoyutMb` değeri)* — **X-16 / ADR-006 sırası** *(13.10)*: cari girdi şeması (tek cari ekranı) → `CARI` tanımı → şablon üretici ve geliştirici komutu → önizleme özeti · küme kuralı bildirimleri ve üç koruma testi (`information_schema`, C8 deseni) · kabul kriteri taslakları `docs/arsiv/KARAR_ONERISI_2026-09-19.md` §10'dadır, testten önce `KABUL_KRITERLERI.md`'ye yazılır
8. **F-02 (küçültülmüş)**, **F-03**, **F-05 + K-6 temizliği**, **F-06**, **F-07**, **F-10**, **F-12**
9. **F-11 kabul senaryosu** — `KABUL_KRITERLERI.md`'ye göre **yeniden yazılmış** hâliyle *(§C-e)*
10. **`TRACEABILITY.md` yeniden kurulur** — kod × test × **karar** *(X-7 §(5))*

**1B çıkış kriteri:** `YOL_HARITASI.md` §3 Faz 1 çıkış listesi.

> **Düşen görevler:** F-01 *(işi sayılan belgeler filtresine devredildi — X-6 §(9))* ·
> **F-04** *(mekanizma kalktı)* · **F-08** *(expiry silindi — K-6)* · **F-09** *(lot kalktı — K-6)*.

---

### §D.4 · Madde 4 — E-2 uygulama notları *(1B'ye taşınan tasarım detayları)*

Bunlar **karar değil**, Yol (b)'nin doğurduğu uygulama kalemleridir; 1B madde 4'te çözülür:

> **19.10.2026 — madde 4a:** 1, 2, 5, 6, 7 çözüldü (kriterler E-2-1…4). (1) eşik 5 dakika — `oturum.ts`
> `SON_GORULME_ESIGI_MS` · (2) `csrf.spec.ts` — yabancı Origin'li server action reddedilir · (5) `e2e/admin/session-revocation.spec.ts`
> (seller'daki eski spec silindi) · (6) **iptal işareti** — `Session.revokedAt`, satır silinmez (C-3) · (7) `HttpOnly` +
> `SameSite=Lax`, `Secure` yalnız `NODE_ENV=production`. **3 ve 4 madde 4b'de** (kullanıcı yönetimiyle birlikte).
>
> **20.10.2026 — madde 4b:** 3 ve 4 çözüldü (kriterler E-2-5…9; değerler KARARLAR E-2 20.10 eki). (3) `requireSession()`
> geçici parolalı kullanıcıyı `/parola-degistir`'e yönlendirir — bütün guard'lar oradan geçtiği için sayfalar ve server
> action'lar birlikte kapanır; sayfa yalnız bayraklı kullanıcıya açıktır · (4) `kullanici.ts` — `YONETICI` pasifleştiren
> transaction `SERIALIZABLE` koşar (eşzamanlı iki pasifleştirmede write skew'i PostgreSQL reddeder); satır kilidi
> kullanılmadı, çünkü yeni kilit kaynağı ADR-008'in yerine yenisini gerektirirdi. `kullanici.itest.ts` iki bağlantılı testi
> `SERIALIZABLE` olmadan kırmızıdır (20.10.2026 doğrulandı).

1. **`lastSeenAt` yazma sıklığı.** Her istekte yazılırsa her sayfa gezinmesi bir DB write
   demektir. **Eşikli güncelleme** (ör. kayıt 5 dakikadan eskiyse yaz).
   *Not: `requireSession()` bugün de 1 sorgu atıyor (`session.ts:20-23`, `cache()` sarmalı);
   oturum tablosuna geçişte yine 1 sorgu — performans regresyonu yok.*
2. **CSRF yüzeyi.** `/api/auth/[...nextauth]` silinince uygulamada **hiç route handler
   kalmaz**; her yazma server action'dır ve Next server action'larda Origin/Host kontrolü
   yapar. Bu **varsayım olarak değil**, 16.2.10'da doğrulanmış ve **bir regresyon testiyle
   sabitlenmiş** bir madde olarak yazılır. *(`next.config.ts` boş — `allowedOrigins` riski yok.)*
3. **`parola_degistirmeli` akışı tanımsız.** Kolon §B.3'te var; **ekran ve guard davranışı
   hiçbir yerde yazılı değil**. 1B'de tanımlanır.
4. **"En az bir aktif `YONETICI`" kısıtı** (E-2) bu turda uygulanır.
5. `session-revocation.spec.ts` yeniden yazılır — bugün JWT + `status` kontrolünü sınıyor.
6. **Oturum sonlandırma yöntemi** *(15.09 eklendi)*. Pasifleştirme açık oturumları anında
   sonlandırır (E-2 §(6)); bunun satır **silinerek** mi **iptal işaretiyle** mi yapılacağı,
   C-3 `DELETE` yasağının oturum tablosunu kapsayıp kapsamadığına göre belirlenir.
7. **Çerez bayrakları yazılı değil** *(15.09 eklendi)*. `HttpOnly` · `Secure` · `SameSite`
   değerleri 1B'de belirlenir; `Secure` bayrağı canlıda TLS'e (`YOL_HARITASI.md` G-3) bağlıdır.

**Madde 4c — X-3 hata yüzeyi (20.10.2026, kriterler X-3-1…3).** Uygulama notları (karar değil):

- **Referans = Next `digest`.** Sunucu hatasında ekrana giden tek tanımlayıcıdır; `instrumentation.ts`
  `onRequestError` aynı değeri log satırına yazar. Hata başına bir hash'tir — aynı hata tekrarlanırsa aynı
  referans döner; tekrarlar log satırının zamanıyla ayrışır. Tarayıcıda doğan hatanın referansı yoktur (`—`).
- **Canlıda iki ham döküm kapatıldı:** Next sunucu hatasını mesajı ve Prisma `meta`'sıyla `console.error`'a basar
  (kapatan ayar yok) → `register()` canlıda `Error` argümanlarını sınıf + stack çerçevesine indirir; Prisma
  istemcisinin `error` logu canlıda kapalı (`db.ts`). `next start` ile elle doğrulandı. Geliştirmede iki döküm açıktır.
- **Denetim kaydı işle aynı transaction'da** (X-3 §(4)): `createAuditLog(input, db)` — `db` zorunlu, hata yutulmaz.
  Giriş/çıkışta oturum satırı ve denetim kaydı tek transaction'dır; tek yazımlık giriş denemesi `prisma` alır.
- **Action `catch`'leri daraltıldı:** yalnız `IsHatasi` / benzersizlik ihlali (P2002) / `SyntaxError` (bozuk form
  girdisi) mesaja döner; gerisi yeniden fırlar. Statik koruma: `hata-yuzeyi.test.ts`.
- X-4 dönüş sözleşmesi (`{ durum, kademe, kural_kodu, parametreler }`) **madde 4d**'dedir.

**Madde 4d — X-4 dönüş sözleşmesi (20.10.2026, kriterler §0.3-1, X-4-1…4).** Uygulama notları (karar değil):

- **Biçim:** `IslemSonucu = { durum, kademe, bildirimler[], parametreler? }`; her bildirim `{ kademe, kural_kodu,
  parametreler, alan? }`. X-4 §(1)'in dört alanı bildirimdedir; liste §(7)'nin (yutma yasağı) gereğidir, üst
  düzey `kademe` bildirimlerin en yükseğidir. `parametreler?` yalnız başarı metninin sayısı içindir (devir adedi).
- **Katalog ve sözlük:** `src/lib/sonuc.ts` `KURAL_KODLARI` (kodda kapalı) · `src/lib/sozluk.ts` `KURAL_METNI`
  (`Record<KuralKodu, …>` — eksik metin typecheck'te düşer). KARARLAR'da adı geçen kodlar aynen kullanıldı
  (`TELEFON_KAYITLI`, `URUN_KODU_KAYITLI`, `SAHIP_*`, `BAYI_SAHIP_ATANAMAZ`, `NEGATIF_STOK`); diğerleri bu
  turda form/akış hatalarından türetildi. `BlokKuralKodu` ve `HesapKurali` katalogun alt kümesidir.
- **Metin üreten yardımcılar koda döndü:** `parolaHatasi()` bildirim, `canSellerOrderForDoctor()` kural kodu
  döner; `HESAP_KURALI_MESAJI`, doktor devrinin `KURAL_MESAJI` ve giriş kilidi metni sözlüğe taşındı.
- **Gösterim tek bileşende** (`src/components/Sonuc.tsx`): `SonucGosterimi` + `IslemFormu` (alansız düğme
  işlemleri: durum geçişi, sevk, ürün silme). `Field`/`SelectField`/`TextArea` `sonuc` alır ve kendi alanının
  `SERT` bildirimini altında gösterir; form, altında gösterdiği alanları `alanlar` ile bildirir — listede
  olmayan alanın bildirimi kutuya düşer, atılmaz. `FormError` ve `?error=` sorgu deseni kalktı.
- **Davranış değişiklikleri:** sipariş kalem hataları birlikte döner (önce ilkinde duruyordu) · sipariş durum
  geçişinde (hazırlık, teslim, sevk) durum arada değiştiyse işlem sessizce geçmez, `SIPARIS_DURUMU_UYGUN_DEGIL`
  döner · ürün ve doktor formlarında bütün alan hataları birlikte döner.
- **Bağlanmayanlar:** `YUMUSAK` diyaloğu ve `BILGI` şeridi bileşende hazırdır, üreticileri henüz yoktur — `BILGI`
  ilk kez **A-15** (bu maddenin devamı) ile, `YUMUSAK` sipariş akışında `NEGATIF_STOK` gerekçe diyaloğu olarak
  **1B madde 7**'de (sevkiyatta `acikBlokVarMi` ve onay bekleyenler ekranıyla birlikte) e2e'ye girer. Bugün
  yönlendiren action'lar (`redirect`) `BILGI` taşıyamaz; `BILGI` üreten action sayfada kalmalıdır.

**Madde 4e — Ü-3 taban etiketi (20.10.2026, kriter Ü-3-1).** Uygulama notları (karar değil):

- **Tek gösterim:** `src/components/Tutar.tsx` — `taban` zorunlu prop; tabloda etiket başlıktadır (`baslikta`,
  başlık `tabanli()` ile). Etiket metni tek kaynak `src/lib/taban.ts` (`TABAN_ETIKETI`, `BRUT`, `MATRAH`,
  `SATIR_TABANI`). Ekranda `formatla()` artık yalnız `"ham"`/`"oran"` içindir; para gösterimi `Tutar`'dan geçer.
- **Kapanan eksikler:** cari detay (borç, alacak, bakiye, sipariş ve tahsilat tabloları), tahsilat listesi,
  sipariş listeleri ve sevk ekranı toplamları, dashboard tahsilat kartı, hakediş kolonu etiketsizdi. Sipariş
  belgesinde "Birim Fiyat (net)"/"Net Tutar" etiketleri tabana çevrildi; "Genel Toplam" artık *KDV dahil* yazar.
- **KDV tutarı** taban değildir; kolon/satır adı "KDV"dir (`SATIR_TABANI.kdvTutar`).
- `StatCard.value` `ReactNode` oldu (kartta tutar + etiket).

**Madde 4f — A-15 nakit tevsik uyarısı (20.10.2026, kriter A-15-1).** Uygulama notları (karar değil):

- `src/lib/tevsik.ts` `nakitTevsikUyarisi(tx, { doctorId, an, yon }, limit?)` — tahsilat yazıldıktan sonra aynı
  transaction'da çağrılır; toplama SQL'dedir (`aggregate`), sonuç saklanmaz. İlk `BILGI` üreticisidir: tahsilat
  sayfada kalır, şerit başarı metniyle birlikte görünür.
- **Sayılan:** aynı cari, aynı İstanbul günü (`paidAt`), `tip = NAKIT`, aynı yön (§(4) — netleştirilmez), **iptal
  edilmemiş** tahsilat. İptal edilen tahsilat gerçekleşmemiş sayılır. "Aşar" = toplam > limit.
- `finance.nakitTevsikLimiti` tipi `string | null` oldu (TL, brüt); değer hâlâ `null` — devreye almada müşavir
  teyidiyle dolar. Bu yüzden canlı/e2e ortamında uyarı kapalıdır; davranış entegrasyon testinde limit verilerek,
  şerit deseni bileşen testinde (`sonuc.test.ts`) sınanır.

**Madde 4g — X-6 §(6) vade uyarısı (20.10.2026, kriter X-6-1; koşul KARARLAR X-6 20.10 eki).** Uygulama notları:

- `src/lib/doctor-cari.ts` `vadesiGecmisUyarisi(doktor, gun?, db?)` — bakiye yönü `BORC` değilse `null`; değilse
  vadesi `gun`den önce, ters kayıtla çevrilmemiş en eski `BORC` hareketinin vadesi. Toplam almaz (K-2-4 korunur).
- Gösterildiği yer: doktor detayı (sayfa açılışında şerit) ve tahsilat sonucu (`recordCollection` A-15 uyarısıyla
  birlikte döner). FR-28'in "yeni siparişte uyarı" kısmı bağlanmadı: sipariş girişi başarıda yönlendirir ve
  `BILGI` taşıyamaz (4d notu) — sipariş belge akışı 1B-7'de yeniden kurulurken bakılır.
- Cari hareketin borç tarafını yazan akış (sevkiyat borcu) 1B madde 7'dedir; o güne kadar uyarı pratikte görünmez.

**Madde 5 — fiyat ve satır hesabı tamamı (20.10.2026, kriterler B-5-1, B-6-1, C-6-1, X-5-1, X-10-1).** Notlar (karar değil):

- `cozumleBirimFiyat(urun, doktor, { miktar, gun })`: liste seçimi → o günde geçerli (`[başlangıç, bitiş)`) ve
  `min_adet <= miktar` satırların en yüksek `min_adet`'lisi. Sipariş satırın miktarını ve siparişin İstanbul gününü
  (`bugun()`) verir; ürün ekranları 1 adet + bugün. Bedelsiz satır bugün sipariş formunda yok (A-2 1B-7); geldiğinde
  barem miktarına sayılmaz (B-6) — fiyat çağrısına girmez.
- `hesaplaSatirTutarlari()` CM sürümü bedelsiz satırı ve kısmi sevkiyatı zaten karşılıyordu (kısmi sevkiyat = sevk
  edilen miktarla çağrı); bu turda yalnız kısmi sevkiyat yuvarlama testi eklendi. Taban etiketi 4e'de
  (`SATIR_TABANI`). `hesaplaKomisyonTutari()`'nın yeri hâlâ 1B-7 (A-11) açık noktasıdır.
- **Bilinen sınır:** sipariş formunun önizlemesi varsayılan listenin 1 adetlik fiyatını gösterir; carinin atanmış
  listesi ve barem sunucuda uygulanır, kayıtta donan değer doğrudur. Önizlemenin cari/bareme göre çözülmesi liste
  ekranı ve cari ataması ile (1B-7) gelir — bugün barem ve atanmış liste verisi yalnız import/ekranla girebilir.

**Madde 6a — D-5 dışa aktarım + kütük (20.10.2026, kriterler D-5-1, D-5-2).** Notlar (karar değil):

- `src/lib/disa-aktarim.ts` `calistirDisaAktarim(parametre)` (tek çağrı #7) · `disa-aktarim-yazici.ts` (XLSX/CSV) ·
  `/exports` ekranı + `disaAktar` action (yalnız `YONETICI`). **Route handler açılmadı** (E-2 4a notu): dosya server
  action yanıtında base64 gelir, tarayıcıda indirilir — Origin denetimi korunur, dosya sunucuda kalmaz.
- **XLSX yazıcı bağımlılıksızdır:** sıkıştırmasız ZIP + satır içi metin hücreleri (`node:zlib` `crc32`). Stil yok;
  sayı kolonları sayı hücresidir. CSV: UTF-8 BOM, `;` ayraç, ondalık `.`. Formülle başlayan metin CSV'de `'` önekli,
  XLSX'te zaten metindir (formül enjeksiyonu).
- **Cari hareket veri seti bütün hareket tiplerini verir** (açılış, vade farkı dahil — tip kolonuyla). K-4 §(2)'nin
  "sayılan belgeler filtresi zorunlu" hükmü satış sayılan kümeler içindir; C-2 §(2) cari mutabakatı açılışı ister
  ve bakiye de filtresizdir (K-2, X-11 §(6)). Sipariş veri seti filtreden geçer.
- Tahsilat veri seti iptal edilen tahsilatı `Durum` kolonuyla verir. Stok veri setinde B-7 düzeltme işareti
  `StokDuzeltme` akışıyla (1B-7) eklenir. Sevkiyat `harici_irsaliye_no` kolonu sevkiyat veri setine aittir; Faz 1
  kataloğunda ayrı sevkiyat veri seti yoktur — fatura hazırlık (6b) sevkiyattan okur.

**Madde 6b — K-4 §(6) fatura hazırlık (20.10.2026, kriter K-4-1).** Notlar (karar değil):

- `FATURA_KOLONLARI` kodda kapalı kolon kataloğudur; `export.sablonTanimi` biçimi `{ sutunlar: { baslik, kaynak }[] }`
  — entegratör şablonunun başlıkları ve sırası, kaynak bu katalogdan. Değer devreye almada girilir (🟦 K-4 entegratör
  tespiti); `null` iken fatura hazırlık dosyası `FATURA_SABLONU_TANIMSIZ` ile reddedilir. Bu yüzden e2e'de dosya
  inmez; davranış entegrasyon testinde şablon verilerek sınanır.
- Sevkiyat satırını yazan akış 1B-7'dedir (A-3); o güne kadar veri seti boş döner.
- A-13 eksik fatura kimliği uyarısı (`BILGI`) bu veri setine bağlanmadı — A-13 akışıyla (1B-7) gelir.
- K-7 §(4) yazılı teyidi ilk çıktıdan önce alınır — süreçtir, kod kontrol etmez (D-5 §(8)).

**Madde 7 — bölünme (20.10.2026).** Madde tek PR için çok büyük; sıra veri akışına göredir (önce borç ve stoğu
doğuran akış, sonra onu tüketenler): **7a** A-3 sevkiyat (borç, stok, prim sevkiyatta) · **7b** A-11 tahsilat
cari hareketi + K-1 iptal ters kaydı + komisyonun yeri · **7c** A-8 onay akışı (sipariş/sevkiyatta `NEGATIF_STOK`
gerekçe diyaloğu, sevkiyatta `acikBlokVarMi`, onay bekleyenler ekranı) · **7d** A-1 iade, A-2 bedelsiz, A-4
konsinye, B-4 transfer, B-7 stok düzeltme · **7e** tek cari ekranı (X-8, A-13, A-6 açılış, A-7 vade farkı, X-10
liste ataması) + fiyat listesi ekranı · **7f** D-6 import (X-16 / ADR-006 sırası).

**Madde 7a — A-3 sevkiyat (20.10.2026, kriterler A-3-1, A-7-1, X-14-2).** Notlar (karar değil):

- `src/lib/sevkiyat.ts` `sevkiyatYaz(tx, girdi)`: ürün kilidi → durum ve kalan kilit altında → `SVK` → satırlar
  (prim oranı donar) → stok çıkışı (`shipmentId`) → `SEVKIYAT` · `BORC` (vade = sevk günü + `paymentTermDays`).
  Demo seed sevk edilmiş siparişleri de bu yoldan kurar.
- **Kilit:** yeni kilit kaynağı açılmadı (ADR-008 geçerlilik sınırı). Sevkiyat ve iptal aynı siparişin ürün
  satırlarını kilitler; durum, kalan ve "sevkiyat var mı" kilit altında okunur. İki bağlantılı iki test:
  eşzamanlı iki sevkiyat, sevkiyat × iptal (kilitsiz iptal kırmızı — 20.10 doğrulandı).
- **Sipariş artık stok düşürmez** ve ürün kilidi almaz (doktor → sayaç). `StockMovement.orderId` eski kayıtlar
  içindir; iptal, eski akışta sipariş anında yazılmış çıkışı iade girişiyle geri alır.
- Negatif stok sevkiyatta da engellenmez; `NEGATIF_STOK` kalemleri `OnayBlogu`'na 7c'de bağlanır.

**Madde 7b — tahsilat cari hareketi ve ters kayıt (20.10.2026, kriterler A-11-1, X-11-1).** Notlar (karar değil):

- `src/lib/cari-hareket.ts`: `sevkiyatHareketiYaz` · `tahsilatHareketiYaz` · `tersKayitYaz` — cari hareketin tek yazım
  yolu (`tek-cagri.test.ts`). Tahsilat iptali koşullu işaretlenir (`AKTIF` → `IPTAL`) ve hareketi ters kayıtla çevirir.
- 1B-7b öncesi kaydedilmiş tahsilatların cari hareketi yoktur; iptalde çevrilecek satır yoksa ters kayıt yazılmaz.
  Canlıda böyle kayıt olmayacak (geçiş import'la, 7f); demo seed artık hareket yazar.
- **`hesaplaKomisyonTutari()` `satir-tutarlari.ts`'te kalır** (CM'den açık nokta): X-5 §(4)'ün iki dosyalık aritmetik
  sınırı içindedir ve yuvarlama modu tek noktada tanımlıdır.
- K-1 sipariş iptalinin ters kaydı: sevk edilmiş sipariş iptal edilemediği (7a) ve borç yalnız sevkiyatta doğduğu
  için sipariş iptalinde çevrilecek cari hareket yoktur; sevk edilen borcun düzeltmesi iadedir (A-1, 7d).

**Madde 7c — A-8 onay akışı, negatif stok (20.10.2026, kriterler A-8-7 … A-8-10; KARARLAR A-8 eki 20.10).** Notlar (karar değil):

- `sevkiyatYaz()` negatif stoğu **hiçbir şey yazmadan önce** `negatifStokOnizle()` ile (ürün kilidi altında) hesaplar;
  `stokHareketiYaz()` aynı hesabı kullanır. Siparişin son `NEGATIF_STOK` bloğu `sonBlokDurumu()` ile kilit altında
  okunur — `acikBlokVarMi()` bütün kurallara bakar, sevkiyat ise "ihlal şu an sürüyor mu"ya göre davranır (RED +
  yeterli stok → geçer). Onaya gönderilen sevkiyatta transaction yalnız bloğu yazar; sevkiyat sonucu birleşik tiptir
  (`SEVK_EDILDI` | `ONAYA_GONDERILDI`).
- `/approvals` "Onay Bekleyenler" yalnız `YONETICI` (menü + `requireAdmin`); karar `blokKarariVer()` koşullu
  `updateMany`. `OPERASYON` bekleyen siparişi Kargo ekranında "Onay bekliyor" etiketiyle görür.
- `IslemFormu` artık form action'ının kendiliğinden sıfırlamasını kullanmaz (`onSubmit` + `startTransition`): gerekçe
  diyaloğu aynı formu yeniden gönderdiğinde girilen kısmi miktar kaybolmaz; basılan düğmenin değeri gönderilir.
- Blok parametre saklamaz; ekran kural adını `BLOK_KURAL_ADI`'ndan gösterir. Kararlar ayrıca denetim kaydına
  yazılmaz — kalıcı iz bloğun kendisidir (X-4 §(6)).
- B-7 stok düzeltmesinin negatif stoğu (§(7) "aynı mekanizma") 7d'de düzeltme akışıyla bağlanır.

**Madde 7d — bölünme (20.10.2026):** **7d1** A-1 iade · **7d2** A-2 bedelsiz satır (bayrak + sebep, sipariş formu) ·
**7d3** A-4 konsinye çıkış + B-4 stok transferi · **7d4** B-7 stok düzeltme.

**Madde 7d1 — A-1 iade (20.10.2026, kriterler A-1-1, A-1-2; KARARLAR A-1 eki 20.10).** Notlar (karar değil):

- `src/lib/iade.ts` `iadeYaz(tx, girdi)`: ürün kilidi → iade edilebilir kilit altında → `IAD` → belge + satırlar →
  `stokHareketiYaz` giriş (`returnNoteId`, varsayılan depo) → `iadeHareketiYaz` (`cari-hareket.ts`). Ekran: sipariş
  detayında "İade" kartı (`IadeFormu`, `createReturn`), iade listesi aynı kartta.
- **Şema:** `ReturnNoteItem.commissionRate` (nullable, migration `iade_prim_orani`). "En son sevkiyat" sevkiyatın
  oluşturulma anına göredir.
- Raporlar: `sayilanBelgeler.iadeSatiri` (sevk satırıyla aynı sipariş ve bedelsiz dışlaması); netleme
  `hesaplaSatirTutarlari()`'nın `ters` satırıyla — ham Decimal aritmetiği raporda yoktur (X-5 §(4)). Dönem cirosu
  iade ağır basarsa eksi olabilir.
- Kapsam dışı: iade faturası/fatura hazırlık veri setinde iade satırı (K-4, e-belge modülü) · iade kargosu (D-3) ·
  hasarlı iadenin zayiatı (B-7, 7d4).

---

### §D.5 · 1A'nın **yapmadıkları** — sınırı yazılı tutmak için

11 tek çağrı noktası fonksiyonu · belge akışları (A-1…A-13) · `OPERASYON` ekran matrisi ·
E-2 mekanizmasının uygulanması · X-1 satıcı raporu · taban etiketi (Ü-3) · onay bloğu (A-8) ·
import (D-6) · dışa aktarım (D-5) · kabul senaryosu (F-11) · servis katmanı entegrasyon
**testleri** *(altyapısı 1A'da, testlerin kendisi her fonksiyonla birlikte 1B'de)*.

---

### §D.6 · Taşınan riskler

| # | Risk | Neden | Karşılık |
|---|---|---|---|
| **R-1** | **`CM` tek ve büyük commit** | Fresh init + Decimal + enum + 40+ kolon + yeniden adlandırma kuyruğu ayrılamaz (§D.1 not 1) | 1A'nın **geri alınamaz tek noktası**. Öncesinde tüm söküm bitmiş, CI yeşil olmalı |
| **R-2** | ~~§C-f `CM`'i bloklar~~ *(16.09)* | — | ✅ **Kapandı** — Şerit A tarandı, doğan kararlar X-13…X-15 kapandı |
| **R-3** | **1A sonunda kanıt yüzeyi dar** | ~52 birim / ~28 e2e *(15.09: C4 testleri silindi)*; dokunulmayan 30 test yeni sistemi sınamıyor; **prim kuralları (RULE-05 dahil) 1A boyunca testsiz** | Çıkış kriterinde **yazılı olarak kabul edilir** (§D.2); kapanması 1B'nin işidir |
| **R-4** | **Auth borcu** | Oturum tablosu `CM`'de doğar, 1B'ye kadar boş durur; `AUTH_SECRET` hâlâ gerekli | 1B madde 4'ün ilk işi |
| **R-5** | ~~Bayi yönetim ekranlarının akıbeti belirsiz~~ *(15.09)* | — | ✅ **Kapandı — KARARLAR X-8.** C5 tam söküm; tablolar `CM`'de |
| **R-6** | ~~`LoginAttempt` ↔ E-2 §(8)~~ *(15.09)* | — | ✅ **Kapandı — KARARLAR X-9 / ADR-004.** C7b + `CM` |
| **R-7** | ~~X-10 açık — `CM`'i bloklar~~ *(15.09)* | — | ✅ **Kapandı — KARARLAR X-10** (cariye atanan liste) |
| **R-8** | **Bellek içi deneme sayacı** *(15.09)* | Süreç yeniden başlayınca sayaç ve kilitler sıfırlanır; tek süreç varsayar | **Yazılı kabul** (X-9 §(3)); tetikleyici X-9 §(4) |
| **R-9** | ~~Karar ve ADR boşlukları `CM`'i bloklar~~ *(16.09)* | — | ✅ **Kapandı** — X-11…X-15 ve ADR-005 |
| **R-10** | **Negatif stok izi `CM` → 1B arası yok** *(16.09)* | ADR-005 ile koşullu `updateMany` `CM`'de gider; `NEGATIF_STOK` izi 1B madde 1/7'de gelir | **Yazılı kabul** (ADR-005). Canlı veri yok; 1A canlıya çıkmaz |
| **R-11** | **Cari bakiye, ciro ve satıcı raporu `CM` → 1B arası boş** *(04.10)* | Saklı toplamlar `CM`'de kalkar (GÇ-18); ekranlar hedef kaynaktan okur — bakiye `LedgerEntry`'den SQL `SUM`, ciro sevkiyat satırlarından `hesaplaSatirTutarlari()` ile. İkisini yazan akış 1B madde 7'dedir. Ara hesap yazılmaz (X-5 §(4)) | **Yazılı kabul.** Canlı veri yok; 1A canlıya çıkmaz. Bu rakamları sınayan testler 1B'ye taşınır |

---

### §D.7 · `CM`'i bloklayan karar soruları *(defter kaydı §C)*

> Bunlar **karar boşluğudur**, uygulama ayrıntısı değil; burada **cevaplanmaz** (`YOL_HARITASI.md`
> §7.1-A: *plan bir karar üretemez*). §C'ye yazılır, **KARARLAR'da kapatılır**.
>
> **15.09 4. tur:** ilk üç soru kapandı (X-8, X-9, X-10).
> **16.09: X-11…X-15 açıldı ve aynı gün kapandı; ADR-005 yazıldı. Açık soru yok.**
> **24.09: bir soru yeniden açıldı — `CM` artık engelsiz değil.** X-17 (sahipliğin tek yazma yolu)
> `Doktor` üzerinde bir `CHECK` kısıtı doğuruyor ve **karar verilmiş değil** (`docs/KARAR ONERISI.md` §2 — *13.10.2026: arşivde, `docs/arsiv/KARAR_ONERISI_2026-09-19.md`*).
> Kısıt `CM`'e yetişmezse ikinci bir migration gerekir; bu da **§D.2'nin "tek klasör" çıkış kriterini**
> ihlal eder. Karar: **X-17 `CM`'den önce kapanır**, kısıt tek migration'a girer.
> **Şimdi başlayabilecekler:** Şerit A · C0 · C1 · C2 · C3 · C4 · C5 *(tam)* · C6 · C7 · C7b.
> **`CM`:** **tek açık kalem X-17'dir**; C0…C7b bittikten sonra ve X-17 kapandıktan sonra başlar.
> **01.10.2026: X-17 kapandı (KARARLAR §5.19). C0…C7b bitti. `CM`'in önünde açık karar yok.**

| # | Soru | Durum |
|---|---|---|
| **§D.7-1** → §C-o | Bayi yönetim ekranları ve tabloları | ✅ **KARARLAR X-8** (15.09) — bayi `Doktor` satırı, `hesap_sinifi = BAYI`; beş `Dealer*` tablosu kalkar |
| **§D.7-2** → §C-p | `LoginAttempt` ↔ E-2 §(8) | ✅ **KARARLAR X-9** (15.09) — tablo kalkar; bellek içi sayaç (ADR-004) |
| **§D.7-3** → §C-q | Fiyat listesinin cariye bağlanışı | ✅ **KARARLAR X-10** (15.09) — **(a)** cariye atanan liste |
| **§D.7-4** → §C-r | `CariHareket` şemada nedir *(16.09)* | ✅ **KARARLAR X-11** — yeni tablo |
| **§D.7-5** → §C-s | `ImportParti` tablo sayımında yok *(16.09)* | ✅ **KARARLAR X-12** — yeni tablo |
| **§D.7-6** → §C-u | Satıcı–doktor sahipliği *(16.09, PRD taraması)* | ✅ **KARARLAR X-13** — izolasyon korunur |
| **§D.7-7** → §C-v | Prim oranı *(16.09, PRD taraması)* | ✅ **KARARLAR X-14** — config + özel oran, sevkiyata donar |
| **§D.7-8** → §C-w | Vade değişikliği · mükerrer cari *(16.09, PRD taraması)* | ✅ **KARARLAR X-15** — ikisi de korunur |
| **§D.7-9** → §C-x | `Product.stock` *(16.09 — nasıl sorusu)* | ✅ **ADR-005** — kolon kalkar |
| **§D.7-10** → §C-z | Sahipliği beş yol yazıyor; `BAYI` sahipsizliği kısıtı *(19.09 incelemesi, bulgu 3)* | ✅ **KARARLAR X-17** (01.10.2026, §5.19) — tek yazma noktası `degistirDoktorSahibi()` · `BAYI`'de sahip boş (`CHECK`) · iz olay kaydı · sahip FK `RESTRICT` |

#### §D.7-3 ayrıntısı *(tarihçe — karar KARARLAR §5.13'tedir)*

**Soru:** `cozumleBirimFiyat(urun, liste, miktar, tarih)` bir `liste` alıyor. Hangi carinin hangi
listeyi kullandığı hiçbir yerde yazılı değil. `FiyatListesi` / `FiyatListesiSatir` KARARLAR §4'ün
*"yeni tablolar"* sayımında da yok — oysa bugünkü şemada karşılıkları yok: doktor fiyatı
`Product.netListPrice` kolonunda, bayi fiyatı `DealerPrice` tablosunda. **X-8 `DealerPrice`'ı
kaldırıyor**, dolayısıyla bayiye özel fiyatın gideceği yer tanımsız kaldı.

**Bağlı maddeler:** FR-40 ve RULE-06 *(listede olmayan ürün sevk edilemez)* · B-5 *(fiyat
çözümlenemezse sessizce son fiyata düşülmez)* · B-6 barem · D-6 fiyat listesi import'u ·
A-10 · F-12'nin RULE-06 testi.

**Neden `CM`'den önce:** İki okumadan biri **iki yeni tablo ve bir FK kolonu** doğurur.

| Okuma | Şema | Sonuç |
|---|---|---|
| **(a)** Cariye atanan liste | `FiyatListesi` + `FiyatListesiSatir` **yeni tablo** (11 → 13) · `Doktor.fiyat_listesi_id` **nullable** — boşsa varsayılan liste · ürünün liste fiyatı varsayılan listenin satırı olur | FR-40 ve RULE-06'nın karşılığı B-5 olur: listede satır yoksa **çözümlenemedi** hatası. Bayi–doktor ayrımı fiyatta da tek mekanizmayla çalışır |
| **(b)** Tek liste | Tek liste; cariye özel fiyat **yok** | Bayi fiyatı satırda **elle** girilir (A-10, tavan yok). FR-40 ve RULE-06 **düşer** |

**Sonuç (15.09.2026): (a) seçildi.** Ek netleştirme: (a) **elle fiyat girişini sınırlamaz** —
Ü-3 §(10) aynen geçerli; liste yalnız `liste_fiyat`'ın kaynağıdır ve listede olmayan ürünü
satıra sokmaz.

---

## §E · Şerit A — PRD tarama defteri *(16.09.2026 — açıldı, tarandı ve kapandı · §E.3)*

> **Ne:** `PRD_V2.md`'nin taranacak **59 maddesi** (49 FR + 10 RULE), X-7 §(2)'nin tek sorusuyla:
> ***"Bu madde KARARLAR'da bir maddeye bağlandı mı?"*** Karşılık **aranır, varsayılmaz** (§D.1).
> **Liste kaynağı:** `TRACEABILITY.md` §1–§2 (PRD'nin 71 FR + 15 RULE başlıkları). Tamamen düşen
> **22 FR + 5 RULE** `TRACEABILITY.md` §6.4'e göre çıkarıldı. *Sayım: 86 − 27 = 59.*
> **Kaynak metin:** `PRD_V2.md` (tarama sırasında repo kökü; C10'dan beri `docs/arsiv/`). *Özet* kolonu TRACEABILITY'nin kısaltmasıdır.
> **Karar metni PRD'dedir.** Sonuç yazılmadan önce PRD'deki tam metin okunur.
> **İpucu** kolonu yalnız §6.4'ün *"yeniden tanımlanır"* dediği 24 madde için doludur. Bu
> maddelerin eski metni geçerli değildir; karşılık **yeni tanıma göre** aranır. İpucu karşılık
> değildir.

### §E.1 · Sonuç kodları

| Kod | Anlamı | Sonraki adım |
|---|---|---|
| ✅ | Karşılığı var | `Karşılık` kolonuna madde kimliği (ör. `A-3 §(2)`). C10'da `KABUL_KRITERLERI.md` iskeletinin girdisi olur |
| 🔵 | Bilinçli ertelenmiş / modüle taşınmış | Karar kimliği yazılır (ör. `X-6 §(5) — Faz 2+`) |
| ⛔ | KARARLAR geçersiz kılmış, §6.4'te eksik kalmış | Karar kimliği yazılır; `TRACEABILITY.md` §6.4'e satır açılır |
| ❌ | **Karşılığı yok — eksik karar** | §C'ye yeni harf → KARARLAR §5'e `X-n` (⬜). **Şema doğuruyorsa `CM`'i bloklar** |
| 🗄 | Karşılık var ama **şema kalemi** doğuruyor ve §B'de yok | §B'ye satır + `CM` kuyruğu. Karar gerekmiyorsa ✅ ile birlikte yazılır |

**Kapanış:**
- 59 satırın hepsinde sonuç kodu vardır.
- Her ❌ KARARLAR'da kapanmıştır.
- Bu olunca §C-f'nin işi biter, R-2 kalkar ve `CM` yalnız §C'deki açık maddeleri bekler.
- Bu defter C10'da **silinmez**; PRD arşive gider, defter kalır (X-7 izlenebilirliği).

### §E.2 · Grup sırası *(öneri — oturum başına bir grup)*

En riskli gruplar önce taranır. Karşılığı yeni kararlarda olan gruplar, eksik karar üretme ihtimali
en yüksek olanlardır.

| Grup | PRD bölümü | Madde | Yeniden tanımlanan | Neden bu sırada |
|---|---|---|---|---|
| **A1** | 5.5 · Bayi Yönetimi | 8 | 8 | Tamamı X-8/X-10 ile yeniden tanımlı |
| **A2** | 5.2 · Fiyatlandırma, Taban Fiyat ve KDV | 7 | 4 | Fiyat mimarisi X-5/X-10/Ü-3 ile değişti |
| **A3** | 5.3 · Doktor Cari, Vade ve Tahsilat | 8 | 1 | Cari ve vade — X-11 (`CariHareket`) ile kesişir |
| **A4** | 5.4 · Satıcı Primi | 8 | 3 | Prim tabanı değişti (A-3, X-1) |
| **A5** | §2 · RULE (değişmez iş kuralları) | 10 | 5 | Kurallar — beşi yeniden tanımlı |
| **A6** | 5.1 · Doktor Yönetimi ve Satıcı–Doktor Eşleşmesi | 10 | 0 | Doktor çekirdeği — az değişti |
| **A7** | 5.6 · Kongre ve Doktor Kongre Bakiyesi | 3 | 0 | Kongre artıkları — K-6 modülü |
| **A8** | 5.7 · Dashboard ve Raporlama | 5 | 3 | Rapor — X-1/X-8 kırılımları |
| | | **59** | **24** | |

### §E.A1 · Bayi Yönetimi — 8 madde

| Madde | Özet (TRACEABILITY) | İpucu (§6.4) | Karşılık (KARARLAR) | Sonuç |
|---|---|---|---|---|
| **FR-39** | Bayi kaydı + opsiyonel DEALER hesabı | ⚠️ X-8 · D-2 (`DEALER` hesabı yarısı düşer) | X-8 §(1)/(8) · A-13 (vergi, iletişim, adres) · C-3 (aktiflik) | ✅ · ⛔ `DEALER` hesabı (D-2 §(6)) · *kod/yetkili → X-15* |
| **FR-40** | Bayi × ürün sabit net fiyat; fiyatsız ürün sevk edilemez | ⚠️ X-8 · **X-10** | X-10 §(2)/(3) | ✅ |
| **FR-41** | Fiyat değişikliği geriye etki etmez (snapshot) | ⚠️ X-8 · **X-10** | X-10 §(5) · B-6 | ✅ |
| **FR-42** | Sevkiyat onayı: stok düşer + cariye yazılır, **tek transaction** | ⚠️ X-8 — genel `SVK` akışı | X-8 §(4) (genel `SVK`) · A-3 · C-6 · X-11 §(5) | ✅ · *talep onayı yok → A-5 teklif aşaması* |
| **FR-43** | Stok yetersizse sevkiyat tamamen reddedilir | ⚠️ X-8 · B-4 (negatif stok yumuşak) | B-4 — negatif stok yumuşak kısıt | ⛔ → **GÇ-17** |
| **FR-44** | Sevkiyat iptali: stok `IN`, borç geri alınır | ⚠️ X-8 — genel iptal/iade akışı | X-8 §(4) · A-1 (sevk edilmiş → iade belgesi) · K-1 | ✅ *(biçim: iptal değil iade)* |
| **FR-45** | Bayi cari = Σ sevkiyat (iptal hariç) − Σ ödeme | ⚠️ X-8 · K-2 — tek bakiye fonksiyonu | X-8 §(2) · K-2 · X-11 | ✅ |
| **FR-46** | Bayi ödemesi + vade takibi ve yaşlandırma | ⚠️ X-8 · X-6 (yaşlandırma Faz 2+) | X-8 §(4) (`THS`) · A-7 | ✅ · 🔵 yaşlandırma (X-6 §(5), Ü-16) |

### §E.A2 · Fiyatlandırma, Taban Fiyat ve KDV — 7 madde

| Madde | Özet (TRACEABILITY) | İpucu (§6.4) | Karşılık (KARARLAR) | Sonuç |
|---|---|---|---|---|
| **FR-11** | Ürün bazlı liste + taban fiyat | ⚠️ A-10 / GÇ-8 (taban) · X-10 §(5) (liste) | X-10 §(5) (liste fiyatı = varsayılan listenin satırı) | ✅ · ⛔ taban fiyat (A-10, Ü-3 §(10) — GÇ-8) |
| **FR-13** | Fiyat sipariş anında **snapshot** | — | B-6 · X-10 §(5) · C-6 §(2-a) | ✅ |
| **FR-14** | Kalem bazında iskonto oranı hesaplanıp **saklanır** | ⚠️ X-5 §(9)/(10) — `birim_fiyat` saklanır, oran türetilir | X-5 §(9)/(10) | ⛔ saklama — oran türetilir *(§6.4'te var)* |
| **FR-15** | Fiyat değişiklikleri audit log'a yazılır | — | X-10 §(6) · C-6 §(2-b) · C-3 §(4) | ✅ · ⛔ taban fiyat |
| **FR-16** | KDV %20 **sistem parametresi**; ürün bazında override | ⚠️ C-6 §(2) — `VergiOrani` | C-6 §(1)/(2)/(2-c) | ✅ |
| **FR-17** | Kanonik net saklama + snapshot alanları | — | C-6 §(3)/(5) | ✅ kanonik net, satırda yuvarlama · ⛔ KDV ve brüt tutar saklanmaz → **GÇ-18** |
| **FR-18** | **Tüm** fiyat girişi ve listelerde KDV Dahil/Hariç + tercih hatırlanır | ⚠️ Ü-3 §(1)/(3)/(6) — taban etiketi | Ü-3 §(1)/(6) | ⛔ kullanıcı tercihi — yerine taban etiketi *(§6.4'te var)* |

### §E.A3 · Doktor Cari, Vade ve Tahsilat — 8 madde

| Madde | Özet (TRACEABILITY) | İpucu (§6.4) | Karşılık (KARARLAR) | Sonuç |
|---|---|---|---|---|
| **FR-20** | Bakiye = Σ sipariş (brüt, iptal hariç) − Σ tahsilat | — | K-2 · A-3 (borç sevkiyatta) · X-11 | ✅ *(biçim: Σ borç − Σ alacak hareketi)* |
| **FR-21** | Vade tarihi; varsayılan gün ve üst sınır **admin parametresi** | — | A-7 (`vade_tarihi`, `odeme_vadesi_gun`, `finance.odemeVadesiGunVarsayilan`) | ✅ · ⛔ üst sınır (KARARLAR §2 madde 16 → GÇ-11) · ⛔ siparişte tarih (→ **GÇ-19**) |
| **FR-22** | Vade değiştirilebilir; geçmiş + audit | — | **X-15 §(1)** | ✅ *(16.09 — tarama ❌ idi)* |
| **FR-23** | Tahsilat kaydı alanları | — | A-11 · KARARLAR §2 madde 17-a | ✅ · ⛔ çek (§2 madde 17-b) |
| **FR-25** | Kısmi tahsilat; prim ve kongre **orantılı** | ⚠️ X-1 §(7) · K-6 §(2) — prim ve kongre yarısı düşer | K-2 · X-6 §(4) (kısmi ödeme aritmetiktir) | ✅ · ⛔ orantılı prim/kongre (X-1 §(7), K-6) |
| **FR-27** | Satıcı panelinde kendi doktorlarının vadesi yaklaşan/geçen alacakları | — | X-6 §(6) · D-2 §(4) | ✅ bakiye + vade uyarısı · ⛔ vadesi geçen tutar (X-6 §(7)) · *kapsam → X-13* |
| **FR-28** | Vadesi geçmiş borcu olan doktora yeni siparişte **uyarı** | — | X-6 §(6) (`VADESI_GECMIS_HAREKET`) · A-12 | ✅ |
| **FR-29** | Tahsilat iptali; ters kayıt; kongre negatife düşerse uyarı | — | §0.2 (ters kayıt) · X-11 §(5) · X-1 §(6) | ✅ · ⛔ prim/kongre geri alma (hakediş sevkiyatta; K-6) |

### §E.A4 · Satıcı Primi — 8 madde

| Madde | Özet (TRACEABILITY) | İpucu (§6.4) | Karşılık (KARARLAR) | Sonuç |
|---|---|---|---|---|
| **FR-30** | Varsayılan prim %5, **sistem parametresi (admin değiştirebilir)** | ⚠️ X-1 §(7) · A-3 — hakediş sevkiyatta | **X-14 §(1) · D-4 · X-1 §(7)** | ✅ *(16.09 — tarama ❌ idi)* |
| **FR-31** | Satıcı bazında oran override | — | **X-14 §(2)** | ✅ *(16.09 — tarama ❌ idi)* |
| **FR-32** | Dönem = takvim ayı | — | X-1 §(2) (zorunlu aralık; UI varsayılanı içinde bulunulan ay) | ✅ *(biçim: sabit ay değil, aralık)* |
| **FR-33** | Matrah: tahsil edilen tutar, KDV hariç | ⚠️ X-1 §(7) · A-3 — matrah tanımı değişir | X-1 §(7) · A-3 · C-6 §(6) · KARARLAR §2 madde 9 | ✅ *(yeniden tanım: sevkiyat matrahı)* |
| **FR-34** | Dönem kapat → matrah/oran/prim **dondurulur** | — | X-1 *kapsam dışı — dönem kapatma/kilitleme* | ⛔ → **GÇ-16** |
| **FR-35** | Kapanmış dönem iptali → sonraki döneme negatif kayıt | — | X-1 §(6) — ters kayıt kendi belge tarihinde | ⛔ biçim → **GÇ-16** |
| **FR-36** | HESAPLANDI → ONAYLANDI → ÖDENDİ | — | X-1 §(7) + *kapsam dışı — prim onay iş akışı, ödeme kaydı* | ⛔ → **GÇ-16** |
| **FR-37** | Satıcı paneli: anlık tahsilat, tahmini prim, "henüz tahsil edilmedi" | ⚠️ X-1 §(7) · A-3 | X-1 §(1)/(7) · D-2 §(4) | ✅ iki mutlak sayı · ⛔ tahmini prim ve "henüz tahsil edilmedi" (X-1 §(7), X-6) |

### §E.A5 · Değişmez iş kuralları — 10 madde

| Madde | Özet (TRACEABILITY) | İpucu (§6.4) | Karşılık (KARARLAR) | Sonuç |
|---|---|---|---|---|
| **RULE-01** | Stok hiçbir koşulda eksiye düşemez | ⚠️ B-4 — yumuşak kısıt | B-4 | ⛔ sert kural → yumuşak kısıt (**GÇ-17**) |
| **RULE-02** | Bir doktora aynı anda tek satıcı | — | X-8 §(3) · D-2 | ✅ *(ayrıntı → X-13)* |
| **RULE-04** | Sipariş anındaki fiyat/KDV/tutar dondurulur | — | B-6 · C-6 §(2-a) · X-10 §(5) | ✅ |
| **RULE-05** | Kapanmış prim dönemi asla değişmez | — | X-1 §(6) | ✅ *(biçim: kilit yok, ters kayıt)* |
| **RULE-06** | Fiyat listesinde olmayan ürün bayiye sevk edilemez | ⚠️ X-8 · **X-10 §(3)** | X-10 §(3) | ✅ |
| **RULE-08** | Bakiyeler ayrı kolonda tutulmaz, hesaplanır | — | K-2 · §0.4 · X-11 §(6) | ✅ |
| **RULE-10** | Parasal alanlar tam sayı kuruş; kanonik net | ⚠️ X-5 — `Decimal`; kanonik net yarısı kalır | X-5 · C-6 §(3) | ✅ kanonik net · ⛔ tam sayı kuruş |
| **RULE-12** | Tahsilat: mahsup + doktor bakiyesi + prim matrahı + kongre **tek transaction** | ⚠️ GÇ-1 / GÇ-3 / GÇ-4 — dört bileşenin üçü düşer | X-3 · X-8 §(7) · X-11 §(5) | ✅ *(biçim: belge + hareket + numara tek transaction; üç bileşen düştü)* |
| **RULE-13** | Kritik değişiklikler **istisnasız** audit log'a | — | C-3 §(4)/(7) · A-12 · A-13 §(7) · C-6 §(2-b) · X-10 §(6) · B-7 · E-2 | ✅ · ⛔ mahsup ve kongre düzeltmesi (X-6, K-6) · *prim oranı, vade, devir → X-13/14/15* |
| **RULE-15** | Bayi prim/kongreye hiç dahil olmaz | ⚠️ X-8 §(3) — `BAYI`'ye satıcı atanmaz | X-8 §(3) | ✅ |

### §E.A6 · Doktor Yönetimi ve Satıcı–Doktor Eşleşmesi — 10 madde

| Madde | Özet (TRACEABILITY) | İpucu (§6.4) | Karşılık (KARARLAR) | Sonuç |
|---|---|---|---|---|
| **FR-01** | Doktor kaydı alanları (ad, klinik, bölge, telefon…) | — | A-13 · A-9 (klinik ayrı tablo değil) · C-3 | ✅ · *zorunlu alanlar → X-15 (ii)* |
| **FR-02** | Doktorun en fazla bir sorumlu satıcısı | — | X-8 §(3) (RULE-02) | ✅ |
| **FR-03** | Satıcı doktor açar, sahiplik otomatik atanır | — | **X-13 §(2)** | ✅ *(16.09 — tarama ❌ idi)* |
| **FR-04** | Sahibi olmadığı doktora sipariş **oluşturamaz** (sunucu) | — | **X-13 §(3)** | ✅ *(16.09 — tarama ❌ idi)* |
| **FR-05** | Satıcı yalnız kendi doktorlarını görür | — | **X-13 §(1) · D-2 §(3) redakte** | ✅ *(16.09 — tarama ❌ idi)* |
| **FR-06** | Admin doktoru devreder; devir kaydı tutulur | — | **X-13 §(5)** | ✅ *(16.09 — tarama ❌ idi)* |
| **FR-07** | Devir sonrası geçmiş **eski satıcıda kalır** | — | **X-13 §(3)/(4)** | ✅ *(16.09 — tarama ❌ idi)* |
| **FR-08** | Pasif satıcının doktorları sahipsiz havuza düşer | — | **X-13 §(6)** | ✅ *(16.09 — tarama ❌ idi)* |
| **FR-09** | Normalize telefon **benzersiz** (+ ad/klinik benzerlik uyarısı) | — | **X-15 §(2)** | ✅ *(16.09 — tarama ❌ idi)* |
| **FR-10** | Doktor detayı: cari, vade, geçmiş, kongre defteri | — | K-2 · X-6 §(6) · A-12 | ✅ · ⛔ vadesi geçen tutar (X-6 §(7)) · ⛔ kongre defteri (K-6) |

### §E.A7 · Kongre ve Doktor Kongre Bakiyesi — 3 madde

| Madde | Özet (TRACEABILITY) | İpucu (§6.4) | Karşılık (KARARLAR) | Sonuç |
|---|---|---|---|---|
| **FR-47** | Kongre CRUD | — | K-6 (§1.7) · §1.3 · `modules.congress = false` | 🔵 modül — Faz 3+, uyum kütüğü |
| **FR-48** | Kongre paketi (değer kuruş, kontenjan) | — | K-6 | 🔵 · ⛔ paket değeri ↔ doktor bakiyesi bağı (K-6 §(2)) |
| **FR-55** | Kontenjan; rezerve talepler de düşer | — | K-3 · K-6 | 🔵 · ⛔ sert kontenjan (K-3: yumuşak kısıt) |

### §E.A8 · Dashboard ve Raporlama — 5 madde

| Madde | Özet (TRACEABILITY) | İpucu (§6.4) | Karşılık (KARARLAR) | Sonuç |
|---|---|---|---|---|
| **FR-60** | Admin dashboard: kanal ciro, açık alacak + aging, **ay içi prim yükü**, bayi alacağı, açık kongre bakiyesi | ⚠️ X-8 — kırılım `hesap_sinifi`; kart Faz 2 (Ü-10) | X-8 §(1) (kanal kırılımı) · K-2 · X-1 · Ü-10 | ✅ · ⛔ yaşlandırma (X-6 §(5)) · ⛔ kongre bakiyesi (K-6) |
| **FR-61** | Satıcı dashboard: tahsilat/prim ilerlemesi, gecikmeler, portföy, ortalama iskonto | — | X-1 §(1)/(7) · X-6 §(6) · KARARLAR §2 madde 8 · Ü-3 (sapma) | ✅ · ⛔ gecikme tutarı (X-6 §(7)) |
| **FR-62** | Satıcı performans karşılaştırması | ⚠️ X-1 §(1) — `tahsilatOrani` kalemi düşer | X-1 §(1) · KARARLAR §2 madde 8 · D-2 §(4) | ✅ · ⛔ tahsilat oranı *(§6.4'te var)* |
| **FR-63** | Doktor ciro sıralaması + kongre bakiye + gecikmiş borç | — | X-1 §(3)/(5) | ✅ · ⛔ kongre bakiyesi (K-6) · ⛔ gecikmiş borç tutarı (X-6 §(7)) |
| **FR-64** | Tüm raporlarda KDV dahil/hariç seçeneği | ⚠️ Ü-3 — toggle Faz 1'de görünmez | Ü-3 (toggle kalıcı yok: prim/ciro/cari) | ⛔ *(§6.4'te var)* |

### §E.3 · Sonuç — ✅ **kapandı 16.09.2026**

| Ana sonuç | Adet | Maddeler |
|---|---|---|
| ✅ karşılığı var | **48** | 38'i ilk taramada; 10'u aynı gün X-13…X-15 ile. Çoğunda kısmi ⛔ notu var |
| ⛔ geçersiz kılınmış | **8** | FR-14 · FR-18 · FR-34 · FR-35 · FR-36 · FR-43 · FR-64 · RULE-01 |
| 🔵 modüle ertelenmiş | **3** | FR-47 · FR-48 · FR-55 (K-6) |
| ❌ karşılığı yok | **0** | *ilk taramada 10: FR-03…08 → X-13 · FR-30/31 → X-14 · FR-09/22 → X-15 — hepsi ✅ 16.09* |
| **Toplam** | **59** | |

**Taramanın doğurdukları:**
- **Üç eksik karar** → KARARLAR X-13 · X-14 · X-15 (§C-u/v/w) — ✅ aynı gün kapandı.
- **Beş eksik geri çekme satırı** → §A GÇ-16…GÇ-20. Kararlar eskiydi, kayıt eksik kalmıştı.
- **Bir ADR sorusu** → §C-x (`Product.stock`) — ✅ `docs/adr/ADR-005`.
- **`TRACEABILITY.md` §6.4'e eklenecek ⛔ satırları** — aynada 16.09 notuyla işlendi:
  - tam düşenler: FR-34 · FR-35 · FR-36 · FR-43
  - kısmen düşenler: FR-10 · FR-17 · FR-21 · FR-23 · FR-29 · FR-37 · FR-55 · FR-60 · FR-61 · FR-63 · RULE-13

**Kapanış durumu:**
- ✅ **KAPANDI — 16.09.2026.** 59/59 sonuç kodlu; açık ❌ yok.
- §C-f'nin işi bitti; KARARLAR §6'daki PRD kutusu işaretli.
- `PRD_V2.md` proje bilgisinden çıkarılabilir; repoda **C10**'da `docs/arsiv/`'e gider.
- Bu defter C10'da `KABUL_KRITERLERI.md` iskeletinin girdisidir ve kayıt olarak kalır.
