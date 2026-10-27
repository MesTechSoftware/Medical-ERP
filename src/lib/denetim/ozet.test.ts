import { describe, expect, it } from "vitest";

import { OZET_FIILLERI, alanEtiketi, degerMetni, kisaOzet, varlikEtiketi } from "@/lib/denetim/ozet";
import { AUDIT_ACTIONS } from "@/lib/denetim/olaylar";

// X-18-6/7: listede kısa özet, farkta okunur alan adı ve değer.

describe("kisaOzet — liste satırının özeti", () => {
  it("her denetim olayının özet fiili var", () => {
    expect(Object.keys(OZET_FIILLERI).sort()).toEqual(Object.values(AUDIT_ACTIONS).sort());
  });

  it("fiil büyük harfle başlar, nesne · ile eklenir (Türkçe büyük İ dahil)", () => {
    expect(kisaOzet({ action: "ORDER_CANCEL", afterData: null, entityId: "x" }, "SIP-2026-000012")).toBe("Siparişi iptal etti · SIP-2026-000012");
    expect(kisaOzet({ action: "IMPORT_CREATE", afterData: null, entityId: "x" }, "IMP-2026-000001")).toBe("İçe aktarım yaptı · IMP-2026-000001");
  });

  it("veriye bağlı fiil sonraki hâlden seçilir; bozuk veri genel fiile düşer", () => {
    const sevk = JSON.stringify({ sevkiyat: "SVK-2026-000003", tamamlandi: true });
    expect(kisaOzet({ action: "ORDER_STATUS_CHANGE", afterData: sevk, entityId: "o" }, "SIP-2026-000004")).toBe("Siparişi kargoladı · SIP-2026-000004");
    expect(kisaOzet({ action: "ORDER_STATUS_CHANGE", afterData: "{bozuk", entityId: "o" }, null)).toBe("Sipariş durumunu değiştirdi");
  });

  it("oturum olayları: başarısız denemede denenen e-posta nesnedir", () => {
    expect(kisaOzet({ action: "AUTH_LOGIN_FAILURE", afterData: null, entityId: "ali@m.local" }, null)).toBe("Başarısız giriş denemesi · ali@m.local");
    expect(kisaOzet({ action: "AUTH_LOGIN_SUCCESS", afterData: null, entityId: "u1" }, null)).toBe("Giriş yaptı");
  });

  it("tanınmayan olay adıyla görünür", () => {
    expect(kisaOzet({ action: "ESKI_OLAY", afterData: null, entityId: null }, null)).toBe("ESKI_OLAY");
  });
});

describe("alanEtiketi — fark satırındaki alan adı", () => {
  it("bilinen alan Türkçe, iç içe yol okunur, bilinmeyen alan ham kalır", () => {
    expect(alanEtiketi("dueDate")).toBe("Vade tarihi");
    expect(alanEtiketi("taxId")).toBe("VKN / TCKN");
    expect(alanEtiketi("kalemler[0].fark")).toBe("Kalem 1 · Fark");
    expect(alanEtiketi("bilinmeyenAlan")).toBe("bilinmeyenAlan");
  });
});

describe("degerMetni — fark satırındaki değer", () => {
  it("boş, mantıksal ve gizli değer", () => {
    expect(degerMetni("status", null)).toBe("boş");
    expect(degerMetni("isActive", true)).toBe("Evet");
    expect(degerMetni("mustChangePassword", false)).toBe("Hayır");
    expect(degerMetni("taxId", "***")).toBe("***");
  });

  it("an İstanbul saatiyle, takvim günü dönüştürülmeden yazılır (E-1)", () => {
    expect(degerMetni("createdAt", "2026-10-27T11:02:11.123Z")).toBe("27.10.2026 14:02");
    expect(degerMetni("dueDate", "2026-11-30T00:00:00.000Z")).toBe("30.11.2026");
  });

  it("durum ve rol kodları etiketle, diğerleri olduğu gibi", () => {
    expect(degerMetni("status", "IPTAL")).toBe("İptal");
    expect(degerMetni("role", "YONETICI")).toBe("Yönetici");
    expect(degerMetni("amount", "5000")).toBe("5000");
    expect(degerMetni("adet", 3)).toBe("3");
  });
});

describe("varlikEtiketi — listedeki varlık türü", () => {
  it("bilinen tür Türkçe, bilinmeyen ham", () => {
    expect(varlikEtiketi("LedgerEntry")).toBe("Cari hareket");
    expect(varlikEtiketi("Auth")).toBe("Oturum");
    expect(varlikEtiketi("Yeni")).toBe("Yeni");
  });
});
