import Link from "next/link";
import { prisma } from "@/lib/db";
import Decimal from "decimal.js";
import { Tutar } from "@/components/Tutar";
import { BRUT, MATRAH } from "@/lib/taban";
import { hesaplaStok } from "@/lib/stok";
import { getCiroTotal } from "@/lib/reports-service";
import { gunAraligi, simdi, TUM_ZAMANLAR } from "@/lib/zaman";
import { PageHeader, Card, StatCard, EmptyRow } from "@/components/ui";

const CRITICAL_STOCK = 10;

export default async function DashboardPage() {
  // "Bugün" İstanbul takvim günüdür (E-1 §(3)).
  const bugunAraligi = gunAraligi(simdi());

  const [
    products,
    todayOrders,
    pendingCount,
    preparingCount,
    toplamCiro,
    collectedAgg,
  ] = await Promise.all([
    prisma.product.findMany({
      where: { status: "AKTIF" },
      select: { id: true, name: true, code: true },
    }),
    prisma.order.count({
      where: { orderDate: { gte: bugunAraligi.baslangic, lt: bugunAraligi.bitis } },
    }),
    prisma.order.count({ where: { status: "BEKLIYOR" } }),
    prisma.order.count({ where: { status: "HAZIRLANIYOR" } }),
    getCiroTotal(TUM_ZAMANLAR), // "Toplam" kartı: tüm zamanlar bilinçli seçimdir (X-1 §(2))
    prisma.doctorPayment.aggregate({
      where: { status: "AKTIF" },
      _sum: { amount: true },
    }),
  ]);

  // Stok hareketlerden türer; tek okuma yolu hesaplaStok() (B-4, ADR-005).
  const stoklu = await Promise.all(
    products.map(async (p) => ({ ...p, stock: await hesaplaStok(p.id) }))
  );
  const criticalProducts = stoklu
    .filter((p) => p.stock <= CRITICAL_STOCK)
    .sort((a, b) => a.stock - b.stock);
  const toplamStok = stoklu.reduce((t, p) => t + p.stock, 0);
  const toplamTahsilat = new Decimal(collectedAgg._sum.amount ?? 0);

  return (
    <div>
      <PageHeader title="Dashboard" description="Operasyon özeti" />

      {/* Operasyonel metrikler */}
      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Toplam Stok" value={String(toplamStok)} hint="adet" />
        <StatCard label="Bugünkü Sipariş" value={String(todayOrders)} />
        <StatCard
          label="Bekleyen Sipariş"
          value={String(pendingCount)}
          tone={pendingCount > 0 ? "danger" : "default"}
        />
        <StatCard
          label="Kargolanacak"
          value={String(preparingCount)}
          tone={preparingCount > 0 ? "danger" : "default"}
        />
      </div>

      {/* Finansal metrikler (D-01: satıcı borcu kavramı YOK) */}
      {/* Bayi kanal kartları C5'te söküldü — bayi bir cari tipidir (X-8). */}
      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        {/* Ciro matrahtır ve sevk edilen maldan doğar (A-3, Ü-3 §(5)); CM → 1B arası boş (R-11). */}
        <StatCard label="Toplam Ciro" value={<Tutar deger={toplamCiro} taban={MATRAH} />} hint="tüm zamanlar" />
        <StatCard label="Toplam Tahsilat" value={<Tutar deger={toplamTahsilat} taban={BRUT} />} />
      </div>


      <div className="grid gap-6 lg:grid-cols-2">
        {/* Kritik stok */}
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Kritik Stok ({criticalProducts.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="px-3 py-2 font-medium">Ürün</th>
                  <th className="px-3 py-2 font-medium">Kod</th>
                  <th className="px-3 py-2 text-right font-medium">Stok</th>
                </tr>
              </thead>
              <tbody>
                {criticalProducts.length === 0 && (
                  <EmptyRow colSpan={3} text="Kritik stokta ürün yok." />
                )}
                {criticalProducts.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-3 py-2 text-slate-900">{p.name}</td>
                    <td className="px-3 py-2 text-slate-500">{p.code}</td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums text-red-600">
                      {p.stock}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-right">
            <Link
              href="/stock"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Stok Yönetimi →
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
