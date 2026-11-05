import Link from "next/link";
import { Card } from "@/components/ui";
import { Ikon } from "@/components/Ikon";
import { BosDurum } from "@/components/liste/BosDurum";
import { EtkinSuzgecler } from "@/components/liste/EtkinSuzgecler";
import { AcilirPanel } from "@/components/liste/AcilirPanel";
import { SuzgecFormu } from "@/components/liste/SuzgecFormu";
import { BAGLANTI, KONTROL_TEK_SATIR, buton } from "@/components/stil";
import { Tutar } from "@/components/Tutar";
import { OranCubugu } from "@/components/grafik/BarMicro";
import { MATRAH, tabanli } from "@/lib/taban";
import type { SiraSatiri } from "@/lib/rapor-listesi/sorgu";
import type { RaporSutunu } from "@/lib/rapor-listesi/sutunlar";
import { SAHIPSIZ, bosDurum, etkinSuzgecler, raporAdresi, type RaporSuzgeci } from "@/lib/rapor-listesi/suzgec";
import { SUZGEC_ETIKETI } from "@/components/liste/SuzgecAlani";

/**
 * Doktor ciro sıralaması (spec Ü-27 §3.2–3.3, X-1-2): dönemde cirolu bütün cariler, sayfalı. Sıra ve lidere göre
 * oran dönem sırasıdır; süzgeç (satıcı — carinin bugünkü sahibi —, metin) Filtrele panelindedir, dönem gizli alanla
 * korunur. Gizli sütun çizilmez.
 */
export function DoktorSiralamasi({
  satirlar,
  suzgec,
  per,
  saticilar,
  gizli,
  sutunMenusu,
}: {
  satirlar: SiraSatiri[];
  suzgec: RaporSuzgeci;
  per: number | undefined;
  saticilar: readonly { id: string; name: string; isActive: boolean }[];
  gizli: ReadonlySet<RaporSutunu>;
  sutunMenusu?: React.ReactNode;
}) {
  const etiketler = etkinSuzgecler(suzgec, (id) => saticilar.find((u) => u.id === id)?.name);
  const acik = (k: RaporSutunu) => !gizli.has(k);
  const tur = bosDurum(suzgec);
  const temizle = raporAdresi({ ...suzgec, satici: null, q: null });
  return (
    <Card>
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-start gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Doktor Ciro Sıralaması</h2>
          <div className="ml-auto flex flex-wrap items-start gap-2">
            <AcilirPanel key={raporAdresi(suzgec)} className="relative">
              <summary className={`${buton("ikincil")} cursor-pointer list-none`}>
                <Ikon ad="filtrele" />
                {etiketler.length > 0 ? `Filtrele · ${etiketler.length}` : "Filtrele"}
              </summary>
              <SuzgecFormu
                action="/reports"
                anahtar={raporAdresi(suzgec)}
                aria-label="Rapor süzgeci"
                className="absolute right-0 z-20 mt-2 grid w-[min(28rem,calc(100vw-2rem))] gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-lg"
              >
                {suzgec.donem && <input type="hidden" name="donem" value={suzgec.donem} />}
                {per !== undefined && <input type="hidden" name="per" value={per} />}
                <div className="text-sm">
                  <label htmlFor="rapor-satici" className={SUZGEC_ETIKETI}>
                    Satıcı (carinin sahibi)
                  </label>
                  <select id="rapor-satici" name="satici" defaultValue={suzgec.satici ?? ""} className={KONTROL_TEK_SATIR}>
                    <option value="">Tümü</option>
                    {saticilar.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.isActive ? u.name : `${u.name} · pasif`}
                      </option>
                    ))}
                    <option value={SAHIPSIZ}>Sahipsiz</option>
                  </select>
                </div>
                <div className="text-sm">
                  <label htmlFor="rapor-q" className={SUZGEC_ETIKETI}>
                    Ara
                  </label>
                  <input type="search" id="rapor-q" name="q" maxLength={100} placeholder="Cari adı" defaultValue={suzgec.q ?? ""} className={KONTROL_TEK_SATIR} />
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
            {sutunMenusu}
          </div>
        </div>
        <EtkinSuzgecler etiketler={etiketler} />
      </div>
      <div className="tablo-kutusu">
        <table className="veri-tablosu" aria-label="Doktor ciro sıralaması">
          <thead>
            <tr>
              <th className="sayi">#</th>
              <th>Cari</th>
              {acik("satici") && <th className="oncelik-dusuk">Satıcı</th>}
              <th className="sayi">{tabanli("Ciro", MATRAH)}</th>
              {acik("oran") && <th>Lidere göre</th>}
            </tr>
          </thead>
          <tbody>
            {satirlar.length === 0 && (
              <BosDurum
                colSpan={5 - gizli.size}
                ikon="filtrele"
                baslik={tur === "suzgecli" ? "Bu süzgeçlere uyan cari yok." : "Bu dönemde ciro yok."}
                temizleAdresi={tur === "suzgecli" ? temizle : undefined}
              />
            )}
            {satirlar.map((d) => (
              <tr key={d.doctorId}>
                <td className="sayi text-slate-500">{d.sira}</td>
                <td className="font-medium text-slate-900">
                  <Link href={`/doctors/${d.doctorId}`} className={BAGLANTI}>
                    {d.fullName}
                  </Link>
                </td>
                {acik("satici") && <td className="text-slate-500 oncelik-dusuk">{d.sellerName ?? "—"}</td>}
                <td className="sayi">
                  <Tutar deger={d.ciro} taban={MATRAH} baslikta />
                </td>
                {acik("oran") && (
                  <td>
                    <OranCubugu oran={d.oran} className="w-24" />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
