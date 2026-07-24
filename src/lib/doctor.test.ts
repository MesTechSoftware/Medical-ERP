import { describe, expect, it } from "vitest";
import { canSellerOrderForDoctor, doctorScopeFor } from "@/lib/doctor";

const SELLER_A = "seller-a";
const SELLER_B = "seller-b";

describe("canSellerOrderForDoctor — RULE-02 / FR-04", () => {
  it("sahibi olan satıcıya izin verir", () => {
    const r = canSellerOrderForDoctor(SELLER_A, {
      ownerSellerId: SELLER_A,
      status: "ACTIVE",
    });
    expect(r.allowed).toBe(true);
  });

  it("🔴 sahibi OLMAYAN satıcıyı reddeder (tekil sahiplik)", () => {
    const r = canSellerOrderForDoctor(SELLER_B, {
      ownerSellerId: SELLER_A,
      status: "ACTIVE",
    });
    expect(r.allowed).toBe(false);
    expect(r).toHaveProperty("reason");
  });

  it("başka satıcının kimliğini sızdırmaz", () => {
    const r = canSellerOrderForDoctor(SELLER_B, {
      ownerSellerId: SELLER_A,
      status: "ACTIVE",
    });
    if (r.allowed) throw new Error("beklenmedik izin");
    expect(r.reason).not.toContain(SELLER_A);
  });

  it("FR-08: sahipsiz doktora sipariş girilemez", () => {
    const r = canSellerOrderForDoctor(SELLER_A, {
      ownerSellerId: null,
      status: "ACTIVE",
    });
    expect(r.allowed).toBe(false);
    if (r.allowed) return;
    expect(r.reason).toMatch(/sorumlu satıcısı yok/i);
  });

  it("pasif doktora sipariş girilemez", () => {
    const r = canSellerOrderForDoctor(SELLER_A, {
      ownerSellerId: SELLER_A,
      status: "PASSIVE",
    });
    expect(r.allowed).toBe(false);
  });

  it("pasiflik, sahiplikten ÖNCE değerlendirilir", () => {
    // Sahibi olmayan + pasif doktorda mesaj pasiflik olmalı (bilgi sızıntısı yok).
    const r = canSellerOrderForDoctor(SELLER_B, {
      ownerSellerId: SELLER_A,
      status: "PASSIVE",
    });
    if (r.allowed) throw new Error("beklenmedik izin");
    expect(r.reason).toMatch(/pasif/i);
  });
});

describe("doctorScopeFor — FR-05 görünürlük", () => {
  it("admin tüm doktorları görür (kısıt yok)", () => {
    expect(doctorScopeFor({ id: "admin-1", role: "ADMIN" })).toEqual({});
  });

  it("satıcı yalnızca kendi portföyünü görür", () => {
    expect(doctorScopeFor({ id: SELLER_A, role: "SELLER" })).toEqual({
      ownerSellerId: SELLER_A,
    });
  });

  it("bilinmeyen rol de kısıtlanır (varsayılan kapalı)", () => {
    expect(doctorScopeFor({ id: "x", role: "DEALER" })).toEqual({
      ownerSellerId: "x",
    });
  });
});
