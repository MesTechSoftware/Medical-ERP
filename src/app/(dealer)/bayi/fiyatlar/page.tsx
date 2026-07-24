import { prisma } from "@/lib/db";
import { requireDealerAccount } from "@/lib/dealer-session";
import { formatTRY } from "@/lib/money";
import { grossFromNet } from "@/lib/vat";
import { PageHeader, Card, EmptyRow } from "@/components/ui";

/** FR-46c: Bayi kendi fiyat listesini görür (READ-ONLY, sadece kendi verisi). */
export default async function DealerPricesPage() {
  const { dealer } = await requireDealerAccount();

  const prices = await prisma.dealerPrice.findMany({
    where: { dealerId: dealer.id, product: { status: "ACTIVE" } },
    orderBy: { product: { name: "asc" } },
    include: { product: { select: { name: true, code: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Fiyat Listem"
        description="Size tanımlı ürün fiyatları (KDV hariç net)"
      />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                <th className="px-3 py-2 font-medium">Ürün</th>
                <th className="px-3 py-2 font-medium">Kod</th>
                <th className="px-3 py-2 text-right font-medium">Net Fiyat</th>
                <th className="px-3 py-2 text-right font-medium">KDV</th>
                <th className="px-3 py-2 text-right font-medium">KDV Dahil</th>
              </tr>
            </thead>
            <tbody>
              {prices.length === 0 && (
                <EmptyRow
                  colSpan={5}
                  text="Henüz fiyat tanımlanmamış. Yöneticinize başvurun."
                />
              )}
              {prices.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2 text-slate-900">{p.product.name}</td>
                  <td className="px-3 py-2 text-slate-500">{p.product.code}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatTRY(p.netPrice)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                    %{p.vatRate}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatTRY(grossFromNet(p.netPrice, p.vatRate))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
