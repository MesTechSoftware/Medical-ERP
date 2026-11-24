import type { Metadata } from "next";
import Link from "next/link";
import type { ImportDataType } from "@/generated/prisma/enums";
import { requireAdmin } from "@/lib/session";
import { Card, PageHeader } from "@/components/ui";
import { Ikon } from "@/components/Ikon";
import { TANIMLAR, VERI_TIPI_ADI } from "@/lib/ice-aktarim";
import IceAktarimFormu from "../IceAktarimFormu";
import { BAGLANTI } from "@/components/stil";

/** Yeni içe aktarım (spec Ü-30 §3.5): bugünkü form — doğrula → önizle → yaz (D-6). */
export const metadata: Metadata = { title: "Yeni İçe Aktarım" };

export default async function NewImportPage() {
  await requireAdmin();
  const turler = (Object.keys(TANIMLAR) as ImportDataType[]).map((kod) => ({ kod, ad: VERI_TIPI_ADI[kod] }));
  return (
    <div>
      <p className="mb-2 text-sm">
        <Link href="/imports" className={`inline-flex items-center gap-1 ${BAGLANTI}`}>
          <Ikon ad="geri" />
          İçe Aktarım
        </Link>
      </p>
      <PageHeader
        title="Yeni İçe Aktarım"
        description="Şablonu indirin, doldurun, önce doğrulayıp önizleyin. Hatalı satır varsa hiçbir kayıt yazılmaz."
      />
      <Card>
        <IceAktarimFormu turler={turler} />
      </Card>
    </div>
  );
}
