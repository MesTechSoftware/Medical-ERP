import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader, Card } from "@/components/ui";
import SellerForm from "../../SellerForm";
import { updateSeller } from "../../actions";

export default async function EditSellerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const seller = await prisma.user.findFirst({
    where: { id, role: "SATICI" },
  });
  if (!seller) notFound();

  // Pasifleştirmede portföy seçimi (X-17 §(5)): hedef yalnız başka bir aktif satıcıdır.
  const [doktorSayisi, saticilar] = await Promise.all([
    prisma.doctor.count({ where: { ownerSellerId: id } }),
    prisma.user.findMany({
      where: { role: "SATICI", isActive: true, id: { not: id } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const action = updateSeller.bind(null, id);

  return (
    <div>
      <PageHeader title="Satıcıyı Düzenle" description={seller.name} />
      <Card>
        <SellerForm
          action={action}
          submitLabel="Kaydet"
          isEdit
          portfoy={seller.isActive && doktorSayisi > 0 ? { doktorSayisi, saticilar } : undefined}
          defaults={{
            name: seller.name,
            email: seller.email,
            phone: seller.phone ?? undefined,
            status: seller.isActive ? "AKTIF" : "PASIF",
          }}
        />
      </Card>
    </div>
  );
}
