import { describe, expect, it } from "vitest";

import { ANA_MENU, OZET_SIRASI, YALNIZ_YONETICI, gorunurOzetler } from "@/components/menu";

// Dashboard'un sayfa şeridi: menüdeki her sayfa için bir kutu, rolün gördüğü kadar.

describe("gorunurOzetler — bütün sayfaların özeti, rolün gördüğü kadar", () => {
  it("menüdeki her sayfanın (dashboard hariç) tam bir özeti var; tekrar yok", () => {
    const menu = ANA_MENU.map((m) => m.href).filter((h) => h !== "/dashboard");
    expect([...OZET_SIRASI].sort()).toEqual([...menu].sort());
    expect(new Set(OZET_SIRASI).size).toBe(OZET_SIRASI.length);
  });

  it("yönetici hepsini görür; operasyon yalnız yöneticinin sayfalarını görmez; sıra korunur", () => {
    expect(gorunurOzetler("YONETICI")).toEqual([...OZET_SIRASI]);
    const operasyon = gorunurOzetler("OPERASYON");
    expect(operasyon.filter((s) => YALNIZ_YONETICI.has(s))).toEqual([]);
    expect(operasyon).toEqual(OZET_SIRASI.filter((s) => !YALNIZ_YONETICI.has(s)));
    expect(operasyon).toHaveLength(7);
  });
});
