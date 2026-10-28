import { describe, expect, it } from "vitest";

import { HICBIRI, gizliSutunCerezi, gizliSutunlariCoz, guvenliDonus, type SutunTanimi } from "@/lib/liste/sutunlar";

// Liste ekranlarının sütun seçici çerez biçimi — spec Ü-19 §3.4, §4.3.

const T: readonly SutunTanimi<"a" | "b" | "c">[] = [
  { anahtar: "a", baslik: "A" },
  { anahtar: "b", baslik: "B", varsayilanGizli: true },
  { anahtar: "c", baslik: "C" },
];

describe("gizliSutunlariCoz", () => {
  it("çerez yoksa varsayılan gizliler", () => {
    expect([...gizliSutunlariCoz(T, undefined)]).toEqual(["b"]);
  });

  it("'-' ve boş değer: hiçbir sütun gizli değil", () => {
    expect(gizliSutunlariCoz(T, HICBIRI).size).toBe(0);
    expect(gizliSutunlariCoz(T, "").size).toBe(0);
  });

  it("bilinmeyen anahtar atılır, tablo sırası korunur", () => {
    expect([...gizliSutunlariCoz(T, "c,x,a")]).toEqual(["a", "c"]);
    expect([...gizliSutunlariCoz(T, "b")]).toEqual(["b"]);
  });
});

describe("gizliSutunCerezi", () => {
  it("boş küme '-' yazılır — çerezin yokluğundan ayrılsın", () => {
    expect(gizliSutunCerezi(T, [])).toBe(HICBIRI);
  });

  it("bilinmeyeni atar, tablo sırasıyla yazar; gidiş-dönüş aynı", () => {
    expect(gizliSutunCerezi(T, ["c", "a", "x"])).toBe("a,c");
    for (const k of [[], ["b"], ["a", "c"], ["a", "b", "c"]]) {
      expect([...gizliSutunlariCoz(T, gizliSutunCerezi(T, k))]).toEqual(k);
    }
  });
});

describe("guvenliDonus", () => {
  it("listenin kendi adresi aynen döner", () => {
    expect(guvenliDonus("/products", "/products")).toBe("/products");
    expect(guvenliDonus("/products", "/products?stok=kritik&page=2")).toBe("/products?stok=kritik&page=2");
  });

  it("başka adres listeye düşer", () => {
    for (const kotu of ["", "/productsx", "https://x.com", "//x.com", "/products/abc/edit", "/doctors"]) {
      expect(guvenliDonus("/products", kotu)).toBe("/products");
    }
  });
});
