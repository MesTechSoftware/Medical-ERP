import { Ikon } from "@/components/Ikon";
import { AcilirPanel } from "@/components/liste/AcilirPanel";
import { buton } from "@/components/stil";
import { sutunlariKaydet } from "@/lib/liste/sutun-eylemi";
import { SUTUN_LISTELERI, type SutunAnahtari, type SutunluListe } from "@/lib/liste/sutun-listeleri";
import { SUZGEC_ETIKETI } from "@/components/liste/SuzgecAlani";

/**
 * Liste ekranlarının sütun seçici menüsü (spec Ü-18 §3.4, Ü-19 §3.4): JS'siz form. Sütunlar ekranın
 * kaydındandır (`SUTUN_LISTELERI`); kayıtta olmayan sütun (ör. ad) gizlenemez. Tercih çereze yazılır, `donus`a
 * yönlendirilir.
 */
export function SutunSecici<L extends SutunluListe>({
  liste,
  gizli,
  donus,
}: {
  liste: L;
  gizli: ReadonlySet<SutunAnahtari<L>>;
  donus: string;
}) {
  const sutunlar: readonly { anahtar: string; baslik: string }[] = SUTUN_LISTELERI[liste].sutunlar;
  const gizliler: ReadonlySet<string> = gizli;
  return (
    // Kaydedince menü yeni tercihle, liste adresi (süzgeç, sayfa, ayrıntı) değişince kapalı yeniden kurulur (yumuşak gezinme).
    <AcilirPanel key={`${[...gizliler].join(",")}#${donus}`} className="relative">
      <summary className={`${buton("ikincil")} cursor-pointer list-none`}>
        <Ikon ad="duzenle" />
        Sütunlar
      </summary>
      <form
        action={sutunlariKaydet}
        aria-label="Görünür sütunlar"
        className="absolute right-0 z-20 mt-2 w-60 space-y-2 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-lg"
      >
        <input type="hidden" name="liste" value={liste} />
        <input type="hidden" name="donus" value={donus} />
        <fieldset className="space-y-1">
          <legend className={SUZGEC_ETIKETI}>Görünür sütunlar</legend>
          {sutunlar.map((s) => (
            <label key={s.anahtar} className="flex items-center gap-2 py-0.5 text-slate-700">
              <input type="checkbox" name="gorunur" value={s.anahtar} defaultChecked={!gizliler.has(s.anahtar)} />
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
