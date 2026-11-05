# Hesabım ekranı Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hesabım'ı öbür satıcı ekranlarıyla aynı sayıyı veren 3 KPI kartı ve profil bölümüne çevirmek.

**Architecture:** Yeni sorgu yok; kartlar `kapsamliDoktorlariGetir`, `siparisKpileri`, `ciroOzeti`'den, tek `Promise.all`.

**Spec:** `docs/superpowers/specs/2026-11-05-hesabim-ekrani-design.md`

## Review Focus

1. Kart değerleri öbür ekranlarla aynı olmalı — e2e.

---

### Task 1: Sayfa + iskelet + e2e → commit.
### Task 2: Belgeler → commit.
