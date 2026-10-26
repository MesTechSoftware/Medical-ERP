import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import Decimal from "decimal.js";

import { describe, expect, it } from "vitest";

import { cubukOranlari, degisimYuzdesi, olcekle, yon } from "@/lib/kpi/olcek";

// X-5 eki (26.10.2026): gösterim ölçeği yalnız bu dosyadadır, boyutsuz değer döndürür.
const SRC = join(__dirname, "..", "..");

function dosyalar(dizin: string): string[] {
  return readdirSync(dizin).flatMap((d) => {
    const yol = join(dizin, d);
    if (statSync(yol).isDirectory()) return d === "generated" ? [] : dosyalar(yol);
    return /\.(ts|tsx)$/.test(d) && !/\.(test|itest)\.ts$/.test(d) ? [yol] : [];
  });
}

describe("degisimYuzdesi — dönem değişimi (X-5-2)", () => {
  it("yüzdeyi 1 ondalığa, yarım yukarı yuvarlar", () => {
    expect(degisimYuzdesi("112.34", "100")).toEqual({ tur: "yuzde", deger: 12.3 });
    expect(degisimYuzdesi("100.05", "100")).toEqual({ tur: "yuzde", deger: 0.1 });
    expect(degisimYuzdesi("80", "100")).toEqual({ tur: "yuzde", deger: -20 });
  });

  it("taban 0: şimdi pozitifse 'yeni', ikisi de 0 ise %0, şimdi negatifse yüzde yok", () => {
    expect(degisimYuzdesi("50", "0")).toEqual({ tur: "yeni" });
    expect(degisimYuzdesi("0", "0")).toEqual({ tur: "yuzde", deger: 0 });
    expect(degisimYuzdesi("-5", "0")).toEqual({ tur: "yok" });
  });

  it("negatif tabanda (iadesi sevkinden büyük dönem) yüzde yoktur", () => {
    expect(degisimYuzdesi("100", "-20")).toEqual({ tur: "yok" });
  });

  it("şimdi negatif olabilir; değer eksikse yüzde yoktur", () => {
    expect(degisimYuzdesi("-50", "100")).toEqual({ tur: "yuzde", deger: -150 });
    expect(degisimYuzdesi(null, "100")).toEqual({ tur: "yok" });
    expect(degisimYuzdesi("100", null)).toEqual({ tur: "yok" });
  });

  it("çok büyük tutarda hassasiyet kaybı yüzdeye sızmaz", () => {
    expect(degisimYuzdesi("1000000000000001.00", "1000000000000000.00")).toEqual({ tur: "yuzde", deger: 0 });
    expect(degisimYuzdesi("2000000000000000.00", "1000000000000000.00")).toEqual({ tur: "yuzde", deger: 100 });
  });

  it("Prisma Decimal benzeri ve sayı girdisini kabul eder", () => {
    const prisma = { toFixed: () => "150.00" };
    expect(degisimYuzdesi(prisma, 100)).toEqual({ tur: "yuzde", deger: 50 });
    expect(degisimYuzdesi(new Decimal("75"), new Decimal("100"))).toEqual({ tur: "yuzde", deger: -25 });
  });
});

describe("yon — yalnız karşılaştırma", () => {
  it("artış, azalış, eşit; değer eksikse yok", () => {
    expect(yon("2", "1")).toBe("artis");
    expect(yon("1", "2")).toBe("azalis");
    expect(yon("1.00", "1")).toBe("esit");
    expect(yon(null, "1")).toBeNull();
  });
});

describe("olcekle — SVG geometrisi (X-5-2)", () => {
  const alan = { genislik: 100, yukseklik: 20 };

  it("noktaları alana yayar; en büyük üstte, sıfır tabanda", () => {
    const { noktalar, tabanY } = olcekle(["0", "5", "10"], alan);
    expect(noktalar).toEqual([
      { x: 0, y: 20 },
      { x: 50, y: 10 },
      { x: 100, y: 0 },
    ]);
    expect(tabanY).toBe(20);
  });

  it("boşluk korunur, araya nokta uydurulmaz", () => {
    const { noktalar } = olcekle(["10", null, "10"], alan);
    expect(noktalar[1]).toBeNull();
    expect(noktalar[0]).toEqual({ x: 0, y: 0 });
  });

  it("negatif değer sıfır çizgisinin altına düşer", () => {
    const { noktalar, tabanY } = olcekle(["10", "-10"], alan);
    expect(tabanY).toBe(10);
    expect(noktalar[1]).toEqual({ x: 100, y: 20 });
  });

  it("hepsi sıfırsa çizgi ortadadır; tek nokta yatay ortadadır", () => {
    expect(olcekle(["0", "0"], alan).noktalar.map((n) => n!.y)).toEqual([10, 10]);
    expect(olcekle(["7"], alan).noktalar[0]!.x).toBe(50);
  });

  it("çok büyük tutarda oran doğru kalır", () => {
    const { noktalar } = olcekle(["1000000000000000.00", "500000000000000.00"], alan);
    expect(noktalar.map((n) => n!.y)).toEqual([0, 10]);
  });
});

describe("cubukOranlari — en büyüğe oran", () => {
  it("[0,1] aralığında, 0,001'e yuvarlı; sıfır ve negatif 0, boşluk null", () => {
    expect(cubukOranlari(["200", "50", "0", "-10", null])).toEqual([1, 0.25, 0, 0, null]);
    expect(cubukOranlari(["3", "1"])).toEqual([1, 0.333]);
  });

  it("hepsi sıfırsa oranlar 0", () => {
    expect(cubukOranlari(["0", "0"])).toEqual([0, 0]);
  });
});

describe("X-5 sınırı — kaynak taraması (X-5-2)", () => {
  it("Decimal bölmesi ve number'a çevirme yalnız X-5 §(4) dosyalarında ve kpi/olcek.ts'te", () => {
    const izinli = new Set(["lib/satir-tutarlari.ts", "lib/fiyat.ts", "lib/kpi/olcek.ts"]);
    const ihlal = dosyalar(SRC)
      .map((y) => relative(SRC, y).split("\\").join("/"))
      .filter((y) => !izinli.has(y))
      .filter((y) => /\.(div|dividedBy|toNumber)\(/.test(readFileSync(join(SRC, y), "utf8")));
    expect(ihlal).toEqual([]);
  });

  it("olcek.ts dışarıya Decimal döndürmez — yalnız boyutsuz değer", () => {
    const kaynak = readFileSync(join(SRC, "lib", "kpi", "olcek.ts"), "utf8");
    const imzalar = [...kaynak.matchAll(/export function \w+\([^)]*\)\s*:\s*([^{]+)\{/g)].map((m) => m[1]);
    expect(imzalar.length).toBeGreaterThan(0);
    expect(imzalar.filter((donus) => /Decimal/.test(donus))).toEqual([]);
  });
});
