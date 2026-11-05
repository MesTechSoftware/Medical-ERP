import { formatDate } from "@/lib/format";
import { bugun } from "@/lib/zaman";

const GUN_MS = 86_400_000;

/** İstanbul günü farkı (E-1). */
function kacGunOnce(son: Date, an: Date): string {
  const gun = Math.round((bugun(an).getTime() - bugun(son).getTime()) / GUN_MS);
  return gun <= 0 ? "bugün" : `${gun} gün önce`;
}

/** Cari listelerinin "Son Sipariş" hücresi (Doktorlar, Doktorlarım): tarih ve kaç gün önce; sayılan sipariş yoksa "—". */
export function SonSiparisHucresi({ son, an }: { son: Date | null; an: Date }) {
  return (
    <td className="whitespace-nowrap oncelik-dusuk">
      {son ? (
        <>
          <span className="tabular-nums text-slate-700">{formatDate(son)}</span>
          <span className="block text-xs text-slate-500">{kacGunOnce(son, an)}</span>
        </>
      ) : (
        <span className="text-slate-400">—</span>
      )}
    </td>
  );
}
