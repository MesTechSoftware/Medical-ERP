# Doktorlarım ekranı Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/my-doctors`'u yönetici Doktorlar ekranının (Ü-18) satıcı kapsamlı hâline çevirmek: 4 KPI, sekmeler, Filtrele, sütun seçici, sayfalı liste, yan panel; gezinmeler yeniden yüklemesiz.

**Architecture:** `doktor-listesi` sorguları zorunlu `kapsam` (`kapsamliDoktorlariGetir` çıktısı), adres üreticileri `yol` alır; satıcı kartları/sekmeleri/süzgeci `suzgec.ts`'te, kartlar ve panel `sorgu.ts`'te. Bakiye hücresi ve rozetler `src/components/doktor/`'a taşınır.

**Tech Stack:** Next.js 16, Prisma 7, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-05-doktorlarim-ekrani-design.md`

## Global Constraints

- `requireSeller`; kapsam tek kaynaktan (X-13-1); yönetici `/doctors` davranışı değişmez. Claude imzası yok.

## Review Focus

1. Başka satıcının ya da bayi carisi listede, kartta, bölgede, panelde görünmemeli — Task 2 itest, Task 3 e2e.
2. Panel "son siparişlerim" başka satıcının siparişini göstermemeli — Task 2 itest.
3. Panel aç/kapa tam yükleme yapmamalı — Task 3 e2e.

---

### Task 1: `suzgec.ts` — `DoktorYolu`, `doktorAdresi`/`etkinSuzgecler` `yol`; `saticiSuzgeci`, `SATICI_KARTLARI`, `SATICI_SEKMELERI`; `sutunlar.ts` satıcı seti. Birim testi → commit.

### Task 2: `sorgu.ts` — `doktorListesi` zorunlu `kapsam`; `saticiDoktorKpileri`, `doktorBolgeleri`, `saticiDoktorPaneli`. itest. KABUL X-13-4 → commit.

### Task 3: Ekran — bileşenler, sayfa, `sutunEylemi.ts`, iskeletler; ortak `bakiye`/`DurumRozetleri`/`SonSiparisHucresi`; Siparişlerim panelinde cari bağlantısı; e2e `seller/doktorlarim.spec.ts`. Tam takım → commit.

### Task 4: Belgeler — YOL_HARITASI Ü-32, PROJE_DURUMU, izlenebilirlik → commit.
