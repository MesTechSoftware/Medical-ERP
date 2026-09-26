# ADR-008 — Kilit sırası: tek küresel sıra

- **Durum:** ✅ Kabul edildi
- **Tarih:** 24.09.2026
- **Kaynak soru:** `FAZ1_UYGULAMA_KAPSAMI.md` §C-bb *(19.09 incelemesi, bulgu 5)*
- **Bağlı KARARLAR maddeleri:** **A-14 §(3)** (`BelgeSayac` satır kilidi, `MAX+1` yasağı) · **B-4** (negatif stok yumuşak kısıt) · **A-8** (`OnayBlogu`) · **X-3** (sessiz hata yasağı) · **X-4** (iş hatası sözleşmesi) · **§0.6** (en dar varsayılan)
- **İlgili ADR:** `ADR-005 §3` (ürün satırı kilidi) · `ADR-007 §3` (doktor satırı kilidi — **öneri**)
- **Uygulandığı commit:** `CM` (`hesaplaStok()` ilk sürümü) · `uretBelgeNo()` **1B madde 2** · eşzamanlılık testi **F-06, 1B**

## Bağlam

Faz 1'de `SELECT … FOR UPDATE` ile kilitlenen **üç** kaynak var:

| Kaynak | Nerede yazılı | Paylaşım derecesi |
|---|---|---|
| `BelgeSayac` satırı | `KARARLAR.md` A-14 §(3) — *"satır kilidiyle ve belgeyi yazan transaction'ın içinde"* | PK (`onek`,`yil`) → **yılın bütün `SVK` belgeleri tek satırda** |
| Ürün satırı | `ADR-005 §3` | ürün başına |
| Doktor satırı | `ADR-007 §3` *(öneri)* | doktor başına |

Sıra ise iki belgede, ikisi de yarım: `ADR-005 §3` `BelgeSayac`'tan *"aynı desendir"* diye söz
ediyor ama sıraya sokmuyor; `ADR-007 §3` *"önce doktor, sonra ürün"* diyor, `BelgeSayac`'ı hiç
anmıyor. **Sırayı sahiplenen belge yok.** Ayrıca id sırası yalnız doktor için yazılmış; çok
satırlı bir belgenin ürün satırları için sıra kuralı hiçbir yerde yok.

İki döngü doğuyor:

1. **Sayaç döngüsü.** T1 numarayı önce alıp ürünü sonra kilitler, T2 tersini yapar. İkisi de
   kendi içinde mantıklıdır; hangisinin doğru olduğunu söyleyen bir cümle yoktur, dolayısıyla
   iki serviste iki ayrı sıra doğar.
2. **Satır sırası döngüsü.** İki sevkiyat aynı iki ürüne farklı satır sırasıyla dokunur.
   Satır sırası kullanıcının forma girdiği sıradır — yani rastgele.

Sonuç `40P01 deadlock detected`. X-3 gereği ekrana çıkar ama **iş hatası değildir**; X-4
sözleşmesinde karşılığı olan bir kural kodu yoktur. Kullanıcı tekrar dener ve çalışır:
seyrek, tekrarlanamaz, ay sonunda sıklaşan bir hata.

**Testte görünmez.** `playwright.config.ts:18` `fullyParallel: false` · `:21` `workers: 1`;
C1'in entegrasyon şeridi de `workers: 1` (`FAZ1_UYGULAMA_KAPSAMI.md` §D.1). CI'da hiçbir zaman
iki eşzamanlı transaction yoktur. `ADR-005`'in sonuç bölümü F-06 için *"asıl sınadığı şey artık
kilit sırası"* diyor; test kendi içinde iki bağlantı açmadıkça bu imkânsızdır.

## Karar

1. **Küresel sıra — istisnasız:**

   > **doktor satırları (id) → ürün satırları (id) → `BelgeSayac` satırı**

   Kilit alan her transaction bu sırayı izler. Bir kaynağa ihtiyacı yoksa onu atlar; **sırayı
   değiştiremez**.
2. **En çok paylaşılan kaynak en son alınır.** Gerekçe budur: yılın bütün `SVK` belgeleri tek
   sayaç satırında buluşur, o satırın tutulma süresi doğrudan verimdir. `uretBelgeNo()` bu
   yüzden **belge yazılmadan hemen önce** çağrılır; A-14 §(3)'ün *"yazan transaction'ın içinde"*
   şartı korunur.
3. **Çok satırlı belgede satırlar daima id sırasıyla kilitlenir** — kullanıcının girdiği sırayla
   değil.
4. **Okuma kilit almaz.** `hesaplaStok()` okumadır; `ADR-005 §3`'ün iç sırası (ürün satırı kilidi
   → `hesaplaStok()` → hareketi yaz) aynen geçerlidir. Bu ADR yalnız kaynaklar **arası** sırayı
   koyar.
5. **Yeniden deneme (retry) mekanizması yoktur.** Döngü sıra ile imkânsız kılınır; §0.6'nın en dar
   varsayılanı budur. Retry gerçek bir kilit sorununu da gizlerdi.
6. **Zorlama — iki test:**
   - **Yazım testi:** `FOR UPDATE` içeren dosyalar bu ADR'de sayılı listeye eşittir (grep;
     `ADR-007 §6` deseni). Yeni bir kilit noktası sessizce doğamaz.
   - **Eşzamanlılık testi (F-06):** test **kendi içinde iki bağlantı** açar; `workers: 1`
     değişmez. Düzeltmeden önce **kırmızı** olmalıdır (`DUZELTME_BRIFI.md:501` deseni).

## Sonuçlar

- ✅ Kaynaklar arası döngü imkânsızdır; kalan tek risk aynı kaynağın kendi içinde sırasız
  kilitlenmesidir, onu da (3) kapatır.
- ✅ Sıra **tek belgede** yaşar. `ADR-005 §3` ve `ADR-007 §3` onu tamamlar, kopyalamaz
  (`docs/adr/README.md` §2.3).
- ⚠️ Sayaç en son alındığı için ürün kilitleri sayaç kuyruğu boyunca tutulur. Faz 1 hacminde
  (tek kurulum, ~10 eşzamanlı kullanıcı) önemsizdir.
- ⚠️ **Toplu yazan akışlar sayaç satırını parti boyunca tutar.** D-6 import'u tek transaction'dır
  ve 240 `ACL` belgesi üretir; o süre boyunca `ACL` sayacı kilitlidir. Devreye alma anına
  özgüdür, canlı operasyonla çakışmaz.

## Değerlendirilen alternatifler

- **`BelgeSayac` en başta alınsın** *(numara alınıp diğer satırlar ona göre yazılsın)*. Reddedildi:
  en sıcak satır en uzun tutulur; tek kurulumda bile belge üretimini tek kuyruğa indirir.
- **Sıra serbest, deadlock'ta yeniden dene.** Reddedildi: §0.6 — döngüyü imkânsız kılmak,
  oluşunca toparlamaktan ucuzdur. Retry ayrıca gerçek bir kilit darboğazını görünmez yapar.
- **Sayaç yerine veritabanı `sequence`'ı** *(kilit gerekmezdi)*. Reddedildi: A-14 §(3) sayacı
  tabloya ve satır kilidine bağladı, `sequence` numara boşluğu bırakır. Bunu değiştirmek bir
  **karardır**, ADR onu geçersiz kılamaz (`README` §2.1); gerekirse `FAZ1_UYGULAMA_KAPSAMI.md`
  §C'ye açık madde olarak yazılır.

## Açık uygulama kalemleri (atıf)

- F-06'nın yeniden tanımı — iki bağlantılı eşzamanlılık testi (1B, `DUZELTME_BRIFI.md`)
- `uretBelgeNo(onek, tx)` — 1B madde 2 · `hesaplaStok()` ilk sürümü — `CM`
- `OnayBlogu` (`NEGATIF_STOK`) kaydının hangi kilidin altında açıldığı — 1B madde 1/7 (A-8)

## Geçerlilik sınırı

Kilit alan **yeni bir kaynak** eklenirse bu ADR değiştirilmez; `README` §2.2 gereği **yerine
yenisi yazılır** ve sıra baştan yazılır. Aynı şey sayaç satırının ölçülebilir bir darboğaza
dönüşmesi için de geçerlidir.
