import bcrypt from "bcryptjs";
import { afterEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { policy } from "@/lib/policy";
import { referansVeriYukle } from "../../prisma/referans";

// C9 — `db:seed` referans verisi CANLIDA DA ÇALIŞIR: silmez, tekrar çalıştırılınca
// yinelenen satır üretmez, müşterinin değiştirdiği satıra dokunmaz.

async function sayimlar() {
  return {
    vergi: await prisma.taxRate.count(),
    liste: await prisma.priceList.count(),
    konum: await prisma.stockLocation.count(),
    yontem: await prisma.paymentMethod.count(),
    kargo: await prisma.carrier.count(),
    sebep: await prisma.stockAdjustmentReason.count(),
    kullanici: await prisma.user.count(),
  };
}

afterEach(() => {
  delete process.env.ILK_YONETICI_EPOSTA;
  delete process.env.ILK_YONETICI_PAROLA;
});

describe("referans seed (C9)", () => {
  it("tanım tablolarını, varsayılan listeyi ve tek depoyu açar", async () => {
    await referansVeriYukle(prisma);
    expect(await sayimlar()).toMatchObject({ vergi: 4, liste: 1, konum: 1, yontem: 3, kargo: 3, sebep: 5 });

    // X-10 §(2): varsayılan liste policy'deki kodla açılır.
    await expect(
      prisma.priceList.findUnique({ where: { code: policy.pricing.varsayilanFiyatListesiKodu } })
    ).resolves.not.toBeNull();
    // C-6 §(2-c): varsayılan vergi kodu var.
    await expect(
      prisma.taxRate.findUnique({ where: { code: policy.tax.varsayilanVergiOraniKodu } })
    ).resolves.not.toBeNull();
    // B-7 §(2): DIGER sebebi konmaz.
    expect(await prisma.stockAdjustmentReason.findUnique({ where: { code: "DIGER" } })).toBeNull();
  });

  it("idempotenttir — ikinci çalıştırma yinelenen satır üretmez", async () => {
    await referansVeriYukle(prisma);
    const ilk = await sayimlar();
    await referansVeriYukle(prisma);
    expect(await sayimlar()).toEqual(ilk);
  });

  it("müşterinin değiştirdiği satırı geri almaz (aktif = false kalır)", async () => {
    await referansVeriYukle(prisma);
    await prisma.paymentMethod.update({ where: { name: "Nakit" }, data: { isActive: false } });
    await prisma.taxRate.update({ where: { code: "KDV10" }, data: { name: "KDV %10 (tıbbi cihaz)" } });

    await referansVeriYukle(prisma);
    expect((await prisma.paymentMethod.findUniqueOrThrow({ where: { name: "Nakit" } })).isActive).toBe(false);
    expect((await prisma.taxRate.findUniqueOrThrow({ where: { code: "KDV10" } })).name).toBe(
      "KDV %10 (tıbbi cihaz)"
    );
  });

  it("ilk YONETICI'yi ortam değişkeninden, geçici parolayla açar (E-2 §(2))", async () => {
    process.env.ILK_YONETICI_EPOSTA = "Kurulum@Firma.local";
    process.env.ILK_YONETICI_PAROLA = "gecici-parola";
    const { uyarilar } = await referansVeriYukle(prisma);

    expect(uyarilar).toEqual([]);
    const y = await prisma.user.findUniqueOrThrow({ where: { email: "kurulum@firma.local" } });
    expect(y.role).toBe("YONETICI");
    expect(y.mustChangePassword).toBe(true);
    expect(await bcrypt.compare("gecici-parola", y.passwordHash)).toBe(true);

    // İkinci çalıştırma yeni yönetici açmaz.
    process.env.ILK_YONETICI_EPOSTA = "baska@firma.local";
    await referansVeriYukle(prisma);
    expect(await prisma.user.count({ where: { role: "YONETICI" } })).toBe(1);
  });

  it("ortam değişkeni yoksa yönetici açmaz ve uyarır", async () => {
    const { uyarilar } = await referansVeriYukle(prisma);
    expect(uyarilar).toHaveLength(1);
    expect(await prisma.user.count()).toBe(0);
  });

  it("silmez: var olan iş verisine dokunmaz", async () => {
    await referansVeriYukle(prisma);
    const vergi = await prisma.taxRate.findUniqueOrThrow({ where: { code: "KDV20" } });
    await prisma.product.create({ data: { name: "Ü", code: "U1", taxRateId: vergi.id } });
    await referansVeriYukle(prisma);
    expect(await prisma.product.count()).toBe(1);
  });
});
