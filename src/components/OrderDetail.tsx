import { Card, StatusBadge } from "@/components/ui";
import type Decimal from "decimal.js";
import { formatla } from "@/lib/money";
import { formatDate, formatDateTime } from "@/lib/format";
import { hesaplaSatirTutarlari } from "@/lib/satir-tutarlari";

type OrderWithRelations = {
  id: string;
  documentNo: string;
  doctor: {
    fullName: string;
    title: string | null;
    clinic: string | null;
    region: string | null;
  };
  status: string;
  orderDate: Date;
  seller?: { name: string } | null;
  items: {
    id: string;
    quantity: number;
    listPrice: Decimal.Value;
    unitPrice: Decimal.Value;
    vatRate: Decimal.Value;
    isFree: boolean;
    product: { name: string; code: string };
  }[];
  /** En son sevkiyat (A-3 kısmi sevkiyat ekranı 1B'dedir). */
  shipment?: {
    documentNo: string;
    carrier: { name: string } | null;
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
  // Tutarlar saklanmaz; donmuş satır değerlerinden türetilir (C-6 §(3), GÇ-18).
  const hesap = hesaplaSatirTutarlari(
    order.items.map((it) => ({
      birimFiyat: it.unitPrice,
      listeFiyat: it.listPrice,
      kdvOrani: it.vatRate,
      miktar: it.quantity,
      bedelsiz: it.isFree,
    }))
  );
  return (
    <div className="space-y-6">
      <Card>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <InfoRow label="Belge No" value={order.documentNo} />
          <InfoRow
            label="Doktor"
            value={`${order.doctor.title ? `${order.doctor.title} ` : ""}${order.doctor.fullName}`}
          />
          <InfoRow
            label="Klinik / Bölge"
            value={[order.doctor.clinic, order.doctor.region].filter(Boolean).join(" · ") || "—"}
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
              {order.items.map((it, i) => (
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
                    {formatla(it.unitPrice)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatla(hesap.satirlar[i].matrah)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                    {formatla(hesap.satirlar[i].kdvTutar)}
                    <span className="ml-1 text-xs text-slate-400">
                      {formatla(it.vatRate, "oran")}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatla(hesap.satirlar[i].toplam)}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Toplamlar kalemlerin TOPLAMIDIR; yeniden yuvarlanmaz (C-6 §(5)). */}
            <tfoot className="border-t border-slate-200">
              <tr>
                <td colSpan={4} className="px-3 py-1.5 text-right text-slate-600">
                  Ara Toplam (KDV hariç)
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums text-slate-600">
                  {formatla(hesap.toplam.matrah)}
                </td>
              </tr>
              <tr>
                <td colSpan={4} className="px-3 py-1.5 text-right text-slate-600">
                  KDV
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums text-slate-600">
                  {formatla(hesap.toplam.kdvTutar)}
                </td>
              </tr>
              <tr>
                <td colSpan={4} className="px-3 py-3 text-right font-medium">
                  Genel Toplam
                </td>
                <td className="px-3 py-3 text-right text-base font-semibold tabular-nums">
                  {formatla(hesap.toplam.toplam)}
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
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <InfoRow label="Sevkiyat No" value={order.shipment.documentNo} />
            <InfoRow label="Kargo Firması" value={order.shipment.carrier?.name ?? "—"} />
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
