import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { PageHeader, Card } from "@/components/ui";
import { CongressForm } from "../../CongressForms";
import { updateCongress } from "../../actions";

/** ISO tarihi <input type="date"> için YYYY-MM-DD'ye çevirir (yerel gün). */
function toDateInput(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export default async function EditCongressPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const congress = await prisma.congress.findUnique({ where: { id } });
  if (!congress) notFound();

  return (
    <div>
      <PageHeader title="Kongreyi Düzenle" description={congress.name} />
      <Card>
        <CongressForm
          action={updateCongress.bind(null, id)}
          submitLabel="Kaydet"
          cancelHref="/congresses"
          defaults={{
            name: congress.name,
            location: congress.location ?? undefined,
            startDate: toDateInput(congress.startDate),
            endDate: toDateInput(congress.endDate),
            quota: congress.quota ?? undefined,
            description: congress.description ?? undefined,
          }}
        />
      </Card>
    </div>
  );
}
