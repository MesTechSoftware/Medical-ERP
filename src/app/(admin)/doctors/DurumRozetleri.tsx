import type { EntityStatus } from "@/generated/prisma/enums";
import type { DoktorRisk } from "@/lib/doctor-cari";
import { StatusBadge, StatusChip } from "@/components/ui";

/**
 * Carinin durum rozetleri — liste ve yan panel ortak (spec Ü-18 §3.3). Renk tek başına bilgi
 * taşımaz, metin daima yazılır. Eksik fatura A-13-2 tanımıdır (A-13-3); limit aşımı
 * `hesaplaDoktorRisk`'in `limitAsildi`'sidir (A-12-5) — ikisi de bilgi kademesidir.
 */
export function DurumRozetleri({
  status,
  eksikFatura,
  risk,
}: {
  status: EntityStatus;
  eksikFatura: boolean;
  risk: Pick<DoktorRisk, "limitAsildi">;
}) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      <StatusBadge status={status} />
      {eksikFatura && <StatusChip ton="uyari">Eksik fatura</StatusChip>}
      {risk.limitAsildi && (
        <span title="Risk kredi limitini aşıyor; tutarlar yan panelde" className="inline-flex">
          <StatusChip ton="hata">Limit aşıldı</StatusChip>
        </span>
      )}
    </span>
  );
}
