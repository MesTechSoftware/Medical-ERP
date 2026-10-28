import { Ikon } from "@/components/Ikon";
import { buton } from "@/components/stil";
import { SUTUNLAR, type SutunAnahtari } from "@/lib/doktor-listesi/sutunlar";
import { sutunlariKaydet } from "./sutunEylemi";

/** Sütun seçici menüsü (spec Ü-18 §3.4): JS'siz form; Ad Soyad listede yoktur, gizlenemez. */
export function SutunSecici({ gizli, donus }: { gizli: ReadonlySet<SutunAnahtari>; donus: string }) {
  return (
    <details className="relative">
      <summary className={`${buton("ikincil")} cursor-pointer list-none`}>
        <Ikon ad="duzenle" />
        Sütunlar
      </summary>
      <form
        action={sutunlariKaydet}
        aria-label="Görünür sütunlar"
        className="absolute right-0 z-20 mt-2 w-60 space-y-2 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-lg"
      >
        <input type="hidden" name="donus" value={donus} />
        <fieldset className="space-y-1">
          <legend className="mb-1 font-medium text-slate-700">Görünür sütunlar</legend>
          {SUTUNLAR.map((s) => (
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
    </details>
  );
}
