import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { formatTRY } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { PageHeader, Card, EmptyRow } from "@/components/ui";
import ShipmentActions from "./ShipmentActions";

const STATUS_LABELS: Record<string, string> = {
  TALEP: "Onay bekliyor",
  ONAYLANDI: "Onaylandı",
  IPTAL: "İptal",
  REDDEDILDI: "Reddedildi",
};

/** Admin: bayi sevkiyat talepleri onay/ret + onaylı sevkiyat iptali. */
export default async function DealerShipmentsAdminPage() {
  await requireAdmin();

  const shipments = await prisma.dealerShipment.findMany({
    orderBy: [{ status: "asc" }, { requestedAt: "desc" }],
    take: 200,
    include: {
      dealer: { select: { title: true, code: true } },
      items: { include: { product: { select: { name: true } } } },
    },
  });

  const pending = shipments.filter((s) => s.status === "TALEP");
  const others = shipments.filter((s) => s.status !== "TALEP");

  const renderRows = (list: typeof shipments) =>
    list.map((s) => (
      <tr key={s.id} className="border-b border-slate-100 last:border-0">
        <td className="px-3 py-2 whitespace-nowrap text-slate-500">
          {formatDate(s.requestedAt)}
        </td>
        <td className="px-3 py-2 text-slate-900">
          {s.dealer.title}
          <span className="ml-1 text-xs text-slate-400">{s.dealer.code}</span>
        </td>
        <td className="px-3 py-2 text-slate-600">
          {s.items.map((i) => `${i.product.name} ×${i.quantity}`).join(", ")}
        </td>
        <td className="px-3 py-2 text-right tabular-nums">
          {formatTRY(s.grossTotal)}
        </td>
        <td className="px-3 py-2">
          {s.requestedByUserId ? "Bayi talebi" : "Admin"}
        </td>
        <td className="px-3 py-2">{STATUS_LABELS[s.status] ?? s.status}</td>
        <td className="px-3 py-2 text-right">
          <ShipmentActions shipmentId={s.id} status={s.status} />
        </td>
      </tr>
    ));

  return (
    <div>
      <PageHeader
        title="Bayi Sevkiyatları"
        description="Talep onayları ve sevkiyat yönetimi"
      />

      {pending.length > 0 && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>{pending.length}</strong> sevkiyat talebi onay bekliyor. Onay
          anında stok düşer ve bayi cariye borç yazılır.
        </div>
      )}

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-slate-900">
          Bekleyen Talepler
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                <th className="px-3 py-2 font-medium">Tarih</th>
                <th className="px-3 py-2 font-medium">Bayi</th>
                <th className="px-3 py-2 font-medium">Ürünler</th>
                <th className="px-3 py-2 text-right font-medium">Tutar</th>
                <th className="px-3 py-2 font-medium">Kaynak</th>
                <th className="px-3 py-2 font-medium">Durum</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {pending.length === 0 && (
                <EmptyRow colSpan={7} text="Bekleyen talep yok." />
              )}
              {renderRows(pending)}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-6">
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Sevkiyat Geçmişi
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="px-3 py-2 font-medium">Tarih</th>
                  <th className="px-3 py-2 font-medium">Bayi</th>
                  <th className="px-3 py-2 font-medium">Ürünler</th>
                  <th className="px-3 py-2 text-right font-medium">Tutar</th>
                  <th className="px-3 py-2 font-medium">Kaynak</th>
                  <th className="px-3 py-2 font-medium">Durum</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {others.length === 0 && (
                  <EmptyRow colSpan={7} text="Sevkiyat geçmişi yok." />
                )}
                {renderRows(others)}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
