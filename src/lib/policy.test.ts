import { describe, expect, it } from "vitest";

import { policy } from "@/lib/policy";

// policy.ts ↔ FAZ1_UYGULAMA_KAPSAMI.md §B.7 sözleşmesi. Anahtar adları
// normatiftir (ADR-001); bir anahtarın eklenmesi/düşmesi bu listeyi de
// değiştirmeyi gerektirir — sessiz sapma olmasın diye.
const B7_ANAHTARLARI = [
  "finance.odemeVadesiGunVarsayilan",
  "finance.vadeFarkiOrani",
  "finance.vadeFarkiGunSayimBazi",
  "finance.kredilimitiBloklar",
  "finance.faturaBilgisiZorunlu",
  "finance.nakitTevsikLimiti",
  "pricing.iskontoTavani",
  "pricing.fiyatGirisiKdvDahil",
  "pricing.varsayilanFiyatListesiKodu",
  "tax.varsayilanVergiOraniKodu",
  "kvkk.saklamaSuresiYil",
  "export.sablonTanimi",
  "export.faturaGeriyeDonukUyariGun",
  "belge.onekleri",
  "notifications.enabled",
  "modules.congress",
  "zaman.saatDilimi",
  "auth.oturumHareketsizlikSaat",
  "auth.oturumMutlakSaat",
  "auth.girisDenemeSiniri",
  "auth.girisKilitDakika",
  "import.azamiDosyaBoyutMb",
  "finance.primOraniVarsayilan",
];

function anahtarlar(obj: object, onEk = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v !== null && typeof v === "object" && !Array.isArray(v)
      ? anahtarlar(v, `${onEk}${k}.`)
      : [`${onEk}${k}`]
  );
}

describe("policy.ts — §B.7 sözleşmesi", () => {
  it("tam olarak 23 anahtar taşır, adları §B.7 ile birebir", () => {
    expect(B7_ANAHTARLARI).toHaveLength(23);
    expect(anahtarlar(policy).sort()).toEqual([...B7_ANAHTARLARI].sort());
  });

  it("kararla belirlenmiş değerler", () => {
    expect(policy.finance.odemeVadesiGunVarsayilan).toBe(30);
    expect(policy.finance.primOraniVarsayilan).toBe(5);
    expect(policy.finance.vadeFarkiOrani).toBeNull();
    expect(policy.pricing.iskontoTavani).toBeNull();
    expect(policy.pricing.fiyatGirisiKdvDahil).toBe(false);
    expect(policy.tax.varsayilanVergiOraniKodu).toBe("KDV20");
    expect(policy.kvkk.saklamaSuresiYil).toBe(10);
    expect(policy.modules.congress).toBe(false);
    expect(policy.zaman.saatDilimi).toBe("Europe/Istanbul");
    expect(policy.auth.oturumHareketsizlikSaat).toBe(4);
    expect(policy.auth.oturumMutlakSaat).toBe(12);
    expect(policy.auth.girisDenemeSiniri).toBe(5);
    expect(policy.auth.girisKilitDakika).toBe(10);
  });

  it("belge önekleri §B.4'teki dokuz önektir, tekrarsız", () => {
    const onekler = policy.belge.onekleri;
    expect(onekler).toEqual(["SIP", "SVK", "IAD", "KNS", "TRF", "THS", "ACL", "VDF", "DZL"]);
    expect(new Set(onekler).size).toBe(9);
  });
});
