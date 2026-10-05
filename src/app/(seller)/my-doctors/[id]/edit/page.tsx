import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSeller } from "@/lib/session";
import { formatPhone } from "@/lib/phone";
import { PageHeader, Card } from "@/components/ui";
import DoctorForm from "../../DoctorForm";
import { updateDoctor } from "../../actions";

export default async function EditDoctorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSeller();
  const { id } = await params;

  // FR-05: sahiplik sorguya gömülür — başkasının doktoru 404 döner.
  const doctor = await prisma.doctor.findFirst({
    where: { id, ownerSellerId: session.user.id },
  });
  if (!doctor) notFound();

  return (
    <div>
      <PageHeader title="Doktoru Düzenle" description={doctor.fullName} />
      <Card>
        <DoctorForm
          action={updateDoctor.bind(null, id)}
          submitLabel="Kaydet"
          defaults={{
            fullName: doctor.fullName,
            title: doctor.title ?? undefined,
            specialty: doctor.specialty ?? undefined,
            clinic: doctor.clinic ?? undefined,
            region: doctor.region ?? undefined,
            city: doctor.city ?? undefined,
            phone: formatPhone(doctor.phoneNormalized),
            email: doctor.email ?? undefined,
          }}
        />
      </Card>
    </div>
  );
}
