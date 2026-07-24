import { prisma } from "@/lib/db";
import { requireSeller } from "@/lib/session";
import { formatTRY } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { availableBalance, expiringSoon } from "@/lib/congress-ledger";
import { PageHeader, Card, StatCard, EmptyRow } from "@/components/ui";
import RegistrationForm from "./RegistrationForm";

const EXPIRY_WARNING_DAYS = 60;

const REG_STATUS_LABELS: Record<string, string> = {
  TALEP: "Talep (bakiye rezerve)",
  ONAYLANDI: "Onaylandı",
  IPTAL: "İptal",
  REDDEDILDI: "Reddedildi",
};

/**
 * FR-59: Satıcı, kendi doktorlarının kongre bakiyesini, yakında dolacak
 * bakiye uyarısını ve hangi paketlere yeterli olduğunu görür.
 * Süresi dolmak üzere olan bakiye bir SATIŞ ARACIDIR.
 */
export default async function MyCongressesPage() {
  const session = await requireSeller();
  const sellerId = session.user.id;

  const [doctors, packages, registrations] = await Promise.all([
    prisma.doctor.findMany({
      where: { ownerSellerId: sellerId, status: "ACTIVE" },
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        clinic: true,
        congressLedger: {
          where: { type: { in: ["EARN", "ADJUST"] }, remainingAmount: { gt: 0 } },
          select: {
            id: true,
            earnedAt: true,
            expiresAt: true,
            remainingAmount: true,
          },
        },
      },
    }),
    prisma.congressPackage.findMany({
      where: { congress: { status: "YAYINDA" } },
      orderBy: { value: "asc" },
      include: { congress: { select: { name: true } } },
    }),
    prisma.congressRegistration.findMany({
      where: { sellerId },
      orderBy: { requestedAt: "desc" },
      take: 50,
      include: {
        doctor: { select: { fullName: true } },
        package: {
          select: { name: true, congress: { select: { name: true } } },
        },
      },
    }),
  ]);

  const withBalance = doctors.map((d) => ({
    id: d.id,
    fullName: d.fullName,
    clinic: d.clinic,
    balance: availableBalance(d.congressLedger),
    soon: expiringSoon(d.congressLedger, EXPIRY_WARNING_DAYS),
  }));

  const totalBalance = withBalance.reduce((s, d) => s + d.balance, 0n);
  const totalSoon = withBalance.reduce((s, d) => s + d.soon, 0n);
  const cheapest = packages[0]?.value ?? null;

  return (
    <div>
      <PageHeader
        title="Kongreler"
        description="Doktorlarınızın kongre bakiyesi ve kayıt talepleri"
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Toplam Kongre Bakiyesi"
          value={formatTRY(totalBalance)}
          hint="Portföyünüzdeki doktorlar"
        />
        <StatCard
          label={`${EXPIRY_WARNING_DAYS} Gün İçinde Dolacak`}
          value={formatTRY(totalSoon)}
          tone={totalSoon > 0n ? "danger" : "default"}
          hint="Kullanılmazsa yanar"
        />
        <StatCard
          label="En Uygun Paket"
          value={cheapest === null ? "—" : formatTRY(cheapest)}
        />
      </div>

      {totalSoon > 0n && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Portföyünüzde <strong>{formatTRY(totalSoon)}</strong> tutarında bakiye{" "}
          {EXPIRY_WARNING_DAYS} gün içinde geçerliliğini yitirecek. Doktorlarınızı
          kongreye yönlendirmek için iyi bir zaman.
        </div>
      )}

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-slate-900">
          Doktor Bakiyeleri
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                <th className="px-3 py-2 font-medium">Doktor</th>
                <th className="px-3 py-2 font-medium">Klinik</th>
                <th className="px-3 py-2 text-right font-medium">Bakiye</th>
                <th className="px-3 py-2 text-right font-medium">
                  Yakında Dolacak
                </th>
                <th className="px-3 py-2 text-right font-medium">
                  Yeterli Paket
                </th>
              </tr>
            </thead>
            <tbody>
              {withBalance.length === 0 && (
                <EmptyRow colSpan={5} text="Portföyünüzde doktor yok." />
              )}
              {withBalance.map((d) => {
                const affordable = packages.filter(
                  (p) => p.value <= d.balance
                ).length;
                return (
                  <tr
                    key={d.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-3 py-2 font-medium text-slate-900">
                      {d.fullName}
                    </td>
                    <td className="px-3 py-2 text-slate-500">{d.clinic}</td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums">
                      {formatTRY(d.balance)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      <span className={d.soon > 0n ? "text-red-600" : "text-slate-400"}>
                        {d.soon > 0n ? formatTRY(d.soon) : "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                      {affordable} / {packages.length}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-6">
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Yeni Kayıt Talebi
          </h2>
          <RegistrationForm
            doctors={withBalance.map((d) => ({
              id: d.id,
              label: `${d.fullName} — bakiye ${formatTRY(d.balance)}`,
            }))}
            packages={packages.map((p) => ({
              id: p.id,
              label: `${p.congress.name} · ${p.name} — ${formatTRY(p.value)}`,
            }))}
          />
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Kayıt Taleplerim
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="px-3 py-2 font-medium">Tarih</th>
                  <th className="px-3 py-2 font-medium">Doktor</th>
                  <th className="px-3 py-2 font-medium">Kongre / Paket</th>
                  <th className="px-3 py-2 text-right font-medium">Tutar</th>
                  <th className="px-3 py-2 font-medium">Durum</th>
                </tr>
              </thead>
              <tbody>
                {registrations.length === 0 && (
                  <EmptyRow colSpan={5} text="Henüz kayıt talebiniz yok." />
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
