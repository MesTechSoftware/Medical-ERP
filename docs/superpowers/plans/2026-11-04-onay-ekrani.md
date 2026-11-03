# Onay Bekleyenler Ekranı Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/approvals` ekranına 4 KPI, durum sekmeleri + Filtrele, sütun seçicili/sayfalı tablo ve karar bağlamlı yan panel eklemek; dashboard "24 saatten eski onay" istisnasını süzgece bağlamak.

**Architecture:** Ü-19…Ü-24 kalıbı: `src/lib/onay-listesi/` saf süzgeç/sütun modülleri + `sorgu.ts`'te tek `where` üreticisi (`onayKosulu`). Karar eylemi (`blokKarari`) ve `blokKarariVer` değişmez; karar formu yan panele taşınır.

**Tech Stack:** Next.js 16 · Prisma 7 · Tailwind · Vitest · Playwright.

**Spec:** `docs/superpowers/specs/2026-11-04-onay-ekrani-design.md`

## Global Constraints

- Yeni karar/ADR yok. `blokKarari`, `blokKarariVer`, `requireAdmin` değişmez. KPI satırı 4 kart.
- Adres: `durum` (yok = bekleyen · `ONAY` · `RED` · `tumu`), `baslangic`/`bitis` (olay günü: kararlıda `decidedAt`, açıkta `openedAt`; İstanbul günü), `eski=1` (açık + `openedAt < an − ESKI_ONAY_SAATI` saat; `durum`'u ezer), `kural` (`NEGATIF_STOK`|`BEDELSIZ_ONAYI`), `acan` (kimlik), `q` (≤ 100, `metinVaryantlari`), `page`, `per`, `detay` (blok kimliği).
- `ESKI_ONAY_SAATI` `src/lib/istisnalar.ts`'ten; ikinci sabit yazılmaz.
- Sıralama: bekleyen `openedAt asc, id asc`; öbür sekmeler olay anı desc (`decidedAt` ?? `openedAt`), `id desc`.
- Çerez `onay-sutunlar`, `path=/approvals`; gizlenebilir: `cari`, `acan`, `gerekce`, `kararVeren`, `kararZamani`.
- Panel karar formu yalnız açık blokta; `data-blok-id` form kutusundadır.
- Saf modüller `db.ts`'e dokunmaz; X-4: action sözlük okumaz. Kriterler A-8-11, A-8-12 (spec §6 metinleri).
- Commit/PR'da Co-Authored-By ve "Generated with" yok.

## Review Focus

1. **Bugün kararı verilen ama günler önce açılmış blok** — "Bugün onaylanan" kartında ve `durum=ONAY&bugün` süzgecinde var → Task 2 testi.
2. **Aynı belgenin RED'den sonra yeniden açılmış bloğu** — panelde önceki karar (RED, not) görünür, form yalnız yeni blokta → Task 2 testi.
3. **Belgesi silinmiş/bulunmayan blok (documentId eşleşmez)** — satır "—" belgeyle çizilir, çökme yok → Task 2 testi.
4. **`eski=1&durum=ONAY`** — `eski` kazanır: açık ve eski bloklar → Task 1 testi.
5. **Negatif stok bağlamında tamamen sevk edilmiş kalem** — kalan 0, "yetmiyor" çipi yok → Task 2 testi.

---

## PR — `revize/onay-ekrani`

### Task 1: Belgeler + saf modüller — `onay-listesi/suzgec.ts`, `sutunlar.ts`, `suzgec.test.ts`

**Files:** Create `src/lib/onay-listesi/{suzgec,sutunlar}.ts`, `suzgec.test.ts`; Modify `docs/YOL_HARITASI.md` (Ü-24'ün altına Ü-25), `docs/KABUL_KRITERLERI.md` (A-8-11, A-8-12 → A-8-10'un altına, yer `Ü-25 · onay-listesi/suzgec.test.ts`).

**Produces:**
```ts
export type OnayDurumu = "bekleyen" | "ONAY" | "RED" | "tumu";
export type OnaySuzgeci = { durum: OnayDurumu; baslangic: string | null; bitis: string | null; eski: boolean; kural: "NEGATIF_STOK" | "BEDELSIZ_ONAYI" | null; acan: string | null; q: string | null };
export const BOS_SUZGEC: OnaySuzgeci; // durum "bekleyen"
export function suzgecCoz(p: Parametreler): { suzgec: OnaySuzgeci; detay: string | null };
export function onayAdresi(s: OnaySuzgeci, ek?: { page?: number; per?: number; detay?: string }): string; // sıra: durum, baslangic, bitis, eski, kural, acan, q, page, per, detay; durum "bekleyen" yazılmaz
export function durumSekmeleri(s: OnaySuzgeci): readonly { etiket: "Bekleyen" | "Onaylanan" | "Reddedilen" | "Tümü"; adres: string; etkin: boolean }[];
export function kartAdresleri(bugun: string): { eski: string; bugunOnay: string; bugunRed: string };
export function etkinSuzgecler(s: OnaySuzgeci, acanAdi: (id: string) => string | undefined): { anahtar: string; etiket: string; kaldirAdresi: string }[];
export function bosDurum(s: OnaySuzgeci): "hic-kayit" | "suzgecli";
// sutunlar.ts: type OnaySutunu = "cari" | "acan" | "gerekce" | "kararVeren" | "kararZamani"; SUTUN_CEREZI = "onay-sutunlar"; SUTUN_YOLU = "/approvals"
```
- [ ] Testler: varsayılan bekleyen ve `/approvals`; gidiş-dönüş; `durum=xyz` → bekleyen; `eski=1&durum=ONAY` → `{ eski: true, durum: "bekleyen" }` (RF 4); sekmeler `eski`'yi düşürür, öbürlerini korur; `kartAdresleri("2026-11-04")` → `/approvals?eski=1`, `/approvals?durum=ONAY&baslangic=2026-11-04&bitis=2026-11-04`, `…RED…`; etiketler "Durum: Onaylanan", "Tarih: …", "24 saatten eski", "Kural: Negatif stok", "Açan: Ad", "Ara: …" (bekleyen etiketsiz); bilinmeyen açan etiketsiz.
- [ ] FAIL → implement → PASS → `npm run izlenebilirlik` → commit `docs(onay): plan, Ü-25, kabul kriterleri (A-8-11, A-8-12); feat: süzgeç ve sütun modülleri`.

### Task 2: Sorgular — `onay-listesi/sorgu.ts`, `sorgu.itest.ts`

**Consumes:** Task 1; `ESKI_ONAY_SAATI`, `istisnalar` (`istisnalar.ts`); `gunleriAraliga` (`siparis-listesi/sorgu.ts`); `metinVaryantlari`; `kalemMiktarlari`; `hesaplaStoklar`, `varsayilanDepoId` (`stok.ts`); `BLOK_KURAL_ADI`, `BEDELSIZ_SEBEP_ADI` yalnız ekranda.

**Produces:**
```ts
export function onayKosulu(s: OnaySuzgeci, an: Date, qBelgeleri?: string[] | null): Prisma.ApprovalBlockWhereInput;
export type OnaySatiri = { id; ruleCode: string; documentType: string; documentId: string; openedAt: Date; openReason: string;
  decision: "ONAY" | "RED" | null; decidedAt: Date | null; decisionNote: string | null;
  belge: { no: string; siparisId: string | null } | null; cari: string | null; acan: string | null; kararVeren: string | null };
export async function onayListesi(s: OnaySuzgeci, sayfa: { skip: number; take: number }, an: Date): Promise<{ satirlar: OnaySatiri[]; toplam: number }>;
export type OnayKpileri = { bekleyen: number; enEski: Date | null; eski: number; bugunOnay: number; bugunRed: number };
export async function onayKpileri(bugun: string, an: Date): Promise<OnayKpileri>;
export type OnayPaneli = { blok: OnaySatiri; siparisDurumu: OrderStatus | null;
  negatifStok: { urun: string; kod: string; kalan: number; depo: number; yetmiyor: boolean }[] | null;
  bedelsiz: { urun: string; adet: number; sebep: FreeReason; not: string | null }[] | null;
  oncekiler: { id: string; ruleCode: string; decision: "ONAY" | "RED" | null; kararVeren: string | null; decisionNote: string | null; openedAt: Date }[] };
export async function onayPaneli(id: string): Promise<OnayPaneli | null>;
export async function acanSecenekleri(): Promise<{ id: string; name: string; isActive: boolean }[]>;
```
- `q`: SIP (order.documentNo / doctor.fullName), KNS (documentNo / doctor.fullName), TRF ve DZL (documentNo) eşleşen kimlikler → `documentId in`. Olay günü: `OR [{ decision: null, openedAt∈ }, { decision: not null, decidedAt∈ }]`.
- [ ] Testler: A-8-11 — eski kart = `eski` süzgeç toplamı = `istisnalar("YONETICI", [], an)` eskiOnay adedi (23 sa ve 25 sa önce açılmış iki blok); bugün onaylanan = süzgeç (3 gün önce açılıp bugün 00:00 İstanbul'da onaylanan dahil — RF 1; dün 23:59 hariç); bekleyen sıralama en eski önce; kural/açan süzgeci; `q` SIP belge no, cari (Türkçe), KNS belge no; bulunmayan belge → `belge: null` (RF 3). A-8-12 — panel: NEGATIF_STOK kalem kalan + depo stoğu + `yetmiyor` (tamamen sevk edilmiş kalem kalan 0, yetmiyor false — RF 5); BEDELSIZ_ONAYI bedelsiz satırlar; RED'li önceki blok `oncekiler`'de (RF 2); bulunmayan → `null`.
- [ ] FAIL → implement → PASS + lint/tsc → kriter yer kolonu `onay-listesi/sorgu.itest.ts` → commit `feat(onay): liste, KPI ve karar paneli sorguları (A-8-11, A-8-12)`.

### Task 3: Ekran + dashboard bağlantısı

**Files:** `approvals/page.tsx` yeniden; `KpiKartlari`, `SuzgecCubugu`, `OnayTablosu`, `OnayPaneli` (karar formu `IslemFormu action={blokKarari.bind(null, id)}`, `data-blok-id`), `sutunEylemi`, `loading.tsx`; `istisnalar.ts` eskiOnay `href: onayAdresi({ ...BOS_SUZGEC, eski: true })`.
- KPI spec §3.2 (`karsilastirma: { anlik: "şu an" }` / "bugün"; birincil ikincil metrik `en eskisi ${goreliZaman(enEski, an)}`); tablo §3.4; panel §3.5. Bilinmeyen `acan` → `redirect`; sayfa dışı → son sayfa.
- [ ] `npm run typecheck && npm run lint && npm test` → commit `feat(onay): KPI, sekmeler, Filtrele, tablo, karar paneli; dashboard istisnası süzgece bağlanır`.

### Task 4: E2E ve kapanış

- [ ] `e2e/admin/onay.spec.ts`: `/approvals?detay=<blokId>` ile panel; kart `[data-blok-id]` aynı beklentiler.
- [ ] `e2e/admin/onay-ekrani.spec.ts`: 25 saat önce açılmış blok (SQL `openedAt`) → "24 saatten eski" kartı sayısı = satır; panel negatif stok bağlamı ("yetmiyor"), not + Reddet → Reddedilen sekmesinde not görünür; sütun gizle → yenile; `?page=999`; `?acan=<olmayan>` düşer; KPI iskeleti eşleşir.
- [ ] Tam paket yeşil; belgeler (Ü-25 ✅, PROJE_DURUMU, izlenebilirlik, DEVAM_PROMPTU) → commit → push → PR → CI pass → code-review → işaret → merge.
