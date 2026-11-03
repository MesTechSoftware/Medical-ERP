import Link from "next/link";
import { Ikon } from "@/components/Ikon";
import { EtkinSuzgecler } from "@/components/liste/EtkinSuzgecler";
import { HizliSekmeler } from "@/components/liste/HizliSekmeler";
import { AcilirPanel } from "@/components/liste/AcilirPanel";
import { SuzgecFormu } from "@/components/liste/SuzgecFormu";
import { KONTROL_TEK_SATIR, buton } from "@/components/stil";
import { etkinSuzgecler, hizliSekmeler, SATICISIZ, siparisAdresi, type SiparisSuzgeci } from "@/lib/siparis-listesi/suzgec";

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
 * Sipariş listesinin süzgeç çubuğu (spec Ü-23 §3.3): durum sekmeleri, Filtrele paneli (GET formu; tarih,
 * satıcı, metin — durum ve sayfa boyu gizli alanla korunur), etkin süzgeç etiketleri, sütun menüsü yuvası.
 */
export function SuzgecCubugu({
  suzgec,
  per,
  saticilar,
  sutunMenusu,
}: {
  suzgec: SiparisSuzgeci;
  per: string | undefined;
  saticilar: readonly { id: string; name: string; isActive: boolean }[];
  sutunMenusu?: React.ReactNode;
}) {
  const etiketler = etkinSuzgecler(suzgec, (id) => saticilar.find((s) => s.id === id)?.name);
  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-start gap-2">
        <HizliSekmeler sekmeler={hizliSekmeler(suzgec)} />
        <div className="ml-auto flex flex-wrap items-start gap-2">
          {/* Uygulanan süzgeç değişince panel kapalı, form yeni değerlerle kurulur. */}
          <AcilirPanel key={siparisAdresi(suzgec)} className="relative">
            <summary className={`${buton("ikincil")} cursor-pointer list-none`}>
              <Ikon ad="filtrele" />
              {etiketler.length > 0 ? `Filtrele · ${etiketler.length}` : "Filtrele"}
            </summary>
            <SuzgecFormu
              action="/orders"
              anahtar={siparisAdresi(suzgec)}
              aria-label="Sipariş süzgeci"
              className="absolute right-0 z-20 mt-2 grid w-[min(36rem,calc(100vw-2rem))] gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-lg sm:grid-cols-2"
            >
              {suzgec.durum && <input type="hidden" name="durum" value={suzgec.durum} />}
              {per && <input type="hidden" name="per" value={per} />}
              <Alan id="suzgec-baslangic" etiket="Başlangıç">
                <input type="date" id="suzgec-baslangic" name="baslangic" defaultValue={suzgec.baslangic ?? ""} className={KONTROL_TEK_SATIR} />
              </Alan>
              <Alan id="suzgec-bitis" etiket="Bitiş">
                <input type="date" id="suzgec-bitis" name="bitis" defaultValue={suzgec.bitis ?? ""} className={KONTROL_TEK_SATIR} />
              </Alan>
              <Alan id="suzgec-satici" etiket="Satıcı">
                <select id="suzgec-satici" name="satici" defaultValue={suzgec.satici ?? ""} className={KONTROL_TEK_SATIR}>
                  <option value="">Tümü</option>
                  {saticilar.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.isActive ? s.name : `${s.name} · pasif`}
                    </option>
                  ))}
                  <option value={SATICISIZ}>Satıcısız (bayi)</option>
                </select>
              </Alan>
              <Alan id="suzgec-q" etiket="Ara">
                <input
                  type="search"
                  id="suzgec-q"
                  name="q"
                  maxLength={100}
                  placeholder="Belge no, cari ya da klinik"
                  defaultValue={suzgec.q ?? ""}
                  className={KONTROL_TEK_SATIR}
                />
              </Alan>
              <div className="flex items-center gap-3 sm:col-span-2">
                <button type="submit" className={buton("birincil")}>
                  <Ikon ad="filtrele" />
                  Uygula
                </button>
                <Link href="/orders" scroll={false} className={buton("metin")}>
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
