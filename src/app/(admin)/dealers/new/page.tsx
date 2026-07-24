import { PageHeader, Card } from "@/components/ui";
import { requireAdmin } from "@/lib/session";
import { NewDealerForm } from "../DealerForms";

export default async function NewDealerPage() {
  await requireAdmin();
  return (
    <div>
      <PageHeader
        title="Yeni Bayi"
        description="Bayi kaydı ve opsiyonel panel girişi"
      />
      <Card>
        <NewDealerForm />
      </Card>
    </div>
  );
}
