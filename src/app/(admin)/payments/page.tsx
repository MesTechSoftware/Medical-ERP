import { prisma } from "@/lib/db";
import { formatTRY } from "@/lib/money";
import { formatDate } from "@/lib/format";
import {
  PageHeader,
  Card,
  EmptyRow,
  PAYMENT_METHOD_LABELS,
} from "@/components/ui";
import PaymentForm from "./PaymentForm";

export default async function PaymentsPage() {
  const [sellers, payments] = await Promise.all([
    prisma.user.findMany({
      where: { role: "SELLER", status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.payment.findMany({
      orderBy: { date: "desc" },
      take: 100,
      include: { seller: { select: { name: true } } },
    }),
  ]);

  const total = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <PageHeader
        title="Ödemeler"
        description="Satıcılardan gelen ödeme kayıtları"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <h2 className="mb-4 text-sm font-semibold text-slate-900">
              Yeni Ödeme
            </h2>
            <PaymentForm sellers={sellers} />
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Ödeme Geçmişi
              </h2>
              <span className="text-sm text-slate-500">
                Toplam:{" "}
                <span className="font-semibold tabular-nums text-slate-900">
                  {formatTRY(total)}
                </span>
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                    <th className="px-4 py-2 font-medium">Tarih</th>
                    <th className="px-4 py-2 font-medium">Satıcı</th>
                    <th className="px-4 py-2 font-medium">Yöntem</th>
                    <th className="px-4 py-2 text-right font-medium">Tutar</th>
                    <th className="px-4 py-2 font-medium">Açıklama</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 && (
                    <EmptyRow colSpan={5} text="Henüz ödeme kaydı yok." />
                  )}
                  {payments.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                        {formatDate(p.date)}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {p.seller.name}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {PAYMENT_METHOD_LABELS[p.method] ?? p.method}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatTRY(p.amount)}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{p.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
