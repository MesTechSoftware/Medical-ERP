import { describe, expect, it } from "vitest";
import { amountSchema, priceSchema } from "@/lib/validation";

// Parasal girdi metindir ve float'a düşmeden Decimal'e çevrilir (X-5).
describe("amountSchema — tutar", () => {
  it("pozitif, en fazla 2 ondalıklı tutarı kabul eder", () => {
    expect(amountSchema.parse("1250,50").toFixed(2)).toBe("1250.50");
  });
  it("sıfırı, negatifi ve 3 ondalığı reddeder", () => {
    expect(amountSchema.safeParse("0").success).toBe(false);
    expect(amountSchema.safeParse("-1").success).toBe(false);
    expect(amountSchema.safeParse("1.234").success).toBe(false);
  });
});

describe("priceSchema — birim fiyat", () => {
  it("0'ı ve 4 ondalığı kabul eder (Decimal(18,4))", () => {
    expect(priceSchema.parse("0").toFixed(0)).toBe("0");
    expect(priceSchema.parse("12.3456").toFixed(4)).toBe("12.3456");
  });
  it("5 ondalığı ve 1 milyar TL üstünü reddeder", () => {
    expect(priceSchema.safeParse("1.23456").success).toBe(false);
    expect(priceSchema.safeParse("1000000001").success).toBe(false);
  });
});
