import { prisma } from "@/lib/db";
import { PageHeader, Card } from "@/components/ui";
import OrderForm from "../OrderForm";

export default async function NewOrderPage() {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, code: true, salePrice: true, stock: true },
  });

  return (
    <div>
      <PageHeader
        title="Yeni Sipariş"
        description="Ürünleri seçip sipariş oluşturun"
      />
      <Card>
        <OrderForm products={products} />
      </Card>
    </div>
  );
}
