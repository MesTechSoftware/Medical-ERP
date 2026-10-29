import type { ReactNode } from "react";
import Link from "next/link";
import { Ikon } from "@/components/Ikon";
import { buton } from "@/components/stil";

/**
 * Liste boşken açıklama ve yönlendirme (spec Ü-18 §3.5, Ü-19 §3.5). `temizleAdresi` varsa
 * "Süzgeçleri temizle" bağlantısı, `eylem` varsa altında düğme çizilir.
 */
export function BosDurum({
  colSpan,
  ikon,
  baslik,
  temizleAdresi,
  eylem,
}: {
  colSpan: number;
  ikon: "yeni" | "onayla" | "filtrele";
  baslik: string;
  temizleAdresi?: string;
  eylem?: ReactNode;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-10 text-center">
        <span className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-500">
          <Ikon ad={ikon} />
        </span>
        <p className="text-sm font-medium text-slate-700">{baslik}</p>
        {temizleAdresi && (
          <Link href={temizleAdresi} className={`${buton("metin")} mt-2`}>
            <Ikon ad="vazgec" />
            Süzgeçleri temizle
          </Link>
        )}
        {eylem && <div className="mt-3">{eylem}</div>}
      </td>
    </tr>
  );
}
