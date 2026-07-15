import Link from "next/link";
import { prisma } from "@/lib/db";
import { getAllSellersCari } from "@/lib/cari";
import { formatTRY } from "@/lib/money";
import {
  PageHeader,
  LinkButton,
  Card,
  StatusBadge,
  EmptyRow,
} from "@/components/ui";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import { deleteSeller } from "./actions";

export default async function SellersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const [sellers, cariMap] = await Promise.all([
    prisma.user.findMany({
      where: { role: "SELLER" },
      orderBy: { name: "asc" },
    }),
    getAllSellersCari(),
  ]);

  return (
    <div>
      <PageHeader
        title="Satıcılar"
        description="Satıcı yönetimi ve cari hesap durumu"
        action={<LinkButton href="/sellers/new">Yeni Satıcı</LinkButton>}
      />

      {error === "used" && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Bu satıcının sipariş veya ödeme kaydı olduğu için silinemez. Bunun
          yerine &quot;Pasif&quot; yapabilirsiniz.
        </div>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                <th className="px-4 py-2 font-medium">Satıcı</th>
                <th className="px-4 py-2 font-medium">İletişim</th>
                <th className="px-4 py-2 text-right font-medium">Toplam Satış</th>
                <th className="px-4 py-2 text-right font-medium">Toplam Ödeme</th>
                <th className="px-4 py-2 text-right font-medium">Bakiye</th>
                <th className="px-4 py-2 font-medium">Durum</th>
                <th className="px-4 py-2 text-right font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {sellers.length === 0 && (
                <EmptyRow colSpan={7} text="Henüz satıcı eklenmemiş." />
              )}
              {sellers.map((s) => {
                const cari = cariMap.get(s.id) ?? {
                  toplamSatis: 0,
                  toplamOdeme: 0,
                  guncelBakiye: 0,
                };
                return (
                  <tr
                    key={s.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/sellers/${s.id}`}
                        className="font-medium text-slate-900 hover:underline"
                      >
                        {s.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      <div>{s.email}</div>
                      {s.phone && (
                        <div className="text-xs text-slate-400">{s.phone}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatTRY(cari.toplamSatis)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatTRY(cari.toplamOdeme)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">
                      <span
                        className={
                          cari.guncelBakiye > 0
                            ? "text-red-600"
                            : "text-slate-900"
                        }
                      >
                        {formatTRY(cari.guncelBakiye)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/sellers/${s.id}/edit`}
                          className="text-sm font-medium text-slate-600 hover:text-slate-900"
                        >
                          Düzenle
                        </Link>
                        <form action={deleteSeller.bind(null, s.id)}>
                          <ConfirmSubmit confirmText={`"${s.name}" silinsin mi?`}>
                            Sil
                          </ConfirmSubmit>
                        </form>
                      </div>
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
