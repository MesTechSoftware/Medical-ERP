import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { AUDIT_ACTION_LABELS } from "@/lib/audit";
import { formatDateTime } from "@/lib/format";
import { PageHeader, Card, EmptyRow } from "@/components/ui";

const ENTITY_TYPES = ["Product", "Order", "Payment", "Seller", "Auth"] as const;

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ entityType?: string; action?: string }>;
}) {
  await requireAdmin();
  const { entityType, action } = await searchParams;

  const where: { entityType?: string; action?: string } = {};
  if (entityType) where.entityType = entityType;
  if (action) where.action = action;

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { actor: { select: { name: true, email: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Audit Log"
        description="Kritik işlemlerin denetim kaydı (son 100). Salt okunur."
      />

      {/* Filtre (GET form) */}
      <form
        method="get"
        className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Entity</span>
          <select
            name="entityType"
            defaultValue={entityType ?? ""}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Tümü</option>
            {ENTITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">İşlem</span>
          <select
            name="action"
            defaultValue={action ?? ""}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Tümü</option>
            {Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Filtrele
        </button>
        <a
          href="/audit-logs"
          className="text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          Temizle
        </a>
      </form>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                <th className="px-4 py-2 font-medium">Tarih</th>
                <th className="px-4 py-2 font-medium">Kullanıcı</th>
                <th className="px-4 py-2 font-medium">İşlem</th>
                <th className="px-4 py-2 font-medium">Entity</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <EmptyRow colSpan={4} text="Kayıt bulunamadı." />
              )}
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                    {formatDateTime(log.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-slate-900">
                    {log.actor?.name ?? (
                      <span className="text-slate-400">sistem / anonim</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {AUDIT_ACTION_LABELS[log.action] ?? log.action}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {log.entityType}
                    {log.entityId && (
                      <span className="ml-1 text-xs text-slate-400">
                        · {log.entityId.slice(0, 8)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
