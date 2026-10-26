import { describe, expect, it } from "vitest";

import { ayEtiketi, formatSayi } from "@/lib/format";

describe("formatSayi / ayEtiketi", () => {
  it("adet tr-TR binlik ayırıcıyla", () => {
    expect(formatSayi(1250)).toBe("1.250");
    expect(formatSayi(0)).toBe("0");
  });

  it("ay kısa adı, dilim dönüşümü olmadan", () => {
    expect(ayEtiketi(2026, 10)).toBe("Eki");
    expect(ayEtiketi(2026, 1)).toBe("Oca");
    expect(ayEtiketi(2025, 12)).toBe("Ara");
  });
});
