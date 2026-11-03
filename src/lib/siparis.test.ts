import { describe, expect, it } from "vitest";
import { kalemMiktarlari } from "./siparis";

const kalem = (sevk: number[], iade: number[] = []) => ({
  quantity: 5,
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
});
