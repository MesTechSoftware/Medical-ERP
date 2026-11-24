# Demo öncesi revizyon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Demo öncesi iş akışı revizyonunu karar özetindeki on altı pakette, her biri ayrı commit olarak tamamlamak.

**Architecture:** Mevcut katmanlar korunur (saf `src/lib/*`, server action, `YanPanel`, `ApprovalBlock`); yeni kilit kaynağı yok (ADR-012).

**Tech Stack:** Next.js 16.2.10, Prisma, Vitest (unit + integration), Playwright.

**Spec:** `docs/superpowers/specs/2026-11-24-demo-oncesi-revizyon-design.md` · **Karar kaynağı:** `docs/superpowers/specs/2026-11-24-demo-oncesi-revizyon-karar-ozeti.md`

## Global Constraints

- Kararlar özetten birebir; yeniden türetme yok. `docker-compose.yml` commit'e girmez. Claude imzası yok.
- Kod yazmadan önce ilgili `node_modules/next/dist/docs/` rehberi okunur. ADR-012 sırası ve §4 zorlama testleri korunur.
- Her pakette: kabul kriteri → test (RED) → kod (GREEN) → ilgili unit/integration/e2e → commit. Başarısız testle commit yok.

## Review Focus

1. D1: pasif doktordan depoya transfer açık kalır (regresyon testi) — Paket 7.
2. D2: `ISKONTO_TAVANI` kurulu ve testli, varsayılan `null` — Paket 3.
3. `Order` satırına `FOR UPDATE` yok; `kalan = quantity − shipped − closedQuantity` tek kaynaktan — Paket 4.

---

### Task 0: Windows yol ayracı (`izlenebilirlik.ts:39`, `yetki.test.ts:78`) — test → düzeltme → commit.
### Task 1: Resmî karar kaydı — KARARLAR ekleri (A-3 eki cümlesi dahil), KABUL satırları, ADR-013 (+ADR-010 not, README dizin), YOL_HARITASI §4.2 (Ü-39) → commit.
### Task 2: Ürün silme (C-3) + arama + Sil taşıma.
### Task 3: Sipariş formu (A-10, D2, aramalı seçim, `CHECK` migration).
### Task 4: Kalanı kapat (A-3) + tüm sevkiyatlar + takip linki.
### Task 5: Risk / vade (A-12).
### Task 6: Öksüz onay bloğu (A-8).
### Task 7: Pasif doktor (A-4, D1) + F-5 transfer kaynak listesi.
### Task 8: Denetim (X-18 / ÜF-1).
### Task 9: OPERASYON paneli (D-2).
### Task 10: UI düzeltmeleri (`paidAt`, doktor varlık, F-3, F-4, F-6, B-6, belge no linki).
### Task 11: Güvenlik başlıkları (ÜG-1 temel).
### Task 12: Demo verisi + e2e (aynı commit).
### Task 15: Fatura hazırlık kartı (K-4 §(6)-(k)).
### Task 16: Demo görsel cila (sekme sayıları, stok `YanPanel` dörtlüsü dahil Depoya Transfer, Genel Bakış, Doktorlar, metin, ikonlar).
### Task 13: Marka ve parolalar (E-2) + sekme başlıkları + svg temizliği + deploy adımı.
### Task 14: Kapanış — tam test, build, e2e, `npm run izlenebilirlik`, PROJE_DURUMU ve YOL_HARITASI senkronu → commit.
