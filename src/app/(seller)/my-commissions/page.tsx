import { prisma } from "@/lib/db";
import { requireSeller } from "@/lib/session";
import { formatTRY } from "@/lib/money";
import { formatPeriod, periodOf } from "@/lib/commission";
import { getPeriodPreview } from "@/lib/commission-service";
import { PageHeader, Card, StatCard, EmptyRow } from "@/components/ui";

/**
 * FR-37: Satıcı panelinde ay içi anlık tahsilat, tahmini prim ve geçmiş dönem
 * dökümü. "Sipariş açıldı ama henüz tahsil edilmedi" tutarı AYRI gösterilir —
 * hem motivasyon hem tahsilat baskısı içindir.
 */
export default async function MyCommissionsPage() {
  const session = await requireSeller();
  const sellerId = session.user.id;
  const current = periodOf(new Date());

  const [preview, closed] = await Promise.all([
    getPeriodPreview(sellerId, current),
    prisma.commissionPeriod.findMany({
      where: { sellerId },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      take: 24,
    }),
  ]);

  const STATUS_LABELS: Record<string, string> = {
    HESAPLANDI: "Hesaplandı",
    ONAYLANDI: "Onaylandı",
    ODENDI: "Ödendi",
  };

  return (
    <div>
      <PageHeader
        title="Primlerim"
        description={`Açık dönem: ${formatPeriod(current)}`}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Bu Ay Tahsil Edilen (net)"
          value={formatTRY(preview.baseAmount)}
          hint="Prim matrahı"
        />
        <StatCard label="Prim Oranı" value={`%${preview.ratePercent}`} />
        <StatCard
          label="Tahmini Prim"
          value={formatTRY(preview.commissionAmount)}
          tone="success"
          hint="Dönem kapanınca kesinleşir"
        />
        <StatCard
          label="Henüz Tahsil Edilmedi"
          value={formatTRY(preview.openReceivable)}
          tone={preview.openReceivable > 0n ? "danger" : "default"}
          hint="Tahsil edilirse prime döner"
        />
      </div>

      {preview.adjustmentTotal !== 0n && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Bu dönemde <strong>{formatTRY(preview.adjustmentTotal)}</strong>{" "}
          tutarında matrah düzeltmesi var (kapanmış bir döneme ait tahsilat
          iptalinden kaynaklanır).
        </div>
      )}

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-slate-900">
          Geçmiş Dönemler
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                <th className="px-3 py-2 font-medium">Dönem</th>
                <th className="px-3 py-2 text-right font-medium">
                  Matrah (net)
                </th>
                <th className="px-3 py-2 text-right font-medium">Oran</th>
                <th className="px-3 py-2 text-right font-medium">Prim</th>
                <th className="px-3 py-2 font-medium">Durum</th>
              </tr>
            </thead>
            <tbody>
              {closed.length === 0 && (
                <EmptyRow colSpan={5} text="Henüz kapanmış dönem yok." />
              )}
              {closed.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="px-3 py-2 tabular-nums">
                    {formatPeriod({ year: p.year, month: p.month })}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatTRY(p.baseAmount)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    %{p.ratePercent}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">
                    {formatTRY(p.commissionAmount)}
                  </td>
                  <td className="px-3 py-2">
                    {STATUS_LABELS[p.status] ?? p.status}
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
