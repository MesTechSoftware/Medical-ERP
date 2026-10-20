import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/session";
import { ROLE_LABEL } from "@/lib/roles";
import {
  PageHeader,
  LinkButton,
  Card,
  StatusBadge,
  EmptyRow,
} from "@/components/ui";

export default async function UsersPage() {
  const session = await requireStaff();
  // Kullanıcı yönetimi yalnız YONETICI'dedir. OPERASYON yalnız satıcıları görür ve salt okur
  // (D-2 17.10 eki, E-2 20.10 eki).
  const yonetici = session.user.role === "YONETICI";
  const [users, doctorCounts] = await Promise.all([
    prisma.user.findMany({
      where: yonetici ? {} : { role: "SATICI" },
      orderBy: [{ role: "asc" }, { name: "asc" }],
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
        title="Kullanıcılar"
        description={yonetici ? "Hesaplar yalnız buradan açılır" : "Satıcılar"}
        action={yonetici && <LinkButton href="/users/new">Yeni Kullanıcı</LinkButton>}
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                <th className="px-4 py-2 font-medium">Kullanıcı</th>
                <th className="px-4 py-2 font-medium">Rol</th>
                <th className="px-4 py-2 font-medium">İletişim</th>
                <th className="px-4 py-2 text-right font-medium">Doktor</th>
                <th className="px-4 py-2 font-medium">Durum</th>
                <th className="px-4 py-2 text-right font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <EmptyRow colSpan={6} text="Henüz kullanıcı yok." />
              )}
              {users.map((u) => {
                const satici = u.role === "SATICI";
                return (
                  <tr
                    key={u.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-4 py-3">
                      {satici ? (
                        <Link
                          href={`/users/${u.id}`}
                          className="font-medium text-slate-900 hover:underline"
                        >
                          {u.name}
                        </Link>
                      ) : (
                        <span className="font-medium text-slate-900">{u.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{ROLE_LABEL[u.role]}</td>
                    <td className="px-4 py-3 text-slate-500">
                      <div>{u.email}</div>
                      {u.phone && (
                        <div className="text-xs text-slate-400">{u.phone}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {satici ? (doktorSayisi.get(u.id) ?? 0) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={u.isActive ? "AKTIF" : "PASIF"} />
                    </td>
                    <td className="px-4 py-3">
                      {yonetici && (
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/users/${u.id}/edit`}
                            className="text-sm font-medium text-slate-600 hover:text-slate-900"
                          >
                            Düzenle
                          </Link>
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
