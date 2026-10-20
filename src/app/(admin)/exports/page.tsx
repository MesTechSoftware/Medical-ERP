import { requireAdmin } from "@/lib/session";
import { PageHeader, Card } from "@/components/ui";
import DisaAktarimFormu from "./DisaAktarimFormu";

/**
 * Dışa aktarım — D-5. Yalnız `YONETICI` (§(4)). Geçmiş ekranı yoktur; her çalıştırma
 * veritabanındaki kütüğe yazılır (§(5)).
 */
export default async function DisaAktarimPage() {
  await requireAdmin();
  return (
    <div>
      <PageHeader
        title="Dışa Aktarım"
        description="Müşavir ve mutabakat için veri setleri. Dosya sunucuda saklanmaz; her indirme kayda geçer."
      />
      <Card>
        <DisaAktarimFormu />
      </Card>
    </div>
  );
}
