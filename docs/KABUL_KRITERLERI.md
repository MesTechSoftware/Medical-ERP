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
| §0.3-1 | | 1B-4 *(sert / yumuşak / bilgi kademesi — X-4 ile)* |
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
| K-4-1 | | 1B-6 |
| K-5-1 | | 1A-C8 *(izlenebilirlik alanı yok)* |
| K-6-1 | Kongre modülü kapalı teslim edilir: `modulAcikMi("congress")` `false` döner (`policy.modules.congress`). | 1B-1 · `modul.test.ts` |
| K-7-1 | | 1B-7 *(D-6)* · süreç *(yazılı teyit)* |
| K-8-1 | — | süreç |
| K-9-1 | | Faz 2–3 *(yedek, restore tatbikatı)* |
| K-10-1 | | 1A-C8 *(ÜTS alanı yok)* |

## A · Ticari akış

| Kod | Kriter | Yazılacağı yer |
|---|---|---|
| A-1-1 | | 1B-7 |
| A-2-1 | | 1B-7 *(tutar hesabı 1B-5)* |
| A-3-1 | | 1B-7 |
| A-4-1 | | 1B-7 |
| A-5-1 | `TEKLIF` aşamasındaki siparişin satırları sayılan sipariş ve sayılan sevk satırı kümesine girmez. | 1B-1 · `sayilan-belgeler.itest.ts` |
| A-5-2 | `IPTAL` durumundaki sipariş sayılmaz (X-6 §(9), K-1). | 1B-1 · `sayilan-belgeler.itest.ts` |
| A-5-3 | Bedelsiz satır (A-2) sayılan sevk satırı kümesine girmez. | 1B-1 · `sayilan-belgeler.itest.ts` |
| A-5-4 | `ACILIS` ve `VADE_FARKI` cari hareketleri sayılan cari hareket kümesine girmez; bakiye hesabı bu filtreyi kullanmaz (A-6, A-7, X-11 §(6)). | 1B-1 · `sayilan-belgeler.itest.ts` |
| A-5-5 | Konsinye çıkış, stok transferi ve stok düzeltmesinden doğan stok hareketi sayılan stok hareketi değildir (A-4, B-7). | 1B-1 · `sayilan-belgeler.itest.ts` |
| A-5-6 | Ciro raporları sevk satırlarını yalnız bu filtreyle okur (K-4 §(2), X-1 §(5)); `TEKLIF`, iptal ve bedelsiz satır ciroya yansımaz. | 1B-1 · `reports-service.itest.ts` |
| A-6-1 | | 1B-7 |
| A-7-1 | | 1B-7 |
| A-8-1 | `acikBlokVarMi(belgeTipi, belgeId)` her kural kodu için belgenin **son** bloğuna bakar: kararı verilmemiş ya da `RED` ise `true` döner; blok yoksa ya da her kuralın son bloğu `ONAY`'lıysa `false`. Kurallar ayrı değerlendirilir; başka belgenin bloğu sonucu etkilemez. | 1B-1 · `onay-blogu.itest.ts` |
| A-8-2 | `blokKontrolleriniCalistir()` ihlal yoksa `BASARILI` döner ve blok yazmaz. | 1B-1 · `onay-blogu.itest.ts` |
| A-8-3 | İhlal varsa ve gerekçe boşsa (yalnız boşluk dahil) `ONAY_GEREKLI` · `YUMUSAK` döner, **bütün** ihlaller sonuçtadır (X-4 §(7)); blok yazılmaz. | 1B-1 · `onay-blogu.itest.ts` |
| A-8-4 | Gerekçe varsa ve kullanıcı `YONETICI` değilse kural kodu başına bir açık blok yazılır (açan + gerekçe); sonuç `BASARILI_UYARILI`, `onayaGonderildi = true`. Aynı belge ve kural için açık blok varsa ikincisi açılmaz; son bloğu `RED` olan kural için yeni blok açılır ve belge yeniden onaya gider. | 1B-1 · `onay-blogu.itest.ts` |
| A-8-5 | Gerekçe varsa ve kullanıcı `YONETICI` ise blok yazılır ve aynı işlemde `ONAY` ile kapanır (karar veren = açan, karar notu = gerekçe); `onayaGonderildi = false`, `acikBlokVarMi` `false`. Önceden açık kalmış bloğa burada karar verilmez; o durumda `onayaGonderildi = true`. | 1B-1 · `onay-blogu.itest.ts` |
| A-8-6 | `OnayBlogu` yalnız `src/lib/onay-blogu.ts`'te yazılır. | 1B-1 · `tek-cagri.test.ts` |
| A-9-1 | | 1A-C8 *(kurum tablosu yok)* |
| A-10-1 | | 1B-5 |
| A-11-1 | | 1B-7 |
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
| A-15-1 | | 1B-4 |

## B · Ürün ve stok

| Kod | Kriter | Yazılacağı yer |
|---|---|---|
| B-1-1 | | 1A-C8 *(kapsam dışı — lot/SKT alanı yok)* |
| B-2-1 | | 1A-C8 *(kapsam dışı)* |
| B-3-1 | | 1A-C8 *(barkod alanı ve tablosu yok)* |
| B-4-1 | `hesaplaStok(urun, konum?, tarih?)` = Σ giriş − Σ çıkış hareketi; `konum` verilirse yalnız o konum, `tarih` verilirse o günün İstanbul günü sonu itibarıyla (C-2 §(3), E-1 §(5)). | 1B-1 *(1A-CM: ilk sürüm)* · `kisitlar.itest.ts` |
| B-4-2 | Stok hareketi yalnız `stokHareketiYaz()` ile yazılır. Fonksiyon önce hareketin ürün satırlarını **id sırasıyla** kilitler, sonra stoğu okur ve yazar (ADR-005 §3, ADR-008 §(1)/(3)). Belge numarası alan akışta ürün kilidi `uretBelgeNo()`'dan önce alınır (ADR-008 §(1)). `FOR UPDATE` ve stok hareketi yazımı başka dosyada yoktur (ADR-008 §(6)). | 1B-1 · `tek-cagri.test.ts` · `stok.itest.ts` |
| B-4-3 | Negatife düşüş engellenmez: hareket yazılır. Yazımdan sonra stoğu sıfırın altında kalan ve o yazımda **çıkış alan** her ürün × konum `NEGATIF_STOK` kalemi olarak döner (önceki ve sonraki miktarla). Giriş alan ya da sıfırda kalan konum kalem değildir. | 1B-1 · `stok.itest.ts` |
| B-4-4 | Aynı ürüne eşzamanlı iki çıkış aynı ön stoğu göremez: ikinci yazım birincinin commit'ini bekler ve onun sonucunu okur (ADR-008 §(6), F-06). | 1B-1 · `stok.itest.ts` |
| B-5-1 | | 1B-5 *(1A-CM: tarih çakışması `EXCLUDE` testli)* |
| B-6-1 | | 1B-5 |
| B-7-1 | | 1B-7 |

## C · Mali ve yasal

| Kod | Kriter | Yazılacağı yer |
|---|---|---|
| C-1-1 | | 1B-7 *(`harici_irsaliye_no`)* · süreç *(teyit metni)* |
| C-2-1 | | 1B-6 |
| C-3-1 | | 1B-7 *(belgesiz doktor silme istisnası)* · 1A-CM *(audit VKN gizleme)* |
| C-4-1 | — | konusuz (K-6) |
| C-5-1 | | 1A-C8 *(para birimi alanı yok)* |
| C-6-1 | | 1B-5 *(1A-CM: `hesaplaSatirTutarlari` ilk sürümü testli)* |
| C-7-1 | | Faz 2–3 *(K-9)* |

## D · Operasyon

| Kod | Kriter | Yazılacağı yer |
|---|---|---|
| D-1-1 | | 1B-7 *(olay noktaları, boş handler)* |
| D-2-1 | | 1B-3 |
| D-3-1 | | 1B-7 |
| D-4-1 | | 1B-3 *(prim hedefe bağlanmaz — X-1)* |
| D-5-1 | | 1B-6 |
| D-6-1 | | 1B-7 |

## E · Teknik çerçeve

| Kod | Kriter | Yazılacağı yer |
|---|---|---|
| E-1-1 | | 1B-1 *(nokta/aralık okuma)* · 1A-CM *(`zaman.ts` testli)* |
| E-2-1 | | 1B-4 |
| E-3-1 | | 1B-7 *(dosya boyutu)* · 1A-C8 *(dosya alanı yok)* |

## X · Denetim sonrası kararlar

| Kod | Kriter | Yazılacağı yer |
|---|---|---|
| X-1-1 | | 1B-3 |
| X-2-1 | Tahsilat kaydı ve `THS` numarası aynı transaction'dadır: tahsilat yazılamazsa numara harcanmaz, sonraki tahsilat aynı numarayı alır. `BAYI` carisinin tahsilatı aynı yoldan numaralanır (X-8 §(7)). Tahsilat kaydını yazan tek yer `recordCollection`'dır — ikinci tahsilat yolu yoktur. | 1B-2 · `collections.itest.ts` · `tek-cagri.test.ts` |
| X-3-1 | | 1B-4 |
| X-4-1 | | 1B-4 |
| X-5-1 | | 1B-5 *(1A-CM: `Decimal`, `formatla`, lint kuralı)* |
| X-6-1 | | 1B-1 · 1B-4 *(§(6) vade uyarısı)* |
| X-7-1 | | 1B-10 *(matris yeniden kurulur)* |
| X-8-1 | | 1B-3 · 1B-7 |
| X-9-1 | | 1A-C7b *(bellek içi sayaç testli)* |
| X-10-1 | | 1B-5 · 1B-7 *(1A-CM: liste seçimi testli)* |
| X-11-1 | | 1B-1 · 1B-2 · 1B-7 |
| X-12-1 | | 1B-7 |
| X-13-1 | `kapsamliDoktorlariGetir(kullanici)` doktor okumasının kapsamını **sorgu süzgeci** olarak döner. `SATICI`'ya yalnız sahibi olduğu `DOKTOR` carileri döner — başka satıcının carisi, sahipsiz cari ve `BAYI` dönmez (X-8 §(3)). `YONETICI` ve `OPERASYON` bütün carileri görür. Satıcı ekranlarının doktor okumaları — doktor listesi, düzenleme sayfası, sipariş formu, hesabım, doktor güncelleme ve sipariş kaydı — bu süzgeçten geçer. Kapsam dışındaki cari bulunmamış gibi davranır, varlığı ima edilmez (X-3 §(8)). Satıcı rota grubunda sahip süzgeci elle yazılmaz (D-2 §(3)). | 1B-3 · `kapsam.itest.ts` · `tek-cagri.test.ts` |
| X-14-1 | | 1B-3 · 1B-7 |
| X-15-1 | | 1B-7 |
| X-15-5-1 | | 1B-7 *(X-15 §(5) — telefon varsayımı)* |
| X-16-1 | | 1B-7 *(taslaklar: `docs/arsiv/KARAR_ONERISI_2026-09-19.md` §10)* |
| X-17-1 | | 1B-3 *(1A-CM: ilk sürüm, `CHECK` ve FK testli)* |

## Ü · Ürünleştirme kararları

| Kod | Kriter | Yazılacağı yer |
|---|---|---|
| Ü-3-1 | | 1B-4 |
