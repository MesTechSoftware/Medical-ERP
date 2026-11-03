# Siparişler Ekranı Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/orders` ekranına aralık bazlı 6 KPI kartı (teklif hariç), durum + Teklif sekmeleri, Filtrele
paneli (tarih, satıcı, metin), sütun seçicili ve sayfalı tablo (belge no, sevk, onay çipi) ve yan panel
(kalemler, kalan, sevkiyat, iade, tutar) eklemek; dashboard dağılım bağlantısını aynı süzgece bağlamak.

**Architecture:** Ü-19…Ü-22 kalıbı. `src/lib/siparis-listesi/` saf süzgeç/sütun modülleri + `sorgu.ts`'te tek
`where` üreticisi (`siparisKosulu`). KPI ikinci sayım yolu açmaz: `siparisDagilimi` (`dashboard.ts`) sarılır.
Kalem miktarları `siparis.ts`'teki saf `kalemMiktarlari`'ndan.

**Tech Stack:** Next.js 16 · Prisma 7 · Tailwind · Vitest · Playwright.

**Spec:** `docs/superpowers/specs/2026-11-03-siparisler-ekrani-design.md`

## Global Constraints

- Yeni karar/ADR yok. `/orders/[id]`, `/orders/new`, `orders/actions.ts`, `/shipping`, `/my-orders` ve `sevkiyatYaz` değişmez.
- KPI = `stage: "ONAYLI"` + `orderDate ∈ [bas, bit)`, durum başına; `siparisDagilimi(aralik)` tek yol (A-5-8).
- Adres: `durum` (`BEKLIYOR`|`HAZIRLANIYOR`|`KARGOLANDI`|`TESLIM_EDILDI`|`IPTAL`|`TEKLIF`), `status` takma adı (yalnız `durum` yoksa), `baslangic`, `bitis` (`YYYY-AA-GG`), `satici` (kimlik | `yok`), `q` (kırpılmış, ≤ 100 karakter), `page`, `per`, `detay`.
- `durum=<status>` → `stage: ONAYLI, status`; `durum=TEKLIF` → `stage: TEKLIF`. Tümü iki aşamayı listeler.
- Gün sınırı İstanbul günü: `yerelGunAraligi` / `yerelGunMetni` / `TUM_ZAMANLAR` (`zaman.ts`), etiket `aralikEtiketi` (`liste/parametreler.ts`).
- Çerez `siparis-sutunlar`, `path=/orders`; varsayılan gizli sütun yok. Sıralama `orderDate desc, id desc`.
- Saf modüller `db.ts`'e dokunmaz. X-5 lint: `.add` yok, `Number()` yok; tutar `siparisToplami`'ndan.
- Kriterler A-5-8, A-3-2 (spec §6 metinleri birebir).
- Commit/PR'da Co-Authored-By ve "Generated with" yok. PR: e2e → push → CI pass → code-review → işaret (ana checkout'ta `.superpowers/inceleme/<sha>`) → merge.

## Review Focus

1. **Ayın 1'i gece yarısı (İstanbul) açılan sipariş** — bu ayın kartına girer, önceki ayınkine girmez → Task 3 testi.
2. **Teklif aşamasında `status = BEKLIYOR` sipariş** — Bekliyor kartında ve `durum=BEKLIYOR` listesinde yok, Teklif sekmesinde var → Task 3 testi.
3. **Biçimi doğru ama olmayan `satici` kimliği** — sayfa adresten düşürür (boş liste + görünmez süzgeç olmaz) → Task 4 (sayfa) + e2e.
4. **Sevk edildikten sonra iade edilen kalem** — kalan değişmez, iade ayrı sütunda → Task 1 ve Task 3 testleri.
5. **`?status=IPTAL&durum=BEKLIYOR`** — `durum` kazanır; bozuk `status` yok sayılır → Task 2 testi.

---

## PR — `revize/siparisler-ekrani`

### Task 1: Belgeler + `kalemMiktarlari`

**Files:** Modify `src/lib/siparis.ts`, `src/lib/siparis.test.ts` (yoksa Create), `docs/YOL_HARITASI.md` (Ü-22'nin altına Ü-23 satırı, Ü-22 biçiminde), `docs/KABUL_KRITERLERI.md` (A-5-8 → A-5-7'nin altına; A-3-2 → A-3-1'in altına; yer kolonu `Ü-23 · siparis-listesi/sorgu.itest.ts` / `Ü-23 · siparis.test.ts · siparis-listesi/sorgu.itest.ts`).

**Produces:**
```ts
export function kalemMiktarlari(k: {
  quantity: number;
  shipmentItems: readonly { quantity: number }[];
  returnItems: readonly { quantity: number }[];
}): { sevk: number; iade: number; kalan: number };
```
- [ ] Test (`siparis.test.ts`): sevk yok → `{0,0,5}`; kısmi `[2]` → `{2,0,3}`; tam `[2,3]` → `{5,0,0}`; tam + iade `[1]` → `{5,1,0}` (kalan değişmez).
- [ ] FAIL → implement → `npx vitest run --project unit src/lib/siparis.test.ts` PASS → `npm run izlenebilirlik` → commit `docs(siparisler): plan, Ü-23 ve kabul kriterleri (A-5-8, A-3-2); feat: kalemMiktarlari`.

### Task 2: Saf modüller — `siparis-listesi/suzgec.ts`, `sutunlar.ts`, `suzgec.test.ts`

**Produces:**
```ts
export type SiparisDurumu = OrderStatus | "TEKLIF";
export type SiparisSuzgeci = { durum: SiparisDurumu | null; baslangic: string | null; bitis: string | null; satici: string | null; q: string | null };
export const BOS_SUZGEC: SiparisSuzgeci;
export const SATICISIZ = "yok";
export function suzgecCoz(p: Parametreler): { suzgec: SiparisSuzgeci; detay: string | null };
export function siparisAdresi(s: SiparisSuzgeci, ek?: { page?: number; per?: number; detay?: string }): string; // anahtar sırası: durum, baslangic, bitis, satici, q, page, per, detay
export function hizliSekmeler(s: SiparisSuzgeci): readonly { etiket: string; adres: string; etkin: boolean }[]; // Tümü, Bekliyor, Hazırlanıyor, Kargolandı, Teslim edildi, İptal, Teklif
export function kpiAraligi(s: SiparisSuzgeci, bugun: string): { baslangic: string | null; bitis: string | null; varsayilan: boolean };
export function kartAdresi(durum: OrderStatus, a: { baslangic: string | null; bitis: string | null }): string;
export function etkinSuzgecler(s: SiparisSuzgeci, saticiAdi: (id: string) => string | undefined): { anahtar: "durum" | "tarih" | "satici" | "q"; etiket: string; kaldirAdresi: string }[];
export function bosDurum(s: SiparisSuzgeci): "hic-kayit" | "suzgecli";
// sutunlar.ts: type SiparisSutunu = "belgeNo" | "klinik" | "satici" | "tutar" | "sevk"; SUTUNLAR; SUTUN_CEREZI = "siparis-sutunlar"; SUTUN_YOLU = "/orders"
```
- [ ] Test: gidiş-dönüş (`siparisAdresi(suzgecCoz(p).suzgec)`); `status=KARGOLANDI` → `durum: "KARGOLANDI"`; `status=IPTAL&durum=BEKLIYOR` → `BEKLIYOR`; `status=xyz` → `null`; `baslangic=2026-10-15&bitis=2026-10-01` → yer değişir; `2026-02-30` → `null`; `q="  SIP-1  "` → `"SIP-1"`, 101 karakter → ilk 100, boşluk → `null`; `satici=yok` → `"yok"`; sekme adresi `durum` dışındaki süzgeçleri korur ve `page` düşer; `kpiAraligi(BOS, "2026-11-03")` → `{ "2026-11-01", "2026-11-03", varsayilan: true }`; tarih süzgeci varsa onu verir, `varsayilan: false`; `kartAdresi("BEKLIYOR", {…})` → `/orders?durum=BEKLIYOR&baslangic=2026-11-01&bitis=2026-11-03`; etiketler "Durum: Teklif", "Tarih: 01.10.2026 – 15.10.2026", "Satıcı: Satıcısız (bayi)", "Ara: SIP-1"; bilinmeyen satıcı etiketi çıkmaz; `bosDurum`.
- [ ] FAIL → implement → PASS → commit `feat(siparisler): süzgeç ve sütun modülleri`.

### Task 3: Sorgular — `siparis-listesi/sorgu.ts`, `sorgu.itest.ts`

**Consumes:** Task 1 `kalemMiktarlari`, Task 2 `SiparisSuzgeci`, `siparisDagilimi` (`dashboard.ts`), `belgeOnayDurumlari` (`onay-blogu.ts`), `takipLinki` (`kargo.ts`), `siparisToplami` (`siparis.ts`).

**Produces:**
```ts
export function siparisKosulu(s: SiparisSuzgeci): Prisma.OrderWhereInput;
export function gunleriAraliga(a: { baslangic: string | null; bitis: string | null }): Aralik; // açık uç TUM_ZAMANLAR
export type SiparisSatiri = { id: string; documentNo: string; orderDate: Date; stage: OrderStage; status: OrderStatus;
  cari: { id: string; fullName: string; clinic: string | null }; satici: string | null; toplam: Decimal;
  sevk: number; adet: number; onay: "BEKLIYOR" | "RED" | undefined };
export async function siparisListesi(s: SiparisSuzgeci, sayfa: { skip: number; take: number }): Promise<{ satirlar: SiparisSatiri[]; toplam: number }>;
export type SiparisKpileri = Record<OrderStatus, number> & { toplam: number };
export async function siparisKpileri(aralik: Aralik): Promise<SiparisKpileri>;
export type SiparisPaneli = { siparis: SiparisSatiri & { paymentTermDays: number };
  kalemler: { id: string; urun: string; kod: string; adet: number; sevk: number; kalan: number; iade: number; birimFiyat: Decimal; bedelsiz: boolean }[];
  tutar: BelgeTutari;
  sevkiyatlar: { id: string; documentNo: string; shippedOn: Date | null; firma: string | null; takipNo: string | null; takipLinki: string | null; irsaliyeNo: string | null; adet: number }[];
  iadeler: { id: string; documentNo: string; createdAt: Date; adet: number }[] };
export async function siparisPaneli(id: string): Promise<SiparisPaneli | null>;
export async function saticiSecenekleri(): Promise<{ id: string; name: string; isActive: boolean }[]>; // role SATICI, ada göre
```
- Metin: `OR [documentNo contains, doctor.fullName contains, doctor.clinic contains]`, `mode: "insensitive"`. Satır tutarı ve sevk/adet sayfa satırlarından; onay tek `belgeOnayDurumlari("SIP", ids)`.
- [ ] Testler (`kullanici-listesi/sorgu.itest.ts` kalıbı): her durum için `siparisKpileri(a)[d]` = `siparisListesi({durum:d, aralık})`.toplam = `siparisDagilimi(a)[d]`; `toplam` = beşinin toplamı; teklif (BEKLIYOR) kartta yok, `durum=TEKLIF`'te var, Tümü'de var (Review Focus 2); ayın 1'i 00:00 İstanbul siparişi bu ayda, 31.10 23:59 İstanbul eski ayda (RF 1); `satici`/`q` kartı değiştirmez; `satici=yok` yalnız satıcısız; `q` belge no / cari / klinik (küçük harf); aynı `orderDate`'te sayfalama kararlı (`id desc`); panel: kısmi sevk + iade → kalan = sipariş − sevk, iade ayrı (RF 4), `tutar` = `siparisToplami`, takip linki şablondan, irsaliye no, bedelsiz satır; bulunmayan kimlik → `null`.
- [ ] FAIL → implement → `npm run test:integration -- src/lib/siparis-listesi` PASS + `npm run lint && npm run typecheck` → commit `feat(siparisler): liste sorguları, KPI ve yan panel verisi (A-5-8, A-3-2)`.

### Task 4: Ekran — `orders/page.tsx` yeniden; `KpiKartlari`, `SuzgecCubugu`, `SiparisTablosu`, `SiparisPaneli`, `sutunEylemi`, `loading.tsx`; dashboard bağlantısı

**Consumes:** Task 2, Task 3. Desen: `users/` ve `stock/` (Filtrele paneli `SuzgecFormu` + `AcilirPanel`, gizli `durum` ve `per` alanı).
- `page.tsx`: `requireStaff`; `bugun = yerelGunMetni(bugun())`; `kpiAraligi` → `kpiGetir(() => siparisKpileri(gunleriAraliga(a)))`; biçimi doğru ama `saticiSecenekleri`'nde olmayan `satici` → `redirect` (süzgeçsiz); sayfa dışı → son sayfa (`detay` korunur); sayfalama `per`'i korur.
- `KpiKartlari`: 6 kart, Toplam bağlantısız + `ikincilMetrik="teklif hariç"`; beşi `kartAdresi`; `donemNotu` = `varsayilan ? "Bu ay" : aralikEtiketi(…)`; `karsilastirma` yok; hata → `hataReferansi`.
- `SiparisTablosu`: spec §3.4 sütunları; Cari → `siparisAdresi(s, { ...yer, detay: id })`; Teklif çipi + `OnayEtiketi`; Sevk "—" / "3 / 5"; `BosDurum` (`bosDurum`, "Süzgeçleri temizle" → `/orders`).
- `SiparisPaneli`: `YanPanel`, spec §3.5 bölümleri, Tam detay.
- `loading.tsx`: `users/loading.tsx` gibi; `new` ve `[id]` için genel iskelet re-export'u (bugün `orders/loading.tsx` yok — alt sayfalar liste iskeletini göstermesin, Ü-21 dersi).
- `dashboard/page.tsx:190`: `href: siparisAdresi({ ...BOS_SUZGEC, durum: s, baslangic: yerelGunMetni(r.simdi.baslangic), bitis: yerelGunMetni(new Date(r.simdi.bitis.getTime() - 1)) })`; `grafik.test.ts:105` beklentisi değişmez (bileşen testi kendi `href`'ini verir — kontrol et).
- [ ] `npm run typecheck && npm run lint && npm test` → commit `feat(siparisler): KPI, sekmeler, Filtrele, tablo, sütun seçici, yan panel; dashboard dağılımı süzgece bağlanır`.

### Task 5: E2E ve kapanış

- [ ] `e2e/admin/siparisler.spec.ts`: Bekliyor kartı sayısı = tıklanınca satır sayısı; Teklif sekmesi; Filtrele (tarih + satıcı) → etiketler, × ile kaldırma; panel → kalem tablosu + sevkiyat + Toplam tutarı = detay sayfasındaki toplam; sütun gizle (Satıcı) → yenile → gizli; `?page=999` → son sayfa; `?status=IPTAL` → İptal sekmesi etkin; `?satici=<olmayan-cuid>` → adresten düşer; dashboard "Sipariş durumları" dilimi → aynı sayı.
- [ ] Mevcut e2e seçicileri (`siparis-toplam`, `sevkiyat`, `iade`, `onay`, `kabul-senaryosu`, `mobil/tablo`, `tasarim`, `operasyon`): `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="…" npx playwright test` tam paket yeşil (3000'deki dev sunucusu durdurulur).
- [ ] Belgeler: YOL_HARITASI Ü-23 ✅, PROJE_DURUMU arayüz bölümü (Siparişler), `npm run izlenebilirlik`, DEVAM_PROMPTU (gitignored). Commit `test(siparisler): e2e ve belgelerin kapanışı` → push → PR → CI pass → code-review → işaret → merge.
