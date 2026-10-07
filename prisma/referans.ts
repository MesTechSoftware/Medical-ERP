import bcrypt from "bcryptjs";
import type { PrismaClient } from "../src/generated/prisma/client";
import { policy } from "../src/lib/policy";

/**
 * Referans veri — `db:seed` (C9). CANLIDA DA ÇALIŞIR: hiçbir şey silmez, var olan
 * satıra dokunmaz, tekrar çalıştırıldığında yinelenen satır üretmez (idempotent).
 * Müşterinin sonradan değiştirdiği satır (ör. `aktif = false`) geri alınmaz.
 *
 * İçerik (FAZ1 §B.1 Seed): tanım tablolarının başlangıç satırları (K-8 §(1)) ·
 * varsayılan fiyat listesi (`pricing.varsayilanFiyatListesiKodu`, X-10) · tek depo (B-4) ·
 * ilk `YONETICI` (E-2 §(2)).
 */
export async function referansVeriYukle(prisma: PrismaClient): Promise<{ uyarilar: string[] }> {
  const uyarilar: string[] = [];

  // C-6 §(1): KDV oranları tanım tablosudur.
  for (const v of [
    { code: "KDV20", name: "KDV %20", rate: "20", sortOrder: 1 },
    { code: "KDV10", name: "KDV %10", rate: "10", sortOrder: 2 },
    { code: "KDV1", name: "KDV %1", rate: "1", sortOrder: 3 },
    { code: "KDV0", name: "KDV %0", rate: "0", sortOrder: 4 },
  ]) {
    await prisma.taxRate.upsert({ where: { code: v.code }, create: v, update: {} });
  }

  // X-10 §(2): varsayılan liste kodla seçilir; seed bu kodla açar.
  const listeKodu = policy.pricing.varsayilanFiyatListesiKodu;
  await prisma.priceList.upsert({
    where: { code: listeKodu },
    create: { code: listeKodu, name: "Varsayılan Liste" },
    update: {},
  });

  // B-4: Faz 1'de tek depo seed edilir.
  await prisma.stockLocation.upsert({
    where: { code: "MERKEZ" },
    create: { code: "MERKEZ", name: "Merkez Depo", type: "DEPO", sortOrder: 1 },
    update: {},
  });

  // A-11: ödeme yöntemi tanım tablosudur; tipi kodda kapalıdır.
  for (const m of [
    { name: "Nakit", type: "NAKIT" as const, sortOrder: 1 },
    { name: "Havale / EFT", type: "BANKA" as const, sortOrder: 2 },
    { name: "Kredi Kartı (POS)", type: "POS" as const, sortOrder: 3 },
  ]) {
    await prisma.paymentMethod.upsert({ where: { name: m.name }, create: m, update: {} });
  }

  // D-3: kargo firması tanım tablosudur.
  for (const k of [
    { name: "Aras Kargo", sortOrder: 1 },
    { name: "Yurtiçi Kargo", sortOrder: 2 },
    { name: "MNG Kargo", sortOrder: 3 },
  ]) {
    await prisma.carrier.upsert({ where: { name: k.name }, create: k, update: {} });
  }

  // B-7 §(2): mevzuatın ayrımına göre; DIGER satırı konmaz.
  for (const r of [
    { code: "SAYIM_FARKI", name: "Sayım farkı", sortOrder: 1 },
    { code: "HASAR", name: "Hasar", sortOrder: 2 },
    { code: "KAYIP", name: "Kayıp", sortOrder: 3 },
    { code: "MIAD_IMHA", name: "Miad / imha", sortOrder: 4 },
    { code: "ACILIS_DUZELTME", name: "Açılış düzeltmesi", sortOrder: 5 },
  ]) {
    await prisma.stockAdjustmentReason.upsert({ where: { code: r.code }, create: r, update: {} });
  }

  // E-2 §(2): ilk YONETICI kurulumda seed edilir, geçici parolayla; ilk girişte değişim
  // zorunludur. Parola koda yazılmaz — devreye almada ortam değişkeniyle verilir.
  // Zaten bir YONETICI varsa hiçbir şey yapılmaz.
  if ((await prisma.user.count({ where: { role: "YONETICI" } })) === 0) {
    const email = process.env.ILK_YONETICI_EPOSTA?.trim().toLowerCase();
    const parola = process.env.ILK_YONETICI_PAROLA;
    if (email && parola) {
      await prisma.user.create({
        data: {
          name: "Sistem Yöneticisi",
          email,
          passwordHash: await bcrypt.hash(parola, 10),
          role: "YONETICI",
          mustChangePassword: true,
        },
      });
    } else {
      uyarilar.push(
        "YONETICI yok ve ILK_YONETICI_EPOSTA / ILK_YONETICI_PAROLA tanımlı değil — ilk yönetici açılmadı."
      );
    }
  }

  return { uyarilar };
}
