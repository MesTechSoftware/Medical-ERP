import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/session";
import { Card, PageHeader } from "@/components/ui";
import { Ikon } from "@/components/Ikon";
import CollectionForm from "../CollectionForm";
import { BAGLANTI } from "@/components/stil";

/** Yeni tahsilat (spec Ü-26 §3.6): bugünkü form; sonuç ve `BILGI` uyarıları (A-15, X-6) formun altında. */
export default async function NewCollectionPage() {
  await requireStaff(); // tahsilat kaydı YONETICI ve OPERASYON (D-2-1)
  const [doctors, paymentMethods] = await Promise.all([
    prisma.doctor.findMany({ where: { status: "AKTIF" }, orderBy: { fullName: "asc" }, select: { id: true, fullName: true, clinic: true } }),
    prisma.paymentMethod.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  return (
    <div>
      <p className="mb-2 text-sm">
        <Link href="/collections" className={`inline-flex items-center gap-1 ${BAGLANTI}`}>
          <Ikon ad="geri" />
          Tahsilatlar
        </Link>
      </p>
      <PageHeader title="Yeni Tahsilat" description="Tahsilat carinin bakiyesinden düşer." />
      <Card>
        <CollectionForm
          doctors={doctors.map((d) => ({ id: d.id, label: d.clinic ? `${d.fullName} — ${d.clinic}` : d.fullName }))}
          paymentMethods={paymentMethods}
        />
      </Card>
    </div>
  );
}
