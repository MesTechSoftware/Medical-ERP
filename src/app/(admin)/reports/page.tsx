import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { formatTRY } from "@/lib/money";
import { VAT_MODE_COOKIE, parseVatMode } from "@/lib/vat-mode";
import {
  getChannelReport,
  getDoctorReports,
  getSellerReports,
} from "@/lib/reports-service";
import { PageHeader, Card, StatCard, EmptyRow } from "@/components/ui";
import VatToggle from "@/components/VatToggle";

/**
 * FR-62/FR-63/FR-60: Raporlar. Tümünde KDV Dahil/Hariç görünüm seçeneği (FR-64).
 */
export default async function ReportsPage() {
  await requireAdmin();
  const mode = parseVatMode((await cookies()).get(VAT_MODE_COOKIE)?.value);

  const [sellers, doctors, channel, dealerDebt] =
    await Promise.all([
      getSellerReports(mode),
      getDoctorReports(mode, 25),
      getChannelReport(mode),
      prisma.dealerShipment
        .aggregate({
          where: { status: "ONAYLANDI" },
          _sum: { grossTotal: true },
        })
        .then((r) => r._sum.grossTotal ?? 0n),
    ]);

  const modeLabel = mode === "NET" ? "KDV hariç" : "KDV dahil";

  return (
    <div>
      <PageHeader
        title="Raporlar"
        description={`Ciro ve performans (${modeLabel})`}
        action={<VatToggle current={mode} />}
      />

      {/* FR-60: kanal karşılaştırma + potansiyel yükümlülükler */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Satıcı Kanalı Ciro" value={formatTRY(channel.saticiCiro)} />
        <StatCard label="Bayi Kanalı Ciro" value={formatTRY(channel.bayiCiro)} />
        <StatCard label="Bayi Açık Sevkiyat" value={formatTRY(dealerDebt)} />
      </div>

      {/* FR-62: satıcı performans karşılaştırması */}
      <Card>
        <h2 className="mb-4 text-sm font-semibold text-slate-900">
          Satıcı Performansı
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                <th className="px-3 py-2 font-medium">Satıcı</th>
                <th className="px-3 py-2 text-right font-medium">Ciro</th>
                <th className="px-3 py-2 text-right font-medium">Tahsilat</th>
                <th className="px-3 py-2 text-right font-medium">Tahsilat %</th>
                <th className="px-3 py-2 text-right font-medium">Ort. İskonto</th>
                <th className="px-3 py-2 text-right font-medium">Doktor</th>
              </tr>
            </thead>
            <tbody>
              {sellers.length === 0 && (
                <EmptyRow colSpan={6} text="Satıcı yok." />
              )}
              {sellers.map((s) => (
                <tr key={s.sellerId} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2 font-medium text-slate-900">
                    {s.name}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatTRY(s.ciro)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatTRY(s.tahsilat)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    <span
                      className={
                        s.tahsilatOrani < 50 ? "text-red-600" : "text-slate-900"
                      }
                    >
                      %{s.tahsilatOrani}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                    %{s.ortalamaIskonto}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {s.doktorSayisi}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* FR-63: doktor ciro sıralaması */}
      <div className="mt-6">
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Doktor Ciro Sıralaması (ilk 25)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="px-3 py-2 font-medium">Doktor</th>
                  <th className="px-3 py-2 font-medium">Satıcı</th>
                  <th className="px-3 py-2 text-right font-medium">Ciro</th>
                </tr>
              </thead>
              <tbody>
                {doctors.length === 0 && (
                  <EmptyRow colSpan={3} text="Doktor yok." />
                )}
                {doctors.map((d) => (
                  <tr key={d.doctorId} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-2 font-medium text-slate-900">
                      {d.fullName}
                    </td>
                    <td className="px-3 py-2 text-slate-500">
                      {d.sellerName ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatTRY(d.ciro)}
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
