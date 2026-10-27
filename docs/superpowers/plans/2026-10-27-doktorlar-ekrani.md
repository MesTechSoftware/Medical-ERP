# Doktorlar Ekranı Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/doctors` cari listesine KPI kartları, birleşik süzgeç, yeni sütunlar (son sipariş, bakiye),
durum rozetleri, eksik fatura vurgusu, boş durum, sağdan yan panel ve çerezli sütun seçici eklemek.

**Architecture:** Süzgeç ve sütun durumu saf modüllerde (adres ↔ tip). Veritabanı okumaları
`src/lib/doktor-listesi/sorgu.ts`'te; satır başına risk `hesaplaDoktorRiskleri` ile toplu ve tek hesap
yolundan. Sayfa sunucu bileşenidir; panel `?detay=` ile sunucuda çizilir (`YanPanel` kabuğu); sütun
tercihi sunucu eylemiyle çereze yazılır.

**Tech Stack:** Next.js 16 App Router (server components + server actions) · Prisma 7 / PostgreSQL ·
Tailwind · Vitest (`unit`, `integration`) · Playwright.

**Spec:** `docs/superpowers/specs/2026-10-27-doktorlar-ekrani-design.md`

## Global Constraints

- Yeni karar ya da ADR açılmaz; kapsam dışı: Blokeli, iletişim geçmişi, toast, ciro sütunu (spec §2).
- "Sayılan sipariş" yalnız `sayilanBelgeler.siparis` (`src/lib/sayilan-belgeler.ts`); inline `where` yasak.
- Eksik fatura yalnız `EKSIK_FATURA_BILGISI` (`src/lib/cari.ts`); sahipsiz yalnız `SAHIPSIZ_DOKTOR` (`src/lib/sahiplik.ts`).
- Para: `<Tutar>` ile; tablo kolonunda başlık `tabanli("…", BRUT)` + `baslikta` (Ü-3-1). Bakiye/risk daima `BRUT`.
- X-5 lint: para hesabında `.add/.div` ve `Number()` yasak (`plus`, `minus`, `gt` kullanılır).
- Gün sınırları İstanbul günü: `zaman.ts` (`gunAraligi`, `yerelGunAraligi`, `simdi`); `new Date()` yazılmaz.
- Birim testi `db.ts`'i içe aktaramaz → saf modüller `cari.ts`, `sahiplik.ts`, `db.ts`'i import etmez.
- Rozet tonları mevcut `StatusChip` tonları: `olumlu` · `notr` · `uyari` (turuncu) · `hata` (kırmızı). Yeni renk yok.
- Commit ve PR metinlerinde **Co-Authored-By / "Generated with Claude" satırı yok** (kullanıcı kuralı).
- Merge yalnız `gh pr checks` "pass" görüldükten sonra. E2E push'tan önce yerelde koşulur.
- Kabul kriteri yalnız mevcut karar kimliğinden numaralanır (`KABUL_KRITERLERI.md` Kurallar): **Ü-18-n
  numarası açılmaz** — spec §6'daki "Ü-18 başlığı altında" cümlesi Task 1'de düzeltilir.

## Review Focus

1. **Türkçe/boşluklu bölge** ("İç Anadolu") adres gidiş-dönüşünde bozulmaz → Task 3 testi.
2. **Panel açıkken sayfalama/süzgeç** bağlantıları `detay`'ı taşımaz (panel kapanır, süzgeç kalır) → Task 3 testi.
3. **Gece yarısına yakın sipariş** (İstanbul 23:30 = UTC 20:30) doğru güne düşer → Task 5 testi.
4. **Siparişsiz/hareketsiz doktor** toplu riskte yine döner (bakiye 0, limitsiz) → Task 2 testi.
5. **Bütün sütunlar gizli + boş sonuç** — boş durumun `colSpan`'ı görünür sütun sayısıdır; bozuk çerez varsayılana döner → Task 4 ve Task 10 testleri.

---

## PR D1 — veri katmanı (ekran değişmez) · dal `revize/doktorlar-d1-veri` (açık; spec commit'i üzerinde)

### Task 1: Belgeler — Ü-18 ve kabul kriterleri

**Files:**
- Modify: `docs/YOL_HARITASI.md` (Ü tablosu, Ü-17 satırının altı)
- Modify: `docs/KABUL_KRITERLERI.md` (A-5, A-12, A-13, X-8, X-13 satır gruplarının sonu)
- Modify: `docs/superpowers/specs/2026-10-27-doktorlar-ekrani-design.md` §6

- [ ] **Step 1:** YOL_HARITASI'na Ü-18 satırı: "**Doktorlar ekranı — yoğunluk, süzgeç, yan panel** *(27.10.2026 — kullanıcı talebi; §7-5)* | KPI, birleşik süzgeç, son sipariş/bakiye sütunları, rozetler, yan panel, sütun seçici — yeni karar yok; spec `docs/superpowers/specs/2026-10-27-doktorlar-ekrani-design.md`".
- [ ] **Step 2:** KABUL_KRITERLERI'ne beş kriter (yazılacağı yer kolonu: `Ü-18 D1/D2/D3 · <test dosyası>`):
  - **A-5-7** — Cari listesinde "Son sipariş" ve son sipariş süzgeçleri yalnız sayılan siparişi okur (`ONAYLI`, iptal edilmemiş); `TEKLIF` ve `IPTAL` sayılmaz; tarih `orderDate`, gün sınırı İstanbul günüdür. · `sorgu.itest.ts`
  - **A-12-5** — `hesaplaDoktorRiskleri(idler)` her doktor için `hesaplaDoktorRisk` ile birebir aynı sonucu verir; cari listesi ve yan paneldeki "Limit aşıldı" rozeti `limitAsildi`'dir. · `risk.itest.ts` · `doktorlar.spec.ts`
  - **A-13-3** — Cari listesinde A-13-2'ye göre eksik fatura bilgisi olan satır "Eksik fatura" rozeti ve uyarı arka planı taşır; "Eksik fatura bilgisi" KPI sayısı aynı tanımdır. · `sorgu.itest.ts` · `doktorlar.spec.ts`
  - **X-8-4** — Cari listesinin hesap sınıfı süzgeci bölge, satıcı, durum, eksik fatura ve son sipariş süzgeçleriyle birleşir; eski `?sinif=`, `?sahip=yok`, `?fatura=eksik` adresleri aynı sonucu verir. · `suzgec.test.ts` · `sorgu.itest.ts`
  - **X-13-2** — `OPERASYON` cari listesinde yan paneli açar; panelde Düzenle, listede Yeni Cari ve toplu devir yoktur. · `operasyon.spec.ts`
- [ ] **Step 3:** Spec §6'da "Ek olarak Ü-18 başlığı altında…" cümlesini "Kararsız davranışlar (bölge/satıcı süzgeci, sütun seçici, boş durum) kriter almaz; testleri §6 tablosundadır." ile değiştir; kriter listesini Step 2'dekilerle eşitle.
- [ ] **Step 4: Commit** — `git commit -m "docs(doktorlar-d1): Ü-18 ve kabul kriterleri (A-5-7, A-12-5, A-13-3, X-8-4, X-13-2)"`

### Task 2: Toplu risk — `hesaplaDoktorRiskleri`

**Files:**
- Modify: `src/lib/doctor-cari.ts` (`hesaplaDoktorRisk` bölümü, ~satır 95-140)
- Test: `src/lib/risk.itest.ts`

**Interfaces:**
- Produces: `hesaplaDoktorRiskleri(idler: readonly string[], db?: Db): Promise<Map<string, DoktorRisk>>` — var olmayan kimlik haritada yoktur; boş liste sorgu atmadan boş harita.
- `hesaplaDoktorRisk(id, db?)` imzası aynı kalır; kayıt yoksa hata atar (bugünkü gibi).
- `bakiyeYonu(b: Decimal): BakiyeYonu` — `hesaplaDoktorBakiye` içindeki yön ifadesi buraya çıkarılır (Task 7 tüketir).

- [ ] **Step 1: Failing tests** — `risk.itest.ts`'e `describe("hesaplaDoktorRiskleri — toplu ≡ tekli (A-12-5)")`:
  - `"her doktor için tekli sonuçla birebir aynı"`: dosyadaki yardımcılarla 5 doktor kur — (a) borç 500 + ONAYLI 2×100 (b) borç 1000 + tahsilat 1250 (avans) (c) kısmi sevk + bedelsiz satır (d) `creditLimit` = risk (eşit, aşım yok) (e) `creditLimit` < risk. Her biri için `bakiye`, `acikSiparis`, `risk` `toFixed(2)`'si, `krediLimiti?.toFixed(2)`, `limitAsildi` tekliyle eşit.
  - `"hareketsiz ve siparişsiz doktor döner: bakiye 0, açık 0, limitsiz"` → `toFixed(2) === "0.00"`, `krediLimiti === null`, `limitAsildi === false`.
  - `"boş liste boş harita"` ve `"bilinmeyen kimlik haritada yok"`.
  - `"tekli bilinmeyen kimlikte reddeder"` → `await expect(hesaplaDoktorRisk("yok")).rejects.toThrow()`.
- [ ] **Step 2:** `npm run db:up` (gerekirse) · `npx vitest run --project integration src/lib/risk.itest.ts` → yeni testler FAIL (`hesaplaDoktorRiskleri is not a function`).
- [ ] **Step 3: Implement** — üç sorgu `Promise.all`:
  limitler (`doctor.findMany` id+creditLimit) · açık satırlar (`orderItem.findMany`, `where: { order: { ...sayilanBelgeler.siparis, doctorId: { in: idler } } }`, `select: { ...SIPARIS_SATIRI, shipmentItems: { select: { quantity: true } }, order: { select: { doctorId: true } } }`) · bakiyeler (`$queryRaw` `SELECT "doctorId", ${BAKIYE} AS bakiye FROM "LedgerEntry" WHERE "doctorId" IN (${Prisma.join(idler)}) GROUP BY "doctorId"`).
  Doktor başına satırları grupla, bugünkü sevk edilmemiş miktar dönüşümü + `siparisToplami(...).toplam`; `risk = bakiye.plus(acik)`; `limitAsildi = limit !== null && risk.gt(limit)`. Tekli fonksiyon: `const r = (await hesaplaDoktorRiskleri([id], db)).get(id); if (!r) throw new Error(\`Doktor bulunamadı: ${id}\`); return r;`. Fonksiyonun üst yorumuna "toplu ve tekli aynı yoldur (A-12-5)" ekle.
- [ ] **Step 4:** Aynı komut → tüm `risk.itest.ts` PASS (eski A-12-1…4 testleri dahil). `npx vitest run --project integration` → tamamı PASS (risk başka itest'lerde de kullanılıyor).
- [ ] **Step 5: Commit** — `feat(doktorlar-d1): hesaplaDoktorRiskleri — sayfa başına toplu risk, tek hesap yolu (A-12-5)`

### Task 3: Saf süzgeç modülü

**Files:**
- Create: `src/lib/doktor-listesi/suzgec.ts`
- Test: `src/lib/doktor-listesi/suzgec.test.ts`

**Interfaces (Produces):**
```ts
export const SAHIPSIZ = "yok";
export type Sessiz = "30" | "60" | "90" | "180" | "hic";
export type DoktorSuzgeci = {
  sinif: "DOKTOR" | "BAYI" | null;
  bolge: string | null;
  satici: string | null;          // kullanıcı kimliği ya da SAHIPSIZ
  durum: "AKTIF" | "PASIF" | null;
  fatura: "eksik" | null;
  sessiz: Sessiz | null;          // aralık varsa null'a çekilir
  sonBas: string | null;          // İstanbul günü YYYY-AA-GG
  sonBit: string | null;
};
export const BOS_SUZGEC: DoktorSuzgeci;
export type Parametreler = Record<string, string | string[] | undefined>;
export function suzgecCoz(p: Parametreler): { suzgec: DoktorSuzgeci; detay: string | null };
export function doktorAdresi(s: DoktorSuzgeci, ek?: { page?: number; per?: number; detay?: string }): string; // "/doctors" ya da "/doctors?…"
export const HIZLI_SEKMELER: readonly { etiket: string; suzgec: DoktorSuzgeci }[]; // Tümü, Doktorlar, Bayiler, Sahipsiz, Eksik fatura bilgisi
export function ayniSuzgec(a: DoktorSuzgeci, b: DoktorSuzgeci): boolean;
export function etkinSayisi(s: DoktorSuzgeci): number;
export function etkinSuzgecler(s: DoktorSuzgeci, saticiAdi: (id: string) => string | undefined): { anahtar: keyof DoktorSuzgeci; etiket: string; kaldirAdresi: string }[];
export type BosDurum = "hic-kayit" | "sahipsiz" | "eksik-fatura" | "suzgecli";
export function bosDurum(s: DoktorSuzgeci): BosDurum;
```
Desen: `src/lib/denetim/suzgec.ts` (`ilk`, `gun`, `secenek`, `KIMLIK`). Parametre adları spec §3.2 tablosu. `bolge`: kırpılmış, 1–100 karakter.

- [ ] **Step 1: Failing tests** (`describe` başına bir konu):
  - Çözme: geçerli tüm alanlar; geçersizler `null` (`sinif=X`, `durum=x`, `sessiz=45`, `sonBas=2026-02-30`, `satici=<65 karakter>`, `detay=a b`).
  - Geriye uyum: `{ sahip: "yok" }` → `satici: "yok"`; `{ sinif: "BAYI" }`, `{ fatura: "eksik" }` aynen.
  - Öncelik: `{ sessiz: "90", sonBas: "2026-10-01" }` → `sessiz: null`, `sonBas: "2026-10-01"`.
  - Ters aralık: `{ sonBas: "2026-10-10", sonBit: "2026-10-01" }` → ikisi de `null`.
  - Gidiş-dönüş: her alan dolu süzgeç (bölge `"İç Anadolu"`) → `suzgecCoz(Object.fromEntries(new URL(doktorAdresi(s), "http://x").searchParams))).suzgec` `toEqual(s)`.
  - `doktorAdresi(BOS_SUZGEC)` → `"/doctors"`; `ek.page=1` yazılmaz, `page=2` yazılır; `detay` yalnız `ek.detay` verilince; çıktı `sahip=` içermez.
  - `etkinSayisi`: `BOS_SUZGEC` → 0; sinif+bolge+sessiz → 3; sonBas+sonBit tek sayılır → 1.
  - `etkinSuzgecler` etiketleri: `"Sınıf: Bayi"`, `"Bölge: İç Anadolu"`, `"Satıcı: Ahmet Yılmaz"`, `"Satıcı: Sahipsiz"`, `"Durum: Pasif"`, `"Eksik fatura bilgisi"`, `"Son sipariş: 90+ gün önce"`, `"Son sipariş: hiç yok"`, `"Son sipariş: 01.10.2026 – 15.10.2026"`, tek uç `"Son sipariş: 01.10.2026 sonrası"` / `"… öncesi"`; bilinmeyen satıcı adı → etiket listede yok. Her `kaldirAdresi` yalnız o alanı düşürür (aralıkta iki uç birlikte).
  - `HIZLI_SEKMELER` + `ayniSuzgec`: "Sahipsiz" sekmesi `{ ...BOS_SUZGEC, satici: "yok" }`; sinif+bolge süzgecinde hiçbir sekme aktif değil.
  - `bosDurum`: boş → `"hic-kayit"`; yalnız satici=yok → `"sahipsiz"`; yalnız fatura → `"eksik-fatura"`; diğer → `"suzgecli"`.
- [ ] **Step 2:** `npx vitest run --project unit src/lib/doktor-listesi/suzgec.test.ts` → FAIL (modül yok).
- [ ] **Step 3: Implement** `suzgec.ts` (yalnız `import type` — Prisma ve `db` yok). Gün etiketi `GG.AA.YYYY` metinden string işlemiyle.
- [ ] **Step 4:** Aynı komut → PASS. `npx eslint src/lib/doktor-listesi`.
- [ ] **Step 5: Commit** — `feat(doktorlar-d1): cari listesi süzgeci — adres çözme ve üretme, etiketler (X-8-4)`

### Task 4: Saf sütun modülü

**Files:**
- Create: `src/lib/doktor-listesi/sutunlar.ts`
- Test: `src/lib/doktor-listesi/sutunlar.test.ts`

**Interfaces (Produces):**
```ts
export type SutunAnahtari = "klinik" | "telefon" | "satici" | "siparis" | "sonSiparis" | "bakiye" | "durum";
export const SUTUNLAR: readonly { anahtar: SutunAnahtari; baslik: string }[]; // tablo sırası; Ad Soyad ve seçim kutusu yok → gizlenemez
export const SUTUN_CEREZI = "doktor-sutunlar";
export function gizliSutunlariCoz(deger: string | undefined): ReadonlySet<SutunAnahtari>;
export function gizliSutunCerezi(gizli: Iterable<string>): string; // bilinmeyeni atar, SUTUNLAR sırasında, virgüllü
```
Başlıklar: Klinik / Bölge · Telefon · Sorumlu Satıcı · Sipariş · Son Sipariş · Bakiye · Durum.

- [ ] **Step 1: Failing tests:** `gizliSutunlariCoz(undefined)` ve `("")` boş küme; `("telefon,bakiye")` iki eleman; `("telefon,adSoyad,<script>")` yalnız telefon; `gizliSutunCerezi(["bakiye","telefon","yok"])` → `"telefon,bakiye"`; gidiş-dönüş; `SUTUNLAR` `"adSoyad"` içermez.
- [ ] **Step 2:** `npx vitest run --project unit src/lib/doktor-listesi/sutunlar.test.ts` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Aynı komut → PASS.
- [ ] **Step 5: Commit** — `feat(doktorlar-d1): sütun seçici çerez biçimi`

### Task 5: Liste sorguları

**Files:**
- Create: `src/lib/doktor-listesi/sorgu.ts`
- Test: `src/lib/doktor-listesi/sorgu.itest.ts`

**Interfaces:**
- Consumes: Task 2 `hesaplaDoktorRiskleri`, `hesaplaDoktorRisk`; Task 3 `DoktorSuzgeci`, `SAHIPSIZ`.
- Produces:
```ts
export function doktorWhere(s: DoktorSuzgeci, an?: Date): Prisma.DoctorWhereInput; // an varsayılan simdi()
export type DoktorSatiri = Prisma.DoctorGetPayload<{ include: { ownerSeller: { select: { id: true; name: true } }; _count: { select: { orders: true } } } }>
  & { sonSiparis: Date | null; risk: DoktorRisk; eksikFatura: boolean };
export function doktorListesi(s: DoktorSuzgeci, sayfa: { skip: number; take: number }, an?: Date): Promise<{ satirlar: DoktorSatiri[]; toplam: number }>;
export function doktorKpileri(): Promise<{ toplam: number; aktif: number; sahipsiz: number; eksikFatura: number }>;
export function doktorSuzgecSecenekleri(): Promise<{ bolgeler: string[]; saticilar: { id: string; name: string }[] }>;
export type DoktorPaneliVerisi = { doktor: Doctor & { ownerSeller: { name: string } | null }; risk: DoktorRisk; vadeUyarisi: Bildirim | null;
  siparisler: { id: string; documentNo: string; orderDate: Date; status: OrderStatus; toplam: ParaDegeri }[];
  hareketler: { id: string; createdAt: Date; type: LedgerEntryType; direction: LedgerDirection; amount: Prisma.Decimal; documentNo: string }[];
  devirler: { id: string; changedAt: Date; from: string | null; to: string | null }[] };
export function doktorPaneli(id: string): Promise<DoktorPaneliVerisi | null>;
```
Son sipariş koşulları spec §4.2 (birebir). `sessiz=N` alt sınırı: `gunAraligi(an).baslangic`'tan N−1 gün önceki İstanbul gece yarısı (`geceYarisi` ile hesapla, ms çıkarma değil). Aralık uçları `yerelGunAraligi`. Sıra `fullName asc`. `bolgeler`: `distinct: ["region"]`, `region: { not: null }`, alfabetik (`localeCompare("tr")`). Paneldeki sınırlar: sipariş 5 (`orderDate desc`), hareket 5 (`createdAt desc`), devir 3 (`changedAt desc`).

- [ ] **Step 1: Failing tests** (`referansVeri`, `yeniDoktorVerisi`; sipariş/hareket yardımcıları `risk.itest.ts`'teki gibi; `orderDate` açıkça verilir; `an` sabit `2026-10-27T09:00:00Z`):
  - `"son sipariş TEKLIF ve IPTAL'i saymaz (A-5-7)"` — TEKLIF 20.10, IPTAL 22.10, ONAYLI 01.10 → `sonSiparis` 01.10.
  - `"sessiz=30 bugün dahil 30 İstanbul günü"` — sipariş `2026-09-27T21:30:00Z` (İstanbul 28.09 00:30) olan doktor listede **yok**; `2026-09-27T20:30:00Z` (27.09 23:30) olan **var**.
  - `"sessiz=hic"` — yalnız TEKLIF'i olan doktor listede; ONAYLI'sı olan yok.
  - `"aralık: son siparişi aralıkta olanlar"` — son siparişi 05.10 olan var; 05.10 + 20.10 olan (aralık 01–15.10) yok; tek uç `sonBas` ve tek uç `sonBit` birer test.
  - `"birleşik süzgeç"` — sinif=DOKTOR ∧ bolge=Marmara ∧ satici ∧ durum=AKTIF ∧ fatura=eksik yalnız uyanı döndürür; `satici=yok` BAYI'yi döndürmez (SAHIPSIZ_DOKTOR).
  - `"eksikFatura işareti süzgeçle aynı küme (A-13-3)"` — sayfadaki `eksikFatura === true` kimlikleri ≡ `doktorWhere({ ...BOS_SUZGEC, fatura: "eksik" })` sonucu.
  - `"risk satırı hesaplaDoktorRisk ile aynı"` — bir satırın `risk.risk.toFixed(2)`'si tekliyle eşit.
  - `"KPI sayıları"` — 1 aktif doktor, 1 pasif, 1 sahipsiz, 1 eksik faturalı kurulumunda beklenen dört sayı.
  - `"süzgeç seçenekleri"` — bölgeler tekil, boşsuz, sıralı; pasif satıcı yok.
  - `"panel: bilinmeyen kimlik null; sınırlar 5/5/3 ve en yeni önce; sipariş toplamı siparisToplami"`.
- [ ] **Step 2:** `npx vitest run --project integration src/lib/doktor-listesi/sorgu.itest.ts` → FAIL.
- [ ] **Step 3:** Implement. Liste: `findMany` + `count` paralel; sonra sayfa kimlikleriyle paralel `order.groupBy({ by: ["doctorId"], where: { ...sayilanBelgeler.siparis, doctorId: { in } }, _max: { orderDate: true } })`, `hesaplaDoktorRiskleri`, eksik fatura `findMany({ where: { AND: [{ id: { in } }, EKSIK_FATURA_BILGISI] }, select: { id: true } })`.
- [ ] **Step 4:** Aynı komut → PASS; `npx vitest run --project integration` tamamı PASS; `npx tsc --noEmit`; `npm run lint`.
- [ ] **Step 5: Commit** — `feat(doktorlar-d1): cari listesi sorguları — süzgeç, son sipariş, toplu risk, KPI, panel (A-5-7, A-13-3)`

### Task 6: D1 PR

- [ ] `npm test` · `npx vitest run --project integration` · `npm run lint` · `npx tsc --noEmit` → hepsi temiz.
- [ ] `npm run izlenebilirlik` (yeni kriterler matrise girer) → üretilen `docs/TRACEABILITY.md`'yi commit'le.
- [ ] `git push -u origin revize/doktorlar-d1-veri` · `gh pr create` (başlık `feat(doktorlar-d1): veri katmanı — toplu risk, süzgeç, liste sorguları`; gövde: kapsam, kriterler, "ekran değişmez").
- [ ] `gh pr checks <n>` "pass" görülünce merge; `main`'e dön, çek.

---

## PR D2 — tablo, KPI, süzgeç · dal `revize/doktorlar-d2-tablo` (`main`'den)

Önce: çalışma ağacındaki `src/app/(admin)/doctors/page.tsx` isim bağlantısı değişikliği bu dala taşınır (Task 8'de yeniden yazılır). `prisma.config.ts` değişikliği hiçbir commit'e girmez.

### Task 7: Rozetler ve bakiye hücresi

**Files:**
- Create: `src/app/(admin)/doctors/DurumRozetleri.tsx`, `src/app/(admin)/doctors/bakiye.tsx`
- Modify: `src/app/(admin)/doctors/[id]/page.tsx` (yerel `BAKIYE_ETIKETI` → `bakiye.tsx`'ten import)
- Test: `src/app/(admin)/doctors/rozetler.test.ts` (renderToStaticMarkup, `src/components/ikon.test.ts` deseni)

**Interfaces (Produces):**
- `DurumRozetleri({ status, eksikFatura, risk }: { status: EntityStatus; eksikFatura: boolean; risk: Pick<DoktorRisk, "risk" | "krediLimiti" | "limitAsildi"> })` — sıra: durum, Eksik fatura, Limit aşıldı.
- `bakiye.tsx`: `export const BAKIYE_ETIKETI` (detay sayfasından taşınır), `BakiyeHucresi({ bakiye, yon }: { bakiye: Decimal; yon: BakiyeYonu })` — K-2: çıplak negatif yok; `<Tutar deger={bakiye.abs()} taban={BRUT} baslikta />` + altında küçük `BAKIYE_ETIKETI[yon]` (detay sayfasının KPI kartıyla aynı kural). Yön `DoktorRisk.bakiye`'den: `gt(0)` BORC, `lt(0)` ALACAK, aksi KAPALI — `doctor-cari.ts`'e `bakiyeYonu(b: Decimal): BakiyeYonu` olarak çıkar ve `hesaplaDoktorBakiye` de onu kullansın (Task 2'ye eklenir).

- [ ] **Step 1: Failing tests:** AKTIF → "Aktif" `bg-positive-bg`; PASIF → "Pasif" `bg-neutral-bg`; eksikFatura → "Eksik fatura" `bg-critical-bg`; limitAsildi → "Limit aşıldı" `bg-negative-bg` ve `title` "Risk … / Limit …"; limit eşit → rozet yok; üçü birden → üç rozet sırayla.
- [ ] **Step 2:** `npx vitest run --project unit "src/app/(admin)/doctors"` → FAIL.
- [ ] **Step 3:** Implement (`StatusChip`, `StatusBadge`, `formatla`).
- [ ] **Step 4:** PASS; detay sayfası e2e'si (`e2e/admin/doctor-detail.spec.ts`) değişmeden geçer (Task 9'da koşulur).
- [ ] **Step 5: Commit** — `feat(doktorlar-d2): durum rozetleri ve bakiye hücresi (A-12-5, A-13-3)`

### Task 8: Tablo, satır vurgusu, boş durum

**Files:**
- Create: `src/app/(admin)/doctors/DoktorTablosu.tsx`, `src/app/(admin)/doctors/BosDurum.tsx`
- Modify: `src/app/(admin)/doctors/page.tsx` (sorgular `doktorListesi`/`doktorKpileri`/`doktorSuzgecSecenekleri`'ne geçer; `suzgecCoz` + `getPagination`)
- Test: `e2e/admin/doktorlar.spec.ts` (yeni)

**Interfaces:**
- Consumes: Task 3 `suzgecCoz`, `doktorAdresi`, `bosDurum`; Task 4 `SUTUNLAR`; Task 5 `doktorListesi`; Task 7 bileşenleri.
- Produces: `DoktorTablosu({ satirlar, gizli, devirYetkisi, suzgec, yer, an, yonetici })` — `gizli: ReadonlySet<SutunAnahtari>` (D2'de daima boş küme; D3 çerezden doldurur). İsim bağlantısı D2'de hâlâ `/doctors/[id]`'ye gider, `text-link` + altı çizili + `›` stilini korur (D3 panele çevirir).

Satır: eksik faturada `<tr className="bg-critical-bg">` + ilk hücrede `border-l-2 border-critical`. Son Sipariş: `formatDate` + altında `"N gün önce"` (`goreliZaman` değil — gün sayısı; `an` ile İstanbul günü farkı). Bakiye başlığı `tabanli("Bakiye", BRUT)`. `Pagination basePath="/doctors" params={…}` — `params`, `doktorAdresi(suzgec)`'in sorgu parametrelerinden (`page` ve `detay` hariç) kurulur.

- [ ] **Step 1: Failing e2e** (`e2e/admin/doktorlar.spec.ts`, admin projesi; veri `sorgu()` ile):
  - `"yeni sütunlar: son sipariş ve bakiye (KDV dahil başlık)"` — seed'de ONAYLI siparişi olan bir doktorun satırında tarih ve "gün önce"; `columnheader` "Bakiye (KDV dahil)" (metni `tabanli` çıktısıyla).
  - `"eksik faturalı satır rozetli ve vurgulu (A-13-3)"` — `invoiceAddress` boş bir doktor satırı "Eksik fatura" metni ve `bg-critical-bg` sınıfı.
  - `"limit aşan cari 'Limit aşıldı' rozeti taşır (A-12-5)"` — `UPDATE "Doctor" SET "creditLimit" = 1` borçlu bir doktora; sonunda geri al.
  - `"süzgeç sonucu boşsa açıklayıcı boş durum ve Süzgeçleri temizle"` — `/doctors?bolge=Yok-Bolge` → "Bu süzgeçlere uyan cari bulunamadı." + bağlantı → `/doctors`.
- [ ] **Step 2:** Yerelde 3000'deki dev sunucusu açıksa durdur; `npx playwright test --project=admin e2e/admin/doktorlar.spec.ts` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Aynı komut → PASS.
- [ ] **Step 5: Commit** — `feat(doktorlar-d2): son sipariş ve bakiye sütunları, rozetler, eksik fatura vurgusu, boş durum`

### Task 9: KPI kartları ve süzgeç çubuğu

**Files:**
- Create: `src/app/(admin)/doctors/KpiKartlari.tsx`, `src/app/(admin)/doctors/SuzgecCubugu.tsx`
- Modify: `src/app/(admin)/doctors/page.tsx`
- Modify: `e2e/admin/doctor-transfer.spec.ts:160` (`/\/doctors\?sahip=yok/` → `/[?&]satici=yok/`)
- Test: `e2e/admin/doktorlar.spec.ts`

**Interfaces:**
- Consumes: Task 3 `HIZLI_SEKMELER`, `ayniSuzgec`, `etkinSayisi`, `etkinSuzgecler`, `doktorAdresi`; Task 5 `doktorKpileri`, `doktorSuzgecSecenekleri`.
- Produces: `SuzgecCubugu({ suzgec, secenekler, sutunMenusu? }: { …; sutunMenusu?: React.ReactNode })` — D3 sütun menüsünü bu yuvaya koyar.

KPI: `KpiSatiri` içinde dört `<Link href=…><KpiCard adet=… varyant="ikincil" iyiYon="notr" bosDavranisi="sifir" karsilastirma={{ anlik: "şu an" }} vurgu={sayi > 0 ? "uyari" : undefined} /></Link>` (vurgu yalnız Sahipsiz ve Eksik fatura). Etiketler: "Toplam cari", "Aktif", "Sahipsiz", "Eksik fatura bilgisi". Süzgeç paneli: `<details>` + `<form method="get" action="/doctors">`, alanlar spec §3.2 tablosu; denetim formunun `KONTROL_TEK_SATIR` ve etiket deseni; özet düğmesi `Ikon ad="filtrele"` + `"Filtrele"` + (n>0 ise) `" · n"`; panelde not: "Tarih aralığı girilirse hazır seçim yok sayılır." Sekme görünümü bugünkü sınıflarla (tasarım e2e'si "Tümü" yüksekliğini ölçer). Sahipsiz şeridi ve toplu devir formu yerinde.

- [ ] **Step 1: Failing e2e:**
  - `"Filtrele: bölge + satıcı süzer, etiketler × ile kalkar"` — panel aç, Bölge "Marmara", satıcı seed satıcısı, Uygula → URL `bolge=Marmara&satici=`; satırlar yalnız uyanlar (`sorgu` ile beklenen adlar); "Filtrele · 2"; "Bölge: Marmara" etiketinin bağlantısına tıkla → URL'de `bolge` yok.
  - `"Son sipariş: 90+ gün ve hiç sipariş"` — `sessiz=hic` seçimiyle beklenen ad görünür, siparişli doktor görünmez.
  - `"KPI kartı tıklanınca süzgeç uygulanır"` — "Eksik fatura bilgisi" kartı → URL `fatura=eksik`, sekme aktif.
  - `"eski adres ?sahip=yok çalışır"` — Sahipsiz sekmesi aktif.
- [ ] **Step 2:** `npx playwright test --project=admin e2e/admin/doktorlar.spec.ts` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Aynı komut → PASS; ardından tam koşu `npx playwright test` → PASS (özellikle `doctor-transfer`, `tasarim`, `operasyon`, `mobil/tablo`, `smoke`).
- [ ] **Step 5: Commit** — `feat(doktorlar-d2): KPI kartları ve birleşik süzgeç paneli (X-8-4)`

### Task 10: D2 PR

- [ ] `npm test` · `npx vitest run --project integration` · `npm run lint` · `npx tsc --noEmit` · `npx playwright test` → temiz.
- [ ] `npm run izlenebilirlik` → commit.
- [ ] Push · `gh pr create` (`feat(doktorlar-d2): tablo, KPI ve süzgeçler`) · checks pass → merge.

---

## PR D3 — yan panel ve sütun seçici · dal `revize/doktorlar-d3-panel` (`main`'den)

### Task 11: Yan panel

**Files:**
- Move: `src/components/denetim/YanPanel.tsx` → `src/components/YanPanel.tsx` (`git mv`; içerik aynı; içe aktaranları güncelle: `grep -rn "denetim/YanPanel" src`)
- Create: `src/app/(admin)/doctors/DoktorPaneli.tsx`
- Modify: `src/app/(admin)/doctors/DoktorTablosu.tsx` (isim bağlantısı), `page.tsx` (`detay` → `doktorPaneli`)
- Test: `e2e/admin/doktorlar.spec.ts`, `e2e/operasyon/operasyon.spec.ts`, `e2e/mobil/doktorlar.spec.ts` (yeni)

**Interfaces:**
- Consumes: Task 5 `doktorPaneli`, `DoktorPaneliVerisi`; Task 7 `DurumRozetleri`, `bakiye.tsx`; `YanPanel({ kapatAdresi, baslikId, kayitId })`.
- İsim bağlantısı: `href={doktorAdresi(suzgec, { ...yer, detay: d.id })}`, `scroll={false}`, `data-kayit={d.id}`.

Panel bölümleri spec §3.6 (1–7), her bölüm `<section aria-labelledby>` (denetim `DetayPaneli` deseni; bölge adları: "Cari özeti", "Son siparişler", "Son cari hareketler", "Devir geçmişi"). Tutar başlıkları `tabanli(…)`. Telefon `href="tel:+90…"`. Alt kısım: `LinkButton href=/doctors/[id]` "Tam detaya git"; `YONETICI` ise "Düzenle". `doktorPaneli` `null` → panel çizilmez.

- [ ] **Step 1: Failing e2e:**
  - admin `"isim yan paneli açar; Esc kapatır, odak isme döner"` — isme tıkla → `dialog` adı doktor adı, URL `detay=`, bölgeler görünür, "Tam detaya git" `/doctors/<id>`'ye gider (ayrı adımda); Esc → dialog yok, URL'de `detay` yok, odaklı eleman `a[data-kayit="<id>"]`.
  - admin `"panel süzgeci korur"` — `?bolge=Marmara` iken panel aç/kapat → URL hâlâ `bolge=Marmara`.
  - admin `"geçersiz detay kimliği paneli açmaz"` — `/doctors?detay=yok` → dialog yok, tablo var.
  - operasyon `"paneli açar; Düzenle yok (X-13-2)"`.
  - mobil `"panel tam ekran"` — dialog genişliği ≈ viewport genişliği (`e2e/mobil/denetim.spec.ts` deseni).
- [ ] **Step 2:** `npx playwright test --project=admin --project=operasyon --project=mobil-iphone e2e/admin/doktorlar.spec.ts e2e/operasyon e2e/mobil/doktorlar.spec.ts` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Aynı komut → PASS; `e2e/admin/denetim.spec.ts` ve `e2e/mobil/denetim.spec.ts` (taşınan kabuk) PASS.
- [ ] **Step 5: Commit** — `feat(doktorlar-d3): cari listesinde sağdan yan panel (X-13-2)`

### Task 12: Sütun seçici

**Files:**
- Create: `src/app/(admin)/doctors/sutunEylemi.ts` (`"use server"`), `src/app/(admin)/doctors/SutunSecici.tsx`
- Modify: `page.tsx` (çerez → `gizliSutunlariCoz`), `DoktorTablosu.tsx` (gizli sütun başlık + hücre çizilmez; boş durum `colSpan` = 1 + görünür sütun + (devirYetkisi ? 1 : 0))
- Test: `e2e/admin/doktorlar.spec.ts`

**Interfaces:**
- Consumes: Task 4 `SUTUNLAR`, `SUTUN_CEREZI`, `gizliSutunlariCoz`, `gizliSutunCerezi`; Task 9 `SuzgecCubugu` `sutunMenusu` yuvası.
- Produces: `sutunlariKaydet(formData: FormData): Promise<void>` — `requireStaff`; form `gorunur` onay kutuları (değer = anahtar) + gizli `donus` alanı; gizli = `SUTUNLAR` − görünür; `"varsayilan"` düğmesi çerezi siler; `cookies().set(SUTUN_CEREZI, deger, { path: "/doctors", maxAge: 31536000, sameSite: "lax", httpOnly: true })`; `redirect(donus)` — `donus` yalnız `/doctors` ile başlıyorsa, değilse `/doctors`.

- [ ] **Step 1: Failing e2e:**
  - `"Telefon ve Bakiye gizlenir, yenilemede gizli kalır; Varsayılana dön geri getirir"` — `columnheader` "Telefon" yok → `page.reload()` → yine yok → "Varsayılana dön" → var.
  - `"bütün sütunlar gizli ve sonuç boş: boş durum tek hücre tüm satırı kaplar"` — `colspan` = görünür başlık sayısı.
  - `"bozuk çerez varsayılan görünüm"` — `context.addCookies([{ name: "doktor-sutunlar", value: "%%%", … }])` → tüm başlıklar var.
- [ ] **Step 2:** `npx playwright test --project=admin e2e/admin/doktorlar.spec.ts` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Aynı komut → PASS.
- [ ] **Step 5: Commit** — `feat(doktorlar-d3): sütun seçici — tercih çerezde, sunucuda çizilir`

### Task 13: Belgelerin kapanışı ve D3 PR

**Files:** `docs/PROJE_DURUMU.md` (arayüz bölümü) · `AGENTS.md` (doküman haritasına `docs/superpowers/` satırı: "Tasarım spec'leri ve uygulama planları — plan sınıfı, karar üretmez") · `docs/YOL_HARITASI.md` (Ü-18 ✅ ve tarih) · `MD_files/DEVAM_PROMPTU.md` (▶ satırı) · `docs/TRACEABILITY.md` (üretilir)

- [ ] Belgeleri güncelle; `npm run izlenebilirlik`.
- [ ] Tam doğrulama: `npm test` · `npx vitest run --project integration` · `npm run lint` · `npx tsc --noEmit` · `npx playwright test` → temiz.
- [ ] Commit `docs(doktorlar-d3): Ü-18 kapanışı` · push · `gh pr create` (`feat(doktorlar-d3): yan panel ve sütun seçici`) · checks pass → merge.
