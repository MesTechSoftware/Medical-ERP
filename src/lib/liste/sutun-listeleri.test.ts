import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { SUTUN_LISTELERI, sutunluListeMi } from "@/lib/liste/sutun-listeleri";

// Sütun seçicili ekranların tek kaydı — spec Ü-18 §3.4. Anahtar ekranın yolu, çerez o yola yazılır.

const anahtarlar = Object.keys(SUTUN_LISTELERI);

describe("SUTUN_LISTELERI", () => {
  it("her anahtar gerçek bir liste sayfasının yoludur", () => {
    for (const yol of anahtarlar) {
      const grup = yol.startsWith("/my-") ? "(seller)" : "(admin)";
      expect(existsSync(path.join("src/app", grup, yol, "page.tsx")), yol).toBe(true);
    }
  });

  it("yetki sayfanın guard'ıyla aynıdır (sütun eylemi bu yetkiyle korunur)", () => {
    const guard = { yonetici: "requireAdmin", personel: "requireStaff", satici: "requireSeller" } as const;
    for (const [yol, k] of Object.entries(SUTUN_LISTELERI)) {
      const grup = yol.startsWith("/my-") ? "(seller)" : "(admin)";
      const sayfaGuardi = readFileSync(path.join("src/app", grup, yol, "page.tsx"), "utf8").match(/await (require[A-Za-z]+)\(\)/)?.[1];
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
