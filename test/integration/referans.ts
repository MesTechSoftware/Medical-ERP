import { prisma } from "@/lib/db";
import { policy } from "@/lib/policy";
import { referansVeriYukle } from "../../prisma/referans";

/**
 * Entegrasyon testlerinin ortak referans verisi: `db:seed`'in kendisi (C9).
 * Testler ayrı bir kopya tutmaz; referans veri değişirse testler de onu görür.
 */
export async function referansVeri() {
  await referansVeriYukle(prisma);
  return {
    kdv20: await prisma.taxRate.findUniqueOrThrow({
      where: { code: policy.tax.varsayilanVergiOraniKodu },
    }),
    liste: await prisma.priceList.findUniqueOrThrow({
      where: { code: policy.pricing.varsayilanFiyatListesiKodu },
    }),
    depo: await prisma.stockLocation.findUniqueOrThrow({ where: { code: "MERKEZ" } }),
    havale: await prisma.paymentMethod.findUniqueOrThrow({ where: { name: "Havale / EFT" } }),
  };
}

let telefon = 0;
/** Sahibi `degistirDoktorSahibi()` dışında yazılmaz; testler sahipsiz cari açıp fonksiyonla atar. */
export function yeniDoktorVerisi(ad = "Dr. Test") {
  telefon += 1;
  return {
    accountClass: "DOKTOR" as const,
    fullName: ad,
    clinic: "Klinik",
    region: "Bölge",
    phoneNormalized: `+90532${String(1_000_000 + telefon).slice(-7)}`,
  };
}
