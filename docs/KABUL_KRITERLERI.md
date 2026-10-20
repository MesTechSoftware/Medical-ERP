# Kabul Kriterleri — Medikal Satış Operasyon
<!-- Belge sınıfı: 2 · Plan (YOL_HARITASI.md §7.1-A) · Tetikleyici: karar değişince ve faz geçişinde -->

> **Durum: iskelet (C10, Faz 1A).** Kriter kodları ve boş satırlar. Her kriterin metni, ilgili işi
> yapan **Faz 1B görevinde, testten önce** yazılır (KARARLAR X-7 §(6)).
> **Yerini aldığı belge:** `docs/arsiv/PRD_V2.md` (X-7 §(1)) — arşivdedir, atıf yapılmaz.

## Kurallar (KARARLAR X-7)

- **Kriter karar vermez, doğrulama yolunu yazar.** Yalnız test edilebilir davranış cümlesi taşır;
  gerekçe, tartışma, alternatif ve mevzuat notu **içermez** — onların yeri `KARARLAR.md`'dir (§(3)).
- **Numara karar kimliğinden türer:** `<karar-kodu>-<sıra>` — `A-3-1`, `X-1-4`. Karar çerçevesinden
  doğan kriter `§0.2-1` biçimindedir. `FR-*` numaralandırması terk edildi (§(4)).
- **Her kriterin tek sahibi vardır:** davranışı doğuran karar. Diğer kararlar satır içinde anılır (§(4)).
- **Bakım:** yeni karar → aynı turda kriter türetilir. Kriteri olmayan karar doğrulanamaz; kararı
  olmayan kriter kaynaksızdır ve silinir (§(7)).
- **Matris:** kriter × kod × test × karar eşlemesi `TRACEABILITY.md`'dedir; 1B madde 10'da yeniden
  kurulur (§(5)). Bu dosya kanıt tutmaz.

**Yazılacağı yer** kolonu: `1B-n` = `FAZ1_UYGULAMA_KAPSAMI.md` §D.3 madde n · `1A-…` = Faz 1A'da
şemayla veya testle zaten karşılandı (kriter metni yine 1B'de yazılır, testine bağlanır) ·
**süreç** = yazılımla değil, devreye alma veya sözleşmeyle doğrulanır (`YOL_HARITASI.md` §5.2) ·
**konusuz** = başka kararla düştü, kriter türetilmez.

---

## §0 · Karar çerçevesi

| Kod | Kriter | Yazılacağı yer |
|---|---|---|
| §0.2-1 | | 1B-7 *(kayıt silinmez, düzeltme ters kayıttır)* |
| §0.3-1 | İş kuralı ihlali üç kademeden biriyle bildirilir ve akışı en yüksek kademe belirler: `SERT` → `ENGELLENDI` (kayıt oluşmaz) · `YUMUSAK` → `ONAY_GEREKLI` (yetki + zorunlu gerekçeyle devam; `OnayBlogu`, A-8) · `BILGI` → `BASARILI_UYARILI` (işlem tamamlanır) · ihlal yoksa `BASARILI`. Salt kayıt alanı bildirim üretmez. | 1B-4 · `sonuc.test.ts` · `onay-blogu.itest.ts` |
| §1.3-1 | Modülün açık/kapalı durumu yalnız `modulAcikMi(kod)` ile okunur; kod kataloğu `policy.modules` anahtarlarıdır. `policy.modules`'u başka dosya okumaz, modül durumu `process.env`'den okunmaz (§1.3 §(4), K-9). | 1B-1 · `modul.test.ts` · `tek-cagri.test.ts` |

## K · Kurumsal ve ticari

| Kod | Kriter | Yazılacağı yer |
|---|---|---|
| K-1-1 | — | konusuz (K-6) |
| K-2-1 | `hesaplaDoktorBakiye(doktor, tarih?)` = Σ borç − Σ alacak; bütün cari hareket tipleri (`ACILIS`, `VADE_FARKI`, `TERS_KAYIT` dahil) bakiyeye girer — sayılan belgeler filtresi uygulanmaz (X-11 §(6)). | 1B-1 · `bakiye.itest.ts` |
| K-2-2 | Negatif bakiye avanstır ve yönü `ALACAK`'tır; ayrı avans kaydı yoktur. Ekranda çıplak negatif sayı gösterilmez, tutar yön etiketiyle gösterilir. | 1B-1 · `bakiye.itest.ts` · doktor detay ekranı |
| K-2-3 | `tarih` verilirse sonuç o günün İstanbul günü sonu itibarıyladır: o günün hareketi dahil, ertesi günün hareketi hariç (C-2 §(3), E-1 §(5)). | 1B-1 · `bakiye.itest.ts` |
| K-2-4 | Cari hareket tutarını toplayan tek kod `src/lib/doctor-cari.ts`'tedir; başka dosya `LedgerEntry` toplamı almaz (K-2: tüm ekranlar tek fonksiyonu çağırır). | 1B-1 · `tek-cagri.test.ts` |
| K-3-1 | — | konusuz (A-8) |
| K-4-1 | Fatura hazırlık veri seti sevkiyat satırından üretilir ve sayılan belgeler filtresinden geçer (bedelsiz satır ve iptal sipariş çıkmaz); dönemi sevk günüdür. Muhatap A-13 alanlarındandır (VKN/TCKN, cari tipi, fatura unvanı, vergi dairesi, adres); tutarlar `hesaplaSatirTutarlari()`'ndan, her sevkiyat kendi satırlarını yuvarlar. Sütun adları ve sırası `export.sablonTanimi`'nden gelir — şablon görünümü değiştirir, içeriği değil; kodda standart şablon yoktur, şablon tanımsızken dosya verilmez ve kütüğe yazılmaz. Sevk günü `export.faturaGeriyeDonukUyariGun` (7) günden eski satır varsa `BILGI` · `FATURA_GERIYE_DONUK` döner (tam 7 gün sınırdır); çıktı engellenmez. Çıktı UBL değildir, imzalanmaz, gönderilmez. | 1B-6 · `disa-aktarim.itest.ts` |
| K-5-1 | | 1A-C8 *(izlenebilirlik alanı yok)* |
| K-6-1 | Kongre modülü kapalı teslim edilir: `modulAcikMi("congress")` `false` döner (`policy.modules.congress`). | 1B-1 · `modul.test.ts` |
| K-7-1 | | 1B-7 *(D-6)* · süreç *(yazılı teyit)* |
| K-8-1 | — | süreç |
| K-9-1 | | Faz 2–3 *(yedek, restore tatbikatı)* |
| K-10-1 | | 1A-C8 *(ÜTS alanı yok)* |

## A · Ticari akış

| Kod | Kriter | Yazılacağı yer |
|---|---|---|
| A-1-1 | İade ayrı belgedir (`IAD`); sipariş ve sevkiyat değişmez. Satır sipariş satırına referansla miktar taşır; iade edilebilir = sevk edilen − önceki iadeler (aşan → `SERT` `IADE_MIKTARI_ASILDI`, kilit altında; eşzamanlı iki iade aşamaz). Sebep zorunludur. Satır KDV oranını ve satırın en son sevkiyatının prim oranını dondurur. Aynı transaction'da depoya stok girişi ve aynı numarayla `IADE` · `ALACAK` cari hareketi (`hesaplaSatirTutarlari()`, vadesiz) yazılır; bedelsiz satırın iadesi alacak doğurmaz. `YONETICI` ve `OPERASYON` girer. | 1B-7d · `iade.itest.ts` · `e2e/admin/iade.spec.ts` · `yetki.test.ts` |
| A-1-2 | İade ciro ve hakedişi iade belgesinin tarihinde düşürür: iade satırı aynı hesapla, donmuş oranla ters satır olarak yazılır (`ters`, yuvarlama işaretten önce); sevkiyatın dönemi değişmez. Ortalama iskonto yalnız sevk satırlarından türer. | 1B-7d · `iade.itest.ts` · `satir-tutarlari.test.ts` |
| A-2-1 | Bedelsiz satır sipariş satırında bayrak + kapalı listeden sebep taşır (`NUMUNE` · `PROMOSYON` · `MAL_FAZLASI` · `DIGER`; `DIGER`'de açıklama zorunlu — sunucuda `SERT`, veritabanında `CHECK`). Birim fiyatı 0, liste fiyatı görünür kalır; stoktan düşer, borç ve prim doğurmaz (A-3-1, X-14-2). Bedelli satır sebep taşımaz. | 1B-7d · `orders.itest.ts` · `sevkiyat.itest.ts` |
| A-2-2 | Numune onaysız kaydolur. Diğer sebepler gerekçesiz `ONAY_GEREKLI` · `YUMUSAK` `BEDELSIZ_ONAYI` döner (sipariş ve numara yazılmaz); gerekçeyle sipariş kaydolur ve siparişe kararsız blok açılır. Siparişin son `BEDELSIZ_ONAYI` bloğu kararsızsa sevkiyat `ONAY_BEKLIYOR`, `RED`'se `ONAY_REDDEDILDI` ile durur; `ONAY`'dan sonra sevk edilir. | 1B-7d · `orders.itest.ts` · `sevkiyat.itest.ts` · `e2e/seller/orders.spec.ts` |
| A-3-1 | Bir sipariş satırına birden çok sevkiyat bağlanabilir; sevkiyat yalnız `ONAYLI` · `HAZIRLANIYOR` siparişte, kalem başına kalan miktarı aşmayan tam sayıyla yazılır (aşım ve geçersiz miktar `SERT`, hiçbir kayıt ve numara yazılmaz). Doktor borcu, stok çıkışı ve prim oranı sevkiyat anında aynı transaction'da doğar: `SVK` numarası · sevkiyat satırları · kaynağı sevkiyat olan stok çıkışı · `SEVKIYAT` · `BORC` cari hareket (tutar sevk edilen satırların `hesaplaSatirTutarlari()` toplamı, her sevkiyat kendi yuvarlaması; yalnız bedelsiz satırlı sevkiyat borç doğurmaz). Sipariş stok düşürmez. Bütün kalemler sevk edilince sipariş `KARGOLANDI` olur. Aynı siparişin eşzamanlı iki sevkiyatı kalanı aşamaz; sevkiyatı olan sipariş iptal edilemez (eşzamanlı iptal dahil) — iade sürecidir. | 1B-7 · `sevkiyat.itest.ts` · `orders.itest.ts` · `sevkiyat.spec.ts` |
| A-4-1 | `KonsinyeCikis` (`KNS`) malı depodan doktorun konsinye konumuna taşır; konum doktor başına tektir ve ilk çıkışta açılır (veritabanında `UNIQUE` + `KONSINYE` ↔ doktor `CHECK`). Mali sonucu yoktur: cari hareket yazılmaz, hareketler sayılan stok hareketi değildir. Kaynak eksiye düşecekse `OPERASYON` `SERT` `NEGATIF_STOK_YONETICI_GEREKIR` alır; `YONETICI` gerekçesiz `YUMUSAK`, gerekçeyle kaydeder ve belgeye `ONAY`'lı blok yazılır (A-4 eki 20.10). `YONETICI` ve `OPERASYON` girer. Satıcının sipariş formu satılabilir (depo) stoğu gösterir. | 1B-7d · `stok-transfer.itest.ts` · `e2e/admin/konsinye.spec.ts` |
| A-5-1 | `TEKLIF` aşamasındaki siparişin satırları sayılan sipariş ve sayılan sevk satırı kümesine girmez. | 1B-1 · `sayilan-belgeler.itest.ts` |
| A-5-2 | `IPTAL` durumundaki sipariş sayılmaz (X-6 §(9), K-1). | 1B-1 · `sayilan-belgeler.itest.ts` |
| A-5-3 | Bedelsiz satır (A-2) sayılan sevk satırı kümesine girmez. | 1B-1 · `sayilan-belgeler.itest.ts` |
| A-5-4 | `ACILIS` ve `VADE_FARKI` cari hareketleri sayılan cari hareket kümesine girmez; bakiye hesabı bu filtreyi kullanmaz (A-6, A-7, X-11 §(6)). | 1B-1 · `sayilan-belgeler.itest.ts` |
| A-5-5 | Konsinye çıkış, stok transferi ve stok düzeltmesinden doğan stok hareketi sayılan stok hareketi değildir (A-4, B-7). | 1B-1 · `sayilan-belgeler.itest.ts` |
| A-5-6 | Ciro raporları sevk satırlarını yalnız bu filtreyle okur (K-4 §(2), X-1 §(5)); `TEKLIF`, iptal ve bedelsiz satır ciroya yansımaz. | 1B-1 · `reports-service.itest.ts` |
| A-6-1 | | 1B-7 |
| A-7-1 | Borç doğuran cari harekette vade tarihi vardır ve sevk gününden işler: vade = sevk günü (İstanbul takvim günü) + siparişin `odeme_vadesi_gun`'ü. Vade farkı otomatik hesaplanmaz. *(`VADE_FARKI` elle giriş akışı 1B-7 tek cari ekranıyla.)* | 1B-7 · `sevkiyat.itest.ts` |
| A-8-1 | `acikBlokVarMi(belgeTipi, belgeId)` her kural kodu için belgenin **son** bloğuna bakar: kararı verilmemiş ya da `RED` ise `true` döner; blok yoksa ya da her kuralın son bloğu `ONAY`'lıysa `false`. Kurallar ayrı değerlendirilir; başka belgenin bloğu sonucu etkilemez. | 1B-1 · `onay-blogu.itest.ts` |
| A-8-2 | `blokKontrolleriniCalistir()` ihlal yoksa `BASARILI` döner ve blok yazmaz. | 1B-1 · `onay-blogu.itest.ts` |
| A-8-3 | İhlal varsa ve gerekçe boşsa (yalnız boşluk dahil) `ONAY_GEREKLI` · `YUMUSAK` döner, **bütün** ihlaller sonuçtadır (X-4 §(7)); blok yazılmaz. | 1B-1 · `onay-blogu.itest.ts` |
| A-8-4 | Gerekçe varsa ve kullanıcı `YONETICI` değilse kural kodu başına bir açık blok yazılır (açan + gerekçe); sonuç `BASARILI_UYARILI`, `onayaGonderildi = true`. Aynı belge ve kural için açık blok varsa ikincisi açılmaz; son bloğu `RED` olan kural için yeni blok açılır ve belge yeniden onaya gider. | 1B-1 · `onay-blogu.itest.ts` |
| A-8-5 | Gerekçe varsa ve kullanıcı `YONETICI` ise blok yazılır ve aynı işlemde `ONAY` ile kapanır (karar veren = açan, karar notu = gerekçe); `onayaGonderildi = false`, `acikBlokVarMi` `false`. Önceden açık kalmış bloğa burada karar verilmez; o durumda `onayaGonderildi = true`. | 1B-1 · `onay-blogu.itest.ts` |
| A-8-6 | `OnayBlogu` yalnız `src/lib/onay-blogu.ts`'te yazılır. | 1B-1 · `tek-cagri.test.ts` |
| A-8-7 | Sevkiyat stoğu sıfırın altına düşürecekse ve gerekçe yoksa `ONAY_GEREKLI` · `YUMUSAK` `NEGATIF_STOK` döner (ürün adı ve işlem sonrası stok); belge numarası, sevkiyat, stok/cari hareketi ve blok yazılmaz. Sipariş girişi stok denetlemez (A-8 eki 20.10). | 1B-7c · `sevkiyat.itest.ts` |
| A-8-8 | `YONETICI` gerekçeyle sevk eder: sevkiyat yazılır, siparişe (`SIP`) bağlı `NEGATIF_STOK` bloğu aynı işlemde `ONAY` alır. Ekrandan girilen kısmi miktar gerekçe diyaloğundan sonra korunur. | 1B-7c · `sevkiyat.itest.ts` · `e2e/admin/onay.spec.ts` |
| A-8-9 | Diğer rol gerekçe yazarsa sevkiyat, numara ve hareket yazılmaz; yalnız açık blok yazılır, sonuç "onaya gönderildi"dir. Kararı verilmemiş blok varken sipariş kimse tarafından sevk edilemez (`SERT` `ONAY_BEKLIYOR`). Son blok `ONAY` ise siparişin sonraki sevkiyatları sorulmadan yapılır. | 1B-7c · `sevkiyat.itest.ts` · `e2e/operasyon/operasyon.spec.ts` |
| A-8-10 | `RED`'den sonra stok hâlâ yetmiyorsa gerekçesiz sevk yeniden `ONAY_GEREKLI` döner, yeni gerekçe yeni blok açar (eski blok iz olarak kalır); stok yetiyorsa sevkiyat sorulmadan yapılır. Karar yalnız `YONETICI`'nindir, karar notu zorunludur ve koşullu yazılır: kararlı bloğa ikinci karar yazılmaz. | 1B-7c · `sevkiyat.itest.ts` · `e2e/admin/onay.spec.ts` · `yetki.test.ts` |
| A-9-1 | | 1A-C8 *(kurum tablosu yok)* |
| A-10-1 | | 1B-5 |
| A-11-1 | Tahsilatta ödeme yöntemi zorunludur; komisyon oranı yöntemden kayda kopyalanır ve donar, komisyon tutarı oran × tutar (2 hane, yarım sıfırdan uzağa). Tahsilat, belgeyle aynı transaction'da ve aynı `THS` numarasıyla `TAHSILAT` cari hareketi yazar (yönü tahsilattan, tutarı brüt); komisyon cariye dokunmaz. Kasa/banka bakiyesi tutulmaz. | 1B-7 · `collections.itest.ts` · `satir-tutarlari.test.ts` |
| A-12-1 | `hesaplaDoktorRisk(doktor)` = cari bakiye (`hesaplaDoktorBakiye` ile aynı tanım; avans riski düşürür) + açık sipariş tutarı. Açık sipariş, sayılan sipariş kümesidir (`ONAYLI`, iptal edilmemiş — A-5); `TEKLIF` ve `IPTAL` sipariş riske girmez. Eşleştirme kullanılmaz (X-11 §(8)). | 1B-1 · `risk.itest.ts` |
| A-12-2 | Açık sipariş tutarı yalnız **sevk edilmemiş miktarı** sayar: satır miktarı − sevk satırlarındaki miktar. Tamamen sevk edilmiş satır riske girmez; kısmi sevkte kalan miktar girer. | 1B-1 · `risk.itest.ts` |
| A-12-3 | Risk tabanı brüttür: açık satır tutarı `hesaplaSatirTutarlari()` toplamıdır (KDV dahil, satır bazında yuvarlanmış — C-6 §(5)). Bedelsiz satır riske girmez (A-2). | 1B-1 · `risk.itest.ts` |
| A-12-4 | `kredi_limiti` boşsa doktor limitsizdir, aşım yoktur. Limit doluysa risk limitten **büyükse** aşım vardır; eşitlik aşım değildir. Fonksiyon işlemi durdurmaz — aşım bilgi kademesidir (§0.3). | 1B-1 · `risk.itest.ts` |
| A-13-1 | | 1B-7 |
| A-14-1 | `uretBelgeNo(onek, tx)` `{ÖNEK}-{YIL}-{SIRA}` biçiminde, sırası 6 hane sıfır dolgulu numara üretir; her önek ayrı sayılır (A-14 §(1)/(2)). | 1B-2 *(1A-CM)* · `kisitlar.itest.ts` |
| A-14-2 | Eşzamanlı transaction'lar aynı numarayı alamaz; numara sayaç satırının kilidi altında alınır (A-14 §(3)). | 1B-2 *(1A-CM)* · `kisitlar.itest.ts` |
| A-14-3 | Numara belgeyi yazan transaction'ın içinde alınır: transaction geri alınırsa sayaç ilerlemez, boşluk oluşmaz (A-14 §(3)). `uretBelgeNo` transaction istemcisi olmadan çağrılamaz (tip). | 1B-2 *(1A-CM)* · `kisitlar.itest.ts` |
| A-14-4 | Yıl, kayıt anının **İstanbul** takvim yılıdır ve her yıl sayaç 1'den başlar: 31 Aralık 23:59 (İstanbul) eski yılın, 1 Ocak 00:01 yeni yılın serisinden numara alır (A-14 §(5), E-1 §(3)). | 1B-2 · `belge-no.itest.ts` |
| A-14-5 | Sayaç tablosuna yalnız `src/lib/belge-no.ts` dokunur; kaynakta elle kurulmuş belge numarası (`"SIP-…"` gibi önekli metin) yoktur — `MAX(belge_no)+1` dahil başka üretim yolu yoktur (A-14 §(3)/(4)). | 1B-2 · `tek-cagri.test.ts` |
| A-15-1 | Tahsilat kaydında aynı cari + aynı `Europe/Istanbul` günü + `tip = NAKIT` + aynı yön, iptal edilmemiş tahsilatların toplamı `finance.nakitTevsikLimiti`'ni **aşarsa** (eşitlik aşım değildir) aşan işlem dâhil `BILGI` · `NAKIT_TEVSIK_LIMITI` döner: kayıt yazılır, `OnayBlogu` üretilmez, toplam saklanmaz. Limit `null` iken uyarı yoktur. Uyarı metni neyi değerlendirmediğini yazar (kısım kısım ödeme); sistem "uygundur" demez. | 1B-4 · `collections.itest.ts` · `sonuc.test.ts` |

## B · Ürün ve stok

| Kod | Kriter | Yazılacağı yer |
|---|---|---|
| B-1-1 | | 1A-C8 *(kapsam dışı — lot/SKT alanı yok)* |
| B-2-1 | | 1A-C8 *(kapsam dışı)* |
| B-3-1 | | 1A-C8 *(barkod alanı ve tablosu yok)* |
| B-4-1 | `hesaplaStok(urun, konum?, tarih?)` = Σ giriş − Σ çıkış hareketi; `konum` verilirse yalnız o konum, `tarih` verilirse o günün İstanbul günü sonu itibarıyla (C-2 §(3), E-1 §(5)). | 1B-1 *(1A-CM: ilk sürüm)* · `kisitlar.itest.ts` |
| B-4-2 | Stok hareketi yalnız `stokHareketiYaz()` ile yazılır. Fonksiyon önce hareketin ürün satırlarını **id sırasıyla** kilitler, sonra stoğu okur ve yazar (ADR-005 §3, ADR-008 §(1)/(3)). Belge numarası alan akışta ürün kilidi `uretBelgeNo()`'dan önce alınır (ADR-008 §(1)). `FOR UPDATE` ve stok hareketi yazımı başka dosyada yoktur (ADR-008 §(6)). | 1B-1 · `tek-cagri.test.ts` · `stok.itest.ts` |
| B-4-3 | Negatife düşüş engellenmez: hareket yazılır. Yazımdan sonra stoğu sıfırın altında kalan ve o yazımda **çıkış alan** her ürün × konum `NEGATIF_STOK` kalemi olarak döner (önceki ve sonraki miktarla). Giriş alan ya da sıfırda kalan konum kalem değildir. | 1B-1 · `stok.itest.ts` |
| B-4-5 | `StokTransfer` (`TRF`) konumdan **depoya** taşır (hedef depo değilse ya da kaynak = hedefse `SERT` `TRANSFER_KONUMU_GECERSIZ`); mali sonucu yoktur. Negatif stok kuralı A-4-1 ile aynıdır. Tek depoda hedef seçimi gösterilmez. | 1B-7d · `stok-transfer.itest.ts` · `e2e/admin/konsinye.spec.ts` |
| B-4-4 | Aynı ürüne eşzamanlı iki çıkış aynı ön stoğu göremez: ikinci yazım birincinin commit'ini bekler ve onun sonucunu okur (ADR-008 §(6), F-06). | 1B-1 · `stok.itest.ts` |
| B-5-1 | Fiyat satırı belge gününde geçerliyse seçilir: aralık yarı açıktır (`gecerli_baslangic` dahil, `gecerli_bitis` hariç), boş uç süresizdir. Aynı liste + ürün + `min_adet` için tarih aralıkları çakışamaz (DB `EXCLUDE`). Günde geçerli satır yoksa fiyat çözümlenemez; son fiyata düşülmez. | 1B-5 · `fiyat.itest.ts` · `kisitlar.itest.ts` |
| B-6-1 | Barem `min_adet` alt sınır satırlarıyla kurulur, üst sınır yoktur: satır miktarını karşılayan **en yüksek** `min_adet`'li satır seçilir; miktarı karşılayan satır yoksa fiyat çözümlenemez. Barem sipariş satırının miktarına bakar (kümülatif değil); çözülen fiyat satıra `liste_fiyat` olarak donar. | 1B-5 · `fiyat.itest.ts` · `orders.itest.ts` |
| B-7-1 | Stok düzeltme (`DZL`) yalnız `YONETICI`'dedir (action `requireAdmin`, servis başka rolde teknik hata). Belge çok satırlıdır: ürün · konum · ± fark (sıfır ve tam sayı olmayan `SERT`) · aktif sebep (tanım tablosu; pasif `SERT`) · açıklama (zorunlu). Tutanak no salt kayıttır. Belge tarihi kayıt anıdır. Mali sonucu yoktur ve düzeltmenin kendisi `OnayBlogu` üretmez; denetim kaydı yazılır. Negatif stokta gerekçesiz `YUMUSAK`, gerekçeyle yazılır ve `NEGATIF_STOK` bloğu aynı işlemde `ONAY` alır. | 1B-7d · `stok-duzeltme.itest.ts` · `e2e/admin/stok-duzeltme.spec.ts` · `yetki.test.ts` · `e2e/operasyon/operasyon.spec.ts` |
| B-7-2 | Stok veri seti, miktar satırlarına ("Bakiye") ek olarak seçilen günün takvim yılı başından gün sonuna kadarki her `DZL` satırını "Düzeltme" işaretiyle, sebep, belge no, tutanak no ve açıklamayla verir; önceki yılın ve gün sonrasının düzeltmesi çıkmaz (B-7 eki 20.10). | 1B-7d · `disa-aktarim.itest.ts` |

## C · Mali ve yasal

| Kod | Kriter | Yazılacağı yer |
|---|---|---|
| C-1-1 | | 1B-7 *(`harici_irsaliye_no`)* · süreç *(teyit metni)* |
| C-2-1 | | 1B-6 |
| C-3-1 | | 1B-7 *(belgesiz doktor silme istisnası)* · 1A-CM *(audit VKN gizleme)* |
| C-4-1 | — | konusuz (K-6) |
| C-5-1 | | 1A-C8 *(para birimi alanı yok)* |
| C-6-1 | Satır hesabı ve yuvarlama tek fonksiyondadır (`hesaplaSatirTutarlari()`): matrah = birim fiyat × miktar ve KDV = matrah × oran, her ikisi 2 hane yarım sıfırdan uzağa; toplam = matrah + KDV. Belge toplamı satır toplamlarının toplamıdır, yeniden yuvarlanmaz. Bedelsiz satırın matrahı ve KDV'si 0'dır, iskonto ortalamasına girmez. Kısmi sevkiyatta her sevkiyat kendi matrah ve KDV'sini yuvarlar. Oran satıra değer olarak donar. | 1B-5 · `satir-tutarlari.test.ts` · `orders.itest.ts` |
| C-7-1 | | Faz 2–3 *(K-9)* |

## D · Operasyon

| Kod | Kriter | Yazılacağı yer |
|---|---|---|
| D-1-1 | | 1B-7 *(olay noktaları, boş handler)* |
| D-2-1 | Roller üç değerli kapalı katalogdur. `OPERASYON` giriş yapar; ana sayfası Dashboard'dur. Sipariş hazırlama, teslim ve iptal, kargolama, tahsilat kaydı ve iptali, stok girişi `YONETICI` ve `OPERASYON` içindir. Ürün açma/düzenleme/silme, satıcı ekleme/düzenleme/silme, doktor devri ve vade değişikliği yalnız `YONETICI` içindir; yetkisiz rolün çağrısı **sunucuda** reddedilir. `OPERASYON` Raporlar ve Denetim kaydı ekranlarına giremez, menüsünde görmez; ürünleri, cariyi ve satıcıları salt okur — ekleme/düzenleme sayfaları onu ana sayfasına yönlendirir. `SATICI` yönetim ekranlarına giremez. *Sipariş girişi ekranı 1B-7'dedir.* | 1B-3 · `yetki.test.ts` · `operasyon.spec.ts` |
| D-3-1 | | 1B-7 |
| D-4-1 | Hakediş yalnız satırın matrahı ve satıra donmuş oranla hesaplanır; satıcının dönem cirosu, hedefi ya da kotası oranı değiştirmez — aynı sevkiyat satırı hangi dönem toplamı içinde okunursa okunsun aynı hakedişi verir. | 1B-3 · `reports-service.itest.ts` |
| D-5-1 | Dışa aktarım yalnız `calistirDisaAktarim()` ile çalışır ve `{ kolonlar, satirlar }` döner; format katmanı (XLSX, CSV) iş kavramı tanımaz. Katalog kodda kapalıdır: cari hareket · tahsilat · sipariş · stok · doktor listesi · fatura hazırlık (K-4-1). Aralık okuyanlar (cari hareket, tahsilat, sipariş, fatura hazırlık) dönem ister — yarı açık `[başlangıç, bitiş)` İstanbul günü, ekranda bitiş günü dahil okunur; "tüm zamanlar" bilinçli seçimdir. Stok tek gün sonu itibarıyla miktar verir, tutar kolonu yoktur, sıfır satır çıkmaz. Sipariş sayılan belgeler filtresinden geçer, tutarlar `hesaplaSatirTutarlari()`'ndandır, bedelsiz satır işaretli ve KDV'sizdir. Cari hareket mutabakat için açılış ve vade farkı dahil bütün hareketleri tipiyle verir. Tarih kolonları `YYYY-AA-GG`, tutar kolonlarının başlığı tabanlıdır. Metin hücresi formül olarak yorumlanmaz. Yalnız `YONETICI` çalıştırır; dosya sunucuda saklanmaz. | 1B-6 · `disa-aktarim.itest.ts` · `disa-aktarim-yazici.test.ts` · `disa-aktarim.spec.ts` · `yetki.test.ts` · `operasyon.spec.ts` |
| D-5-2 | Her dışa aktarım veritabanındaki kütüğe yazılır: zaman, kullanıcı kimliği, veri seti kodu, parametreler (dönem/gün, biçim), satır sayısı. Satır içeriği, ad, VKN ve tutar yazılmaz. Kütük yazılamazsa dosya verilmez; reddedilen istek kütüğe yazılmaz. Kütüğün ekranı yoktur; kütüğe yalnız dışa aktarım action'ı yazar. | 1B-6 · `disa-aktarim.itest.ts` · `tek-cagri.test.ts` |
| D-6-1 | | 1B-7 |

## E · Teknik çerçeve

| Kod | Kriter | Yazılacağı yer |
|---|---|---|
| E-1-1 | | 1B-1 *(nokta/aralık okuma)* · 1A-CM *(`zaman.ts` testli)* |
| E-2-1 | Oturum veritabanındadır. Girişte 256-bit rastgele bir token üretilir; veritabanında token değil yalnız SHA-256 hash'i durur. Çerez yalnız token taşır, `HttpOnly` ve `SameSite=Lax`'tır, canlıda `Secure`'dur. Her istekte çerezdeki token hash'lenip oturum tablosunda aranır; kullanıcının rolü ve aktifliği o anda okunur — rolü değişen kullanıcı bir sonraki istekte yeni rolüyle karşılanır. Bulunmayan, iptal edilmiş ya da pasif kullanıcıya ait oturum giriş sayfasına yönlendirir. Kodda `next-auth` ve imzalı çerez anahtarı yoktur. | 1B-4 · `oturum.test.ts` · `oturum.itest.ts` · `session-revocation.spec.ts` |
| E-2-2 | Hareketsizlik süresi `auth.oturumHareketsizlikSaat` (4 saat) **kayar**: son görülme anından itibaren sayılır. Mutlak süre `auth.oturumMutlakSaat` (12 saat) **kaymaz**: oturumun açılışından sayılır, hareketle uzamaz. Süresi dolan oturum giriş sayfasına yönlendirir. Son görülme anı her istekte değil, kayıt 5 dakikadan eskiyse yazılır. | 1B-4 · `oturum.test.ts` · `oturum.itest.ts` |
| E-2-3 | Kullanıcının pasifleştirilmesi açık oturumlarının hepsini **aynı transaction'da** iptal eder; pasifleştirilen kullanıcının açık sayfası bir sonraki istekte giriş sayfasına düşer, yeniden aktifleştirme eski oturumu geri getirmez. Çıkış yalnız o oturumu iptal eder. Oturum satırı silinmez, iptal zamanı yazılır (C-3). Oturum tablosuna yalnız oturum dosyası yazar. | 1B-4 · `oturum.itest.ts` · `tek-cagri.test.ts` · `session-revocation.spec.ts` |
| E-2-4 | Uygulamada route handler yoktur; her yazma server action'dır. Başka bir origin'den gönderilen server action çağrısı reddedilir ve etkisi olmaz. | 1B-4 · `csrf.spec.ts` |
| E-2-5 | Hesabı yalnız `YONETICI` açar; giriş sayfasında kayıt yolu yoktur. Açarken rol (`SATICI` · `OPERASYON` · `YONETICI`) seçilir; rol düzenleme formunda yoktur, açılıştan sonra değişmez. Açma, pasifleştirme ve parola sıfırlama gerekçesiz kaydedilmez; gerekçe denetim kaydına yazılır. Kullanıcı silinmez — silme yolu yoktur. `OPERASYON` Kullanıcılar ekranında yalnız satıcıları görür ve salt okur. | 1B-4 · `users.spec.ts` · `yetki.test.ts` |
| E-2-6 | Parola en az 8 karakterdir; yaygın parola listesindeki parola büyük/küçük harf farkı gözetilmeden reddedilir; karmaşıklık kuralı yoktur. Kural ve hash'leme tek dosyadadır (`parola.ts`); `bcrypt` başka dosyada çağrılmaz. | 1B-4 · `parola.test.ts` · `tek-cagri.test.ts` |
| E-2-7 | Yöneticinin verdiği parola geçicidir: açılan ya da parolası sıfırlanan hesap `parola_degistirmeli = true` olur. Bu kullanıcı korumalı her sayfadan ve server action'dan parola değiştirme sayfasına yönlenir; mevcut parolasını ve politikaya uyan, mevcut parolasından farklı yeni parolasını girince bayrak kalkar ve ana sayfasına gider. Bayrağı olmayan kullanıcı o sayfaya giremez. | 1B-4 · `oturum.itest.ts` · `parola-degistir.spec.ts` |
| E-2-8 | Parola sıfırlama, hedef kullanıcının açık oturumlarını **aynı transaction'da** iptal eder. | 1B-4 · `users.spec.ts` |
| E-2-9 | Kullanıcı kendi hesabını pasifleştiremez. Son aktif `YONETICI` pasifleştirilemez; iki yönetici eşzamanlı olarak birbirini pasifleştirirse en az biri reddedilir ve sistemde aktif bir `YONETICI` kalır. Reddedilen işlem hiçbir şey yazmaz. | 1B-4 · `kullanici.itest.ts` · `users.spec.ts` |
| E-3-1 | | 1B-7 *(dosya boyutu)* · 1A-C8 *(dosya alanı yok)* |

## X · Denetim sonrası kararlar

| Kod | Kriter | Yazılacağı yer |
|---|---|---|
| X-1-1 | `getSellerReports(kullanici, { baslangic, bitis })` dönemi zorunlu, yarı açık aralık olarak alır. Satıcı başına üç mutlak sayı döner, oran dönmez: **dönem cirosu** (matrah; sevkiyat tarihi dönemde olan, siparişin satıcısına ait, sayılan belgeler filtresinden geçen sevkiyat satırları) · **dönem hakedişi** (satır matrahı × satıra donmuş oran; oranı boş satır hakediş doğurmaz) · **dönem tahsilatı** (brüt; tahsilat tarihi dönemde olan aktif tahsilatlar, **tahsilat anında doktorun sahibi olan** satıcıya). Devir ve oran değişikliği geçmiş dönem raporunu değiştirmez. `SATICI` yalnız kendi satırını alır; `OPERASYON` çağırırsa reddedilir; `YONETICI` bütün satıcıları alır. Ekranın varsayılan dönemi içinde bulunulan aydır; "tüm zamanlar" ayrı seçimdir. `SATICI` kendi raporunu kendi ekranında görür. | 1B-3 · `reports-service.itest.ts` · `operasyon.spec.ts` |
| X-2-1 | Tahsilat kaydı ve `THS` numarası aynı transaction'dadır: tahsilat yazılamazsa numara harcanmaz, sonraki tahsilat aynı numarayı alır. `BAYI` carisinin tahsilatı aynı yoldan numaralanır (X-8 §(7)). Tahsilat kaydını yazan tek yer `recordCollection`'dır — ikinci tahsilat yolu yoktur. | 1B-2 · `collections.itest.ts` · `tek-cagri.test.ts` |
| X-3-1 | Beklenmeyen hatada kullanıcı üç şey görür: sabit açıklama, hata referansı, ana sayfaya dönüş bağlantısı. Hata mesajı, stack, SQL, Prisma mesajı ve alan adı ekrana yazılmaz; metin hangi kaydın söz konusu olduğunu ima etmez. Kök düzeyde `global-error.tsx` ve `error.tsx`, ayrıca sipariş/sevkiyat (`orders`, `shipping`, `my-orders`), tahsilat (`collections`) ve stok (`stock`) segmentlerinde `error.tsx` vardır; segment hatası menüyü kaybettirmez. | 1B-4 · `hata-yuzeyi.test.ts` |
| X-3-2 | Teknik hata container log'una tek JSON satırı olarak yazılır: zaman, referans, rota (sorgu dizesi olmadan), kullanıcı kimliği (adı değil), hata sınıfı, stack çerçeveleri. Hata mesajı, Prisma `meta`, sorgu/form değerleri yazılmaz. Ekrandaki referans log satırındakiyle aynıdır; veritabanında saklanmaz, belge numarası harcamaz. | 1B-4 · `hata.test.ts` |
| X-3-3 | Sessiz hata yoktur: server action'daki `catch` yalnız tanımlı iş hatalarını (iş kuralı hatası sınıfı, benzersizlik ihlali) kullanıcı mesajına çevirir, gerisini yeniden fırlatır — teknik hata iş mesajı kılığına girmez ve mesajı ekrana taşınmaz. Denetim kaydı işle **aynı transaction'da** yazılır; yazılamazsa iş geri alınır, hata yutulmaz. Hata sonrası telafi kodu yoktur. | 1B-4 · `hata-yuzeyi.test.ts` · `audit.itest.ts` · `collections.itest.ts` |
| X-4-1 | Her server action `IslemSonucu` döner: `durum` · `kademe` (bildirimlerin en yükseği) · `bildirimler` (`kademe` + `kural_kodu` + `parametreler`, `SERT`'te isteğe bağlı `alan`). İş hatası `throw` edilmez; transaction'ı geri almak için içeride fırlatılan `IsHatasi` action sınırında sonuca döner. `?error=` yönlendirmesi ve metin taşıyan hata alanı yoktur; iş hatası loglanmaz. Tek istisna yalnız yönlendiren çıkış action'ıdır. | 1B-4 · `sonuc.test.ts` |
| X-4-2 | Sunucu metin üretmez: kural kodu kodda kapalı bir katalogdur (`KURAL_KODLARI`) ve metni tek sözlüktendir (`sozluk.ts`); katalogdaki her kodun metni vardır, sözlükte katalog dışı kod yoktur. Action'lar sözlüğü okumaz; başka dosya kendi mesaj tablosunu tutmaz. | 1B-4 · `sonuc.test.ts` |
| X-4-3 | Bildirim yutulmaz: bir işlemin bütün bildirimleri kademeye göre sıralı döner ve gösterilir. Sipariş girişinde kalem hataları (fiyat çözümlenemedi, pasif ürün) ilkinde durmadan birlikte döner; sipariş ve belge numarası yazılmaz. | 1B-4 · `sonuc.test.ts` · `orders.itest.ts` |
| X-4-4 | Gösterim kademe başına tek desendir ve tek bileşendedir (`Sonuc.tsx`): `SERT` bildirim alanı olan formda alanın altında, alan işaretli (`aria-invalid`) ve form kutusunda tekrar edilmez; alanı olmayan ya da formda gösterilmeyen alanın bildirimi form kutusundadır. `YUMUSAK` onay diyaloğudur, gerekçe zorunludur. `BILGI` sonuç ekranında kapatılabilir şerittir. | 1B-4 · `is-sonucu.spec.ts` · `sonuc.test.ts` *(bileşen: `BILGI` şeridi başarı metniyle, `YUMUSAK` diyaloğu; `YUMUSAK` sipariş akışına 1B-7'de bağlanır)* |
| X-5-1 | Parasal alanlar `Decimal`'dir (birim fiyat 18,4 · tutar 18,2 · oran 5,2); `Decimal` üzerinde ham aritmetik yalnız `satir-tutarlari.ts` ve `fiyat.ts`'tedir (lint kuralı, CI). İstemciye parasal değer `formatla()` ile `string` gider. Miktar tam sayıdır; 4 haneden fazla ondalıklı fiyat reddedilir. İskonto oranı saklanmaz, türetilir; liste üstü satışta negatiftir. | 1B-5 · `eslint.config.mjs` · `money.test.ts` · `satir-tutarlari.test.ts` · `orders.itest.ts` |
| X-6-1 | Vade görünürlüğü tutar değil varlıktır: cari borçluyken (`hesaplaDoktorBakiye()` yönü `BORC`) vadesi bugünden (İstanbul günü) önce olan, ters kayıtla çevrilmemiş bir `BORC` hareketi varsa doktor kartında ve tahsilat sonucunda `BILGI` · `VADESI_GECMIS_HAREKET` en eski vadeyle gösterilir; vadesi bugün olan hareket geçmiş sayılmaz. Bakiye kapalı ya da alacaklıyken uyarı yoktur. Vadesi geçmiş tutar hiçbir yerde gösterilmez; metin tarihin o borcun açık olduğunu göstermediğini yazar (X-6 20.10 eki). | 1B-4 · `bakiye.itest.ts` · `collections.itest.ts` |
| X-7-1 | | 1B-10 *(matris yeniden kurulur)* |
| X-8-1 | `SATICI` `BAYI` carisini görmez (X-13-1) ve açamaz: satıcı ekranından açılan cari daima `DOKTOR`'dur. `BAYI`'yi yalnız `YONETICI` açar; `OPERASYON` cari açmaz. *Yönetici cari açma ekranı ve `hesap_sinifi` süzgeci 1B-7'dedir.* | 1B-3 · 1B-7 · `kapsam.itest.ts` · `yetki.test.ts` |
| X-9-1 | | 1A-C7b *(bellek içi sayaç testli)* |
| X-10-1 | Fiyat listesi carinin atanmış listesidir, atanmamışsa `pricing.varsayilanFiyatListesiKodu` listesidir. Atanmış listede ürünün uygun satırı yoksa varsayılana düşülmez → `SERT` `FIYAT_COZUMLENEMEDI`, satır kaydedilmez. *(Liste ekranı ve cari kartında atama 1B-7.)* | 1B-5 · `fiyat.itest.ts` · `orders.itest.ts` |
| X-11-1 | Borç ya da alacak doğuran her olay tek cari hareket satırı yazar: tutar pozitif, yön ayrı, kaynak belgenin numarasıyla ve belgeyle aynı transaction'da. Cari hareket yalnız `cari-hareket.ts`'te yazılır, satır silinmez; tutar, yön ve tip değişmez — düzeltme `TERS_KAYIT`'tır: çevirdiği satırın ters yönü, aynı tutar ve numara, o satıra bağ; bir satır en fazla bir kez çevrilir. Tahsilat iptali tahsilat hareketini ters kayıtla çevirir; eşzamanlı iki iptalden yalnız biri yazar. | 1B-7 · `collections.itest.ts` · `sevkiyat.itest.ts` · `tek-cagri.test.ts` |
| X-12-1 | | 1B-7 |
| X-13-1 | `kapsamliDoktorlariGetir(kullanici)` doktor okumasının kapsamını **sorgu süzgeci** olarak döner. `SATICI`'ya yalnız sahibi olduğu `DOKTOR` carileri döner — başka satıcının carisi, sahipsiz cari ve `BAYI` dönmez (X-8 §(3)). `YONETICI` ve `OPERASYON` bütün carileri görür. Satıcı ekranlarının doktor okumaları — doktor listesi, düzenleme sayfası, sipariş formu, hesabım, doktor güncelleme ve sipariş kaydı — bu süzgeçten geçer. Kapsam dışındaki cari bulunmamış gibi davranır, varlığı ima edilmez (X-3 §(8)). Satıcı rota grubunda sahip süzgeci elle yazılmaz (D-2 §(3)). | 1B-3 · `kapsam.itest.ts` · `tek-cagri.test.ts` |
| X-14-1 | Hakediş = sevkiyat satırının matrahı × satıra donmuş oran (`hesaplaSatirTutarlari()`, X-5 §(4)); tutar saklanmaz, raporda hesaplanır. Satıcının oranı sonradan değişirse geçmiş satırların hakedişi değişmez. `BAYI` ve bedelsiz satır hakediş doğurmaz. Oranın satıra yazılması X-14-2'dedir. | 1B-3 · 1B-7 · `satir-tutarlari.test.ts` · `reports-service.itest.ts` |
| X-14-2 | Uygulanan prim oranı sevkiyat anında sevkiyat satırına donar: satıcının özel oranı, yoksa `finance.primOraniVarsayilan`; `BAYI` carinin sevkiyatında ve bedelsiz satırda boştur. Oran sonradan değişse de donmuş değer değişmez. | 1B-7 · `sevkiyat.itest.ts` |
| X-15-1 | | 1B-7 |
| X-15-5-1 | | 1B-7 *(X-15 §(5) — telefon varsayımı)* |
| X-16-1 | | 1B-7 *(taslaklar: `docs/arsiv/KARAR_ONERISI_2026-09-19.md` §10)* |
| X-17-1 | Doktorun sahibi yalnız `degistirDoktorSahibi(doktorlar, yeniSahip | null, gerekce, tx)` ile değişir. Yeni sahip boş değilse aktif bir `SATICI`'dır (`SAHIP_AKTIF_SATICI_DEGIL`); `BAYI`'nin sahibi olmaz (`BAYI_SAHIP_ATANAMAZ`, ayrıca DB `CHECK`). Sahibi değişen her doktor için iz satırı (eski sahip, yeni sahip, yapan, zaman, gerekçe) ve denetim kaydı **aynı transaction'da** yazılır; transaction geri alınırsa ikisi de yazılmaz. Sahip alanına fonksiyon dışından yazan kod birim testte kırmızıdır. | 1B-3 · `sahiplik.itest.ts` · `tek-cagri.test.ts` *(1A-CM: ilk sürüm, `CHECK` ve FK testli)* |
| X-17-2 | Sahipliği değiştiren ve sipariş giren transaction ilgili doktor satırlarını **id sırasıyla**, ürün satırlarından ve belge sayacından önce kilitler (ADR-008). Aynı doktora eşzamanlı devir ve sipariş: devir önce kilidi alırsa sipariş bekler ve sahip değiştiği için `SAHIP_DEGISTI` ile reddedilir; sipariş önce kilidi alırsa devir bekler, sipariş eski sahibe yazılır. `FOR UPDATE` yalnız `stok.ts` ve `sahiplik.ts`'de geçer. | 1B-3 · `sahiplik.itest.ts` · `tek-cagri.test.ts` |
| X-17-3 | Devir cari listesinden **çoklu seçimle** yapılır; gerekçe bir kez girilir, her doktora ayrı iz satırı düşer. Seçimsiz ya da gerekçesiz devir kaydedilmez. Hedef "sahipsiz" olabilir. Devri yalnız `YONETICI` yapar. | 1B-3 · `doctor-transfer.spec.ts` |
| X-17-4 | Doktoru olan bir `SATICI` pasifleştirilirken portföy seçimi (**tek bir aktif satıcıya devret** ya da **sahipsiz bırak**) ve gerekçe zorunludur; seçim ya da gerekçe yoksa form kaydedilmez, satıcı aktif kalır. Seçimle pasifleştirme ve sahiplik değişikliği tek transaction'dır; formun gerekçesi her iz satırına yazılır. Yeniden aktifleştirilen satıcıya doktorlar geri dönmez. *Rol değişikliği ekranı Faz 1'de yoktur; açıldığında aynı yoldan geçer.* | 1B-3 · `sahiplik.itest.ts` · `seller-deactivation.spec.ts` |
| X-17-5 | Cari listesinde **"Sahipsiz" süzgeci** yalnız sahipsiz `DOKTOR` carilerini listeler. Sahipsiz uyarısındaki sayı bütün sahipsiz `DOKTOR`'ları sayar, yalnız açık sayfayı değil; `BAYI` sahipsiz sayılmaz. | 1B-3 · `doctor-transfer.spec.ts` |

## Ü · Ürünleştirme kararları

| Kod | Kriter | Yazılacağı yer |
|---|---|---|
| Ü-3-1 | Ekranda gösterilen her para tutarının yanında vergi tabanı yazılıdır (*KDV hariç* / *KDV dahil*); tabloda etiket kolon başlığındadır ve bir kolon tek tabanlıdır. Taban ekranın sınıfından türer: cari bakiye, tahsilat ve risk daima *KDV dahil* (B) · ciro ve hakediş daima *KDV hariç* (C) · sipariş/fiyat satırında birim fiyat ve matrah *KDV hariç*, satır ve belge toplamı *KDV dahil* (A; belge toplamı Matrah · KDV · Genel Toplam üç satırdır). Etiket metni tek kaynaktandır; tutar yalnız ortak bileşenle gösterilir. Tabanı çözülemeyen tutar boş kalır (sıfır gösterilmez). KDV dahil/hariç seçimi hiçbir ekranda görünmez. | 1B-4 · `taban.test.ts` · `reports.spec.ts` |
