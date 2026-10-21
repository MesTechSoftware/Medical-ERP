import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { formatDate } from "@/lib/format";
import { MATRAH, tabanli } from "@/lib/taban";
import { PageHeader, Card, EmptyRow } from "@/components/ui";
import { IslemFormu } from "@/components/Sonuc";
import { Tutar } from "@/components/Tutar";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import { deletePriceListItem, setPriceListItem } from "../actions";

const KUTU = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500";

/**
 * Liste satırları (X-10 §(7)): ürün · `min_adet` (barem alt sınırı, B-6) · liste fiyatı (KDV hariç).
 * Tarihli satırlar import'tan gelir ve burada salt okunur (tarih ekranı Faz 2).
 */
export default async function PriceListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const liste = await prisma.priceList.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: [{ product: { name: "asc" } }, { minQuantity: "asc" }, { validFrom: "asc" }],
        include: { product: { select: { name: true, code: true } } },
      },
    },
  });
  if (!liste) notFound();
  const urunler = await prisma.product.findMany({
    where: { status: "AKTIF" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, code: true },
  });

  return (
    <div>
      <PageHeader
        title={`${liste.code} — ${liste.name}`}
        description="Satır aynı ürün ve min. adet için tektir; fiyat yeniden girilirse güncellenir."
        action={
          <Link href="/price-lists" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            ← Fiyat Listeleri
          </Link>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="px-4 py-2 font-medium">Ürün</th>
                  <th className="px-4 py-2 text-right font-medium">Min. adet</th>
                  <th className="px-4 py-2 text-right font-medium">{tabanli("Liste fiyatı", MATRAH)}</th>
                  <th className="px-4 py-2 font-medium">Geçerlilik</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {liste.items.length === 0 && <EmptyRow colSpan={5} text="Bu listede satır yok." />}
                {liste.items.map((i) => (
                  <tr key={i.id} data-satir-id={i.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 text-slate-900">
                      {i.product.name}
                      <span className="ml-1 text-xs text-slate-400">{i.product.code}</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{i.minQuantity}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <Tutar deger={i.listPrice} taban={MATRAH} baslikta />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {i.validFrom || i.validTo
                        ? `${i.validFrom ? formatDate(i.validFrom) : "…"} – ${i.validTo ? formatDate(i.validTo) : "…"}`
                        : "Süresiz"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <IslemFormu action={deletePriceListItem.bind(null, i.id)}>
                        <ConfirmSubmit confirmText="Satır silinecek. Onaylıyor musunuz?">Sil</ConfirmSubmit>
                      </IslemFormu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
        <div>
          <Card>
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Satır Ekle / Güncelle</h2>
            <IslemFormu action={setPriceListItem.bind(null, liste.id)} className="space-y-3" basariMetni="Satır kaydedildi.">
              <div>
                <label htmlFor="satir-urun" className="mb-1 block text-sm font-medium text-slate-700">
                  Ürün
                </label>
                <select id="satir-urun" name="productId" required defaultValue="" className={KUTU}>
                  <option value="" disabled>
                    Seçiniz...
                  </option>
                  {urunler.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="satir-min" className="mb-1 block text-sm font-medium text-slate-700">
                  Min. adet
                </label>
                <input id="satir-min" name="minQuantity" type="number" min={1} defaultValue={1} required className={KUTU} />
              </div>
              <div>
                <label htmlFor="satir-fiyat" className="mb-1 block text-sm font-medium text-slate-700">
                  {tabanli("Liste fiyatı", MATRAH)}
                </label>
                <input id="satir-fiyat" name="listPrice" type="number" step="0.0001" min={0} required className={KUTU} />
              </div>
              <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
                Kaydet
              </button>
            </IslemFormu>
          </Card>
        </div>
      </div>
    </div>
  );
}
