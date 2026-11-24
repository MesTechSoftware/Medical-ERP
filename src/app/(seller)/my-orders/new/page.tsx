import { prisma } from "@/lib/db";
import { requireSeller } from "@/lib/session";
import { kapsamliDoktorlariGetir } from "@/lib/doctor";
import { PageHeader, Card } from "@/components/ui";
import OrderForm from "../OrderForm";
import { siparisFormuUrunleri } from "@/lib/siparis-giris";
import { cariRiskiOnizle, createOrder, fiyatOnizle } from "../actions";

export default async function NewOrderPage() {
  const session = await requireSeller();

  // FR-05: yalnızca satıcının KENDİ aktif doktorları seçilebilir.
  const doctors = await prisma.doctor.findMany({
    where: { AND: [kapsamliDoktorlariGetir(session.user), { status: "AKTIF" }] },
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true, clinic: true, title: true },
  });

  const products = await siparisFormuUrunleri();

  return (
    <div>
      <PageHeader
        title="Yeni Sipariş"
        description="Ürünleri seçip sipariş oluşturun"
      />
      <Card>
        <OrderForm products={products} doctors={doctors} action={createOrder} fiyatOnizle={fiyatOnizle} riskOnizle={cariRiskiOnizle} />
      </Card>
    </div>
  );
}
