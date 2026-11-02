import { Ikon } from "@/components/Ikon";
import { AcilirPanel } from "@/components/liste/AcilirPanel";
import { buton } from "@/components/stil";
import type { SutunTanimi } from "@/lib/liste/sutunlar";

/**
 * Liste ekranlarının sütun seçici menüsü (spec Ü-18 §3.4, Ü-19 §3.4): JS'siz form. Listede olmayan
 * sütun (ör. ad) gizlenemez; `action` tercihi çereze yazıp `donus`a yönlendirir.
 */
export function SutunSecici<K extends string>({
  sutunlar,
  gizli,
  action,
  donus,
}: {
  sutunlar: readonly SutunTanimi<K>[];
  gizli: ReadonlySet<K>;
  action: (fd: FormData) => Promise<void>;
  donus: string;
}) {
  return (
    // Kaydedince menü yeni tercihle, süzgeç dışarıdan değişince yeni adresle yeniden kurulur (yumuşak gezinme).
    <AcilirPanel key={`${[...gizli].join(",")}#${donus}`} className="relative">
      <summary className={`${buton("ikincil")} cursor-pointer list-none`}>
        <Ikon ad="duzenle" />
        Sütunlar
      </summary>
      <form
        action={action}
        aria-label="Görünür sütunlar"
        className="absolute right-0 z-20 mt-2 w-60 space-y-2 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-lg"
      >
        <input type="hidden" name="donus" value={donus} />
        <fieldset className="space-y-1">
          <legend className="mb-1 font-medium text-slate-700">Görünür sütunlar</legend>
          {sutunlar.map((s) => (
            <label key={s.anahtar} className="flex items-center gap-2 py-0.5 text-slate-700">
              <input type="checkbox" name="gorunur" value={s.anahtar} defaultChecked={!gizli.has(s.anahtar)} />
              {s.baslik}
            </label>
          ))}
        </fieldset>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button type="submit" className={buton("birincil")}>
            <Ikon ad="kaydet" />
            Kaydet
          </button>
          <button type="submit" name="islem" value="varsayilan" className={buton("metin")}>
            <Ikon ad="cevir" />
            Varsayılana dön
          </button>
        </div>
      </form>
    </AcilirPanel>
  );
}
