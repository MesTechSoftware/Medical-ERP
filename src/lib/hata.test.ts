import { describe, expect, it } from "vitest";

import { Prisma } from "@/generated/prisma/client";
import {
  IsHatasi,
  benzersizIhlali,
  cerezDegeri,
  logArgumanlariniArindir,
  rotaYalin,
  stackCerceveleri,
  teknikHataLogSatiri,
} from "@/lib/hata";

// X-3-2 — teknik hata logu kişisel veri ve değer taşımaz (X-3 §(6)).
const prismaHatasi = (code: string) =>
  new Prisma.PrismaClientKnownRequestError("Unique constraint failed: Ayşe Kaya 05321234567", {
    code,
    clientVersion: "test",
    meta: { target: ["phoneNormalized"], deger: "05321234567" },
  });

describe("teknikHataLogSatiri (X-3-2)", () => {
  it("zaman, referans, rota, kullanıcı kimliği, sınıf ve stack çerçevelerini yazar", () => {
    const satir = JSON.parse(
      teknikHataLogSatiri({
        zaman: new Date("2026-10-20T08:00:00Z"),
        referans: "1234567890",
        yol: "/doctors/abc?q=Ay%C5%9Fe",
        kullaniciId: "u1",
        hata: prismaHatasi("P2002"),
      })
    );
    expect(satir).toMatchObject({
      olay: "teknik_hata",
      zaman: "2026-10-20T08:00:00.000Z",
      referans: "1234567890",
      rota: "/doctors/abc",
      kullaniciId: "u1",
      sinif: "PrismaClientKnownRequestError:P2002",
    });
    expect(Object.keys(satir).sort()).toEqual(
      ["kullaniciId", "olay", "referans", "rota", "sinif", "stack", "zaman"].sort()
    );
    expect(satir.stack.length).toBeGreaterThan(0);
    for (const s of satir.stack) expect(s).toMatch(/^at /);
  });

  it("hata mesajı, Prisma meta değeri ve sorgu dizesi satıra girmez", () => {
    const satir = teknikHataLogSatiri({
      zaman: new Date(),
      referans: null,
      yol: "/collections?tutar=5000",
      kullaniciId: null,
      hata: prismaHatasi("P2002"),
    });
    for (const sizinti of ["Ayşe", "05321234567", "phoneNormalized", "Unique constraint", "5000", "tutar"]) {
      expect(satir).not.toContain(sizinti);
    }
  });

  it("Error olmayan değer de satır üretir", () => {
    expect(JSON.parse(teknikHataLogSatiri({ zaman: new Date(), referans: null, yol: "/", kullaniciId: null, hata: "x" })))
      .toMatchObject({ sinif: "string", stack: [] });
  });
});

describe("yardımcılar", () => {
  it("rotaYalin sorgu ve parçayı atar", () => {
    expect(rotaYalin("/a/b?x=1#y")).toBe("/a/b");
    expect(rotaYalin("?x=1")).toBe("/");
  });

  it("stackCerceveleri ilk satırı (mesajı) atar", () => {
    const e = new Error("gizli değer 42");
    expect(stackCerceveleri(e).join("\n")).not.toContain("gizli değer");
  });

  it("cerezDegeri başlıktan tek çerezi okur", () => {
    expect(cerezDegeri("a=1; oturum=tok%2Ben; b=2", "oturum")).toBe("tok+en");
    expect(cerezDegeri(["a=1", "oturum=x"], "oturum")).toBe("x");
    expect(cerezDegeri(undefined, "oturum")).toBeNull();
    expect(cerezDegeri("oturumx=1", "oturum")).toBeNull();
  });

  it("benzersizIhlali yalnız P2002'yi tanır; IsHatasi ayrı sınıftır (X-3-3)", () => {
    expect(benzersizIhlali(prismaHatasi("P2002"))).toBe(true);
    expect(benzersizIhlali(prismaHatasi("P2003"))).toBe(false);
    expect(benzersizIhlali(new Error("x"))).toBe(false);
    expect(new IsHatasi("m")).toBeInstanceOf(Error);
    expect(new IsHatasi("m").name).toBe("IsHatasi");
  });
});

describe("logArgumanlariniArindir (X-3-2)", () => {
  it("Error nesnesini mesajsız özete çevirir, diğer argümanlara dokunmaz", () => {
    const [isaret, ozet, sayi] = logArgumanlariniArindir(["⨯", prismaHatasi("P2003"), 3]);
    expect(isaret).toBe("⨯");
    expect(sayi).toBe(3);
    expect(JSON.parse(ozet as string)).toMatchObject({ olay: "hata_ozeti", sinif: "PrismaClientKnownRequestError:P2003" });
    for (const sizinti of ["Ayşe", "05321234567", "phoneNormalized"]) expect(ozet).not.toContain(sizinti);
  });
});
