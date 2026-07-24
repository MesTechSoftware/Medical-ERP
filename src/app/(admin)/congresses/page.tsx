import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { formatTRY } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { PageHeader, Card, EmptyRow } from "@/components/ui";
import {
  NewCongressForm,
  NewPackageForm,
  PackageRow,
  RegistrationActions,
} from "./CongressForms";
import CongressControls from "./CongressControls";

const REG_STATUS_LABELS: Record<string, string> = {
  TALEP: "Talep",
  ONAYLANDI: "Onaylandı",
  IPTAL: "İptal",
  REDDEDILDI: "Reddedildi",
};

export default async function CongressesPage() {
  await requireAdmin();

  const [congresses, registrations] = await Promise.all([
    prisma.congress.findMany({
      orderBy: { startDate: "desc" },
      include: {
        packages: {
          include: {
            _count: {
              select: { registrations: { where: { status: "ONAYLANDI" } } },
            },
          },
        },
      },
    }),
    prisma.congressRegistration.findMany({
      orderBy: { requestedAt: "desc" },
      take: 100,
      include: {
        doctor: { select: { fullName: true } },
        package: {
          select: { name: true, congress: { select: { name: true } } },
        },
      },
    }),
  ]);

  const pending = registrations.filter((r) => r.status === "TALEP").length;

  return (
    <div>
      <PageHeader
        title="Kongreler"
        description="Kongre ve paket yönetimi, kayıt onayları"
      />

      {/* §11: hukuk/uyum uyarısı ürün içinde görünür kalmalı. */}
      <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
        Kongre hak edişi, tahsil edilen ciroya bağlı olarak doktora menfaat
        sağlar. Tüm kararlar denetim izine yazılır (RULE-13).
      </div>

      {pending > 0 && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>{pending}</strong> kayıt talebi onay bekliyor. Talepler bakiyeyi
          rezerve eder ve kontenjandan düşer.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Yeni Kongre
          </h2>
          <NewCongressForm />
        </Card>
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Yeni Paket
          </h2>
          <NewPackageForm
            congresses={congresses.map((c) => ({ id: c.id, name: c.name }))}
          />
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Kongreler ve Paketler
          </h2>
          {congresses.length === 0 && (
            <p className="text-sm text-slate-500">Henüz kongre yok.</p>
          )}
          <div className="space-y-4">
            {congresses.map((c) => (
              <div
                key={c.id}
                className="rounded-lg border border-slate-200 p-3"
              >
                <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-medium text-slate-900">
                    {c.name}
                    {c.status !== "YAYINDA" && (
                      <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-500">
                        {c.status === "IPTAL" ? "İptal" : c.status}
                      </span>
                    )}
                  </h3>
                  <span className="text-xs text-slate-500">
                    {formatDate(c.startDate)} – {formatDate(c.endDate)}
                    {c.location ? ` · ${c.location}` : ""}
                    {c.quota !== null ? ` · kontenjan ${c.quota}` : ""}
                  </span>
                </div>
                <div className="mb-2">
                  <CongressControls id={c.id} />
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                      <th className="px-2 py-1 font-medium">Paket</th>
                      <th className="px-2 py-1 text-right font-medium">Değer</th>
                      <th className="px-2 py-1 text-right font-medium">
                        Onaylı / Kontenjan
                      </th>
                      <th className="px-2 py-1 text-right font-medium">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.packages.length === 0 && (
                      <EmptyRow colSpan={4} text="Paket yok." />
                    )}
                    {c.packages.map((p) => (
                      <PackageRow
                        key={p.id}
                        pkg={{
                          id: p.id,
                          name: p.name,
                          valueTL: Number(p.value) / 100,
                          quota: p.quota,
                        }}
                        approvedCount={p._count.registrations}
                        formatValue={formatTRY(p.value)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Kayıt Talepleri
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="px-3 py-2 font-medium">Tarih</th>
                  <th className="px-3 py-2 font-medium">Doktor</th>
                  <th className="px-3 py-2 font-medium">Kongre / Paket</th>
                  <th className="px-3 py-2 text-right font-medium">Rezerve</th>
                  <th className="px-3 py-2 font-medium">Durum</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {registrations.length === 0 && (
                  <EmptyRow colSpan={6} text="Henüz kayıt talebi yok." />
                )}
                {registrations.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-3 py-2 whitespace-nowrap text-slate-500">
                      {formatDate(r.requestedAt)}
                    </td>
                    <td className="px-3 py-2 text-slate-900">
                      {r.doctor.fullName}
                    </td>
                    <td className="px-3 py-2 text-slate-500">
                      {r.package.congress.name} · {r.package.name}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatTRY(r.reservedAmount)}
                    </td>
                    <td className="px-3 py-2">
                      {REG_STATUS_LABELS[r.status] ?? r.status}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <RegistrationActions
                        registrationId={r.id}
                        status={r.status}
                      />
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
