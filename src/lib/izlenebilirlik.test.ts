import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { matrisKur, matrisMetni, ozet } from "@/lib/izlenebilirlik";

// X-7-1 — izlenebilirlik matrisi KABUL_KRITERLERI.md'den üretilir; bayatlayamaz, sınır %15.
const KOK = join(__dirname, "..", "..");
const satirlar = matrisKur(KOK);

describe("izlenebilirlik matrisi (X-7-1)", () => {
  it("docs/TRACEABILITY.md güncel — değilse `npm run izlenebilirlik`", () => {
    expect(readFileSync(join(KOK, "docs", "TRACEABILITY.md"), "utf8")).toBe(matrisMetni(satirlar));
  });

  it("kriterlerin andığı test dosyaları depoda var", () => {
    expect(satirlar.filter((s) => s.eksikTest.length > 0).map((s) => `${s.kod}: ${s.eksikTest.join(", ")}`)).toEqual([]);
  });

  it("TESTSIZ oranı Faz 1 çıkış sınırının (%15) altında", () => {
    expect(ozet(satirlar).oran).toBeLessThan(0.15);
  });
});
