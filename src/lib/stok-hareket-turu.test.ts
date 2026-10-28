import { describe, expect, it } from "vitest";

import { hareketTuru, type HareketKaynagi } from "@/lib/stok-hareket-turu";

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
