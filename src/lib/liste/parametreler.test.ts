import { describe, expect, it } from "vitest";
import { aralikEtiketi, gun, ilk, kimlik, secenek } from "./parametreler";

describe("adres parametresi yardımcıları", () => {
  it("ilk: dizide ilk eleman, boş metin null", () => {
    expect(ilk({ a: ["x", "y"] }, "a")).toBe("x");
    expect(ilk({ a: "" }, "a")).toBeNull();
    expect(ilk({}, "a")).toBeNull();
  });

  it("secenek: yalnız geçerli değer", () => {
    expect(secenek("B", ["A", "B"] as const)).toBe("B");
    expect(secenek("C", ["A", "B"] as const)).toBeNull();
    expect(secenek(null, ["A"] as const)).toBeNull();
  });

  it("gun: YYYY-AA-GG ve gerçek takvim günü", () => {
    expect(gun("2026-02-28")).toBe("2026-02-28");
    expect(gun("2026-02-30")).toBeNull();
    expect(gun("2026-2-8")).toBeNull();
    expect(gun(null)).toBeNull();
  });

  it("kimlik: harf, rakam, tire; en çok 64", () => {
    expect(kimlik("cm-1")).toBe("cm-1");
    expect(kimlik("a".repeat(64))).toBe("a".repeat(64));
    expect(kimlik("a".repeat(65))).toBeNull();
    expect(kimlik("a b")).toBeNull();
    expect(kimlik(null)).toBeNull();
  });

  it("aralikEtiketi: iki uç, yalnız başlangıç, yalnız bitiş", () => {
    expect(aralikEtiketi("2026-10-01", "2026-10-31")).toBe("01.10.2026 – 31.10.2026");
    expect(aralikEtiketi("2026-10-01", null)).toBe("01.10.2026 sonrası");
    expect(aralikEtiketi(null, "2026-10-31")).toBe("31.10.2026 öncesi");
  });
});
