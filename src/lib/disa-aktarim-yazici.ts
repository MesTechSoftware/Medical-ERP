import { crc32 } from "node:zlib";

import type { VeriSetiCiktisi } from "@/lib/disa-aktarim";

/**
 * Format katmanı — K-4 §(2), D-5 §(9). İş kavramı TANIMAZ: `{ kolonlar, satirlar }` alır,
 * dosya baytı verir. Excel (XLSX) ve CSV; PDF/XML Faz 2+.
 *
 * - Sayı kolonu XLSX'te sayı hücresidir (ondalık metin olduğu gibi yazılır, float'a çevrilmez).
 * - Metin hücresi formül olarak yorumlanmaz: XLSX'te satır içi metindir; CSV'de `= + - @`
 *   ve sekme/satır başıyla başlayan metne `'` öneki konur (formül enjeksiyonu).
 * - CSV: UTF-8 BOM, `;` ayraç, ondalık `.` — makine okumasına göredir.
 */

export type Bicim = "xlsx" | "csv";

const FORMUL_BASI = /^[=+\-@\t\r]/;

function csvHucre(deger: string | null, sayiMi: boolean): string {
  if (deger === null) return "";
  const guvenli = !sayiMi && FORMUL_BASI.test(deger) ? `'${deger}` : deger;
  return /[;"\r\n]/.test(guvenli) ? `"${guvenli.replace(/"/g, '""')}"` : guvenli;
}

export function csvYaz(c: VeriSetiCiktisi): Buffer {
  const sayiMi = c.kolonlar.map((k) => k.tip === "sayi");
  const satirlar = [
    c.kolonlar.map((k) => csvHucre(k.baslik, false)).join(";"),
    ...c.satirlar.map((s) => s.map((h, i) => csvHucre(h, sayiMi[i])).join(";")),
  ];
  return Buffer.from("﻿" + satirlar.join("\r\n") + "\r\n", "utf8");
}

// --- XLSX --------------------------------------------------------------------------

const xml = (s: string) =>
  s
    // XML 1.0'da yasak kontrol karakterleri atılır.
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function kolonAdi(n: number): string {
  let ad = "";
  for (let i = n + 1; i > 0; i = Math.floor((i - 1) / 26)) ad = String.fromCharCode(65 + ((i - 1) % 26)) + ad;
  return ad;
}

function sayfa(c: VeriSetiCiktisi): string {
  const sayiMi = c.kolonlar.map((k) => k.tip === "sayi");
  const metinHucre = (r: string, v: string) => `<c r="${r}" t="inlineStr"><is><t xml:space="preserve">${xml(v)}</t></is></c>`;
  const satir = (no: number, hucreler: string[]) => `<row r="${no}">${hucreler.join("")}</row>`;
  const baslik = satir(1, c.kolonlar.map((k, i) => metinHucre(`${kolonAdi(i)}1`, k.baslik)));
  const govde = c.satirlar.map((s, n) =>
    satir(
      n + 2,
      s.flatMap((h, i) => {
        if (h === null) return [];
        const r = `${kolonAdi(i)}${n + 2}`;
        return [sayiMi[i] && /^-?\d+(\.\d+)?$/.test(h) ? `<c r="${r}"><v>${h}</v></c>` : metinHucre(r, h)];
      })
    )
  );
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    `<sheetData>${baslik}${govde.join("")}</sheetData></worksheet>`
  );
}

const PARCALAR = {
  "[Content_Types].xml":
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
    "</Types>",
  "_rels/.rels":
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
    "</Relationships>",
  "xl/workbook.xml":
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    '<sheets><sheet name="Veri" sheetId="1" r:id="rId1"/></sheets></workbook>',
  "xl/_rels/workbook.xml.rels":
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
    "</Relationships>",
};

/** Sıkıştırmasız (stored) ZIP. Tarih alanı sabittir (1980-01-01): aynı veri aynı baytı verir. */
function zip(dosyalar: [ad: string, icerik: Buffer][]): Buffer {
  const yerel: Buffer[] = [];
  const merkez: Buffer[] = [];
  let ofset = 0;
  for (const [ad, icerik] of dosyalar) {
    const adB = Buffer.from(ad, "utf8");
    const crc = crc32(icerik);
    const ortak = (b: Buffer, o: number) => {
      b.writeUInt16LE(20, o); // gereken sürüm
      b.writeUInt16LE(0x0800, o + 2); // UTF-8 ad
      b.writeUInt16LE(0, o + 4); // stored
      b.writeUInt16LE(0, o + 6); // saat
      b.writeUInt16LE(33, o + 8); // 1980-01-01
      b.writeUInt32LE(crc, o + 10);
      b.writeUInt32LE(icerik.length, o + 14);
      b.writeUInt32LE(icerik.length, o + 18);
      b.writeUInt16LE(adB.length, o + 22);
      b.writeUInt16LE(0, o + 24); // ek alan
    };
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0);
    ortak(lh, 4);
    yerel.push(lh, adB, icerik);

    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0);
    ch.writeUInt16LE(20, 4); // oluşturan sürüm
    ortak(ch, 6);
    // 32: yorum, 34: disk, 36: iç nitelik, 38: dış nitelik — sıfır
    ch.writeUInt32LE(ofset, 42);
    merkez.push(ch, adB);
    ofset += lh.length + adB.length + icerik.length;
  }
  const merkezB = Buffer.concat(merkez);
  const son = Buffer.alloc(22);
  son.writeUInt32LE(0x06054b50, 0);
  son.writeUInt16LE(dosyalar.length, 8);
  son.writeUInt16LE(dosyalar.length, 10);
  son.writeUInt32LE(merkezB.length, 12);
  son.writeUInt32LE(ofset, 16);
  return Buffer.concat([...yerel, merkezB, son]);
}

export function xlsxYaz(c: VeriSetiCiktisi): Buffer {
  return zip([
    ...Object.entries(PARCALAR).map(([ad, x]): [string, Buffer] => [ad, Buffer.from(x, "utf8")]),
    ["xl/worksheets/sheet1.xml", Buffer.from(sayfa(c), "utf8")],
  ]);
}

export const BICIM: Record<Bicim, { yaz: (c: VeriSetiCiktisi) => Buffer; mime: string; uzanti: string }> = {
  xlsx: { yaz: xlsxYaz, mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", uzanti: "xlsx" },
  csv: { yaz: csvYaz, mime: "text/csv;charset=utf-8", uzanti: "csv" },
};
