import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { eszamanlilikHatasi, pasiflestirmeEngeli, pasiflestirmeTxSecenekleri } from "@/lib/kullanici";

// E-2 §(7) — hesabın sert kısıtları. KABUL_KRITERLERI E-2-9.
type Rol = "YONETICI" | "OPERASYON" | "SATICI";

const kullanici = (name: string, role: Rol, isActive = true) =>
  prisma.user.create({ data: { name, email: `${name}@m.local`, passwordHash: "x", role, isActive } });

/** `updateUser` ile aynı sıra: kural kontrolü → yazım, aynı transaction ve aynı seçeneklerle. */
const pasiflestir = (hedef: { id: string; role: Rol }, yapanId: string, araAdim?: () => Promise<unknown>) =>
  prisma.$transaction(async (tx) => {
    const engel = await pasiflestirmeEngeli(tx, hedef, yapanId);
    if (engel) return engel;
    await araAdim?.();
    await tx.user.update({ where: { id: hedef.id }, data: { isActive: false } });
    return null;
  }, pasiflestirmeTxSecenekleri(hedef.role));

const aktifYoneticiSayisi = () => prisma.user.count({ where: { role: "YONETICI", isActive: true } });

describe("pasiflestirmeEngeli (E-2-9)", () => {
  let y1 = { id: "", role: "YONETICI" as Rol };
  let y2 = { id: "", role: "YONETICI" as Rol };

  beforeEach(async () => {
    y1 = await kullanici("y1", "YONETICI");
    y2 = await kullanici("y2", "YONETICI");
  });

  it("kullanıcı kendini pasifleştiremez", async () => {
    expect(await pasiflestir(y1, y1.id)).toBe("KENDINI_PASIFLESTIREMEZ");
    expect(await aktifYoneticiSayisi()).toBe(2);
  });

  it("başka aktif yönetici varken yönetici pasifleşir; son aktif yönetici pasifleşemez", async () => {
    expect(await pasiflestir(y2, y1.id)).toBeNull();
    // y2 artık pasif; y1 son aktif yönetici. Pasifleştirmeyi yapan başkası olsa da reddedilir.
    const op = await kullanici("op", "OPERASYON");
    expect(await pasiflestir(y1, op.id)).toBe("SON_YONETICI");
    expect(await aktifYoneticiSayisi()).toBe(1);
  });

  it("pasif yöneticiler sayılmaz", async () => {
    await prisma.user.update({ where: { id: y2.id }, data: { isActive: false } });
    const op = await kullanici("op", "OPERASYON");
    expect(await pasiflestir(y1, op.id)).toBe("SON_YONETICI");
  });

  it("yönetici olmayan kullanıcı için son yönetici kuralı uygulanmaz", async () => {
    const s = await kullanici("s", "SATICI");
    expect(await pasiflestir(s, y1.id)).toBeNull();
  });

  it("iki yönetici eşzamanlı olarak birbirini pasifleştirirse biri reddedilir, aktif yönetici kalır", async () => {
    // Her iki transaction da kontrolü yapar (ikisi de "başka aktif yönetici var" görür), sonra
    // ikisinin de okuması bitmeden yazmaya geçer — write skew. SERIALIZABLE ikinciyi geri alır.
    let bekleyen = 2;
    let birak!: () => void;
    const ikisiOkudu = new Promise<void>((r) => (birak = r));
    const engel = async () => {
      if (--bekleyen === 0) birak();
      await ikisiOkudu;
    };

    const sonuclar = await Promise.allSettled([pasiflestir(y2, y1.id, engel), pasiflestir(y1, y2.id, engel)]);

    const basarili = sonuclar.filter((s) => s.status === "fulfilled" && s.value === null);
    const reddedilen = sonuclar.filter((s) => s.status === "rejected");
    expect(basarili).toHaveLength(1);
    expect(reddedilen).toHaveLength(1);
    expect(eszamanlilikHatasi((reddedilen[0] as PromiseRejectedResult).reason)).toBe(true);
    expect(await aktifYoneticiSayisi()).toBe(1);
  });
});
