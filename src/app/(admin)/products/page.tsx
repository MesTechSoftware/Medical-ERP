import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatla } from "@/lib/money";
import { Tutar } from "@/components/Tutar";
import { MATRAH, tabanli } from "@/lib/taban";
import { cozumleBirimFiyat } from "@/lib/fiyat";
import { hesaplaStok } from "@/lib/stok";
import { StokMiktari } from "@/components/StokMiktari";
import { requireStaff } from "@/lib/session";
import { PageHeader, LinkButton, Card, StatusBadge, EmptyRow } from "@/components/ui";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import { IslemFormu } from "@/components/Sonuc";
import { deleteProduct } from "./actions";
import { bugun } from "@/lib/zaman";
import { buton } from "@/components/stil";


export default async function ProductsPage() {
  const session = await requireStaff();
  // OPERASYON ürünü görür, açmaz ve düzenlemez (D-2 17.10 eki); yetki action'dadır.
  const yonetici = session.user.role === "YONETICI";
  const urunler = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { taxRate: { select: { rate: true } } },
  });
  // Liste fiyatı varsayılan listenin satırıdır (X-10 §(5)); stok hareketlerden türer (ADR-005).
  const products = await Promise.all(
    urunler.map(async (p) => {
      const fiyat = await cozumleBirimFiyat(p.id, null, { miktar: 1, gun: bugun() });
      return {
        ...p,
        listPrice: fiyat.durum === "TAMAM" ? fiyat.listeFiyat : null,
        stock: await hesaplaStok(p.id),
      };
    })
  );

  return (
    <div>
      <PageHeader
        title="Ürünler"
        description="Ürün kataloğu ve güncel stok durumu"
        action={yonetici && <LinkButton href="/products/new">Yeni Ürün</LinkButton>}
      />

      <Card>
        <div className="tablo-kutusu">
          <table className="veri-tablosu">
            <thead>
              <tr>
                <th>Ürün</th>
                <th className="oncelik-dusuk">Kod</th>
                <th className="sayi">
                  {tabanli("Liste Fiyatı", MATRAH)}
                </th>
                <th className="sayi oncelik-dusuk">KDV</th>
                <th className="sayi">Stok</th>
                <th>Durum</th>
                <th className="sayi">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 && (
                <EmptyRow colSpan={7} text="Henüz ürün eklenmemiş." />
              )}
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="font-medium text-slate-900">
                    {p.name}
                  </td>
                  <td className="text-slate-500 oncelik-dusuk">{p.code}</td>
                  <td className="sayi">
                    <Tutar deger={p.listPrice} taban={MATRAH} baslikta />
                  </td>
                  <td className="sayi text-slate-500 oncelik-dusuk">
                    {formatla(p.taxRate.rate, "oran")}
                  </td>
                  <td className="sayi">
                    <StokMiktari miktar={p.stock} />
                  </td>
                  <td>
                    <StatusBadge status={p.status} />
                  </td>
                  <td>
                    {yonetici && (
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/products/${p.id}/edit`}
                          className={buton("metin")}
                        >
                          Düzenle
                        </Link>
                        <IslemFormu action={deleteProduct.bind(null, p.id)}>
                          <ConfirmSubmit confirmText={`"${p.name}" silinsin mi?`}>
                            Sil
                          </ConfirmSubmit>
                        </IslemFormu>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
