import { prisma } from "@/lib/db";
import { PageHeader, Card } from "@/components/ui";
import ProductForm from "../ProductForm";
import { createProduct } from "../actions";

export default async function NewProductPage() {
  const taxRates = await prisma.taxRate.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });
  return (
    <div>
      <PageHeader title="Yeni Ürün" description="Kataloğa yeni ürün ekleyin" />
      <Card>
        <ProductForm
          action={createProduct}
          taxRates={taxRates}
          submitLabel="Ürün Ekle"
          showInitialStock
        />
      </Card>
    </div>
  );
}
