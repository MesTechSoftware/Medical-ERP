import { prisma } from "@/lib/db";
import { requireDealerAccount } from "@/lib/dealer-session";
import { formatTRY } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { getDealerCari } from "@/lib/dealer-cari";
import { PageHeader, Card, StatCard, EmptyRow, LinkButton } from "@/components/ui";

const STATUS_LABELS: Record<string, string> = {
  TALEP: "Onay bekliyor",
  ONAYLANDI: "Onaylandı",
  IPTAL: "İptal",
  REDDEDILDI: "Reddedildi",
};

/** FR-46b: Bayi dashboard — kendi cari, borç, sevkiyat özeti (READ-ONLY). */
export default async function DealerHomePage() {
  const { dealer } = await requireDealerAccount();

  const [cari, recent] = await Promise.all([
    getDealerCari(dealer.id),
    prisma.dealerShipment.findMany({
      where: { dealerId: dealer.id },
      orderBy: { requestedAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div>
      <PageHeader
        title={`Hoş geldiniz, ${dealer.title}`}
        description={`Bayi kodu: ${dealer.code}`}
        action={
          <LinkButton href="/bayi/talep">Yeni Sevkiyat Talebi</LinkButton>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Toplam Sevkiyat" value={formatTRY(cari.toplamSevkiyat)} />
        <StatCard label="Toplam Ödeme" value={formatTRY(cari.toplamOdeme)} />
        <StatCard
          label="Güncel Borç"
          value={formatTRY(cari.bakiye)}
          tone={cari.bakiye > 0n ? "danger" : "success"}
        />
      </div>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-slate-900">
          Son Sevkiyatlar
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                <th className="px-3 py-2 font-medium">Tarih</th>
                <th className="px-3 py-2 text-right font-medium">Tutar</th>
                <th className="px-3 py-2 font-medium">Durum</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 && (
                <EmptyRow colSpan={3} text="Henüz sevkiyat yok." />
              )}
              {recent.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2 whitespace-nowrap text-slate-500">
                    {formatDate(s.requestedAt)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatTRY(s.grossTotal)}
                  </td>
                  <td className="px-3 py-2">
                    {STATUS_LABELS[s.status] ?? s.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
