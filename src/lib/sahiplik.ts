import type { Prisma } from "@/generated/prisma/client";

export type SahiplikSonucu =
  | { durum: "TAMAM"; degisen: number }
  | { durum: "HATA"; kuralKodu: "SAHIP_AKTIF_SATICI_DEGIL" | "BAYI_SAHIP_ATANAMAZ" };

/**
 * `degistirDoktorSahibi()` — doktor sahibinin TEK yazma noktası (X-17 §(1)).
 * Tek çağrı noktası listesinin 12. maddesi; bu, `CM` ilk sürümüdür. Doktor satırı
 * kilidi (X-17 §(8), ADR-008) ve CI kontrolü 1B madde 3'tedir.
 *
 * - Yeni sahip boş değilse aktif bir `SATICI`'dır (X-17 §(2)).
 * - `BAYI`'nin sahibi olmaz (X-17 §(2)); DB'de ayrıca `CHECK` kısıtıdır.
 * - Sahibi gerçekten değişen her doktor için bir iz satırı yazılır (X-17 §(3)).
 *   Toplu işlemde gerekçe bir kez girilir, her doktora ayrı satır düşer (X-17 §(4)).
 */
export async function degistirDoktorSahibi(
  doktorIdleri: readonly string[],
  yeniSahipId: string | null,
  gerekce: { metin: string; yapanId: string },
  tx: Prisma.TransactionClient
): Promise<SahiplikSonucu> {
  if (yeniSahipId) {
    const sahip = await tx.user.findUnique({
      where: { id: yeniSahipId },
      select: { role: true, isActive: true },
    });
    if (!sahip || sahip.role !== "SATICI" || !sahip.isActive) {
      return { durum: "HATA", kuralKodu: "SAHIP_AKTIF_SATICI_DEGIL" };
    }
  }

  const doktorlar = await tx.doctor.findMany({
    where: { id: { in: [...doktorIdleri] } },
    select: { id: true, accountClass: true, ownerSellerId: true },
    orderBy: { id: "asc" },
  });
  if (yeniSahipId && doktorlar.some((d) => d.accountClass === "BAYI")) {
    return { durum: "HATA", kuralKodu: "BAYI_SAHIP_ATANAMAZ" };
  }

  const degisenler = doktorlar.filter((d) => d.ownerSellerId !== yeniSahipId);
  for (const d of degisenler) {
    await tx.doctor.update({ where: { id: d.id }, data: { ownerSellerId: yeniSahipId } });
    await tx.doctorAssignment.create({
      data: {
        doctorId: d.id,
        fromSellerId: d.ownerSellerId,
        toSellerId: yeniSahipId,
        changedById: gerekce.yapanId,
        reason: gerekce.metin,
      },
    });
  }
  return { durum: "TAMAM", degisen: degisenler.length };
}
