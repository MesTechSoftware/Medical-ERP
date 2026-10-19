import { describe, expect, it, vi } from "vitest";

import { policy } from "@/lib/policy";
import { sureAyari, suresiDolduMu, tokenHash } from "@/lib/oturum";

// E-2-1, E-2-2 — oturumun saf kuralları. DB tarafı `oturum.itest.ts`'tedir.
vi.mock("@/lib/db", () => ({ prisma: {} }));

const SAAT = 3_600_000;
const ayar = { hareketsizlikMs: 4 * SAAT, mutlakMs: 12 * SAAT };
const t0 = new Date("2026-10-19T06:00:00Z");
const sonra = (ms: number) => new Date(t0.getTime() + ms);

describe("sureAyari (E-2 §(4))", () => {
  it("süreler policy.ts'ten okunur: 4 saat hareketsizlik, 12 saat mutlak", () => {
    expect(policy.auth.oturumHareketsizlikSaat).toBe(4);
    expect(policy.auth.oturumMutlakSaat).toBe(12);
    expect(sureAyari()).toEqual(ayar);
  });
});

describe("suresiDolduMu (E-2-2)", () => {
  it("hareketsizlik son görülmeden sayılır: 4 saatten az geçtiyse geçerli, 4 saatte dolar", () => {
    const o = { createdAt: t0, lastSeenAt: t0 };
    expect(suresiDolduMu(o, sonra(4 * SAAT - 1), ayar)).toBe(false);
    expect(suresiDolduMu(o, sonra(4 * SAAT), ayar)).toBe(true);
  });

  it("hareketsizlik kayar: son görülme ilerledikçe oturum yaşar", () => {
    const o = { createdAt: t0, lastSeenAt: sonra(3 * SAAT) };
    expect(suresiDolduMu(o, sonra(6 * SAAT), ayar)).toBe(false);
  });

  it("mutlak süre kaymaz: hareket olsa da açılıştan 12 saat sonra dolar", () => {
    const o = { createdAt: t0, lastSeenAt: sonra(12 * SAAT - 60_000) };
    expect(suresiDolduMu(o, sonra(12 * SAAT - 1), ayar)).toBe(false);
    expect(suresiDolduMu(o, sonra(12 * SAAT), ayar)).toBe(true);
  });
});

describe("tokenHash (E-2-1)", () => {
  it("SHA-256 hex döner; token'ın kendisini içermez", () => {
    const h = tokenHash("abc");
    expect(h).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(h).not.toContain("abc");
  });
});
