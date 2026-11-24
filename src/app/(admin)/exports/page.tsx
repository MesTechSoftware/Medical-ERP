import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import { PageHeader, Card } from "@/components/ui";
import { policy } from "@/lib/policy";
import { simdi, yerelGunMetni } from "@/lib/zaman";
import DisaAktarimFormu from "./DisaAktarimFormu";

/**
 * Dışa aktarım — D-5. Yalnız `YONETICI` (§(4)). Geçmiş ekranı yoktur; her çalıştırma
 * veritabanındaki kütüğe yazılır (§(5)). Veri seti kartları ve dönem kısayolları (spec Ü-29).
 */
export const metadata: Metadata = { title: "Dışa Aktarım" };

export default async function DisaAktarimPage() {
  await requireAdmin();
  return (
    <div>
      <PageHeader
        title="Dışa Aktarım"
        description="Müşavir ve mutabakat için veri setleri. Dosya sunucuda saklanmaz; her indirme kayda geçer."
      />
      <Card>
        <DisaAktarimFormu bugun={yerelGunMetni(simdi())} faturaSablonuVar={policy.export.sablonTanimi !== null} />
      </Card>
    </div>
  );
}
