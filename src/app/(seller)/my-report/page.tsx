import { requireSeller } from "@/lib/session";
import { donemCoz } from "@/lib/donem";
import { getSellerReports } from "@/lib/reports-service";
import DonemSecici from "@/components/DonemSecici";
import SaticiRaporTablosu from "@/components/SaticiRaporTablosu";
import { PageHeader, Card } from "@/components/ui";

/**
 * Satıcının kendi prim/hakediş ekranı (D-2 §(1)). Kısıt sorgudadır: `getSellerReports`
 * `SATICI`'ya yalnız kendi satırını döndürür (X-1 §(8)). Dosya olarak indirilemez (D-5 §(4)).
 */
export default async function MyReportPage({
  searchParams,
}: {
  searchParams: Promise<{ donem?: string }>;
}) {
  const session = await requireSeller();
  const donem = donemCoz((await searchParams).donem);
  const satirlar = await getSellerReports(session.user, donem.aralik);

  return (
    <div>
      <PageHeader title="Raporum" description="Dönem cirom, hakedişim ve tahsilatım" />
      <DonemSecici anahtar={donem.anahtar} yol="/my-report" />
      <Card>
        <SaticiRaporTablosu satirlar={satirlar} />
        <p className="mt-3 text-xs text-slate-500">
          Hakediş sevkiyat anında doğar; ödeme zamanlaması sistemin dışındadır.
        </p>
      </Card>
    </div>
  );
}
