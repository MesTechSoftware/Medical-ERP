# Demo öncesi revizyon — birleşik karar ve uygulama özeti

> **Belge sınıfı:** plan girdisi (`docs/superpowers/`). **Karar üretmez** (`YOL_HARITASI.md` §7.1-A).
> Buradaki ürün sahibi kararlarının resmî kaydı **Paket 1**'de `docs/KARARLAR.md` eklerine,
> `docs/KABUL_KRITERLERI.md` satırlarına ve ADR-013'e girer. Spec
> (`2026-11-24-demo-oncesi-revizyon-design.md`) ve plan (`../plans/2026-11-24-demo-oncesi-revizyon.md`)
> bu dosyadan yazılır.
>
> **Dal:** `revize/demo-oncesi-is-akisi` · **Tarih:** 24.11.2026 · **Kapsam:** donduruldu (ürün sahibi onayı)

---

## 0. Bu sürümdeki düzeltmeler (önceki birleşik metne göre)

| # | Düzeltme | Doğru hâli |
|---|---|---|
| D1 | **A-4 / Paket 7 — KRİTİK.** Önceki metin "pasif doktor transferde kaynak olamaz" diyordu. **Yanlıştı.** | Pasif doktora **yeni konsinye çıkışı** engellenir (`DOKTOR_PASIF`, SERT). Pasif doktordan depoya **transfer AÇIK KALIR**; yoksa pasif doktordaki konsinye mal depoya geri çekilemez. Paket 7'deki transfer düzeltmesi (F-5) yalnız arayüzdür: stok ekranındaki transfer **kaynak** listesinden "Merkez Depo" çıkarılır, yalnız konsinye konumları listelenir. Sunucu zaten depoyu kaynak olarak reddediyor (`TRANSFER_KONUMU_GECERSIZ`, `stok-transfer.itest.ts:91`). |
| D2 | **A-10 / Paket 3.** "İskonto tavanı yok" ifadesi mekanizmanın kurulmayacağı gibi okunabiliyordu. | `ISKONTO_TAVANI` kuralı `ApprovalBlock` üzerinde `BEDELSIZ_ONAYI` deseniyle **kurulur ve testlenir**; `policy.pricing.iskontoTavani` varsayılanı **`null`** (müşteri kararı) olduğu için çalışma anında devrede değildir. Testler eşik değerini test içinde verir. |
| D3 | **Demo dışında kalanlar** listesi eksikti. | §7'de önceki turların tüm Aşama 2 ve Aşama 3 maddeleri tek listede. |
| D4 | Açık iki soru cevaplandı. | Sekme sayıları satıcının "Siparişlerim" ekranına da uygulanır. "Tümü" sekmesinin sayısı teklifleri de içerir (sekme neyi listeliyorsa sayı onu söyler). |

---

## 1. Uygulama yöntemi

1. **Plan dosyaları** — `docs/superpowers/specs/2026-11-24-demo-oncesi-revizyon-design.md` ve
   `docs/superpowers/plans/2026-11-24-demo-oncesi-revizyon.md` (bu özet dosyasıyla birlikte).
   İlk commit: `docs(plan): …`.
2. **Paket 0** — Windows yol ayracı düzeltmesi (izlenebilirlik üretiminin ön koşulu).
3. **Paket 1 ⏸ ONAY KAPISI** — KARARLAR ekleri, KABUL satırları, ADR-013, YOL_HARITASI satırları.
   Taslak hazır olunca **durulur**, ürün sahibine kısa özet + diff sunulur. Onaydan önce **kod yazılmaz**.
4. Her pakette sıra: **kabul kriteri → test → kod**. Her paket ayrı commit.
5. **Sıra:** `0 → 1 ⏸ → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12 → 15 → 16 → 13 → 14`
6. **Kapanış (Paket 14):** tüm testler, `npm run izlenebilirlik`, `PROJE_DURUMU.md` ve `YOL_HARITASI.md` senkronu.

---

## 2. İş kuralı kararları

| Karar | İçerik | Paket |
|---|---|---|
| **A-10 Fiyat / iskonto** | • Sipariş formunda seçili cari ve satır miktarına göre **cari / barem fiyatı çözülür** (7.4, F-2; `disabled={!prod.listPrice}` kilidi kalkar).<br>• Birim fiyat değişince satırda **canlı % iskonto** (liste altı/üstü) görünür (ÜF-8).<br>• `ISKONTO_TAVANI` YUMUŞAK onay bloğu `BEDELSIZ_ONAYI` deseniyle kurulur + testleri; varsayılan **`null`** (D2). Liste üstü satış serbest. `NUMUNE`'ye dokunulmaz.<br>• Bedelsiz olmayan satırda `birimFiyat <= 0` **SERT** red + veritabanı `CHECK` kısıtı.<br>• KABUL `A-10-1` güncellenir. | 3 |
| **A-3 Kalanı kapat (short-close)** | • Sipariş düzeyinde "Kalanı Kapat"; yalnız en az bir sevkiyatı olan `HAZIRLANIYOR` siparişte.<br>• Yetki: YONETICI + OPERASYON (SATICI değil). OnayBlogu yok.<br>• Gerekçe kataloğu: `TEDARIK_EDILEMEDI` · `MUSTERI_VAZGECTI` · `DIGER` (DIGER'de açıklama zorunlu).<br>• Veri: satıra `closedQuantity` (vars. 0); siparişe `closedById` + `closedAt` + `closeReason` + `closeNote` (B-4 `createdById` deseni), detayda gösterilir. Hiçbir kayıt silinmez (§0.2). AuditLog yazılır.<br>• Kalan formülü tek kaynaktan: `kalan = quantity − shipped − closedQuantity` (A-3-2 gösterimi ve A-12-2 açık sipariş riski dahil).<br>• Kapanınca sipariş `KARGOLANDI`'ya geçer; "Kısmi kapatıldı" rozeti + sebep.<br>• Kilit: `stokKilitle()` (ürünler id sırasıyla) + koşullu güncelleme (`where status = HAZIRLANIYOR`). **`Order` satırına `FOR UPDATE` alınmaz** (ADR-012'de yok; yeni kilit = yeni ADR). ADR-012 §4 zorlama testleri koşturulur.<br>• Sipariş detayında **tüm sevkiyatlar** (ÜF-7, `take: 1` kalkar) ve satır bazında sevk/kalan. | 4 |
| **A-12 Risk / vade** | • `hesaplaDoktorRisk()` ve `vadesiGecmisUyarisi()` sipariş (`siparisAc`) ve sevkiyat (`sevkiyatYaz`) sonuçlarına **BİLGİ** şeridi olarak bağlanır; toplu kargo sonuç satırında da.<br>• Metinler: "Limit aşıldı: risk X / limit Y" · "Vadesi geçmiş borç var (en eski vade: …)" (tutar yok, X-6 §7).<br>• Formda cari seçilince risk, limit ve vade uyarısı anlık görünür.<br>• `creditLimit >= 0` ortak şemadan (`cari.ts` + içe aktarım). `0` = "Peşin çalışılan cari" mesajı, `null` = limitsiz.<br>• Cari detayda risk/limit tutarları (ÜF-9). | 5 |
| **A-8 Öksüz onay bloğu** | `onayKosulu` süzgeci iptal edilmiş **ve** kapatılmış siparişlerin bekleyen bloklarını `/approvals` kuyruğundan düşürür. | 6 |
| **A-4 Pasif doktor** | Pasif doktora yeni konsinye çıkışı **SERT** `DOKTOR_PASIF` (`konsinyeKonumu()` / `konsinyeCikisYaz()`). **Pasif doktordan depoya transfer açık kalır** — bunu koruyan regresyon testi eklenir. Transfer kaynak listesinden "Merkez Depo" çıkar, yalnız konsinye konumları (F-5, arayüz). | 7 |
| **X-18 Denetim** | Konsinye çıkış, transfer ve onay/red kararı denetim kaydına yazılır (ÜF-1; mevcut transaction'a `createAuditLog`). | 8 |
| **D-2 OPERASYON dashboard'u** | Ciro ve Tahsilat KPI'ları kalkar (§0.1.a). Öne çıkanlar: Bekleyen sipariş, Kargolanacak, Kritik stok, Onay bekleyen / kalanı açık siparişler. | 9 |
| **C-3 Ürün silme** | Hareketi ya da sipariş kalemi olan ürün silinmez (SERT, "pasifleştirin" yönlendirmesi). Bağı yoksa ürün + fiyat satırları tek transaction'da silinir, denetime yazılır. Stok hareketi asla silinmez. Kilit: `stokKilitle` → bağ kontrolü → silme. | 2 |
| **Tahsilat** | `paidAt` doğrulaması (geçersiz tarih 500 yerine iş hatası). `tahsilatYaz` içinde doktor **varlık** kontrolü; pasif doktor **reddedilmez** (B-7 tahliye vanası). Ödeme yöntemi kontrolü zaten var. | 10 |
| **E-2 Yapılandırma / marka** | • Marka sunucu tarafı **`APP_BRAND`** (NEXT_PUBLIC değil — derlemede gömülür). `login/page.tsx` markayı prop olarak alır; `global-error.tsx` markasız "Hata". Statik sayfaların markayı dondurmaması Next 16 dokümanından kontrol edilir.<br>• Logo nötr varsayılan + ortam değişkeniyle değiştirilebilir yol.<br>• Demo parolaları ortam değişkeninden; yedek değer yalnız yerel/demo. E2E aynı değişkeni aynı varsayılanla okur. Seed, ortamdan gelen parolayı konsola yazmaz.<br>• Yayındaki demo sunucusunda `admin123` geçerli: parola sıfırlama / yeni seed **açık deploy adımı** olarak plana yazılır. | 13 |

---

## 3. Fatura ve kargo kararları

### K-4 §(6)-(k) — Fatura Hazırlık Kartı (Paket 15)
- **Yer:** yönetici sipariş detayı (`src/app/(admin)/orders/[id]/page.tsx`), her sevkiyat (SVK) için salt okunur kart. Satıcı sipariş sayfasına **konmaz**.
- **Rol:** YONETICI + OPERASYON görür, SATICI görmez. Kart **dosya üretmez ve `ExportLog`'a yazılmaz**; bu yüzden D-5 §4 (dışa aktarım yalnız yönetici) kapsamına girmez — ekte açıkça yazılır.
- **Tek veri kaynağı:** `faturaHazirlik` (`src/lib/disa-aktarim.ts`) tek sevkiyat süzgeciyle paylaşılır; ikinci hesap yolu yok. KDV `VergiOrani` (C-6), tutarlar `hesaplaSatirTutarlari()`.
- **Gösterir:** tek tıkla kopyalanan muhatap alanları (A-13) · satırlar · KDV kırılımı · eksik fatura bilgisi uyarısı (A-13 §5, `EKSIK_FATURA_BILGISI`) · 7 gün uyarısı (`faturaGeriyeDonukUyarisi`) · bedelsiz satır notu · "Bilgi amaçlıdır — mali belge değildir" (C-1).
- `sablonTanimi` tanımsızken de çalışır. Pano kopyalama güvenli bağlam ister (demo HTTPS).
- **Canlı şartı:** K-7 §(4) yazılı teyidi alınmadan canlıda açılmaz.
- Yeni server action yok → `yetki.test.ts`'e yeni giriş gerekmez.

### Diğer
- **Kargo firmaları (Paket 12):** seed'e "Kurye" ve "Elden teslim" (`trackingUrlTemplate = null`). Şema değişmez.
- **Takip linki (Paket 4):** firmanın `trackingUrlTemplate`'i doluysa takip numarası dış bağlantı; boşsa düz metin.
- **C-1 §(4) "faturalandı" işareti:** Aşama 2 (fatura–sevkiyat N-N ilişkisi yeniden ele alınır).
- **Teslim fişi PDF:** Faz 2 (irsaliye ayrımı kararıyla).

---

## 4. Görsel kararlar

### Ürün sahibi kararı + ADR-013 — Sipariş ekranlarında durum sayıları sekmede
- **Siparişler (yönetici) ve Siparişlerim (satıcı)** ekranlarında KPI kart bloğu kalkar; sayılar durum sekmelerine taşınır ("Bekliyor 1").
- **Sekmedeki sayı = o sekmenin o anki dönem ve süzgeçlerdeki satır sayısı.** "Tümü" teklifleri de içerir (sekme onları listeliyor). Teklif sekmesi Paket 10'da gizlenir; demo verisinde `TEKLIF` sipariş yok, demoda "Tümü" = beş durumun toplamı.
- Etkin dönem ("Bu ay" vb.) sekmelerin yanında görünür kalır.
- Telefonda sekmeler yatay kayan şerit (menü şeridi deseni; yalnız şeridin `scrollLeft`'i).
- Hedef: 1440 px dizüstünde ve 390 px telefonda tablo ilk ekranda.
- **Belge rejimi:** ADR'ler değiştirilmez (`docs/adr/README.md` §2.2) → **ADR-013** yazılır; ADR-010'un yalnız 03.11 eki (6 kart yerleşimi) kaldırılır, ADR-010 Durum satırına not, README dizinine satır. KARARLAR'a ürün sahibi kararı eki. KABUL **A-5-8** ve **X-13-3** sekme sayısına göre yeniden yazılır. `KpiSatiri`'nın 6 kart dalı ve `kpi.test.ts`'teki istisnası silinir (sınır yeniden 1–4). Dashboard "Sipariş durumları" eşitliği korunur.

### Paket 16 — Demo görsel cila
1. Yukarıdaki sekme sayısı kararı (iki ekran).
2. **Stok ekranı:** "Mevcut Stok" ana tablo olarak üstte; Stok Girişi / Düzeltme / Konsinye Çıkış formları mevcut `YanPanel` ile yandan açılır (dar kolonda ad kırılması ve kesilen sütun biter).
3. **Dashboard:** üst uyarı bandı ile "Dikkat gerektirenler" kartı tekrarı tekilleşir; "Sayfalar" ızgarası menü kopyası olarak gözden geçirilir; aktivite akışında işlemin nesnesi yazılır ("Dr. Cem Arslan → Ayşe Demir").
4. **Doktorlar listesi:** eksik fatura satır arka planı kalkar, yalnız "Eksik fatura" etiketi kalır; toplu "Devret" çubuğu yalnız seçim varken çıkar.
5. **Metin:** "Dashboard" → "Genel Bakış"; takip no örnek metni "TR123456789" → "Takip no". (Demo notu: tarayıcı dili Türkçe olmalı — yerel tarih alanları.)
6. **İkon eşlemesi (`Ikon.tsx`, ADR-009 §8):** Ürünler (dünya ikonu değil), Sütunlar ve Kısmi sevk (kalem = Düzenle'ye ayrılmış).

### Diğer paketlere eklenen görsel işler
- **Paket 2:** ürün listesine arama kutusu; satırdaki kırmızı "Sil" düzenleme ekranına taşınır.
- **Paket 3:** aramalı doktor/ürün seçimi (gerçek katalog yüzlerce kalem, ~300 doktor); satırda fiyat, stok, KDV; masaüstü ve telefonda satır yerleşimi düzeltmesi ("Bedelsiz" kutusu, çöp ikonu).
- **Paket 4:** takip numarası dış bağlantı.
- **Paket 13:** sayfa başına sekme başlığı ("Siparişler · {marka}"); `public/` içindeki kullanılmayan şablon svg'leri (next, vercel, globe, window, file — `src` ve `e2e`'de atıf yok, doğrulandı) silinir.

### Yapılmayacaklar
Bileşen kütüphanesi (shadcn/MUI), karanlık mod, yeni palet, animasyon, baştan tasarım. Demo production build ile yapılır (dev rozeti görünmez); ekran tercihen 1920 px.

---

## 5. Paketler

| # | Paket | Kapsam | Ana dosyalar |
|---|---|---|---|
| 0 | Yol ayracı | Windows `\` normalizasyonu (ÜG-5) | `src/lib/izlenebilirlik.ts:39`, `src/lib/yetki.test.ts:78` |
| 1 ⏸ | Karar kaydı | §6 | `docs/KARARLAR.md`, `docs/KABUL_KRITERLERI.md`, `docs/adr/ADR-013-*.md`, `docs/adr/ADR-010-*.md` (Durum), `docs/adr/README.md`, `docs/YOL_HARITASI.md` |
| 2 | Ürün silme | C-3 + arama + Sil taşıma | `src/app/(admin)/products/actions.ts`, ürün listesi |
| 3 | Sipariş formu | A-10 (+ D2) + aramalı seçim + satır yerleşimi | `src/app/(seller)/my-orders/OrderForm.tsx`, policy, şema/migration (`CHECK`) |
| 4 | Kalanı kapat | A-3 + tüm sevkiyatlar + takip linki | şema/migration, sipariş detayı, sevkiyat |
| 5 | Risk / vade | A-12 | `src/lib/cari.ts`, içe aktarım, sipariş/sevkiyat sonuçları |
| 6 | Öksüz onay | A-8 | `onayKosulu` |
| 7 | Pasif doktor | A-4 (D1) + F-5 | `src/lib/stok-transfer.ts`, `src/app/(admin)/stock/page.tsx` |
| 8 | Denetim | X-18 / ÜF-1 | `AUDIT_ACTIONS`, stok-transfer, onay |
| 9 | OPERASYON paneli | D-2 | dashboard yerleşimi |
| 10 | UI düzeltmeleri | `paidAt` + doktor varlık kontrolü (ÜF-2) · kargolanmış siparişte iptal butonu (F-3, `orders/[id]/page.tsx:58`; onay metnindeki "stok geri yüklenecek" düzeltilir) · bayide hatalı "Sahipsiz" çipi (F-4, `doctors/[id]/page.tsx:166`) · Cari etiketleri ve bayi Unvan/Branş alanları (F-6) · Teklif sekmesinin `suzgec.ts`'ten çıkarılması (B-6) · belge no linki (ÜF-9) | `src/lib/tahsilat.ts`, `collections/actions.ts`, ilgili ekranlar |
| 11 | Güvenlik başlıkları | Temel: nosniff, frame, referrer, HSTS (ÜG-1). CSP Faz 2. | `next.config.ts` / `docker/Caddyfile` |
| 12 | Demo verisi + e2e | Jenerik estetik/tıbbi cihaz kataloğu (HA dolgu, mezoterapi, PDO ip, kanül/iğne, PRP kiti, cihaz sarfı; **toksin yok, gerçek marka yok**), KDV C-6'dan, ≥2 BAYI, barem (1+/10+/25+), özel liste atanmış cari, konsinye bırakılmış klinik, 1–2 onay bekleyen işlem, Kurye + Elden teslim, üç fatura senaryosu (tam / eksik / 7 günden eski). Seed + e2e **aynı commit**. `demo-gecmis.ts:124` tutar varsayımları kontrol edilir. | `prisma/seed-demo.ts`, `prisma/demo-gecmis.ts`, `e2e/**` |
| 15 | Fatura hazırlık kartı | §3 | `src/lib/disa-aktarim.ts`, yeni `src/components/siparis/FaturaHazirlikKarti.tsx`, `orders/[id]/page.tsx`, `disa-aktarim.itest.ts`, `e2e/admin/sevkiyat.spec.ts` |
| 16 | Demo görsel cila | §4 | `components/siparis/*`, `components/kpi/*`, `stock/*`, `components/dashboard/*`, `doctors/*`, `components/Ikon.tsx`, ilgili e2e |
| 13 | Marka ve parolalar | E-2 + sekme başlıkları + svg temizliği + deploy adımı | `layout.tsx`, `login/page.tsx`, `AppShell.tsx`, `global-error.tsx`, `globals.css`, `public/`, `prisma/seed-demo.ts`, `e2e/helpers.ts`, Dockerfile, `.env.demo.example`, README |
| 14 | Kapanış | Testler, izlenebilirlik, belge senkronu | `docs/TRACEABILITY.md` (üretilir), `docs/PROJE_DURUMU.md`, `docs/YOL_HARITASI.md` |

---

## 6. Paket 1'de yazılacaklar (onay kapısı)

- **KARARLAR ekleri** — biçim: `**✅ Ek (24.11.2026 · ürün sahibi kararı)**`; "Son güncelleme" satırı güncellenir:
  A-10 (D2 dahil) · A-3 · A-12 · A-4 (D1 dahil) · A-8 · D-2 · C-3 · X-18 · E-2 · **K-4 §(6)-(k)** (kart; D-5 §4 dışı gerekçesi açık) · sipariş ekranlarında sekme sayıları.
- **KABUL_KRITERLERI** — yeni satırlar (K-4-2, K-4-3, … ve diğer eklerin kriterleri; numara karar kimliğinden); **A-10-1** güncellenir; **A-5-8** ve **X-13-3** sekme sayısına göre yeniden yazılır.
- **ADR-013** — sipariş ekranlarında durum sayıları sekmede; ADR-010 Durum notu; `docs/adr/README.md` §4 dizin satırı.
- **YOL_HARITASI §4.2** — **Ü-39** satırı (bu revizyon); Ü-23 ve Ü-31 satırlarına not; Aşama 2 satırları.

---

## 7. Demo dışında kalanlar (tek birleşik liste)

### Aşama 2 — Canlı öncesi
1. İskonto tavanının Anka West'ten teyidi (`policy.pricing.iskontoTavani` sabitlenir).
2. Sevkiyatta kredi limiti aşımının BİLGİ'den **YUMUŞAK** onay bloğuna terfisi (A-12 eki; siparişte BİLGİ kalır, vade aşımı BİLGİ kalır).
3. Konsinyeden satış (A-4 revizyonu, SAP K2 deseni): sevkiyat kaynağı doktorun KONSINYE konumu olabilir; konsinye kaynağında negatif stok SERT red; iade Merkez Depo'ya döner.
4. Valör tarihi hesabı (ÜF-2, A-11).
5. Satıcı pasifleştirme yarışı (ÜF-4, `users/actions.ts:133`).
6. Prim oranı form alanı (ÜF-6, Ü-2).
7. IP bazlı hız sınırı ve zamanlama farkı (ÜG-3, `auth-actions.ts:33`).
8. Canlı config değerlerinin doldurulması (ÜG-4).
9. C-1 §(4) "faturalandı" işareti (fatura–sevkiyat N-N).
10. Sipariş detayında zaman çizelgesi ve iptal nedeni (görsel inceleme 10).
11. Bağlantı görünümü için tek kural (görsel inceleme 12).
12. Satıcının telefonda kart listesi ve sabit alt "Siparişi Oluştur" butonu (görsel inceleme 13).

### Aşama 3 — Faz 2 / ürünleştirme
1. Lot / SKT (FEFO) / ÜTS — D-3 revizyonu (B-1; modül sırasında kargo API'den önce).
2. Çek / senet portföyü (B-2; A-11 kapalı listesi karar ile açılır).
3. Salt okunur FIFO yaşlandırma raporu (B-3; X-6 ile C-2 karar ekiyle uzlaştırılır).
4. Hekim ruhsat / diploma alanı (B-4; opsiyonel, BİLGİ uyarısı; C-3 KVKK kapsamı).
5. Fiyat listesi toplu % güncelleme (B-5).
6. Konsinye yaşlandırma (30/60/90) ve numune görünürlük raporları.
7. Fiyat listesi dönem ekranı (ÜF-10; müşteri metni 10-a "bu sürümde açılmayacak").
8. Cari hareket sayfalaması (ÜF-9, `take: 50`).
9. Satıcı formunda fatura bilgisi (ÜF-11; A-13 eki/karar gerekir).
10. CSP (ÜG-1'in ikinci yarısı).
11. Oturum rotasyonu (ÜG-2).
12. Yedek ve gece invariant kontrolü (ÜG-6).
13. Tanım tabloları — ÜF-5 → mevcut **Ü-1** (kargo firması tanım ekranı dahil, Ü-37 notu).
14. Yazdırılabilir teslim fişi PDF (irsaliye ayrımı kararıyla).
15. Kongre modülü (B-7): K-6/C-4 korunur, kapalı teslim devam eder.

### Reddedilen
- **ÜF-3** (tüzel kişide yalnız VKN) — A-13 §(3) ile çelişir.

### Ürün sahibi gündemi
- e-Belge modülünün sırası ve tetikleyici eşiği (C-1 rev. 2 "2. müşteriden önce" ile değerlendirmedeki "250+ fatura / 3+ distribütör" eşiği uzlaştırılacak).

### Anka West'e teyit soruları
- GİB Portal'a faturalar elle mi giriliyor, Excel yükleme yok mu?
- İskonto tavanı (Aşama 2 madde 1).

### Yazılmayacaklar (§0.4)
- Doğrulanmamış sayısal iddialar KARARLAR'a ve satış metnine girmez: 6 ay saklama, dakika/yüzde kazanımları, 400–500 fatura.

---

## 8. Kurallar ve kısıtlar

- `docker-compose.yml` (yerel port 5432→5433 değişikliği) **commit'e girmez, değiştirilmez**.
- Commit mesajlarında **Claude imzası / Co-Authored-By yok** (proje kuralı).
- ADR-012 kilit sırası: doktor → ürün → `BelgeSayac` → (commit anında) denetim zinciri. Yeni kilit kaynağı = yeni ADR.
- Kod yazmadan önce ilgili `node_modules/next/dist/docs/` rehberi okunur (Next 16.2.10).
- Para `Decimal`; tek çağrı noktası; `yetki.test.ts`, `anti-sema.itest.ts`, `tasarim.test.ts` kurallarına uyulur.
- Kabul kriteri testten önce yazılır; `TRACEABILITY.md` elle düzenlenmez (`npm run izlenebilirlik`).
- Dış raporlar repoya kopyalanmaz; demo verisinde gerçek marka adı yok.
- Yayındaki demo sunucusundaki parolalar yalnız açık deploy adımıyla değişir.
- Ürün sahibi "kodlama yapma" dediğinde yalnız inceleme metni verilir.
