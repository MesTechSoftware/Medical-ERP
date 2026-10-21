import { prisma } from "@/lib/db";

/** Cari formunun seçenekleri: aktif satıcılar (X-17 §(7)) ve fiyat listeleri (X-10 §(2)). */
export async function cariSecenekleri() {
  const [saticilar, listeler] = await Promise.all([
    prisma.user.findMany({ where: { role: "SATICI", isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.priceList.findMany({ orderBy: { code: "asc" }, select: { id: true, code: true, name: true } }),
  ]);
  return {
    saticilar: saticilar.map((s) => ({ value: s.id, label: s.name })),
    listeler: listeler.map((l) => ({ value: l.id, label: `${l.code} — ${l.name}` })),
  };
}
