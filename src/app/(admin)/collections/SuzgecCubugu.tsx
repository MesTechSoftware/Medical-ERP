import Link from "next/link";
import { Ikon } from "@/components/Ikon";
import { EtkinSuzgecler } from "@/components/liste/EtkinSuzgecler";
import { HizliSekmeler } from "@/components/liste/HizliSekmeler";
import { AcilirPanel } from "@/components/liste/AcilirPanel";
import { SuzgecFormu } from "@/components/liste/SuzgecFormu";
import { KONTROL_TEK_SATIR, buton } from "@/components/stil";
import {
  DURUM_ADI,
  TIPLER,
  TIP_ADI,
  etkinSekme,
  etkinSuzgecler,
  hizliSekmeler,
  sekmeAdresi,
  tahsilatAdresi,
  type TahsilatSuzgeci,
} from "@/lib/tahsilat-listesi/suzgec";
import { SuzgecAlani } from "@/components/liste/SuzgecAlani";

/**
 * Tahsilat ekranının süzgeç çubuğu (spec Ü-26 §3.3): tarih kısayolları, Filtrele paneli (GET formu; tarih,
 * durum, yöntem tipi, metin — sayfa boyu gizli alanla korunur), etkin süzgeç etiketleri, sütun menüsü yuvası.
 */
export function SuzgecCubugu({
  suzgec,
  bugun,
  per,
  sutunMenusu,
}: {
  suzgec: TahsilatSuzgeci;
  bugun: string;
  per: number | undefined;
  sutunMenusu?: React.ReactNode;
}) {
  const etiketler = etkinSuzgecler(suzgec);
  const sekmeler = hizliSekmeler(bugun);
  const etkin = etkinSekme(sekmeler, suzgec);
  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-start gap-2">
        <HizliSekmeler sekmeler={sekmeler.map((f) => ({ etiket: f.etiket, adres: sekmeAdresi(suzgec, f.tarih), etkin: f.etiket === etkin }))} />
        <div className="ml-auto flex flex-wrap items-start gap-2">
          <AcilirPanel key={tahsilatAdresi(suzgec)} className="relative">
            <summary className={`${buton("ikincil")} cursor-pointer list-none`}>
              <Ikon ad="filtrele" />
              {etiketler.length > 0 ? `Filtrele · ${etiketler.length}` : "Filtrele"}
            </summary>
            <SuzgecFormu
              action="/collections"
              anahtar={tahsilatAdresi(suzgec)}
              aria-label="Tahsilat süzgeci"
              className="absolute right-0 z-20 mt-2 grid w-[min(36rem,calc(100vw-2rem))] gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-lg sm:grid-cols-2"
            >
              {per !== undefined && <input type="hidden" name="per" value={per} />}
              <SuzgecAlani id="tahsilat-baslangic" etiket="Başlangıç">
                <input type="date" id="tahsilat-baslangic" name="baslangic" defaultValue={suzgec.baslangic ?? ""} className={KONTROL_TEK_SATIR} />
              </SuzgecAlani>
              <SuzgecAlani id="tahsilat-bitis" etiket="Bitiş">
                <input type="date" id="tahsilat-bitis" name="bitis" defaultValue={suzgec.bitis ?? ""} className={KONTROL_TEK_SATIR} />
              </SuzgecAlani>
              <SuzgecAlani id="tahsilat-durum" etiket="Durum">
                <select id="tahsilat-durum" name="durum" defaultValue={suzgec.durum === "aktif" ? "" : suzgec.durum} className={KONTROL_TEK_SATIR}>
                  <option value="">{DURUM_ADI.aktif}</option>
                  <option value="IPTAL">{DURUM_ADI.IPTAL}</option>
                  <option value="tumu">{DURUM_ADI.tumu}</option>
                </select>
              </SuzgecAlani>
              <SuzgecAlani id="tahsilat-tip" etiket="Yöntem">
                <select id="tahsilat-tip" name="tip" defaultValue={suzgec.tip ?? ""} className={KONTROL_TEK_SATIR}>
                  <option value="">Tümü</option>
                  {TIPLER.map((t) => (
                    <option key={t} value={t}>
                      {TIP_ADI[t]}
                    </option>
                  ))}
                </select>
              </SuzgecAlani>
              <div className="sm:col-span-2">
                <SuzgecAlani id="tahsilat-q" etiket="Ara">
                  <input
                    type="search"
                    id="tahsilat-q"
                    name="q"
                    maxLength={100}
                    placeholder="THS no, referans ya da cari"
                    defaultValue={suzgec.q ?? ""}
                    className={KONTROL_TEK_SATIR}
                  />
                </SuzgecAlani>
              </div>
              <div className="flex items-center gap-3 sm:col-span-2">
                <button type="submit" className={buton("birincil")}>
                  <Ikon ad="filtrele" />
                  Uygula
                </button>
                <Link href="/collections" scroll={false} className={buton("metin")}>
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
