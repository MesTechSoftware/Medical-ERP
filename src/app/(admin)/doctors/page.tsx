import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { formatPhone } from "@/lib/phone";
import { PageHeader, Card, StatusBadge, EmptyRow } from "@/components/ui";
import Pagination from "@/components/Pagination";
import { getPagination, pageCount } from "@/lib/pagination";
import TransferForm from "./TransferForm";

export default async function AdminDoctorsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; per?: string; sahip?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const { page, perPage, skip, take } = getPagination(params);

  // "Sahipsiz" süzgeci (X-17 §(6)): bayinin sahibi hiç olmaz, sahipsiz sayılmaz (X-8 §(3)).
  const SAHIPSIZ = { ownerSellerId: null, accountClass: "DOKTOR" } as const;
  const sahipsizSuzgec = params.sahip === "yok";
  const where = sahipsizSuzgec ? SAHIPSIZ : {};

  // FR-05: admin TÜM doktorları görür.
  const [doctors, total, unowned, sellers] = await Promise.all([
    prisma.doctor.findMany({
      where,
      orderBy: { fullName: "asc" },
      skip,
      take,
      include: {
        ownerSeller: { select: { id: true, name: true } },
        _count: { select: { orders: true } },
      },
    }),
    prisma.doctor.count({ where }),
    prisma.doctor.count({ where: SAHIPSIZ }),
    prisma.user.findMany({
      where: { role: "SATICI", isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Doktorlar"
        description="Tüm doktor portföyü ve satıcı devirleri"
      />

      {unowned > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>{unowned}</strong> doktor sahipsiz havuzda. Bir satıcıya
          atanana kadar bu doktorlara sipariş girilemez.
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { href: "/doctors", label: "Tümü", active: !sahipsizSuzgec },
          { href: "/doctors?sahip=yok", label: "Sahipsiz", active: sahipsizSuzgec },
        ].map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className={
              "rounded-full px-3 py-1 text-sm font-medium transition " +
              (f.active
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100")
            }
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Toplu devir (X-17 §(4)): satırlardaki kutular bu forma `form` niteliğiyle bağlıdır. */}
      <div className="mb-4">
        <Card>
          <TransferForm formId="toplu-devir" sellers={sellers} />
        </Card>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                <th className="w-8 px-4 py-2"></th>
                <th className="px-4 py-2 font-medium">Ad Soyad</th>
                <th className="px-4 py-2 font-medium">Klinik / Bölge</th>
                <th className="px-4 py-2 font-medium">Telefon</th>
                <th className="px-4 py-2 font-medium">Sorumlu Satıcı</th>
                <th className="px-4 py-2 text-right font-medium">Sipariş</th>
                <th className="px-4 py-2 font-medium">Durum</th>
              </tr>
            </thead>
            <tbody>
              {doctors.length === 0 && (
                <EmptyRow colSpan={7} text="Henüz doktor kaydı yok." />
              )}
              {doctors.map((d) => (
                <tr key={d.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3">
                      {d.accountClass === "DOKTOR" && (
                        <input
                          type="checkbox"
                          id={`sec-${d.id}`}
                          name="doctorId"
                          value={d.id}
                          form="toplu-devir"
                          aria-label={`${d.fullName} seç`}
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <Link
                        href={`/doctors/${d.id}`}
                        className="hover:underline"
                      >
                        {d.title ? `${d.title} ` : ""}
                        {d.fullName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {d.clinic}
                      <span className="ml-1 text-xs text-slate-400">
                        {d.region}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-500">
                      {formatPhone(d.phoneNormalized)}
                    </td>
                    <td className="px-4 py-3">
                      {d.ownerSeller ? (
                        <span className="text-slate-900">
                          {d.ownerSeller.name}
                        </span>
                      ) : (
                        <span className="font-medium text-amber-700">
                          Sahipsiz
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {d._count.orders}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={d.status} />
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
        basePath="/doctors"
        params={{ sahip: params.sahip }}
      />
    </div>
  );
}
