import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { describe, expect, it } from "vitest";

import { Tutar } from "@/components/Tutar";
import { BRUT, MATRAH, SATIR_TABANI, TABAN_ETIKETI, tabanli } from "@/lib/taban";

// Ü-3-1 — ekrandaki her para tutarının yanında vergi tabanı yazılıdır (Ü-3 §(6)/(7)/(13)).
const SRC = join(__dirname, "..");

function dosyalar(dizin: string, ad: RegExp): string[] {
  return readdirSync(dizin).flatMap((d) => {
    const yol = join(dizin, d);
    if (statSync(yol).isDirectory()) return d === "generated" ? [] : dosyalar(yol, ad);
    return ad.test(d) ? [yol] : [];
  });
}

const yorumsuz = (k: string) => k.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
/** Her `formatla(` çağrısının parantez dengeli argüman metni. */
function formatlaArgumanlari(k: string): string[] {
  const sonuc: string[] = [];
  for (let i = k.indexOf("formatla("); i !== -1; i = k.indexOf("formatla(", i + 1)) {
    let derinlik = 0;
    for (let j = i + "formatla".length; j < k.length; j++) {
      if (k[j] === "(") derinlik++;
      else if (k[j] === ")" && --derinlik === 0) {
        sonuc.push(k.slice(i + "formatla(".length, j));
        break;
      }
    }
  }
  return sonuc;
}

const ekranlar = [...dosyalar(join(SRC, "app"), /\.tsx$/), ...dosyalar(join(SRC, "components"), /\.tsx$/)];

const html = (deger: string | null, taban = MATRAH, baslikta = false) =>
  renderToStaticMarkup(createElement(Tutar, { deger, taban, baslikta }));

describe("taban etiketi (Ü-3-1)", () => {
  it("ekran sınıfları sabittir: B brüt, C ve A-matrah KDV hariç, A-toplam KDV dahil", () => {
    expect(BRUT).toBe("KDV_DAHIL");
    expect(MATRAH).toBe("KDV_HARIC");
    expect(SATIR_TABANI).toEqual({ matrah: "KDV_HARIC", kdvTutar: "KDV", toplam: "KDV_DAHIL" });
    expect(tabanli("Ciro", MATRAH)).toBe("Ciro (KDV hariç)");
  });

  it("tutar etiketiyle gösterilir; kolon başlığında etiketliyse hücrede tekrar edilmez", () => {
    expect(html("1250.5")).toMatch(/1\.250,50.*KDV hariç/);
    expect(html("1250.5", BRUT)).toMatch(/KDV dahil/);
    expect(html("1250.5", MATRAH, true)).not.toMatch(/KDV/);
  });

  it("tabanı çözülemeyen tutar boş kalır; sıfır gösterilmez, etiket de yazılmaz (Ü-3 §(13))", () => {
    expect(html(null)).toBe("—");
  });

  it("ekranda para tutarı yalnız <Tutar> ile gösterilir; formatla() ekranda yalnız ham/oran içindir", () => {
    for (const yol of ekranlar) {
      const ad = relative(SRC, yol);
      if (ad === join("components", "Tutar.tsx")) continue;
      for (const arguman of formatlaArgumanlari(yorumsuz(readFileSync(yol, "utf8")))) {
        expect(arguman, ad).toMatch(/,\s*"(ham|oran)"\s*$/);
      }
    }
  });

  it("etiketi başlıkta olan hücrenin dosyası başlığı tabanli() ile yazar", () => {
    for (const yol of ekranlar) {
      const k = yorumsuz(readFileSync(yol, "utf8"));
      if (/<Tutar[^>]*\bbaslikta\b/.test(k)) expect(k, relative(SRC, yol)).toMatch(/tabanli\(/);
    }
  });

  it("taban metni serbest yazılmaz: 'KDV hariç/dahil' yalnız taban.ts'tedir", () => {
    for (const yol of [...ekranlar, ...dosyalar(join(SRC, "lib"), /\.ts$/)]) {
      const ad = relative(SRC, yol);
      if (ad === join("lib", "taban.ts") || /\.i?test\.ts$/.test(ad)) continue;
      expect(yorumsuz(readFileSync(yol, "utf8")), ad).not.toMatch(/KDV (hariç|dahil)|\(net\)/);
    }
    expect(Object.values(TABAN_ETIKETI)).toEqual(["KDV hariç", "KDV dahil", "KDV tutarı"]);
  });
});
