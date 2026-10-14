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

## K · Kurumsal ve ticari

| Kod | Kriter | Yazılacağı yer |
|---|---|---|
| K-1-1 | — | konusuz (K-6) |
| K-2-1 | | 1B-1 |
| K-3-1 | — | konusuz (A-8) |
| K-4-1 | | 1B-6 |
| K-5-1 | | 1A-C8 *(izlenebilirlik alanı yok)* |
| K-6-1 | | 1B-1 *(`modules.congress = false`)* |
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
| A-8-1 | | 1B-1 |
| A-9-1 | | 1A-C8 *(kurum tablosu yok)* |
| A-10-1 | | 1B-5 |
| A-11-1 | | 1B-7 |
| A-12-1 | | 1B-1 |
| A-13-1 | | 1B-7 |
| A-14-1 | | 1B-2 *(1A-CM: `uretBelgeNo` testli)* |
| A-15-1 | | 1B-4 |

## B · Ürün ve stok

| Kod | Kriter | Yazılacağı yer |
|---|---|---|
| B-1-1 | | 1A-C8 *(kapsam dışı — lot/SKT alanı yok)* |
| B-2-1 | | 1A-C8 *(kapsam dışı)* |
| B-3-1 | | 1A-C8 *(barkod alanı ve tablosu yok)* |
| B-4-1 | | 1B-1 *(1A-CM: `hesaplaStok` ilk sürümü testli)* |
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
| X-2-1 | | 1B-2 |
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
| X-13-1 | | 1B-3 |
| X-14-1 | | 1B-3 · 1B-7 |
| X-15-1 | | 1B-7 |
| X-15-5-1 | | 1B-7 *(X-15 §(5) — telefon varsayımı)* |
| X-16-1 | | 1B-7 *(taslaklar: `docs/arsiv/KARAR_ONERISI_2026-09-19.md` §10)* |
| X-17-1 | | 1B-3 *(1A-CM: ilk sürüm, `CHECK` ve FK testli)* |

## Ü · Ürünleştirme kararları

| Kod | Kriter | Yazılacağı yer |
|---|---|---|
| Ü-3-1 | | 1B-4 |
