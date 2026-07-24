import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { formatTRY } from "@/lib/money";
import { formatPeriod, periodOf, type Period } from "@/lib/commission";
import { getPeriodPreview } from "@/lib/commission-service";
import { PageHeader, Card, EmptyRow } from "@/components/ui";
import { AdvanceStatusButton, ClosePeriodButton } from "./PeriodActions";

/** Bir önceki takvim ayı — kapatılabilir olan dönem (FR-34). */
function previousPeriod(p: Period): Period {
  return p.month === 1
    ? { year: p.year - 1, month: 12 }
    : { year: p.year, month: p.month - 1 };
}

const STATUS_LABELS: Record<string, string> = {
  HESAPLANDI: "Hesaplandı",
  ONAYLANDI: "Onaylandı",
  ODENDI: "Ödendi",
};

const NEXT_ACTION: Record<string, string | null> = {
  HESAPLANDI: "Onayla",
  ONAYLANDI: "Ödendi İşaretle",
  ODENDI: null,
};

export default async function CommissionsPage() {
  await requireAdmin();

  const current = periodOf(new Date());
  const prev = previousPeriod(current);

  const sellers = await prisma.user.findMany({
    where: { role: "SELLER" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, commissionRate: true },
  });

  const [currentPreviews, prevPreviews, closedPeriods] = await Promise.all([
    Promise.all(sellers.map((s) => getPeriodPreview(s.id, current))),
    Promise.all(sellers.map((s) => getPeriodPreview(s.id, prev))),
    prisma.commissionPeriod.findMany({
      orderBy: [{ year: "desc" }, { month: "desc" }],
      take: 50,
      include: { seller: { select: { name: true } } },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Primler"
        description="Satıcı prim dönemleri, kapanış ve ödeme takibi"
      />

      <div data-open-period>
      <Card>
        <h2 className="mb-1 text-sm font-semibold text-slate-900">
          Açık Dönem — {formatPeriod(current)}
        </h2>
        <p className="mb-4 text-xs text-slate-500">
          Matrah, dönem içinde <strong>tahsil edilen</strong> tutarın{" "}
          <strong>KDV hariç</strong> karşılığıdır (D-16, D-17). Tutarlar dönem
          kapanana kadar değişebilir.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                <th className="px-3 py-2 font-medium">Satıcı</th>
                <th className="px-3 py-2 text-right font-medium">Oran</th>
                <th className="px-3 py-2 text-right font-medium">
                  Matrah (net)
                </th>
                <th className="px-3 py-2 text-right font-medium">Düzeltme</th>
                <th className="px-3 py-2 text-right font-medium">
                  Tahmini Prim
                </th>
              </tr>
            </thead>
            <tbody>
              {sellers.map((s, i) => {
                const p = currentPreviews[i];
                return (
                  <tr
                    key={s.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-3 py-2 font-medium text-slate-900">
                      {s.name}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      %{p.ratePercent}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatTRY(p.baseAmount)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                      {p.adjustmentTotal === 0n
                        ? "—"
                        : formatTRY(p.adjustmentTotal)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums">
                      {formatTRY(p.commissionAmount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      </div>

      <div className="mt-6">
        <Card>
          <h2 className="mb-1 text-sm font-semibold text-slate-900">
            Kapatılabilir Dönem — {formatPeriod(prev)}
          </h2>
          <p className="mb-4 text-xs text-slate-500">
            Kapanınca matrah, oran ve prim <strong>dondurulur</strong>; sonraki
            iptaller bu dönemi değiştirmez, sonraki döneme negatif yansır (RULE-05).
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="px-3 py-2 font-medium">Satıcı</th>
                  <th className="px-3 py-2 text-right font-medium">
                    Matrah (net)
                  </th>
                  <th className="px-3 py-2 text-right font-medium">Prim</th>
                  <th className="px-3 py-2 font-medium">Durum</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {sellers.map((s, i) => {
                  const p = prevPreviews[i];
                  return (
                    <tr
                      key={s.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-3 py-2 font-medium text-slate-900">
                        {s.name}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatTRY(p.baseAmount)}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums">
                        {formatTRY(p.commissionAmount)}
                      </td>
                      <td className="px-3 py-2">
                        {p.closed ? "Kapandı" : "Açık"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {!p.closed && (
                          <ClosePeriodButton
                            sellerId={s.id}
                            year={prev.year}
                            month={prev.month}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Kapanmış Dönemler
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="px-3 py-2 font-medium">Dönem</th>
                  <th className="px-3 py-2 font-medium">Satıcı</th>
                  <th className="px-3 py-2 text-right font-medium">Matrah</th>
                  <th className="px-3 py-2 text-right font-medium">Oran</th>
                  <th className="px-3 py-2 text-right font-medium">Prim</th>
                  <th className="px-3 py-2 font-medium">Durum</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {closedPeriods.length === 0 && (
                  <EmptyRow colSpan={7} text="Henüz kapanmış dönem yok." />
                )}
                {closedPeriods.map((cp) => (
                  <tr
                    key={cp.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-3 py-2 tabular-nums">
                      {formatPeriod({ year: cp.year, month: cp.month })}
                    </td>
                    <td className="px-3 py-2 text-slate-900">
                      {cp.seller.name}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatTRY(cp.baseAmount)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      %{cp.ratePercent}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums">
                      {formatTRY(cp.commissionAmount)}
                    </td>
                    <td className="px-3 py-2">
                      {STATUS_LABELS[cp.status] ?? cp.status}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {NEXT_ACTION[cp.status] && (
                        <AdvanceStatusButton
                          periodId={cp.id}
                          label={NEXT_ACTION[cp.status]!}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
