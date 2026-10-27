import { Prisma } from "@/generated/prisma/client";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";

/**
 * "Sahipsiz" cari (X-17 §(6)): bayinin sahibi hiç olmaz, sahipsiz sayılmaz (X-8 §(3)). Doktor
 * listesinin süzgeci ve dashboard özeti aynı tanımı okur.
 */
export const SAHIPSIZ_DOKTOR = { ownerSellerId: null, accountClass: "DOKTOR" } as const satisfies Prisma.DoctorWhereInput;

export type SahiplikSonucu =
  | { durum: "TAMAM"; degisen: number }
  | { durum: "HATA"; kuralKodu: "SAHIP_AKTIF_SATICI_DEGIL" | "BAYI_SAHIP_ATANAMAZ" };

type Gerekce = { metin: string; yapanId: string };

/**
 * Doktor satırlarını id sırasıyla kilitler ve sahiplerini kilit altında döner
 * (X-17 §(8), ADR-008 §(1)/(3)). Kilit sıranın başıdır: ürün satırlarından ve belge
 * sayacından önce alınır. Kilit transaction sonuna kadar tutulur.
 */
async function doktorKilitle(
  tx: Prisma.TransactionClient,
  doktorIdleri: readonly string[]
): Promise<{ id: string; ownerSellerId: string | null }[]> {
  const idler = [...new Set(doktorIdleri)].sort();
  if (idler.length === 0) return [];
  return tx.$queryRaw`SELECT "id", "ownerSellerId" FROM "Doctor" WHERE "id" IN (${Prisma.join(idler)}) ORDER BY "id" FOR UPDATE`;
}

/**
 * `degistirDoktorSahibi()` — doktor sahibinin TEK yazma noktası (X-17 §(1)).
 * Tek çağrı noktası listesinin 12. maddesi.
 *
 * - Doktor satırları önce kilitlenir; sahip kilit altında okunur (X-17 §(8)).
 * - Yeni sahip boş değilse aktif bir `SATICI`'dır (X-17 §(2)).
 * - `BAYI`'nin sahibi olmaz (X-17 §(2)); DB'de ayrıca `CHECK` kısıtıdır.
 * - Sahibi gerçekten değişen her doktor için bir iz satırı ve bir denetim kaydı yazılır,
 *   ikisi de bu transaction'da (X-17 §(3), RULE-13). Toplu işlemde gerekçe bir kez
 *   girilir, her doktora ayrı satır düşer (X-17 §(4)).
 */
export async function degistirDoktorSahibi(
  doktorIdleri: readonly string[],
  yeniSahipId: string | null,
  gerekce: Gerekce,
  tx: Prisma.TransactionClient
): Promise<SahiplikSonucu> {
  await doktorKilitle(tx, doktorIdleri);

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
    await createAuditLog(
      {
        actorId: gerekce.yapanId,
        action: AUDIT_ACTIONS.DOCTOR_TRANSFER,
        entityType: "Doctor",
        entityId: d.id,
        before: { ownerSellerId: d.ownerSellerId },
        after: { ownerSellerId: yeniSahipId },
        gerekce: gerekce.metin,
      },
      tx
    );
  }
  return { durum: "TAMAM", degisen: degisenler.length };
}

/**
 * Sipariş girişinde sahibi kilit altında doğrular (X-17 §(8)). Siparişi giren satıcı
 * kilit alındığında hâlâ sahip değilse — arada devir tamamlandıysa — sipariş
 * `SAHIP_DEGISTI` ile reddedilir. Sipariş transaction'ında ürün kilidinden önce çağrılır.
 */
export async function siparisSahibiniKilitle(
  tx: Prisma.TransactionClient,
  doktorId: string,
  saticiId: string
): Promise<{ durum: "TAMAM" } | { durum: "HATA"; kuralKodu: "SAHIP_DEGISTI" }> {
  const [doktor] = await doktorKilitle(tx, [doktorId]);
  return doktor?.ownerSellerId === saticiId ? { durum: "TAMAM" } : { durum: "HATA", kuralKodu: "SAHIP_DEGISTI" };
}

/**
 * Personelin girdiği sipariş (D-2 §(1), X-8 §(4)): cari kilitlenir ve satıcı **sipariş anındaki
 * sahiptir** (X-13 §(3)). `DOKTOR` sahipsizse sipariş girilmez; `BAYI`'nin satıcısı olmaz (X-8 §(3)).
 */
export async function personelSiparisSaticisi(
  tx: Prisma.TransactionClient,
  doktorId: string
): Promise<{ durum: "TAMAM"; saticiId: string | null } | { durum: "HATA"; kuralKodu: "DOKTOR_SAHIPSIZ" | "DOKTOR_PASIF" | "DOKTOR_KAPSAM_DISI" }> {
  await doktorKilitle(tx, [doktorId]);
  const d = await tx.doctor.findUnique({ where: { id: doktorId }, select: { accountClass: true, ownerSellerId: true, status: true } });
  if (!d) return { durum: "HATA", kuralKodu: "DOKTOR_KAPSAM_DISI" };
  if (d.status !== "AKTIF") return { durum: "HATA", kuralKodu: "DOKTOR_PASIF" };
  if (d.accountClass === "BAYI") return { durum: "TAMAM", saticiId: null };
  return d.ownerSellerId ? { durum: "TAMAM", saticiId: d.ownerSellerId } : { durum: "HATA", kuralKodu: "DOKTOR_SAHIPSIZ" };
}

/**
 * Pasifleştirilen satıcının portföyü (X-17 §(5)): bütün doktorları tek bir aktif satıcıya
 * devredilir ya da sahipsiz bırakılır. Hedefi yönetici seçer; otomatik devir yoktur.
 */
export async function portfoyuDevret(
  tx: Prisma.TransactionClient,
  saticiId: string,
  yeniSahipId: string | null,
  gerekce: Gerekce
): Promise<SahiplikSonucu> {
  const doktorlar = await tx.doctor.findMany({ where: { ownerSellerId: saticiId }, select: { id: true } });
  return degistirDoktorSahibi(
    doktorlar.map((d) => d.id),
    yeniSahipId,
    gerekce,
    tx
  );
}
