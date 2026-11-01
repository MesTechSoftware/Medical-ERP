# Stok Ekranı Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/stock` ekranına KPI kartları, tarih/tür/yön süzgeçli ve sayfalı hareket geçmişi (tür + belge no,
konum, işlemi yapan), sütun seçici ve boş durum eklemek; stok hareketine işlemi yapan kullanıcıyı yazmak
(eski kayıtları kaynak belgeden doldurarak); konsinyedeki malı toplu okumaya geçirmek.

**Architecture:** Ü-18/Ü-19 kalıbı. Adres parametresi yardımcıları ve süzgeç çubuğu parçaları ortaklaşır
(dördüncü kopya yazılmaz). Süzgeç ve sütun durumu `src/lib/stok-listesi/` saf modüllerinde; okumalar
`stok-listesi/sorgu.ts`'te tek `where` üreticisiyle. Tür sınıflaması `stok-hareket-turu.ts`'te tek tablodur
(etiket ve süzgeç aynı yerden). Yazım `stokHareketiYaz` üzerinden, `createdById` tipte zorunlu.

**Tech Stack:** Next.js 16 App Router (server components + server actions) · Prisma 7 / PostgreSQL ·
Tailwind · Vitest (`unit`, `integration`) · Playwright.

**Spec:** `docs/superpowers/specs/2026-11-01-stok-ekrani-design.md`

## Global Constraints

- Tek yeni "ne" kalemi KARARLAR B-4 ekidir (Task 1); başka karar ya da ADR açılmaz. Formlar ve `actions.ts` davranışı değişmez (spec §2).
- Stok toplamasının tek yolu `stok.ts` (B-4, ADR-005): `stockMovement.groupBy/aggregate` ve `FROM "StockMovement"` başka dosyada yazılmaz (`tek-cagri.test.ts`). `findMany`/`count` serbesttir.
- Stok hareketi yalnız `stokHareketiYaz()` ile yazılır (B-4-2); tek istisna `prisma/seed-demo.ts`'in mevcut doğrudan yazımı, o da `createdById` doldurur.
- Gün sınırları İstanbul günü: `zaman.ts` (`bugun`, `gunEkle`, `yerelGunAraligi`, `yerelGunMetni`, `ayAraligi`); `new Date()` yazılmaz. Adresteki gün `YYYY-AA-GG`.
- Kritik eşik `stokDurumu()` (`src/lib/stok-durumu.ts`); ikinci kez yazılmaz.
- Birim testi `db.ts`'i içe aktaramaz: `liste/parametreler.ts`, `stok-listesi/suzgec.ts`, `stok-listesi/sutunlar.ts`, `stok-hareket-turu.ts` saf kalır (`import type` serbest).
- Adres parametreleri: `baslangic`, `bitis`, `tur`, `yon`, `page`, `per`. `urun` formun önseçimidir; süzgeç adres üreticisi onu taşımaz.
- Rozet tonu `StatusChip ton="notr"`; yön renklendirilmez, miktar `+N` / `−N` (U+2212) (ADR-009 §2).
- Çerez `stok-sutunlar`, `path=/stock`, 1 yıl, `sameSite: "lax"`, `httpOnly`; varsayılan gizli sütun yok.
- Kabul kriteri yalnız mevcut karar kimliğinden numaralanır (B-4-8, B-4-9, B-4-10).
- Commit ve PR metinlerinde **Co-Authored-By / "Generated with Claude" satırı yok** (kullanıcı kuralı).
- Her PR: e2e yerelde (`PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="…" npx playwright test`, 3000'de dev sunucusu kapalı) → push/PR → CI `pass` → **`code-review` skill'i, bulgular düzeltilir** → `touch .superpowers/inceleme/<head-sha>` → merge.

## Review Focus

1. **İstanbul gün sınırı** — yerel 23:59'da yazılan hareket "Bugün" süzgecinde ve bugün KPI'ında; yerel 00:00 (UTC 21:00, önceki gün) hareketi yeni günde → Task 7 testi.
2. **Her hareket tam bir türde** — sipariş iptali iadesi (`orderId` dolu `GIRIS`) "Sipariş"tir, "Stok girişi" değildir; tür sayımları toplamı süzgeçsiz toplama eşit → Task 5 ve Task 7 testleri.
3. **Tek uçlu ya da ters tarih** — yalnız `bitis` verilirse açık başlangıç; `bitis < baslangic` ise yer değiştirir; `2026-02-30` yok sayılır → Task 6 testi.
4. **Sayfa dışı adres** (PR #85 dersi) — `/stock?page=999` son sayfaya yönlenir, "Henüz stok hareketi yok." çıkmaz → Task 9 testi.
5. **Konsinyede negatif ya da pasif ürün** — yöneticinin gerekçeyle eksiye düşürdüğü konsinye konumu (A-4 20.10 eki) ve pasifleşmiş ürünün konsinyedeki malı kartta görünür; sıfır satır görünmez → Task 7 testi.

---

## PR D1 — veri katmanı (ekran değişmez; konsinye kartı toplu okumaya geçer) · dal `revize/stok-d1-veri` (spec commit'i üzerinde)

### Task 1: Belgeler — KARARLAR B-4 eki, Ü-20, kabul kriterleri, devam notu

**Files:**
- Modify: `docs/KARARLAR.md` (B-4 karar satırının sonu, ~satır 2012; şema etki tablosu B-4 satırlarının altı, ~satır 2914; başlıktaki "Son güncelleme" satırı)
- Modify: `docs/YOL_HARITASI.md` (Ü tablosu, Ü-19 satırının altı)
- Modify: `docs/KABUL_KRITERLERI.md` (B-4-7 satırının altı)
- Modify: `MD_files/DEVAM_PROMPTU.md` (▶ satırı; git'te değil)

- [ ] **Step 1:** KARARLAR B-4 satırına ek: "**✅ Ek (01.11.2026 · ürün sahibi seçimi 28.10) — hareketi yapan.** Stok hareketi işlemi yapan kullanıcıyı taşır (`StockMovement.createdById`, nullable). Yazımda zorunludur. Eski kayıt kaynak belgenin sahibinden doldurulur (iade, konsinye, transfer, düzeltme, açılış partisi); sevkiyat, 1B-7a öncesi sipariş hareketi ve elle giriş boş kalır, ekranda "—"." Etki tablosuna: `| B-4 | **StockMovement.createdById** (nullable) — hareketi yapan; eski kayıt kaynak belgeden (01.11 eki) | Ü-20, şema |`. Başlık satırına 01.11 notu.
- [ ] **Step 2:** YOL_HARITASI'na Ü-20: "**Stok ekranı — KPI, hareket süzgeci, sütun seçici, işlemi yapan** *(01.11.2026 — kullanıcı talebi, 28.10 isterinin 2. modülü; §7-5)* | KPI (stoktaki ürün, kritik, bugün giriş/çıkış), tarih/tür/yön süzgeci, tür + belge no, konum ve işlemi yapan sütunları, konsinyedeki mal toplu okuma, ortak süzgeç parçaları — KARARLAR B-4 eki (01.11); kriterler B-4-8 · B-4-9 · B-4-10 · spec `docs/superpowers/specs/2026-11-01-stok-ekrani-design.md`".
- [ ] **Step 3:** KABUL_KRITERLERI'ne üç kriter, metinleri spec §6'dan aynen; yer kolonu yalnız var olan dosyaları anar, test dosyası doğunca eklenir:
  - **B-4-8** · `Ü-20 D1`
  - **B-4-9** · `Ü-20 D1`
  - **B-4-10** · `Ü-20 D1`
- [ ] **Step 4:** `npm run izlenebilirlik` · `npm test` (`izlenebilirlik.test.ts` PASS).
- [ ] **Step 5:** DEVAM_PROMPTU ▶ satırı: "Ü-20 D1 (`revize/stok-d1-veri`, plan `docs/superpowers/plans/2026-11-01-stok-ekrani.md`)".
- [ ] **Step 6: Commit** — `docs(stok-d1): KARARLAR B-4 eki (hareketi yapan), Ü-20 ve kabul kriterleri (B-4-8, B-4-9, B-4-10)`

### Task 2: Ortak adres parametresi yardımcıları

**Files:**
- Create: `src/lib/liste/parametreler.ts`, `src/lib/liste/parametreler.test.ts`
- Modify: `src/lib/doktor-listesi/suzgec.ts`, `src/lib/urun-listesi/suzgec.ts`, `src/lib/denetim/suzgec.ts` (yerel kopyalar silinir, ortak modülden içe aktarılır)

**Interfaces:**
- Produces:
  - `type Parametreler = Record<string, string | string[] | undefined>`
  - `ilk(p: Parametreler, ad: string): string | null` — dizide ilk eleman; boş metin `null`
  - `secenek<T extends string>(metin: string | null, gecerli: readonly T[]): T | null`
  - `gun(metin: string | null): string | null` — `YYYY-AA-GG` ve gerçek takvim günü, değilse `null`
  - `kimlik(metin: string | null): string | null` — `/^[A-Za-z0-9-]{1,64}$/`
- Üç modül `Parametreler` tipini dışa açmayı sürdürür (`export type { Parametreler }`); çağıranlar değişmez.

- [ ] **Step 1: Failing test** `parametreler.test.ts`: `ilk({ a: ["x", "y"] }, "a")` → `"x"`; `ilk({ a: "" }, "a")` → `null`; `secenek("B", ["A","B"])` → `"B"`, `secenek("C", …)` → `null`; `gun("2026-02-30")` → `null`, `gun("2026-02-28")` → `"2026-02-28"`, `gun("2026-2-8")` → `null`; `kimlik("a".repeat(65))` → `null`, `kimlik("cm-1")` → `"cm-1"`.
- [ ] **Step 2:** `npx vitest run --project unit src/lib/liste/parametreler.test.ts` → FAIL (modül yok).
- [ ] **Step 3: Implement**; üç süzgeç modülünü bu yardımcılara geçir (davranış aynı; doktor modülündeki `kimlik` adı korunur).
- [ ] **Step 4:** `npm test` → PASS (doktor, ürün, denetim süzgeç testleri değişmeden geçer) · `npm run typecheck` · `npm run lint`.
- [ ] **Step 5: Commit** — `refactor(stok-d1): adres parametresi yardımcıları ortak modüle — Doktorlar, Ürünler, Denetim geçer`

### Task 3: Hareketi yapan — şema, migration, yazım

**Files:**
- Modify: `prisma/schema.prisma` (`StockMovement`, `User`)
- Create: `prisma/migrations/20261101120000_stok_hareketi_yapan/migration.sql`
- Modify: `src/lib/stok.ts` (`StokHareketi`), çağıranlar: `src/lib/stok-giris.ts`, `src/app/(admin)/products/actions.ts`, `src/app/(admin)/orders/actions.ts`, `src/lib/stok-transfer.ts`, `src/lib/stok-duzeltme.ts`, `src/lib/iade.ts`, `src/lib/sevkiyat.ts`, `src/lib/ice-aktarim/acilis-stogu.ts`, `prisma/seed-demo.ts`
- Test: `src/lib/stok.itest.ts` (genişler), `src/lib/stok-hareketi-yapan.itest.ts` (yeni)

**Interfaces:**
- Produces:
  - Şema: `createdById String?` · `createdBy User? @relation("StockMovementBy", fields: [createdById], references: [id])`; `User.stockMovements StockMovement[] @relation("StockMovementBy")`
  - `type StokHareketi = Omit<Prisma.StockMovementUncheckedCreateInput, "id" | "createdAt" | "createdById"> & { createdById: string }`
- Migration: kolon + FK (`ON DELETE RESTRICT`), ardından `-- doldurma` yorum satırının altında beş `UPDATE "StockMovement" m SET "createdById" = k.<sahip> FROM "<Kaynak>" k WHERE m."<fk>" = k.id AND m."createdById" IS NULL` — `ReturnNote.createdById` / `returnNoteId`, `ConsignmentIssue.createdById` / `consignmentIssueId`, `StockTransfer.createdById` / `stockTransferId`, `StockAdjustment.createdById` / `stockAdjustmentId`, `ImportBatch.userId` / `importBatchId`.
- Yapan kaynakları: `stok-giris.ts` `g.yapanId` · products/orders action `session.user.id` · `sevkiyat.ts` `girdi.yapan.id` · transfer/düzeltme/iade belgesinin `createdById`'si (fonksiyonun aldığı yapan) · açılış stoğu partinin `userId`'si · seed `admin.id`.

- [ ] **Step 1: Failing tests:**
  - `stok.itest.ts` `"stokHareketiYaz yapanı yazar (B-4-8)"` — yazılan hareketin `createdById`'si verilen kullanıcı.
  - `stok-hareketi-yapan.itest.ts` `"doldurma: beş kaynak belgenin sahibinden dolar, sevkiyat ve elle giriş boş kalır (B-4-8)"` — `referansVeri` ile iade, konsinye, transfer, düzeltme, açılış partisi, sevkiyat ve elle giriş hareketi kur; hepsinin `createdById`'sini `NULL` yap; migration dosyasını oku, `-- doldurma` altındaki ifadeleri `$executeRawUnsafe` ile çalıştır; ilk beşi belge sahibine eşit, son ikisi `null`.
- [ ] **Step 2:** `npx vitest run --project integration src/lib/stok.itest.ts src/lib/stok-hareketi-yapan.itest.ts` → FAIL.
- [ ] **Step 3: Implement** şema, migration (`npx prisma migrate dev --create-only` ile üret, doldurmayı ekle), tip ve dokuz çağıran. `npx prisma generate`.
- [ ] **Step 4:** `npm run typecheck` (eksik `createdById` derleme hatası olur — hepsi kapandı) · `npm test` · `npx vitest run --project integration` → PASS. KABUL_KRITERLERI B-4-8 yerine iki test dosyasını ekle, `npm run izlenebilirlik`.
- [ ] **Step 5: Commit** — `feat(stok-d1): stok hareketi işlemi yapanı taşır; eski kayıtlar kaynak belgeden dolar (B-4-8)`

### Task 4: Konum stokları — `konumStoklari`

**Files:**
- Modify: `src/lib/stok.ts`
- Test: `src/lib/stok.itest.ts`

**Interfaces:**
- Produces: `konumStoklari(konumIdler: readonly string[], db?: Db): Promise<Map<string, Map<string, number>>>` — tek `groupBy({ by: ["locationId", "productId", "type"] })`; her istenen konum haritada (hareketsiz konum boş harita); boş girdi sorgusuz boş harita.

- [ ] **Step 1: Failing test** `"konumStoklari her konum ve ürün için hesaplaStok ile aynı (B-4-9)"` — iki konsinye konumu, üç ürün, giriş/çıkış karışık, bir konumda sıfıra inen ürün, bir konum hareketsiz; her (k, u) için `konumStoklari([...]).get(k)?.get(u) ?? 0` ≡ `hesaplaStok(u, k)`; hareketsiz konum `size === 0`.
- [ ] **Step 2:** → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4:** `npx vitest run --project integration src/lib/stok.itest.ts` · `npm test` (`tek-cagri.test.ts`) → PASS. B-4-9 yerine `stok.itest.ts`.
- [ ] **Step 5: Commit** — `feat(stok-d1): konumStoklari — konum × ürün toplu stok, hesaplaStok ile aynı (B-4-9)`

### Task 5: Hareket türü sınıflaması — tek tablo

**Files:**
- Modify: `src/lib/stok-hareket-turu.ts`
- Test: `src/lib/stok-hareket-turu.test.ts`

**Interfaces:**
- Produces:
  - `type HareketTuruKodu = "giris" | "sevkiyat" | "iade" | "konsinye" | "transfer" | "duzeltme" | "acilis" | "siparis"`
  - `HAREKET_TURLERI: readonly { kod: HareketTuruKodu; etiket: string }[]` — süzgeç seçenek sırası: Stok girişi · Sevkiyat · İade · Konsinye · Transfer · Düzeltme · Açılış · Sipariş
  - `turKosulu(kod: HareketTuruKodu): Prisma.StockMovementWhereInput` (`import type`) — kaynak alanı dolu **ve** `ETIKETLER` sırasında ondan önceki alanların hepsi `null` (`hareketTuru()`'nun `find` önceliğiyle aynı); `giris` → bütün kaynak alanları `null`
  - `hareketTuruKodu(h: HareketKaynagi): HareketTuruKodu`; `hareketTuru(h)` etiketi bu koddan okur (kaynaksız çıkış "Çıkış" kalır)

- [ ] **Step 1: Failing tests:** her kaynak alanı tek başına dolu → beklenen kod ve etiket; kaynaksız `GIRIS` → `giris`/"Stok girişi", kaynaksız `CIKIS` → `giris`/"Çıkış"; `orderId` dolu `GIRIS` → `siparis`; `turKosulu("iade")` `shipmentId: null` ve `returnNoteId: { not: null }` içerir, `orderId` koşulu içermez; `turKosulu("giris")` yedi alanın hepsi `null`; `HAREKET_TURLERI` kodları `HareketTuruKodu`'nun hepsini bir kez içerir.
- [ ] **Step 2:** `npx vitest run --project unit src/lib/stok-hareket-turu.test.ts` → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4:** → PASS (mevcut iki test değişmeden).
- [ ] **Step 5: Commit** — `feat(stok-d1): hareket türü kodu ve süzgeç koşulu etiketle tek tablodan`

### Task 6: Stok listesi saf modülleri — süzgeç ve sütunlar

**Files:**
- Create: `src/lib/stok-listesi/suzgec.ts`, `src/lib/stok-listesi/sutunlar.ts`, `src/lib/stok-listesi/suzgec.test.ts`

**Interfaces:**
- Consumes: Task 2 (`liste/parametreler.ts`), Task 5 (`HareketTuruKodu`, `HAREKET_TURLERI`), `liste/sutunlar.ts` (`SutunTanimi`).
- Produces:
  - `type StokSuzgeci = { baslangic: string | null; bitis: string | null; tur: HareketTuruKodu | null; yon: "GIRIS" | "CIKIS" | null }` · `BOS_SUZGEC`
  - `suzgecCoz(p: Parametreler): StokSuzgeci` — `bitis < baslangic` ise yer değiştirir
  - `stokAdresi(s: StokSuzgeci, ek?: { page?: number; per?: number }): string` — `/stock[?…]`, sıra `baslangic, bitis, tur, yon, page, per`; `urun` yok
  - `hizliSekmeler(bugun: string): { etiket: "Tümü" | "Bugün" | "Son 7 gün" | "Bu ay"; tarih: { baslangic: string | null; bitis: string | null } }[]` — Bugün `[b, b]`, Son 7 gün `[b−6, b]`, Bu ay `[ayın 1'i, b]`
  - `sekmeAdresi(s: StokSuzgeci, tarih): string` — tarihleri yazar, `tur`/`yon`'u korur, sayfayı düşürür
  - `etkinSuzgecler(s: StokSuzgeci): { anahtar: "tarih" | "tur" | "yon"; etiket: string; kaldirAdresi: string }[]` — "Tarih: 01.11.2026 – 01.11.2026" (tek uçta karşı taraf boş: "Tarih: 01.11.2026 –"), "Tür: Sevkiyat", "Yön: Çıkış"
  - `bosDurum(s: StokSuzgeci): "hic-kayit" | "suzgecli"`
  - `sutunlar.ts`: `type StokSutunu = "tur" | "konum" | "aciklama" | "yapan"` · `SUTUNLAR: readonly SutunTanimi<StokSutunu>[]` (başlıklar "Tür", "Konum", "Açıklama", "İşlemi yapan"; hiçbiri `varsayilanGizli` değil) · `SUTUN_CEREZI = "stok-sutunlar"` · `SUTUN_YOLU = "/stock"`

- [ ] **Step 1: Failing tests** `suzgec.test.ts`: gidiş-dönüş (`suzgecCoz(adres parametreleri) ≡ s`); geçersiz `tur=x`, `yon=giris` (küçük harf), `baslangic=2026-02-30` yok sayılır; `bitis=2026-10-01&baslangic=2026-10-31` → yer değişir; `urun=…` adreste taşınmaz; `hizliSekmeler("2026-11-01")` → Son 7 gün `2026-10-26`, Bu ay `2026-11-01`; `hizliSekmeler("2026-03-03")` → Son 7 gün `2026-02-25`; `sekmeAdresi` `tur=sevkiyat`'ı korur, `page` düşer; etiket metinleri ve her etiketin kaldırma adresi yalnız kendi parametresini düşürür; `bosDurum(BOS_SUZGEC)` → `hic-kayit`.
- [ ] **Step 2:** `npx vitest run --project unit src/lib/stok-listesi` → FAIL.
- [ ] **Step 3: Implement** (gün aritmetiği `zaman.ts`'ten: `yerelGunAraligi(metin)` → `gunEkle` → `yerelGunMetni`).
- [ ] **Step 4:** → PASS.
- [ ] **Step 5: Commit** — `feat(stok-d1): stok listesi süzgeci ve sütun tanımı`

### Task 7: Stok listesi sorguları; konsinye kartı geçer

**Files:**
- Create: `src/lib/stok-listesi/sorgu.ts`, `src/lib/stok-listesi/sorgu.itest.ts`
- Modify: `src/app/(admin)/stock/page.tsx` (yalnız "Konsinyedeki Mal" okuması `konsinyedekiMal()`'a geçer)

**Interfaces:**
- Consumes: Task 3 (şema), Task 4 (`konumStoklari`), Task 5 (`turKosulu`, `hareketTuru`, `HAREKET_KAYNAGI`), Task 6 (`StokSuzgeci`), `aktifUrunStoklari`, `stokDurumu`.
- Produces:
  - `hareketKosulu(s: StokSuzgeci): Prisma.StockMovementWhereInput` — `createdAt: { gte: yerelGunAraligi(baslangic).baslangic, lt: yerelGunAraligi(bitis).bitis }` (tek uç açık), `type: yon`, `turKosulu(tur)`
  - `type StokHareketSatiri = { id: string; createdAt: Date; urun: { id: string; name: string; code: string }; tur: string; belgeNo: string | null; konum: string; miktar: number; not: string | null; yapan: string | null }`
  - `stokHareketleri(s: StokSuzgeci, sayfa: { skip: number; take: number }): Promise<{ satirlar: StokHareketSatiri[]; toplam: number }>` — `orderBy: [{ createdAt: "desc" }, { id: "desc" }]`; `miktar` girişte `+`, çıkışta `−`; `belgeNo` sevkiyat → iade → konsinye → transfer → düzeltme → sipariş belgesinin `documentNo`'su (`hareketTuruKodu` ile seçilir), açılışta `null`
  - `stokKpileri(bugun: string): Promise<{ stoktaki: number; toplamAdet: number; kritik: number; bugunGiris: number; bugunCikis: number }>` — bugünkü sayımlar `count({ where: hareketKosulu({ ...BOS_SUZGEC, baslangic: bugun, bitis: bugun, yon }) })`
  - `konsinyedekiMal(): Promise<{ konum: string; urun: string; miktar: number }[]>` — aktif `KONSINYE` konumları + `konumStoklari` + ürün adları (pasif dahil); sıfır düşer; konum, sonra ürün adına göre

- [ ] **Step 1: Failing tests** `sorgu.itest.ts`:
  - `"tarih süzgeci İstanbul günüdür"` — yerel 23:59 ve ertesi 00:00 hareketi; `baslangic=bitis=<gün>` yalnız ilkini verir.
  - `"tür × yön birleşir; her hareket tam bir türdedir (B-4-10)"` — her türden hareket + iptal iadesi (`orderId` `GIRIS`); `Σ toplam(tur=k)` = süzgeçsiz toplam; iptal iadesi `tur=siparis`'te, `tur=giris`'te değil.
  - `"satır: belge no, konum, ± miktar, yapan; eski kayıtta yapan null"`.
  - `"sayfalama süzgeçten sonra; toplam süzgeçli sayım"`.
  - `"KPI bugün giriş/çıkış = aynı süzgeçli liste toplamı (B-4-10); stoktaki ve toplam adet yalnız stok > 0 aktif ürün"`.
  - `"konsinyedeki mal: pasif ürün ve negatif konum görünür, sıfır görünmez"`.
- [ ] **Step 2:** `npx vitest run --project integration src/lib/stok-listesi/sorgu.itest.ts` → FAIL.
- [ ] **Step 3: Implement** sorguları; `page.tsx`'te konsinye bloğunu (`konsinyeler.flatMap(... hesaplaStok ...)`) `konsinyedekiMal()` ile değiştir.
- [ ] **Step 4:** `npm run typecheck` · `npm run lint` · `npm test` · `npx vitest run --project integration` → PASS. B-4-10 yerine `stok-listesi/sorgu.itest.ts`; `npm run izlenebilirlik`.
- [ ] **Step 5: Commit** — `feat(stok-d1): stok listesi sorguları — süzgeç, satırlar, KPI, konsinyedeki mal (B-4-10)`

### D1 teslim

- [ ] E2E yerelde tamamı (ekran değişmedi; `konsinye.spec.ts`, `stok-duzeltme.spec.ts`, `doktorlar.spec.ts`, `urunler.spec.ts`, `denetim.spec.ts` dahil) → PASS.
- [ ] Push, PR (Özet / Değişiklikler / Notlar / Test), CI `pass` → `code-review` → düzeltmeler (yeni commit varsa yeniden gözden geçirme) → işaret → merge. D2 dalı güncel `main`'den.

---

## PR D2 — ekran ve kapanış · dal `revize/stok-d2-ekran`

### Task 8: Ortak süzgeç çubuğu parçaları — `HizliSekmeler`, `EtkinSuzgecler`

**Files:**
- Create: `src/components/liste/HizliSekmeler.tsx`, `src/components/liste/EtkinSuzgecler.tsx`
- Modify: `src/app/(admin)/doctors/SuzgecCubugu.tsx`, `src/app/(admin)/products/SuzgecCubugu.tsx`

**Interfaces:**
- Produces:
  - `HizliSekmeler({ sekmeler }: { sekmeler: readonly { etiket: string; adres: string; etkin: boolean }[] })` — `nav aria-label="Hızlı süzgeçler"`, `aria-current="page"`, bugünkü hap sınıfları (`h-(--toolbar-h)` …) aynen
  - `EtkinSuzgecler({ etiketler }: { etiketler: readonly { anahtar: string; etiket: string; kaldirAdresi: string }[] })` — boşsa hiçbir şey çizmez; `ul aria-label="Etkin süzgeçler"`, bağlantı `aria-label="Kaldır: <etiket>"` + `Ikon ad="vazgec"`; bugünkü sınıflar aynen

- [ ] **Step 1:** Bileşenleri çıkar; iki ekranı bağla (işaretleme bit bit aynı).
- [ ] **Step 2:** `npm run typecheck` · `npm run lint` · `npm test` (`tasarim.test.ts` dahil).
- [ ] **Step 3:** E2E `e2e/admin/doktorlar.spec.ts`, `e2e/admin/urunler.spec.ts`, `e2e/mobil/doktorlar.spec.ts`, `e2e/mobil/urunler.spec.ts`, `e2e/mobil/iskelet.spec.ts` → PASS (davranış değişmedi).
- [ ] **Step 4: Commit** — `refactor(stok-d2): hızlı sekmeler ve etkin süzgeç etiketleri ortak bileşene — Doktorlar, Ürünler geçer`

### Task 9: Stok ekranı — KPI, süzgeç çubuğu, tablo, sütun seçici, sayfalama, boş durum

**Files:**
- Create: `src/app/(admin)/stock/KpiKartlari.tsx`, `SuzgecCubugu.tsx`, `HareketTablosu.tsx`, `sutunEylemi.ts`, `loading.tsx`
- Modify: `src/app/(admin)/stock/page.tsx`
- Test: `e2e/admin/stok-ekrani.spec.ts` (yeni), `e2e/operasyon/operasyon.spec.ts`

**Interfaces:**
- Consumes: Task 6, 7, 8; `SutunSecici`, `BosDurum`, `gizliSutunlariCoz`, `guvenliDonus`, `KpiCard`/`KpiSatiri`, `getPagination`/`pageCount`, `Pagination`.
- Sayfa: `requireStaff`; `const bugunMetni = yerelGunMetni(bugun())`; `Promise.all([stokHareketleri(suzgec, { skip, take }), stokKpileri(bugunMetni), mevcut form okumaları, konsinyedekiMal()])`; `satirlar.length === 0 && toplam > 0` → `redirect(stokAdresi(suzgec, { ...yer, page: pageCount(toplam, perPage) }))`; `?urun=` önseçimi bugünkü gibi.
- `KpiKartlari` `section aria-label="Stok sayıları"`: Stoktaki ürün (`ikincilMetrik` "toplam N adet", bağlantısız) · Kritik stok (`/products?durum=AKTIF&stok=kritik`, > 0 ise `vurgu="uyari"`) · Bugün giriş · Bugün çıkış (`stokAdresi({ ...BOS_SUZGEC, baslangic: bugun, bitis: bugun, yon })`, `karsilastirma: { anlik: "bugün" }`).
- `SuzgecCubugu`: `HizliSekmeler` (`hizliSekmeler(bugun)` + `sekmeAdresi`) · Filtrele `details` içinde GET formu `aria-label="Hareket süzgeci"` (Başlangıç, Bitiş `type="date"`, Tür `HAREKET_TURLERI`, Yön, Uygula; `key={stokAdresi(suzgec)}`) · `SutunSecici` · `EtkinSuzgecler`.
- `HareketTablosu`: spec §3.4 sütunları; ürün `Link href={`/products?detay=${id}`}`; boş durum spec §3.6 (`temizleAdresi="/stock"` yalnız `suzgecli`).
- `loading.tsx`: `KpiSatiriIskeleti` (dört kart, aynı etiketler) + `SuzgecCubuguIskeleti(sekmeler, ["Filtrele", "Sütunlar"])` + `TabloIskeleti`, formlar sütunu ile aynı iki sütun yerleşimi (ADR-009 ölçü testleri).

- [ ] **Step 1: Failing e2e** `stok-ekrani.spec.ts`:
  - `"Bugün giriş kartı süzgeci uygular; satır sayısı = kart (B-4-10)"` — önce bir stok girişi kaydet; kartı tıkla → URL `baslangic=<bugün>&bitis=<bugün>&yon=GIRIS`; etiketler "Tarih: …", "Yön: Giriş"; satır sayısı = kart değeri.
  - `"yeni girişte işlemi yapan kullanıcı adı görünür (B-4-8)"`.
  - `"Filtrele formu tür süzgeci uygular; × ile kalkar"` — Tür = Düzeltme → tüm satırların türü "Düzeltme"; × → URL `tur` taşımaz.
  - `"sütun gizlenir ve kalıcıdır"` — İşlemi yapan'ı gizle → yenile → başlık yok → Varsayılana dön → var.
  - `"süzgece uyan hareket yoksa boş durum ve temizleme"` — `?baslangic=2000-01-01&bitis=2000-01-01` → "Bu süzgeçlere uyan hareket bulunamadı." → Süzgeçleri temizle → `/stock`.
  - `"sayfa dışı adres son sayfaya gider"` — `?yon=GIRIS&per=1&page=999` → URL `yon=GIRIS`, `per=1`, `page=<GIRIS sayısı>`; bir satır.
  - `operasyon.spec.ts` `"OPERASYON stok KPI ve hareket tablosunu görür; Stok Düzeltme yok"`.
- [ ] **Step 2:** E2E dosyası → FAIL.
- [ ] **Step 3: Implement** bileşenleri ve sayfayı.
- [ ] **Step 4:** `npm run typecheck` · `npm run lint` · `npm test` · tüm e2e → PASS. KABUL_KRITERLERI B-4-8 ve B-4-10 yerlerine `e2e/admin/stok-ekrani.spec.ts`.
- [ ] **Step 5: Commit** — `feat(stok-d2): stok ekranı — KPI, hareket süzgeci, tür ve belge no, işlemi yapan, sütun seçici, sayfalama (B-4-8, B-4-10)`

### Task 10: Kapanış belgeleri

**Files:**
- Modify: `docs/YOL_HARITASI.md` (Ü-20 ✅ "01.11.2026'da D1–D2 ile yapıldı"), `docs/PROJE_DURUMU.md` (arayüz bölümünde Stok maddesinin altına liste/süzgeç/yapan alt maddesi), `docs/TRACEABILITY.md` (`npm run izlenebilirlik`), `MD_files/DEVAM_PROMPTU.md` (▶ sıradaki: Fiyat listeleri ekranı — Ü-21 spec'i; açık iş notu: siparişler, tahsilatlar, satıcı listelerinde sayfa dışı boş durum — ortak sayfalama yardımcısı)

- [ ] **Step 1:** Belgeleri güncelle.
- [ ] **Step 2:** `npm run izlenebilirlik` · `npm test` → PASS.
- [ ] **Step 3: Commit** — `docs(stok-d2): Ü-20 kapanışı`

### D2 teslim

- [ ] E2E yerelde tamamı → PASS. Push, PR, CI `pass` → `code-review` → düzeltmeler → işaret → merge. Ardından Fiyat listeleri ekranı (Ü-21) için brainstorming.
