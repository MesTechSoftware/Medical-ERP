# Raporum ekranı Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Raporum'a İadem kartı ve satıcı kapsamlı doktor ciro sıralaması eklemek.

**Architecture:** `getDoctorReports`/`doktorSiralamasi` zorunlu `KpiKapsami`; `rapor-listesi/suzgec.ts` adresleri `yol` alır. Ekran bileşeni `my-report/CiroSiralamasi.tsx`.

**Spec:** `docs/superpowers/specs/2026-11-05-raporum-ekrani-design.md`

## Review Focus

1. Başka satıcının siparişi satıcının cirosuna girmemeli — Task 2 itest.
2. Devredilmiş carinin satıcıyla cirosu kalmalı (X-13) — Task 2 itest.

---

### Task 1: `suzgec.ts` `RaporYolu`; birim testi → commit.
### Task 2: Kapsam; itest; KABUL X-1-3 → commit.
### Task 3: Ekran (İadem, CiroSiralamasi, sayfalama, iskelet); e2e → commit.
### Task 4: Belgeler → commit.
