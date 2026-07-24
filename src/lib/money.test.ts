import { describe, expect, it } from "vitest";
import { formatTRY, kurusToTl, sumKurus, tlToKurus } from "@/lib/money";

describe("tlToKurus", () => {
  it("TL'yi BigInt kuruşa çevirir", () => {
    expect(tlToKurus(150.5)).toBe(15050n);
    expect(tlToKurus(0)).toBe(0n);
    expect(tlToKurus(1)).toBe(100n);
  });

  it("kayan nokta hatasını yuvarlar", () => {
    // 45.5 * 100 = 4549.999... IEEE754'te; Math.round bunu düzeltir.
    expect(tlToKurus(45.5)).toBe(4550n);
    expect(tlToKurus(95.75)).toBe(9575n);
    expect(tlToKurus(340.9)).toBe(34090n);
  });
});

describe("kurusToTl", () => {
  it("kuruşu TL'ye çevirir", () => {
    expect(kurusToTl(15050n)).toBe(150.5);
    expect(kurusToTl(0n)).toBe(0);
  });
});

describe("formatTRY", () => {
  it("kuruşu Türk Lirası metnine çevirir", () => {
    //   = non-breaking space (Intl'in ürettiği ayırıcı).
    expect(formatTRY(125050n).replace(/ /g, " ")).toBe("₺1.250,50");
    expect(formatTRY(0n).replace(/ /g, " ")).toBe("₺0,00");
  });

  it("Int32 tavanının üstündeki tutarları bozulmadan biçimlendirir", () => {
    // PostgreSQL'de Int (4 bayt) tavanı 2.147.483.647 kuruş ≈ 21,5 M ₺ idi;
    // BigInt'e geçişin asıl sebebi bu. 5 milyar ₺ eskiden saklanamazdı.
    const kurus = 5_000_000_000_00n; // 5 milyar ₺ (kuruş cinsinden)
    expect(formatTRY(kurus).replace(/ /g, " ")).toBe(
      "₺5.000.000.000,00"
    );
  });
});

describe("sumKurus", () => {
  it("BigInt kuruşları toplar", () => {
    expect(sumKurus([100n, 250n, 50n])).toBe(400n);
  });

  it("null/undefined değerleri 0 sayar (Prisma _sum null dönebilir)", () => {
    expect(sumKurus([100n, null, undefined, 50n])).toBe(150n);
    expect(sumKurus([])).toBe(0n);
  });
});
