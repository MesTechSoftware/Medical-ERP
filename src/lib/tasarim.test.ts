import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

// ADR-009 — görsel tasarım sistemi: tek token kaynağı, semantik renk, uygulama düzeyinde yoğunluk.
const SRC = join(__dirname, "..");
const css = readFileSync(join(SRC, "app", "globals.css"), "utf8");

function dosyalar(dizin: string, ad: RegExp): string[] {
  return readdirSync(dizin).flatMap((d) => {
    const yol = join(dizin, d);
    if (statSync(yol).isDirectory()) return d === "generated" ? [] : dosyalar(yol, ad);
    return ad.test(d) ? [yol] : [];
  });
}

/** WCAG 2.x göreli parlaklık. */
function parlaklik(hex: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function kontrast(a: string, b: string): number {
  const [x, y] = [parlaklik(a), parlaklik(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

function renk(ad: string): string {
  const m = css.match(new RegExp(`--color-${ad}:\\s*(#[0-9a-f]{6})\\s*;`, "i"));
  if (!m) throw new Error(`--color-${ad} globals.css'te tanımlı değil`);
  return m[1];
}

const SEMANTIK = ["neutral", "positive", "critical", "negative", "information"];

/** Yorumlar atılır (satır sayısı korunur); URL'lerdeki `//` yorum sayılmaz. */
function yorumsuz(kaynak: string): string {
  const bosalt = (y: string) => y.replace(/[^\n]/g, " ");
  return kaynak.replace(/\/\*[\s\S]*?\*\//g, bosalt).replace(/(^|[^:"'`])(\/\/.*)$/gm, (_, on, y) => on + bosalt(y));
}

/** JSX açılış etiketi: süslü parantez ve tırnak içindeki `>` (ör. `() =>`) etiketi bitirmez. */
function acilisEtiketi(kaynak: string, bas: number): string {
  let derinlik = 0;
  let tirnak = "";
  for (let i = bas + 1; i < kaynak.length; i++) {
    const c = kaynak[i];
    if (tirnak) {
      if (c === tirnak) tirnak = "";
    } else if (c === '"' || c === "'" || c === "`") tirnak = c;
    else if (c === "{") derinlik++;
    else if (c === "}") derinlik--;
    else if (c === ">" && derinlik === 0) return kaynak.slice(bas, i + 1);
  }
  return kaynak.slice(bas);
}

describe("görsel tasarım sistemi (ADR-009)", () => {
  it("kontrast hesabı WCAG formülüne uyar", () => {
    expect(kontrast("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(kontrast("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
  });

  it.each(SEMANTIK)("%s: ön plan kendi arka planında ve beyazda ≥ 4,5:1 (WCAG AA)", (ad) => {
    expect(kontrast(renk(ad), renk(`${ad}-bg`))).toBeGreaterThanOrEqual(4.5);
    expect(kontrast(renk(ad), "#ffffff")).toBeGreaterThanOrEqual(4.5);
  });

  it("bağlantı rengi beyazda ≥ 4,5:1", () => {
    expect(kontrast(renk("link"), "#ffffff")).toBeGreaterThanOrEqual(4.5);
  });

  it("yoğunluk uygulama düzeyindedir: kök layout <html data-density> taşır", () => {
    const layout = readFileSync(join(SRC, "app", "layout.tsx"), "utf8");
    expect(layout).toMatch(/<html[^>]*data-density="compact"/);
  });

  it("100vh yok — mobil tarayıcı çubuğu yüzünden dvh kullanılır", () => {
    const ihlal = dosyalar(SRC, /\.(tsx|ts|css)$/)
      .filter((y) => !y.endsWith(".test.ts"))
      .filter((y) => /100vh|\b(?:min-h|max-h|h)-screen\b/.test(readFileSync(y, "utf8")))
      .map((y) => relative(SRC, y));
    expect(ihlal).toEqual([]);
  });

  it("mikro grafik ve KPI bileşenleri sunucuda çizilir — \"use client\" yok, istemciye JS gitmez", () => {
    const ihlal = ["components/grafik", "components/kpi"]
      .filter((d) => existsSync(join(SRC, d)))
      .flatMap((d) => dosyalar(join(SRC, d), /\.(tsx|ts)$/))
      .filter((y) => !y.endsWith(".test.ts") && /^["']use client["']/m.test(readFileSync(y, "utf8")))
      .map((y) => relative(SRC, y));
    expect(ihlal).toEqual([]);
  });

  it("grafiklerde ham renk yok — SVG fill/stroke yalnız token sınıfıyla", () => {
    const ihlal = ["components/grafik", "components/kpi"]
      .filter((d) => existsSync(join(SRC, d)))
      .flatMap((d) => dosyalar(join(SRC, d), /\.tsx$/))
      .filter((y) => /\b(?:fill|stroke)=\{?["'`](?:#|rgb|hsl)/.test(readFileSync(y, "utf8")))
      .map((y) => relative(SRC, y));
    expect(ihlal).toEqual([]);
  });

  it("KPI kartları kurala uyar: dosya başına ≤ 4; iyiYon ve bosDavranisi yazılı; satırın ilk kartı birincil", () => {
    const ekranlar = [...dosyalar(join(SRC, "app"), /\.tsx$/), ...dosyalar(join(SRC, "components"), /\.tsx$/)].filter(
      (y) => !y.includes(join("components", "kpi"))
    );
    const ihlal: string[] = [];
    for (const y of ekranlar) {
      const k = readFileSync(y, "utf8");
      const kartlar = [...k.matchAll(/<KpiCard\b[\s\S]*?\/>/g)].map((m) => m[0]);
      const yer = relative(SRC, y);
      if (kartlar.length > 4) ihlal.push(`${yer}: ${kartlar.length} KpiCard`);
      for (const kart of kartlar) {
        if (!/\biyiYon=/.test(kart) || !/\bbosDavranisi=/.test(kart)) ihlal.push(`${yer}: iyiYon/bosDavranisi eksik`);
      }
      for (const satir of k.matchAll(/<KpiSatiri>([\s\S]*?)<\/KpiSatiri>/g)) {
        const icindekiler = [...satir[1].matchAll(/<KpiCard\b[\s\S]*?\/>/g)].map((m) => m[0]);
        icindekiler.forEach((kart, i) => {
          const birincil = /varyant="birincil"/.test(kart);
          if ((i === 0) !== birincil) ihlal.push(`${yer}: satırın ${i + 1}. kartı ${birincil ? "birincil olmamalı" : "birincil olmalı"}`);
        });
      }
    }
    expect(ihlal).toEqual([]);
  });

  it("her <button> ve buton() sınıflı <Link> bir <Ikon> taşır — ikon + metin", () => {
    const ihlal: string[] = [];
    for (const y of dosyalar(SRC, /\.tsx$/)) {
      const k = yorumsuz(readFileSync(y, "utf8"));
      for (const m of k.matchAll(/<(button|Link)\b/g)) {
        const acilis = acilisEtiketi(k, m.index);
        if (m[1] === "Link" && !acilis.includes("buton(")) continue;
        const kapanis = k.indexOf(`</${m[1]}>`, m.index);
        const icerik = acilis.endsWith("/>") || kapanis < 0 ? "" : k.slice(m.index + acilis.length, kapanis);
        if (!icerik.includes("<Ikon ")) ihlal.push(`${relative(SRC, y)}:${k.slice(0, m.index).split("\n").length}`);
      }
    }
    expect(ihlal).toEqual([]);
  });

  it("arayüzde emoji ve düz metin ok/çarpı yok — ikon yalnız <Ikon> ile", () => {
    const ihlal = dosyalar(SRC, /\.tsx$/)
      .flatMap((y) =>
        yorumsuz(readFileSync(y, "utf8"))
          .split("\n")
          .map((satir, i) => ({ yer: `${relative(SRC, y)}:${i + 1}`, satir }))
      )
      .filter(({ satir }) => /\p{Extended_Pictographic}|[←→‹›✕✓]|(?:^|>)\s*\+ [A-ZÇĞİÖŞÜ]/u.test(satir))
      .map(({ yer, satir }) => `${yer}: ${satir.trim()}`);
    expect(ihlal).toEqual([]);
  });

  it("ham palet renk sınıfı yok — renk yalnız semantik token'dan; nötr griler serbest", () => {
    // slate/gray/zinc/neutral/stone, beyaz ve siyah nötrdür; marka ve semantik token'lar ad taşır.
    const PALET =
      /\b(?:bg|text|border|ring|outline|fill|stroke|from|to|via|divide|decoration|accent|caret)-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/;
    const ihlal = dosyalar(SRC, /\.(tsx|ts)$/)
      .filter((y) => !y.endsWith(".test.ts"))
      .flatMap((y) =>
        readFileSync(y, "utf8")
          .split("\n")
          .map((satir, i) => ({ yer: `${relative(SRC, y)}:${i + 1}`, satir }))
      )
      .filter(({ satir }) => PALET.test(satir))
      .map(({ yer, satir }) => `${yer}: ${satir.trim()}`);
    expect(ihlal).toEqual([]);
  });
});
