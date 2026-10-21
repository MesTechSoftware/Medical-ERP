import { requireAdmin } from "@/lib/session";
import { PageHeader, Card } from "@/components/ui";
import CariFormu from "../CariFormu";
import { createCari } from "../actions";
import { cariSecenekleri } from "../secenekler";

/** Yönetici cari açar — doktor ya da bayi (X-8 §(5), D-2: OPERASYON cari açmaz). */
export default async function NewCariPage() {
  await requireAdmin();
  const { saticilar, listeler } = await cariSecenekleri();
  return (
    <div>
      <PageHeader title="Yeni Cari" description="Doktor ya da bayi. Hesap sınıfı açıldıktan sonra değişmez." />
      <Card>
        <CariFormu action={createCari} saticilar={saticilar} listeler={listeler} acilis iptalHref="/doctors" />
      </Card>
    </div>
  );
}
