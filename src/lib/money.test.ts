import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import { formatla, paraOku } from "@/lib/money";

// `money.test.ts`'in (7 test) Decimal karşılığı — X-5 §(6). FAZ1 §D.1 CM: "yeniden yazılır".
const nbsp = (s: string) => s.replace(/ /g, " ");

describe("formatla — istemciye giden tek çıkış (X-5 §(6))", () => {
  it("parayı Türk Lirası metni olarak verir", () => {
    expect(nbsp(formatla(new Decimal("1250.5")))).toBe("₺1.250,50");
    expect(nbsp(formatla(new Decimal(0)))).toBe("₺0,00");
  });

  it("float'a düşmeden büyük tutarı kayıpsız biçimlendirir", () => {
    // 2^53'ü aşan kuruş: Number'a düşseydi son haneler bozulurdu.
    expect(nbsp(formatla("90071992547409.93"))).toBe("₺90.071.992.547.409,93");
  });

  it("gösterimde 2 haneye yuvarlar (yarım sıfırdan uzağa)", () => {
    expect(nbsp(formatla("12.345"))).toBe("₺12,35");
  });

  it("ham biçim nokta ondalıklı, üssüz metin verir", () => {
    expect(formatla(new Decimal("873.4500"), "ham")).toBe("873.45");
    expect(formatla(new Decimal("1e-7"), "ham")).toBe("0.0000001");
  });

  it("oran biçimi yüzde işaretiyle verir", () => {
    expect(formatla(new Decimal("12.655"), "oran")).toBe("%12,66");
  });

  it("boş değeri tire olarak verir", () => {
    expect(formatla(null)).toBe("—");
    expect(formatla(undefined, "ham")).toBe("—");
  });
});

describe("paraOku", () => {
  it("virgül veya nokta ondalıklı metni Decimal'e çevirir", () => {
    expect(paraOku("1250,5")?.toFixed(2)).toBe("1250.50");
    expect(paraOku(" 45.5 ")?.toFixed(2)).toBe("45.50");
  });

  it("geçersiz, negatif veya 4 haneden fazla ondalıklı metni reddeder", () => {
    expect(paraOku("abc")).toBeNull();
    expect(paraOku("-5")).toBeNull();
    expect(paraOku("1.23456")).toBeNull();
    expect(paraOku("")).toBeNull();
  });
});
