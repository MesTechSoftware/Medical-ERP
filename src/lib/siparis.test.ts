import { describe, expect, it } from "vitest";
import { kalemMiktarlari, siparisToplami, siparisTutarlari } from "./siparis";

const kalem = (sevk: number[], iade: number[] = [], closedQuantity = 0) => ({
  quantity: 5,
  closedQuantity,
  shipmentItems: sevk.map((quantity) => ({ quantity })),
  returnItems: iade.map((quantity) => ({ quantity })),
});

describe("kalem miktarları (A-3-2)", () => {
  it("sevk yoksa kalan sipariş adedidir", () => {
    expect(kalemMiktarlari(kalem([]))).toEqual({ sevk: 0, iade: 0, kalan: 5 });
  });

  it("kısmi sevkte kalan = sipariş − sevk", () => {
    expect(kalemMiktarlari(kalem([2]))).toEqual({ sevk: 2, iade: 0, kalan: 3 });
  });

  it("birden çok sevkiyat toplanır", () => {
    expect(kalemMiktarlari(kalem([2, 3]))).toEqual({ sevk: 5, iade: 0, kalan: 0 });
  });

  it("iade kalanı değiştirmez (A-1: iade ayrı belgedir)", () => {
    expect(kalemMiktarlari(kalem([2, 3], [1]))).toEqual({ sevk: 5, iade: 1, kalan: 0 });
  });

  it("kalan = sipariş − sevk − kapatılan (A-3 eki)", () => {
    expect(kalemMiktarlari(kalem([2], [], 3))).toEqual({ sevk: 2, iade: 0, kalan: 0 });
    expect(kalemMiktarlari(kalem([1], [], 1))).toEqual({ sevk: 1, iade: 0, kalan: 3 });
  });
});

describe("sipariş tutarları — satırlar ve toplam tek hesaptan (A-3-2)", () => {
  const satirlar = [
    { quantity: 2, listPrice: "100", unitPrice: "90", vatRate: "20", isFree: false },
    { quantity: 1, listPrice: "50", unitPrice: "0", vatRate: "20", isFree: true },
  ];

  it("toplam siparisToplami ile aynı; satır başına matrah, bedelsiz satır 0", () => {
    const t = siparisTutarlari(satirlar);
    expect(t.toplam.toplam.toFixed(2)).toBe(siparisToplami(satirlar).toplam.toFixed(2));
    expect(t.satirlar.map((s) => s.matrah.toFixed(2))).toEqual(["180.00", "0.00"]);
  });
});
