import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

// Tek çağrı noktası koruması (KARARLAR §1.3 (9), FAZ1 §B.6): bir iş kuralının
// formülü yalnız kendi dosyasında yazılır. Kaynak taranır; test dosyaları ve
// Prisma'nın ürettiği istemci hariçtir.

const KOK = join(__dirname, "..");

function kaynaklar(dizin: string): string[] {
  return readdirSync(dizin).flatMap((ad) => {
    const yol = join(dizin, ad);
    if (statSync(yol).isDirectory()) return ad === "generated" ? [] : kaynaklar(yol);
    return /\.(ts|tsx)$/.test(ad) && !/\.(test|itest)\.ts$/.test(ad) ? [yol] : [];
  });
}

function ihlaller(desen: RegExp, izinli: string): string[] {
  return kaynaklar(KOK)
    .map((yol) => relative(KOK, yol))
    .filter((yol) => yol !== izinli && desen.test(readFileSync(join(KOK, yol), "utf8")));
}

describe("tek çağrı noktası — cari bakiye (K-2-4)", () => {
  it("LedgerEntry toplamı yalnız doctor-cari.ts'de alınır", () => {
    const desen = /FROM\s+"LedgerEntry"|ledgerEntry\.(aggregate|groupBy)\s*\(/;
    expect(ihlaller(desen, join("lib", "doctor-cari.ts"))).toEqual([]);
  });
});

describe("tek çağrı noktası — stok yazımı ve kilit (B-4-2)", () => {
  it("stok hareketi yalnız stok.ts'de yazılır", () => {
    const desen = /stockMovement\.(create|createMany|upsert|update|updateMany)\s*\(|INSERT\s+INTO\s+"StockMovement"/;
    expect(ihlaller(desen, join("lib", "stok.ts"))).toEqual([]);
  });

  it("FOR UPDATE yalnız stok.ts'de geçer (ADR-008 §(6))", () => {
    expect(ihlaller(/FOR\s+UPDATE/i, join("lib", "stok.ts"))).toEqual([]);
  });
});

describe("tek çağrı noktası — onay bloğu (A-8-6)", () => {
  it("OnayBlogu yalnız onay-blogu.ts'de yazılır", () => {
    const desen = /approvalBlock\.(create|createMany|upsert|update|updateMany|delete|deleteMany)\s*\(|INSERT\s+INTO\s+"ApprovalBlock"/;
    expect(ihlaller(desen, join("lib", "onay-blogu.ts"))).toEqual([]);
  });
});
