import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatla } from "@/lib/money";
import { cozumleBirimFiyat } from "@/lib/fiyat";
import { hesaplaStok } from "@/lib/stok";
import { requireStaff } from "@/lib/session";
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
  const session = await requireStaff();
  // OPERASYON ürünü görür, açmaz ve düzenlemez (D-2 17.10 eki); yetki action'dadır.
  const yonetici = session.user.role === "YONETICI";
  const { error } = await searchParams;
  const urunler = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { taxRate: { select: { rate: true } } },
  });
  // Liste fiyatı varsayılan listenin satırıdır (X-10 §(5)); stok hareketlerden türer (ADR-005).
  const products = await Promise.all(
    urunler.map(async (p) => {
      const fiyat = await cozumleBirimFiyat(p.id, null);
      return {
        ...p,
        listPrice: fiyat.durum === "TAMAM" ? fiyat.listeFiyat : null,
        stock: await hesaplaStok(p.id),
      };
    })
  );

  return (
    <div>
      <PageHeader
        title="Ürünler"
        description="Ürün kataloğu ve güncel stok durumu"
        action={yonetici && <LinkButton href="/products/new">Yeni Ürün</LinkButton>}
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
                <th className="px-4 py-2 text-right font-medium">KDV</th>
                <th className="px-4 py-2 text-right font-medium">Stok</th>
                <th className="px-4 py-2 font-medium">Durum</th>
                <th className="px-4 py-2 text-right font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 && (
                <EmptyRow colSpan={7} text="Henüz ürün eklenmemiş." />
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
                    {formatla(p.listPrice)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-500">
                    {formatla(p.taxRate.rate, "oran")}
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
                    {yonetici && (
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
                    )}
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
