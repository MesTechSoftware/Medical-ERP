import { describe, expect, it } from "vitest";
import { donusAdresi } from "./donus-adresi";

describe("donusAdresi (A-3-8)", () => {
  it("kapalı listedeki adresleri korur", () => {
    expect(donusAdresi("/orders", "s1")).toBe("/orders");
    expect(donusAdresi("/orders?detay=s1&durum=BEKLIYOR", "s1")).toBe("/orders?detay=s1&durum=BEKLIYOR");
    expect(donusAdresi("/shipping?durum=KARGOLANDI", "s1")).toBe("/shipping?durum=KARGOLANDI");
    expect(donusAdresi("/orders/s1", "s1")).toBe("/orders/s1");
  });
  it("dış, bozuk ve başka yolları varsayılana düşürür", () => {
    for (const ham of ["//evil.com", "https://evil.com", "/\\evil.com", "", null, undefined, "/orders/baska", "/approvals", "/orders\\x", "javascript:alert(1)"]) {
      expect(donusAdresi(ham, "s1")).toBe("/orders/s1");
    }
  });
});
