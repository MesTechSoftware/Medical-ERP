import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { kurusToTl } from "@/lib/money";
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
          submitLabel="Kaydet"
          defaults={{
            name: product.name,
            code: product.code,
            netListPriceTL: kurusToTl(product.netListPrice),
            netMinPriceTL: kurusToTl(product.netMinPrice),
            vatRate: product.vatRate,
            status: product.status,
          }}
        />
      </Card>
    </div>
  );
}
