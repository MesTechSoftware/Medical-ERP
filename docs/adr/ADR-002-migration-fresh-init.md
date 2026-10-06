# ADR-002 — Migration stratejisi: fresh init

- **Durum:** ✅ Kabul edildi
- **Tarih:** 15.09.2026
- **Kaynak soru:** `FAZ1_UYGULAMA_KAPSAMI.md` §C-m
- **Bağlı KARARLAR maddeleri:** §4 (Faz 1 şema özeti) · §0.1.a (tip yanlışsa düzeltmesi veri taşıma migration'ıdır) · X-5 (`Decimal`) · X-6 (`PaymentAllocation` kalkar) · E-1 (`timestamptz`/`date`) · X-8 (`Dealer*` kalkar, `hesap_sinifi` eklenir) · X-9 (`LoginAttempt` kalkar) · X-10 (fiyat listesi tabloları eklenir, `netListPrice` kalkar)
- **Uygulandığı commit:** `CM` (Faz 1A) — hash `FAZ1_UYGULAMA_KAPSAMI.md` §A'da
- **Düzeltme (16.09.2026 — repoya girmeden, C0 öncesi):** *Bağlam*'daki tablo sayısı X-10'a göre
  güncellendi (11 → 15). *CM* ön koşullarına X-11 · X-12 eklendi. Karar değişmedi.

## Bağlam

Repoda tek migration var: `prisma/migrations/20260723175607_init_v2`. Faz 1'in şema yükü çok büyük:
- 15 yeni tablo *(X-10, X-11, X-12 ile)*, 4 yeni belge, 40'tan fazla kolon;
- E-1 tip ayrımı (bugün 41 kolonun tamamı `TIMESTAMP(3)`);
- `BigInt` → `Decimal` dönüşümü;
- enum daraltması ve kaldırılan tablolar.

Soru, bunun mevcut migration'ın üstüne **artımlı** mı yazılacağı, yoksa **sıfırdan tek
migration** olarak mı üretileceğiydi.

**Belirleyici olgu:** Canlı veya pilot veri **yoktur** (teyit edildi). PROJE_DURUMU da
*"temiz sayfa, canlı veri yok"* diyor.

## Karar

**Fresh init.**
- `20260723175607_init_v2` klasörü silinir; tek yeni `init` migration'ı üretilir.
- Faz 1A sonunda `prisma/migrations` altında **tek klasör** bulunur (§D.2 çıkış kriteri).

## Sonuçlar

- **Veri taşıma adımı yazılmaz.** Taşınacak veri yoktur. Artımlı yazılsaydı `BigInt` → `Decimal`
  ve tip dönüşümleri için hiç çalışmayacak dönüşüm kodu yazılırdı.
- **`CM` 1A'nın geri alınamaz tek noktasıdır** (R-1). Öncesinde:
  - C2–C7 sökümü bitmiş ve CI yeşil olmalıdır.
  - **§C-f PRD taraması kapanmış olmalıdır** (R-2). *✅ 16.09 kapandı.* Tarama yeni şema kalemi doğurabilir; migration tek atıştır.
  - **§D.7'nin üç sorusu kapanmıştır** (15.09.2026 — X-8, X-9, X-10). *16.09: X-11…X-15 ve ADR-005 kapandı* — `CariHareket`, `ImportParti`, sevkiyat satırı eklenir; `Product.stock` çıkar (`FAZ1_UYGULAMA_KAPSAMI.md` §B). Şema etkileri `CM`'e girer: beş `Dealer*` tablosu, `LoginAttempt` ve `Product.netListPrice` çıkar; `Doktor.hesap_sinifi`, `Doktor.fiyat_listesi_id`, `FiyatListesi` ve `FiyatListesiSatir` eklenir.
- **Gözden geçirilecek dosyalar** (migration adına ya da sıfırlama davranışına bağlı):
  - `README.md:19,76`
  - `playwright.config.ts:35-37` — e2e her koşuda `migrate reset` ediyor
  - `ci.yml:58-59`
- **Entegrasyon test DB'si** (`medikal_itest`, C1) `globalSetup`'ta `migrate deploy` çalıştırır.
  C1 eski migration'la kurulur, `CM`'den sonra yeni `init` ile çalışmaya devam eder. Ayrı bir
  işlem gerekmez.
  *04.10.2026 düzeltmesi (`CM` uygulaması — karar değişmedi):* son cümle **yanlıştı**. Eski
  `init_v2` geçmişini taşıyan bir veritabanında `migrate deploy` yeni `init`'i uygulayamaz
  (`type "Role" already exists`). CI etkilenmez — veritabanlarını her koşuda sıfırdan açar.
  **Var olan yerel kurulumlarda** `medikal_itest` ve `medikal_dev` **bir kez** silinip yeniden
  açılır (`medikal_test`'i Playwright her koşuda zaten sıfırlar). Canlı veri olmadığı için
  bu tek seferlik bir yerel adımdır.

## Değerlendirilen alternatifler

- **Artımlı migration zinciri** (`init_v2` + Faz 1 migration'ları). Reddedildi.
  - Canlı veri olmadığı için korunacak bir şey yoktur.
  - Zincir, hiç uygulanmamış ara şemaları kalıcı geçmiş olarak taşırdı: `PaymentAllocation`,
    kongre defteri, `BigInt` kuruş. Bu, KARARLAR'ın geri çektiği yapıların repo geçmişinde
    *"şemanın parçası"* gibi durması demektir.

## Açık uygulama kalemleri (atıf)

- `CM` içeriğinin tamamı → `FAZ1_UYGULAMA_KAPSAMI.md` §D.1 (`CM` satırı ve iki bağlayıcı not).
- Seed ayrımı (`db:seed` / `db:seed:demo`) → §D.1 C9. Yeni `init`'in üzerine referans veri buradan basılır.

## Geçerlilik sınırı

🔴 **Bu yöntem tek seferliktir.** İlk canlı veya pilot veri girildiği an bir daha
kullanılamaz; en geç `YOL_HARITASI.md` G-2 (veri devri) ile bu sınır kesinleşir.

Canlıya çıkıştan sonraki migration disiplini (yalnız ileri yönlü mü, geri alma yolu,
veri taşıma testi) **bu ADR'nin konusu değildir**. Faz 3 öncesinde ayrı bir ADR ile belirlenir.
