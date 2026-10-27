import { describe, expect, it } from "vitest";

import { AUDIT_ACTIONS, AUDIT_ACTION_LABELS, ISLEM_SINIFI, islemSinifi } from "@/lib/denetim/olaylar";

// X-18-3: her olayın işlem türü ve modülü tek tablodan gelir; iptal ve ters kayıt Silme değildir.

describe("olay tablosu — kapsama", () => {
  it("her denetim olayının etiketi ve sınıfı var; tabloda fazladan olay yok", () => {
    const olaylar = Object.values(AUDIT_ACTIONS).sort();
    expect(Object.keys(ISLEM_SINIFI).sort()).toEqual(olaylar);
    expect(Object.keys(AUDIT_ACTION_LABELS).sort()).toEqual(olaylar);
  });

  it("Silme yalnız gerçekten silen akışlardadır (C-3 §(1): iptal ve ters kayıt silme değildir)", () => {
    const silme = Object.entries(ISLEM_SINIFI)
      .filter(([, s]) => s.tur === "SILME")
      .map(([olay]) => olay)
      .sort();
    expect(silme).toEqual(["IMPORT_REVERT", "PRICE_LIST_ITEM_DELETE"]);
  });

  it("oturum olayları Oturum türünde, kullanıcı modülündedir", () => {
    for (const olay of ["AUTH_LOGIN_SUCCESS", "AUTH_LOGIN_FAILURE", "AUTH_LOGOUT"] as const) {
      expect(ISLEM_SINIFI[olay]).toEqual({ tur: "OTURUM", modul: "KULLANICI" });
    }
    expect(Object.entries(ISLEM_SINIFI).filter(([, s]) => s.tur === "OTURUM")).toHaveLength(3);
  });

  it("örnek sınıflar: iptal güncelleme, ters kayıt ekleme, stok girişi stok modülünde", () => {
    expect(ISLEM_SINIFI.ORDER_CANCEL).toEqual({ tur: "GUNCELLEME", modul: "SATIS" });
    expect(ISLEM_SINIFI.COLLECTION_CANCEL).toEqual({ tur: "GUNCELLEME", modul: "FINANS" });
    expect(ISLEM_SINIFI.LEDGER_REVERSAL).toEqual({ tur: "EKLEME", modul: "FINANS" });
    expect(ISLEM_SINIFI.STOCK_ENTRY).toEqual({ tur: "EKLEME", modul: "STOK" });
    expect(ISLEM_SINIFI.DOCTOR_TRANSFER).toEqual({ tur: "GUNCELLEME", modul: "CARI" });
    expect(ISLEM_SINIFI.PASSWORD_CHANGE).toEqual({ tur: "GUNCELLEME", modul: "KULLANICI" });
  });
});

describe("islemSinifi — önceki hâle bağlı tek olay", () => {
  it("fiyat satırı önceki değer yoksa Ekleme, varsa Güncelleme", () => {
    expect(islemSinifi("PRICE_LIST_ITEM_SET", undefined)).toEqual({ tur: "EKLEME", modul: "URUN_FIYAT" });
    expect(islemSinifi("PRICE_LIST_ITEM_SET", { listPrice: "10.0000" })).toEqual({ tur: "GUNCELLEME", modul: "URUN_FIYAT" });
  });

  it("diğer olaylarda önceki hâlin yokluğu türü değiştirmez", () => {
    // Sevkiyat kaydı önceki hâl taşımaz ama bir durum değişikliğidir.
    expect(islemSinifi("ORDER_STATUS_CHANGE", undefined)).toEqual({ tur: "GUNCELLEME", modul: "SATIS" });
  });
});
