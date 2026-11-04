# Tahsilatlar ekranı Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/collections`'ı KPI'lı, süzgeçli, toplam satırlı, yan panelli bir tahsilat ekranına çevirmek; yeni tahsilat formunu `/collections/new`'e taşımak; iptali panelde gerekçeli yapmak.

**Architecture:** Önceki modüllerin kalıbı: `src/lib/tahsilat-listesi/{suzgec.ts (saf), sutunlar.ts (saf), sorgu.ts}`; adres çubuğunda süzgeç, çerezde sütun tercihi, `?detay=` yan panel, `kpiGetir` kapsülü. Liste, toplam ve kartlar tek `tahsilatKosulu`'ndan sayar.

**Tech Stack:** Next.js 16 sunucu bileşenleri/eylemleri, Prisma 7, Vitest (unit/integration), Playwright.

**Spec:** `docs/superpowers/specs/2026-11-04-tahsilat-ekrani-design.md`

## Global Constraints

- Tahsilat tutarı daima *KDV dahil* (`BRUT`, Ü-3-1); para `Decimal`, `Number()`/`.add` yok (X-5 lint).
- Gün sınırı İstanbul günü (`yerelGunAraligi`, `gunleriAraliga` — `siparis-listesi/sorgu.ts`).
- Sayfa ve eylemler `requireStaff` (D-2-1); `yetki.test.ts` matrisi her eylemi listeler.
- Eylem sonucu `IslemSonucu` (X-4); eylem `@/lib/sozluk` içe aktarmaz.
- Bir dosyada en çok 4 `<KpiCard` (`tasarim.test.ts`).
- Metin araması `metinVaryantlari` (DB yerel ayarı ı'yı katlamaz).
- Commit mesajlarında Claude imzası/Co-Authored-By satırı yok.

## Review Focus

1. Ayın son günü 23:30 (İstanbul) tahsilatı: bu ayın kartında ve `bitis=<bugün>` süzgecinde birlikte olmalı — Task 2 itest gece yarısı sınırı.
2. Varsayılan aralıkta kart adresi aralığı yazmalı; aksi halde kart (bu ay) ile açtığı liste (tümü) ayrışır — Task 1 `kartAdresi` testi.
3. İptal edilen tahsilat kartlardan ve toplamdan düşmeli, `durum=IPTAL`'de görünmeli — Task 2 itest.
4. Yöntemin komisyon oranı sonradan değişince panel kayıttaki donmuş oranı göstermeli — Task 2 itest.
5. Sayfa dışı `page` ve bulunmayan `detay` — Task 3 e2e.

---

### Task 1: Saf süzgeç ve sütun modülleri

**Files:**
- Create: `src/lib/tahsilat-listesi/suzgec.ts`, `src/lib/tahsilat-listesi/sutunlar.ts`
- Test: `src/lib/tahsilat-listesi/suzgec.test.ts`

**Interfaces:**
- Produces:
  - `type TahsilatDurumu = "aktif" | "IPTAL" | "tumu"`; `type TahsilatTipi = "NAKIT" | "BANKA" | "POS"`
  - `type TahsilatSuzgeci = { baslangic: string | null; bitis: string | null; durum: TahsilatDurumu; tip: TahsilatTipi | null; q: string | null }`
  - `BOS_SUZGEC` (durum `"aktif"`), `TIP_ADI: Record<TahsilatTipi, string>` = `{ NAKIT: "Nakit", BANKA: "Banka", POS: "POS" }`
  - `suzgecCoz(p: Parametreler) → { suzgec, detay }` (ters tarih yer değiştirir; q ≤ 100, boş → null)
  - `tahsilatAdresi(s, { page?, per?, detay? }) → string` — anahtar sırası baslangic, bitis, durum (aktif yazılmaz), tip, q, page (>1), per, detay; taban `/collections`
  - `hizliSekmeler`/`etkinSekme` (ortak `tarih-sekmeleri` yeniden dışa aktarımı), `sekmeAdresi(s, tarih)`
  - `kpiAraligi(s, bugun) → { baslangic, bitis, varsayilan }` (Siparişler'deki kural)
  - `kartAdresi(tip: TahsilatTipi | null, a: { baslangic, bitis }) → string`
  - `etkinSuzgecler(s) → { anahtar, etiket, kaldirAdresi }[]`; `bosDurum(s) → "hic-kayit" | "suzgecli"`
  - `sutunlar.ts`: `type TahsilatSutunu = "yontem" | "referans" | "komisyon" | "kaydeden"`, `SUTUNLAR` (başlıklar Yöntem, Referans, Komisyon, Kaydeden), `SUTUN_CEREZI = "tahsilat-sutunlar"`, `SUTUN_YOLU = "/collections"`

- [ ] **Step 1: Failing test** `suzgec.test.ts`:
  - `suzgecCoz({}).suzgec` = `BOS_SUZGEC`; `tahsilatAdresi(BOS_SUZGEC, { page: 1 })` = `"/collections"`.
  - gidiş-dönüş: `{ baslangic: "2026-11-01", bitis: "2026-11-04", durum: "IPTAL", tip: "POS", q: "THS-1", detay: "p-1" }` → `tahsilatAdresi(s, { page: 2, per: 50, detay: "p-1" })` = `"/collections?baslangic=2026-11-01&bitis=2026-11-04&durum=IPTAL&tip=POS&q=THS-1&page=2&per=50&detay=p-1"`.
  - geçersiz `durum: "x"`, `tip: "KART"` yok sayılır; `bitis < baslangic` yer değiştirir.
  - `sekmeAdresi(S({ tip: "NAKIT" }), { baslangic: "2026-11-04", bitis: "2026-11-04" })` = `"/collections?baslangic=2026-11-04&bitis=2026-11-04&tip=NAKIT"`.
  - `kpiAraligi(BOS_SUZGEC, "2026-11-04")` = `{ baslangic: "2026-11-01", bitis: "2026-11-04", varsayilan: true }`; tarihli süzgeçte süzgecin aralığı, `varsayilan: false`.
  - `kartAdresi("POS", { baslangic: "2026-11-01", bitis: "2026-11-04" })` = `"/collections?baslangic=2026-11-01&bitis=2026-11-04&tip=POS"`; `kartAdresi(null, …)` tip yazmaz.
  - etiketler: `["Tarih: 01.11.2026 – 04.11.2026", "Durum: İptal edilen", "Yöntem: POS", "Ara: x"]`; `durum: "tumu"` → `"Durum: Tümü"`; `BOS_SUZGEC` → `[]`.
  - `bosDurum(BOS_SUZGEC)` = `"hic-kayit"`, `bosDurum(S({ tip: "POS" }))` = `"suzgecli"`.
- [ ] **Step 2:** `npx vitest run src/lib/tahsilat-listesi/suzgec.test.ts` → FAIL (modül yok).
- [ ] **Step 3:** İki modülü `onay-listesi`/`siparis-listesi` kalıbıyla yaz (`@/lib/liste/parametreler` yardımcıları).
- [ ] **Step 4:** Aynı komut → PASS.
- [ ] **Step 5:** Commit `feat(tahsilat): süzgeç ve sütun modülleri`.

### Task 2: Sorgu katmanı, gerekçeli iptal, kabul kriterleri

**Files:**
- Create: `src/lib/tahsilat-listesi/sorgu.ts`, `src/lib/tahsilat-listesi/sorgu.itest.ts`
- Modify: `src/app/(admin)/collections/actions.ts` (`cancelCollection`), `src/app/(admin)/collections/collections.itest.ts`, `docs/KABUL_KRITERLERI.md` (A-11-2, A-11-3 — spec §6 metni aynen; yer sütunu `tahsilat-listesi/sorgu.itest.ts` · `tahsilat-ekrani.spec.ts` / `collections.itest.ts`)

**Interfaces:**
- Consumes: Task 1 türleri; `gunleriAraliga` (`siparis-listesi/sorgu.ts`), `metinVaryantlari`, `hesaplaDoktorBakiye`.
- Produces:
  - `tahsilatKosulu(s: TahsilatSuzgeci) → Prisma.DoctorPaymentWhereInput` — durum (aktif → `AKTIF`), tarih `paidAt` aralığı, tip `paymentMethod.type`, q OR(documentNo, referenceNo, doctor.fullName) her varyant `contains` `insensitive`.
  - `type TahsilatSatiri = { id; documentNo; paidAt: Date; doktorId; doktor: string; yontem: string; tip: TahsilatTipi; referenceNo: string | null; amount: Decimal; commissionAmount: Decimal; kaydeden: string | null; status: "AKTIF" | "IPTAL" }`
  - `tahsilatListesi(s, { skip, take }) → { satirlar: TahsilatSatiri[]; toplam: number; ozet: { tutar: Decimal; adet: number } | null }` — `ozet` yalnız `durum === "aktif"`; sıralama `paidAt desc, id desc`; `kaydeden` `recordedBy` kimliklerinin toplu ad çözümü.
  - `type TahsilatKpileri = { toplam: Ozet; NAKIT: Ozet; BANKA: Ozet; POS: Ozet & { komisyon: Decimal } }`, `Ozet = { tutar: Decimal; adet: number }`
  - `tahsilatKpileri(a: { baslangic: string | null; bitis: string | null }) → TahsilatKpileri` — `tahsilatKosulu({ ...BOS_SUZGEC, ...a })` ile `groupBy paymentMethodId` (`_sum amount, commissionAmount`, `_count`), yöntem tipine katlanır.
  - `type TahsilatPaneli = TahsilatSatiri & { commissionRate: Decimal; note: string | null; createdAt: Date; bakiye: DoktorBakiye; iptal: { eden: string | null; zaman: Date; gerekce: string | null } | null }`; `tahsilatPaneli(id) → TahsilatPaneli | null`.

- [ ] **Step 1: Failing itest** `sorgu.itest.ts` (yerel yardımcı: doktor + üç yöntem + `tahsilat({ yontem, tutar, an, iptal? })` doğrudan `prisma.doctorPayment.create`):
  - **A-11-2 kart = süzgeç:** 01.11–04.11 aralığında NAKIT 100, BANKA 200, POS 300 (komisyon 7,50), iptal edilmiş NAKIT 999, aralık dışı (31.10 23:30 İstanbul = `2026-10-31T20:30:00Z`) BANKA 50 → `tahsilatKpileri({ "2026-11-01", "2026-11-04" })`: toplam 600/3, NAKIT 100/1, BANKA 200/1, POS 300/1 komisyon 7,50; her tip için `tahsilatListesi({ ...aralık, tip })` `ozet` kartla aynı ve `toplam` = adet.
  - **gece yarısı:** `2026-11-04T20:30:00Z` (04.11 23:30) `bitis: "2026-11-04"`'e girer; `2026-11-04T21:30:00Z` (05.11 00:30) girmez.
  - **iptal:** `durum: "IPTAL"` yalnız iptal edilmişi verir, `ozet` null; `tumu` ikisini.
  - **metin:** belge no, referans, cari adı (`"IŞIK"` araması `"Işık"` adlı cariyi bulur).
  - **sıralama:** `paidAt desc`.
  - **A-11-3 panel:** yöntem oranı `paymentMethod.update` ile değiştirildikten sonra `commissionRate`/`commissionAmount` kayıttaki; `bakiye` `hesaplaDoktorBakiye` ile aynı; iptalde `iptal.gerekce`, `iptal.eden`; bulunmayan → `null`.
  - `collections.itest.ts`: yeni test "gerekçesiz iptal GEREKCE_ZORUNLU döner, hiçbir şey yazılmaz" (`kural_kodu`, `alan: "reason"`, durum `AKTIF` kalır); gerekçesiz iptal eden mevcut testler (`fd.set("paymentId", …)` olanlar, `iptalFormu`) gerekçe alır.
- [ ] **Step 2:** `npx vitest run --project integration src/lib/tahsilat-listesi src/app/\(admin\)/collections` → FAIL.
- [ ] **Step 3:** `sorgu.ts`'i yaz; `cancelCollection`'da `reason` boşsa `engel("GEREKCE_ZORUNLU", {}, "reason")` (paymentId kontrolünden sonra). Kriterleri KABUL'e ekle.
- [ ] **Step 4:** Aynı komut → PASS; `npm run izlenebilirlik` hatasız.
- [ ] **Step 5:** Commit `feat(tahsilat): liste, KPI ve panel sorguları; iptal gerekçe ister`.

### Task 3: Ekran, yeni tahsilat sayfası, e2e

**Files:**
- Rewrite: `src/app/(admin)/collections/page.tsx`
- Create: `src/app/(admin)/collections/{KpiKartlari.tsx, SuzgecCubugu.tsx, TahsilatTablosu.tsx, TahsilatPaneli.tsx, IptalFormu.tsx, sutunEylemi.ts, loading.tsx}`, `src/app/(admin)/collections/new/page.tsx`
- Delete: `src/app/(admin)/collections/CancelCollection.tsx` (yerine `IptalFormu`)
- Modify: `CollectionForm.tsx` (not metni), `src/lib/yetki.test.ts` (`(admin)/collections/sutunEylemi.ts#sutunlariKaydet: "requireStaff"`), `e2e/admin/collections.spec.ts`
- Create: `e2e/admin/tahsilat-ekrani.spec.ts`

**Interfaces:**
- Consumes: Task 1 ve Task 2'nin bütün dışa aktarımları.
- Ekran ayrıntıları spec §3: KPI dört kart (`aria-label="Tahsilat sayıları"`, POS ikincil metrik "Komisyon ₺X", diğerleri "N tahsilat"), süzgeç formu `aria-label="Tahsilat süzgeci"` (tarih, durum, tip, ara; `per` gizli), tablo `aria-label="Tahsilatlar"` + `tfoot` "Toplam · N tahsilat", "İncele" bağlantısı `data-kayit`, panel bölgeleri "Tahsilat", "Komisyon", "Cari", "İptal"; iptal formu `data-payment-id`, alan "Gerekçe", düğme "Tahsilatı iptal et", `window.confirm` metni bugünkü; başlıkta `LinkButton href="/collections/new" ikon="yeni"` "Yeni Tahsilat". Yeni sayfa: "← Tahsilatlar" bağlantısı, `CollectionForm`, not "Tahsilat siparişle eşleştirilmez; carinin bakiyesinden düşer.".
- `loading.tsx` KPI iskeleti kart etiketleri ve alt notlarıyla birebir (`kpiIskeletiEslesir`).

- [ ] **Step 1: Failing e2e** `tahsilat-ekrani.spec.ts`:
  - POS kartı: kartın tutarını oku → tıkla → URL `tip=POS` ve bu ayın aralığı → `per=100`'de tablo altı toplamı kart tutarına eşit.
  - Panel: yeni POS tahsilatı (SQL ile yöntem ve kayıt) → `?q=<belge>` → "İncele" → "Komisyon" bölgesi oranı gösterir; gerekçe boşken iptal → "Gerekçe zorunludur."; gerekçeyle iptal → `?durum=IPTAL&q=<belge>` satırı, panelde gerekçe.
  - Sütun gizle (Komisyon), sayfa dışı `page=999` son sayfaya, `detay=yok` panel açmaz, `kpiIskeletiEslesir(page, "/collections")`.
  - `collections.spec.ts`: kayıt `/collections/new`'den; iptal panelden gerekçeyle (DB'den `IPTAL` ve `cancelReason`).
- [ ] **Step 2:** `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="onaylıyorum" npx playwright test e2e/admin/tahsilat-ekrani.spec.ts e2e/admin/collections.spec.ts --reporter=line` → FAIL.
- [ ] **Step 3:** Bileşenleri `approvals`/`orders` kalıbıyla yaz; `page.tsx` `requireStaff`, `Promise.all` (liste, `kpiGetir(() => tahsilatKpileri(kpiAraligi(...)), { yol: "/collections", … })`, panel), sayfa dışı yönlendirme.
- [ ] **Step 4:** `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run test:integration`, tam e2e → hepsi yeşil.
- [ ] **Step 5:** Commit `feat(tahsilat): KPI, süzgeç, toplam satırı, tahsilat paneli, yeni tahsilat sayfası`.

### Task 4: Belgeler

**Files:** `docs/YOL_HARITASI.md` (Ü-26 ✅ satırı, Ü-25 biçiminde), `docs/PROJE_DURUMU.md` (Tahsilatlar girdisi), `docs/TRACEABILITY.md` (`npm run izlenebilirlik`).

- [ ] **Step 1:** Satırları yaz; `npm run izlenebilirlik`; `npm test` (izlenebilirlik testleri) → PASS.
- [ ] **Step 2:** Commit `docs(tahsilat): Ü-26 yol haritası, durum ve izlenebilirlik`.
