import { PageHeader, Card } from "@/components/ui";
import SellerForm from "../SellerForm";
import { createSeller } from "../actions";

export default function NewSellerPage() {
  return (
    <div>
      <PageHeader title="Yeni Satıcı" description="Sisteme yeni satıcı ekleyin" />
      <Card>
        <SellerForm action={createSeller} submitLabel="Satıcı Ekle" />
      </Card>
    </div>
  );
}
