import { describe, expect, it } from "vitest";
import {
  InvalidPhoneError,
  formatPhone,
  normalizePhone,
  tryNormalizePhone,
} from "@/lib/phone";

const CANONICAL = "+905321234567";

describe("normalizePhone — FR-09 mükerrer kayıt engeli", () => {
  it("aynı numaranın TÜM yazımlarını aynı kanonik değere indirger", () => {
    // 🔴 Bu testin özü: aşağıdakilerin hepsi AYNI doktordur. Biri bile
    // farklı normalize olursa iki satıcı aynı doktoru ayrı ayrı kaydeder.
    const variants = [
      "05321234567",
      "0532 123 45 67",
      "0532-123-45-67",
      "0532.123.45.67",
      "(0532) 123 45 67",
      "5321234567",
      "532 123 45 67",
      "905321234567",
      "90 532 123 45 67",
      "+905321234567",
      "+90 532 123 45 67",
      "+90 (532) 123-45-67",
      // Ülke kodundan sonra ulusal 0 — yaygın yazım hatası. Reddetmek yerine
      // aynı doktora indirgemek FR-09'un amacına hizmet eder (mükerrer kaydı önler).
      "+90 0532 123 45 67",
      "00905321234567",
      "0090 532 123 45 67",
      "  0532 123 45 67  ",
    ];

    for (const v of variants) {
      expect(normalizePhone(v), `başarısız varyant: ${v}`).toBe(CANONICAL);
    }
    // Hepsi tek bir değere indirgendi mi?
    expect(new Set(variants.map(normalizePhone)).size).toBe(1);
  });

  it("sabit hat numaralarını da normalize eder", () => {
    expect(normalizePhone("0212 555 44 33")).toBe("+902125554433");
    expect(normalizePhone("2125554433")).toBe("+902125554433");
  });

  it("farklı numaraları farklı tutar (yanlış eşleşme yok)", () => {
    expect(normalizePhone("0532 123 45 67")).not.toBe(
      normalizePhone("0532 123 45 68")
    );
  });

  it("geçersiz girdileri reddeder", () => {
    const invalid = [
      "", // boş
      "   ", // sadece boşluk
      "abc", // harf
      "123", // çok kısa
      "053212345", // 9 hane
      "053212345678", // 12 hane
      "00532123456789", // aşırı uzun
    ];
    for (const v of invalid) {
      expect(() => normalizePhone(v), `reddedilmeliydi: "${v}"`).toThrow(
        InvalidPhoneError
      );
    }
  });

  it("ulusal 0'dan sonra tekrar 0 gelen numarayı reddeder", () => {
    expect(() => normalizePhone("00321234567")).toThrow(InvalidPhoneError);
  });
});

describe("tryNormalizePhone", () => {
  it("geçerliyse kanonik değeri döner", () => {
    expect(tryNormalizePhone("0532 123 45 67")).toBe(CANONICAL);
  });

  it("geçersizse null döner (fırlatmaz)", () => {
    expect(tryNormalizePhone("abc")).toBeNull();
    expect(tryNormalizePhone("")).toBeNull();
  });
});

describe("formatPhone", () => {
  it("kanonik değeri okunur biçime çevirir", () => {
    expect(formatPhone(CANONICAL)).toBe("0532 123 45 67");
  });

  it("tanımadığı değeri olduğu gibi bırakır", () => {
    expect(formatPhone("bozuk")).toBe("bozuk");
  });

  it("normalize -> format -> normalize turu değeri korur", () => {
    expect(normalizePhone(formatPhone(CANONICAL))).toBe(CANONICAL);
  });
});
