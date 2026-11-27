import { StatusChip } from "@/components/ui";
import { ADIMLAR, cizelgeEsle, type CizelgeGirdisi } from "@/components/siparis/durum-cizelgesi";

/** Sipariş durum çizelgesi (spec §5). Açık onay bloğu varsa gerekçe/kural göstermeyen sade şerit eklenir. */
export function DurumCizelgesi({ onayBekliyor, ...girdi }: CizelgeGirdisi & { onayBekliyor?: boolean }) {
  const c = cizelgeEsle(girdi);
  return (
    <div data-durum-cizelgesi className="space-y-2">
      {c.tur === "teklif" && <StatusChip ton="notr">Teklif</StatusChip>}
      {c.tur === "iptal" && <StatusChip ton="hata">İptal Edildi</StatusChip>}
      {c.tur === "adimlar" && (
        <>
          <ol className="flex flex-wrap items-center gap-2 text-xs">
            {ADIMLAR.map((a, i) => (
              <li key={a} aria-current={i === c.etkin ? "step" : undefined}>
                <StatusChip ton={i < c.etkin ? "olumlu" : i === c.etkin ? "uyari" : "notr"}>
                  {i + 1}. {a}
                </StatusChip>
              </li>
            ))}
          </ol>
          {c.not && <p className="text-xs text-slate-500">{c.not}</p>}
        </>
      )}
      {onayBekliyor && (
        <p data-onay-seridi className="rounded bg-slate-100 px-3 py-2 text-xs text-slate-700">
          Merkez onayı bekleniyor
        </p>
      )}
    </div>
  );
}
