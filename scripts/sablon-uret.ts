import { writeFileSync } from "node:fs";
import type { ImportDataType } from "../src/generated/prisma/enums";
import { sablonUret, TANIMLAR } from "../src/lib/ice-aktarim";

/**
 * İçe aktarım şablonu üretir (ADR-006 §3 — geliştirici komutu): devreye alma hazırlığında şablon,
 * ekranla aynı tanımdan üretilip müşteriye gönderilir.
 *   npm run sablon:uret -- CARI [dosya.xlsx]
 */
const [tur, cikti] = process.argv.slice(2) as [ImportDataType | undefined, string | undefined];
if (!tur || !TANIMLAR[tur]) {
  console.error(`Kullanım: npm run sablon:uret -- <${Object.keys(TANIMLAR).join("|")}> [dosya.xlsx]`);
  process.exit(1);
}
const yol = cikti ?? `sablon_${tur.toLowerCase()}.xlsx`;
writeFileSync(yol, sablonUret(tur));
console.log(`Şablon yazıldı: ${yol}`);
process.exit(0);
