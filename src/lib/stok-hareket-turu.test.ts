import { describe, expect, it } from "vitest";

import {
  HAREKET_TURLERI,
  hareketTuru,
  hareketTuruKodu,
  turKosulu,
  type HareketKaynagi,
  type HareketTuruKodu,
} from "@/lib/stok-hareket-turu";

// Stok hareketinin ekrandaki türü kaynak belgesinden — spec Ü-19 §4.3.

const bos: HareketKaynagi = {
  type: "GIRIS",
  shipmentId: null,
  returnNoteId: null,
  consignmentIssueId: null,
  stockTransferId: null,
  stockAdjustmentId: null,
  importBatchId: null,
  orderId: null,
};

describe("hareketTuru", () => {
  it("kaynak belgeye göre etiket", () => {
    const beklenen: [keyof HareketKaynagi, string][] = [
      ["shipmentId", "Sevkiyat"],
      ["returnNoteId", "İade"],
      ["consignmentIssueId", "Konsinye"],
      ["stockTransferId", "Transfer"],
      ["stockAdjustmentId", "Düzeltme"],
      ["importBatchId", "Açılış"],
      ["orderId", "Sipariş"],
    ];
    for (const [alan, etiket] of beklenen) expect(hareketTuru({ ...bos, [alan]: "x" })).toBe(etiket);
  });

  it("kaynaksız giriş 'Stok girişi', kaynaksız çıkış 'Çıkış'", () => {
    expect(hareketTuru(bos)).toBe("Stok girişi");
    expect(hareketTuru({ ...bos, type: "CIKIS" })).toBe("Çıkış");
  });
});

describe("hareket türü kodu ve süzgeç koşulu (B-4-10)", () => {
  const KAYNAK: [keyof HareketKaynagi, HareketTuruKodu][] = [
    ["shipmentId", "sevkiyat"],
    ["returnNoteId", "iade"],
    ["consignmentIssueId", "konsinye"],
    ["stockTransferId", "transfer"],
    ["stockAdjustmentId", "duzeltme"],
    ["importBatchId", "acilis"],
    ["orderId", "siparis"],
  ];

  it("her kaynak alanı kendi koduna; kaynaksız hareket giris", () => {
    for (const [alan, kod] of KAYNAK) expect(hareketTuruKodu({ ...bos, [alan]: "x" })).toBe(kod);
    expect(hareketTuruKodu(bos)).toBe("giris");
    expect(hareketTuruKodu({ ...bos, type: "CIKIS" })).toBe("giris");
  });

  it("sipariş iptali iadesi (orderId dolu giriş) siparis'tir", () => {
    expect(hareketTuruKodu({ ...bos, orderId: "s" })).toBe("siparis");
  });

  it("turKosulu kendi alanı dolu, öncekiler boş; sonrakilere bakmaz", () => {
    expect(turKosulu("iade")).toEqual({ shipmentId: null, returnNoteId: { not: null } });
    expect(turKosulu("sevkiyat")).toEqual({ shipmentId: { not: null } });
    expect(turKosulu("siparis")).toEqual({
      shipmentId: null,
      returnNoteId: null,
      consignmentIssueId: null,
      stockTransferId: null,
      stockAdjustmentId: null,
      importBatchId: null,
      orderId: { not: null },
    });
  });

  it("turKosulu('giris') yedi kaynak alanının hepsi boş", () => {
    expect(turKosulu("giris")).toEqual({
      shipmentId: null,
      returnNoteId: null,
      consignmentIssueId: null,
      stockTransferId: null,
      stockAdjustmentId: null,
      importBatchId: null,
      orderId: null,
    });
  });

  it("HAREKET_TURLERI her kodu bir kez, süzgeç sırasıyla taşır", () => {
    expect(HAREKET_TURLERI.map((t) => t.kod)).toEqual([
      "giris",
      "sevkiyat",
      "iade",
      "konsinye",
      "transfer",
      "duzeltme",
      "acilis",
      "siparis",
    ]);
    expect(HAREKET_TURLERI.map((t) => t.etiket)).toEqual([
      "Stok girişi",
      "Sevkiyat",
      "İade",
      "Konsinye",
      "Transfer",
      "Düzeltme",
      "Açılış",
      "Sipariş",
    ]);
  });
});
