import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { formatTRY } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { getDealerCari } from "@/lib/dealer-cari";
import {
  PageHeader,
  Card,
  StatCard,
  StatusBadge,
  EmptyRow,
  PAYMENT_METHOD_LABELS,
} from "@/components/ui";
import { PriceForm, DealerPaymentForm } from "../DealerForms";
import StatusToggle from "./StatusToggle";

const SHIP_STATUS: Record<string, string> = {
  TALEP: "Onay bekliyor",
  ONAYLANDI: "Onaylandı",
  IPTAL: "İptal",
  REDDEDILDI: "Reddedildi",
};

export default async function DealerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const dealer = await prisma.dealer.findUnique({
    where: { id },
    include: { user: { select: { email: true } } },
  });
  if (!dealer) notFound();

  const [cari, prices, products, shipments, payments] = await Promise.all([
    getDealerCari(id),
    prisma.dealerPrice.findMany({
      where: { dealerId: id },
      orderBy: { product: { name: "asc" } },
      include: { product: { select: { name: true, code: true } } },
    }),
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    }),
    prisma.dealerShipment.findMany({
      where: { dealerId: id },
      orderBy: { requestedAt: "desc" },
      take: 20,
    }),
    prisma.dealerPayment.findMany({
      where: { dealerId: id },
      orderBy: { paidAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div>
      <PageHeader
        title={dealer.title}
        description={`Kod: ${dealer.code}${
          dealer.user ? ` · Panel: ${dealer.user.email}` : " · Panel yok"
        }`}
        action={
          <StatusToggle dealerId={id} active={dealer.status === "ACTIVE"} />
        }
      />

      <div className="mb-6 flex items-center gap-2">
        <StatusBadge status={dealer.status} />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Toplam Sevkiyat" value={formatTRY(cari.toplamSevkiyat)} />
        <StatCard label="Toplam Ödeme" value={formatTRY(cari.toplamOdeme)} />
        <StatCard
          label="Borç"
          value={formatTRY(cari.bakiye)}
          tone={cari.bakiye > 0n ? "danger" : "success"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Fiyat Listesi
          </h2>
          <div className="mb-4">
            <PriceForm
              dealerId={id}
              products={products.map((p) => ({
                id: p.id,
                label: `${p.name} (${p.code})`,
              }))}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="px-3 py-2 font-medium">Ürün</th>
                  <th className="px-3 py-2 text-right font-medium">Net Fiyat</th>
                  <th className="px-3 py-2 text-right font-medium">KDV</th>
                </tr>
              </thead>
              <tbody>
                {prices.length === 0 && (
                  <EmptyRow colSpan={3} text="Fiyat tanımlanmamış." />
                )}
                {prices.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-2 text-slate-900">
                      {p.product.name}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatTRY(p.netPrice)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                      %{p.vatRate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Ödeme Kaydet
          </h2>
          <div className="mb-4">
            <DealerPaymentForm dealerId={id} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="px-3 py-2 font-medium">Tarih</th>
                  <th className="px-3 py-2 font-medium">Yöntem</th>
                  <th className="px-3 py-2 text-right font-medium">Tutar</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 && (
                  <EmptyRow colSpan={3} text="Ödeme yok." />
                )}
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-2 whitespace-nowrap">
                      {formatDate(p.paidAt)}
                    </td>
                    <td className="px-3 py-2 text-slate-500">
                      {PAYMENT_METHOD_LABELS[p.method] ?? p.method}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatTRY(p.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Sevkiyatlar
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="px-3 py-2 font-medium">Tarih</th>
                  <th className="px-3 py-2 text-right font-medium">Tutar</th>
                  <th className="px-3 py-2 font-medium">Vade</th>
                  <th className="px-3 py-2 font-medium">Durum</th>
                </tr>
              </thead>
              <tbody>
                {shipments.length === 0 && (
                  <EmptyRow colSpan={4} text="Sevkiyat yok." />
                )}
                {shipments.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-2 whitespace-nowrap text-slate-500">
                      {formatDate(s.requestedAt)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatTRY(s.grossTotal)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-500">
                      {s.dueDate ? formatDate(s.dueDate) : "—"}
                    </td>
                    <td className="px-3 py-2">
                      {SHIP_STATUS[s.status] ?? s.status}
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
