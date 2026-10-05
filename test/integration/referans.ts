import { prisma } from "@/lib/db";
import { policy } from "@/lib/policy";

/**
 * Entegrasyon testlerinin ortak referans verisi: CM'den sonra her akışın ön koşulu
 * olan tanım tablosu satırları (seed'in referans kısmının asgarisi).
 */
export async function referansVeri() {
  const kdv20 = await prisma.taxRate.create({
    data: { code: policy.tax.varsayilanVergiOraniKodu, name: "KDV %20", rate: "20" },
  });
  const liste = await prisma.priceList.create({
    data: { code: policy.pricing.varsayilanFiyatListesiKodu, name: "Varsayılan" },
  });
  const depo = await prisma.stockLocation.create({
    data: { code: "MERKEZ", name: "Merkez Depo", type: "DEPO" },
  });
  const havale = await prisma.paymentMethod.create({
    data: { name: "Havale / EFT", type: "BANKA" },
  });
  return { kdv20, liste, depo, havale };
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
