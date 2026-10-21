import { crc32, deflateRawSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { xlsxKitap } from "@/lib/disa-aktarim-yazici";
import { XlsxHatasi, xlsxIlkSayfa } from "@/lib/xlsx-okuyucu";

/** Excel'in ürettiği gibi sıkıştırılmış (deflate) zip — test yardımcısı. */
function deflateZip(dosyalar: [string, string][]): Buffer {
  const yerel: Buffer[] = [];
  const merkez: Buffer[] = [];
  let ofset = 0;
  for (const [ad, metin] of dosyalar) {
    const ic = Buffer.from(metin, "utf8");
    const sik = deflateRawSync(ic);
    const adB = Buffer.from(ad);
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(8, 8);
    lh.writeUInt32LE(crc32(ic), 14);
    lh.writeUInt32LE(sik.length, 18);
    lh.writeUInt32LE(ic.length, 22);
    lh.writeUInt16LE(adB.length, 26);
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0);
    ch.writeUInt16LE(8, 10);
    ch.writeUInt32LE(crc32(ic), 16);
    ch.writeUInt32LE(sik.length, 20);
    ch.writeUInt32LE(ic.length, 24);
    ch.writeUInt16LE(adB.length, 28);
    ch.writeUInt32LE(ofset, 42);
    yerel.push(lh, adB, sik);
    merkez.push(ch, adB);
    ofset += 30 + adB.length + sik.length;
  }
  const m = Buffer.concat(merkez);
  const son = Buffer.alloc(22);
  son.writeUInt32LE(0x06054b50, 0);
  son.writeUInt16LE(dosyalar.length, 8);
  son.writeUInt16LE(dosyalar.length, 10);
  son.writeUInt32LE(m.length, 12);
  son.writeUInt32LE(ofset, 16);
  return Buffer.concat([...yerel, m, son]);
}

describe("xlsxIlkSayfa — içe aktarım okuyucusu (D-6)", () => {
  it("kendi yazıcımızın çok sayfalı kitabından ilk sayfayı okur", () => {
    const b = xlsxKitap([
      { ad: "Veri", kolonlar: [{ baslik: "Ad", tip: "metin" }, { baslik: "Adet", tip: "sayi" }], satirlar: [["Ayşe & Co <x>", "12"], [null, "3"]] },
      { ad: "Açıklama", kolonlar: [{ baslik: "Kolon", tip: "metin" }], satirlar: [["yok sayılır"]] },
    ]);
    expect(xlsxIlkSayfa(b)).toEqual([
      { no: 1, hucreler: ["Ad", "Adet"] },
      { no: 2, hucreler: ["Ayşe & Co <x>", "12"] },
      { no: 3, hucreler: [null, "3"] },
    ]);
  });

  it("Excel biçimi: deflate, paylaşılan metin (zengin dahil), boş satır atlanır ama numara korunur, boşluklu hücre", () => {
    const b = deflateZip([
      ["[Content_Types].xml", "<Types/>"],
      ["xl/workbook.xml", '<workbook xmlns:r="r"><sheets><sheet name="Cari" sheetId="1" r:id="rId3"/></sheets></workbook>'],
      ["xl/_rels/workbook.xml.rels", '<Relationships><Relationship Target="worksheets/sheet1.xml" Id="rId3" Type="ws"/></Relationships>'],
      ["xl/sharedStrings.xml", '<sst><si><t>Hesap sınıfı</t></si><si><r><t>BA</t></r><r><t xml:space="preserve">YI</t></r></si></sst>'],
      [
        "xl/worksheets/sheet1.xml",
        '<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="C1" t="inlineStr"><is><t>Not</t></is></c></row>' +
          '<row r="2"/><row r="4"><c r="A4" t="s"><v>1</v></c><c r="B4"><v>0532</v></c><c r="C4" t="b"><v>1</v></c></row></sheetData></worksheet>',
      ],
    ]);
    expect(xlsxIlkSayfa(b)).toEqual([
      { no: 1, hucreler: ["Hesap sınıfı", null, "Not"] },
      { no: 4, hucreler: ["BAYI", "0532", "TRUE"] },
    ]);
  });

  it("zip olmayan ya da bozuk dosya XlsxHatasi", () => {
    expect(() => xlsxIlkSayfa(Buffer.from("ad;telefon\\nx;y"))).toThrow(XlsxHatasi);
    const b = xlsxKitap([{ ad: "Veri", kolonlar: [{ baslik: "A", tip: "metin" }], satirlar: [] }]);
    expect(() => xlsxIlkSayfa(b.subarray(0, b.length - 30))).toThrow(XlsxHatasi);
  });
});
