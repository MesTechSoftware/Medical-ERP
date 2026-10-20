import { requireAdmin } from "@/lib/session";
import { ASGARI_UZUNLUK } from "@/lib/parola";
import { PageHeader, Card } from "@/components/ui";
import UserForm from "../UserForm";
import { createUser } from "../actions";

export default async function NewUserPage() {
  await requireAdmin(); // kullanıcı yönetimi yalnız YONETICI (D-2 §(1))
  return (
    <div>
      <PageHeader title="Yeni Kullanıcı" description="Hesabı açın; rol açılıştan sonra değişmez" />
      <Card>
        <UserForm action={createUser} submitLabel="Kullanıcı Ekle" asgariParola={ASGARI_UZUNLUK} />
      </Card>
    </div>
  );
}
