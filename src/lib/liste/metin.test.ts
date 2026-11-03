import { describe, expect, it } from "vitest";
import { metinVaryantlari } from "./metin";

describe("metin araması Türkçe I/ı (veritabanı en_US yerelinde I→i katlar, ı'yı katlamaz)", () => {
  it("girilen, Türkçe küçük harf, bütün ı→I ve kelime başı ı→I varyantları; tekrar yok", () => {
    expect(metinVaryantlari("kılıç")).toEqual(["kılıç", "kIlIç"]);
    expect(metinVaryantlari("IŞIK")).toEqual(["IŞIK", "ışık", "IşIk", "Işık"]);
    expect(metinVaryantlari("ılgaz")).toEqual(["ılgaz", "Ilgaz"]);
    expect(metinVaryantlari("SIP-1")).toEqual(["SIP-1", "sıp-1", "sIp-1"]);
    expect(metinVaryantlari("merkez")).toEqual(["merkez"]);
  });
});
