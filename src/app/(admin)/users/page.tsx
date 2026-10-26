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
import { buton } from "@/components/stil";

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
        <div className="tablo-kutusu">
          <table className="veri-tablosu">
            <thead>
              <tr>
                <th>Kullanıcı</th>
                <th>Rol</th>
                <th className="oncelik-dusuk">İletişim</th>
                <th className="sayi oncelik-dusuk">Doktor</th>
                <th>Durum</th>
                <th className="sayi">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <EmptyRow colSpan={6} text="Henüz kullanıcı yok." />
              )}
              {users.map((u) => {
                const satici = u.role === "SATICI";
                return (
                  <tr key={u.id}>
                    <td>
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
                    <td className="text-slate-600">{ROLE_LABEL[u.role]}</td>
                    <td className="text-slate-500 oncelik-dusuk">
                      <div>{u.email}</div>
                      {u.phone && (
                        <div className="text-xs text-slate-400">{u.phone}</div>
                      )}
                    </td>
                    <td className="sayi oncelik-dusuk">
                      {satici ? (doktorSayisi.get(u.id) ?? 0) : "—"}
                    </td>
                    <td>
                      <StatusBadge status={u.isActive ? "AKTIF" : "PASIF"} />
                    </td>
                    <td>
                      {yonetici && (
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/users/${u.id}/edit`}
                            className={buton("metin")}
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
