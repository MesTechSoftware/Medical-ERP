import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatTRY } from "@/lib/money";
import {
  PageHeader,
  LinkButton,
  Card,
  StatusBadge,
  EmptyRow,
} from "@/components/ui";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import { deleteProduct } from "./actions";

const CRITICAL_STOCK = 10;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Ürünler"
        description="Ürün kataloğu ve güncel stok durumu"
        action={<LinkButton href="/products/new">Yeni Ürün</LinkButton>}
      />

      {error === "used" && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Bu ürün siparişlerde kullanıldığı için silinemez. Bunun yerine
          &quot;Pasif&quot; yapabilirsiniz.
        </div>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                <th className="px-4 py-2 font-medium">Ürün</th>
                <th className="px-4 py-2 font-medium">Kod</th>
                <th className="px-4 py-2 text-right font-medium">
                  Liste (net)
                </th>
                <th className="px-4 py-2 text-right font-medium">
                  Taban (net)
                </th>
                <th className="px-4 py-2 text-right font-medium">KDV</th>
                <th className="px-4 py-2 text-right font-medium">Stok</th>
                <th className="px-4 py-2 font-medium">Durum</th>
                <th className="px-4 py-2 text-right font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 && (
                <EmptyRow colSpan={8} text="Henüz ürün eklenmemiş." />
              )}
              {products.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {p.name}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{p.code}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatTRY(p.netListPrice)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-500">
                    {formatTRY(p.netMinPrice)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-500">
                    %{p.vatRate}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <span
                      className={
                        p.stock <= CRITICAL_STOCK
                          ? "font-semibold text-red-600"
                          : "text-slate-900"
                      }
                    >
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/products/${p.id}/edit`}
                        className="text-sm font-medium text-slate-600 hover:text-slate-900"
                      >
                        Düzenle
                      </Link>
                      <form action={deleteProduct.bind(null, p.id)}>
                        <ConfirmSubmit confirmText={`"${p.name}" silinsin mi?`}>
                          Sil
                        </ConfirmSubmit>
                      </form>
                    </div>
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
