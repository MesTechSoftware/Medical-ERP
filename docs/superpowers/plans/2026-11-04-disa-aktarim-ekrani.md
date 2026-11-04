# Dışa Aktarım ekranı Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dışa aktarım formunu açıklamalı veri seti kartları, dönem kısayolları ve biçim radyosuyla yenilemek; şablonsuz fatura hazırlığı pasif göstermek. Eylem ve veri setleri değişmez; geçmiş/KPI yok (D-5).

**Architecture:** Saf `src/lib/disa-aktarim-donem.ts` (`donemKisayollari`); form istemci bileşeni kartları ve kısayolları çizer; sayfa şablonun varlığını prop olarak verir.

**Tech Stack:** Next.js 16, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-04-disa-aktarim-ekrani-design.md`

## Global Constraints

- `requireAdmin`; `disaAktar` ve alan adları (`kod`, `bicim`, `baslangic`, `bitis`, `tarih`, `tumZamanlar`) değişmez; alan etiketleri "Başlangıç günü", "Bitiş günü (dahil)" korunur. Claude imzası yok.

## Review Focus

1. Ocakta "Geçen ay" önceki yılın aralığıdır — Task 1 test.
2. Şubat sonu / artık yıl — Task 1 test.
3. Pasif kart klavyeyle de seçilemez (`disabled` radyo) — Task 2 e2e.

---

### Task 1: `donemKisayollari(bugun)` — test (dört kısayol; `2027-01-15` → geçen ay `2026-12-01…2026-12-31`, geçen yıl `2026-01-01…2026-12-31`; `2028-03-01` → geçen ay `2028-02-01…2028-02-29`) → RED → yaz → GREEN → commit.

### Task 2: Form ve sayfa — kartlar (`role="radiogroup"` `aria-label="Veri seti"`, radyo `name="kod"`, açıklama ve rozet), kısayol düğmeleri (`aria-label="Dönem kısayolları"`), biçim radyosu (`aria-label="Biçim"`); sayfa `faturaSablonuVar={policy.export.sablonTanimi !== null}`. KABUL D-5-3. e2e `disa-aktarim.spec.ts` güncellenir + kısayol ve pasif kart testi. Tam takım → commit.

### Task 3: Belgeler — YOL_HARITASI Ü-29, PROJE_DURUMU, izlenebilirlik → commit.
