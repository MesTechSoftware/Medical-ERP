import { describe, expect, it, vi } from "vitest";

// audit.ts, prisma'yı import ettiği için (DB bağlantısı istemesin diye) mock'la.
vi.mock("@/lib/db", () => ({ prisma: {} }));

const { sanitizeAuditData } = await import("@/lib/audit");

describe("sanitizeAuditData", () => {
  it("hassas alanları çıkarır", () => {
    const out = sanitizeAuditData({
      name: "Ahmet",
      passwordHash: "$2a$10$gizli",
      token: "abc",
    });
    expect(out).toEqual({ name: "Ahmet" });
  });

  it("iç içe nesnelerde de temizler", () => {
    const out = sanitizeAuditData({ user: { name: "Ayşe", password: "x" } });
    expect(out).toEqual({ user: { name: "Ayşe" } });
  });

  it("Date'i ISO string'e çevirir", () => {
    const out = sanitizeAuditData({ at: new Date("2026-07-23T00:00:00.000Z") });
    expect(out).toEqual({ at: "2026-07-23T00:00:00.000Z" });
  });

  // Regresyon: parasal alanlar BigInt kuruş. JSON.stringify BigInt'te TypeError
  // atar; serialize() bunu yutup null döndüğü için audit kaydı SESSİZCE boşalırdı.
  it("BigInt'i string'e çevirir ve JSON.stringify'ı kırmaz", () => {
    const out = sanitizeAuditData({ totalAmount: 714000_00n });
    expect(out).toEqual({ totalAmount: "71400000" });
    expect(() => JSON.stringify(out)).not.toThrow();
  });

  it("BigInt içeren dizileri de işler", () => {
    const out = sanitizeAuditData([{ lineTotal: 100n }, { lineTotal: 250n }]);
    expect(JSON.stringify(out)).toBe(
      '[{"lineTotal":"100"},{"lineTotal":"250"}]'
    );
  });
});
