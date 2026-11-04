import Link from "next/link";
import { Ikon } from "@/components/Ikon";
import { EtkinSuzgecler } from "@/components/liste/EtkinSuzgecler";
import { HizliSekmeler } from "@/components/liste/HizliSekmeler";
import { AcilirPanel } from "@/components/liste/AcilirPanel";
import { SuzgecFormu } from "@/components/liste/SuzgecFormu";
import { KONTROL_TEK_SATIR, buton } from "@/components/stil";
import { VERI_TIPI_ADI } from "@/lib/ice-aktarim/adlar";
import { durumSekmeleri, etkinSuzgecler, partiAdresi, type PartiSuzgeci } from "@/lib/ice-aktarim-listesi/suzgec";

const ETIKET = "mb-1 block font-medium text-slate-700";

function Alan({ id, etiket, children }: { id: string; etiket: string; children: React.ReactNode }) {
  return (
    <div className="text-sm">
      <label htmlFor={id} className={ETIKET}>
        {etiket}
      </label>
      {children}
    </div>
  );
}

/**
 * İçe aktarım partilerinin süzgeç çubuğu (spec Ü-30 §3.2): durum sekmeleri, Filtrele paneli (GET formu; tür, tarih,
 * metin — durum ve sayfa boyu gizli alanla korunur), etkin süzgeç etiketleri, sütun menüsü yuvası.
 */
export function SuzgecCubugu({ suzgec, per, sutunMenusu }: { suzgec: PartiSuzgeci; per: number | undefined; sutunMenusu?: React.ReactNode }) {
  const etiketler = etkinSuzgecler(suzgec);
  const paneldekiler = etiketler.filter((e) => e.anahtar !== "durum").length;
  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-start gap-2">
        <HizliSekmeler sekmeler={durumSekmeleri(suzgec)} />
        <div className="ml-auto flex flex-wrap items-start gap-2">
          <AcilirPanel key={partiAdresi(suzgec)} className="relative">
            <summary className={`${buton("ikincil")} cursor-pointer list-none`}>
              <Ikon ad="filtrele" />
              {paneldekiler > 0 ? `Filtrele · ${paneldekiler}` : "Filtrele"}
            </summary>
            <SuzgecFormu
              action="/imports"
              anahtar={partiAdresi(suzgec)}
              aria-label="Parti süzgeci"
              className="absolute right-0 z-20 mt-2 grid w-[min(36rem,calc(100vw-2rem))] gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-lg sm:grid-cols-2"
            >
              {suzgec.durum !== "tumu" && <input type="hidden" name="durum" value={suzgec.durum} />}
              {per !== undefined && <input type="hidden" name="per" value={per} />}
              <Alan id="parti-tur" etiket="Tür">
                <select id="parti-tur" name="tur" defaultValue={suzgec.tur ?? ""} className={KONTROL_TEK_SATIR}>
                  <option value="">Tümü</option>
                  {Object.entries(VERI_TIPI_ADI).map(([kod, ad]) => (
                    <option key={kod} value={kod}>
                      {ad}
                    </option>
                  ))}
                </select>
              </Alan>
              <Alan id="parti-q" etiket="Ara">
                <input type="search" id="parti-q" name="q" maxLength={100} placeholder="Parti no ya da dosya adı" defaultValue={suzgec.q ?? ""} className={KONTROL_TEK_SATIR} />
              </Alan>
              <Alan id="parti-baslangic" etiket="Başlangıç">
                <input type="date" id="parti-baslangic" name="baslangic" defaultValue={suzgec.baslangic ?? ""} className={KONTROL_TEK_SATIR} />
              </Alan>
              <Alan id="parti-bitis" etiket="Bitiş">
                <input type="date" id="parti-bitis" name="bitis" defaultValue={suzgec.bitis ?? ""} className={KONTROL_TEK_SATIR} />
              </Alan>
              <div className="flex items-center gap-3 sm:col-span-2">
                <button type="submit" className={buton("birincil")}>
                  <Ikon ad="filtrele" />
                  Uygula
                </button>
                <Link href="/imports" scroll={false} className={buton("metin")}>
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
  );
}
