# Teknik borç turu — uygulama planı

> Spec: `docs/superpowers/specs/2026-11-05-teknik-borc-turu-design.md` · Yol haritası: Ü-35 · Plan dosyasıdır, karar
> üretmez.

Her PR: kod → birim + entegrasyon → e2e (yerel, medikal_test) → push/PR → CI → code-review → düzeltme → merge. Sıradaki
PR öncekinin merge'ünden sonra `main`'den dallanır.

1. **PR 1 `revize/ortak-liste-yardimcilari`** — spec §2. Doğrulama: `tsc`, `eslint src e2e`, birim/entegrasyon/e2e
   yeşil; `sutunEylemi.ts` kalmadı; `getPagination` yalnız `lib/liste/sayfa.ts`'te.
2. **PR 2 `revize/sorgu-performansi`** — spec §3. Her kalem için önce eşitlik testi. Doğrulama: entegrasyon yeşil,
   değişen sorgular için eski/yeni sonuç aynı.
3. **PR 3 `revize/kucuk-duzeltmeler`** — spec §4. Davranış değişen her kalem için birim ya da e2e testi.
4. **PR 4 `revize/istemci-paneli`** — spec §5. e2e panel aç/kapa ölçümü RSC isteği saymaz; geri tuşu ve doğrudan
   adres testleri. Kapanış: `YOL_HARITASI` Ü-35 ✅, `DEVAM_PROMPTU` ▶ satırı, `npm run izlenebilirlik`.
