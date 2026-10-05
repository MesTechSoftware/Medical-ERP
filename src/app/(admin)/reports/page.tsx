import { requireAdmin } from "@/lib/session";
import { formatla } from "@/lib/money";
import {
  getCiroTotal,
  getDoctorReports,
  getSellerReports,
} from "@/lib/reports-service";
import { PageHeader, Card, StatCard, EmptyRow } from "@/components/ui";

/**
 * FR-62/FR-63/FR-60: Raporlar. KDV toggle'ı C6'da söküldü (GÇ-9, Ü-3 §(3)):
 * ciro daima KDV hariç (matrah), tahsilat daima KDV dahil (brüt); her
 * tutarın tabanı başlığında yazılıdır (Ü-3 §(6)/(7)).
 */
export default async function ReportsPage() {
  await requireAdmin();

  const [sellers, doctors, ciro] = await Promise.all([
    getSellerReports(),
    getDoctorReports(25),
    getCiroTotal(),
  ]);

  return (
    <div>
      <PageHeader
        title="Raporlar"
        description="Ciro ve performans"
      />

      {/* FR-60: kanal karşılaştırması C5'te söküldü (X-8) */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Toplam Ciro" value={formatla(ciro)} hint="KDV hariç" />
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
                <th className="px-3 py-2 text-right font-medium">Ciro (KDV hariç)</th>
                <th className="px-3 py-2 text-right font-medium">Tahsilat (KDV dahil)</th>
                <th className="px-3 py-2 text-right font-medium">Ort. İskonto</th>
                <th className="px-3 py-2 text-right font-medium">Doktor</th>
              </tr>
            </thead>
            <tbody>
              {sellers.length === 0 && (
                <EmptyRow colSpan={5} text="Satıcı yok." />
              )}
              {sellers.map((s) => (
                <tr key={s.sellerId} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2 font-medium text-slate-900">
                    {s.name}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatla(s.ciro)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatla(s.tahsilat)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                    {formatla(s.ortalamaIskonto, "oran")}
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
                  <th className="px-3 py-2 text-right font-medium">Ciro (KDV hariç)</th>
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
                      {formatla(d.ciro)}
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
