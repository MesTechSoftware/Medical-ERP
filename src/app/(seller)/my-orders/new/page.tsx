import { prisma } from "@/lib/db";
import { requireSeller } from "@/lib/session";
import { kapsamliDoktorlariGetir } from "@/lib/doctor";
import { PageHeader, Card } from "@/components/ui";
import { cozumleBirimFiyat } from "@/lib/fiyat";
import { hesaplaStok } from "@/lib/stok";
import { formatla } from "@/lib/money";
import OrderForm from "../OrderForm";
import { bugun } from "@/lib/zaman";

export default async function NewOrderPage() {
  const session = await requireSeller();

  // FR-05: yalnızca satıcının KENDİ aktif doktorları seçilebilir.
  const doctors = await prisma.doctor.findMany({
    where: { AND: [kapsamliDoktorlariGetir(session.user), { status: "AKTIF" }] },
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true, clinic: true, title: true },
  });

  const urunler = await prisma.product.findMany({
    where: { status: "AKTIF" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, code: true, taxRate: { select: { rate: true } } },
  });

  // Önizleme varsayılan listeyle yapılır; sunucu siparişte carinin listesini
  // yeniden çözer (X-10). Liste ataması 1B madde 7'dedir.
  const products = await Promise.all(
    urunler.map(async (u) => {
      const fiyat = await cozumleBirimFiyat(u.id, null, { miktar: 1, gun: bugun() });
      return {
        id: u.id,
        name: u.name,
        code: u.code,
        listPrice: fiyat.durum === "TAMAM" ? formatla(fiyat.listeFiyat, "ham") : null,
        vatRate: formatla(u.taxRate.rate, "ham"),
        stock: await hesaplaStok(u.id),
      };
    })
  );

  return (
    <div>
      <PageHeader
        title="Yeni Sipariş"
        description="Ürünleri seçip sipariş oluşturun"
      />
      <Card>
        <OrderForm products={products} doctors={doctors} />
      </Card>
    </div>
  );
}
