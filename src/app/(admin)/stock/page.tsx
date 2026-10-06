import { prisma } from "@/lib/db";
import { PageHeader, Card, EmptyRow } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import StockEntryForm from "./StockEntryForm";

export default async function StockPage() {
  const [products, movements] = await Promise.all([
    prisma.product.findMany({
      where: { status: "AKTIF" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    }),
    prisma.stockMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { product: { select: { name: true, code: true } } },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Stok"
        description="Stok girişleri ve hareket geçmişi"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <h2 className="mb-4 text-sm font-semibold text-slate-900">
              Stok Girişi
            </h2>
            <StockEntryForm products={products} />
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <h2 className="mb-4 text-sm font-semibold text-slate-900">
              Hareket Geçmişi
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                    <th className="px-4 py-2 font-medium">Tarih</th>
                    <th className="px-4 py-2 font-medium">Ürün</th>
                    <th className="px-4 py-2 font-medium">Tip</th>
                    <th className="px-4 py-2 text-right font-medium">Miktar</th>
                    <th className="px-4 py-2 font-medium">Açıklama</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.length === 0 && (
                    <EmptyRow colSpan={5} text="Henüz hareket yok." />
                  )}
                  {movements.map((m) => (
                    <tr
                      key={m.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                        {formatDateTime(m.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-slate-900">
                        {m.product.name}
                        <span className="ml-1 text-xs text-slate-400">
                          {m.product.code}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {m.type === "GIRIS" ? (
                          <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            Giriş
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                            Çıkış
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {m.type === "GIRIS" ? "+" : "−"}
                        {m.quantity}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{m.note}</td>
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
