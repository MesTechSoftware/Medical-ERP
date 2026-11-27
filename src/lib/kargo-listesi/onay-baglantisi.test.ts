import { describe, expect, it } from "vitest";
import { onayBaglantisi } from "./onay-baglantisi";

describe("onayBaglantisi (A-8-14)", () => {
  it("tek kararsız blok → panel", () => {
    expect(onayBaglantisi({ documentNo: "SIP-1", onay: "BEKLIYOR", acikBloklar: ["b1"] })).toBe("/approvals?detay=b1");
  });
  it("birden çok kararsız blok → belge numarasıyla bekleyen sekmesi", () => {
    expect(onayBaglantisi({ documentNo: "SIP-1", onay: "BEKLIYOR", acikBloklar: ["b1", "b2"] })).toBe("/approvals?q=SIP-1");
  });
  it("RED → Reddedilenler sekmesi, belge numarasıyla", () => {
    expect(onayBaglantisi({ documentNo: "SIP-1", onay: "RED", acikBloklar: [] })).toBe("/approvals?durum=RED&q=SIP-1");
  });
  it("onayı olmayan sipariş → bağlantı yok", () => {
    expect(onayBaglantisi({ documentNo: "SIP-1", onay: undefined, acikBloklar: [] })).toBeNull();
  });
});
