import Link from "next/link";
import { Ikon } from "@/components/Ikon";
import { EtkinSuzgecler } from "@/components/liste/EtkinSuzgecler";
import { HizliSekmeler } from "@/components/liste/HizliSekmeler";
import { AcilirPanel } from "@/components/liste/AcilirPanel";
import { SuzgecFormu } from "@/components/liste/SuzgecFormu";
import { KONTROL_TEK_SATIR, buton } from "@/components/stil";
import {
  DURUM_ETIKETI,
  etkinSekme,
  etkinSuzgecler,
  FIRMASIZ,
  hizliSekmeler,
  kargoAdresi,
  sekmeAdresi,
  type KargoSuzgeci,
} from "@/lib/kargo-listesi/suzgec";
import { SuzgecAlani } from "@/components/liste/SuzgecAlani";

/**
 * Sevkiyat listesinin süzgeç çubuğu (spec Ü-24 §3.5): tarih kısayolları, Filtrele paneli (GET formu; tarih,
 * firma, durum, metin — sayfa boyu gizli alanla korunur), etkin süzgeç etiketleri, sütun menüsünün yuvası.
 */
export function SuzgecCubugu({
  suzgec,
  bugun,
  per,
  firmalar,
  sutunMenusu,
}: {
  suzgec: KargoSuzgeci;
  bugun: string;
  per: number | undefined;
  firmalar: readonly { id: string; name: string; isActive: boolean }[];
  sutunMenusu?: React.ReactNode;
}) {
  const etiketler = etkinSuzgecler(suzgec, (id) => firmalar.find((f) => f.id === id)?.name);
  const sekmeler = hizliSekmeler(bugun);
  const etkin = etkinSekme(sekmeler, suzgec);
  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-start gap-2">
        <HizliSekmeler sekmeler={sekmeler.map((f) => ({ etiket: f.etiket, adres: sekmeAdresi(suzgec, f.tarih), etkin: f.etiket === etkin }))} />
        <div className="ml-auto flex flex-wrap items-start gap-2">
          <AcilirPanel key={kargoAdresi(suzgec)} className="relative">
            <summary className={`${buton("ikincil")} cursor-pointer list-none`}>
              <Ikon ad="filtrele" />
              {etiketler.length > 0 ? `Filtrele · ${etiketler.length}` : "Filtrele"}
            </summary>
            <SuzgecFormu
              action="/shipping"
              anahtar={kargoAdresi(suzgec)}
              aria-label="Sevkiyat süzgeci"
              className="absolute right-0 z-20 mt-2 grid w-[min(36rem,calc(100vw-2rem))] gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-lg sm:grid-cols-2"
            >
              {per !== undefined && <input type="hidden" name="per" value={per} />}
              <SuzgecAlani id="sevk-baslangic" etiket="Başlangıç">
                <input type="date" id="sevk-baslangic" name="baslangic" defaultValue={suzgec.baslangic ?? ""} className={KONTROL_TEK_SATIR} />
              </SuzgecAlani>
              <SuzgecAlani id="sevk-bitis" etiket="Bitiş">
                <input type="date" id="sevk-bitis" name="bitis" defaultValue={suzgec.bitis ?? ""} className={KONTROL_TEK_SATIR} />
              </SuzgecAlani>
              <SuzgecAlani id="sevk-firma" etiket="Firma">
                <select id="sevk-firma" name="firma" defaultValue={suzgec.firma ?? ""} className={KONTROL_TEK_SATIR}>
                  <option value="">Tümü</option>
                  {firmalar.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.isActive ? f.name : `${f.name} · pasif`}
                    </option>
                  ))}
                  <option value={FIRMASIZ}>Firmasız</option>
                </select>
              </SuzgecAlani>
              <SuzgecAlani id="sevk-durum" etiket="Durum">
                <select id="sevk-durum" name="durum" defaultValue={suzgec.durum ?? ""} className={KONTROL_TEK_SATIR}>
                  <option value="">Tümü</option>
                  {(Object.keys(DURUM_ETIKETI) as (keyof typeof DURUM_ETIKETI)[]).map((d) => (
                    <option key={d} value={d}>
                      {DURUM_ETIKETI[d]}
                    </option>
                  ))}
                </select>
              </SuzgecAlani>
              <div className="sm:col-span-2">
                <SuzgecAlani id="sevk-q" etiket="Ara">
                  <input
                    type="search"
                    id="sevk-q"
                    name="q"
                    maxLength={100}
                    placeholder="SVK no, takip no, irsaliye ya da cari"
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
                <Link href="/shipping" scroll={false} className={buton("metin")}>
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
