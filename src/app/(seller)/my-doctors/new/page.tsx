import type { Metadata } from "next";
import { PageHeader, Card } from "@/components/ui";
import DoctorForm from "../DoctorForm";
import { createDoctor } from "../actions";

export const metadata: Metadata = { title: "Yeni Doktor" };

export default function NewDoctorPage() {
  return (
    <div>
      <PageHeader
        title="Yeni Doktor"
        description="Kayıt sizin portföyünüze eklenir"
      />
      <Card>
        <DoctorForm action={createDoctor} submitLabel="Doktor Ekle" />
      </Card>
    </div>
  );
}
