import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { SUTUN_LISTELERI } from "@/lib/liste/sutun-listeleri";

// Sütun eyleminin yetki tablosu kayıtla aynı ekranları kapsar ve her ekran sayfasının guard'ını kullanır
// (kaynakta statik denetim: eylem dosyası db.ts'e vardığı için birim testinde içe aktarılamaz).

const eylem = readFileSync("src/lib/liste/sutun-eylemi.ts", "utf8");
const yetkiTablosu = eylem.slice(eylem.indexOf("const YETKI"), eylem.indexOf("};", eylem.indexOf("const YETKI")));

describe("sutunlariKaydet yetki tablosu", () => {
  it("kayıttaki her ekranın guard'ı sayfanınkiyle aynıdır", () => {
    for (const yol of Object.keys(SUTUN_LISTELERI)) {
      const grup = yol.startsWith("/my-") ? "(seller)" : "(admin)";
      const sayfa = readFileSync(`src/app/${grup}${yol}/page.tsx`, "utf8");
      const sayfaGuardi = sayfa.match(/await (require[A-Za-z]+)\(\)/)?.[1];
      const satir = yetkiTablosu.match(new RegExp(`"${yol}": (require[A-Za-z]+)`))?.[1];
      expect(satir, yol).toBe(sayfaGuardi);
    }
  });
});
