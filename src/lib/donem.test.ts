import { describe, expect, it } from "vitest";
import { donemCoz } from "@/lib/donem";
import { TUM_ZAMANLAR } from "@/lib/zaman";

// X-1 §(2): ekranın varsayılan dönemi içinde bulunulan aydır; "tüm zamanlar" bilinçli seçimdir.
const an = new Date("2026-10-17T09:00:00Z");

describe("donemCoz — rapor ekranının dönem parametresi", () => {
  it("parametre yoksa içinde bulunulan ay", () => {
    const d = donemCoz(undefined, an);
    expect(d.anahtar).toBe("2026-10");
    expect(d.aralik.baslangic.toISOString()).toBe("2026-09-30T21:00:00.000Z");
  });

  it("YYYY-AA verilen ayı seçer", () => {
    const d = donemCoz("2026-03", an);
    expect(d.anahtar).toBe("2026-03");
    expect(d.aralik.bitis.toISOString()).toBe("2026-03-31T21:00:00.000Z");
  });

  it("'tum' tüm zamanlar aralığıdır", () => {
    const d = donemCoz("tum", an);
    expect(d.anahtar).toBe("tum");
    expect(d.aralik).toEqual(TUM_ZAMANLAR);
  });

  it("geçersiz değer içinde bulunulan aya düşer", () => {
    for (const p of ["2026-13", "2026-00", "abc", "2026-1"]) expect(donemCoz(p, an).anahtar).toBe("2026-10");
  });
});
