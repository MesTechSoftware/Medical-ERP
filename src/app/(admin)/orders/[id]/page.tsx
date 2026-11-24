import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader, Card } from "@/components/ui";
import OrderDetail from "@/components/OrderDetail";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import { IslemFormu } from "@/components/Sonuc";
import { prepareOrder, markDelivered, cancelOrder, createReturn, closeRemainder } from "../actions";
import IadeFormu from "./IadeFormu";
import KalaniKapatFormu from "./KalaniKapatFormu";
import { kalanMiktar } from "@/lib/siparis";
import { formatDateTime } from "@/lib/format";
import { buton } from "@/components/stil";
import { Ikon } from "@/components/Ikon";
import { BilgiSeridi } from "@/components/BilgiSeridi";
import FaturaHazirlikKarti from "@/components/siparis/FaturaHazirlikKarti";
import { faturaKartiVerisi } from "@/lib/disa-aktarim";

export const metadata: Metadata = { title: "Sipariş Detayı" };

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ bilgi?: string | string[] }>;
}) {
  const { id } = await params;
  const { bilgi } = await searchParams;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      seller: { select: { name: true } },
      doctor: true,
      items: {
        include: {
          product: { select: { name: true, code: true } },
          shipmentItems: { select: { quantity: true } },
          returnItems: { select: { quantity: true } },
        },
      },
      shipments: {
        orderBy: { createdAt: "asc" },
        include: { carrier: { select: { name: true, trackingUrlTemplate: true } } },
      },
    },
  });
  if (!order) notFound();

  // A-1: iade edilebilir = sevk edilen − önceki iadeler.
  const iadeKalemleri = order.items
    .map((i) => ({
      id: i.id,
      urun: i.product.name,
      kod: i.product.code,
      iadeEdilebilir:
        i.shipmentItems.reduce((t, s) => t + s.quantity, 0) - i.returnItems.reduce((t, r) => t + r.quantity, 0),
    }))
    .filter((k) => k.iadeEdilebilir > 0);
  const iadeler = await prisma.returnNote.findMany({
    where: { items: { some: { orderItem: { orderId: id } } } },
    orderBy: { createdAt: "asc" },
    include: { items: { include: { orderItem: { select: { product: { select: { name: true } } } } } } },
  });

  // A-3-1: sevkiyatı olan sipariş iptal edilemez (iade sürecidir); kargolanmış siparişte buton yoktur.
  // Stok sevkiyatta düşer; sevksiz siparişin iptali stoğa dokunmaz.
  const canCancel = (order.status === "BEKLIYOR" || order.status === "HAZIRLANIYOR") && order.shipments.length === 0;
  // A-3 eki: kalanı kapat yalnız en az bir sevkiyatı olan HAZIRLANIYOR siparişte.
  const kapatilabilirKalan =
    order.status === "HAZIRLANIYOR" && order.shipments.length > 0
      ? order.items.reduce((t, i) => t + kalanMiktar(i), 0)
      : 0;

  // K-4 §(6)-k: sevkiyat başına salt okunur Fatura Hazırlık Kartı; sayfa YONETICI + OPERASYON'a açıktır (layout).
  const faturaKartlari = await Promise.all(
    order.shipments.map(async (s) => ({ belgeNo: s.documentNo, karti: await faturaKartiVerisi(s.id) }))
  );

  return (
    <div>
      <PageHeader
        title="Sipariş Detayı"
        action={
          <Link
            href="/orders"
            className={buton("metin")}
          >
            <Ikon ad="geri" />
            Siparişler
          </Link>
        }
      />

      <BilgiSeridi ham={bilgi} />

      <OrderDetail order={order} showSeller />

      {faturaKartlari.length > 0 && (
        <div className="mt-6">
          <Card>
            <h2 className="text-sm font-semibold text-slate-900">Fatura Hazırlık</h2>
            {faturaKartlari.map((k) => (
              <FaturaHazirlikKarti key={k.belgeNo} belgeNo={k.belgeNo} karti={k.karti} />
            ))}
          </Card>
        </div>
      )}

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">İşlemler</h2>
        <div className="flex flex-wrap items-center gap-3">
          {order.status === "BEKLIYOR" && (
            <IslemFormu action={prepareOrder.bind(null, id)}>
              <button
                type="submit"
                className={buton("birincil")}
              >
                <Ikon ad="hazirla" />
                Hazırlığa Al
              </button>
            </IslemFormu>
          )}

          {order.status === "HAZIRLANIYOR" && (
            <Link
              href="/shipping"
              className={buton("birincil")}
            >
              <Ikon ad="kargola" />
              Kargo Bilgisi Gir
            </Link>
          )}

          {order.status === "KARGOLANDI" && (
            <IslemFormu action={markDelivered.bind(null, id)}>
              <button
                type="submit"
                className={buton("olumlu")}
              >
                <Ikon ad="teslim" />
                Teslim Edildi Olarak İşaretle
              </button>
            </IslemFormu>
          )}

          {canCancel && (
            <IslemFormu action={cancelOrder.bind(null, id)}>
              <ConfirmSubmit
                confirmText="Sipariş iptal edilecek. Onaylıyor musunuz?"
                className={buton("olumsuz-cerceve")}
                ikon="iptalEt"
              >
                Siparişi İptal Et
              </ConfirmSubmit>
            </IslemFormu>
          )}

          {(order.status === "TESLIM_EDILDI" || order.status === "IPTAL") && (
            <p className="text-sm text-slate-400">
              Bu sipariş için işlem bulunmuyor.
            </p>
          )}
        </div>
      </Card>

      {kapatilabilirKalan > 0 && (
        <div className="mt-6">
          <Card>
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Kalanı Kapat</h2>
            <p className="mb-3 text-sm text-slate-600">
              Kalan miktar sevk edilmeyecekse kapatılır; sipariş kargolandı sayılır. Bu işlem borç eşleştirmesi değildir.
            </p>
            <KalaniKapatFormu action={closeRemainder.bind(null, id)} kalan={kapatilabilirKalan} />
          </Card>
        </div>
      )}

      {(iadeKalemleri.length > 0 || iadeler.length > 0) && (
        <div className="mt-6">
          <Card>
            <h2 className="mb-3 text-sm font-semibold text-slate-900">İade</h2>
            {iadeler.length > 0 && (
              <ul className="mb-4 space-y-1 text-sm text-slate-700">
                {iadeler.map((r) => (
                  <li key={r.id}>
                    <span className="font-medium">{r.documentNo}</span>
                    <span className="ml-2 text-slate-500">{formatDateTime(r.createdAt)}</span>
                    {" · "}
                    {r.items.map((i) => `${i.orderItem.product.name} × ${i.quantity}`).join(", ")}
                    <span className="ml-2 text-slate-500">— {r.reason}</span>
                  </li>
                ))}
              </ul>
            )}
            {iadeKalemleri.length > 0 && <IadeFormu action={createReturn.bind(null, id)} kalemler={iadeKalemleri} />}
          </Card>
        </div>
      )}
    </div>
  );
}
