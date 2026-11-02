# Kullanıcılar Ekranı Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/users` ekranına KPI kartları, Tümü/Aktif/Pasif/Satıcılar/Portföysüz sekmeleri, sütun seçicili ve
sayfalı tablo (portföy = aktif cari, son etkinlik, geçici parola çipi) ve yan panel eklemek; OPERASYON
kapsamını (yalnız satıcılar) liste, KPI ve panelde tek koşuldan uygulamak.

**Architecture:** Ü-19/Ü-21 kalıbı. `src/lib/kullanici-listesi/` saf süzgeç/sütun modülleri + `sorgu.ts`'te tek
`where` üreticisi (`kullaniciKosulu(suzgec, gorenRol)`); kapsam koşulu süzgeçle birleşir.

**Tech Stack:** Next.js 16 · Prisma 7 · Tailwind · Vitest · Playwright.

**Spec:** `docs/superpowers/specs/2026-11-02-kullanicilar-ekrani-design.md`

## Global Constraints

- Yeni karar/ADR yok. Formlar ve `users/actions.ts` değişmez; `/users/[id]` değişmez.
- OPERASYON kapsamı: `role: "SATICI"`; YONETICI: koşulsuz (D-2). Prim oranı ve son işlemler yalnız YONETICI.
- Portföy = `ownedDoctors` içinden `status: "AKTIF"` cariler (X-17-6).
- Süre kuralı `oturum.ts`'in `suresiDolduMu` + `sureAyari()`; ikinci kez yazılmaz. Zaman `simdi()` (`zaman.ts`).
- Saf modüller `db.ts`'e dokunmaz. X-5 lint: `.add` yok, `Number()` yok.
- Adres: `durum` (`aktif`|`pasif`), `rol` (`YONETICI`|`OPERASYON`|`SATICI`), `portfoy` (`yok`), `parola` (`gecici`), `page`, `per`, `detay`. Çerez `kullanici-sutunlar`, `path=/users`.
- Kriterler X-17-6, D-2-3 (spec §6 metinleri).
- Commit/PR'da Co-Authored-By yok. Her PR: CI pass → code-review → işaret (ana checkout'ta `.superpowers/inceleme/<sha>`) → merge.

## Review Focus

1. **Yalnız pasif carisi olan aktif satıcı** — portföysüz sayılır; pasif satıcı sayılmaz → Task 3 testi.
2. **OPERASYON'un `?rol=YONETICI` / yönetici `detay` kimliği** — yok sayılır / panel açılmaz → Task 2 ve 3 testleri.
3. **Hiç oturumu olmayan kullanıcı** — "Hiç giriş yapmadı", çökme yok → Task 3 testi.
4. **`portfoy=yok` ile `durum=pasif` birlikte** — portföy önceliklidir (adres tek anlam) → Task 2 testi.
5. **Süresi dolmuş ama iptal edilmemiş oturum** — açık sayılmaz → Task 3 testi.

---

## PR D1 — `revize/kullanicilar-d1-veri`

### Task 1: Belgeler
- [ ] Spec + plan `docs/superpowers/` altına; YOL_HARITASI Ü-22 satırı; KABUL X-17-6 (X-17-5'in altı), D-2-3 (D-2-2'nin altı), yer `Ü-22 D1`; `npm run izlenebilirlik && npm test`. Commit `docs(kullanicilar-d1): spec, plan, Ü-22 ve kabul kriterleri (X-17-6, D-2-3)`.

### Task 2: Saf modüller — `kullanici-listesi/suzgec.ts`, `sutunlar.ts`, `suzgec.test.ts`
**Produces:**
```ts
export type GorenRol = "YONETICI" | "OPERASYON";
export type KullaniciSuzgeci = { durum: "aktif" | "pasif" | null; rol: Role | null; portfoy: "yok" | null; parola: "gecici" | null };
export const BOS_SUZGEC: KullaniciSuzgeci;
export function suzgecCoz(p: Parametreler, gorenRol: GorenRol): { suzgec: KullaniciSuzgeci; detay: string | null };
export function kullaniciAdresi(s: KullaniciSuzgeci, ek?: { page?: number; per?: number; detay?: string }): string;
export function hizliSekmeler(gorenRol: GorenRol): readonly { etiket: string; suzgec: KullaniciSuzgeci }[];
export function ayniSuzgec(a: KullaniciSuzgeci, b: KullaniciSuzgeci): boolean;
export function etkinSuzgecler(s: KullaniciSuzgeci): { anahtar: keyof KullaniciSuzgeci; etiket: string; kaldirAdresi: string }[];
export function bosDurum(s: KullaniciSuzgeci): "hic-kayit" | "suzgecli";
// sutunlar.ts: type KullaniciSutunu = "rol" | "iletisim" | "portfoy" | "sonEtkinlik" | "durum"; SUTUN_CEREZI = "kullanici-sutunlar"; SUTUN_YOLU = "/users"
```
- [ ] Test: gidiş-dönüş; `rol=YONETICI` OPERASYON'da `null`; `portfoy=yok&durum=pasif` → `{ portfoy: "yok", durum: null }`; sekmeler YONETICI 5 (Tümü, Aktif, Pasif, Satıcılar, Portföysüz), OPERASYON 4; etiketler "Durum: Aktif", "Rol: Satıcı", "Portföy: Yok", "Parola: Geçici". → FAIL → implement → PASS → commit.

### Task 3: Sorgular — `kullanici-listesi/sorgu.ts`, `sorgu.itest.ts`
**Produces:**
```ts
export function kullaniciKosulu(s: KullaniciSuzgeci, gorenRol: GorenRol): Prisma.UserWhereInput;
export type KullaniciSatiri = { id; name; email; phone: string | null; role: Role; isActive: boolean; geciciParola: boolean; portfoy: number | null; sonEtkinlik: Date | null };
export async function kullaniciListesi(s, gorenRol, sayfa: { skip: number; take: number }): Promise<{ satirlar: KullaniciSatiri[]; toplam: number }>;
export type KullaniciKpileri = { aktifKullanici: number; aktifSatici: number; portfoysuz: number; ilkGirisBekleyen: number };
export async function kullaniciKpileri(gorenRol: GorenRol): Promise<KullaniciKpileri>;
export type KullaniciPaneli = { kullanici: KullaniciSatiri & { createdAt: Date; primOrani: string | null }; acikOturum: number; cariler: { id; fullName }[]; siparisler: { id; documentNo; orderDate; status }[]; islemler: { id; createdAt; actionType; ozet: string }[] | null };
export async function kullaniciPaneli(id: string, gorenRol: GorenRol, simdi?: Date): Promise<KullaniciPaneli | null>;
```
- [ ] Testler (spec §6 entegrasyon satırı + Review Focus 1, 2, 3, 5): portföysüz = kart = `portfoy=yok` toplamı; ilk girişi bekleyen = `durum=aktif&parola=gecici` toplamı; son etkinlik en büyük `lastSeenAt`; OPERASYON listesinde yalnız satıcı, KPI aynı, yönetici paneli `null`, satıcı panelinde `primOrani` ve `islemler` `null`; açık oturum (iptal ve süresi dolmuş hariç). → implement → PASS + lint/tsc → commit; kriter yer kolonu; PR D1.

## PR D2 — `revize/kullanicilar-d2-ekran`

### Task 4: Sayfa — `users/page.tsx` yeniden; `KpiKartlari`, `SuzgecCubugu`, `KullaniciTablosu`, `KullaniciPaneli`, `sutunEylemi` (`requireStaff`), `loading.tsx` (+ `new`, `[id]` için genel iskelet re-export'u)
- KPI/sekme/tablo/panel spec §3.2–3.5; sayfa dışı `page` yönlendirmesi; tsc + lint → commit.

### Task 5: E2E ve kapanış
- [ ] `e2e/admin/kullanicilar.spec.ts` (Portföysüz kartı = satır; panel özet + portföy/boş portföy metni; sütun gizle → yenile; `?page=999`); `operasyon.spec.ts` (kart ve sekme yok, panelde "Prim oranı" ve "Son işlemler" yok); mevcut `users`/`seller-deactivation` seçicileri; belgeler; commit; PR D2.
