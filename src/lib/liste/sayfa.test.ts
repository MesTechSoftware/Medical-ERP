import { describe, expect, it } from "vitest";

import { perEkle, sayfaCoz, sayfaDisi, sayfalamaParametreleri } from "@/lib/liste/sayfa";

describe("sayfaCoz", () => {
  it("adres boşsa ilk sayfa, varsayılan boy; per bağlantılara yazılmaz", () => {
    expect(sayfaCoz({})).toEqual({ page: 1, perPage: 25, skip: 0, take: 25, yer: { page: 1, per: undefined } });
  });

  it("geçerli per taşınır, sınırın üstü 100'e iner", () => {
    expect(sayfaCoz({ page: "3", per: "50" })).toMatchObject({ page: 3, perPage: 50, skip: 100, yer: { page: 3, per: 50 } });
    expect(sayfaCoz({ per: "500" }).yer.per).toBe(100);
    expect(sayfaCoz({ per: "050" }).yer.per).toBe(50);
  });

  it("geçersiz per (harf, sıfır, eksi, ondalık) varsayılana düşer ve bağlantılara yazılmaz", () => {
    for (const per of ["abc", "0", "00", "-5", "2.5", "25abc", ""]) {
      const s = sayfaCoz({ per });
      expect(s.perPage, per).toBe(25);
      expect(s.yer.per, per).toBeUndefined();
    }
  });

  it("taşan sayılar yok sayılır: dev per bağlantıya yazılmaz, dev page ilk sayfadır", () => {
    const dev = "9".repeat(400);
    expect(sayfaCoz({ per: dev }).yer.per).toBeUndefined();
    expect(sayfaCoz({ page: "99999999999999999999" }).page).toBe(1);
    expect(sayfaCoz({ page: "2abc" }).page).toBe(1);
  });

  it("ekranın varsayılan boyu", () => {
    expect(sayfaCoz({}, 50).perPage).toBe(50);
  });

  it("dizi parametrede ilk değer", () => {
    expect(sayfaCoz({ page: ["2", "9"] }).page).toBe(2);
  });
});

describe("sayfaDisi", () => {
  it("satır varsa ya da hiç kayıt yoksa yönlendirme yok", () => {
    expect(sayfaDisi({ satirlar: [1], toplam: 30 }, 25)).toBeNull();
    expect(sayfaDisi({ satirlar: [], toplam: 0 }, 25)).toBeNull();
  });

  it("satırsız ama kayıtlı sayfa son sayfaya gider", () => {
    expect(sayfaDisi({ satirlar: [], toplam: 51 }, 25)).toBe(3);
  });
});

describe("sayfalamaParametreleri", () => {
  it("süzgeci ve per'i korur, sayfa ve panel adresten gelmez", () => {
    expect(sayfalamaParametreleri("/orders?durum=BEKLIYOR&q=ali", { page: 2, per: 50 })).toEqual({ durum: "BEKLIYOR", q: "ali", per: "50" });
    expect(sayfalamaParametreleri("/orders", { page: 1 })).toEqual({ per: undefined });
    expect(sayfalamaParametreleri("/shipping?firma=x&page=3&per=10&detay=a&kismi=b", { page: 3 })).toEqual({ firma: "x", per: undefined });
  });
});

describe("perEkle — süzgeç bağlantıları sayfa boyunu korur", () => {
  it("geçerli per eklenir, sınır uygulanır", () => {
    expect(perEkle("/orders?durum=BEKLIYOR", "50")).toBe("/orders?durum=BEKLIYOR&per=50");
    expect(perEkle("/orders", "500")).toBe("/orders?per=100");
  });

  it("geçersiz ya da boş per eklenmez; bağlantıda per varsa dokunulmaz", () => {
    for (const per of [null, "", "abc", "0", "2.5"]) expect(perEkle("/orders?q=a", per)).toBe("/orders?q=a");
    expect(perEkle("/orders?per=10", "50")).toBe("/orders?per=10");
  });
});
