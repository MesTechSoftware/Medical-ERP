import { Ikon } from "@/components/Ikon";
import type { AlanFarki } from "@/lib/denetim/fark";
import { MASKE } from "@/lib/denetim/maske";
import { alanEtiketi, degerMetni } from "@/lib/denetim/ozet";

/**
 * Alan bazlı fark (KARARLAR X-18 §(9)), GitHub tarzı: alan başına eski değer kırmızı ve üstü çizili,
 * yeni değer yeşil. Ekleme ve silmede yalnız bir taraf vardır. Maskeli değer "gizli" notu taşır.
 */
export function DegisiklikListesi({ farklar }: { farklar: readonly AlanFarki[] }) {
  if (farklar.length === 0) return <p className="text-sm text-slate-500">Alan değişikliği yok.</p>;
  return (
    <ul aria-label="Alan değişiklikleri" className="divide-y divide-slate-100 rounded-lg border border-slate-200">
      {farklar.map((f) => (
        <li key={f.alan} className="px-3 py-2 text-sm">
          <p className="font-medium text-slate-700">
            {alanEtiketi(f.alan)}
            {(f.eski === MASKE || f.yeni === MASKE) && <span className="ml-2 text-xs font-normal text-slate-500">gizli</span>}
          </p>
          {f.eski !== undefined && (
            <p className="mt-1 flex items-start gap-1.5 rounded bg-negative-bg px-2 py-1 text-negative">
              <Ikon ad="eksi" />
              <span className="sr-only">Eski değer:</span>
              <del className="min-w-0 break-words">{degerMetni(f.alan, f.eski)}</del>
            </p>
          )}
          {f.yeni !== undefined && (
            <p className="mt-1 flex items-start gap-1.5 rounded bg-positive-bg px-2 py-1 text-positive">
              <Ikon ad="yeni" />
              <span className="sr-only">Yeni değer:</span>
              <ins className="min-w-0 break-words no-underline">{degerMetni(f.alan, f.yeni)}</ins>
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
