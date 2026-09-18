# ADR-005 — Stok miktarı: saklanmaz, hareketlerden türetilir

- **Durum:** ✅ Kabul edildi
- **Tarih:** 16.09.2026
- **Kaynak soru:** `FAZ1_UYGULAMA_KAPSAMI.md` §C-x (PRD taraması — §E)
- **Bağlı KARARLAR maddeleri:** **B-4** (tek `hesaplaStok()` · inline `SUM` yasak · negatif stok yumuşak kısıt) · **A-4** (`konum_id` zorunlu) · **C-2** (`tarih?` parametresi) · **K-10** (`hesaplaStok()` izlenebilirliğin tek kapısı) · **B-7** (`DZL` hareketleri sayılır) · A-8 (`OnayBlogu`, `NEGATIF_STOK`) · A-14 (satır kilidi deseni) · RULE-08 ruhu
- **Uygulandığı commit:** **`CM`** (kolon kalkar, `hesaplaStok()` ilk sürümü) · negatif stok izi → Faz 1B madde 1/7

## Bağlam

Bugün stok miktarı `Product.stock` kolonunda saklanıyor (`MEVCUT_SISTEM_DURUMU.md` §3.1).
- Satıcı siparişi ve bayi sevkiyatı kolonu **koşullu `updateMany`** ile düşürüyor
  (`where stock >= qty`). Negatife düşüş bu yolla **reddediliyor** (RULE-01).
- Hareketler ayrıca `StockMovement`'e yazılıyor. Aynı bilgi iki yerde duruyor.
- Dashboard toplamı kolondan okunuyor (`_sum.stock`).

KARARLAR bu mekanizmanın dayandığı üç şeyi değiştirdi:
1. **Konum boyutu zorunlu** (A-4). Ürün düzeyinde tek sayı "hangi depoda?" sorusunu cevaplayamaz.
2. **Tarihli okuma** gerekiyor (C-2). Kolon yalnız "şu an"ı bilir.
3. **Negatif stok yumuşak kısıttır** (B-4 → GÇ-17). Koşullu `updateMany`'nin tek işi negatife
   düşüşü engellemekti; bu iş kalktı.

Soru: kolon önbellek olarak kalsın mı, yoksa kalksın mı?

## Karar

1. **Stok miktarı hiçbir tabloda saklanmaz.** `Product.stock` `CM`'de kalkar. Miktar yalnız
   hareketlerden türer: `StockMovement` · `KonsinyeCikis` · `StokTransfer` · `DZL` · açılış stoğu.
2. **Tek okuma yolu `hesaplaStok(urun, konum?, tarih?)`'tır** (B-4). Dashboard, ürün ekranı,
   sipariş akışı ve dışa aktarım hep bu fonksiyonu çağırır. `Product.stock` okuyan ve
   `_sum.stock` kullanan her yer `CM`'de bu fonksiyona bağlanır.
3. **Eşzamanlılık kilitle sıraya sokulur.** Bir ürün için stok hareketi yazan transaction, önce o
   ürünün satırını kilitler (`SELECT … FOR UPDATE`), sonra `hesaplaStok()` okur ve hareketi yazar.
   A-14 `BelgeSayac` satır kilidi deseniyle aynıdır. Böylece iki eşzamanlı yazım **aynı ön
   bakiyeyi göremez**. Negatife düşüş tespiti (`NEGATIF_STOK` bloğu) doğru satırda açılır.
4. **Negatife düşüş engellenmez** (B-4). Tespit ve `OnayBlogu` kaydı 1B'de yazılır (A-8).
5. **Performans önlemi indekstir, önbellek değildir.** Hareket tablosunda `(urun, konum, tarih)`
   bileşik indeksi bulunur. Ölçek sorunu ölçülürse yeni ADR yazılır (aşağıda).

## Sonuçlar

- **Tek doğruluk kaynağı hareketlerdir.**
  - *"Kolon ile Σ hareket tutmuyor"* sınıfındaki hata ortadan kalkar.
  - `DUZELTME_BRIFI.md` F-06'nın *"`hesaplaStok()` ile `Σ StockMovement` tutmalıdır"* kabulü
    tanım gereği sağlanır.
  - F-06'nın asıl sınadığı şey artık **kilit sırası** ve **blok kaydıdır**.
- **`CM` `hesaplaStok()`'ın ilk sürümünü doğurur** (`FAZ1_UYGULAMA_KAPSAMI.md` §D.1 not 3-c).
  - Kolon kalkınca onu okuyan kod derlenmez.
  - İlk sürüm hareket toplamıdır ve `konum?` ile `tarih?` parametrelerini taşır.
- **GÇ-17'nin kod tarafı `CM`'e kayar.** Koşullu `updateMany` kolonla birlikte gider.
- **`CM` → 1B arası kabul edilen borç (R-10).**
  - Bu arada negatife düşüş **ne engellenir ne izlenir**. İz 1B madde 1/7'de `OnayBlogu` ile gelir.
  - Canlı veri yoktur ve 1A canlıya çıkmaz.
- **Test:** `hesaplaStok()` ilk sürümü birim/entegrasyon testiyle sınanır; sayı `CM`'de beyan edilir
  (§D.2). F-06 1B'de kilit + blok kaydı üzerinden yeniden tanımlanır.
- **Anti-şema:** `Product.stock` tablo + kolon çiftiyle §D.2 listesine eklenir.

## Değerlendirilen alternatifler

- **Kolon önbellek olarak kalır** (hareketle aynı transaction'da güncellenir). Reddedildi:
  - Konum ve tarih sorularına cevap vermez; `hesaplaStok()` yine hareketlerden hesaplamak zorundadır.
    Kolon yalnız *"toplam, şu an"* için kalır.
  - İki doğruluk kaynağı bir tutarlılık testi ve bir onarım yolu gerektirir. `YOL_HARITASI.md` Ü-7
    gece kontrolcüsüne iş yükler.
  - B-7 `DZL`, `KonsinyeCikis`, `StokTransfer` ve açılış stoğunun **her birinin** kolonu
    güncellemesi gerekir. Unutulan bir yol sessiz yanlış üretir (§0.1).
- **Konum bazlı önbellek tablosu** (ürün × konum miktarı). Reddedildi: tarih sorusunu yine
  karşılamaz ve aynı iki kaynak sorununu taşır. Ölçek gerektirirse bu ADR'nin yerini alacak
  seçenek budur.

## Açık uygulama kalemleri (atıf)

- `Product.stock` okuma ve yazma noktalarının sayısı → `MEVCUT_SISTEM_DURUMU.md`'den, `CM` talimatında.
- Kilidin tam biçimi (ürün satırı mı, ürün × konum mu) → 1B madde 1.
- F-06 testinin yeniden yazımı → 1B madde 8.

## Geçerlilik sınırı

Tek kurulumdaki hareket sayısı `hesaplaStok()`'u ölçülebilir biçimde yavaşlatırsa (sipariş ekranı
yanıt süresi) bu ADR yeniden değerlendirilir. **Yeni ADR yazılır**; kararın ilkesi korunur: önbellek
**türetilmiş** olur ve tek yazım yolundan beslenir.
