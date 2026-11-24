import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * İzlenebilirlik matrisi — KARARLAR X-7 §(5): kriter × kod × test × karar. `KABUL_KRITERLERI.md`'den
 * üretilir; elle yazılmaz (`npm run izlenebilirlik`). `izlenebilirlik.test.ts` dosyanın güncel olduğunu
 * ve TESTSIZ oranının Faz 1 çıkış sınırının altında kaldığını CI'da denetler.
 *
 * Durumlar:
 * - **KANITLI** — kriter metni var, andığı testlerden en az biri mevcut.
 * - **TESTSIZ** — metin var, mevcut test yok.
 * - **YOK** — metin yazılmamış (1B hedefli satır).
 * - **KAPSAM DIŞI** — konusuz, süreç, Faz 2+ ya da 1A-C8 yokluk satırı (anti-şema testi kanıtlar).
 */
export type Durum = "KANITLI" | "TESTSIZ" | "YOK" | "KAPSAM DIŞI";
export type MatrisSatiri = {
  kod: string;
  karar: string;
  kriter: string;
  kodYeri: string[];
  testler: string[];
  /** Kriterin andığı ama depoda bulunmayan test dosyaları. */
  eksikTest: string[];
  durum: Durum;
};

function dosyalar(dizin: string, uzanti: RegExp): string[] {
  if (!existsSync(dizin)) return [];
  return readdirSync(dizin).flatMap((d) => {
    const yol = join(dizin, d);
    if (statSync(yol).isDirectory()) return d === "generated" ? [] : dosyalar(yol, uzanti);
    return uzanti.test(d) ? [yol] : [];
  });
}

export function matrisKur(kok: string): MatrisSatiri[] {
  const kabul = readFileSync(join(kok, "docs", "KABUL_KRITERLERI.md"), "utf8");
  const kaynaklar = dosyalar(join(kok, "src"), /\.tsx?$/).filter((y) => !/\.(i?test)\.ts$/.test(y));
  const testDosyalari = [...dosyalar(join(kok, "src"), /\.(i?test)\.ts$/), ...dosyalar(join(kok, "e2e"), /\.(spec|setup)\.ts$/)].map((y) =>
    relative(kok, y).split("\\").join("/")
  );
  // Dışa açılan fonksiyon/sabit adı → dosya (kriter metnindeki `ad` kod yerine çözülür).
  const tanim = new Map<string, string>();
  for (const y of kaynaklar) {
    for (const m of readFileSync(y, "utf8").matchAll(/^export (?:async )?(?:function|const|class) (\w+)/gm)) {
      if (!tanim.has(m[1])) tanim.set(m[1], relative(kok, y).split("\\").join("/"));
    }
  }

  const satirlar: MatrisSatiri[] = [];
  for (const m of kabul.matchAll(/^\| ((?:[A-ZÜ]{1,2}|§)[\d.]*-[\d-]+) \|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*$/gm)) {
    const [, kod, kriter, yer] = m;
    const karar = kod.replace(/-\d+$/, "");
    const adlar = [...kriter.matchAll(/`([A-Za-zçğıöşüÇĞİÖŞÜ_]\w*)(?:\(\))?`/g)].map((x) => x[1]);
    const kodYeri = [...new Set(adlar.flatMap((a) => (tanim.has(a) ? [tanim.get(a)!] : [])))];
    const anilan = [...yer.matchAll(/`([\w./-]+\.(?:i?test|spec)\.ts)`/g)].map((x) => x[1]);
    const eslesen = (t: string) => testDosyalari.filter((d) => d === t || d.endsWith(`/${t}`));
    const testler = [...new Set(anilan.flatMap((t) => (eslesen(t).length === 1 ? eslesen(t) : [])))];
    const kapsamDisi = /konusuz|süreç|Faz 2|Faz 3|1A-C8/.test(yer) && !/1B-/.test(yer);
    const durum: Durum =
      kriter.trim() === "" ? (kapsamDisi ? "KAPSAM DIŞI" : "YOK") : testler.length > 0 ? "KANITLI" : kapsamDisi ? "KAPSAM DIŞI" : "TESTSIZ";
    // Bulunamayan ya da birden çok dosyaya uyan ad (yolla netleştirilmeli) eksik sayılır.
    const eksikTest = anilan.filter((t) => eslesen(t).length !== 1).map((t) => (eslesen(t).length > 1 ? `${t} (belirsiz)` : t));
    satirlar.push({ kod, karar, kriter: kriter.trim(), kodYeri, testler, eksikTest, durum });
  }
  return satirlar;
}

export function ozet(satirlar: readonly MatrisSatiri[]) {
  const say = (d: Durum) => satirlar.filter((s) => s.durum === d).length;
  const kanitli = say("KANITLI");
  const testsiz = say("TESTSIZ") + say("YOK");
  return { kanitli, testsiz: say("TESTSIZ"), yok: say("YOK"), kapsamDisi: say("KAPSAM DIŞI"), oran: testsiz / Math.max(1, kanitli + testsiz) };
}

export function matrisMetni(satirlar: readonly MatrisSatiri[]): string {
  const o = ozet(satirlar);
  const kisa = (s: string) => (s.length > 140 ? `${s.slice(0, 137).trimEnd()}…` : s).replaceAll("|", "\\|");
  return [
    "# İzlenebilirlik Matrisi — kriter × kod × test × karar",
    "<!-- ÜRETİLMİŞ DOSYA — elle düzenlenmez: `npm run izlenebilirlik` (src/lib/izlenebilirlik.ts). -->",
    "",
    "> **Kaynak:** `KABUL_KRITERLERI.md` (KARARLAR X-7 §(5)). Durum: **KANITLI** (andığı test mevcut) · **TESTSIZ**",
    "> (metin var, test yok) · **YOK** (metin yazılmamış) · **KAPSAM DIŞI** (konusuz, süreç, Faz 2+, 1A-C8 yokluk).",
    "> Kod yeri, kriter metninde anılan fonksiyonun tanımlandığı dosyadır. Eski PRD matrisi (8 Ağustos 2026)",
    "> `docs/arsiv/TRACEABILITY_PRD_V2.md`'dedir.",
    "",
    `**Özet:** ${o.kanitli} KANITLI · ${o.testsiz} TESTSIZ · ${o.yok} YOK · ${o.kapsamDisi} KAPSAM DIŞI — ` +
      `**TESTSIZ oranı %${(o.oran * 100).toFixed(1)}** (Faz 1 çıkış sınırı %15; YOL_HARITASI §3).`,
    "",
    "| Kriter | Karar | Durum | Kod yeri | Test | Kriter metni |",
    "|---|---|---|---|---|---|",
    ...satirlar.map(
      (s) =>
        `| ${s.kod} | ${s.karar} | ${s.durum} | ${s.kodYeri.map((k) => `\`${k}\``).join("<br>") || "—"} | ${
          s.testler.map((t) => `\`${t}\``).join("<br>") || "—"
        } | ${kisa(s.kriter) || "—"} |`
    ),
    "",
  ].join("\n");
}
