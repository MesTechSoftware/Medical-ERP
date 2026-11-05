import Link from "next/link";
import { Card } from "@/components/ui";
import { Ikon } from "@/components/Ikon";
import { BosDurum } from "@/components/liste/BosDurum";
import { EtkinSuzgecler } from "@/components/liste/EtkinSuzgecler";
import { AcilirPanel } from "@/components/liste/AcilirPanel";
import { SuzgecFormu } from "@/components/liste/SuzgecFormu";
import { KONTROL_TEK_SATIR, buton } from "@/components/stil";
import { Tutar } from "@/components/Tutar";
import { OranCubugu } from "@/components/grafik/BarMicro";
import { MATRAH, tabanli } from "@/lib/taban";
import type { SiraSatiri } from "@/lib/rapor-listesi/sorgu";
import { bosDurum, etkinSuzgecler, raporAdresi, type RaporSuzgeci } from "@/lib/rapor-listesi/suzgec";

const YOL = "/my-report";
const BAGLANTI = "text-link underline decoration-link/40 underline-offset-4 hover:decoration-link";

/**
 * Raporum'un doktor ciro sıralaması (spec Ü-33 §3.2): satıcının dönemde ciro yaptığı bütün carileri, sayfalı. Ciro
 * siparişin satıcısına yazılır (X-13) — devirle portföyden çıkmış carinin o satıcıyla yaptığı ciro da burada. Sıra ve
 * lidere oran satıcının kendi dönem sırasıdır. Ad, cari bugün de portföydeyse Doktorlarım panelini açar.
 */
export function CiroSiralamasi({
  satirlar,
  suzgec,
  per,
  saticiId,
}: {
  satirlar: SiraSatiri[];
  suzgec: RaporSuzgeci;
  per: number | undefined;
  saticiId: string;
}) {
  const etiketler = etkinSuzgecler(suzgec, () => undefined, YOL);
  const tur = bosDurum(suzgec);
  const temizle = raporAdresi({ ...suzgec, q: null }, {}, YOL);
  const uygulanan = raporAdresi(suzgec, {}, YOL);
  return (
    <Card>
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-start gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Doktorlarıma Göre Cirom</h2>
          <div className="ml-auto flex flex-wrap items-start gap-2">
            <AcilirPanel key={uygulanan} className="relative">
              <summary className={`${buton("ikincil")} cursor-pointer list-none`}>
                <Ikon ad="filtrele" />
                {etiketler.length > 0 ? `Filtrele · ${etiketler.length}` : "Filtrele"}
              </summary>
              <SuzgecFormu
                action={YOL}
                anahtar={uygulanan}
                aria-label="Rapor süzgeci"
                className="absolute right-0 z-20 mt-2 grid w-[min(24rem,calc(100vw-2rem))] gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-lg"
              >
                {suzgec.donem && <input type="hidden" name="donem" value={suzgec.donem} />}
                {per !== undefined && <input type="hidden" name="per" value={per} />}
                <div className="text-sm">
                  <label htmlFor="rapor-q" className="mb-1 block font-medium text-slate-700">
                    Ara
                  </label>
                  <input type="search" id="rapor-q" name="q" maxLength={100} placeholder="Doktor adı" defaultValue={suzgec.q ?? ""} className={KONTROL_TEK_SATIR} />
                </div>
                <div className="flex items-center gap-3">
                  <button type="submit" className={buton("birincil")}>
                    <Ikon ad="filtrele" />
                    Uygula
                  </button>
                  <Link href={temizle} scroll={false} className={buton("metin")}>
                    <Ikon ad="vazgec" />
                    Temizle
                  </Link>
                </div>
              </SuzgecFormu>
            </AcilirPanel>
          </div>
        </div>
        <EtkinSuzgecler etiketler={etiketler} />
      </div>
      <div className="tablo-kutusu">
        <table className="veri-tablosu" aria-label="Doktorlarıma göre cirom">
          <thead>
            <tr>
              <th className="sayi">#</th>
              <th>Doktor</th>
              <th className="sayi">{tabanli("Ciro", MATRAH)}</th>
              <th className="oncelik-dusuk">Lidere göre</th>
            </tr>
          </thead>
          <tbody>
            {satirlar.length === 0 && (
              <BosDurum
                colSpan={4}
                ikon="filtrele"
                baslik={tur === "suzgecli" ? "Bu aramaya uyan doktor yok." : "Bu dönemde cironuz yok."}
                temizleAdresi={tur === "suzgecli" ? temizle : undefined}
              />
            )}
            {satirlar.map((d) => (
              <tr key={d.doctorId}>
                <td className="sayi text-slate-500">{d.sira}</td>
                <td className="font-medium text-slate-900">
                  {d.sellerId === saticiId ? (
                    <Link href={`/my-doctors?detay=${d.doctorId}`} className={BAGLANTI}>
                      {d.fullName}
                    </Link>
                  ) : (
                    d.fullName
                  )}
                </td>
                <td className="sayi">
                  <Tutar deger={d.ciro} taban={MATRAH} baslikta />
                </td>
                <td className="oncelik-dusuk">
                  <OranCubugu oran={d.oran} className="w-24" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
