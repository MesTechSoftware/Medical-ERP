import type { Role } from "@/generated/prisma/enums";
import { AKIS_GORUNURLUGU, aktiviteCumlesi } from "@/lib/aktivite-sablonlari";
import { prisma } from "@/lib/db";
import { veriOku } from "@/lib/aktivite-sablonlari";

type Etiket = { id: string; etiket: string };

/** Varlık türü → nesne etiketi: belge numarası ya da ürün/liste adı. Doktor ve kullanıcının etiketi yoktur. */
const ETIKETLER: Record<string, (idler: string[]) => Promise<Etiket[]>> = {
  Order: (idler) =>
    prisma.order.findMany({ where: { id: { in: idler } }, select: { id: true, documentNo: true } }).then((s) => s.map((x) => ({ id: x.id, etiket: x.documentNo }))),
  DoctorPayment: (idler) =>
    prisma.doctorPayment.findMany({ where: { id: { in: idler } }, select: { id: true, documentNo: true } }).then((s) => s.map((x) => ({ id: x.id, etiket: x.documentNo }))),
  LedgerEntry: (idler) =>
    prisma.ledgerEntry.findMany({ where: { id: { in: idler } }, select: { id: true, documentNo: true } }).then((s) => s.map((x) => ({ id: x.id, etiket: x.documentNo }))),
  StockAdjustment: (idler) =>
    prisma.stockAdjustment.findMany({ where: { id: { in: idler } }, select: { id: true, documentNo: true } }).then((s) => s.map((x) => ({ id: x.id, etiket: x.documentNo }))),
  ImportBatch: (idler) =>
    prisma.importBatch.findMany({ where: { id: { in: idler } }, select: { id: true, batchNo: true } }).then((s) => s.map((x) => ({ id: x.id, etiket: x.batchNo }))),
  PriceList: (idler) =>
    prisma.priceList.findMany({ where: { id: { in: idler } }, select: { id: true, code: true } }).then((s) => s.map((x) => ({ id: x.id, etiket: x.code }))),
  Product: (idler) =>
    prisma.product.findMany({ where: { id: { in: idler } }, select: { id: true, name: true } }).then((s) => s.map((x) => ({ id: x.id, etiket: x.name }))),
};

/** Kayıtların nesne etiketleri, varlık türü başına tek sorgu; anahtar `tür:kimlik`. */
export async function nesneEtiketleri(kayitlar: readonly { entityType: string; entityId: string | null }[]): Promise<Map<string, string>> {
  const turler = new Map<string, string[]>();
  for (const k of kayitlar) {
    if (!k.entityId || !Object.hasOwn(ETIKETLER, k.entityType)) continue;
    turler.set(k.entityType, [...(turler.get(k.entityType) ?? []), k.entityId]);
  }
  const sonuclar = await Promise.all(
    [...turler].map(async ([tur, idler]) => (await ETIKETLER[tur]([...new Set(idler)])).map((e) => [`${tur}:${e.id}`, e.etiket] as const))
  );
  return new Map(sonuclar.flat());
}

/**
 * Devir satırının nesnesi: "Dr. Cem Arslan → Ayşe Demir" (doktor → yeni sahip satıcı; sahipsizse "Sahipsiz").
 * Kişi adı yalnız devirde yazılır — devrin anlamı kimden kime gittiğidir; öbür olaylar ad taşımaz.
 */
async function devirNesneleri(
  kayitlar: readonly { id: string; action: string; entityId: string | null; afterData: string | null }[]
): Promise<Map<string, string>> {
  const devirler = kayitlar.filter((k) => k.action === "DOCTOR_TRANSFER" && k.entityId);
  if (devirler.length === 0) return new Map();
  const yeniSahip = (k: { afterData: string | null }) => {
    const id = veriOku(k.afterData).ownerSellerId;
    return typeof id === "string" ? id : null;
  };
  const [doktorlar, satici] = await Promise.all([
    prisma.doctor.findMany({ where: { id: { in: devirler.map((k) => k.entityId!) } }, select: { id: true, fullName: true } }),
    prisma.user.findMany({ where: { id: { in: devirler.flatMap((k) => yeniSahip(k) ?? []) } }, select: { id: true, name: true } }),
  ]);
  const doktorAdi = new Map(doktorlar.map((d) => [d.id, d.fullName]));
  const saticiAdi = new Map(satici.map((u) => [u.id, u.name]));
  return new Map(
    devirler.flatMap((k) => {
      const dr = doktorAdi.get(k.entityId!);
      if (!dr) return [];
      const yeni = yeniSahip(k);
      return [[k.id, `${dr} → ${yeni ? (saticiAdi.get(yeni) ?? "Sahipsiz") : "Sahipsiz"}`] as const];
    })
  );
}

export type AktiviteSatiri = { id: string; an: Date; metin: string };

/**
 * Dashboard aktivite akışı (brief §3.6): rolün görebildiği son `adet` olay, en yeniden. Rolün
 * tablosu boşsa denetim kaydı hiç okunmaz.
 */
export async function aktiviteAkisi(rol: Role, adet: number): Promise<AktiviteSatiri[]> {
  const olaylar = AKIS_GORUNURLUGU[rol];
  if (olaylar.length === 0) return [];
  const kayitlar = await prisma.auditLog.findMany({
    where: { action: { in: [...olaylar] } },
    orderBy: { createdAt: "desc" },
    take: adet,
    select: { id: true, action: true, entityType: true, entityId: true, afterData: true, createdAt: true, actor: { select: { name: true } } },
  });
  const [etiketler, devirler] = await Promise.all([nesneEtiketleri(kayitlar), devirNesneleri(kayitlar)]);
  return kayitlar.flatMap((k) => {
    const nesne = devirler.get(k.id) ?? (k.entityId ? (etiketler.get(`${k.entityType}:${k.entityId}`) ?? null) : null);
    const metin = aktiviteCumlesi({ action: k.action, afterData: k.afterData, aktor: k.actor?.name ?? null, nesne });
    return metin ? [{ id: k.id, an: k.createdAt, metin }] : [];
  });
}
