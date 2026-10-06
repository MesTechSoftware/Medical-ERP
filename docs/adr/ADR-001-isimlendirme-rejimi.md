# ADR-001 — İsimlendirme rejimi: karma

- **Durum:** ✅ Kabul edildi
- **Tarih:** 15.09.2026
- **Kaynak soru:** `FAZ1_UYGULAMA_KAPSAMI.md` §C-l
- **Bağlı KARARLAR maddeleri:** §4 (şema özeti) · D-2 (rol enum'u) · A-13 (`cari_tip`) · A-14 (belge önekleri) · §4 *"11 tek çağrı noktası fonksiyonu"* · `policy.ts` anahtarları (E-1, E-2, A-15, K-4 …)
- **Uygulandığı commit:** `CM` (Faz 1A) — hash `FAZ1_UYGULAMA_KAPSAMI.md` §A'da
- **Ek güncellemesi (16.09.2026 — karar değişmedi):** Ek, `CM`'e kadar dolan yaşayan bir tablodur.
  Üç değişiklik yapıldı: `netListPrice` satırı **yasak** olarak işaretlendi (§C-t) · `vatRate`
  yasağı `Product` ile sınırlandı · X-11/X-12'ye bağlı iki satır eklendi. *Aynı gün:* X-11/X-12
  kapandı; satırlar ✅ oldu ve iki 🟦 enum kataloğu Karar tablosuna eklendi. *Son hâli:* X-13…X-15
  ve ADR-005 satırları eklendi; `policy.ts` örneğine `finance.primOraniVarsayilan` girdi.
- **Ek güncellemesi (01.10.2026 — karar değişmedi):** KARARLAR **X-17** ile tek çağrı noktası
  listesi 11 → 12 (`degistirDoktorSahibi`); devir izi satırına olay biçimi notu düşüldü.
- **Ek tamamlandı (04.10.2026 — `CM`, karar değişmedi):** bütün *"`CM`'de"* satırları ad aldı;
  yasak kavramlara anti-şema testinin arayacağı adlar verildi. Eski İngilizce enum değerleri
  (`ACTIVE`, `PENDING`, `IN` …) kuralın istisnası sayılmadı ve Türkçeye çevrildi (aşağıda).

## Bağlam

KARARLAR tablo ve kolonları Türkçe adlarla anlatıyor (`Kullanici.aktif`, `Doktor.vkn_tckn`,
`fatura_*` …). Mevcut kod ise İngilizce `camelCase` kullanıyor (`User`, `netListPrice`,
`phoneNormalized` …). `CM` tek migration olduğu için adların **o commit'te** kesinleşmesi
gerekiyordu. Aksi hâlde iki sorun doğar:
- Yeniden adlandırma kuyruğu (rol string'leri, `BigInt` alanlar, `netMinPrice`, `vatRate` …) iki kez yazılır.
- Anti-şema testi (C8) hangi adı arayacağını bilemez.

## Karar

**Karma rejim.**

| Tür | Dil | Biçim | Örnek | Statü |
|---|---|---|---|---|
| Şema **tanımlayıcıları** (tablo, kolon) | İngilizce | `camelCase` (model `PascalCase`) | `User`, `lastSeenAt` | Eşleme tablosuyla (§Ek) |
| **Enum değerleri** | Türkçe, ASCII | `BUYUK_HARF_ALT_CIZGI` | `YONETICI` · `OPERASYON` · `SATICI` · `TUZEL_KISI` · `GERCEK_KISI` · `DOKTOR` · `BAYI` *(X-8)* · `NEGATIF_STOK` · `VADESI_GECMIS_HAREKET` · `SEVKIYAT`/`TAHSILAT`/`TERS_KAYIT`/`BORC`/`ALACAK` *(X-11 🟦)* · `CARI`/`ACILIS_STOGU` *(X-12 🟦)* | **Normatif** — KARARLAR'daki yazımıyla aynen |
| **12 tek çağrı noktası fonksiyonu** *(01.10.2026: X-17 ile 11 → 12)* | Türkçe, ASCII | `camelCase` | `hesaplaDoktorBakiye` · `uretBelgeNo` · `hesaplaSatirTutarlari` · `cozumleBirimFiyat` · `hesaplaStok` · `hesaplaDoktorRisk` · `degistirDoktorSahibi` *(X-17)* … | **Normatif** |
| **`policy.ts` anahtarları** | Türkçe, ASCII | noktalı `camelCase` | `auth.oturumHareketsizlikSaat` · `auth.girisDenemeSiniri` *(X-9)* · `pricing.varsayilanFiyatListesiKodu` *(X-10)* · `finance.primOraniVarsayilan` *(X-14)* · `zaman.saatDilimi` · `finance.nakitTevsikLimiti` | **Normatif** |
| **Belge önekleri** | Türkçe | büyük harf | `SIP` · `SVK` · `IAD` · `KNS` · `TRF` · `THS` · `ACL` · `VDF` · `DZL` | **Normatif** — müşterinin gördüğü şey |

**Okuma kuralı:** KARARLAR'daki Türkçe **tablo/kolon** adları **kavramsaldır**, normatif
değildir. KARARLAR §4'e 15.09.2026'da bu yönde redaksiyon notu kondu.

## Sonuçlar

- **Kavramsal → şema adı eşlemesi tek yerde tutulur:** bu ADR'nin ekindeki tablo. `CM` commit'i
  tabloyu **doldurmadan kapanmaz**. Çünkü anti-şema testinin *"… karşılığı"* diye bırakılan
  kalemleri (`FAZ1_UYGULAMA_KAPSAMI.md` §D.2) buradan beslenir.
- **Yeniden adlandırma kuyruğu tektir ve `CM` içindedir** (`FAZ1_UYGULAMA_KAPSAMI.md` §D.1 not 2).
  Rol string'leri **mekanik** olarak değişir: `ADMIN`→`YONETICI`, `SELLER`→`SATICI`, `DEALER`
  düşer.
- **Anti-şema testi `lower(column_name)` ile karşılaştırır.** Prisma `camelCase` kolonları
  tırnaklı üretir; büyük/küçük harf varyantı listeden kaçmamalıdır.
- **Plan ve ayna dosyalarında** Türkçe kolon adı görüldüğünde kavram okunur, şema adı ekten alınır.

## Değerlendirilen alternatifler

- **Tamamen Türkçe şema.** Reddedildi. Bugünkü 25 modelin tamamı yeniden adlandırılırdı ve
  kuyruk `CM`'i şişirirdi. Ayrıca ASCII'ye indirilmiş Türkçe kolon adları okunabilirlik
  kazandırmaz.
- **Tamamen İngilizce (enum ve fonksiyonlar dahil).** Reddedildi. Enum değerleri ve belge
  önekleri müşterinin gördüğü ve dışa aktarımda çıkan değerlerdir (K-4). Fonksiyon adları da
  KARARLAR'da iş kuralının adıdır; çevirmek, karar metniyle kod arasındaki izlenebilirliği
  koparır (X-7).

## Açık uygulama kalemleri (atıf)

- Eşleme tablosunun doldurulması → `CM`.
- Anti-şema listesindeki *"karşılığı"* kalemleri → `FAZ1_UYGULAMA_KAPSAMI.md` §D.2.

## Geçerlilik sınırı

Rejim **kalıcıdır**. Canlıya çıkıştan sonra bir şema adını değiştirmek veri taşıma
migration'ıdır; o hâlde yeni ADR gerekir.

---

## Ek · Ad eşleme tablosu

> **Durum: tamam (04.10.2026, `CM`).** Kaynak şema `prisma/schema.prisma`'dır; bu tablo kavramdan
> şema adına giden yoldur. Yasak satırları C8 anti-şema testinin girdisidir; test `lower(...)` ile
> karşılaştırır.

### Tablolar

| KARARLAR kavramı | Şema adı | Tür | Kaynak |
|---|---|---|---|
| `Kullanici` | `User` *(bugünkü ad)* | ✅ | E-2 · D-2 |
| oturum tablosu | `Session` | ✅ konur | E-2 · ADR-003 |
| `Doktor` (cari) tablosu | `Doctor` *(bugünkü ad — **bilinçli** korundu: normatif fonksiyon adları "Doktor" der; bayi satırını `accountClass` ayırır)* | ✅ | A-9 · **X-8** |
| devir izi | `DoctorAssignment` *(olay kaydı — X-17 §(3))* | ✅ | X-13 · **X-17** |
| `CariHareket` | `LedgerEntry` | ✅ konur | **X-11** |
| vade değişiklik izi | `DueDateChange` *(bağı `ledgerEntryId`)* | ✅ | X-15 |
| `Urun` | `Product` *(bugünkü ad)* | ✅ | — |
| `VergiOrani` | `TaxRate` | ✅ konur | C-6 |
| `FiyatListesi` · `FiyatListesiSatir` | `PriceList` · `PriceListItem` | ✅ konur | **X-10** |
| `StokKonum` | `StockLocation` | ✅ konur | A-4 · B-4 |
| stok hareketi | `StockMovement` *(bugünkü ad)* | ✅ | B-4 |
| `OdemeYontemi` | `PaymentMethod` | ✅ konur | A-11 |
| `KargoFirma` | `Carrier` | ✅ konur | D-3 |
| `BelgeSayac` | `DocumentCounter` | ✅ konur | A-14 |
| `OnayBlogu` | `ApprovalBlock` | ✅ konur | A-8 |
| `ImportParti` | `ImportBatch` | ✅ konur | **X-12** |
| dışa aktarım kütüğü | `ExportLog` | ✅ konur | D-5 |
| değişiklik logu | `AuditLog` *(bugünkü ad)* | ✅ | RULE-13 · C-3 §4 |
| `Siparis` (`SIP`) · sipariş satırı | `Order` · `OrderItem` *(bugünkü adlar)* | ✅ | A-5 |
| `Sevkiyat` (`SVK`) · sevkiyat satırı | `Shipment` · `ShipmentItem` | ✅ | A-3 · GÇ-12 |
| iade belgesi (`IAD`) · satırı | `ReturnNote` · `ReturnNoteItem` | ✅ konur | A-1 |
| `KonsinyeCikis` (`KNS`) · satırı | `ConsignmentIssue` · `ConsignmentIssueItem` | ✅ konur | A-4 |
| `StokTransfer` (`TRF`) · satırı | `StockTransfer` · `StockTransferItem` | ✅ konur | B-4 |
| `StokDuzeltme` (`DZL`) · `StokDuzeltmeSatir` · `StokDuzeltmeSebep` | `StockAdjustment` · `StockAdjustmentItem` · `StockAdjustmentReason` | ✅ konur | B-7 |
| `Tahsilat` (`THS`) | `DoctorPayment` *(bugünkü ad)* | ✅ | A-11 |

### Kolonlar

| KARARLAR kavramı | Şema adı | Tür | Kaynak |
|---|---|---|---|
| tüm belgelerde `belge_no` · `guncelleme_tarihi` | `documentNo` · `updatedAt` | ✅ konur | K-4 · A-14 |
| `Kullanici.aktif` · `parola_hash` · `parola_degistirmeli` | `isActive` · `passwordHash` · `mustChangePassword` | ✅ konur | E-2 *(`User.status` yerine)* |
| `Kullanici.rol` | `role` | ✅ | D-2 |
| `Kullanici.prim_orani` · sevkiyat satırı `prim_orani` | `User.commissionRate` · `ShipmentItem.commissionRate` | ✅ | X-14 |
| oturum: token hash · son görülme · iptal | `tokenHash` · `lastSeenAt` · `revokedAt` | ✅ konur | ADR-003 · §D.4 |
| `Doktor.hesap_sinifi` | `accountClass` | ✅ konur | **X-8** |
| `Doktor` sahibi | `ownerSellerId` *(bugünkü ad; FK `RESTRICT`)* | ✅ | X-13 · **X-17** |
| `Doktor.fiyat_listesi_id` | `priceListId` | ✅ konur | **X-10** |
| `Doktor.odeme_vadesi_gun` · `kredi_limiti` | `paymentTermDays` · `creditLimit` | ✅ konur | A-7 · A-12 |
| `Doktor.cari_tip` · `vkn_tckn` | `partyType` · `taxId` | ✅ konur | A-13 |
| `fatura_unvani` · `vergi_dairesi` · `fatura_adresi` · `fatura_ilce` · `fatura_il` | `invoiceTitle` · `taxOffice` · `invoiceAddress` · `invoiceDistrict` · `invoiceCity` | ✅ konur | A-13 |
| `Doktor.eposta` · `telefon` · `muhasebe_kodu` | `email` · `phoneNormalized` *(UNIQUE)* · `accountingCode` | ✅ | A-13 · X-15 |
| `Doktor.klinik` · `bolge` | `clinic` · `region` *(nullable)* | ✅ | X-15 |
| devir izi: eski/yeni sahip · yapan · zaman · gerekçe | `fromSellerId` · `toSellerId` · `changedById` · `changedAt` · `reason` | ✅ | **X-17** §(3) |
| `CariHareket.tip` · `yon` · `tutar` · `vade_tarihi` | `type` · `direction` · `amount` · `dueDate` | ✅ konur | **X-11** · A-7 |
| `CariHareket` kaynak bağı · ters kayıt bağı | `shipmentId` · `returnNoteId` · `paymentId` · `reversedEntryId` | ✅ konur | **X-11** §(1)/(5) |
| içe aktarım parti FK (beş tablo) | `importBatchId` | ✅ konur | **X-12** §(2) |
| `ImportParti`: parti no · veri türü · `dosya_adi` · geri alma | `batchNo` · `dataType` · `fileName` · `revertedAt` · `revertedById` · `revertReason` | ✅ konur | **X-12** · E-3 |
| `Urun.vergi_orani_id` | `taxRateId` | ✅ konur | C-6 |
| `VergiOrani.oran` · tanım tablolarında `aktif` · `sira` | `rate` · `isActive` · `sortOrder` | ✅ konur | C-6 · §0.1.1 |
| `FiyatListesiSatir.liste_fiyat` · `min_adet` · `gecerli_baslangic` · `gecerli_bitis` | `listPrice` · `minQuantity` · `validFrom` · `validTo` | ✅ konur | B-5 · B-6 |
| `StockMovement.konum_id` | `locationId` | ✅ konur | A-4 |
| `StokKonum.tip` | `StockLocation.type` | ✅ konur | A-4 *(🟦 04.10)* |
| `Siparis.asama` · `teklif_gecerlilik_tarihi` · `odeme_vadesi_gun` | `stage` · `quoteValidUntil` · `paymentTermDays` | ✅ konur | A-5 · A-7 |
| `Siparis` satıcı alanı | `sellerId` *(nullable)* | ✅ | X-13 |
| `OrderItem.liste_fiyat` · `birim_fiyat` | `listPrice` · `unitPrice` | ✅ konur | A-10 · X-5 |
| `OrderItem.kdv_orani` (dondurulmuş oran) | `OrderItem.vatRate` *(bugünkü ad, artık `Decimal(5,2)` — `Product.vatRate` yasağıyla karışmaz: o yalnız `Product`'ta aranır)* | ✅ | C-6 · §C-t |
| bedelsiz bayrağı · sebebi | `isFree` · `freeReason` | ✅ konur | A-2 |
| `Tahsilat.odeme_yontemi_id` · `komisyon_oran` · `komisyon_tutar` · `beklenen_valor_tarihi` · `yon` | `paymentMethodId` · `commissionRate` · `commissionAmount` · `expectedValueDate` · `direction` | ✅ konur | A-11 |
| `OdemeYontemi.tip` · `valor_gun` | `type` · `valueDays` | ✅ konur | A-11 |
| `KargoFirma.takip_url_sablonu` | `trackingUrlTemplate` | ✅ konur | D-3 |
| `Sevkiyat.kargo_firma_id` · `takip_no` · `gonderi_tarihi` · `kargo_durum` · `kargo_son_sorgu` | `carrierId` · `trackingNumber` · `shippedOn` · `cargoStatus` · `cargoLastQueriedAt` | ✅ | D-3 |
| `Sevkiyat.teslimat_adresi` · `harici_irsaliye_no` | `deliveryAddress` · `externalDispatchNo` | ✅ konur | A-13 · C-1 |
| `StokDuzeltme.harici_belge_no` · satır `fark_miktar` · `sebep_id` · `aciklama` | `externalDocNo` · `quantityDelta` · `reasonId` · `note` | ✅ konur | B-7 |
| `BelgeSayac.onek` · `yil` · `son_deger` | `prefix` · `year` · `lastValue` | ✅ konur | A-14 |
| `OnayBlogu`: belge · `kural_kodu` · açan + gerekçe · karar | `documentType` + `documentId` · `ruleCode` · `openedById` + `openReason` · `decision` · `decidedById` · `decidedAt` · `decisionNote` | ✅ konur | A-8 *(🟦 04.10)* |
| dışa aktarım kütüğü: kullanıcı · veri seti · parametreler · satır sayısı | `userId` · `datasetCode` · `parameters` · `rowCount` | ✅ konur | D-5 §(5) |

### Enum'lar

Enum **adları** İngilizce, **değerleri** Türkçe ASCII ve normatiftir.

| Enum | Değerler | Kaynak |
|---|---|---|
| `Role` | `YONETICI` · `OPERASYON` · `SATICI` | D-2 |
| `AccountClass` | `DOKTOR` · `BAYI` | **X-8** |
| `PartyType` | `TUZEL_KISI` · `GERCEK_KISI` | A-13 |
| `LedgerEntryType` · `LedgerDirection` | `SEVKIYAT` · `IADE` · `TAHSILAT` · `ACILIS` · `VADE_FARKI` · `TERS_KAYIT` · `BORC` · `ALACAK` | **X-11** 🟦 |
| `ImportDataType` | `CARI` · `URUN` · `FIYAT_LISTESI` · `ACILIS_BAKIYESI` · `ACILIS_STOGU` | **X-12** 🟦 |
| `PaymentMethodType` | `NAKIT` · `BANKA` · `POS` | A-11 |
| `OrderStage` | `TEKLIF` · `ONAYLI` | A-5 |
| `StockLocationType` | `DEPO` · `KONSINYE` | A-4 🟦 *(04.10)* |
| `ApprovalDecision` | `ONAY` · `RED` | A-8 🟦 *(04.10)* |
| `PaymentStatus` | `AKTIF` · `IPTAL` *(bugünkü değerler)* | — |
| `EntityStatus` | `AKTIF` · `PASIF` *(04.10: `ACTIVE`/`PASSIVE`'den çevrildi)* | bu ADR |
| `OrderStatus` | `BEKLIYOR` · `HAZIRLANIYOR` · `KARGOLANDI` · `TESLIM_EDILDI` · `IPTAL` *(04.10: İngilizceden çevrildi; ekrandaki etiketlerin karşılığı)* | bu ADR |
| `StockMovementType` | `GIRIS` · `CIKIS` *(04.10: `IN`/`OUT`'tan çevrildi)* | bu ADR |

### Yasak adlar — C8 anti-şema testinin girdisi

| KARARLAR kavramı | Aranan ad(lar) | Nerede | Kaynak |
|---|---|---|---|
| `tenant_id` | `tenantId` | her tablo | §D.2 |
| `Kullanici.son_giris_at` | `lastLoginAt` | her tablo | E-2 §(9) |
| `Doktor.kurum_id` · `Kurum` tablosu | `institutionId` · `Institution` | kolon · tablo | A-9 |
| `Yetki` tablosu | `Permission` | tablo | D-2 |
| `OrderItem.iskonto_oran` | `discountRate` | her tablo | X-5 |
| lot / seri / GTIN / SKT · karekod | `lotNumber` · `serialNumber` · `gtin` · `expiryDate` · `dataMatrix` | her tablo | K-10 |
| `Urun.uts_sinifi` | `utsClass` | her tablo | K-10 §1.5-b |
| `UrunBarkod` · `Urun.barkod` | `ProductBarcode` · `barcode` | tablo · kolon | B-3 |
| `dosya_url` / `ek_var_mi` | `fileUrl` · `hasAttachment` | her tablo | E-3 |
| `dis_referans` · `aktarildi_mi` | `externalRef` · `isExported` | her tablo | K-4 EK2 |
| `harici_fatura_no` | `externalInvoiceNo` · `invoiceNo` | her tablo | C-1 · GÇ-20 |
| para birimi | `currency` | her tablo | C-5 |
| stok tutar / maliyet | `cost` · `unitCost` · `stockValue` | her tablo | §4 |
| `Tahsilat.hesaba_gecti_mi` | `isCleared` | her tablo | X-1 |
| `uyari_gosterildi_mi` | `warningShown` | her tablo | X-4 §(6) |
| `OdemeYontemi.hesap_etiketi` | `accountLabel` | `PaymentMethod` | C-2 |
| `Urun.kdv_orani` · liste fiyatı · saklı stok | `vatRate` · `netListPrice` · `stock` | **yalnız `Product`** | C-6 · X-10 · ADR-005 |
| bayi tabloları | `Dealer` · `DealerPrice` · `DealerShipment` · `DealerShipmentItem` · `DealerPayment` | tablo | **X-8** |
| giriş denemesi tablosu | `LoginAttempt` | tablo | **X-9** |
| `PaymentAllocation` | `PaymentAllocation` | tablo | X-6 |

### Kaldırılanlar *(anti-şema listesinde değil — yalnız iz için)*

`CommissionPeriod` · `CommissionAdjustment` (GÇ-16) · `Congress*` (GÇ-4) · `SystemSetting` (GÇ-11) ·
`Product.netMinPrice` (GÇ-8) · `vatAmount` · `lineNetTotal` · `lineGrossTotal` · `netTotal` · `vatTotal` ·
`grossTotal` (GÇ-18) · `Order.dueDate` (GÇ-19) · `DoctorAssignment.fromDate`/`toDate` (X-17).
