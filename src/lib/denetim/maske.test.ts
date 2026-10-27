import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";

import { MASKE, hassasMi, maskele, normallestir } from "@/lib/denetim/maske";

// X-18-4: hassas alanın değeri kayda `***` olarak yazılır, alan adı kalır.

describe("maskele", () => {
  it("parola, özet ve token değerini *** yazar; alan adı kalır", () => {
    expect(maskele({ name: "Ahmet", passwordHash: "$2a$10$gizli", token: "abc" })).toEqual({
      name: "Ahmet",
      passwordHash: MASKE,
      token: MASKE,
    });
  });

  it("vergi kimliği ve fatura setinin değeri yazılmaz, alanı görünür (A-13 §(7))", () => {
    const out = maskele({
      fullName: "Dr. A",
      taxId: "1234567890",
      invoiceTitle: "A Ltd.",
      taxOffice: "Kadıköy",
      invoiceAddress: "Adres",
      invoiceDistrict: "İlçe",
      invoiceCity: "İl",
    });
    expect(out).toEqual({
      fullName: "Dr. A",
      taxId: MASKE,
      invoiceTitle: MASKE,
      taxOffice: MASKE,
      invoiceAddress: MASKE,
      invoiceDistrict: MASKE,
      invoiceCity: MASKE,
    });
    expect(JSON.stringify(out)).not.toContain("1234567890");
  });

  it("iç içe nesnede ve dizide de maskeler", () => {
    expect(maskele({ user: { name: "Ayşe", password: "x" }, kartlar: [{ cardNumber: "4111" }] })).toEqual({
      user: { name: "Ayşe", password: MASKE },
      kartlar: [{ cardNumber: MASKE }],
    });
  });

  it("boş değer boş kalır: gizlenecek bir şey yoktur", () => {
    expect(maskele({ taxId: null })).toEqual({ taxId: null });
  });

  it("Date, Decimal ve BigInt'i kayda yazılabilir metne çevirir", () => {
    expect(
      maskele({ at: new Date("2026-07-23T00:00:00.000Z"), amount: new Decimal("5000"), eski: 714000_00n, liste: [100n] })
    ).toEqual({ at: "2026-07-23T00:00:00.000Z", amount: "5000", eski: "71400000", liste: ["100"] });
  });
});

describe("hassasMi — ad kuralı", () => {
  it.each(["passwordHash", "refreshToken", "apiSecret", "cardNumber", "kartNo", "iban", "tckn", "vknNo", "cvv", "parola", "yeniSifre"])(
    "%s hassastır",
    (ad) => expect(hassasMi(ad)).toBe(true)
  );

  it.each(["discardedAt", "cardiologyNote", "documentNo", "name", "batchNo", "gerekce"])("%s hassas değildir", (ad) =>
    expect(hassasMi(ad)).toBe(false)
  );
});

describe("normallestir", () => {
  it("maskelemez; yalnız biçimi çevirir (fark maskelemeden önce kurulur)", () => {
    expect(normallestir({ taxId: "1234567890", at: new Date("2026-01-01T00:00:00.000Z") })).toEqual({
      taxId: "1234567890",
      at: "2026-01-01T00:00:00.000Z",
    });
  });
});
