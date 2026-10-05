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

  const action = updateSeller.bind(null, id);

  return (
    <div>
      <PageHeader title="Satıcıyı Düzenle" description={seller.name} />
      <Card>
        <SellerForm
          action={action}
          submitLabel="Kaydet"
          isEdit
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
