import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireSeller } from "@/lib/session";
import { formatPhone } from "@/lib/phone";
import { kapsamliDoktorlariGetir } from "@/lib/doctor";
import {
  PageHeader,
  LinkButton,
  Card,
  StatusBadge,
  EmptyRow,
} from "@/components/ui";
import Pagination from "@/components/Pagination";
import { getPagination, pageCount } from "@/lib/pagination";
import { buton } from "@/components/stil";

export default async function DoctorsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; per?: string }>;
}) {
  const session = await requireSeller();
  const { page, perPage, skip, take } = getPagination(await searchParams);

  // FR-05: satıcı yalnızca kendi portföyünü görür (X-13 §(1)).
  const where = kapsamliDoktorlariGetir(session.user);

  const [doctors, total] = await Promise.all([
    prisma.doctor.findMany({
      where,
      orderBy: { fullName: "asc" },
      skip,
      take,
      include: { _count: { select: { orders: true } } },
    }),
    prisma.doctor.count({ where }),
  ]);

  return (
    <div>
      <PageHeader
        title="Doktorlarım"
        description="Portföyünüzdeki doktorlar"
        action={<LinkButton href="/my-doctors/new">Yeni Doktor</LinkButton>}
      />

      <Card>
        <div className="tablo-kutusu">
          <table className="veri-tablosu">
            <thead>
              <tr>
                <th>Ad Soyad</th>
                <th>Klinik</th>
                <th className="oncelik-dusuk">Bölge</th>
                <th>Telefon</th>
                <th className="sayi oncelik-dusuk">Sipariş</th>
                <th>Durum</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {doctors.length === 0 && (
                <EmptyRow colSpan={7} text="Henüz doktor kaydınız yok." />
              )}
              {doctors.map((d) => (
                <tr key={d.id}>
                  <td className="font-medium text-slate-900">
                    {d.title ? `${d.title} ` : ""}
                    {d.fullName}
                  </td>
                  <td className="text-slate-500">{d.clinic}</td>
                  <td className="text-slate-500 oncelik-dusuk">{d.region}</td>
                  <td className="tabular-nums text-slate-500">
                    {formatPhone(d.phoneNormalized)}
                  </td>
                  <td className="sayi oncelik-dusuk">
                    {d._count.orders}
                  </td>
                  <td>
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="text-right">
                    <Link
                      href={`/my-doctors/${d.id}/edit`}
                      className={buton("metin")}
                    >
                      Düzenle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Pagination
        page={page}
        totalPages={pageCount(total, perPage)}
        total={total}
        basePath="/my-doctors"
      />
    </div>
  );
}
