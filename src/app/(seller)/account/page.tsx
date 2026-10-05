import { prisma } from "@/lib/db";
import { requireSeller } from "@/lib/session";
import { formatla } from "@/lib/money";
import { SIPARIS_SATIRI, siparisToplami } from "@/lib/siparis";
import { PageHeader, StatCard } from "@/components/ui";

/**
 * FR-27: Satıcı panelinde KENDİ portföyünün durumu.
 *
 * BRK-01: Satıcı artık şirkete borçlu DEĞİL (D-01). Sipariş başına kalan
 * borç, yaşlandırma ve vadesi geçmiş tutar C3'te söküldü (GÇ-3, X-6 §(5)/(7));
 * yerine doktor bakiyesi + vade uyarısı 1B'de gelir (X-6 §(6)).
 */
export default async function AccountPage() {
  const session = await requireSeller();
  const sellerId = session.user.id;

  const doctorCount = await prisma.doctor.count({
    where: { ownerSellerId: sellerId },
  });

  // FR-61: ortalama iskonto (tutar ağırlıklı).
  const items = await prisma.orderItem.findMany({
    where: { order: { sellerId, status: { not: "IPTAL" } } },
    select: SIPARIS_SATIRI,
  });
  const ortalamaIskonto = siparisToplami(items).iskontoOran;

  return (
    <div>
      <PageHeader title="Hesabım" description="Portföy durumu" />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard label="Doktor Sayısı" value={String(doctorCount)} />
        <StatCard label="Ortalama İskonto" value={formatla(ortalamaIskonto, "oran")} />
      </div>
    </div>
  );
}
