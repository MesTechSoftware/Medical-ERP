import { describe, expect, it } from "vitest";

import { BOS_SUZGEC, denetimAdresi, suzgecCoz } from "@/lib/denetim/suzgec";

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
