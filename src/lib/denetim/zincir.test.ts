import { describe, expect, it } from "vitest";

import { type KanonikKayit, kanonikMetin, muhurHesapla, zinciriDenetle, type MuhurSatiri } from "@/lib/denetim/zincir";

// X-18-2: mühür = SHA-256(önceki mühür ‖ kanonik kayıt). Biçim veritabanındaki `denetim_kanonik()`
// ile birebir aynıdır (eşitlik `zincir.itest.ts`'te); bu dosya biçimi sabit vektörle dondurur.

const KAYIT: KanonikKayit = {
  id: "0192f0c4-0000-7000-8000-000000000001",
  seq: 7,
  createdAt: new Date("2026-10-27T11:02:11.123Z"),
  actorId: "ckaktor",
  actorRole: "YONETICI",
  action: "DUE_DATE_CHANGE",
  actionType: "GUNCELLEME",
  module: "FINANS",
  entityType: "LedgerEntry",
  entityId: "ckhareket",
  beforeData: '{"dueDate":"2026-11-01"}',
  afterData: '{"dueDate":"2026-11-15"}',
  changes: "[]",
  reason: "Müşteri isteği",
  ipAddress: "10.0.0.12",
  sessionId: null,
  requestMethod: "POST",
  endpoint: "/collections",
};

// Bağımsız hesap: `shasum -a 256` (tasarım 3 D1, 27.10.2026).
const ILK_MUHUR = "b35af7a1ba2eef337fc76464190712d485cd79e883ade3d9d69b907d17f788c2";
const IKINCI_MUHUR = "f408fb422d6bbc8c65d7b5f6d69201125c80bcdf73692383d5d60adf22fbccbb";

describe("kanonikMetin", () => {
  it("alanlar sabit sırayla, UTF-8 bayt uzunluğu önekiyle; boş alan ~", () => {
    expect(kanonikMetin(KAYIT)).toBe(
      "36:0192f0c4-0000-7000-8000-000000000001" +
        "1:7" +
        "24:2026-10-27T11:02:11.123Z" +
        "7:ckaktor8:YONETICI15:DUE_DATE_CHANGE10:GUNCELLEME6:FINANS11:LedgerEntry9:ckhareket" +
        '24:{"dueDate":"2026-11-01"}24:{"dueDate":"2026-11-15"}2:[]' +
        "17:Müşteri isteği" +
        "9:10.0.0.12~4:POST12:/collections"
    );
  });

  it("boş metin ile boş alan ayrışır", () => {
    expect(kanonikMetin({ ...KAYIT, reason: "" })).toContain("0:9:10.0.0.12");
    expect(kanonikMetin({ ...KAYIT, reason: null })).toContain("~9:10.0.0.12");
  });
});

describe("muhurHesapla", () => {
  it("ilk mühür önceki özet olmadan kanonik metnin SHA-256'sıdır", () => {
    expect(muhurHesapla(null, KAYIT)).toBe(ILK_MUHUR);
  });

  it("sonraki mühür önceki özeti de kapsar", () => {
    expect(muhurHesapla(ILK_MUHUR, KAYIT)).toBe(IKINCI_MUHUR);
  });
});

describe("zinciriDenetle", () => {
  const kayit = (n: number): KanonikKayit => ({ ...KAYIT, id: `log-${n}`, seq: n });
  function zincir(adet: number): MuhurSatiri[] {
    const satirlar: MuhurSatiri[] = [];
    let onceki: string | null = null;
    for (let n = 1; n <= adet; n++) {
      const hash = muhurHesapla(onceki, kayit(n));
      satirlar.push({ chainIndex: n, logId: `log-${n}`, prevHash: onceki, hash, kayit: kayit(n) });
      onceki = hash;
    }
    return satirlar;
  }
  const BAS = { sonIndeks: 0, sonHash: null };

  it("sağlam zincirde sorun yok; durum son mühürde biter", () => {
    const z = zincir(3);
    expect(zinciriDenetle(z, BAS)).toEqual({ sorunlar: [], durum: { sonIndeks: 3, sonHash: z[2].hash } });
  });

  it("içeriği değişen kaydı adıyla bildirir", () => {
    const z = zincir(3);
    z[1] = { ...z[1], kayit: { ...kayit(2), afterData: '{"dueDate":"2027-01-01"}' } };
    expect(zinciriDenetle(z, BAS).sorunlar).toEqual([{ chainIndex: 2, logId: "log-2", tur: "ICERIK_UYUSMUYOR" }]);
  });

  it("silinen kayıt ve mührü boşluk ve kopuk bağ olarak görünür", () => {
    const z = zincir(3);
    expect(zinciriDenetle([z[0], z[2]], BAS).sorunlar).toEqual([
      { chainIndex: 3, logId: "log-3", tur: "ZINCIR_BOSLUGU" },
      { chainIndex: 3, logId: "log-3", tur: "BAG_KOPUK" },
    ]);
  });

  it("mührü duran ama kaydı silinen satırı bildirir", () => {
    const z = zincir(2);
    z[1] = { ...z[1], kayit: null };
    expect(zinciriDenetle(z, BAS).sorunlar).toEqual([{ chainIndex: 2, logId: "log-2", tur: "KAYIT_YOK" }]);
  });

  it("partiler arasında durum taşınır", () => {
    const z = zincir(4);
    const ilk = zinciriDenetle(z.slice(0, 2), BAS);
    expect(zinciriDenetle(z.slice(2), ilk.durum)).toEqual({ sorunlar: [], durum: { sonIndeks: 4, sonHash: z[3].hash } });
  });
});
