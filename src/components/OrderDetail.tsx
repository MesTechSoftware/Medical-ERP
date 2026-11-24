import { Card, StatusBadge } from "@/components/ui";
import type Decimal from "decimal.js";
import { formatla } from "@/lib/money";
import { Tutar } from "@/components/Tutar";
import { MATRAH, SATIR_TABANI, tabanli } from "@/lib/taban";
import { formatDate, formatDateTime } from "@/lib/format";
import { hesaplaSatirTutarlari } from "@/lib/satir-tutarlari";
import type { CloseReason, FreeReason } from "@/generated/prisma/enums";
import { BEDELSIZ_SEBEP_ADI, KAPATMA_GEREKCESI_ADI } from "@/lib/sozluk";
import { kalanMiktar, sevkMiktari } from "@/lib/siparis";
import { takipLinki } from "@/lib/kargo";
import { BAGLANTI } from "@/components/stil";

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
  /** A-3 eki: kalanı kapatma kaydı (kapatılmadıysa `null`). */
  closeReason?: CloseReason | null;
  closeNote?: string | null;
  items: {
    id: string;
    quantity: number;
    closedQuantity: number;
    shipmentItems: { quantity: number }[];
    listPrice: Decimal.Value;
    unitPrice: Decimal.Value;
    vatRate: Decimal.Value;
    isFree: boolean;
    freeReason: FreeReason | null;
    freeNote: string | null;
    product: { name: string; code: string };
  }[];
  /** Siparişin tüm sevkiyatları, eskiden yeniye (A-3-7). */
  shipments: {
    id: string;
    documentNo: string;
    carrier: { name: string; trackingUrlTemplate: string | null } | null;
    trackingNumber: string | null;
    shippedAt: Date | null;
  }[];
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
            value={
              <>
                <StatusBadge status={order.status} />
                {order.closeReason && (
                  <span data-kismi-kapatildi className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                    Kısmi kapatıldı · {KAPATMA_GEREKCESI_ADI[order.closeReason]}
                    {order.closeNote ? ` — ${order.closeNote}` : ""}
                  </span>
                )}
              </>
            }
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
                    {sevkMiktari(it) > 0 && (
                      <span className="block text-xs text-slate-500" data-kalem-miktari>
                        Sevk {sevkMiktari(it)} · Kalan {kalanMiktar(it)}
                        {it.closedQuantity > 0 ? ` · Kapatılan ${it.closedQuantity}` : ""}
                      </span>
                    )}
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
            {/* Toplamlar kalemlerin TOPLAMIDIR; yeniden yuvarlanmaz (C-6 §(5)). Her toplam kendi
                tabanının kolonunun altındadır — karma kolon yasağı (Ü-3 §(7)): Ara Toplam →
                "Tutar (KDV hariç)", KDV → "KDV", Genel Toplam → "Tutar (KDV dahil)". Bu tabloda
                .oncelik-dusuk yoktur; gizlenen kolon colSpan hesabını kaydırırdı. */}
            <tfoot className="border-t border-slate-200">
              <tr>
                <td colSpan={3} className="text-right text-slate-600">
                  {tabanli("Ara Toplam", SATIR_TABANI.matrah)}
                </td>
                <td className="sayi text-slate-600">
                  <Tutar deger={hesap.toplam.matrah} taban={SATIR_TABANI.matrah} baslikta />
                </td>
                <td colSpan={2} />
              </tr>
              <tr>
                <td colSpan={4} className="text-right text-slate-600">
                  KDV
                </td>
                <td className="sayi text-slate-600">
                  <Tutar deger={hesap.toplam.kdvTutar} taban={SATIR_TABANI.kdvTutar} baslikta />
                </td>
                <td />
              </tr>
              <tr>
                <td colSpan={5} className="text-right font-medium">
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

      {order.shipments.length > 0 && (
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Kargo Bilgisi
          </h2>
          <div className="space-y-4">
            {order.shipments.map((v) => {
              const link = takipLinki(v.carrier?.trackingUrlTemplate, v.trackingNumber);
              return (
                <dl key={v.id} data-sevkiyat className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <InfoRow label="Sevkiyat No" value={v.documentNo} />
                  <InfoRow label="Kargo Firması" value={v.carrier?.name ?? "—"} />
                  <InfoRow
                    label="Takip No"
                    value={
                      v.trackingNumber && link ? (
                        <a href={link} target="_blank" rel="noopener noreferrer" className={BAGLANTI}>
                          {v.trackingNumber}
                        </a>
                      ) : (
                        (v.trackingNumber ?? "—")
                      )
                    }
                  />
                  <InfoRow label="Kargo Tarihi" value={v.shippedAt ? formatDateTime(v.shippedAt) : "—"} />
                </dl>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
