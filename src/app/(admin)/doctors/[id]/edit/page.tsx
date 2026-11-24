import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { formatPhone } from "@/lib/phone";
import { formatla } from "@/lib/money";
import { PageHeader, Card } from "@/components/ui";
import CariFormu from "../../CariFormu";
import { updateCari } from "../../actions";
import { cariSecenekleri } from "../../secenekler";

/** Cari düzeltme (X-16 §(9)): aynı alanlar, aynı doğrulama, aynı log. Sahip devirle değişir. */
export const metadata: Metadata = { title: "Cari Düzenle" };

export default async function EditCariPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const c = await prisma.doctor.findUnique({ where: { id } });
  if (!c) notFound();
  const { saticilar, listeler } = await cariSecenekleri();
  const m = (v: string | null) => v ?? undefined;
  return (
    <div>
      <PageHeader title={`${c.fullName} — Düzenle`} description={c.accountClass === "BAYI" ? "Bayi" : "Doktor"} />
      <Card>
        <CariFormu
          action={updateCari.bind(null, id)}
          acilis={false}
          saticilar={saticilar}
          listeler={listeler}
          iptalHref={`/doctors/${id}`}
          degerler={{
            accountClass: c.accountClass,
            fullName: c.fullName,
            title: m(c.title),
            specialty: m(c.specialty),
            clinic: m(c.clinic),
            region: m(c.region),
            city: m(c.city),
            email: m(c.email),
            phone: formatPhone(c.phoneNormalized),
            priceListId: m(c.priceListId),
            paymentTermDays: c.paymentTermDays?.toString(),
            creditLimit: c.creditLimit ? formatla(c.creditLimit, "ham") : undefined,
            partyType: c.partyType,
            taxId: m(c.taxId),
            invoiceTitle: m(c.invoiceTitle),
            taxOffice: m(c.taxOffice),
            invoiceAddress: m(c.invoiceAddress),
            invoiceDistrict: m(c.invoiceDistrict),
            invoiceCity: m(c.invoiceCity),
            accountingCode: m(c.accountingCode),
          }}
        />
      </Card>
    </div>
  );
}
