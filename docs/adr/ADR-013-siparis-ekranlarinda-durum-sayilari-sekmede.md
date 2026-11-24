# ADR-013 — Sipariş ekranlarında durum sayıları sekmede

- **Durum:** ✅ Kabul edildi
- **Tarih:** 24.11.2026
- **Yerini aldığı:** `ADR-010`'un yalnız **03.11.2026 eki** (Siparişler ekranı 6 kart) — ADR-010'un gövdesi dondurulur; yalnız Durum satırına not düşülür
- **Kaynak soru:** Ürün sahibi kararı (24.11.2026, demo öncesi revizyon) — sipariş ekranlarının ilk ekranda tablo göstermesi
- **Bağlı KARARLAR maddeleri:** **X-5 eki** (gösterim ölçeği) · **§0.4** (kart = satır; ikinci hesap yolu yasak) · **X-13** (satıcı kapsamı) · **E-1** (İstanbul günü)
- **İlgili ADR:** `ADR-010` (KPI kartları) · `ADR-009` (görsel sistem)

## Bağlam

ADR-010'un 03.11 eki, Siparişler ekranına altı kart verdi: Toplam ve beş durum. Kart bloğu 1440 px dizüstünde ve 390 px
telefonda tabloyu ilk ekranın altına itiyor; durum sekmeleri ise aynı bilgiyi (durum) süzgeç olarak zaten taşıyor.
`KpiSatiri`'nın altı kartlık dalı yalnız bu ekran için açılmış bir istisnaydı.

## Karar

1. **Siparişler (yönetici) ve Siparişlerim (satıcı) ekranlarında KPI kart bloğu yoktur.** Durum sayıları durum
   sekmesinin üstündedir ("Bekliyor 1").
2. **Sekmedeki sayı, o sekmenin o anki dönem ve süzgeçlerdeki satır sayısıdır.** Sekme neyi listeliyorsa sayı onu söyler;
   "Tümü" sekmesi teklifleri de içerir. Sayı ve liste aynı süzgeç koşulundan gelir (kart = satır ilkesi, §0.4).
3. Etkin dönem ("Bu ay" vb.) sekmelerin yanında görünür kalır. Telefonda sekmeler yatay kayan şerittir (menü şeridi
   deseni; yalnız şeridin `scrollLeft`'i kayar).
4. **`KpiSatiri`'nın altı kartlık dalı ve `kpi.test.ts`'teki istisnası silinir**; sınır yeniden **1–4**'tür.
5. Dashboard'un "Sipariş durumları" dağılımıyla eşitlik korunur (süzgeçsiz aynı aralık).

## Sonuçlar

- ✅ Tablo ilk ekranda; durum süzgeci ve sayısı tek yerde.
- ✅ ADR-010'un 1–4 kart sınırı istisnasız yürürlüğe döner.
- ⚠️ Metin süzgeci sekme sayılarını değiştirir (sekme sayısı satır sayısıdır); dashboard eşitliği yalnız süzgeçsiz aralıkta aranır.

## Değerlendirilen alternatifler

- **Altı kartı küçültmek.** Reddedildi: istisna kalır, dar ekranda yine tabloyu iter.
- **Sayıyı yalnız "Tümü"nde göstermek.** Reddedildi: durum sayısı sekmenin kendisinde okunmalıdır.

## Geçerlilik sınırı

Sipariş ekranlarına kart bloğu geri getirilirse bu ADR değiştirilmez; `README` §2.2 gereği yerine yenisi yazılır.
