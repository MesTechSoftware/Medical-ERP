import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/session";
import { siparisFormuUrunleri } from "@/lib/siparis-giris";
import { PageHeader, Card } from "@/components/ui";
import OrderForm from "../../../(seller)/my-orders/OrderForm";
import { cariRiskiOnizle, createStaffOrder, fiyatOnizle } from "../actions";

/**
 * Personel sipariş girişi (D-2 §(1): OPERASYON sipariş girer; X-8 §(4): bayi siparişi SIP). Her aktif cari
 * seçilebilir; doktorun siparişi sahibine yazılır, sahipsiz doktora sipariş girilmez; bayide satıcı yoktur.
 */
export const metadata: Metadata = { title: "Yeni Sipariş" };

export default async function StaffNewOrderPage() {
  await requireStaff();
  const [cariler, products] = await Promise.all([
    prisma.doctor.findMany({
      where: { status: "AKTIF" },
      orderBy: [{ accountClass: "asc" }, { fullName: "asc" }],
      select: { id: true, fullName: true, clinic: true, title: true, accountClass: true },
    }),
    siparisFormuUrunleri(),
  ]);
  return (
    <div>
      <PageHeader title="Yeni Sipariş" description="Doktor ya da bayi için. Doktor siparişi sorumlu satıcıya yazılır." />
      <Card>
        <OrderForm
          products={products}
          doctors={cariler.map((c) => ({ ...c, title: c.accountClass === "BAYI" ? "[Bayi]" : c.title }))}
          action={createStaffOrder}
          fiyatOnizle={fiyatOnizle}
          riskOnizle={cariRiskiOnizle}
          iptalHref="/orders"
        />
      </Card>
    </div>
  );
}
