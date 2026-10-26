import type { Prisma } from "@/generated/prisma/client";
import { AUDIT_ACTIONS, createAuditLog } from "@/lib/audit";
import { hesaplaStok, stokHareketiYaz, varsayilanDepoId } from "@/lib/stok";

/**
 * Depoya stok girişi — ekran ve demo geçmiş seed'inin ortak yolu. Stok miktarı saklanmaz; giriş
 * yalnız hareket yazar (ADR-005), hareket stok.ts'den (tek yazım noktası, B-4).
 */
export async function stokGirisiYaz(
  tx: Prisma.TransactionClient,
  g: { urunId: string; miktar: number; not: string | null; yapanId: string }
): Promise<void> {
  await stokHareketiYaz(tx, [
    { productId: g.urunId, locationId: await varsayilanDepoId(tx), type: "GIRIS", quantity: g.miktar, note: g.not ?? "Stok girişi" },
  ]);
  await createAuditLog(
    {
      actorId: g.yapanId,
      action: AUDIT_ACTIONS.STOCK_ENTRY,
      entityType: "Product",
      entityId: g.urunId,
      after: { quantity: g.miktar, newStock: await hesaplaStok(g.urunId, undefined, undefined, tx), note: g.not },
    },
    tx
  );
}
