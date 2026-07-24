import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { formatTRY } from "@/lib/money";
import { getAllDealersCari } from "@/lib/dealer-cari";
import { PageHeader, Card, StatusBadge, EmptyRow } from "@/components/ui";

export default async function DealersPage() {
  await requireAdmin();

  const [dealers, cariMap] = await Promise.all([
    prisma.dealer.findMany({
      orderBy: { title: "asc" },
      include: { user: { select: { email: true } } },
    }),
    getAllDealersCari(),
  ]);

  return (
    <div>
      <PageHeader
        title="Bayiler"
        description="Bayi yönetimi, fiyat listeleri ve cari durumu"
        action={
          <Link
            href="/dealers/new"
            className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Yeni Bayi
          </Link>
        }
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                <th className="px-4 py-2 font-medium">Kod</th>
                <th className="px-4 py-2 font-medium">Ünvan</th>
                <th className="px-4 py-2 font-medium">Panel</th>
                <th className="px-4 py-2 text-right font-medium">Sevkiyat</th>
                <th className="px-4 py-2 text-right font-medium">Borç</th>
                <th className="px-4 py-2 font-medium">Durum</th>
              </tr>
            </thead>
            <tbody>
              {dealers.length === 0 && (
                <EmptyRow colSpan={6} text="Henüz bayi yok." />
              )}
              {dealers.map((d) => {
                const cari = cariMap.get(d.id) ?? {
                  toplamSevkiyat: 0n,
                  toplamOdeme: 0n,
                  bakiye: 0n,
                };
                return (
                  <tr
                    key={d.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-4 py-3 tabular-nums text-slate-500">
                      {d.code}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dealers/${d.id}`}
                        className="font-medium text-slate-900 hover:underline"
                      >
                        {d.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {d.user ? d.user.email : "Login yok"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatTRY(cari.toplamSevkiyat)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">
                      <span
                        className={
                          cari.bakiye > 0n ? "text-red-600" : "text-slate-900"
                        }
                      >
                        {formatTRY(cari.bakiye)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={d.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
