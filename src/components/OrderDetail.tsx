import { Card, StatusBadge } from "@/components/ui";
import type Decimal from "decimal.js";
import { formatla } from "@/lib/money";
import { Tutar } from "@/components/Tutar";
import { MATRAH, SATIR_TABANI, tabanli } from "@/lib/taban";
import { formatDate, formatDateTime } from "@/lib/format";
import { hesaplaSatirTutarlari } from "@/lib/satir-tutarlari";
import type { FreeReason } from "@/generated/prisma/enums";
import { BEDELSIZ_SEBEP_ADI } from "@/lib/sozluk";

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
    freeReason: FreeReason | null;
    freeNote: string | null;
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
        <div className="tablo-kutusu">
          <table className="veri-tablosu">
            <thead>
              <tr>
                <th>Ürün</th>
                <th className="sayi">Miktar</th>
                <th className="sayi">
                  {tabanli("Birim Fiyat", MATRAH)}
                </th>
                <th className="sayi">{tabanli("Tutar", SATIR_TABANI.matrah)}</th>
                <th className="sayi">KDV</th>
                <th className="sayi">
                  {tabanli("Tutar", SATIR_TABANI.toplam)}
                </th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((it, i) => (
                <tr key={it.id}>
                  <td className="text-slate-900">
                    {it.product.name}
                    <span className="ml-1 text-xs text-slate-400">
                      {it.product.code}
                    </span>
                    {it.freeReason && (
                      <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                        Bedelsiz · {BEDELSIZ_SEBEP_ADI[it.freeReason]}
                        {it.freeNote ? ` — ${it.freeNote}` : ""}
                      </span>
                    )}
                  </td>
                  <td className="sayi">
                    {it.quantity}
                  </td>
                  <td className="sayi">
                    <Tutar deger={it.unitPrice} taban={MATRAH} baslikta />
                  </td>
                  <td className="sayi">
                    <Tutar deger={hesap.satirlar[i].matrah} taban={SATIR_TABANI.matrah} baslikta />
                  </td>
                  <td className="sayi text-slate-500">
                    <Tutar deger={hesap.satirlar[i].kdvTutar} taban={SATIR_TABANI.kdvTutar} baslikta />
                    <span className="ml-1 text-xs text-slate-400">
                      {formatla(it.vatRate, "oran")}
                    </span>
                  </td>
                  <td className="sayi">
                    <Tutar deger={hesap.satirlar[i].toplam} taban={SATIR_TABANI.toplam} baslikta />
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Toplamlar kalemlerin TOPLAMIDIR; yeniden yuvarlanmaz (C-6 §(5)). */}
            <tfoot className="border-t border-slate-200">
              <tr>
                <td colSpan={4} className="text-right text-slate-600">
                  {tabanli("Ara Toplam", SATIR_TABANI.matrah)}
                </td>
                <td className="sayi text-slate-600">
                  <Tutar deger={hesap.toplam.matrah} taban={SATIR_TABANI.matrah} baslikta />
                </td>
              </tr>
              <tr>
                <td colSpan={4} className="text-right text-slate-600">
                  KDV
                </td>
                <td className="sayi text-slate-600">
                  <Tutar deger={hesap.toplam.kdvTutar} taban={SATIR_TABANI.kdvTutar} baslikta />
                </td>
              </tr>
              <tr>
                <td colSpan={4} className="text-right font-medium">
                  {tabanli("Genel Toplam", SATIR_TABANI.toplam)}
                </td>
                <td className="sayi text-base font-semibold">
                  <Tutar deger={hesap.toplam.toplam} taban={SATIR_TABANI.toplam} baslikta />
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
