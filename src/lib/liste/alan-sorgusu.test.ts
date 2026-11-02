import { describe, expect, it } from "vitest";
import { alanSorgusu } from "./alan-sorgusu";

// Süzgeç formunun yeniden kurulma anahtarı (`SuzgecFormu`).

describe("alanSorgusu", () => {
  it("yalnız verilen alanlar, verilen sırayla; ham değer, çoklu değer korunur", () => {
    const sp = new URLSearchParams("page=3&detay=cm1&yon=GIRIS&tur=&tur=x");
    expect(alanSorgusu(sp, ["tur", "yon", "urunId"])).toBe("tur=&tur=x&yon=GIRIS");
  });

  it("yok ile boş ayrıdır", () => {
    expect(alanSorgusu(new URLSearchParams(""), ["donem"])).toBe("");
    expect(alanSorgusu(new URLSearchParams("donem="), ["donem"])).toBe("donem=");
  });
});
