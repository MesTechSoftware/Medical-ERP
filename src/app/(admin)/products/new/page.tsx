import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { PageHeader, Card } from "@/components/ui";
import ProductForm from "../ProductForm";
import { createProduct } from "../actions";

export const metadata: Metadata = { title: "Yeni Ürün" };

export default async function NewProductPage() {
  await requireAdmin(); // ürün tanımı yalnız YONETICI (D-2 17.10 eki)
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
