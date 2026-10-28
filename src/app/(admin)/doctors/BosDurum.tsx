import Link from "next/link";
import { Ikon } from "@/components/Ikon";
import { LinkButton } from "@/components/ui";
import { buton } from "@/components/stil";
import type { BosDurum as Tur } from "@/lib/doktor-listesi/suzgec";

const METIN: Record<Tur, { ikon: "yeni" | "onayla" | "filtrele"; baslik: string }> = {
  "hic-kayit": { ikon: "yeni", baslik: "Henüz cari yok." },
  sahipsiz: { ikon: "onayla", baslik: "Sahipsiz cari yok — tüm doktorlar bir satıcıya atanmış." },
  "eksik-fatura": { ikon: "onayla", baslik: "Fatura bilgisi eksik cari yok." },
  suzgecli: { ikon: "filtrele", baslik: "Bu süzgeçlere uyan cari bulunamadı." },
};

/** Liste boşken süzgece göre açıklama ve yönlendirme (spec Ü-18 §3.5). */
export function BosDurum({ tur, colSpan, yeniCari }: { tur: Tur; colSpan: number; yeniCari: boolean }) {
  const m = METIN[tur];
  return (
    <tr>
      <td colSpan={colSpan} className="py-10 text-center">
        <span className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-500">
          <Ikon ad={m.ikon} />
        </span>
        <p className="text-sm font-medium text-slate-700">{m.baslik}</p>
        {tur === "suzgecli" && (
          <Link href="/doctors" className={`${buton("metin")} mt-2`}>
            <Ikon ad="vazgec" />
            Süzgeçleri temizle
          </Link>
        )}
        {tur === "hic-kayit" && yeniCari && (
          <div className="mt-3">
            <LinkButton href="/doctors/new" ikon="yeni">
              Yeni Cari
            </LinkButton>
          </div>
        )}
      </td>
    </tr>
  );
}
