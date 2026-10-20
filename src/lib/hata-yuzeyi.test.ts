import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

// X-3-1 / X-3-3 — hata yüzeyinin dosya düzeyindeki sözleşmesi. Ekranın kendisi tek bileşendir
// (`HataEkrani`); sınırlar yalnız `digest`'i ona verir.
const APP = join(__dirname, "..", "app");
const SRC = join(__dirname, "..");

const SINIRLAR = [
  "error.tsx",
  "(admin)/orders/error.tsx",
  "(admin)/shipping/error.tsx",
  "(seller)/my-orders/error.tsx",
  "(admin)/collections/error.tsx",
  "(admin)/stock/error.tsx",
];

function dosyalar(dizin: string, ad: RegExp): string[] {
  return readdirSync(dizin).flatMap((d) => {
    const yol = join(dizin, d);
    if (statSync(yol).isDirectory()) return d === "generated" ? [] : dosyalar(yol, ad);
    return ad.test(d) ? [yol] : [];
  });
}

describe("hata sınırları (X-3-1)", () => {
  it("global-error kendi html/body'siyle gelir ve ortak ekranı kullanır", () => {
    const k = readFileSync(join(APP, "global-error.tsx"), "utf8");
    expect(k).toMatch(/<html[\s>]/);
    expect(k).toMatch(/<body[\s>]/);
    expect(k).toMatch(/<HataEkrani referans=\{error\.digest\} \/>/);
  });

  it("kök ve kritik segmentlerde error.tsx vardır ve ortak ekranı kullanır", () => {
    for (const yol of SINIRLAR) {
      expect(existsSync(join(APP, yol)), yol).toBe(true);
      expect(readFileSync(join(APP, yol), "utf8"), yol).toMatch(/<HataEkrani referans=\{error\.digest\} \/>/);
    }
  });

  it("hiçbir hata ekranı hata mesajını ya da stack'i göstermez", () => {
    const ekranlar = [...dosyalar(APP, /^(global-)?error\.tsx$/), join(SRC, "components", "HataEkrani.tsx")];
    for (const yol of ekranlar) {
      expect(readFileSync(yol, "utf8"), relative(SRC, yol)).not.toMatch(/\.message|\.stack|console\./);
    }
  });
});

describe("sessiz hata yasağı (X-3-3)", () => {
  const actionlar = dosyalar(SRC, /^(actions|auth-actions)\.ts$/);

  it("server action'lar yakaladığı hatanın mesajını kullanıcıya döndürmez", () => {
    // Tek istisna `IsHatasi`'dir: mesajı sabit iş metnidir ve yalnız `instanceof` kontrolünden sonra döner.
    for (const yol of actionlar) {
      const k = readFileSync(yol, "utf8");
      const tumu = [...k.matchAll(/\b(e|err|error)\.message\b/g)].length;
      const izinli = [...k.matchAll(/instanceof IsHatasi\) return \{ error: e\.message/g)].length;
      expect(tumu, relative(SRC, yol)).toBe(izinli);
    }
  });

  it("server action'larda gövdesiz catch yoktur; yakalanan her hata ya tanınır ya yeniden fırlatılır", () => {
    for (const yol of actionlar) {
      const k = readFileSync(yol, "utf8");
      const ad = relative(SRC, yol);
      expect(k, ad).not.toMatch(/catch\s*\{/);
      const catchSayisi = [...k.matchAll(/catch\s*\((\w+)\)/g)].length;
      const yenidenFirlatma = [...k.matchAll(/throw (e|err|error);/g)].length;
      expect(yenidenFirlatma, ad).toBe(catchSayisi);
    }
  });

  it("denetim kaydı hatayı yutmaz ve daima bir transaction/istemci alır", () => {
    const k = readFileSync(join(SRC, "lib", "audit.ts"), "utf8");
    expect(k).toMatch(/export async function createAuditLog\(input: AuditInput, db: Prisma\.TransactionClient\)/);
    expect(k).not.toMatch(/catch/);
  });
});
