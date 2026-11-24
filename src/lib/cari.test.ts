import { describe, expect, it } from "vitest";
import { vergiKimligiGecerliMi } from "@/lib/cari";
import { creditLimitSchema } from "@/lib/validation";

// A-13-1 — vergi kimliği hane sayısından doğrulanır: 10 VKN, 11 TCKN; kontrol hanesi tutmalı.
describe("vergiKimligiGecerliMi (A-13-1)", () => {
  it("geçerli VKN ve TCKN kabul edilir", () => {
    expect(["1234567890", "9876543217", "1111111114", "10000000146"].map(vergiKimligiGecerliMi)).toEqual([true, true, true, true]);
  });
  it("kontrol hanesi tutmayan, başka uzunlukta, rakam dışı ya da 0 ile başlayan TCKN reddedilir", () => {
    expect(["1234567891", "10000000147", "123456789", "123456789012", "12345abcde", "01234567890"].map(vergiKimligiGecerliMi)).toEqual([
      false, false, false, false, false, false,
    ]);
  });
});

// A-12-7 — kredi limiti negatif olamaz; 0 "Peşin çalışılan cari"dir (tahsilat tutarı amountSchema'dan farklı: 0 kabul).
describe("creditLimitSchema (A-12-7)", () => {
  it("0 ve pozitif kabul edilir; negatif, 3 ondalık ve metin reddedilir", () => {
    expect(["0", "0,00", "50000", "1250,50"].map((x) => creditLimitSchema.safeParse(x).success)).toEqual([true, true, true, true]);
    expect(["-1", "-0,01", "1.234", "abc"].map((x) => creditLimitSchema.safeParse(x).success)).toEqual([false, false, false, false]);
  });
});
