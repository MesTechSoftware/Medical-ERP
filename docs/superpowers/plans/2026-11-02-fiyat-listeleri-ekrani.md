# Fiyat Listeleri Ekranı Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/price-lists` ekranına KPI kartları, Tümü/Aktif/Boş sekmeleri, sütun seçicili ve sayfalı tablo,
yan panel (özet, salt okunur barem matrisi, atanmış cariler) eklemek; matrisi detay sayfasına da koymak;
"Yeni Liste" formunu `/price-lists/new`'e taşımak.

**Architecture:** Ü-19 (Ürünler) kalıbı birebir. Süzgeç/sütun durumu `src/lib/fiyat-listesi-listesi/` saf
modüllerinde; okumalar `fiyat-listesi-listesi/sorgu.ts`'te tek `where` üreticisiyle. Barem hücresi fiyat
seçiminin tek yolu olan `fiyat.ts`'ten (`listedenFiyatlar`) gelir — ikinci seçim kodu yazılmaz.

**Tech Stack:** Next.js 16 App Router · Prisma 7 / PostgreSQL · Tailwind · Vitest (`unit`, `integration`) · Playwright.

**Spec:** `docs/superpowers/specs/2026-11-02-fiyat-listeleri-ekrani-design.md`

## Global Constraints

- Yeni karar ya da ADR yok; `KARARLAR.md` değişmez. Satır yazımı (`setPriceListItem`, `deletePriceListItem`) değişmez.
- Fiyat satırı seçimi yalnız `fiyat.ts`'te (B-5, B-6, X-10 §(3)). Satırın "bugün geçerli" koşulu `validFrom <= gün < validTo`, boş uç süresiz; gün `bugun()` (`zaman.ts`), `new Date()` yazılmaz.
- Birim testi `db.ts`'i içe aktaramaz: `fiyat-listesi-listesi/suzgec.ts` ve `sutunlar.ts` saf (`import type` serbest).
- X-5 lint: Decimal aritmetiği yok (yalnız gösterim); `Number()` yok, tam sayı `parseInt(x, 10)`; koleksiyonda `.add` yerine dizi + `new Set(dizi)`.
- Adres parametreleri: `durum` (`aktif` | `bos`), `page`, `per`, `detay`. Çerez `fiyat-listesi-sutunlar`, `path=/price-lists`, 1 yıl, `sameSite: "lax"`, `httpOnly`; varsayılan gizli sütun yok.
- Yetki `requireAdmin` (D-2: OPERASYON görmez).
- Kriterler yalnız X-10-5 ve X-10-6 (spec §6 metinleri aynen).
- Commit/PR metinlerinde Co-Authored-By / "Generated with Claude" yok (kullanıcı kuralı).
- Her PR: e2e yerelde → push/PR → CI `pass` → `code-review` → düzeltmeler → `touch .superpowers/inceleme/<head-sha>` → merge. Bu worktree'de entegrasyon `ITEST_DATABASE_URL=…/medikal_itest_fiyat`, e2e `TEST_DATABASE_URL=…/medikal_test_fiyat` (paralel oturumla çakışmasın; 3100 portu için oturum 8f'e haber verilir).

## Review Focus

1. **Süresi geçmiş ya da başlamamış satır** — yalnız böyle satırı olan liste "Boş" sekmesinde, "Aktif"te değil; matriste görünmez → Task 4 ve Task 2 testleri.
2. **Varsayılan liste yok** — KPI çökmez, fiyatsız = aktif ürün sayısı, bağlantı yok → Task 4 testi.
3. **Sayfa dışı adres** (`?page=999`) — son sayfaya yönlenir, boş durum çıkmaz → Task 5 e2e (Task 8).
4. **Tek eşikli liste ve eşiksiz ürün** — yalnız 10+ satırı olan üründe 1+ sütunu "—" → Task 2 testi.
5. **Atanmış cari > 20** — panel 20 gösterir, "ve N cari daha" → Task 4 testi.

---

## PR D1 — veri katmanı (ekran değişmez) · dal `revize/fiyat-listeleri-d1-veri`

### Task 1: Belgeler — spec, plan, Ü-21, kriterler

**Files:** Modify `docs/YOL_HARITASI.md` (Ü-20 satırının altı), `docs/KABUL_KRITERLERI.md` (X-10-4'ün altı), `MD_files/DEVAM_PROMPTU.md` (git'te değil; ana ağaçtaki dosya — oturum 8f ile çakışmamak için D2 sonunda bir kez yazılır).

- [ ] **Step 1:** YOL_HARITASI'na Ü-21: "**Fiyat listeleri ekranı — KPI, süzgeç, sütun seçici, yan panel, barem matrisi** *(02.11.2026 — kullanıcı talebi, 28.10 isterinin 3. modülü; §7-5)* | KPI (toplam, aktif liste, özel listeli cari, fiyatsız ürün), Tümü/Aktif/Boş sekmeleri, salt okunur barem matrisi (panel + detay), atanmış cariler, `/price-lists/new` — yeni karar yok; kriterler X-10-5 · X-10-6 · spec `docs/superpowers/specs/2026-11-02-fiyat-listeleri-ekrani-design.md`".
- [ ] **Step 2:** KABUL_KRITERLERI'ne X-10-5, X-10-6 (spec §6 metinleri), yer kolonu `Ü-21 D1`.
- [ ] **Step 3:** `npm run izlenebilirlik && npm test` → PASS.
- [ ] **Step 4: Commit** — `docs(fiyat-listeleri-d1): spec, plan, Ü-21 ve kabul kriterleri (X-10-5, X-10-6)`

### Task 2: `baremMatrisi` — fiyat.ts

**Files:** Modify `src/lib/fiyat.ts`; Test `src/lib/fiyat.itest.ts`

**Interfaces — Produces:**
```ts
export type BaremHucresi = { fiyat: Decimal; devralinan: boolean } | null;
export type BaremMatrisi = { esikler: number[]; urunler: { id: string; name: string; code: string; hucreler: BaremHucresi[] }[] };
export async function baremMatrisi(fiyatListesiId: string, gun: Date, db?: Db): Promise<BaremMatrisi>;
```

- [ ] **Step 1: Failing tests** (`describe("barem matrisi (X-10-5)")`, `gun("2026-10-20")`):
  - satırlar 1→100, 10→90, 50→80 (ürün A) ve 10→70 (ürün B): `esikler` = `[1, 10, 50]`; A hücreleri `100 / 90 / 80`, hiçbiri devralınmış değil; B: `[null, 70 (devralinan:false), 70 (devralinan:true)]`.
  - her hücre, listeye atanmış bir carinin `cozumleBirimFiyat(urun, doktorId, { miktar: eşik, gun })` sonucuna eşit (`null` ↔ `FIYAT_COZUMLENEMEDI`).
  - `validTo = 2026-10-20` olan satır o gün matriste yok; `validFrom = 2026-10-21` olan satır yok; ertesi gün (`2026-10-21`) var.
  - bugün geçerli satırı olmayan liste → `{ esikler: [], urunler: [] }`.
- [ ] **Step 2:** `ITEST_DATABASE_URL=… npx vitest run --project integration src/lib/fiyat.itest.ts` → FAIL.
- [ ] **Step 3: Implement.** `listedenFiyatlar` dönüşü `Map<string, { fiyat: Decimal; minQuantity: number }>` olur (iki çağıran `.fiyat` okur). `baremMatrisi`: bugün geçerli satırları `findMany` (ürün adı/kodu ile, ada göre) → farklı ürünler ve sıralı farklı eşikler → her eşik için `listedenFiyatlar(liste, ürünIdler, { miktar: eşik, gun }, db)`; hücre yoksa `null`, `devralinan = sec.minQuantity !== esik`. Geçerlilik `where` parçası `gecerliSatir(gun)` adıyla dosya içinde tek yerde (listedenFiyatlar da kullanır) ve `export` edilir (Task 4 tüketir).
- [ ] **Step 4:** aynı komut → PASS; `npx vitest run --project integration src/lib/fiyat.itest.ts src/lib/urun-listesi` → PASS (davranış değişmedi).
- [ ] **Step 5: Commit** — `feat(fiyat-listeleri-d1): barem matrisi fiyat seçiminin tek yolundan (X-10-5)`

### Task 3: Saf süzgeç ve sütun modülleri

**Files:** Create `src/lib/fiyat-listesi-listesi/suzgec.ts`, `suzgec.test.ts`, `sutunlar.ts`

**Interfaces — Produces:**
```ts
export type ListeSuzgeci = { durum: "aktif" | "bos" | null };
export const BOS_SUZGEC: ListeSuzgeci;
export function suzgecCoz(p: Parametreler): { suzgec: ListeSuzgeci; detay: string | null };
export function listeAdresi(s: ListeSuzgeci, ek?: { page?: number; per?: number; detay?: string }): string; // "/price-lists?…"
export const HIZLI_SEKMELER: readonly { etiket: "Tümü" | "Aktif" | "Boş"; suzgec: ListeSuzgeci }[];
export function ayniSuzgec(a: ListeSuzgeci, b: ListeSuzgeci): boolean;
export function etkinSuzgecler(s: ListeSuzgeci): { anahtar: "durum"; etiket: string; kaldirAdresi: string }[]; // "Durum: Aktif" | "Durum: Boş"
export function bosDurum(s: ListeSuzgeci): "hic-kayit" | "suzgecli";
// sutunlar.ts
export type ListeSutunu = "ad" | "urun" | "barem" | "cari" | "durum";
export const SUTUNLAR: readonly SutunTanimi<ListeSutunu>[]; // başlıklar: Ad, Ürün, Barem, Atanmış cari, Durum
export const SUTUN_CEREZI = "fiyat-listesi-sutunlar"; export const SUTUN_YOLU = "/price-lists";
```

- [ ] **Step 1: Failing test:** `suzgecCoz({ durum: "aktif", detay: "cm-1" })` → `{ suzgec: { durum: "aktif" }, detay: "cm-1" }`; `durum: "AKTIF"`/`"x"` → `null`; `detay: "a b"` → `null`; `listeAdresi({durum:"bos"}, { page: 2, detay: "x" })` → `"/price-lists?durum=bos&page=2&detay=x"`; `page: 1` yazılmaz; `listeAdresi(BOS_SUZGEC)` → `"/price-lists"`; sekme etiketleri sırası; `etkinSuzgecler({durum:"aktif"})[0]` → `{ etiket: "Durum: Aktif", kaldirAdresi: "/price-lists" }`; `bosDurum`.
- [ ] **Step 2:** `npx vitest run --project unit src/lib/fiyat-listesi-listesi` → FAIL.
- [ ] **Step 3:** Implement (`urun-listesi/suzgec.ts` ile aynı biçim, `liste/parametreler.ts` yardımcıları).
- [ ] **Step 4:** → PASS. **Step 5: Commit** — `feat(fiyat-listeleri-d1): süzgeç ve sütun modülleri`

### Task 4: Liste sorguları

**Files:** Create `src/lib/fiyat-listesi-listesi/sorgu.ts`, `sorgu.itest.ts`

**Interfaces — Consumes:** `gecerliSatir`, `baremMatrisi`, `cozumleListeFiyatlari` (fiyat.ts), Task 3 tipleri. **Produces:**
```ts
export function listeKosulu(s: ListeSuzgeci, gun: Date): Prisma.PriceListWhereInput;
export type ListeSatiri = { id: string; code: string; name: string; varsayilan: boolean; urunSayisi: number; baremSayisi: number; cariSayisi: number; aktif: boolean };
export async function fiyatListeleri(s: ListeSuzgeci, sayfa: { skip: number; take: number }): Promise<{ satirlar: ListeSatiri[]; toplam: number }>;
export type ListeKpileri = { toplam: number; aktif: number; ozelListeliCari: number; varsayilanKullanan: number; fiyatsizUrun: number; varsayilanListeId: string | null };
export async function fiyatListesiKpileri(): Promise<ListeKpileri>;
export type ListePaneli = { liste: ListeSatiri; toplamSatir: number; tarihliSatir: number; matris: BaremMatrisi; cariler: { id: string; fullName: string; pasif: boolean }[]; cariToplam: number };
export async function fiyatListesiPaneli(id: string): Promise<ListePaneli | null>;
```

- [ ] **Step 1: Failing tests** (X-10-6):
  - üç liste: L1 süresiz satırlı, L2 yalnız `validTo` dünü olan satırlı, L3 satırsız → `aktif` süzgeci yalnız L1; `bos` L2+L3; `fiyatListesiKpileri().aktif` = `fiyatListeleri({durum:"aktif"}).toplam`.
  - satır sayıları: L1'de ürün A (1+, 10+) ve B (1+) → `urunSayisi 2`, `baremSayisi 1`; L1'e 2 aktif + 1 pasif cari → `cariSayisi 3`; KPI `ozelListeliCari 2` (yalnız aktif), `varsayilanKullanan` = aktif cari − 2.
  - `fiyatsizUrun` = aktif ürünlerden `cozumleListeFiyatlari(…, {miktar:1, gun})` `HATA` sayısı (varsayılan listede satırı olmayan aktif ürün + pasif ürün sayılmaz); varsayılan liste silinmiş/yokken = aktif ürün sayısı ve `varsayilanListeId null`.
  - panel: 25 cari atanmış → `cariler.length 20`, `cariToplam 25`, ada göre; pasif cari `pasif: true`; `tarihliSatir` validFrom/validTo dolu satır sayısı; bulunamayan kimlik → `null`.
  - sayfalama `code asc`.
- [ ] **Step 2:** FAIL. **Step 3:** Implement — sayımlar `_count` + sayfadaki listeler için tek `priceListItem.findMany({ where: { priceListId: { in }, ...gecerliSatir(gun) } })`; `varsayilan` `policy.pricing.varsayilanFiyatListesiKodu`.
- [ ] **Step 4:** PASS + `npm run lint && npx tsc --noEmit`. **Step 5: Commit** — `feat(fiyat-listeleri-d1): liste sorguları ve KPI (X-10-6)`. Kriter yer kolonuna test dosyaları; `npm run izlenebilirlik`.
- [ ] **PR D1:** `npm test`, entegrasyon tamamı, e2e tamamı → push → PR "Ü-21 D1 — fiyat listeleri veri katmanı" → CI pass → code-review → işaret → merge.

---

## PR D2 — ekran · dal `revize/fiyat-listeleri-d2-ekran` (main @ D1 merge)

### Task 5: Liste sayfası — KPI, sekmeler, tablo, sütunlar, iskelet

**Files:** Rewrite `src/app/(admin)/price-lists/page.tsx`; Create `KpiKartlari.tsx`, `SuzgecCubugu.tsx`, `ListeTablosu.tsx`, `sutunEylemi.ts` (`requireAdmin`), `loading.tsx` — hepsi `products/` karşılıklarının biçiminde.

- KPI (spec §3.2): Toplam liste → `listeAdresi(BOS_SUZGEC)`; Aktif liste → `durum: "aktif"`; Özel listeli cari bağlantısız, `ikincilMetrik` "N cari varsayılanı kullanır"; Fiyatsız ürün → `listeAdresi(BOS_SUZGEC, { detay: varsayilanListeId })` (yoksa bağlantısız), `vurgu="uyari"` > 0'da.
- Tablo (spec §3.4): Kod bağlantısı `listeAdresi(suzgec, { ...yer, detay: id })`; "varsayılan" rozeti; Durum `StatusChip` Aktif `basari` / Boş `notr`; İşlem "Satırlar" → `/price-lists/<id>`. Boş durum `BosDurum`: "Henüz fiyat listesi yok." / "Bu süzgece uyan liste yok." + Süzgeci temizle.
- Sayfa dışı `page` → `redirect` son sayfa (Ürünler sayfasındaki blok).
- Header action: `LinkButton href="/price-lists/new" ikon="yeni"` "Yeni Liste".
- [ ] `npx tsc --noEmit && npm run lint` → temiz. **Commit** — `feat(fiyat-listeleri-d2): KPI, sekmeler, tablo, sütun seçici`

### Task 6: Yan panel, barem matrisi, detay kartı

**Files:** Create `ListePaneli.tsx`, `BaremMatrisi.tsx`; Modify `page.tsx` (panel), `[id]/page.tsx` (satır tablosunun üstüne "Barem matrisi" kartı, `baremMatrisi(liste.id, bugun())`).

- `BaremMatrisi({ matris })`: `veri-tablosu`; başlık "Ürün" + `${esik}+` sütunları, tablo başlığında `tabanli("Liste fiyatı", MATRAH)` notu; hücre `Tutar baslikta`; devralınan `text-slate-400` + `title={`${önceki eşik}+ eşiğinden`}` (seçilen satırın eşiği — hücreye `kaynakEsik` gerekmez: devralınan hücrenin solundaki ilk devralınmamış hücrenin eşiği); `null` → "—"; boşsa "Bu listede bugün geçerli satır yok."
- `ListePaneli` (spec §3.5): `YanPanel kapatAdresi baslikId kayitId`; Özet `Satir`'ları; Atanmış cariler (bağlantı `/doctors?detay=<id>`, pasifse `StatusChip` "Pasif", fazlası "ve N cari daha", boş metinler spec'teki gibi); altta "Satırları düzenle".
- [ ] tsc + lint. **Commit** — `feat(fiyat-listeleri-d2): yan panel ve salt okunur barem matrisi`

### Task 7: `/price-lists/new`

**Files:** Create `src/app/(admin)/price-lists/new/page.tsx` (bugünkü form, `requireAdmin`, geri bağlantısı); Modify `actions.ts` — `createPriceList` başarıda `redirect(`/price-lists/${liste.id}`)` (transaction dışında, `revalidatePath` sonrası).
- [ ] tsc + lint + `npx vitest run --project integration "src/app/(admin)/price-lists"` → PASS (redirect `NEXT_REDIRECT` fırlatıyorsa itest bunu bekleyecek biçimde güncellenir). **Commit** — `feat(fiyat-listeleri-d2): yeni liste ayrı sayfada, oluşturunca detaya`

### Task 8: E2E ve kapanış

**Files:** Rewrite `e2e/admin/fiyat-listesi.spec.ts`; gerekirse `kabul-senaryosu`, `mobil/form`, `mobil/yonetici` seçicileri; Modify `docs/YOL_HARITASI.md` (Ü-21 ✅), `docs/PROJE_DURUMU.md` (arayüz bölümü), `KABUL_KRITERLERI.md` yer kolonu (e2e), `MD_files/DEVAM_PROMPTU.md`.

- [ ] **Step 1:** e2e testleri (spec §6): (a) `/price-lists/new` → kod/ad → "Liste Oluştur" → başlık `${kod} — E2E Liste` → 10+ satırı 80 → matriste "10+" sütunu ve 80,00; 75 ile güncelle → tek satır (bugünkü DB doğrulaması korunur); (b) listede kod bağlantısı → `dialog` panel → "Barem matrisi" ve "Atanmış cariler" bölümleri; (c) "Aktif" sekmesi → satır sayısı = "Aktif liste" kartı adedi; (d) Sütunlar → "Barem" gizle → yenile → başlık yok → varsayılana dön; (e) `?durum=bos` boşken metin + temizle (koşula bağlı değil: satırsız yeni liste aç, "Boş" sekmesinde görünür); (f) `?page=999` → son sayfa.
- [ ] **Step 2:** e2e tamamı (oturum 8f'e haber verilerek, `TEST_DATABASE_URL=…medikal_test_fiyat`) → PASS.
- [ ] **Step 3:** belgeler + `npm run izlenebilirlik`. **Commit** — `test(fiyat-listeleri-d2): e2e ve belgelerin kapanışı`
- [ ] **PR D2:** push → PR "Ü-21 D2 — fiyat listeleri ekranı" → CI pass → code-review → işaret → merge.
