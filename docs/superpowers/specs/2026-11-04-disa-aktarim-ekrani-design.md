# Dışa Aktarım ekranı — veri seti kartları, dönem kısayolları (tasarım spec'i)

> **Tarih:** 04.11.2026 · **Kaynak:** kullanıcı talebi (sohbet, 04.11.2026: "kalan sayfaları tek promptta bitir aynı
> işlemler hepsi" — menüde Denetim Kaydı'ndan sonraki sayfa) · **Yol haritası:** Ü-29 (§7-5 gereği yazılır) ·
> **Durum:** kullanıcı spec onayını beklemeden ilerlemeyi istedi; her seçim önerilen seçenektir (§9); tek PR.
>
> Bu belge **plan**dır, karar üretmez (`YOL_HARITASI.md` §7.1-A). Dayandığı kararlar: **D-5** (altı veri seti kodda
> kapalı; dönem E-1'e bağlı, "tüm zamanlar" bilinçli seçim; yalnız `YONETICI`; her çalıştırma kütüğe yazılır;
> **dışa aktarım geçmişi ekranı yoktur — Ü-9**; dosya sunucuda saklanmaz), K-4 §(6)-b (fatura hazırlık şablonu
> kurulumda tanımlanmadan çıktı verilmez), E-1 (İstanbul günü). Yeni karar ya da ADR açılmaz.

## 1. Amaç

Dışa aktarım müşavirin ve mutabakatın kapısıdır; ekran bugün tek açılır listeden ibaret, veri setinin ne
içerdiğini ve hangi dönemi istediğini söylemiyor. Yönetici altı veri setini kartlarda açıklamasıyla görsün,
birini seçsin, dönemi tek tıkla (Bu ay, Geçen ay, Bu yıl, Geçen yıl) doldursun, biçimi seçip indirsin.
Fatura hazırlık şablonu kurulumda tanımlanmadıysa kart bunu söylesin ve seçilemesin.

**Başarı ölçütü:** yönetici "Tahsilat hareket listesi" kartını seçer, "Geçen ay"a basar; başlangıç ve bitiş geçen
ayın ilk ve son günüyle dolar; "Dosyayı İndir" dosyayı indirir ve "Dosya hazırlandı: N satır." yazar.

## 2. Kapsam

### Kapsamda

| # | Kalem | Dayanak |
|---|---|---|
| 1 | Veri seti kartları (radyo grubu): ad, tek satır açıklama, dönem rozeti ("Dönem ister" · "Gün sonu" · "Anlık") | D-5 · C-2 |
| 2 | Dönem kısayolları: Bu ay · Geçen ay · Bu yıl · Geçen yıl (İstanbul takvimi; bitiş dahil, bugünü aşmaz) + Tüm zamanlar | D-5 · E-1 |
| 3 | Fatura hazırlık şablonu tanımsızsa kart pasif ve açıklamalı | K-4 §(6)-b |
| 4 | Biçim seçimi radyo (Excel / CSV) | — |

### Kapsam dışı

- **KPI ve geçmiş listesi** (D-5: geçmiş ekranı yoktur, Ü-9) — kütük yalnız veritabanındadır.
- Veri setleri, sütunları ve `disaAktar` eylemi (değişmez).

## 3. Ekran

`requireAdmin`. Sayfa iki bölüm: **Veri seti** (kartlar, `role="radiogroup"`, `aria-label="Veri seti"`; her kart
`<label>` içinde `input type=radio name=kod`) ve **Seçenekler** (seçilen sete göre: dönem — kısayol düğmeleri, Tüm
zamanlar, başlangıç/bitiş alanları; stokta gün sonu tarihi; biçim; İndir).

| Veri seti | Açıklama | Rozet |
|---|---|---|
| Cari hareket | Bütün cari hareketler tipi, yönü ve vadesiyle; açılış ve vade farkı dahil — mutabakat için | Dönem ister |
| Tahsilat hareket listesi | Tahsilatlar yöntemi, komisyonu, referansı ve durumuyla | Dönem ister |
| Sipariş | Sayılan siparişlerin satırları ürün, fiyat ve KDV'siyle; bedelsiz işaretli | Dönem ister |
| Stok miktarı | Gün sonu itibarıyla ürün ve konum başına miktar; tutar yok, yıl içi düzeltmeler işaretli | Gün sonu |
| Doktor listesi | Cariler fatura bilgileri ve sorumlu satıcısıyla | Anlık |
| Fatura hazırlık (sevk günü) | Sevk günündeki satırlar, kurulumdaki şablonun sütun eşlemesiyle | Dönem ister |

Kısayol düğmeleri alanları doldurur (istemci); "Tüm zamanlar" işaretliyken alanlar ve kısayollar gizlenir
(bugünkü). Sunucu doğrulaması ve hata metinleri bugünküdür.

## 4. Veri katmanı

- **`src/lib/disa-aktarim-donem.ts`** (saf): `donemKisayollari(bugun: string) → { etiket: "Bu ay" | "Geçen ay" | "Bu yıl" |
  "Geçen yıl"; baslangic: string; bitis: string }[]` — `YYYY-AA-GG`; "Bu ay" ve "Bu yıl" bitişi bugün; geçen ay/yıl
  tam takvim dönemi (ocakta geçen ay önceki yılın aralığı).
- **`VERI_SETI_ACIKLAMASI`** ve rozet eşlemesi formun yanında; sayfa `policy.export.sablonTanimi`'nin varlığını prop
  olarak verir.

## 5. Hata davranışı

Bugünkü gibi (eksik/ters tarih alan altında; şablonsuz fatura hazırlık `FATURA_SABLONU_TANIMSIZ` — artık kart pasif
olduğundan yalnız elle gönderilen istekte).

## 6. Testler

**Kabul kriteri:**

- **D-5-3:** Dışa aktarım ekranı altı veri setini açıklamasıyla gösterir; dönem isteyen sette Bu ay, Geçen ay, Bu
  yıl ve Geçen yıl kısayolları İstanbul takvimine göre başlangıç ve bitiş (dahil) günlerini doldurur — bu ay ve bu
  yıl bugünle biter. Fatura hazırlık şablonu tanımsızken o veri seti seçilemez. Ekranda dışa aktarım geçmişi yoktur.

| Katman | Dosya | Neyi doğrular |
|---|---|---|
| Birim | `disa-aktarim-donem.test.ts` | dört kısayol; ocak (geçen ay aralığı önceki yıl); şubat sonu; ayın 1'i |
| E2E | `e2e/admin/disa-aktarim.spec.ts` güncellenir | kart seçimi; "Geçen ay" alanları doldurur ve indirir; ters tarih hatası; fatura hazırlık kartı pasif (şablonsuz e2e ortamı) |

## 7. Belgeler

YOL_HARITASI Ü-29 · KABUL_KRITERLERI (D-5-3) · TRACEABILITY · PROJE_DURUMU · DEVAM_PROMPTU.

## 8. Teslim

Tek PR `revize/disa-aktarim-ekrani`.

## 9. Önerilen seçimler

| # | Soru | Seçilen | Diğer |
|---|---|---|---|
| 1 | KPI / geçmiş | yok (D-5: geçmiş ekranı yoktur, Ü-9) | son indirmeler listesi (kararla çelişir) |
| 2 | Veri seti seçimi | açıklamalı kartlar | açılır liste (bugünkü) |
| 3 | Dönem girişi | kısayollar + alanlar | yalnız alanlar (bugünkü) |
