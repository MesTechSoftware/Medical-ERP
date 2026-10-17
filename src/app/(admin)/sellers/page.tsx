import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/session";
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
  const session = await requireStaff();
  // OPERASYON satıcıları salt okur; ekleme/düzenleme/silme kullanıcı yönetimidir (D-2 17.10 eki).
  const yonetici = session.user.role === "YONETICI";
  const { error } = await searchParams;
  const [sellers, doctorCounts] = await Promise.all([
    prisma.user.findMany({
      where: { role: "SATICI" },
      orderBy: { name: "asc" },
    }),
    prisma.doctor.groupBy({
      by: ["ownerSellerId"],
      _count: { _all: true },
    }),
  ]);
  const doktorSayisi = new Map(
    doctorCounts.map((g) => [g.ownerSellerId, g._count._all])
  );

  return (
    <div>
      <PageHeader
        title="Satıcılar"
        description="Satıcı yönetimi"
        action={yonetici && <LinkButton href="/sellers/new">Yeni Satıcı</LinkButton>}
      />

      {error === "used" && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Bu satıcının sipariş kaydı olduğu için silinemez. Bunun yerine
          &quot;Pasif&quot; yapabilirsiniz.
        </div>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                <th className="px-4 py-2 font-medium">Satıcı</th>
                <th className="px-4 py-2 font-medium">İletişim</th>
                <th className="px-4 py-2 text-right font-medium">Doktor</th>
                <th className="px-4 py-2 font-medium">Durum</th>
                <th className="px-4 py-2 text-right font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {sellers.length === 0 && (
                <EmptyRow colSpan={5} text="Henüz satıcı eklenmemiş." />
              )}
              {sellers.map((s) => {
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
                      {doktorSayisi.get(s.id) ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={s.isActive ? "AKTIF" : "PASIF"} />
                    </td>
                    <td className="px-4 py-3">
                      {yonetici && (
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
                      )}
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
