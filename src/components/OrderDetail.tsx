import { Card, StatusBadge } from "@/components/ui";
import { formatTRY } from "@/lib/money";
import { formatDate, formatDateTime } from "@/lib/format";

type OrderWithRelations = {
  id: string;
  doctor: {
    fullName: string;
    title: string | null;
    clinic: string;
    region: string;
  };
  status: string;
  netTotal: bigint;
  vatTotal: bigint;
  grossTotal: bigint;
  orderDate: Date;
  seller?: { name: string } | null;
  items: {
    id: string;
    quantity: number;
    netUnitPrice: bigint;
    vatRate: number;
    vatAmount: bigint;
    lineNetTotal: bigint;
    lineGrossTotal: bigint;
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
          <InfoRow
            label="Doktor"
            value={`${order.doctor.title ? `${order.doctor.title} ` : ""}${order.doctor.fullName}`}
          />
          <InfoRow
            label="Klinik / Bölge"
            value={`${order.doctor.clinic} · ${order.doctor.region}`}
          />
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
                <th className="px-3 py-2 text-right font-medium">
                  Birim Fiyat (net)
                </th>
                <th className="px-3 py-2 text-right font-medium">Net Tutar</th>
                <th className="px-3 py-2 text-right font-medium">KDV</th>
                <th className="px-3 py-2 text-right font-medium">
                  Tutar (KDV dahil)
                </th>
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
                    {formatTRY(it.netUnitPrice)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatTRY(it.lineNetTotal)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                    {formatTRY(it.vatAmount)}
                    <span className="ml-1 text-xs text-slate-400">
                      %{it.vatRate}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatTRY(it.lineGrossTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Toplamlar kalemlerin TOPLAMIDIR; yeniden hesaplanmaz (vat.ts). */}
            <tfoot className="border-t border-slate-200">
              <tr>
                <td colSpan={4} className="px-3 py-1.5 text-right text-slate-600">
                  Ara Toplam (KDV hariç)
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums text-slate-600">
                  {formatTRY(order.netTotal)}
                </td>
              </tr>
              <tr>
                <td colSpan={4} className="px-3 py-1.5 text-right text-slate-600">
                  KDV
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums text-slate-600">
                  {formatTRY(order.vatTotal)}
                </td>
              </tr>
              <tr>
                <td colSpan={4} className="px-3 py-3 text-right font-medium">
                  Genel Toplam
                </td>
                <td className="px-3 py-3 text-right text-base font-semibold tabular-nums">
                  {formatTRY(order.grossTotal)}
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
