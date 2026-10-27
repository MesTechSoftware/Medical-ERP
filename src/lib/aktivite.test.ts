import { describe, expect, it } from "vitest";

import { AKIS_DISI, AKIS_GORUNURLUGU, SABLONLAR, aktiviteCumlesi } from "@/lib/aktivite-sablonlari";
import { AUDIT_ACTIONS } from "@/lib/denetim/olaylar";

// Aktivite akışı (brief §3.6): denetim kaydından insan diliyle cümle; şablonu olmayan olay gösterilmez.

describe("aktivite şablonları — kapsama", () => {
  it("her denetim olayının ya şablonu var ya da açıkça akış dışında; ikisi birden değil", () => {
    const sablonlu = new Set(Object.keys(SABLONLAR));
    const disi = new Set<string>(AKIS_DISI);
    const ihlal = Object.values(AUDIT_ACTIONS).filter((a) => sablonlu.has(a) === disi.has(a));
    expect(ihlal).toEqual([]);
    expect([...sablonlu, ...disi].filter((a) => !(a in AUDIT_ACTIONS))).toEqual([]);
  });

  it("giriş, çıkış ve parola olayları akış dışında", () => {
    expect([...AKIS_DISI].sort()).toEqual(
      ["AUTH_LOGIN_FAILURE", "AUTH_LOGIN_SUCCESS", "AUTH_LOGOUT", "PASSWORD_CHANGE", "USER_PASSWORD_RESET"].sort()
    );
  });

  it("rol tablosu tek yerde: yönetici şablonlu bütün olayları görür; OPERASYON ve satıcı hiçbirini (KARARLAR D-2)", () => {
    expect([...AKIS_GORUNURLUGU.YONETICI].sort()).toEqual(Object.keys(SABLONLAR).sort());
    expect(AKIS_GORUNURLUGU.OPERASYON).toEqual([]);
    expect(AKIS_GORUNURLUGU.SATICI).toEqual([]);
  });
});

describe("aktiviteCumlesi — insan dili", () => {
  it("aktör + fiil + nesne; after'daki kişi adı ve ham alanlar cümleye girmez", () => {
    const c = aktiviteCumlesi({
      action: "ORDER_CREATE",
      afterData: JSON.stringify({ documentNo: "SIP-2026-000042", doctorName: "Dr. Gizli", doctorId: "ckxyz" }),
      aktor: "Selin Aksoy",
      nesne: "SIP-2026-000042",
    });
    expect(c).toBe("Selin Aksoy yeni sipariş oluşturdu · SIP-2026-000042");
  });

  it("sipariş durum değişikliği after'daki duruma göre fiil seçer; bozuk veride genel fiil", () => {
    const fiil = (afterData: string | null) => aktiviteCumlesi({ action: "ORDER_STATUS_CHANGE", afterData, aktor: "A", nesne: null });
    expect(fiil('{"status":"HAZIRLANIYOR"}')).toBe("A siparişi hazırlığa aldı");
    expect(fiil('{"status":"TESLIM_EDILDI"}')).toBe("A siparişi teslim edildi olarak işaretledi");
    expect(fiil('{"sevkiyat":"SVK-1","tamamlandi":true}')).toBe("A siparişi kargoladı");
    expect(fiil('{"sevkiyat":"SVK-1","tamamlandi":false}')).toBe("A kısmi sevkiyat yaptı");
    expect(fiil("{bozuk")).toBe("A sipariş durumunu değiştirdi");
    expect(fiil(null)).toBe("A sipariş durumunu değiştirdi");
  });

  it("aktör yoksa 'Sistem'; nesne yoksa ayraç yok", () => {
    expect(aktiviteCumlesi({ action: "DOCTOR_CREATE", afterData: null, aktor: null, nesne: null })).toBe("Sistem yeni cari açtı");
  });

  it("şablonsuz ya da akış dışı olay cümle üretmez", () => {
    expect(aktiviteCumlesi({ action: "AUTH_LOGIN_SUCCESS", afterData: null, aktor: "A", nesne: null })).toBeNull();
    expect(aktiviteCumlesi({ action: "BILINMEYEN", afterData: null, aktor: "A", nesne: null })).toBeNull();
  });
});
