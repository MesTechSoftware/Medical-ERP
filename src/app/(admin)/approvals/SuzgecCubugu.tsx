import Link from "next/link";
import { Ikon } from "@/components/Ikon";
import { EtkinSuzgecler } from "@/components/liste/EtkinSuzgecler";
import { HizliSekmeler } from "@/components/liste/HizliSekmeler";
import { AcilirPanel } from "@/components/liste/AcilirPanel";
import { SuzgecFormu } from "@/components/liste/SuzgecFormu";
import { KONTROL_TEK_SATIR, buton } from "@/components/stil";
import { durumSekmeleri, etkinSuzgecler, onayAdresi, type OnaySuzgeci } from "@/lib/onay-listesi/suzgec";
import { BLOK_KURAL_ADI } from "@/lib/sozluk";

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
 * Onay ekranının süzgeç çubuğu (spec Ü-25 §3.3): durum sekmeleri, Filtrele paneli (GET formu; olay günü, kural,
 * açan, metin — durum, `eski` ve sayfa boyu gizli alanla korunur), etkin süzgeç etiketleri, sütun menüsü yuvası.
 */
export function SuzgecCubugu({
  suzgec,
  per,
  kullanicilar,
  sutunMenusu,
}: {
  suzgec: OnaySuzgeci;
  per: number | undefined;
  kullanicilar: readonly { id: string; name: string; isActive: boolean }[];
  sutunMenusu?: React.ReactNode;
}) {
  const etiketler = etkinSuzgecler(suzgec, (id) => kullanicilar.find((u) => u.id === id)?.name);
  const paneldekiler = etiketler.filter((e) => e.anahtar !== "durum" && e.anahtar !== "eski").length;
  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-start gap-2">
        <HizliSekmeler sekmeler={durumSekmeleri(suzgec)} />
        <div className="ml-auto flex flex-wrap items-start gap-2">
          <AcilirPanel key={onayAdresi(suzgec)} className="relative">
            <summary className={`${buton("ikincil")} cursor-pointer list-none`}>
              <Ikon ad="filtrele" />
              {paneldekiler > 0 ? `Filtrele · ${paneldekiler}` : "Filtrele"}
            </summary>
            <SuzgecFormu
              action="/approvals"
              anahtar={onayAdresi(suzgec)}
              aria-label="Onay süzgeci"
              className="absolute right-0 z-20 mt-2 grid w-[min(36rem,calc(100vw-2rem))] gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-lg sm:grid-cols-2"
            >
              {suzgec.durum !== "bekleyen" && <input type="hidden" name="durum" value={suzgec.durum} />}
              {suzgec.eski && <input type="hidden" name="eski" value="1" />}
              {per !== undefined && <input type="hidden" name="per" value={per} />}
              <Alan id="onay-baslangic" etiket="Başlangıç (olay günü)">
                <input type="date" id="onay-baslangic" name="baslangic" defaultValue={suzgec.baslangic ?? ""} className={KONTROL_TEK_SATIR} />
              </Alan>
              <Alan id="onay-bitis" etiket="Bitiş">
                <input type="date" id="onay-bitis" name="bitis" defaultValue={suzgec.bitis ?? ""} className={KONTROL_TEK_SATIR} />
              </Alan>
              <Alan id="onay-kural" etiket="Kural">
                <select id="onay-kural" name="kural" defaultValue={suzgec.kural ?? ""} className={KONTROL_TEK_SATIR}>
                  <option value="">Tümü</option>
                  {(Object.keys(BLOK_KURAL_ADI) as (keyof typeof BLOK_KURAL_ADI)[]).map((k) => (
                    <option key={k} value={k}>
                      {BLOK_KURAL_ADI[k]}
                    </option>
                  ))}
                </select>
              </Alan>
              <Alan id="onay-acan" etiket="Açan">
                <select id="onay-acan" name="acan" defaultValue={suzgec.acan ?? ""} className={KONTROL_TEK_SATIR}>
                  <option value="">Tümü</option>
                  {kullanicilar.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.isActive ? u.name : `${u.name} · pasif`}
                    </option>
                  ))}
                </select>
              </Alan>
              <div className="sm:col-span-2">
                <Alan id="onay-q" etiket="Ara">
                  <input type="search" id="onay-q" name="q" maxLength={100} placeholder="Belge no ya da cari" defaultValue={suzgec.q ?? ""} className={KONTROL_TEK_SATIR} />
                </Alan>
              </div>
              <div className="flex items-center gap-3 sm:col-span-2">
                <button type="submit" className={buton("birincil")}>
                  <Ikon ad="filtrele" />
                  Uygula
                </button>
                <Link href="/approvals" scroll={false} className={buton("metin")}>
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
