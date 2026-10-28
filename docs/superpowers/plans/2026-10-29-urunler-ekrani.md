# Ürünler Ekranı Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/products` ürün listesine KPI kartları, durum/stok süzgeci, çerezli sütun seçici (KDV dahil
liste fiyatı varsayılan gizli), sayfalama, boş durum ve sağdan yan panel (90 günlük stok grafiği, son
hareketler, fiyat listeleri) eklemek; stok ve liste fiyatını toplu okumaya geçirmek.

**Architecture:** Ü-18 kalıbı. Süzgeç ve sütun durumu saf modüllerde; sütun modülü ve iki bileşen
(`SutunSecici`, `BosDurum`) ortaklaşır, Doktorlar ekranı da onlara geçer. Okumalar
`src/lib/urun-listesi/sorgu.ts`'te; stok `hesaplaStoklar` (tek okuma yolu), fiyat `cozumleListeFiyatlari`
(tek seçim yolu) ile toplu. Panel `?detay=` ile sunucuda çizilir.

**Tech Stack:** Next.js 16 App Router (server components + server actions) · Prisma 7 / PostgreSQL ·
Tailwind · Vitest (`unit`, `integration`) · Playwright.

**Spec:** `docs/superpowers/specs/2026-10-29-urunler-ekrani-design.md`

## Global Constraints

- Yeni karar ya da ADR açılmaz; Sil düğmesi ve `deleteProduct` değişmez (spec §2).
- Stok okumasının tek yolu `stok.ts` (B-4, ADR-005): `stockMovement.groupBy/aggregate` ve `FROM "StockMovement"` başka dosyada yazılmaz.
- Liste fiyatı seçiminin tek yolu `fiyat.ts` (B-5, B-6, X-10); satır seçim koşulu iki yerde yazılmaz.
- Para aritmetiği yalnız `fiyat.ts` ve `satir-tutarlari.ts` (X-5 §(4)); KDV dahil fiyat `hesaplaSatirTutarlari` ile, yeni aritmetik yok. `.add/.div` ve `Number()` lint'te yasak.
- Para gösterimi `<Tutar>`; tablo başlığında `tabanli("…", MATRAH | BRUT)` + `baslikta` (Ü-3-1).
- Kritik eşik `CRITICAL_STOCK` (10) ve `stokDurumu()` (`src/lib/stok-durumu.ts`); eşik ikinci kez yazılmaz.
- Gün sınırları İstanbul günü: `zaman.ts` (`gunAraligi`, `bugun`, `gunEkle`, `yerelGunMetni`, `simdi`); `new Date()` yazılmaz.
- Birim testi `db.ts`'i içe aktaramaz: `liste/`, `urun-listesi/suzgec.ts`, `urun-listesi/sutunlar.ts`, `stok-hareket-turu.ts` saf kalır.
- Adres parametreleri: `durum`, `stok`, `page`, `per`, `detay` (Doktorlar ekranıyla aynı sayfalama adları).
- Rozet tonları mevcut `StatusChip` tonları; yeni renk yok.
- Kabul kriteri yalnız mevcut karar kimliğinden numaralanır; Ü-19-n açılmaz.
- Commit ve PR metinlerinde **Co-Authored-By / "Generated with Claude" satırı yok** (kullanıcı kuralı).
- Merge yalnız `gh pr checks` "pass" görüldükten sonra. E2E push'tan önce yerelde koşulur (`PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION` gerektirir; ajan koşamazsa kullanıcıdan `!` ile istenir).

## Review Focus

1. **Negatif stok** (B-4 engellemez) "Tükendi" sayılır; hem `stok=tukendi` hem `stok=kritik` süzgecine ve kritik KPI'ına girer → Task 8 testi.
2. **Fiyatı çözülemeyen ürün** (varsayılan listede satırı yok, ya da yalnız `minQuantity` 10 satırı var) satırda "—" gösterir, KDV dahil de `null`; sayfa düşmez → Task 4 ve Task 8 testleri.
3. **İstanbul gece yarısı** — 00:00 yerel (UTC 21:00, önceki gün) anında yazılan hareket seride yeni güne düşer → Task 3 testi.
4. **Doktorlar ekranının eski çerezi** (`doktor-sutunlar=` boş değer ya da `klinik,telefon`) ortak modüle geçtikten sonra aynı görünümü verir → Task 5 testi.
5. **İleri tarihli fiyat satırı** (`validFrom` > bugün) panelde listelenir ama listedeki bugünkü fiyatı değiştirmez; süresi geçmiş satır (`validTo` ≤ bugün) panelde yok → Task 8 testi.

---

## PR D1 — veri katmanı (ekran değişmez) · dal `revize/urunler-d1-veri` (açık; spec commit'i üzerinde)

### Task 1: Belgeler — Ü-19, kabul kriterleri, devam notu

**Files:**
- Modify: `docs/YOL_HARITASI.md` (Ü tablosu, Ü-18 satırının altı)
- Modify: `docs/KABUL_KRITERLERI.md` (B-4, X-10, Ü-3, D-2 gruplarının sonu)
- Modify: `MD_files/DEVAM_PROMPTU.md` (▶ satırı)

- [ ] **Step 1:** YOL_HARITASI'na Ü-19: "**Ürünler ekranı — KPI, süzgeç, sütun seçici, yan panel** *(29.10.2026 — kullanıcı talebi; §7-5)* | KPI, durum/stok süzgeci, KDV dahil sütunu (varsayılan gizli), yan panel (90 gün stok grafiği, son hareketler, fiyat listeleri), toplu stok ve fiyat okuması — yeni karar yok; spec `docs/superpowers/specs/2026-10-29-urunler-ekrani-design.md`".
- [ ] **Step 2:** KABUL_KRITERLERI'ne dört kriter, metinleri spec §6'dan aynen; yer kolonu:
  - **B-4-7** · `Ü-19 D1 · stok.itest.ts · tek-cagri.test.ts`
  - **X-10-4** · `Ü-19 D1 · fiyat.itest.ts · urun-listesi/sorgu.itest.ts`
  - **Ü-3-2** · `Ü-19 D2 · urun-listesi/sorgu.itest.ts · e2e/admin/urunler.spec.ts`
  - **D-2-2** · `Ü-19 D3 · e2e/operasyon/operasyon.spec.ts`
- [ ] **Step 3:** DEVAM_PROMPTU ▶ satırı: "Sayfa modernizasyonu (28.10 isteri, seçimler 1-A…13-A hepsi önerilen): sıra Ürünler (Ü-19) → Stok → Fiyat listeleri → Kullanıcılar → Siparişler → Kargo; her biri spec + D1–D3. Şu an Ü-19 D1." Ü-18 maddesine "D2 #80, D3 #81 merge edildi" ekle.
- [ ] **Step 4: Commit** — `docs(urunler-d1): Ü-19 ve kabul kriterleri (B-4-7, X-10-4, Ü-3-2, D-2-2)`

### Task 2: Toplu stok — `hesaplaStoklar`

**Files:**
- Modify: `src/lib/stok.ts` (`hesaplaStok`, `aktifUrunStoklari`)
- Test: `src/lib/stok.itest.ts`, `src/lib/tek-cagri.test.ts`

**Interfaces:**
- Produces: `hesaplaStoklar(urunIdler: readonly string[], konumId?: string, tarih?: Date, db?: Db): Promise<Map<string, number>>` — her istenen kimlik haritada (hareketsiz 0); boş liste sorgu atmadan boş harita.
- `hesaplaStok(urunId, konumId?, tarih?, db?)` imzası aynı; gövdesi `(await hesaplaStoklar([urunId], …)).get(urunId)!`.
- `aktifUrunStoklari()` çıktısı aynı (ad sırası, `{ id, name, code, stok }`).

- [ ] **Step 1: Failing tests** — `stok.itest.ts`'e `describe("hesaplaStoklar — toplu ≡ tekli (B-4-7)")`:
  - `"her ürün için tekliyle aynı: konumsuz, konumlu, tarihli"` — 3 ürün: (a) giriş 20 + sevkiyat çıkışı 5 (b) depo → konsinye transfer 4 (c) hareketsiz. Her ürün × (konumsuz, depo, konsinye, dünün tarihi) için `hesaplaStoklar(...).get(id) === await hesaplaStok(id, …)`.
  - `"hareketsiz ürün 0 döner"`, `"boş liste boş harita"`.
  - `"negatif stok korunur"` — giriş 2, çıkış 5 → `-3`.
- [ ] **Step 2: Failing guard** — `tek-cagri.test.ts`'e yazım korumasının yanına okuma koruması: `/stockMovement\.(groupBy|aggregate)\s*\(|FROM\s+"StockMovement"/` yalnız `src/lib/stok.ts`'te (yazım korumasının dosya tarama yardımcısını kullan). Bugün zaten geçer; Step 4'te tekrar koşulur.
- [ ] **Step 3:** `npx vitest run --project integration src/lib/stok.itest.ts` → yeni testler FAIL (`hesaplaStoklar is not a function`).
- [ ] **Step 4: Implement** — tek `groupBy({ by: ["productId", "type"], where: { productId: { in }, …konum, …tarih (gunAraligi(tarih).bitis) }, _sum: { quantity } })`; harita önce bütün kimliklerle 0'lanır. `hesaplaStok` sarmalayıcı olur, üst yorumu "toplu ve tekli aynı yoldur (B-4-7)". `aktifUrunStoklari` tek `hesaplaStoklar` çağırır.
- [ ] **Step 5:** `npx vitest run --project integration` ve `npm test` → tamamı PASS.
- [ ] **Step 6: Commit** — `feat(urunler-d1): hesaplaStoklar — toplu stok, tek okuma yolu (B-4-7)`

### Task 3: Stok serisi — `stokSerisi`

**Files:**
- Modify: `src/lib/stok.ts`
- Test: `src/lib/stok.itest.ts`

**Interfaces:**
- Produces: `stokSerisi(urunId: string, gunSayisi: number, db?: Db): Promise<{ gun: string; stok: number }[]>` — uzunluk `gunSayisi`, eskiden yeniye; `gun` `yerelGunMetni` biçimi (`YYYY-AA-GG`); son eleman bugündür.

- [ ] **Step 1: Failing tests** — `describe("stokSerisi (B-4-7)")`:
  - `"her nokta o günün hesaplaStok değeridir"` — 5 gün önce giriş 10, 2 gün önce çıkış 3, bugün giriş 1 (`createdAt` doğrudan yazılarak). `stokSerisi(id, 7)` her `{ gun, stok }` için `stok === await hesaplaStok(id, undefined, yerelGunAraligi(gun)!.baslangic)`; son nokta `hesaplaStok(id)`.
  - `"İstanbul gece yarısı yeni güne düşer"` — hareket `createdAt` = dün İstanbul 00:00 (`yerelGunAraligi(dün).baslangic`); dünün noktası hareketi içerir, önceki gününki içermez.
  - `"hareketsiz ürün sıfır serisi"` → 90 eleman, hepsi 0.
- [ ] **Step 2:** Aynı dosya → FAIL.
- [ ] **Step 3: Implement** — `ilk = gunEkle(bugun(), -(gunSayisi - 1))`; başlangıç `hesaplaStok(urunId, undefined, gunEkle(ilk, -1), db)`; aralıktaki hareketler tek `findMany({ where: { productId, createdAt: { gte: gunAraligi(ilk).baslangic } }, select: { type, quantity, createdAt } })`; her hareketi `yerelGunMetni(createdAt)` gününe ekle, günleri sırayla biriktir.
- [ ] **Step 4:** Aynı dosya → PASS.
- [ ] **Step 5: Commit** — `feat(urunler-d1): stokSerisi — günlük stok seviyesi, hesaplaStok ile aynı (B-4-7)`

### Task 4: Toplu liste fiyatı — `cozumleListeFiyatlari`

**Files:**
- Modify: `src/lib/fiyat.ts`
- Test: `src/lib/fiyat.itest.ts`

**Interfaces:**
- Produces: `cozumleListeFiyatlari(urunIdler: readonly string[], kosul: FiyatKosulu, db?: Db): Promise<Map<string, FiyatSonucu>>` — varsayılan listeden; her istenen kimlik haritada.
- İç (dışa aktarılmaz): `listedenFiyatlar(listeId, urunIdler, kosul, db): Promise<Map<string, Decimal>>`. `cozumleBirimFiyat` satırı bununla seçer; imzası ve dönüşü aynı.

- [ ] **Step 1: Failing tests** — `describe("cozumleListeFiyatlari — toplu ≡ tekli (X-10-4)")`:
  - `"her ürün için cozumleBirimFiyat(urun, null, …) ile aynı"` — varsayılan listede: (a) tek satır (b) barem 1 ve 10 (c) yalnız `minQuantity` 10 (d) süresi dolmuş + güncel satır (e) satırsız. `kosul` `{ miktar: 1, gun: bugun() }` ve `{ miktar: 10, … }` için durum, `listeFiyat.toFixed(4)` ve `neden` eşit. (c) miktar 1'de `FIYAT_COZUMLENEMEDI`.
  - `"varsayılan liste yoksa her ürün LISTE_YOK"` — `policy` kodunu bulamayacak bir test kurulumu (mevcut `fiyat.itest.ts` LISTE_YOK testindeki yöntemle).
  - `"boş liste boş harita"`.
- [ ] **Step 2:** `npx vitest run --project integration src/lib/fiyat.itest.ts` → FAIL.
- [ ] **Step 3: Implement** — `listedenFiyatlar`: bugünkü `where` (tarih ve `minQuantity <= miktar`) `productId: { in }` ile tek `findMany`, `orderBy: { minQuantity: "desc" }`; ürün başına ilk satır. `cozumleBirimFiyat` `findFirst` yerine bunu çağırır. `cozumleListeFiyatlari` varsayılan listeyi bir kez bulur.
- [ ] **Step 4:** `npx vitest run --project integration` → tamamı PASS (sipariş, kabul senaryosu, içe aktarım itest'leri fiyatı kullanır).
- [ ] **Step 5: Commit** — `feat(urunler-d1): cozumleListeFiyatlari — toplu liste fiyatı, tek seçim yolu (X-10-4)`

### Task 5: Ortak sütun modülü

**Files:**
- Create: `src/lib/liste/sutunlar.ts`
- Modify: `src/lib/doktor-listesi/sutunlar.ts`, `src/app/(admin)/doctors/sutunEylemi.ts`, `src/app/(admin)/doctors/page.tsx` (yalnız çağrı imzaları)
- Test: `src/lib/liste/sutunlar.test.ts`, `src/lib/doktor-listesi/sutunlar.test.ts` (değişmeden geçer)

**Interfaces:**
- Produces:
  - `type SutunTanimi<K extends string> = { anahtar: K; baslik: string; varsayilanGizli?: boolean }`
  - `gizliSutunlariCoz<K extends string>(sutunlar: readonly SutunTanimi<K>[], deger: string | undefined): ReadonlySet<K>`
  - `gizliSutunCerezi<K extends string>(sutunlar: readonly SutunTanimi<K>[], gizli: Iterable<string>): string` — boşsa `"-"`
  - `guvenliDonus(yol: string, donus: string): string`
  - `const HICBIRI = "-"`
- `doktor-listesi/sutunlar.ts` dışa aktarımları aynı kalır (`SUTUNLAR`, `SUTUN_CEREZI`, `gizliSutunlariCoz(deger)`, `gizliSutunCerezi(gizli)`, `guvenliDonus(donus)`); içleri ortak modüle iner.

- [ ] **Step 1: Failing tests** — `liste/sutunlar.test.ts`, örnek tanım `[{a}, {b, varsayilanGizli: true}, {c}]`:
  - `gizliSutunlariCoz(T, undefined)` → `{b}`; `(T, "-")` → `{}`; `(T, "")` → `{}`; `(T, "a,x,c")` → `{a, c}`; `(T, "b")` → `{b}`.
  - `gizliSutunCerezi(T, [])` → `"-"`; `(T, ["c", "a", "x"])` → `"a,c"` (tablo sırası, bilinmeyen düşer); gidiş-dönüş eşit.
  - `guvenliDonus("/products", "/products?stok=kritik")` aynen; `("/products", "/productsx")`, `("/products", "https://x.com")`, `("/products", "//x.com")` → `"/products"`.
- [ ] **Step 2:** `npx vitest run --project unit src/lib/liste` → FAIL.
- [ ] **Step 3: Implement** ortak modül; doktor modülünü üstüne indir. Doktorlar varsayılan gizli sütun tanımlamaz; eski `""` çerezi `{}` verir (Review Focus 4).
- [ ] **Step 4:** `npm test` → tamamı PASS (`doktor-listesi/sutunlar.test.ts` dokunulmadan). `npm run typecheck`.
- [ ] **Step 5: Commit** — `refactor(urunler-d1): sütun seçici çerez biçimi ortak modüle — varsayılan gizli sütun`

### Task 6: Ürün listesi saf modülleri — süzgeç ve sütunlar

**Files:**
- Create: `src/lib/urun-listesi/suzgec.ts`, `src/lib/urun-listesi/sutunlar.ts`
- Test: `src/lib/urun-listesi/suzgec.test.ts`

**Interfaces:**
- Produces (`suzgec.ts`):
  - `type UrunSuzgeci = { durum: "AKTIF" | "PASIF" | null; stok: "kritik" | "tukendi" | null }`, `BOS_SUZGEC`
  - `type Parametreler = Record<string, string | string[] | undefined>`
  - `suzgecCoz(p: Parametreler): { suzgec: UrunSuzgeci; detay: string | null }` — kimlik deseni `/^[A-Za-z0-9-]{1,64}$/`
  - `urunAdresi(s: UrunSuzgeci, ek?: { page?: number; per?: number; detay?: string }): string` — `/products` + sabit parametre sırası `durum, stok, page, per, detay`; `page` 1 ise yazılmaz
  - `HIZLI_SEKMELER: readonly { etiket: string; suzgec: UrunSuzgeci }[]` — Tümü · Aktif · Pasif · Kritik stok · Tükendi
  - `ayniSuzgec(a, b): boolean`
  - `etkinSuzgecler(s): { anahtar: "durum" | "stok"; etiket: string; kaldirAdresi: string }[]` — etiketler "Durum: Aktif", "Durum: Pasif", "Stok: Kritik", "Stok: Tükendi"
  - `type BosDurum = "hic-kayit" | "kritik" | "tukendi" | "suzgecli"`; `bosDurum(s): BosDurum` — yalnız `stok=kritik` → `kritik`, yalnız `stok=tukendi` → `tukendi`, hiç süzgeç → `hic-kayit`, diğer → `suzgecli`
- Produces (`sutunlar.ts`): `type UrunSutunu = "kod" | "fiyat" | "fiyatKdvDahil" | "kdv" | "stok" | "durum"`, `SUTUNLAR` (tablo sırası, başlıklar spec §3.3; `fiyatKdvDahil` `varsayilanGizli: true`), `SUTUN_CEREZI = "urun-sutunlar"`, `SUTUN_YOLU = "/products"`.

- [ ] **Step 1: Failing tests** — `suzgec.test.ts`:
  - gidiş-dönüş: her `durum` × `stok` birleşimi için `suzgecCoz(params(urunAdresi(s))).suzgec` ≡ `s`
  - geçersiz: `durum=SILINDI`, `stok=az`, `detay=<script>` → `null`
  - dizi değer: `durum: ["PASIF", "AKTIF"]` → `PASIF`
  - adres: `urunAdresi(BOS_SUZGEC)` → `"/products"`; `urunAdresi({ durum: "AKTIF", stok: "kritik" }, { page: 2, detay: "abc" })` → `"/products?durum=AKTIF&stok=kritik&page=2&detay=abc"`
  - `etkinSuzgecler({ durum: "AKTIF", stok: "kritik" })` iki etiket; durum etiketinin `kaldirAdresi` `"/products?stok=kritik"`
  - `bosDurum` dört durum
- [ ] **Step 2:** `npx vitest run --project unit src/lib/urun-listesi` → FAIL.
- [ ] **Step 3: Implement** — `doktor-listesi/suzgec.ts`'teki `ilk`, `secenek`, kimlik deseni biçimini izle (kopyalamadan önce ortaklaştırma yapma; iki küçük yardımcı yinelenir — Stok modülü üçüncüyü getirince ortaklaşır).
- [ ] **Step 4:** Aynı komut → PASS.
- [ ] **Step 5: Commit** — `feat(urunler-d1): ürün listesi süzgeci ve sütun tanımı`

### Task 7: Stok hareketi türü etiketi

**Files:**
- Create: `src/lib/stok-hareket-turu.ts`
- Test: `src/lib/stok-hareket-turu.test.ts`

**Interfaces:**
- Produces: `type HareketKaynagi = { type: "GIRIS" | "CIKIS"; shipmentId: string | null; returnNoteId: string | null; consignmentIssueId: string | null; stockTransferId: string | null; stockAdjustmentId: string | null; importBatchId: string | null; orderId: string | null }`; `HAREKET_KAYNAGI` (Prisma `select` nesnesi, bu yedi alan + `type`); `hareketTuru(h: HareketKaynagi): string`.

- [ ] **Step 1: Failing tests** — her kaynak alanı tek başına dolu → "Sevkiyat", "İade", "Konsinye", "Transfer", "Düzeltme", "Açılış", "Sipariş"; hepsi boş + `GIRIS` → "Stok girişi"; hepsi boş + `CIKIS` → "Çıkış".
- [ ] **Step 2:** `npx vitest run --project unit src/lib/stok-hareket-turu.test.ts` → FAIL.
- [ ] **Step 3: Implement** — alan → etiket tablosu, ilk dolu alan.
- [ ] **Step 4:** PASS.
- [ ] **Step 5: Commit** — `feat(urunler-d1): stok hareketi türü etiketi — kaynak belgeden`

### Task 8: Ürün listesi sorguları

**Files:**
- Create: `src/lib/urun-listesi/sorgu.ts`
- Test: `src/lib/urun-listesi/sorgu.itest.ts`

**Interfaces:**
- Consumes: `hesaplaStoklar`, `aktifUrunStoklari`, `stokSerisi` (Task 2–3) · `cozumleListeFiyatlari` (Task 4) · `UrunSuzgeci` (Task 6) · `HAREKET_KAYNAGI`, `hareketTuru` (Task 7) · `stokDurumu` · `hesaplaSatirTutarlari` · `bugun`.
- Produces:
  - `type UrunSatiri = { id; name; code; status: EntityStatus; kdvOrani: Decimal; stok: number; fiyat: Decimal | null; fiyatKdvDahil: Decimal | null }`
  - `urunListesi(s: UrunSuzgeci, sayfa: { skip: number; take: number }): Promise<{ satirlar: UrunSatiri[]; toplam: number }>`
  - `urunKpileri(): Promise<{ toplam: number; aktif: number; kritik: number; pasif: number }>`
  - `type UrunPaneli = { urun: UrunSatiri; seri: { gun: string; stok: number }[]; hareketler: { id; createdAt: Date; tur: string; konum: string; miktar: number /* işaretli */; note: string | null }[]; listeler: { id; code; name; isActive: boolean; varsayilan: boolean; satirlar: { minQuantity: number; listPrice: Decimal; validFrom: Date | null; validTo: Date | null }[] }[] }`
  - `urunPaneli(id: string): Promise<UrunPaneli | null>`
  - `kdvDahil(fiyat: Decimal, oran: Decimal): Decimal` (modül içi; `hesaplaSatirTutarlari([{ birimFiyat: fiyat, listeFiyat: fiyat, miktar: 1, kdvOrani: oran }]).toplam.toplam`)

- [ ] **Step 1: Failing tests** — `sorgu.itest.ts`:
  - `"durum ve stok süzgeci birleşir"` — ürünler: aktif stok 50, aktif 10 (sınır, kritik), aktif 11 (değil), aktif 0, aktif −3, pasif 5. `{ stok: "kritik" }` → 10, 0, −3, pasif 5; `{ durum: "AKTIF", stok: "kritik" }` → 10, 0, −3; `{ stok: "tukendi" }` → 0, −3.
  - `"sayfalama süzgeçten sonra"` — `{ stok: "kritik" }`, `{ skip: 1, take: 2 }` → `toplam` 4, 2 satır, sıra `createdAt desc`.
  - `"liste fiyatı varsayılan listeden; KDV dahil 1 adetlik satır toplamı (X-10-4, Ü-3-2)"` — fiyat 100.0000, KDV 20 → `fiyat` "100.00", `fiyatKdvDahil` "120.00"; fiyat 33.3333 KDV 10 → `hesaplaSatirTutarlari` ile aynı değer; satırsız ürün → ikisi `null`.
  - `"KPI: kritik yalnız aktif ürünlerde, tükendi ve negatif dahil"` — yukarıdaki kurulumda `kritik === 3`; `toplam`, `aktif`, `pasif` sayımları; KPI `kritik` ≡ `urunListesi({ durum: "AKTIF", stok: "kritik" }).toplam`.
  - `"panel: hareket türü ve işaret, son 10, yeniden eskiye"` — 12 hareket → 10; çıkış eksi; sevkiyat hareketi "Sevkiyat".
  - `"panel: fiyat listeleri — süresi geçmiş satır yok, ileri tarihli var, varsayılan işaretli"` (Review Focus 5) — listedeki `fiyat` bugünkü satırdır.
  - `"panel: seri 90 nokta, son nokta stok"`; `"panel: bilinmeyen kimlik null"`.
- [ ] **Step 2:** `npx vitest run --project integration src/lib/urun-listesi` → FAIL.
- [ ] **Step 3: Implement** spec §4.2 sırasıyla. `urunPaneli` sorguları `Promise.all`. Panel fiyat listesi satırları: `priceListItem.findMany({ where: { productId, OR: [{ validTo: null }, { validTo: { gt: bugun() } }] }, include: { priceList } , orderBy: [{ priceList: { code: "asc" } }, { minQuantity: "asc" }, { validFrom: "asc" }] })`, listeye göre grupla; `varsayilan` = `code === policy.pricing.varsayilanFiyatListesiKodu`.
- [ ] **Step 4:** Aynı komut → PASS. `npx vitest run --project integration` · `npm test` · `npm run lint` · `npm run typecheck`.
- [ ] **Step 5:** `npm run izlenebilirlik` → `docs/TRACEABILITY.md` güncellenir; B-4-7 ve X-10-4 KANITLI.
- [ ] **Step 6: Commit** — `feat(urunler-d1): ürün listesi sorguları — süzgeç, toplu stok ve fiyat, KPI, panel (B-4-7, X-10-4, Ü-3-2)` · ayrı commit: `docs(urunler-d1): izlenebilirlik matrisi yeniden üretildi`

### D1 teslim

- [ ] E2E yerelde (ekran değişmedi; `products.spec.ts`, `doktorlar.spec.ts`, `dashboard.spec.ts` dahil tamamı yeşil).
- [ ] Push, PR (Özet / Değişiklikler / Kabul kriterleri / Test), CI "pass" → merge. D2 dalı güncel `main`'den.

---

## PR D2 — tablo · dal `revize/urunler-d2-tablo`

### Task 9: Ortak bileşenler — `SutunSecici`, `BosDurum`

**Files:**
- Create: `src/components/liste/SutunSecici.tsx`, `src/components/liste/BosDurum.tsx`
- Delete: `src/app/(admin)/doctors/SutunSecici.tsx`, `src/app/(admin)/doctors/BosDurum.tsx`
- Modify: `src/app/(admin)/doctors/page.tsx`, `src/app/(admin)/doctors/DoktorTablosu.tsx`

**Interfaces:**
- Produces:
  - `SutunSecici<K extends string>({ sutunlar: readonly SutunTanimi<K>[]; gizli: ReadonlySet<K>; action: (fd: FormData) => Promise<void>; donus: string })` — işaretleme ve metinler bugünkü doktor bileşeniyle aynı (`aria-label="Görünür sütunlar"`, Kaydet, Varsayılana dön).
  - `BosDurum({ colSpan: number; ikon: "yeni" | "onayla" | "filtrele"; baslik: string; temizleAdresi?: string; eylem?: React.ReactNode })` — `temizleAdresi` varsa "Süzgeçleri temizle" bağlantısı.
- Doktor ekranı: `METIN` tablosu `DoktorTablosu.tsx`'e taşınır; `temizleAdresi="/doctors"` yalnız `suzgecli`'de; `eylem` "Yeni Cari" yalnız `hic-kayit` + yönetici.

- [ ] **Step 1:** Bileşenleri taşı/genelleştir, doktor ekranını bağla.
- [ ] **Step 2:** `npm run typecheck` · `npm run lint` · `npm test`.
- [ ] **Step 3:** E2E `e2e/admin/doktorlar.spec.ts`, `e2e/mobil/doktorlar.spec.ts`, `e2e/operasyon/operasyon.spec.ts` → PASS (davranış değişmedi).
- [ ] **Step 4: Commit** — `refactor(urunler-d2): sütun seçici ve boş durum ortak bileşene — Doktorlar ekranı geçer`

### Task 10: Ürünler tablosu — KPI, sekmeler, sütunlar, sayfalama, boş durum

**Files:**
- Create: `src/app/(admin)/products/KpiKartlari.tsx`, `SuzgecCubugu.tsx`, `UrunTablosu.tsx`, `sutunEylemi.ts`
- Modify: `src/app/(admin)/products/page.tsx`
- Test: `e2e/admin/urunler.spec.ts` (yeni), `e2e/admin/products.spec.ts` (yalnız seçici çakışırsa kapsamlanır)

**Interfaces:**
- Consumes: Task 5, 6, 8, 9.
- `sutunEylemi.ts`: `"use server"` `sutunlariKaydet(formData)` — `requireStaff`; çerez `SUTUN_CEREZI`, `path: SUTUN_YOLU`, 1 yıl, `sameSite: "lax"`, `httpOnly`; "varsayilan" silme; `redirect(guvenliDonus(SUTUN_YOLU, donus))`.
- Sayfa orkestrasyonu `src/app/(admin)/doctors/page.tsx` biçimindedir: `getPagination({ page, per })`, `suzgecCoz`, çerez, `Promise.all([urunListesi, urunKpileri, detay ? urunPaneli(detay) : null])` (panel çizimi Task 11'de).
- `SuzgecCubugu` sekmeleri `nav aria-label="Hızlı süzgeçler"`, etkin etiketler `aria-label="Etkin süzgeçler"` (doktor ekranıyla aynı erişilebilir adlar). KPI satırı `aria-label="Ürün sayıları"`.
- Tablo başlıkları: `tabanli("Liste Fiyatı", MATRAH)`, `tabanli("Liste Fiyatı", BRUT)`; gizli sütun ne başlıkta ne hücrede çizilir; `colSpan` görünür sütun sayısı.
- Ürün adı: `Link href={urunAdresi(suzgec, { ...yer, detay: id })} scroll={false} data-kayit={id}`.

- [ ] **Step 1: Failing e2e** — `e2e/admin/urunler.spec.ts` (yardımcılar `e2e/helpers.ts`; ürünleri SQL/yardımcıyla kur):
  - `"kritik stok KPI kartı süzgeci uygular"` — kartı tıkla → URL `durum=AKTIF&stok=kritik`; etiketler "Durum: Aktif", "Stok: Kritik"; satır sayısı = kart değeri.
  - `"etiket × ile kaldırılır"` → URL `stok` taşımaz.
  - `"KDV dahil sütunu varsayılan gizli; açılınca kalıcı (Ü-3-2)"` — başlık yok → Sütunlar → işaretle → Kaydet → başlık "Liste Fiyatı (KDV dahil)" ve taban etiketi var → `page.reload()` → hâlâ var → Varsayılana dön → yok.
  - `"süzgece uyan ürün yoksa boş durum ve temizleme"` — `?durum=PASIF&stok=tukendi` (kurulumda yok) → "Bu süzgeçlere uyan ürün bulunamadı." → Süzgeçleri temizle → `/products`.
- [ ] **Step 2:** E2E dosyası → FAIL.
- [ ] **Step 3: Implement** bileşenleri ve sayfayı.
- [ ] **Step 4:** `npm run typecheck` · `npm run lint` · `npm test` · tüm e2e → PASS.
- [ ] **Step 5: Commit** — `feat(urunler-d2): ürün listesi — KPI, süzgeç sekmeleri, sütun seçici, KDV dahil fiyat, sayfalama, boş durum (Ü-3-2)`

### D2 teslim

- [ ] Push, PR, CI "pass" → merge. D3 dalı güncel `main`'den.

---

## PR D3 — yan panel ve kapanış · dal `revize/urunler-d3-panel`

### Task 11: Yan panel

**Files:**
- Create: `src/app/(admin)/products/UrunPaneli.tsx`
- Modify: `src/app/(admin)/products/page.tsx`
- Test: `e2e/admin/urunler.spec.ts`, `e2e/operasyon/operasyon.spec.ts`, `e2e/mobil/urunler.spec.ts` (yeni; `e2e/mobil/doktorlar.spec.ts` biçimi)

**Interfaces:**
- Consumes: `UrunPaneli` tipi (Task 8), `YanPanel` (`src/components/YanPanel.tsx`; `DoktorPaneli.tsx` kullanımını izle), `Sparkline` (`seri` = `stok` değerleri, `ozet` = "90 gün önce N → bugün M"), `StokMiktari`, `StatusBadge`, `Tutar`.
- `UrunPaneli({ veri: UrunPaneli; kapatAdresi: string; yonetici: boolean })`; sayfada `key={veri.urun.id}`.
- Bölüm sırası ve metinler spec §3.6; listesiz ürün: "Bu ürün hiçbir fiyat listesinde yok."; varsayılan listede "Varsayılan", pasif listede "Pasif" etiketi.

- [ ] **Step 1: Failing e2e:**
  - admin `"ürün adı yan paneli açar; içerik; Esc ile kapanır, odak ada döner"` — panel başlığı ürün adı; "Son stok hareketleri" altında bir "Sevkiyat" satırı (kurulumda sevkiyat); "Fiyat listeleri" altında varsayılan liste kodu; Düzenle bağlantısı `/products/<id>/edit`; Esc → panel yok, odak `[data-kayit=<id>]`.
  - admin `"geçersiz detay kimliğinde panel açılmaz"` — `?detay=yok` → liste görünür, panel yok.
  - operasyon `"OPERASYON ürün panelini görür; Yeni Ürün, Düzenle, Sil yok (D-2-2)"`.
  - mobil `"ürün paneli tam ekran açılır"` — panel genişliği ≈ görüntü alanı genişliği.
- [ ] **Step 2:** E2E → FAIL.
- [ ] **Step 3: Implement** paneli ve sayfa bağlantısını.
- [ ] **Step 4:** `npm run typecheck` · `npm run lint` · `npm test` · `npx vitest run --project integration` · tüm e2e → PASS.
- [ ] **Step 5: Commit** — `feat(urunler-d3): ürün listesinde sağdan yan panel — stok grafiği, son hareketler, fiyat listeleri (D-2-2)`

### Task 12: Kapanış belgeleri

**Files:**
- Modify: `docs/YOL_HARITASI.md` (Ü-19 ✅), `docs/PROJE_DURUMU.md` (arayüz bölümü), `MD_files/DEVAM_PROMPTU.md` (▶ satırı: sıradaki Stok ekranı — Ü-20 spec'i), `docs/TRACEABILITY.md` (`npm run izlenebilirlik`)

- [ ] **Step 1:** Belgeleri güncelle; Ü-19 satırına "29.10.2026'da D1–D3 ile yapıldı".
- [ ] **Step 2:** `npm run izlenebilirlik` · `npm test` (`izlenebilirlik.test.ts`).
- [ ] **Step 3: Commit** — `docs(urunler-d3): Ü-19 kapanışı`

### D3 teslim

- [ ] Push, PR, CI "pass" → merge. Ardından Stok ekranı (Ü-20) için brainstorming.
