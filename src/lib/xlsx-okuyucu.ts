import { inflateRawSync } from "node:zlib";

/**
 * Bağımlılıksız XLSX okuyucu — içe aktarım (D-6, X-16). Yalnız ilk sayfanın hücre değerlerini metin
 * olarak okur: paylaşılan metin, satır içi metin, sayı, mantıksal. Biçim, formül sonucu dışındaki
 * formül ve stil okunmaz. Bozuk ya da beklenmeyen dosya `XlsxHatasi` fırlatır; çağıran bunu
 * `SERT` dosya hatasına çevirir (E-3 §(3)).
 *
 * Zip bombasına karşı toplam açılmış boyut sınırlıdır.
 */
export class XlsxHatasi extends Error {}

const AZAMI_ACIK_BAYT = 64 * 1024 * 1024;

function zipAc(b: Buffer): Map<string, Buffer> {
  if (b.length < 22 || b.readUInt32LE(0) !== 0x04034b50) throw new XlsxHatasi("zip imzası yok");
  let son = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 22 - 65535); i--) {
    if (b.readUInt32LE(i) === 0x06054b50) {
      son = i;
      break;
    }
  }
  if (son < 0) throw new XlsxHatasi("zip dizini yok");
  const adet = b.readUInt16LE(son + 10);
  let p = b.readUInt32LE(son + 16);
  const dosyalar = new Map<string, Buffer>();
  let toplam = 0;
  for (let n = 0; n < adet; n++) {
    if (p + 46 > b.length || b.readUInt32LE(p) !== 0x02014b50) throw new XlsxHatasi("zip dizini bozuk");
    const yontem = b.readUInt16LE(p + 10);
    const sikisik = b.readUInt32LE(p + 20);
    const acik = b.readUInt32LE(p + 24);
    const adUz = b.readUInt16LE(p + 28);
    const ekUz = b.readUInt16LE(p + 30);
    const yorumUz = b.readUInt16LE(p + 32);
    const yerel = b.readUInt32LE(p + 42);
    const ad = b.subarray(p + 46, p + 46 + adUz).toString("utf8");
    p += 46 + adUz + ekUz + yorumUz;

    toplam += acik;
    if (toplam > AZAMI_ACIK_BAYT) throw new XlsxHatasi("açılmış boyut sınırı aşıldı");
    if (yerel + 30 > b.length || b.readUInt32LE(yerel) !== 0x04034b50) throw new XlsxHatasi("yerel başlık bozuk");
    const veri = yerel + 30 + b.readUInt16LE(yerel + 26) + b.readUInt16LE(yerel + 28);
    const ham = b.subarray(veri, veri + sikisik);
    if (yontem === 0) dosyalar.set(ad, ham);
    else if (yontem === 8) {
      try {
        dosyalar.set(ad, inflateRawSync(ham, { maxOutputLength: Math.max(acik, 1) }));
      } catch {
        throw new XlsxHatasi("sıkıştırma bozuk");
      }
    } else throw new XlsxHatasi("desteklenmeyen sıkıştırma");
  }
  return dosyalar;
}

const VARLIK: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
function cozXml(s: string): string {
  return s.replace(/&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g, (_, v: string) =>
    v[0] === "#" ? String.fromCodePoint(v[1] === "x" ? parseInt(v.slice(2), 16) : parseInt(v.slice(1), 10)) : VARLIK[v]
  );
}

/** `<t>` parçalarını birleştirir (zengin metin `<r><t>` dahil). */
function metinler(xml: string): string {
  return [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>|<t(?:\s[^>]*)?\/>/g)].map((m) => cozXml(m[1] ?? "")).join("");
}

function kolonNo(ref: string): number {
  const harf = /^[A-Z]+/.exec(ref)?.[0] ?? "";
  let n = 0;
  for (const c of harf) n = n * 26 + (c.charCodeAt(0) - 64);
  return n - 1;
}

export type XlsxSatiri = { /** Excel satır numarası (1'den). */ no: number; hucreler: (string | null)[] };

/** İlk sayfanın satırları; boş hücre `null`. Tamamen boş satırlar atılır, numaraları korunur. */
export function xlsxIlkSayfa(b: Buffer): XlsxSatiri[] {
  const z = zipAc(b);
  const metin = (ad: string) => z.get(ad)?.toString("utf8");
  const kitap = metin("xl/workbook.xml");
  const iliski = metin("xl/_rels/workbook.xml.rels");
  if (!kitap || !iliski) throw new XlsxHatasi("çalışma kitabı yok");
  const ilkId = /<sheet\b[^>]*\br:id="([^"]+)"/.exec(kitap)?.[1];
  const hedef = ilkId ? new RegExp(`<Relationship\\b[^>]*\\bId="${ilkId}"[^>]*\\bTarget="([^"]+)"`).exec(iliski)?.[1] ??
    new RegExp(`<Relationship\\b[^>]*\\bTarget="([^"]+)"[^>]*\\bId="${ilkId}"`).exec(iliski)?.[1] : undefined;
  if (!hedef) throw new XlsxHatasi("sayfa yok");
  const sayfaYolu = hedef.startsWith("/") ? hedef.slice(1) : `xl/${hedef.replace(/^\.\//, "")}`;
  const sayfa = metin(sayfaYolu);
  if (!sayfa) throw new XlsxHatasi("sayfa yok");

  const paylasilan = [...(metin("xl/sharedStrings.xml") ?? "").matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => metinler(m[1]));

  const satirlar: XlsxSatiri[] = [];
  let sira = 0;
  for (const r of sayfa.matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {
    sira = parseInt(/\br="(\d+)"/.exec(r[1])?.[1] ?? String(sira + 1), 10);
    const satir: (string | null)[] = [];
    for (const c of (r[2] ?? "").matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const nit = c[1];
      const ref = /\br="([A-Z]+\d+)"/.exec(nit)?.[1];
      const tip = /\bt="([^"]+)"/.exec(nit)?.[1] ?? "n";
      const ic = c[2] ?? "";
      const v = /<v>([\s\S]*?)<\/v>/.exec(ic)?.[1];
      let deger: string | null;
      if (tip === "s") deger = v === undefined ? null : (paylasilan[parseInt(v, 10)] ?? null);
      else if (tip === "inlineStr") deger = metinler(ic);
      else if (tip === "b") deger = v === undefined ? null : v === "1" ? "TRUE" : "FALSE";
      else deger = v === undefined ? null : cozXml(v);
      const i = ref ? kolonNo(ref) : satir.length;
      while (satir.length < i) satir.push(null);
      satir[i] = deger === "" ? null : deger;
    }
    if (satir.some((h) => h !== null && h.trim() !== "")) satirlar.push({ no: sira, hucreler: satir });
  }
  return satirlar;
}
