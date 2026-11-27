import { describe, expect, it } from "vitest";
import { ANA_MENU, MENU_GRUPLARI, YALNIZ_YONETICI, gorunurGruplar } from "@/components/menu";

describe("menü grupları (Ü-42 M6)", () => {
  it("ANA_MENU grupların düz birleşimidir; her sayfa bir kez", () => {
    expect(ANA_MENU.map((n) => n.href)).toEqual(MENU_GRUPLARI.flatMap((g) => g.ogeler.map((n) => n.href)));
    expect(new Set(ANA_MENU.map((n) => n.href)).size).toBe(ANA_MENU.length);
    expect(ANA_MENU).toHaveLength(14);
  });
  it("YONETICI bütün sayfaları, üç grupta görür", () => {
    const g = gorunurGruplar("YONETICI");
    expect(g.map((x) => x.baslik)).toEqual(["Operasyon", "Katalog & Cari", "Yönetim & Rapor"]);
    expect(g.flatMap((x) => x.ogeler)).toHaveLength(ANA_MENU.length);
  });
  it("OPERASYON yalnız-yönetici sayfaları görmez; boşalan grup çizilmez", () => {
    const g = gorunurGruplar("OPERASYON");
    for (const n of g.flatMap((x) => x.ogeler)) expect(YALNIZ_YONETICI.has(n.href)).toBe(false);
    expect(g.find((x) => x.baslik === "Operasyon")!.ogeler.map((n) => n.href)).not.toContain("/approvals");
    expect(g.every((x) => x.ogeler.length > 0)).toBe(true);
  });
  it("menü sayısı yalnız verilen sayfaya işlenir", () => {
    const n = gorunurGruplar("YONETICI", { "/approvals": 3 }).flatMap((x) => x.ogeler);
    expect(n.find((x) => x.href === "/approvals")!.sayi).toBe(3);
    expect(n.find((x) => x.href === "/orders")!.sayi).toBeUndefined();
  });
});
