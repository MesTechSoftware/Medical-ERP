import { prisma } from "@/lib/db";
import { requireDealerAccount } from "@/lib/dealer-session";
import { formatTRY } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { PageHeader, Card, EmptyRow } from "@/components/ui";
import Pagination from "@/components/Pagination";
import { getPagination, pageCount } from "@/lib/pagination";
import WithdrawButton from "./WithdrawButton";

const STATUS_LABELS: Record<string, string> = {
  TALEP: "Onay bekliyor",
  ONAYLANDI: "Onaylandı",
  IPTAL: "İptal",
  REDDEDILDI: "Reddedildi / Geri çekildi",
};

/** FR-46b: Bayi kendi sevkiyat/talep geçmişini görür; talebi geri çekebilir. */
export default async function DealerShipmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; per?: string }>;
}) {
  const { dealer } = await requireDealerAccount();
  const { page, perPage, skip, take } = getPagination(await searchParams);

  const where = { dealerId: dealer.id };
  const [shipments, total] = await Promise.all([
    prisma.dealerShipment.findMany({
      where,
      orderBy: { requestedAt: "desc" },
      skip,
      take,
      include: {
        items: {
          include: { product: { select: { name: true } } },
        },
      },
    }),
    prisma.dealerShipment.count({ where }),
  ]);

  return (
    <div>
      <PageHeader
        title="Sevkiyatlarım"
        description="Talepleriniz ve onaylanan sevkiyatlar"
      />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                <th className="px-3 py-2 font-medium">Tarih</th>
                <th className="px-3 py-2 font-medium">Ürünler</th>
                <th className="px-3 py-2 text-right font-medium">Tutar</th>
                <th className="px-3 py-2 font-medium">Vade</th>
                <th className="px-3 py-2 font-medium">Durum</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {shipments.length === 0 && (
                <EmptyRow colSpan={6} text="Henüz sevkiyat/talep yok." />
              )}
              {shipments.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2 whitespace-nowrap text-slate-500">
                    {formatDate(s.requestedAt)}
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {s.items
                      .map((i) => `${i.product.name} ×${i.quantity}`)
                      .join(", ")}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatTRY(s.grossTotal)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-slate-500">
                    {s.dueDate ? formatDate(s.dueDate) : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {STATUS_LABELS[s.status] ?? s.status}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {s.status === "TALEP" && (
                      <WithdrawButton shipmentId={s.id} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Pagination
        page={page}
        totalPages={pageCount(total, perPage)}
        total={total}
        basePath="/bayi/sevkiyatlar"
      />
    </div>
  );
}
