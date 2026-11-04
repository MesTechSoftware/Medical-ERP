# Raporlar ekranı Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Raporlar'ın "ilk 25 doktor" tablosunu dönemdeki bütün cirolu carilerin sayfalı, süzülebilir listesine çevirmek; satıcı adından o satıcının carilerine geçmek; dönem değişince süzgeci korumak.

**Architecture:** `src/lib/rapor-listesi/{suzgec.ts, sutunlar.ts (saf), sorgu.ts}`; `getDoctorReports` tam listeyi verir, sıra ve oran tam listeden hesaplanır, süzgeç ve sayfa sonra uygulanır (bellekte — servis zaten bütün carileri okur). Dönem seçici ve satıcı tablosu isteğe bağlı prop alır, `/my-report` değişmez.

**Tech Stack:** Next.js 16, Prisma 7, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-04-rapor-ekrani-design.md`

## Global Constraints

- Ciro *KDV hariç* (`MATRAH`, Ü-3-1); uygulamada Decimal aritmetiği yok (X-5; `comparedTo`/`isZero` karşılaştırmadır).
- Sayfa `requireAdmin`; sütun eylemi `requireAdmin`.
- Doktor tablosu başlığı "Doktor Ciro Sıralaması" kalır (mevcut e2e).
- Commit mesajlarında Claude imzası yok.

## Review Focus

1. Eksi ciro (iade > sevk) satırı listede kalmalı, sıfır ciro düşmeli — Task 2 itest.
2. Satıcı süzgecinde sıra numarası dönem sırası olmalı (süzülmüş listede 1'den başlamamalı) — Task 2 itest.
3. Dönem değişince `satici`/`q` korunmalı; "Tüm zamanlar" bağlantısı da — Task 3 e2e.
4. Bilinmeyen satıcı kimliği adresten düşmeli — Task 3 e2e.
5. `/my-report` dönem seçicisi ve satıcı tablosu değişmemeli — mevcut `seller/report.spec.ts`.

---

### Task 1: Saf modüller

**Files:** Create `src/lib/rapor-listesi/{suzgec.ts, sutunlar.ts, suzgec.test.ts}`

**Interfaces — Produces:**
- `RaporSuzgeci = { donem: string | null; satici: string | null; q: string | null }`, `BOS_SUZGEC`, `SAHIPSIZ = "sahipsiz"`
- `suzgecCoz(p) → RaporSuzgeci` (donem `YYYY-AA` ya da `tum`, yoksa null; satici `kimlik` ya da `SAHIPSIZ`; q ≤ 100)
- `raporAdresi(s, { page?, per? }) → string` — sıra donem, satici, q, page (>1), per; taban `/reports`
- `korunanlar(s) → Record<string, string>` (satici, q — dönem seçicinin gizli alanları)
- `saticiAdresi(s, saticiId) → string` (donem korunur, q düşer)
- `etkinSuzgecler(s, saticiAdi) → { anahtar, etiket, kaldirAdresi }[]` — "Satıcı: Ad" / "Sahipsiz", "Ara: …"; adı bilinmeyen satıcı etiketsiz
- `bosDurum(s)`; `sutunlar.ts`: `RaporSutunu = "satici" | "oran"`, başlıklar "Satıcı", "Lidere göre", `SUTUN_CEREZI = "rapor-sutunlar"`, `SUTUN_YOLU = "/reports"`

- [ ] Test: gidiş-dönüş `{ donem: "2026-10", satici: "u-1", q: "ışık" }` → `"/reports?donem=2026-10&satici=u-1&q=%C4%B1%C5%9F%C4%B1k"`; `donem: "2026-13"`/`"x"` düşer, `"tum"` kalır; `korunanlar` yalnız dolu alanlar; `saticiAdresi(S({donem:"2026-10", q:"x"}), "u-2")` = `"/reports?donem=2026-10&satici=u-2"`; etiketler; `bosDurum`. → FAIL → yaz → PASS → commit.

### Task 2: Sorgu ve kriter

**Files:** Modify `src/lib/reports-service.ts` (`getDoctorReports`: `sellerId: string | null` döner, eşitlikte `fullName` `localeCompare(…, "tr")`); Create `src/lib/rapor-listesi/{sorgu.ts, sorgu.itest.ts}`; Modify `docs/KABUL_KRITERLERI.md` (X-1-2, spec §6 metni; yer `Ü-27 · rapor-listesi/sorgu.itest.ts · rapor-ekrani.spec.ts`).

**Interfaces — Produces:**
- `type SiraSatiri = DoctorReport & { sira: number; oran: number | null }`
- `doktorSiralamasi(aralik: Donem, s: RaporSuzgeci, sayfa: { skip; take }) → { satirlar: SiraSatiri[]; toplam: number }`
- `saticiSecenekleri() → { id; name; isActive }[]` (rol SATICI, ada göre)

- [ ] itest (EKIM dönemi, `sevkliSiparis` kalıbı `reports-service.itest.ts`'ten): A 300, B 200 (sahibi Ali), C 200 (sahibi Ali, ad "Işık" — B'den önce sıralanır mı: "B…" < "I…"), D 0 (düşer), E −50 (iade; kalır, sonda); `doktorSiralamasi(BOS)` sıra 1..4, oran A=1; `satici: ali` → B ve C, sıraları 2 ve 3; `SAHIPSIZ`; `q: "IŞIK"` → C; `take: 2, skip: 2` → 3. ve 4., `toplam: 4`.
- [ ] → FAIL → yaz → PASS (+ `reports-service.itest.ts` yeşil) → commit.

### Task 3: Ekran ve e2e

**Files:** Modify `src/app/(admin)/reports/page.tsx`, `loading.tsx`, `src/components/DonemSecici.tsx` (`korunan?: Record<string,string>`), `src/components/SaticiRaporTablosu.tsx` (`saticiBaglantisi?: (id: string) => string`); Create `src/app/(admin)/reports/{DoktorSiralamasi.tsx, sutunEylemi.ts}`, `e2e/admin/rapor-ekrani.spec.ts`.

- Doktor kartı: başlık "Doktor Ciro Sıralaması" + sağda Filtrele (`AcilirPanel`, form `aria-label="Rapor süzgeci"`: satıcı, ara; `donem`, `per` gizli) ve Sütunlar; etkin etiketler; tablo `aria-label="Doktor ciro sıralaması"` (#, Cari bağlantı, Satıcı, Ciro, Lidere göre); `Pagination` (`basePath="/reports"`, params süzgeçten); bilinmeyen satıcı → `redirect`; sayfa dışı → son sayfa.
- [ ] e2e: satıcı adına tıkla → URL `satici=`, etiket "Satıcı: …", ilk satırın `#` değeri ≥ 1 ve tablo yalnız o satıcının satırları; dönem seçicide ay değiştir → `satici` korunur; "Tüm zamanlar" bağlantısı `satici` taşır; sütun gizle (Satıcı); `satici=olmayan` düşer; `kpiIskeletiEslesir(page, "/reports")` (mevcut testte varsa tekrar yok).
- [ ] → FAIL → yaz → tam takım (tsc, lint, unit, itest, tam e2e) yeşil → commit.

### Task 4: Belgeler

YOL_HARITASI Ü-27 ✅, PROJE_DURUMU, `npm run izlenebilirlik` → commit.
