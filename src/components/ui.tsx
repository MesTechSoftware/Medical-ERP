import Link from "next/link";

/** Sayfa başlığı + opsiyonel sağ aksiyon alanı. */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/** Birincil buton görünümlü Link. */
export function LinkButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
    >
      {children}
    </Link>
  );
}

/** Kart/panel sarmalayıcı. */
export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {children}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  // Sipariş durumları
  BEKLIYOR: "bg-amber-100 text-amber-800",
  HAZIRLANIYOR: "bg-blue-100 text-blue-800",
  KARGOLANDI: "bg-indigo-100 text-indigo-800",
  TESLIM_EDILDI: "bg-green-100 text-green-800",
  IPTAL: "bg-red-100 text-red-700",
  // Aktif/pasif
  AKTIF: "bg-green-100 text-green-800",
  PASIF: "bg-slate-200 text-slate-600",
};

const STATUS_LABELS: Record<string, string> = {
  BEKLIYOR: "Bekliyor",
  HAZIRLANIYOR: "Hazırlanıyor",
  KARGOLANDI: "Kargolandı",
  TESLIM_EDILDI: "Teslim Edildi",
  IPTAL: "İptal Edildi",
  AKTIF: "Aktif",
  PASIF: "Pasif",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium " +
        (STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600")
      }
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

/** Özet istatistik kartı (dashboard ve cari ekranları için). */
export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "default" | "danger" | "success";
}) {
  const valueColor =
    tone === "danger"
      ? "text-red-600"
      : tone === "success"
        ? "text-green-600"
        : "text-slate-900";
  return (
    <div role="group" aria-label={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase text-slate-500">{label}</div>
      <div className={"mt-1 text-2xl font-semibold tabular-nums " + valueColor}>
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </div>
  );
}

/** Boş durum mesajı (tablo altı). */
export function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="py-8 text-center text-sm text-slate-400"
      >
        {text}
      </td>
    </tr>
  );
}
