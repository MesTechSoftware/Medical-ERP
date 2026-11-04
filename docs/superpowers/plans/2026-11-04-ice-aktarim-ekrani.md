# İçe Aktarım ekranı Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/imports`'u KPI'lı, süzgeçli, sayfalı parti listesi ve parti paneline çevirmek; formu `/imports/new`'e taşımak; geri almayı panelden gerekçeyle yapmak.

**Architecture:** `src/lib/ice-aktarim-listesi/{suzgec.ts, sutunlar.ts (saf), sorgu.ts}`; geri alınabilir türler `TANIMLAR`'ın `geriAl` taşıyanlarından (tek kaynak). Eylemler (`iceAktar`, `partiyiGeriAl`) değişmez.

**Tech Stack:** Next.js 16, Prisma 7, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-04-ice-aktarim-ekrani-design.md`

## Global Constraints

- `requireAdmin`; satır `data-parti` taşır; form etiketleri ("Veri türü", "Dosya (.xlsx)", "Doğrula ve önizle", "Yaz (N kayıt)") değişmez. Claude imzası yok.

## Review Focus

1. Açılış türü partisi "Geri alınabilir"e girmemeli — Task 2 itest.
2. Geri alınmış parti "Yazıldı" sekmesinde görünmemeli — Task 2 itest.
3. Panelde türü geri alınmayan parti için form yok, açıklama var — Task 3 e2e.

---

### Task 1: Saf modüller — `PartiSuzgeci = { durum: "tumu"|"yazildi"|"geri-alinabilir"|"geri-alindi"; tur; baslangic; bitis; q }`, `suzgecCoz`, `partiAdresi`, `durumSekmeleri` (Tümü · Yazıldı · Geri alındı), `kartAdresleri(bugun)`, `etkinSuzgecler`, `bosDurum`; `sutunlar.ts` (dosya, yapan). Test → RED → GREEN → commit.

### Task 2: `partiKosulu(s, geriAlinabilirTurler)`, `partiListesi`, `partiKpileri(bugun)`, `partiPaneli(id)`, `GERI_ALINABILIR` (TANIMLAR'dan). itest: kart = süzgeç; açılış dışlanır; İstanbul günü; metin; panel dağılımı ve geri alma bilgisi. KABUL X-12-2 → commit.

### Task 3: Ekran — KPI (`aria-label="Parti sayıları"`), çubuk, tablo (`aria-label="Partiler"`), panel (bölgeler "Parti", "Kayıtlar", "Geri alma"; form alanı "Geri alma gerekçesi", düğme "Partiyi geri al"), `/imports/new` (+ `new/loading.tsx`), `sutunEylemi.ts`, `loading.tsx`; e2e `ice-aktarim.spec.ts` güncellenir + `ice-aktarim-ekrani.spec.ts`. Tam takım → commit.

### Task 4: Belgeler — YOL_HARITASI Ü-30, PROJE_DURUMU, izlenebilirlik → commit.
