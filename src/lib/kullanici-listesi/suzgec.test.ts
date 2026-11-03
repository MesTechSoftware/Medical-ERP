import { describe, expect, it } from "vitest";
import { BOS_SUZGEC, ayniSuzgec, bosDurum, etkinSuzgecler, hizliSekmeler, kullaniciAdresi, suzgecCoz } from "./suzgec";

describe("kullanıcı süzgeci (spec Ü-22 §3.3)", () => {
  it("çözme; geçersiz değer yok sayılır", () => {
    expect(suzgecCoz({ durum: "aktif", rol: "SATICI", parola: "gecici", detay: "u-1" }, "YONETICI")).toEqual({
      suzgec: { durum: "aktif", rol: "SATICI", portfoy: null, parola: "gecici" },
      detay: "u-1",
    });
    expect(suzgecCoz({ durum: "AKTIF", rol: "x", parola: "1", portfoy: "var" }, "YONETICI").suzgec).toEqual(BOS_SUZGEC);
  });

  it("OPERASYON'da rol süzgeci yoktur — kapsamı zaten satıcılar (D-2-3)", () => {
    expect(suzgecCoz({ rol: "YONETICI" }, "OPERASYON").suzgec.rol).toBeNull();
    expect(suzgecCoz({ rol: "OPERASYON" }, "OPERASYON").suzgec.rol).toBeNull();
    expect(suzgecCoz({ rol: "SATICI" }, "OPERASYON").suzgec.rol).toBeNull();
    expect(suzgecCoz({ rol: "YONETICI" }, "YONETICI").suzgec.rol).toBe("YONETICI");
  });

  it("portföy süzgeci durum ve rolü ezer (adres tek anlam)", () => {
    expect(suzgecCoz({ portfoy: "yok", durum: "pasif", rol: "YONETICI" }, "YONETICI").suzgec).toEqual({
      durum: null,
      rol: null,
      portfoy: "yok",
      parola: null,
    });
  });

  it("adres gidiş-dönüş; ilk sayfa yazılmaz", () => {
    expect(kullaniciAdresi(BOS_SUZGEC)).toBe("/users");
    const s = { durum: "aktif" as const, rol: "SATICI" as const, portfoy: null, parola: "gecici" as const };
    const adres = kullaniciAdresi(s, { page: 2, detay: "u-1" });
    expect(adres).toBe("/users?durum=aktif&rol=SATICI&parola=gecici&page=2&detay=u-1");
    expect(suzgecCoz(Object.fromEntries(new URL(adres, "http://x").searchParams), "YONETICI")).toEqual({ suzgec: s, detay: "u-1" });
    expect(kullaniciAdresi({ ...BOS_SUZGEC, portfoy: "yok" }, { page: 1 })).toBe("/users?portfoy=yok");
  });

  it("sekmeler role göre", () => {
    expect(hizliSekmeler("YONETICI").map((s) => s.etiket)).toEqual(["Tümü", "Aktif", "Pasif", "Satıcılar", "Portföysüz"]);
    expect(hizliSekmeler("OPERASYON").map((s) => s.etiket)).toEqual(["Tümü", "Aktif", "Pasif", "Portföysüz"]);
    const portfoy = hizliSekmeler("YONETICI").find((s) => s.etiket === "Portföysüz")!;
    expect(ayniSuzgec(portfoy.suzgec, { ...BOS_SUZGEC, portfoy: "yok" })).toBe(true);
  });

  it("etiketler ve kaldırma adresleri; boş durum", () => {
    const s = { durum: "aktif" as const, rol: "SATICI" as const, portfoy: null, parola: "gecici" as const };
    expect(etkinSuzgecler(s).map((e) => [e.etiket, e.kaldirAdresi])).toEqual([
      ["Durum: Aktif", "/users?rol=SATICI&parola=gecici"],
      ["Rol: Satıcı", "/users?durum=aktif&parola=gecici"],
      ["Parola: Geçici", "/users?durum=aktif&rol=SATICI"],
    ]);
    expect(etkinSuzgecler({ ...BOS_SUZGEC, portfoy: "yok" }).map((e) => e.etiket)).toEqual(["Portföy: Yok"]);
    expect(bosDurum(BOS_SUZGEC)).toBe("hic-kayit");
    expect(bosDurum(s)).toBe("suzgecli");
  });
});
