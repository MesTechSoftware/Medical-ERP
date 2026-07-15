import { Card, StatusBadge } from "@/components/ui";
import { formatTRY } from "@/lib/money";
import { formatDate, formatDateTime } from "@/lib/format";

type OrderWithRelations = {
  id: string;
  doctorName: string;
  hospital: string | null;
  status: string;
  totalAmount: number;
  orderDate: Date;
  seller?: { name: string } | null;
  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    product: { name: string; code: string };
  }[];
  shipment?: {
    carrier: string | null;
    trackingNumber: string | null;
    shippedAt: Date | null;
  } | null;
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}

export default function OrderDetail({
  order,
  showSeller,
}: {
  order: OrderWithRelations;
  showSeller?: boolean;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <InfoRow label="Doktor" value={order.doctorName} />
          <InfoRow label="Hastane / Klinik" value={order.hospital ?? "—"} />
          {showSeller && (
            <InfoRow label="Satıcı" value={order.seller?.name ?? "—"} />
          )}
          <InfoRow label="Tarih" value={formatDate(order.orderDate)} />
          <InfoRow
            label="Durum"
            value={<StatusBadge status={order.status} />}
          />
        </dl>
      </Card>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-slate-900">
          Sipariş Kalemleri
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                <th className="px-3 py-2 font-medium">Ürün</th>
                <th className="px-3 py-2 text-right font-medium">Miktar</th>
                <th className="px-3 py-2 text-right font-medium">Birim Fiyat</th>
                <th className="px-3 py-2 text-right font-medium">Tutar</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((it) => (
                <tr
                  key={it.id}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="px-3 py-2 text-slate-900">
                    {it.product.name}
                    <span className="ml-1 text-xs text-slate-400">
                      {it.product.code}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {it.quantity}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatTRY(it.unitPrice)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatTRY(it.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="px-3 py-3 text-right font-medium">
                  Toplam
                </td>
                <td className="px-3 py-3 text-right text-base font-semibold tabular-nums">
                  {formatTRY(order.totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {order.shipment && (
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Kargo Bilgisi
          </h2>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <InfoRow label="Kargo Firması" value={order.shipment.carrier ?? "—"} />
            <InfoRow
              label="Takip No"
              value={order.shipment.trackingNumber ?? "—"}
            />
            <InfoRow
              label="Kargo Tarihi"
              value={
                order.shipment.shippedAt
                  ? formatDateTime(order.shipment.shippedAt)
                  : "—"
              }
            />
          </dl>
        </Card>
      )}
    </div>
  );
}
