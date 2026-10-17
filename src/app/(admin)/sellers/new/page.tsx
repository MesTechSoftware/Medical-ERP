import { requireAdmin } from "@/lib/session";
import { PageHeader, Card } from "@/components/ui";
import SellerForm from "../SellerForm";
import { createSeller } from "../actions";

export default async function NewSellerPage() {
  await requireAdmin(); // kullanıcı yönetimi yalnız YONETICI (D-2 §(1))
  return (
    <div>
      <PageHeader title="Yeni Satıcı" description="Sisteme yeni satıcı ekleyin" />
      <Card>
        <SellerForm action={createSeller} submitLabel="Satıcı Ekle" />
      </Card>
    </div>
  );
}
