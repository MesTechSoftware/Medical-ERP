import { describe, expect, it } from "vitest";
import { cizelgeEsle } from "@/components/siparis/durum-cizelgesi";

const g = (status: string, sevkVar = false, kalanKapatildi = false) => cizelgeEsle({ status, sevkVar, kalanKapatildi });

describe("durum çizelgesi eşlemesi (A-3-10)", () => {
  it("TEKLIF ve IPTAL çizelge değildir", () => {
    expect(g("TEKLIF")).toEqual({ tur: "teklif" });
    expect(g("IPTAL")).toEqual({ tur: "iptal" });
  });
  it("her durum kendi adımını etkinleştirir", () => {
    expect(g("BEKLIYOR")).toMatchObject({ etkin: 0, not: null });
    expect(g("HAZIRLANIYOR")).toMatchObject({ etkin: 1, not: null });
    expect(g("KARGOLANDI")).toMatchObject({ etkin: 2, not: null });
    expect(g("TESLIM_EDILDI")).toMatchObject({ etkin: 3, not: null });
  });
  it("kısmi sevk ve kalanı kapatma notları", () => {
    expect(g("HAZIRLANIYOR", true)).toMatchObject({ not: "Kısmi sevk" });
    expect(g("KARGOLANDI", true, true)).toMatchObject({ not: "Kalanı kapatıldı" });
  });
});
