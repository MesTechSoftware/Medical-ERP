import Link from "next/link";
import { Ikon, type IkonAdi } from "@/components/Ikon";
import { buton } from "@/components/stil";

/**
 * Sayfa başlığı + opsiyonel sağ aksiyon alanı. Telefonda (md altı) başlık satırı kontrol
 * yüksekliğindedir ve aksiyonla paylaşılır, açıklama tam genişliktedir: ikonlu aksiyon açıklamayı
 * daraltıp sardırmaz, başlık yüksekliği aksiyonun varlığından bağımsızdır (iskelet eşleşmesi).
 */
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
    <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 md:flex md:items-start md:justify-between md:gap-4">
      <div className="contents md:block md:min-w-0">
        <h1 className="flex min-h-(--control-h) items-center text-xl font-semibold text-slate-900 md:block md:min-h-0">
          {title}
        </h1>
        {description && (
          <p className="col-span-2 mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>
      {/* Aksiyon daralmaz, başlık sarar: dokunmatikteki min-w-11 esnek öğenin içerik
          genişliği korumasını kaldırır, tek satırlık buton metni taşardı. */}
      {action && <div className="col-start-2 row-start-1 shrink-0">{action}</div>}
    </div>
  );
}

/** Birincil buton görünümlü Link. */
export function LinkButton({
  href,
  ikon,
  children,
}: {
  href: string;
  ikon: IkonAdi;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={buton("birincil")}
    >
      <Ikon ad={ikon} />
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

/** Semantik ton (ADR-009). Bilgi mavisi etikette yoktur — mavi bağlantılara ayrılmıştır. */
export type Ton = "notr" | "olumlu" | "uyari" | "hata";

const TON_SINIFI: Record<Ton, string> = {
  notr: "bg-neutral-bg text-neutral",
  olumlu: "bg-positive-bg text-positive",
  uyari: "bg-critical-bg text-critical",
  hata: "bg-negative-bg text-negative",
};

/** Durum etiketi: kısa metin + semantik renk. Renk tek başına bilgi taşımaz, metin daima yazılır. */
export function StatusChip({ ton, children }: { ton: Ton; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${TON_SINIFI[ton]}`}
    >
      {children}
    </span>
  );
}

/** Sipariş ve aktif/pasif durumları: yalnız anlam taşıyan durum renklenir, süreç adımları nötrdür. */
const DURUMLAR: Record<string, { ton: Ton; etiket: string }> = {
  BEKLIYOR: { ton: "uyari", etiket: "Bekliyor" },
  HAZIRLANIYOR: { ton: "notr", etiket: "Hazırlanıyor" },
  KARGOLANDI: { ton: "notr", etiket: "Kargolandı" },
  TESLIM_EDILDI: { ton: "olumlu", etiket: "Teslim Edildi" },
  IPTAL: { ton: "hata", etiket: "İptal Edildi" },
  AKTIF: { ton: "olumlu", etiket: "Aktif" },
  PASIF: { ton: "notr", etiket: "Pasif" },
};

export function StatusBadge({ status }: { status: string }) {
  const durum = DURUMLAR[status];
  return <StatusChip ton={durum?.ton ?? "notr"}>{durum?.etiket ?? status}</StatusChip>;
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
  tone?: "default" | "danger" | "warning" | "success";
}) {
  const valueColor =
    tone === "danger"
      ? "text-negative"
      : tone === "warning"
        ? "text-critical"
        : tone === "success"
          ? "text-positive"
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
