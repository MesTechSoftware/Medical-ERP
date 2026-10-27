# ADR-012 — Kilit sırası: tek küresel sıra, denetim zinciri commit anında

- **Durum:** ✅ Kabul edildi
- **Tarih:** 27.10.2026
- **Yerini aldığı:** `ADR-008` (24.09.2026) — gövdesi dondurulur; sıra burada baştan yazılır
- **Kaynak soru:** KARARLAR **X-18** §(2) — denetim zinciri yeni bir kilit kaynağıdır (ADR-008 "Geçerlilik sınırı")
- **Bağlı KARARLAR maddeleri:** **A-14 §(3)** (`BelgeSayac` satır kilidi) · **B-4** · **A-8** · **X-3** · **X-4** · **§0.6** · **X-17** (doktor satırı kilidi) · **X-18**
- **İlgili ADR:** `ADR-005 §3` (ürün satırı kilidi) · `ADR-011` (zincir mekanizması)

## Bağlam

ADR-008 sırayı koydu: **doktor satırları (id) → ürün satırları (id) → `BelgeSayac` satırı**. Kendi
geçerlilik sınırında, kilit alan yeni bir kaynak eklenirse sıranın yeni bir ADR'de baştan yazılmasını
istiyor.

X-18'in mühür zinciri böyle bir kaynaktır ve sistemdeki **en çok paylaşılan** kaynaktır: denetim
kaydı yazan her transaction ona girer. ADR-008 §(2) en çok paylaşılan kaynağın en son alınmasını
istiyor. Denetim kaydı ise transaction'ın ortasında yazılır: içe aktarım yüzlerce kaydı, cari açma
devir kaydını, doktor ve ürün kilitleriyle iç içe yazar. Kilit yazım anında alınsaydı şu döngü
doğardı: T1 zincir kilidini tutup bir ürün satırını bekler; o satırı tutan T2 kendi denetim kaydı
için zincir kilidini bekler.

## Karar

1. **Küresel sıra — istisnasız:**

   > **doktor satırları (id) → ürün satırları (id) → `BelgeSayac` satırı → (commit) denetim zinciri**

   Kilit alan her transaction bu sırayı izler. Bir kaynağa ihtiyacı yoksa onu atlar; **sırayı
   değiştiremez**.
2. **ADR-008'in 2–5. maddeleri aynen geçerlidir:** en çok paylaşılan kaynak en son alınır;
   `uretBelgeNo()` belge yazılmadan hemen önce çağrılır; çok satırlı belgede satırlar id sırasıyla
   kilitlenir; okuma kilit almaz; yeniden deneme (retry) yoktur.
3. **Denetim zinciri kilidi yalnız commit anında alınır.** Kilit, `denetim_muhurle()` ertelenmiş
   tetikleyicisindeki `pg_advisory_xact_lock`'tur (ADR-011 §3). Uygulama kodu bu kilidi almaz.
   Commit anındaki transaction başka hiçbir kilidi beklemez; zincir kilidini bekleyen hiçbir
   transaction da başka bir kilidi tutarak beklemez. Bu yüzden döngü imkânsızdır.
4. **Zorlama — üç test:**
   - **Yazım testi:** `FOR UPDATE` içeren dosyalar sayılı listeye eşittir (ADR-008 §(6) deseni; liste
     değişmedi: `lib/sahiplik.ts`, `lib/stok.ts`).
   - **Yazım testi:** `pg_advisory` `src/`'de geçmez; zincir kilidi yalnız migration'daki tetikleyicidedir.
   - **Eşzamanlılık testi:** iki bağlantı aynı anda denetim kaydı yazıp commit eder; ikisi de başarılı
     olur ve zincir boşluksuz, bağlıdır (`zincir.itest.ts`, F-06 deseni: test kendi içinde iki
     bağlantı açar, `workers: 1` değişmez).

## Sonuçlar

- ✅ ADR-008'in sonuçları geçerlidir; kaynaklar arası döngü imkânsızdır.
- ✅ Zincir kilidi commit'te tutulur; tutulma süresi bir okuma ve bir yazmadır.
- ⚠️ Denetimli bütün commit'ler zincir kilidinde sıraya girer. Faz 1 hacminde önemsizdir; ölçüm
  tasarım 3 D2 PR'ındadır.

## Değerlendirilen alternatifler

- **Zincir kilidi denetim kaydı yazılırken.** Reddedildi: içe aktarım ve cari açma gibi
  transaction'lar kilidi tuttuktan sonra doktor ya da ürün satırı kilitler; Bağlam'daki döngü doğar.
- **Kilitsiz zincir, çakışmada benzersizlik hatası.** Reddedildi: yeniden deneme gerektirir
  (ADR-008 §(5) — retry gerçek bir kilit sorununu gizler).

## Geçerlilik sınırı

Kilit alan yeni bir kaynak eklenirse bu ADR değiştirilmez; `README` §2.2 gereği yerine yenisi
yazılır ve sıra baştan yazılır.
