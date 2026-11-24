import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { formatla } from "@/lib/money";
import { cozumleBirimFiyat } from "@/lib/fiyat";
import { PageHeader, Card } from "@/components/ui";
import ProductForm from "../../ProductForm";
import { deleteProduct, updateProduct } from "../../actions";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import { IslemFormu } from "@/components/Sonuc";
import { bugun } from "@/lib/zaman";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin(); // ürün tanımı yalnız YONETICI (D-2 17.10 eki)
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) notFound();

  const [fiyat, taxRates] = await Promise.all([
    cozumleBirimFiyat(id, null, { miktar: 1, gun: bugun() }),
    prisma.taxRate.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const action = updateProduct.bind(null, id);

  return (
    <div>
      <PageHeader
        title="Ürünü Düzenle"
        description={`${product.name} (${product.code})`}
      />
      <Card>
        <ProductForm
          action={action}
          taxRates={taxRates}
          submitLabel="Kaydet"
          defaults={{
            name: product.name,
            code: product.code,
            listPrice: fiyat.durum === "TAMAM" ? formatla(fiyat.listeFiyat, "ham") : undefined,
            taxRateId: product.taxRateId,
            status: product.status,
          }}
        />
      </Card>
      <div className="mt-4">
      <Card>
        <h2 className="mb-1 text-sm font-semibold text-slate-900">Ürünü sil</h2>
        <p className="mb-3 text-sm text-slate-600">
          Yalnız stok hareketi ve siparişi olmayan ürün silinir; aksi hâlde durumunu Pasif yapın.
        </p>
        <IslemFormu action={deleteProduct.bind(null, id)}>
          <ConfirmSubmit confirmText={`"${product.name}" silinsin mi?`} ikon="sil">
            Sil
          </ConfirmSubmit>
        </IslemFormu>
      </Card>
      </div>
    </div>
  );
}
