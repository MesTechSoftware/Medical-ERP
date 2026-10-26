import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { policy } from "@/lib/policy";
import { PageHeader, Card, EmptyRow } from "@/components/ui";
import { IslemFormu } from "@/components/Sonuc";
import { createPriceList } from "./actions";

const KUTU = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500";

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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                    <th className="px-4 py-2 font-medium">Kod</th>
                    <th className="px-4 py-2 font-medium">Ad</th>
                    <th className="px-4 py-2 text-right font-medium">Satır</th>
                    <th className="px-4 py-2 text-right font-medium">Atanmış cari</th>
                  </tr>
                </thead>
                <tbody>
                  {listeler.length === 0 && <EmptyRow colSpan={4} text="Liste yok." />}
                  {listeler.map((l) => (
                    <tr key={l.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3 font-medium">
                        <Link href={`/price-lists/${l.id}`} className="text-slate-900 hover:underline">
                          {l.code}
                        </Link>
                        {l.code === varsayilan && <span className="ml-2 text-xs text-slate-400">varsayılan</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{l.name}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{l._count.items}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{l._count.doctors}</td>
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
              <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
                Liste Oluştur
              </button>
            </IslemFormu>
          </Card>
        </div>
      </div>
    </div>
  );
}
