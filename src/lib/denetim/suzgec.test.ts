import { describe, expect, it } from "vitest";

import { BOS_SUZGEC, SISTEM, bosDurum, denetimAdresi, etkinSuzgecler, kartAdresleri, suzgecCoz, tarihSekmesiAdresi } from "@/lib/denetim/suzgec";

// X-18-6: süzgeçler ve imleç adres çubuğunda durur; geçersiz değer yok sayılır.

describe("suzgecCoz", () => {
  it("parametresiz adres: süzgeç, imleç ve kayıt boş", () => {
    expect(suzgecCoz({})).toEqual({ suzgec: BOS_SUZGEC, imlec: null, kayit: null });
  });

  it("geçerli değerler okunur", () => {
    expect(
      suzgecCoz({ baslangic: "2026-10-01", bitis: "2026-10-27", kullanici: "ck123", modul: "FINANS", tur: "GUNCELLEME", olay: "DUE_DATE_CHANGE" }).suzgec
    ).toEqual({ baslangic: "2026-10-01", bitis: "2026-10-27", kullanici: "ck123", modul: "FINANS", tur: "GUNCELLEME", olay: "DUE_DATE_CHANGE" });
  });

  it("geçersiz gün, modül, tür ve olay yok sayılır", () => {
    expect(suzgecCoz({ baslangic: "2026-02-30", bitis: "dün", modul: "MUHASEBE", tur: "INSERT", olay: "DROP_TABLE" }).suzgec).toEqual(BOS_SUZGEC);
  });

  it("imleç pozitif tam sayıdır; önce verilmişse sonra okunmaz", () => {
    expect(suzgecCoz({ once: "120" }).imlec).toEqual({ yon: "once", seq: 120 });
    expect(suzgecCoz({ sonra: "5" }).imlec).toEqual({ yon: "sonra", seq: 5 });
    expect(suzgecCoz({ once: "9", sonra: "5" }).imlec).toEqual({ yon: "once", seq: 9 });
    for (const bozuk of ["0", "-3", "1.5", "abc", "1e3", "2147483648"]) expect(suzgecCoz({ once: bozuk }).imlec).toBeNull();
    expect(suzgecCoz({ once: "2147483647" }).imlec).toEqual({ yon: "once", seq: 2147483647 });
  });

  it("kayıt numarası yalnız harf, rakam ve tire; uzunluk sınırlı", () => {
    expect(suzgecCoz({ kayit: "0192f0c4-0000-7000-8000-000000000001" }).kayit).toBe("0192f0c4-0000-7000-8000-000000000001");
    expect(suzgecCoz({ kayit: "x'; DROP" }).kayit).toBeNull();
    expect(suzgecCoz({ kayit: "a".repeat(65) }).kayit).toBeNull();
  });

  it("tekrarlanan parametrede ilk değer geçerlidir", () => {
    expect(suzgecCoz({ modul: ["STOK", "FINANS"] }).suzgec.modul).toBe("STOK");
  });
});

describe("denetimAdresi", () => {
  it("yalnız dolu süzgeçleri ve verilen imleci yazar; adres geri okunur", () => {
    const suzgec = { ...BOS_SUZGEC, modul: "STOK" as const, kullanici: "sistem" };
    const adres = denetimAdresi(suzgec, { once: 40, kayit: "k1" });
    expect(adres).toBe("/audit-logs?kullanici=sistem&modul=STOK&once=40&kayit=k1");
    const geri = suzgecCoz(Object.fromEntries(new URL(adres, "http://x").searchParams));
    expect(geri).toEqual({ suzgec, imlec: { yon: "once", seq: 40 }, kayit: "k1" });
  });

  it("süzgeçsiz adres sade kalır", () => {
    expect(denetimAdresi(BOS_SUZGEC)).toBe("/audit-logs");
  });
});

describe("ekran yardımcıları (Ü-28)", () => {
  it("kart adresleri: bugün, son 7 gün, bugün başarısız giriş, bugün silme (X-18-8)", () => {
    expect(kartAdresleri("2026-11-04")).toEqual({
      bugun: "/audit-logs?baslangic=2026-11-04&bitis=2026-11-04",
      yediGun: "/audit-logs?baslangic=2026-10-29&bitis=2026-11-04",
      basarisiz: "/audit-logs?baslangic=2026-11-04&bitis=2026-11-04&olay=AUTH_LOGIN_FAILURE",
      silme: "/audit-logs?baslangic=2026-11-04&bitis=2026-11-04&tur=SILME",
    });
  });

  it("tarih sekmesi öbür süzgeçleri korur; imleç adrese hiç yazılmaz", () => {
    const s = { ...BOS_SUZGEC, modul: "STOK" as const };
    expect(tarihSekmesiAdresi(s, { baslangic: "2026-11-04", bitis: "2026-11-04" })).toBe("/audit-logs?baslangic=2026-11-04&bitis=2026-11-04&modul=STOK");
  });

  it("etiketler ve kaldırma adresleri; adı bilinmeyen kullanıcı etiketsiz; boş durum", () => {
    const s = { ...BOS_SUZGEC, baslangic: "2026-11-01", bitis: "2026-11-04", kullanici: "u-1", modul: "STOK" as const, tur: "SILME" as const, olay: "AUTH_LOGIN_FAILURE" as const };
    const e = etkinSuzgecler(s, (id) => (id === "u-1" ? "Ayşe" : undefined));
    expect(e.map((x) => x.etiket)).toEqual(["Tarih: 01.11.2026 – 04.11.2026", "Kullanıcı: Ayşe", "Modül: Stok", "Tür: Silme", "Olay: Giriş başarısız"]);
    expect(e[1].kaldirAdresi).toBe("/audit-logs?baslangic=2026-11-01&bitis=2026-11-04&modul=STOK&tur=SILME&olay=AUTH_LOGIN_FAILURE");
    expect(etkinSuzgecler({ ...BOS_SUZGEC, kullanici: SISTEM }, () => undefined).map((x) => x.etiket)).toEqual(["Kullanıcı: Sistem / anonim"]);
    expect(etkinSuzgecler({ ...BOS_SUZGEC, kullanici: "u-9" }, () => undefined)).toEqual([]);
    expect(bosDurum(BOS_SUZGEC)).toBe("hic-kayit");
    expect(bosDurum({ ...BOS_SUZGEC, tur: "SILME" })).toBe("suzgecli");
  });
});
