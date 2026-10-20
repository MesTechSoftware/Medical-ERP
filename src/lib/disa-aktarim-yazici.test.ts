import { crc32 } from "node:zlib";

import { describe, expect, it } from "vitest";

import { csvYaz, xlsxYaz } from "@/lib/disa-aktarim-yazici";
import type { VeriSetiCiktisi } from "@/lib/disa-aktarim";

// D-5-1 — format katmanı iş kavramı tanımaz; metin formül olarak yorumlanmaz.
const c: VeriSetiCiktisi = {
  kolonlar: [
    { baslik: "Cari", tip: "metin" },
    { baslik: "Tutar", tip: "sayi" },
    { baslik: "Tarih", tip: "tarih" },
  ],
  satirlar: [
    ['Dr. "Ayşe"; Kaya & <Ltd>', "1250.50", "2026-10-20"],
    ["=HYPERLINK(\"http://x\")", "-3.10", null],
  ],
};

/** Sıkıştırmasız ZIP'in yerel başlıklarını okur: ad → içerik (CRC doğrulanır). */
function zipOku(b: Buffer): Map<string, string> {
  const dosyalar = new Map<string, string>();
  for (let o = 0; b.readUInt32LE(o) === 0x04034b50; ) {
    const crc = b.readUInt32LE(o + 14);
    const boy = b.readUInt32LE(o + 18);
    const adBoy = b.readUInt16LE(o + 26);
    const ad = b.subarray(o + 30, o + 30 + adBoy).toString("utf8");
    const icerik = b.subarray(o + 30 + adBoy, o + 30 + adBoy + boy);
    expect(crc32(icerik), ad).toBe(crc);
    dosyalar.set(ad, icerik.toString("utf8"));
    o += 30 + adBoy + boy;
  }
  return dosyalar;
}

describe("CSV (D-5-1)", () => {
  it("UTF-8 BOM, ';' ayraç, tırnaklama; formülle başlayan metne ' öneki, sayıya değil", () => {
    const metin = csvYaz(c).toString("utf8");
    expect(metin.startsWith("﻿")).toBe(true);
    expect(metin.slice(1).split("\r\n")).toEqual([
      "Cari;Tutar;Tarih",
      '"Dr. ""Ayşe""; Kaya & <Ltd>";1250.50;2026-10-20',
      '"\'=HYPERLINK(""http://x"")";-3.10;',
      "",
    ]);
  });
});

describe("XLSX (D-5-1)", () => {
  it("geçerli paket: parçalar ve CRC; sayı hücresi sayı, metin satır içi ve kaçışlı", () => {
    const z = zipOku(xlsxYaz(c));
    expect([...z.keys()]).toEqual([
      "[Content_Types].xml",
      "_rels/.rels",
      "xl/workbook.xml",
      "xl/_rels/workbook.xml.rels",
      "xl/worksheets/sheet1.xml",
    ]);
    const sayfa = z.get("xl/worksheets/sheet1.xml")!;
    expect(sayfa).toContain('<c r="B2"><v>1250.50</v></c>');
    expect(sayfa).toContain('<c r="B3"><v>-3.10</v></c>');
    expect(sayfa).toContain("Dr. &quot;Ayşe&quot;; Kaya &amp; &lt;Ltd&gt;");
    // Formül hücresi (<f>) hiç yazılmaz; "=..." metin olarak kalır.
    expect(sayfa).not.toContain("<f>");
    expect(sayfa).toContain('<c r="A3" t="inlineStr"><is><t xml:space="preserve">=HYPERLINK');
    expect(sayfa).not.toContain('r="C3"'); // boş hücre yazılmaz
  });

  it("aynı veri aynı baytı verir", () => {
    expect(xlsxYaz(c).equals(xlsxYaz(c))).toBe(true);
  });
});
