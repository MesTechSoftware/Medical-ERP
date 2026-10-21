import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { matrisKur, matrisMetni, ozet } from "../src/lib/izlenebilirlik";

/** `docs/TRACEABILITY.md`'yi `KABUL_KRITERLERI.md`'den yeniden üretir (KARARLAR X-7 §(5)). */
const kok = process.cwd();
const satirlar = matrisKur(kok);
writeFileSync(join(kok, "docs", "TRACEABILITY.md"), matrisMetni(satirlar));
const o = ozet(satirlar);
console.log(`KANITLI ${o.kanitli} · TESTSIZ ${o.testsiz} · YOK ${o.yok} · KAPSAM DIŞI ${o.kapsamDisi} · oran %${(o.oran * 100).toFixed(1)}`);
