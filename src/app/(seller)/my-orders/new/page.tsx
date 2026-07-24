import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { requireSeller } from "@/lib/session";
import { PageHeader, Card } from "@/components/ui";
import { VAT_MODE_COOKIE, parseVatMode } from "@/lib/vat-mode";
import OrderForm from "../OrderForm";

export default async function NewOrderPage() {
  const session = await requireSeller();

  // FR-18: kullanıcının KDV görünüm tercihi sunucuda okunur ki ilk render doğru olsun.
  const initialVatMode = parseVatMode(
    (await cookies()).get(VAT_MODE_COOKIE)?.value
  );

  // FR-05: yalnızca satıcının KENDİ aktif doktorları seçilebilir.
  const doctors = await prisma.doctor.findMany({
    where: { ownerSellerId: session.user.id, status: "ACTIVE" },
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true, clinic: true, title: true },
  });

  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      code: true,
      netListPrice: true,
      netMinPrice: true,
      vatRate: true,
      stock: true,
    },
  });

  return (
    <div>
      <PageHeader
        title="Yeni Sipariş"
        description="Ürünleri seçip sipariş oluşturun"
      />
      <Card>
        <OrderForm
          products={products}
          doctors={doctors}
          initialVatMode={initialVatMode}
        />
      </Card>
    </div>
  );
}
