import { describe, expect, it } from "vitest";
import { icerirDesenleri, metinVaryantlari } from "./metin";

describe("metin araması Türkçe I/ı (veritabanı en_US yerelinde I→i katlar, ı'yı katlamaz)", () => {
  it("girilen, Türkçe küçük harf, bütün ı→I ve kelime başı ı→I varyantları; tekrar yok", () => {
    expect(metinVaryantlari("kılıç")).toEqual(["kılıç", "kIlIç"]);
    expect(metinVaryantlari("IŞIK")).toEqual(["IŞIK", "ışık", "IşIk", "Işık"]);
    expect(metinVaryantlari("ılgaz")).toEqual(["ılgaz", "Ilgaz"]);
    expect(metinVaryantlari("SIP-1")).toEqual(["SIP-1", "sıp-1", "sIp-1"]);
    expect(metinVaryantlari("merkez")).toEqual(["merkez"]);
  });
});

describe("icerirDesenleri — ham SQL ILIKE ANY desenleri", () => {
  it("her varyant %…% içinde", () => {
    expect(icerirDesenleri("ılgaz")).toEqual(["%ılgaz%", "%Ilgaz%"]);
  });

  it("joker karakterler ve kaçış karakteri kaçışlıdır: kullanıcı metni desen olarak yorumlanmaz", () => {
    expect(icerirDesenleri("50%_a\\b")).toEqual(["%50\\%\\_a\\\\b%"]);
  });
});
