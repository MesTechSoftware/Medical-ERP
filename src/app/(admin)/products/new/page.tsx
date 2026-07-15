import { PageHeader, Card } from "@/components/ui";
import ProductForm from "../ProductForm";
import { createProduct } from "../actions";

export default function NewProductPage() {
  return (
    <div>
      <PageHeader title="Yeni Ürün" description="Kataloğa yeni ürün ekleyin" />
      <Card>
        <ProductForm
          action={createProduct}
          submitLabel="Ürün Ekle"
          showInitialStock
        />
      </Card>
    </div>
  );
}
