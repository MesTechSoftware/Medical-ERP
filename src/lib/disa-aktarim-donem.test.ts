import { describe, expect, it } from "vitest";
import { donemKisayollari } from "./disa-aktarim-donem";

const harita = (bugun: string) => Object.fromEntries(donemKisayollari(bugun).map((k) => [k.etiket, [k.baslangic, k.bitis]]));

describe("dışa aktarım dönem kısayolları (D-5-3)", () => {
  it("bu ay ve bu yıl bugünle biter; geçen ay ve geçen yıl tam takvim dönemi", () => {
    expect(donemKisayollari("2026-11-04").map((k) => k.etiket)).toEqual(["Bu ay", "Geçen ay", "Bu yıl", "Geçen yıl"]);
    expect(harita("2026-11-04")).toEqual({
      "Bu ay": ["2026-11-01", "2026-11-04"],
      "Geçen ay": ["2026-10-01", "2026-10-31"],
      "Bu yıl": ["2026-01-01", "2026-11-04"],
      "Geçen yıl": ["2025-01-01", "2025-12-31"],
    });
  });

  it("ocakta geçen ay önceki yılın aralığıdır", () => {
    expect(harita("2027-01-15")["Geçen ay"]).toEqual(["2026-12-01", "2026-12-31"]);
  });

  it("şubat sonu artık yılda 29'dur", () => {
    expect(harita("2028-03-01")["Geçen ay"]).toEqual(["2028-02-01", "2028-02-29"]);
    expect(harita("2027-03-01")["Geçen ay"]).toEqual(["2027-02-01", "2027-02-28"]);
  });
});
