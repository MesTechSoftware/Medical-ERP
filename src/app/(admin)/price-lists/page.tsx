import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { policy } from "@/lib/policy";
import { PageHeader, Card, EmptyRow } from "@/components/ui";
import { IslemFormu } from "@/components/Sonuc";
import { createPriceList } from "./actions";
import { KONTROL_TEK_SATIR, buton } from "@/components/stil";
import { Ikon } from "@/components/Ikon";

const KUTU = `w-full ${KONTROL_TEK_SATIR}`;

/** Fiyat listeleri (X-10) — yalnız yönetici. Cariye atama cari kartındadır. */
export default async function PriceListsPage() {
  await requireAdmin();
  const listeler = await prisma.priceList.findMany({
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true, _count: { select: { items: true, doctors: true } } },
  });
  const varsayilan = policy.pricing.varsayilanFiyatListesiKodu;

  return (
    <div>
      <PageHeader title="Fiyat Listeleri" description="Liste fiyatı ve barem satırları. Atanmamış cari varsayılan listeyi kullanır." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <div className="tablo-kutusu">
              <table className="veri-tablosu">
                <thead>
                  <tr>
                    <th>Kod</th>
                    <th>Ad</th>
                    <th className="sayi oncelik-dusuk">Satır</th>
                    <th className="sayi">Atanmış cari</th>
                  </tr>
                </thead>
                <tbody>
                  {listeler.length === 0 && <EmptyRow colSpan={4} text="Liste yok." />}
                  {listeler.map((l) => (
                    <tr key={l.id}>
                      <td className="font-medium">
                        <Link href={`/price-lists/${l.id}`} className="text-slate-900 hover:underline">
                          {l.code}
                        </Link>
                        {l.code === varsayilan && <span className="ml-2 text-xs text-slate-400">varsayılan</span>}
                      </td>
                      <td className="text-slate-700">{l.name}</td>
                      <td className="sayi oncelik-dusuk">{l._count.items}</td>
                      <td className="sayi">{l._count.doctors}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
        <div>
          <Card>
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Yeni Liste</h2>
            <IslemFormu action={createPriceList} className="space-y-3" basariMetni="Liste oluşturuldu.">
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
      </div>
    </div>
  );
}
