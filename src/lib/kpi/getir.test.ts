import { afterEach, describe, expect, it, vi } from "vitest";

import { kpiGetir } from "@/lib/kpi/getir";

describe("kpiGetir — kart düzeyinde hata (X-3)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("başarıda değeri verir, log yazmaz", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await kpiGetir(async () => 42, { yol: "/dashboard", kullaniciId: "u1" })).toEqual({ tamam: true, deger: 42 });
    expect(log).not.toHaveBeenCalled();
  });

  it("hatada başarı dönmez: referans döner, aynı referans tek teknik hata satırına yazılır; mesaj yazılmaz", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const sonuc = await kpiGetir(
      async () => {
        throw new Error("gizli: doktor Ayşe, tutar 1250");
      },
      { yol: "/doctors/abc?q=Ayşe", kullaniciId: "u1" }
    );
    expect(sonuc.tamam).toBe(false);
    const referans = sonuc.tamam ? "" : sonuc.referans;
    expect(referans).toMatch(/^[0-9a-f]{8}$/);
    expect(log).toHaveBeenCalledTimes(1);
    const satir = JSON.parse(String(log.mock.calls[0][0]));
    expect(satir).toMatchObject({ olay: "teknik_hata", referans, rota: "/doctors/abc", kullaniciId: "u1", sinif: "Error" });
    expect(String(log.mock.calls[0][0])).not.toContain("Ayşe");
    expect(String(log.mock.calls[0][0])).not.toContain("1250");
  });
});
