import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { SUTUN_LISTELERI, sutunluListeMi } from "@/lib/liste/sutun-listeleri";

// Sütun seçicili ekranların tek kaydı — spec Ü-18 §3.4. Anahtar ekranın yolu, çerez o yola yazılır.

const anahtarlar = Object.keys(SUTUN_LISTELERI);
/** Depo kökü — test hangi dizinden koşarsa koşsun sayfa dosyaları bulunur. */
const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const sayfaYolu = (yol: string) => path.join(KOK, "src/app", yol.startsWith("/my-") ? "(seller)" : "(admin)", yol, "page.tsx");

describe("SUTUN_LISTELERI", () => {
  it("her anahtar gerçek bir liste sayfasının yoludur", () => {
    for (const yol of anahtarlar) {
      expect(existsSync(sayfaYolu(yol)), yol).toBe(true);
    }
  });

  it("yetki sayfanın guard'ıyla aynıdır (sütun eylemi bu yetkiyle korunur)", () => {
    const guard = { yonetici: "requireAdmin", personel: "requireStaff", satici: "requireSeller" } as const;
    for (const [yol, k] of Object.entries(SUTUN_LISTELERI)) {
      // Rol guard'ı (oturum guard'ı değil): sayfada tam olarak bir tane olmalı.
      const guardlar = [...readFileSync(sayfaYolu(yol), "utf8").matchAll(/await (requireAdmin|requireStaff|requireSeller)\(\)/g)].map((m) => m[1]);
      expect(new Set(guardlar).size, yol).toBe(1);
      const sayfaGuardi = guardlar[0];
      expect(sayfaGuardi, yol).toBeDefined();
      expect(guard[k.yetki], yol).toBe(sayfaGuardi);
    }
  });

  it("çerez adları tekildir — iki ekran birbirinin tercihini ezmez", () => {
    const cerezler = Object.values(SUTUN_LISTELERI).map((k) => k.cerez);
    expect(new Set(cerezler).size).toBe(cerezler.length);
  });

  it("her listenin en az bir gizlenebilir sütunu vardır, anahtarlar liste içinde tekildir", () => {
    for (const k of Object.values(SUTUN_LISTELERI)) {
      const a = k.sutunlar.map((s) => s.anahtar);
      expect(a.length).toBeGreaterThan(0);
      expect(new Set(a).size).toBe(a.length);
    }
  });
});

describe("sutunluListeMi", () => {
  it("yalnız kayıttaki yolları tanır; prototip adları ve yakın yollar tanınmaz", () => {
    expect(sutunluListeMi("/orders")).toBe(true);
    expect(sutunluListeMi("/my-orders")).toBe(true);
    for (const kotu of ["", "/", "/orders/", "/orders?x=1", "/ordersx", "constructor", "__proto__", "toString"]) {
      expect(sutunluListeMi(kotu), kotu).toBe(false);
    }
  });
});
