import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatla } from "@/lib/money";
import { cozumleBirimFiyat } from "@/lib/fiyat";
import { PageHeader, Card } from "@/components/ui";
import ProductForm from "../../ProductForm";
import { updateProduct } from "../../actions";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) notFound();

  const [fiyat, taxRates] = await Promise.all([
    cozumleBirimFiyat(id, null),
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
    </div>
  );
}
