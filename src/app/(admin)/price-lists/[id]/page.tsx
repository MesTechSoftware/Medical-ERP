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
import { KONTROL_TEK_SATIR, buton } from "@/components/stil";

const KUTU = `w-full ${KONTROL_TEK_SATIR}`;

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
          <Link href="/price-lists" className={buton("metin")}>
            ← Fiyat Listeleri
          </Link>
        }
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <div className="tablo-kutusu">
              <table className="veri-tablosu">
                <thead>
                  <tr>
                    <th>Ürün</th>
                    <th className="sayi">Min. adet</th>
                    <th className="sayi">{tabanli("Liste fiyatı", MATRAH)}</th>
                    <th className="oncelik-dusuk">Geçerlilik</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {liste.items.length === 0 && <EmptyRow colSpan={5} text="Bu listede satır yok." />}
                  {liste.items.map((i) => (
                    <tr key={i.id} data-satir-id={i.id}>
                      <td className="text-slate-900">
                        {i.product.name}
                        <span className="ml-1 text-xs text-slate-400">{i.product.code}</span>
                      </td>
                      <td className="sayi">{i.minQuantity}</td>
                      <td className="sayi">
                        <Tutar deger={i.listPrice} taban={MATRAH} baslikta />
                      </td>
                      <td className="text-xs text-slate-500 oncelik-dusuk">
                        {i.validFrom || i.validTo
                          ? `${i.validFrom ? formatDate(i.validFrom) : "…"} – ${i.validTo ? formatDate(i.validTo) : "…"}`
                          : "Süresiz"}
                      </td>
                      <td className="text-right">
                        <IslemFormu action={deletePriceListItem.bind(null, i.id)}>
                          <ConfirmSubmit confirmText="Satır silinecek. Onaylıyor musunuz?">Sil</ConfirmSubmit>
                        </IslemFormu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
              <button type="submit" className={buton("birincil", { form: true })}>
                Kaydet
              </button>
            </IslemFormu>
          </Card>
        </div>
      </div>
    </div>
  );
}
