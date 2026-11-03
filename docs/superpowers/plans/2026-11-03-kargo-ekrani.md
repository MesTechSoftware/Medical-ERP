# Kargo Ekranı Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/shipping` ekranına 4 KPI, toplu kargo tablosu (satır başına takip/irsaliye, ortak firma, sipariş başına sonuç), kısmi sevk yan paneli ve süzgeçli/sayfalı sevkiyat listesi eklemek.

**Architecture:** Sevk çekirdeği `src/lib/sevk-et.ts`'te (`siparisiSevkEt` tek sipariş, `topluKargo` sipariş başına ayrı transaction); eylemler incedir. Liste/süzgeç Ü-19…Ü-23 kalıbında `src/lib/kargo-listesi/`. Türkçe metin varyantları `src/lib/liste/metin.ts`'e taşınır.

**Tech Stack:** Next.js 16 · Prisma 7 · Tailwind · Vitest · Playwright.

**Spec:** `docs/superpowers/specs/2026-11-03-kargo-ekrani-design.md`

## Global Constraints

- Yeni karar/ADR yok. `sevkiyatYaz`, `/orders/[id]`, `/approvals` değişmez. KPI satırı 4 kart (ADR-010).
- Toplu kargo: her sipariş **ayrı transaction**, `gerekce: null`, miktar = kalan (`kalemMiktarlari`), firma ortak, takip/irsaliye satır başına; en çok `TOPLU_SINIR = 50` (gözden geçirmede 100'den indirildi); irsaliye ≤ 32 karakter (C-1).
- Form alan adları: `secili` (çoklu, sipariş kimliği), `takip_<siparisId>`, `irsaliye_<siparisId>`, `carrierId`.
- Sevkiyat listesi adresi: `baslangic`, `bitis` (`shippedAt` İstanbul günü), `firma` (kimlik | `yok`), `durum` (`KARGOLANDI`|`TESLIM_EDILDI`), `q` (≤ 100), `page`, `per`, `kismi`. Çerez `kargo-sutunlar`, `path=/shipping`. Sıralama `shippedAt desc, id desc`.
- Onay bekleyen KPI yalnız YONETICI'de `/approvals` bağlantısı (`requireAdmin`).
- Kart formu `data-sevk-karti` işaretini, "Kargola" düğmesini ve `kalan k/t` etiketini korur.
- Saf modüller `db.ts`'e dokunmaz; X-5 lint (`.add`, `Number()` yok). Kriterler A-3-3, D-3-2 (spec §6 metinleri).
- Commit/PR'da Co-Authored-By ve "Generated with" yok. PR: e2e → push → CI pass → code-review → işaret → merge.

## Review Focus

1. **Aynı sipariş iki kez seçilmiş (elle POST)** — bir kez işlenir → Task 2 `topluSecimCoz` testi.
2. **Toplu işlem sürerken başka kullanıcı aynı siparişi kısmi sevk etmiş** — o sipariş `SEVK_MIKTARI_ASILDI` ile düşer, öbürleri yazılır → Task 3 testi (kalan bayat).
3. **Bedelsiz satırlı sipariş toplu kargoda** — bedelsiz kalem de kalanıyla gider (onay bloğu yoksa) → Task 3 testi.
4. **`kismi` kargo bekleyen olmayan (KARGOLANDI) sipariş** — panel açılmaz → Task 4 testi.
5. **Gece yarısı İstanbul'da yazılmış sevkiyat** — doğru güne düşer, "Bugün kargolanan" = süzgeç → Task 4 testi.

---

## PR — `revize/kargo-ekrani`

### Task 1: Belgeler + `liste/metin.ts`

**Files:** Create `src/lib/liste/metin.ts`, `src/lib/liste/metin.test.ts`; Modify `src/lib/siparis-listesi/suzgec.ts` (varyant fonksiyonu ve testleri taşınır, import güncellenir), `src/lib/siparis-listesi/sorgu.ts`, `src/lib/siparis-listesi/suzgec.test.ts`, `docs/YOL_HARITASI.md` (Ü-23'ün altına Ü-24), `docs/KABUL_KRITERLERI.md` (A-3-3 → A-3-2'nin altına; D-3-2 → D-3-1'in altına; yer `Ü-24`, test dosyaları Task 3/4'te eklenir).

**Produces:** `export function metinVaryantlari(q: string): string[]` (`@/lib/liste/metin`).
- [ ] Testleri `metin.test.ts`'e taşı (aynı beklentiler) → `npx vitest run --project unit src/lib/liste src/lib/siparis-listesi` PASS → `npm run izlenebilirlik` → commit `docs(kargo): plan, Ü-24, kabul kriterleri (A-3-3, D-3-2); refactor: metinVaryantlari ortak modüle`.

### Task 2: Saf modüller — `kargo-listesi/suzgec.ts`, `sutunlar.ts`, `suzgec.test.ts`

**Produces:**
```ts
export type KargoSuzgeci = { baslangic: string | null; bitis: string | null; firma: string | null; durum: "KARGOLANDI" | "TESLIM_EDILDI" | null; q: string | null };
export const BOS_SUZGEC: KargoSuzgeci; export const FIRMASIZ = "yok"; export const TOPLU_SINIR = 50;
export function suzgecCoz(p: Parametreler): { suzgec: KargoSuzgeci; kismi: string | null };
export function kargoAdresi(s: KargoSuzgeci, ek?: { page?: number; per?: number; kismi?: string }): string; // sıra: baslangic, bitis, firma, durum, q, page, per, kismi
export function hizliSekmeler(bugun: string): { etiket: "Tümü" | "Bugün" | "Son 7 gün" | "Bu ay"; tarih: { baslangic: string | null; bitis: string | null } }[];
export function etkinSekme(...); export function sekmeAdresi(s: KargoSuzgeci, tarih): string;
export function etkinSuzgecler(s: KargoSuzgeci, firmaAdi: (id: string) => string | undefined): { anahtar: "tarih" | "firma" | "durum" | "q"; etiket: string; kaldirAdresi: string }[];
export function bosDurum(s: KargoSuzgeci): "hic-kayit" | "suzgecli";
export type TopluSecim = { siparisId: string; takip: string | null; irsaliye: string | null };
export function topluSecimCoz(f: { getAll(ad: string): unknown[]; get(ad: string): unknown }): { secimler: TopluSecim[] } | { hata: "SECIM_YOK" | "SINIR_ASILDI" };
// sutunlar.ts: type KargoSutunu = "siparis" | "firma" | "takip" | "irsaliye" | "adet"; SUTUNLAR; SUTUN_CEREZI = "kargo-sutunlar"; SUTUN_YOLU = "/shipping"
```
- Etiketler: "Tarih: …" (`aralikEtiketi`), "Firma: Ad" / "Firma: Firmasız", "Durum: Kargolandı" / "Durum: Teslim Edildi", "Ara: …". Tarih sekmeleri stok ekranının `hizliSekmeler`'iyle aynı (gün metinleri).
- [ ] Testler: gidiş-dönüş; ters gün; `firma=yok`; `durum=xyz` → null; `kismi` kimlik; sekme adresi öbür süzgeçleri korur; etiketler; bilinmeyen firma etiketsiz; `topluSecimCoz`: seçimsiz → `SECIM_YOK`; tekrar eden kimlik tek (RF 1); bozuk kimlik düşer; 101 seçim → `SINIR_ASILDI`; `takip_<id>="  TR1 "` → "TR1", boş → null; irsaliye 40 karakter → ilk 32.
- [ ] FAIL → implement → PASS → commit `feat(kargo): süzgeç, sütun ve toplu seçim modülleri`.

### Task 3: Sevk çekirdeği — `src/lib/sevk-et.ts`, `sevk-et.itest.ts`; `shipping/actions.ts` incelir

**Consumes:** `sevkiyatYaz`, `SevkiyatGirdisi` (`sevkiyat.ts`), `createAuditLog`/`AUDIT_ACTIONS`, `IsHatasi`, `kalemMiktarlari`, Task 2 `TopluSecim`.

**Produces:**
```ts
export type SevkSonucu =
  | { durum: "SEVK_EDILDI"; documentNo: string; tamamlandi: boolean }
  | { durum: "ONAYA_GONDERILDI"; bildirimler: Bildirim[] }
  | { durum: "HATA"; sonuc: IslemSonucu };
export async function siparisiSevkEt(g: SevkiyatGirdisi): Promise<SevkSonucu>; // kendi $transaction'ı; başarıda ORDER_STATUS_CHANGE denetim kaydı (bugünkü shipOrder gövdesi)
export type TopluSatirSonucu = { siparisId: string; documentNo: string | null; cari: string | null; sonuc: SevkSonucu };
export async function topluKargo(secimler: readonly TopluSecim[], carrierId: string | null, yapan: SevkiyatGirdisi["yapan"]): Promise<TopluSatirSonucu[]>;
```
- `topluKargo`: seçim sırasıyla; her sipariş için kalemler `kalemMiktarlari(k).kalan > 0` olanlar, `miktar = kalan`; sipariş yoksa `HATA(SIPARIS_DURUMU_UYGUN_DEGIL)`.
- `shipOrder` (`shipping/actions.ts`): `siparisiSevkEt` çağırır; `HATA` → `sonuc`; `ONAYA_GONDERILDI` → `onayaGonderildi(...)`; başarıda `tamamlandi ? "/shipping" : "/shipping?kismi=<id>"`'e `redirect`. Yeni `topluKargola(_prev, formData)` → `topluSecimCoz` → `topluKargo` → `{ satirlar } | { hata }` döner, `revalidatePath` (`/shipping`, `/orders`, `/dashboard`, `/stock`).
- [ ] Testler (`sevkiyat.itest.ts` kurulum kalıbı): `siparisiSevkEt` başarı → SVK + denetim kaydı; kalan aşımı → `HATA`, sevkiyat yok; A-3-3: üç sipariş (biri `BEDELSIZ_ONAYI` bloğu açık, biri bedelsiz satırlı ve onaylı — RF 3) toplu → ikisi `SEVK_EDILDI` (takip/irsaliye kendi satırlarında, firma ortak), bloklu `HATA(ONAY_BEKLIYOR)` ve hâlâ HAZIRLANIYOR; negatif stok (stok 0) → `HATA` sonucunda `ONAY_GEREKLI` durumu, sevkiyat yok; kalan bayat (RF 2: seçimden sonra aynı siparişe kısmi sevk) → o sipariş `HATA`, öbürü yazılır.
- [ ] FAIL → implement → `npm run test:integration -- src/lib/sevk-et.itest.ts src/lib/sevkiyat.itest.ts` PASS → kriter A-3-3 yer kolonu `sevk-et.itest.ts` → commit `feat(kargo): sevk çekirdeği ve toplu kargo (A-3-3)`.

### Task 4: Sorgular — `kargo-listesi/sorgu.ts`, `sorgu.itest.ts`

**Produces:**
```ts
export type BekleyenSatir = { id; documentNo; orderDate: Date; cari: { fullName: string; clinic: string | null }; satici: string | null; toplam: Decimal;
  kalemler: { id: string; urun: string; kod: string; adet: number; kalan: number }[]; kalanKalem: number; kalanAdet: number; adet: number; onay: "BEKLIYOR" | "RED" | undefined };
export async function kargoBekleyenler(): Promise<BekleyenSatir[]>; // stage ONAYLI, status HAZIRLANIYOR; orderDate asc, id asc
export type KargoKpileri = { bekleyen: number; bekleyenAdet: number; onayBekleyen: number; bugunKargolanan: number; teslimBekleyen: number };
export async function kargoKpileri(bugun: string, bekleyenler: readonly BekleyenSatir[]): Promise<KargoKpileri>;
export function sevkiyatKosulu(s: KargoSuzgeci): Prisma.ShipmentWhereInput;
export type SevkiyatSatiri = { id; documentNo; shippedAt: Date | null; cari: string; siparis: { id: string; documentNo: string }; firma: string | null; takipNo: string | null; takipLinki: string | null; irsaliyeNo: string | null; adet: number; durum: OrderStatus };
export async function sevkiyatListesi(s: KargoSuzgeci, sayfa: { skip: number; take: number }): Promise<{ satirlar: SevkiyatSatiri[]; toplam: number }>;
export async function firmaSecenekleri(): Promise<{ id: string; name: string; isActive: boolean }[]>;
export function kismiSecimi(bekleyenler: readonly BekleyenSatir[], kismi: string | null): BekleyenSatir | null;
```
- Metin: `OR` × `metinVaryantlari` × [documentNo, trackingNumber, externalDispatchNo, order.doctor.fullName], `mode: "insensitive"`. Tarih: `gunleriAraliga` (`siparis-listesi/sorgu.ts`) ile `shippedAt`.
- [ ] Testler: D-3-2: `bugunKargolanan` = `sevkiyatListesi({ baslangic: bugün, bitis: bugün }).toplam`, İstanbul gece yarısı kenarı (RF 5); `teslimBekleyen` = `siparisListesi({ durum: "KARGOLANDI" }).toplam`; firma / `yok` / durum / metin (takip no, SVK, cari) süzgeçleri; `kalanAdet` = `kalemMiktarlari` kalan toplamı, tamamen sevk edilmiş kalem sayılmaz; onay bloklu bekleyende `onay: "BEKLIYOR"` ve `onayBekleyen` = 1; `kismiSecimi` bekleyen değilse `null` (RF 4).
- [ ] FAIL → implement → PASS + lint/tsc → kriter D-3-2 yer kolonu → commit `feat(kargo): bekleyenler, KPI ve sevkiyat listesi sorguları (D-3-2)`.

### Task 5: Ekran — `shipping/page.tsx` yeniden; `KpiKartlari`, `BekleyenTablosu` (+ istemci `TopluKargoFormu`, `TumunuSec`), `KismiPanel`, `SuzgecCubugu`, `SevkiyatTablosu`, `sutunEylemi`, `loading.tsx`

- KPI spec §3.2 (birincil `ikincilMetrik="N adet kalan"`; Onay bekleyen `vurgu` > 0; YONETICI'de `/approvals`); bekleyen tablosu §3.3 (kutucuk `form` içi, onaylıda devre dışı; sonuç listesi `role="status"` başlık "Toplu kargo sonucu"); kısmi panel §3.4 (`YanPanel`, `data-sevk-karti`, `IslemFormu action={shipOrder.bind(null, id)}`); sevkiyat listesi §3.5. Bilinmeyen firma → `redirect`; sayfa dışı → son sayfa.
- [ ] `npm run typecheck && npm run lint && npm test` → commit `feat(kargo): KPI, toplu kargo tablosu, kısmi sevk paneli, sevkiyat listesi`.

### Task 6: E2E ve kapanış

- [ ] `e2e/helpers.ts`: `sevkKarti(page, metin)` → `/shipping`'te metni taşıyan satırın "Kısmi sevk" bağlantısı → `[data-sevk-karti]` döner. `sevkiyat`, `kabul-senaryosu`, `onay`, `iade`, `operasyon` spec'leri bunu kullanır.
- [ ] `e2e/admin/kargo.spec.ts`: toplu (iki sipariş, takip yaz, seç, firma, kargola → "Toplu kargo sonucu" iki satır "yazıldı", satırlar düşer, sevkiyat listesinde takip no); seçimsiz → "Kargolanacak sipariş seçin."; Bugün kargolanan kartı = satır; sütun gizle → yenile; `?page=999`; `?firma=<olmayan>` düşer; KPI iskeleti eşleşir.
- [ ] Tam paket `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="onaylıyorum" npx playwright test` yeşil. Belgeler: YOL_HARITASI Ü-24 ✅, PROJE_DURUMU, izlenebilirlik, DEVAM_PROMPTU. Commit → push → PR → CI pass → code-review → işaret → merge.
