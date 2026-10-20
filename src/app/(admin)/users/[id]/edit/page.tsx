import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { ASGARI_UZUNLUK } from "@/lib/parola";
import { ROLE_LABEL } from "@/lib/roles";
import { PageHeader, Card } from "@/components/ui";
import UserForm from "../../UserForm";
import { updateUser } from "../../actions";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin(); // kullanıcı yönetimi yalnız YONETICI (D-2 §(1))
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) notFound();

  // Pasifleştirmede portföy seçimi (X-17 §(5)): hedef yalnız başka bir aktif satıcıdır.
  const [doktorSayisi, saticilar] =
    user.role === "SATICI"
      ? await Promise.all([
          prisma.doctor.count({ where: { ownerSellerId: id } }),
          prisma.user.findMany({
            where: { role: "SATICI", isActive: true, id: { not: id } },
            orderBy: { name: "asc" },
            select: { id: true, name: true },
          }),
        ])
      : [0, []];

  const action = updateUser.bind(null, id);

  return (
    <div>
      <PageHeader title="Kullanıcıyı Düzenle" description={user.name} />
      <Card>
        <UserForm
          action={action}
          submitLabel="Kaydet"
          isEdit
          rolEtiketi={ROLE_LABEL[user.role]}
          asgariParola={ASGARI_UZUNLUK}
          portfoy={user.isActive && doktorSayisi > 0 ? { doktorSayisi, saticilar } : undefined}
          defaults={{
            name: user.name,
            email: user.email,
            phone: user.phone ?? undefined,
            status: user.isActive ? "AKTIF" : "PASIF",
          }}
        />
      </Card>
    </div>
  );
}
