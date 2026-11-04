# Denetim Kaydı ekranı Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Denetim kaydına KPI kartları, tarih sekmeleri, açılır Filtrele paneli, etkin süzgeç etiketleri, sütun seçici ve iskelet eklemek; liste, imleç, detay paneli değişmez.

**Architecture:** `src/lib/denetim/suzgec.ts`'e saf adres/etiket yardımcıları, yeni `denetim/sutunlar.ts`; `sorgu.ts`'te `kosul` `denetimKosulu` olarak dışa açılır ve `denetimKpileri` kartları aynı koşulla sayar.

**Tech Stack:** Next.js 16, Prisma 7, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-04-denetim-ekrani-design.md`

## Global Constraints

- `requireAdmin`; denetim kaydı salt okunur (X-18 §(1)); `≤ 4 <KpiCard` dosya başına; Claude imzası yok.
- Süzgeç formu `aria-label="Denetim kaydı süzgeci"` ve alan etiketleri (Başlangıç, Bitiş, Kullanıcı, Modül, İşlem türü, Olay) korunur (mevcut e2e).

## Review Focus

1. Tarih sekmesi ve etiket kaldırma imleci düşürmeli (eski imleç başka süzgeçte anlamsız) — Task 1 test.
2. Kart sayısı = açtığı süzgecin satırı, İstanbul gece yarısı sınırında — Task 2 itest.
3. Adı bilinmeyen kullanıcı kimliği etiketsiz — Task 1 test.

---

### Task 1: Saf yardımcılar
`suzgec.ts`: `kartAdresleri(bugun) → { bugun, yediGun, basarisiz, silme }` (silme `tur=SILME`, başarısız `olay=AUTH_LOGIN_FAILURE`, ikisi de bugünün aralığı); `tarihSekmesiAdresi(s, tarih)`; `etkinSuzgecler(s, kullaniciAdi)` — "Tarih: …", "Kullanıcı: Ad" / "Sistem / anonim", "Modül: …", "Tür: …", "Olay: …"; `bosDurum(s)`. Kaldırma adresleri imleçsiz. `sutunlar.ts`: `DenetimSutunu = "modul" | "ozet"`, başlıklar "Modül / varlık", "Özet", çerez `denetim-sutunlar`, yol `/audit-logs`. Test `suzgec.test.ts`'e eklenir. → RED → GREEN → commit.

### Task 2: KPI sorgusu ve kriter
`denetimKosulu` (dışa açılan `kosul`), `denetimKpileri(bugun) → { bugun; yediGun; basarisiz; silme }` dört `count`, her biri `suzgecCoz`'un kart adresinden çözdüğü süzgecin koşuluyla. itest: her kart = `denetimListesi(süzgeç, null, 1000).satirlar.length`; dünün 23:30'u (İstanbul) bugüne girmez. KABUL X-18-8. → RED → GREEN → commit.

### Task 3: Ekran, iskelet, e2e
`page.tsx`: başlık, `KpiKartlari` (`aria-label="Denetim sayıları"`), çubuk (tarih `HizliSekmeler`, `AcilirPanel` içinde bugünkü `SuzgecFormu` alanları + Uygula/Temizle, `SutunSecici`), `EtkinSuzgecler`, tablo (`aria-label="Denetim kayıtları"`, gizli sütun çizilmez, `BosDurum`), imleç sayfalama ve detay paneli bugünkü gibi. `sutunEylemi.ts` (`requireAdmin`), `loading.tsx`. e2e `denetim-ekrani.spec.ts`: başarısız giriş kartı → URL `olay=AUTH_LOGIN_FAILURE` ve etiket; "Bugün" sekmesi; sütun gizle (Özet); `kpiIskeletiEslesir(page, "/audit-logs")`. Tam takım → commit.

### Task 4: Belgeler
YOL_HARITASI Ü-28, PROJE_DURUMU, izlenebilirlik → commit.
