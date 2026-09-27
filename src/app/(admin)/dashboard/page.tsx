import Link from "next/link";
import { prisma } from "@/lib/db";
import { getAgingSummary, getSellerReceivables } from "@/lib/doctor-cari";
import { getAllDealersCari } from "@/lib/dealer-cari";
import { AGING_LABELS, AGING_ORDER } from "@/lib/allocation";
import { formatTRY } from "@/lib/money";
import { PageHeader, Card, StatCard, EmptyRow } from "@/components/ui";

const CRITICAL_STOCK = 10;

export default async function DashboardPage() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    stockAgg,
    criticalProducts,
    todayOrders,
    pendingCount,
    preparingCount,
    salesAgg,
    collectedAgg,
    sellers,
    receivables,
    aging,
    dealersCari,
  ] = await Promise.all([
    prisma.product.aggregate({ _sum: { stock: true } }),
    prisma.product.findMany({
      where: { status: "ACTIVE", stock: { lte: CRITICAL_STOCK } },
      orderBy: { stock: "asc" },
      select: { id: true, name: true, code: true, stock: true },
    }),
    prisma.order.count({ where: { orderDate: { gte: startOfToday } } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "PREPARING" } }),
    prisma.order.aggregate({
      where: { status: { not: "CANCELLED" } },
      _sum: { grossTotal: true },
    }),
    prisma.doctorPayment.aggregate({
      where: { status: "AKTIF" },
      _sum: { amount: true },
    }),
    prisma.user.findMany({
      where: { role: "SELLER" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    getSellerReceivables(),
    getAgingSummary(),
    getAllDealersCari(),
  ]);

  // Bayi kanalı toplamları (D-06: kongreye/prime dokunmaz, ayrı gösterilir).
  let bayiCiro = 0n;
  let bayiBorc = 0n;
  for (const c of dealersCari.values()) {
    bayiCiro += c.toplamSevkiyat;
    bayiBorc += c.bakiye;
  }

  const toplamStok = stockAgg._sum.stock ?? 0;
  const toplamCiro = salesAgg._sum.grossTotal ?? 0n;
  const toplamTahsilat = collectedAgg._sum.amount ?? 0n;
  const acikAlacak = AGING_ORDER.reduce((s, b) => s + aging[b], 0n);

  const sellerPerf = sellers
    .map((s) => ({
      name: s.name,
      r: receivables.get(s.id) ?? {
        acikAlacak: 0n,
        gecikmis: 0n,
        doktorSayisi: 0,
      },
    }))
    // BigInt farkı Number'a sığmayabileceği için karşılaştırma ile sıralanır.
    .sort((a, b) =>
      b.r.acikAlacak === a.r.acikAlacak ? 0 : b.r.acikAlacak > a.r.acikAlacak ? 1 : -1
    );

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
      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Satıcı Kanalı Ciro" value={formatTRY(toplamCiro)} hint="KDV dahil" />
        <StatCard label="Toplam Tahsilat" value={formatTRY(toplamTahsilat)} />
        <StatCard
          label="Açık Alacak (Doktor)"
          value={formatTRY(acikAlacak)}
          tone={acikAlacak > 0n ? "danger" : "success"}
        />
        <StatCard label="Bayi Kanalı Ciro" value={formatTRY(bayiCiro)} hint="KDV dahil" />
        <StatCard
          label="Bayi Alacağı"
          value={formatTRY(bayiBorc)}
          tone={bayiBorc > 0n ? "danger" : "success"}
        />
      </div>

      {/* FR-60: yaşlandırma özeti */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {AGING_ORDER.map((b) => (
          <StatCard
            key={b}
            label={AGING_LABELS[b]}
            value={formatTRY(aging[b])}
            tone={b === "D90_PLUS" && aging[b] > 0n ? "danger" : "default"}
          />
        ))}
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

        {/* Satıcı tahsilat sorumluluğu */}
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Satıcı Bazlı Tahsilat Sorumluluğu
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="px-3 py-2 font-medium">Satıcı</th>
                  <th className="px-3 py-2 text-right font-medium">Doktor</th>
                  <th className="px-3 py-2 text-right font-medium">Açık Alacak</th>
                  <th className="px-3 py-2 text-right font-medium">Gecikmiş</th>
                </tr>
              </thead>
              <tbody>
                {sellerPerf.length === 0 && (
                  <EmptyRow colSpan={4} text="Satıcı yok." />
                )}
                {sellerPerf.map((s) => (
                  <tr
                    key={s.name}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-3 py-2 font-medium text-slate-900">
                      {s.name}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {s.r.doktorSayisi}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatTRY(s.r.acikAlacak)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums">
                      <span
                        className={
                          s.r.gecikmis > 0n ? "text-red-600" : "text-slate-900"
                        }
                      >
                        {formatTRY(s.r.gecikmis)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
