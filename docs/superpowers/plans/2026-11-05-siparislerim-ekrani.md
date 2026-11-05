# Siparişlerim ekranı Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/my-orders`'u yönetici Siparişler ekranının (Ü-23) satıcı kapsamlı hâline çevirmek: 4 KPI, sekmeler, Filtrele, sütun seçici, sayfalı liste, yan panel; gezinmeler yeniden yüklemesiz.

**Architecture:** `siparis-listesi` sorguları `saticiId` kapsamı, adres üreticileri `yol` alır; ekran bileşenleri `src/components/siparis/`'e taşınır. İkinci hesap yolu yok.

**Tech Stack:** Next.js 16, Prisma 7, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-05-siparislerim-ekrani-design.md`

## Global Constraints

- `requireSeller`; kapsam sorguda (X-13); yönetici `/orders` davranışı ve adresleri değişmez. Claude imzası yok.

## Review Focus

1. Başka satıcının siparişi listede, KPI'da ve panelde görünmemeli — Task 2 itest, Task 3 e2e.
2. Adresteki `satici` kapsamı değiştirmemeli — Task 2 itest, Task 3 e2e.
3. Panel aç/kapa tam yükleme yapmamalı, KPI DOM'u korunmalı — Task 3 e2e.

---

### Task 1: `suzgec.ts` adres üreticilerine `yol: SiparisYolu = "/orders"`; `sutunlar.ts`'e `SATICI_SUTUNLARI`/çerez/yol. Birim testi → commit.

### Task 2: `siparisKosulu/siparisListesi/siparisKpileri/siparisPaneli` + `siparisDagilimi` `saticiId?`. itest: kapsam, kart = süzgeç, başka satıcının paneli null. KABUL X-13-3 → commit.

### Task 3: Bileşenler `src/components/siparis/`'e (`yol` prop); `/my-orders` sayfası, `sutunEylemi.ts`, `loading.tsx` (+ `new`, `[id]` genel iskelet); e2e `seller/siparislerim.spec.ts`. Tam takım → commit.

### Task 4: Belgeler — YOL_HARITASI Ü-31, PROJE_DURUMU, izlenebilirlik → commit.
