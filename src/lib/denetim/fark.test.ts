import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";

import { alanFarklari } from "@/lib/denetim/fark";

// X-18-3/4: alan bazlı değişiklik listesi; maskelemeden önce kurulur, sonra maskelenir.

describe("alanFarklari — güncelleme", () => {
  it("yalnız değişen alanları önceki hâlin sırasıyla verir", () => {
    expect(alanFarklari({ status: "BEKLIYOR", not: "a", adet: 2 }, { status: "IPTAL", not: "a", adet: 3 })).toEqual([
      { alan: "status", eski: "BEKLIYOR", yeni: "IPTAL" },
      { alan: "adet", eski: 2, yeni: 3 },
    ]);
  });

  it("kalkan alan yalnız eski, yeni gelen alan yalnız yeni değer taşır", () => {
    expect(alanFarklari({ a: 1, b: 2 }, { a: 1, c: 3 })).toEqual([
      { alan: "b", eski: 2 },
      { alan: "c", yeni: 3 },
    ]);
  });

  it("boş değere geçiş bir değişikliktir", () => {
    expect(alanFarklari({ email: "a@b.c" }, { email: null })).toEqual([{ alan: "email", eski: "a@b.c", yeni: null }]);
  });

  it("iç içe nesne ve dizi yol olarak düzleşir", () => {
    expect(
      alanFarklari({ kalemler: [{ urun: "X", miktar: 2 }], adres: { il: "İzmir" } }, { kalemler: [{ urun: "X", miktar: 5 }], adres: { il: "Ankara" } })
    ).toEqual([
      { alan: "kalemler[0].miktar", eski: 2, yeni: 5 },
      { alan: "adres.il", eski: "İzmir", yeni: "Ankara" },
    ]);
  });

  it("boş dizi ve boş nesne yaprak değerdir", () => {
    expect(alanFarklari({ kalemler: [] }, { kalemler: [{ miktar: 1 }] })).toEqual([
      { alan: "kalemler", eski: "[]" },
      { alan: "kalemler[0].miktar", yeni: 1 },
    ]);
  });

  it("Date ve Decimal biçimden bağımsız karşılaştırılır", () => {
    expect(alanFarklari({ at: new Date("2026-01-01T00:00:00.000Z"), tutar: new Decimal("10.50") }, { at: "2026-01-01T00:00:00.000Z", tutar: new Decimal("10.5") })).toEqual([]);
  });

  it("cari payload'ındaki elle tutulan değişen alanlar listesi farka girmez", () => {
    expect(alanFarklari({ phone: "1" }, { phone: "2", degisenAlanlar: ["phone"] })).toEqual([{ alan: "phone", eski: "1", yeni: "2" }]);
  });
});

describe("alanFarklari — ekleme ve silme", () => {
  it("önceki hâl yoksa bütün alanlar yeni değerdir", () => {
    expect(alanFarklari(undefined, { documentNo: "SIP-2026-000001", itemCount: 2 })).toEqual([
      { alan: "documentNo", yeni: "SIP-2026-000001" },
      { alan: "itemCount", yeni: 2 },
    ]);
  });

  it("sonraki hâl yoksa bütün alanlar eski değerdir", () => {
    expect(alanFarklari({ itemId: "x", listPrice: "10.0000" }, undefined)).toEqual([
      { alan: "itemId", eski: "x" },
      { alan: "listPrice", eski: "10.0000" },
    ]);
  });

  it("iki hâl de yoksa liste boştur", () => {
    expect(alanFarklari(undefined, undefined)).toEqual([]);
  });
});

describe("alanFarklari — maskeleme (X-18-4)", () => {
  it("hassas alan değiştiyse girdi var, değerleri ***", () => {
    expect(alanFarklari({ taxId: "1234567890" }, { taxId: "9876543210" })).toEqual([{ alan: "taxId", eski: "***", yeni: "***" }]);
  });

  it("hassas alan değişmediyse girdi yok", () => {
    expect(alanFarklari({ taxId: "1234567890", phone: "1" }, { taxId: "1234567890", phone: "2" })).toEqual([
      { alan: "phone", eski: "1", yeni: "2" },
    ]);
  });

  it("boştan dolduya geçişte boş değer görünür, dolu değer gizlidir", () => {
    expect(alanFarklari({ taxId: null }, { taxId: "1234567890" })).toEqual([{ alan: "taxId", eski: null, yeni: "***" }]);
  });

  it("yolunda hassas anahtar olan iç içe değer de gizlidir", () => {
    const fark = alanFarklari({ user: { password: "a" } }, { user: { password: "b" } });
    expect(fark).toEqual([{ alan: "user.password", eski: "***", yeni: "***" }]);
    expect(JSON.stringify(fark)).not.toMatch(/"a"|"b"/);
  });
});
