import { describe, expect, it } from "vitest";
import { canSellerOrderForDoctor } from "@/lib/doctor";

const SELLER_A = "seller-a";
const SELLER_B = "seller-b";

describe("canSellerOrderForDoctor — RULE-02 / FR-04", () => {
  it("sahibi olan satıcıya izin verir", () => {
    const r = canSellerOrderForDoctor(SELLER_A, {
      ownerSellerId: SELLER_A,
      status: "AKTIF",
    });
    expect(r.allowed).toBe(true);
  });

  it("🔴 sahibi OLMAYAN satıcıyı reddeder (tekil sahiplik)", () => {
    const r = canSellerOrderForDoctor(SELLER_B, {
      ownerSellerId: SELLER_A,
      status: "AKTIF",
    });
    expect(r).toEqual({ allowed: false, kuralKodu: "DOKTOR_KAPSAM_DISI" });
  });

  it("başka satıcının kimliğini sızdırmaz", () => {
    const r = canSellerOrderForDoctor(SELLER_B, {
      ownerSellerId: SELLER_A,
      status: "AKTIF",
    });
    expect(JSON.stringify(r)).not.toContain(SELLER_A);
  });

  it("FR-08: sahipsiz doktora sipariş girilemez", () => {
    const r = canSellerOrderForDoctor(SELLER_A, {
      ownerSellerId: null,
      status: "AKTIF",
    });
    expect(r).toEqual({ allowed: false, kuralKodu: "DOKTOR_SAHIPSIZ" });
  });

  it("pasif doktora sipariş girilemez", () => {
    const r = canSellerOrderForDoctor(SELLER_A, {
      ownerSellerId: SELLER_A,
      status: "PASIF",
    });
    expect(r.allowed).toBe(false);
  });

  it("pasiflik, sahiplikten ÖNCE değerlendirilir", () => {
    // Sahibi olmayan + pasif doktorda bildirim pasiflik olmalı (bilgi sızıntısı yok).
    const r = canSellerOrderForDoctor(SELLER_B, {
      ownerSellerId: SELLER_A,
      status: "PASIF",
    });
    expect(r).toEqual({ allowed: false, kuralKodu: "DOKTOR_PASIF" });
  });
});
