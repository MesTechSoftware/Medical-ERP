import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { PageHeader, Card } from "@/components/ui";
import { IslemFormu } from "@/components/Sonuc";
import { KONTROL_TEK_SATIR, buton } from "@/components/stil";
import { Ikon } from "@/components/Ikon";
import { createPriceList } from "../actions";

const KUTU = `w-full ${KONTROL_TEK_SATIR}`;

/** Yeni fiyat listesi (X-10 §(1)) — yalnız yönetici. Oluşturunca listenin detayına (satır ekleme) gider. */
export default async function NewPriceListPage() {
  await requireAdmin();
  return (
    <div>
      <PageHeader
        title="Yeni Liste"
        description="Kod büyük harfe çevrilir; satırlar oluşturduktan sonra eklenir."
        action={
          <Link href="/price-lists" className={buton("metin")}>
            <Ikon ad="geri" />
            Fiyat Listeleri
          </Link>
        }
      />
      <Card>
        <IslemFormu action={createPriceList} className="max-w-md space-y-3">
          <div>
            <label htmlFor="liste-kod" className="mb-1 block text-sm font-medium text-slate-700">
              Kod
            </label>
            <input id="liste-kod" name="code" required maxLength={32} className={KUTU} />
          </div>
          <div>
            <label htmlFor="liste-ad" className="mb-1 block text-sm font-medium text-slate-700">
              Ad
            </label>
            <input id="liste-ad" name="name" required className={KUTU} />
          </div>
          <button type="submit" className={buton("birincil", { form: true })}>
            <Ikon ad="yeni" />
            Liste Oluştur
          </button>
        </IslemFormu>
      </Card>
    </div>
  );
}
