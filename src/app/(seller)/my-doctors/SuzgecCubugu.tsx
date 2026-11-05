import Link from "next/link";
import { Ikon } from "@/components/Ikon";
import { EtkinSuzgecler } from "@/components/liste/EtkinSuzgecler";
import { HizliSekmeler } from "@/components/liste/HizliSekmeler";
import { AcilirPanel } from "@/components/liste/AcilirPanel";
import { SuzgecFormu } from "@/components/liste/SuzgecFormu";
import { KONTROL_TEK_SATIR, buton } from "@/components/stil";
import { SATICI_SEKMELERI, ayniSuzgec, doktorAdresi, etkinSayisi, etkinSuzgecler, SESSIZ_SECENEKLERI, type DoktorSuzgeci } from "@/lib/doktor-listesi/suzgec";
import { SuzgecAlani } from "@/components/liste/SuzgecAlani";

const YOL = "/my-doctors";

/**
 * Doktorlarım'ın süzgeç çubuğu (spec Ü-32 §3.2): durum sekmeleri (Tümü · Aktif · Pasif), Filtrele paneli (bölge —
 * yalnız kendi carilerinin bölgeleri —, durum, son sipariş), etkin süzgeç etiketleri, sütun menüsü yuvası. GET formu
 * `next/form` ile istemci tarafında gezer; JS'siz de çalışır. Sınıf, satıcı ve fatura süzgeci bu ekranda yoktur.
 */
export function SuzgecCubugu({
  suzgec,
  bolgeler,
  sutunMenusu,
}: {
  suzgec: DoktorSuzgeci;
  bolgeler: readonly string[];
  sutunMenusu?: React.ReactNode;
}) {
  const etiketler = etkinSuzgecler(suzgec, () => undefined, YOL);
  // Sayaç yönetici çubuğu ve boş durumla aynı kuraldır (`etkinSayisi`); durum panelde de var.
  const sayi = etkinSayisi(suzgec);
  const uygulanan = doktorAdresi(suzgec, {}, YOL);
  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-start gap-2">
        <HizliSekmeler
          sekmeler={SATICI_SEKMELERI.map((f) => ({ etiket: f.etiket, adres: doktorAdresi(f.suzgec, {}, YOL), etkin: ayniSuzgec(suzgec, f.suzgec) }))}
        />
        <div className="ml-auto flex flex-wrap items-start gap-2">
          {/* Uygulanan süzgeç değişince panel kapalı, form yeni değerlerle kurulur. */}
          <AcilirPanel key={uygulanan} className="relative">
            <summary className={`${buton("ikincil")} cursor-pointer list-none`}>
              <Ikon ad="filtrele" />
              {sayi > 0 ? `Filtrele · ${sayi}` : "Filtrele"}
            </summary>
            <SuzgecFormu
              action={YOL}
              anahtar={uygulanan}
              aria-label="Doktor süzgeci"
              className="absolute right-0 z-20 mt-2 grid w-[min(36rem,calc(100vw-2rem))] gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-lg sm:grid-cols-2"
            >
              <SuzgecAlani id="suzgec-bolge" etiket="Bölge">
                <select id="suzgec-bolge" name="bolge" defaultValue={suzgec.bolge ?? ""} className={KONTROL_TEK_SATIR}>
                  <option value="">Tümü</option>
                  {/* Uygulanan bölge seçeneklerde yoksa (devirle portföyden çıkmış) de görünür; form onu sessizce düşürmez. */}
                  {suzgec.bolge && !bolgeler.includes(suzgec.bolge) && <option value={suzgec.bolge}>{suzgec.bolge}</option>}
                  {bolgeler.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </SuzgecAlani>
              <SuzgecAlani id="suzgec-durum" etiket="Durum">
                <select id="suzgec-durum" name="durum" defaultValue={suzgec.durum ?? ""} className={KONTROL_TEK_SATIR}>
                  <option value="">Tümü</option>
                  <option value="AKTIF">Aktif</option>
                  <option value="PASIF">Pasif</option>
                </select>
              </SuzgecAlani>
              <SuzgecAlani id="suzgec-sessiz" etiket="Son sipariş">
                <select id="suzgec-sessiz" name="sessiz" defaultValue={suzgec.sessiz ?? ""} className={KONTROL_TEK_SATIR}>
                  <option value="">Tümü</option>
                  {SESSIZ_SECENEKLERI.map((s) => (
                    <option key={s.deger} value={s.deger}>
                      {s.metin}
                    </option>
                  ))}
                </select>
              </SuzgecAlani>
              <div className="hidden sm:block" />
              <SuzgecAlani id="suzgec-sonbas" etiket="Son sipariş — başlangıç">
                <input type="date" id="suzgec-sonbas" name="sonBas" defaultValue={suzgec.sonBas ?? ""} className={KONTROL_TEK_SATIR} />
              </SuzgecAlani>
              <SuzgecAlani id="suzgec-sonbit" etiket="Son sipariş — bitiş">
                <input type="date" id="suzgec-sonbit" name="sonBit" defaultValue={suzgec.sonBit ?? ""} className={KONTROL_TEK_SATIR} />
              </SuzgecAlani>
              <p className="text-xs text-slate-500 sm:col-span-2">
                Tarih aralığı girilirse hazır seçim yok sayılır. Aralık, son siparişi bu günler arasında olan doktorları gösterir.
              </p>
              <div className="flex items-center gap-3 sm:col-span-2">
                <button type="submit" className={buton("birincil")}>
                  <Ikon ad="filtrele" />
                  Uygula
                </button>
                <Link href={YOL} scroll={false} className={buton("metin")}>
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
