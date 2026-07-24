import { describe, expect, it } from "vitest";
import { DEFAULT_PER_PAGE, getPagination, pageCount } from "@/lib/pagination";

describe("getPagination", () => {
  it("parametre yoksa ilk sayfayı varsayılan boyutla döner", () => {
    expect(getPagination()).toEqual({
      page: 1,
      perPage: DEFAULT_PER_PAGE,
      skip: 0,
      take: DEFAULT_PER_PAGE,
    });
  });

  it("skip'i doğru hesaplar", () => {
    expect(getPagination({ page: "3", per: "20" })).toEqual({
      page: 3,
      perPage: 20,
      skip: 40,
      take: 20,
    });
  });

  it("geçersiz/negatif girdileri güvenli varsayılana düşürür", () => {
    for (const bad of ["0", "-5", "abc", ""]) {
      expect(getPagination({ page: bad }).page).toBe(1);
    }
  });

  it("sayfa boyutunu üst sınırla kırpar (DoS'a karşı)", () => {
    expect(getPagination({ per: "100000" }).perPage).toBe(100);
  });
});

describe("pageCount", () => {
  it("tam bölünmeyen toplamı yukarı yuvarlar", () => {
    expect(pageCount(51, 25)).toBe(3);
    expect(pageCount(50, 25)).toBe(2);
  });

  it("kayıt yoksa bile en az 1 sayfa döner", () => {
    expect(pageCount(0, 25)).toBe(1);
  });
});
