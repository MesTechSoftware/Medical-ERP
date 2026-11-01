import Link from "next/link";
import { Ikon } from "@/components/Ikon";
import { EtkinSuzgecler } from "@/components/liste/EtkinSuzgecler";
import { HizliSekmeler } from "@/components/liste/HizliSekmeler";
import { KONTROL_TEK_SATIR, buton } from "@/components/stil";
import {
  HIZLI_SEKMELER,
  SAHIPSIZ,
  ayniSuzgec,
  doktorAdresi,
  etkinSayisi,
  etkinSuzgecler,
  type DoktorSuzgeci,
} from "@/lib/doktor-listesi/suzgec";

const ETIKET = "mb-1 block font-medium text-slate-700";

const SESSIZ_SECENEKLERI = [
  { deger: "30", metin: "30+ gündür sipariş yok" },
  { deger: "60", metin: "60+ gündür sipariş yok" },
  { deger: "90", metin: "90+ gündür sipariş yok" },
  { deger: "180", metin: "180+ gündür sipariş yok" },
  { deger: "hic", metin: "Hiç sipariş yok" },
];

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
 * Cari listesinin süzgeç çubuğu (spec Ü-18 §3.2): hızlı sekmeler, Filtrele paneli (JS'siz GET formu),
 * etkin süzgeç etiketleri ve sütun menüsünün yuvası. Süzgeç adres çubuğundadır.
 */
export function SuzgecCubugu({
  suzgec,
  secenekler,
  sutunMenusu,
}: {
  suzgec: DoktorSuzgeci;
  secenekler: { bolgeler: string[]; saticilar: { id: string; name: string }[] };
  sutunMenusu?: React.ReactNode;
}) {
  const sayi = etkinSayisi(suzgec);
  const saticiAdi = (id: string) => secenekler.saticilar.find((s) => s.id === id)?.name;
  const etiketler = etkinSuzgecler(suzgec, saticiAdi);

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-start gap-2">
        <HizliSekmeler
          sekmeler={HIZLI_SEKMELER.map((f) => ({ etiket: f.etiket, adres: doktorAdresi(f.suzgec), etkin: ayniSuzgec(suzgec, f.suzgec) }))}
        />
        <div className="ml-auto flex flex-wrap items-start gap-2">
          {/* Süzgeç değişince form yeniden kurulur: yumuşak gezinmede <select> eski değerini korur (React). */}
          <details key={doktorAdresi(suzgec)} className="relative">
            <summary className={`${buton("ikincil")} cursor-pointer list-none`}>
              <Ikon ad="filtrele" />
              {sayi > 0 ? `Filtrele · ${sayi}` : "Filtrele"}
            </summary>
            <form
              method="get"
              action="/doctors"
              aria-label="Cari süzgeci"
              className="absolute right-0 z-20 mt-2 grid w-[min(56rem,calc(100vw-2rem))] gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-lg sm:grid-cols-2 lg:grid-cols-4"
            >
              <Alan id="suzgec-sinif" etiket="Hesap sınıfı">
                <select id="suzgec-sinif" name="sinif" defaultValue={suzgec.sinif ?? ""} className={KONTROL_TEK_SATIR}>
                  <option value="">Tümü</option>
                  <option value="DOKTOR">Doktor</option>
                  <option value="BAYI">Bayi</option>
                </select>
              </Alan>
              <Alan id="suzgec-bolge" etiket="Bölge">
                <select id="suzgec-bolge" name="bolge" defaultValue={suzgec.bolge ?? ""} className={KONTROL_TEK_SATIR}>
                  <option value="">Tümü</option>
                  {secenekler.bolgeler.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </Alan>
              <Alan id="suzgec-satici" etiket="Sorumlu satıcı">
                <select id="suzgec-satici" name="satici" defaultValue={suzgec.satici ?? ""} className={KONTROL_TEK_SATIR}>
                  <option value="">Tümü</option>
                  <option value={SAHIPSIZ}>Sahipsiz</option>
                  {secenekler.saticilar.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Alan>
              <Alan id="suzgec-durum" etiket="Durum">
                <select id="suzgec-durum" name="durum" defaultValue={suzgec.durum ?? ""} className={KONTROL_TEK_SATIR}>
                  <option value="">Tümü</option>
                  <option value="AKTIF">Aktif</option>
                  <option value="PASIF">Pasif</option>
                </select>
              </Alan>
              <Alan id="suzgec-sessiz" etiket="Son sipariş">
                <select id="suzgec-sessiz" name="sessiz" defaultValue={suzgec.sessiz ?? ""} className={KONTROL_TEK_SATIR}>
                  <option value="">Tümü</option>
                  {SESSIZ_SECENEKLERI.map((s) => (
                    <option key={s.deger} value={s.deger}>
                      {s.metin}
                    </option>
                  ))}
                </select>
              </Alan>
              <Alan id="suzgec-sonbas" etiket="Son sipariş — başlangıç">
                <input type="date" id="suzgec-sonbas" name="sonBas" defaultValue={suzgec.sonBas ?? ""} className={KONTROL_TEK_SATIR} />
              </Alan>
              <Alan id="suzgec-sonbit" etiket="Son sipariş — bitiş">
                <input type="date" id="suzgec-sonbit" name="sonBit" defaultValue={suzgec.sonBit ?? ""} className={KONTROL_TEK_SATIR} />
              </Alan>
              <div className="flex items-end text-sm">
                <label className="inline-flex h-(--control-h) items-center gap-2 text-slate-700">
                  <input type="checkbox" name="fatura" value="eksik" defaultChecked={suzgec.fatura === "eksik"} />
                  Eksik fatura bilgisi
                </label>
              </div>
              <p className="text-xs text-slate-500 sm:col-span-2 lg:col-span-4">
                Tarih aralığı girilirse hazır seçim yok sayılır. Aralık, son siparişi bu günler arasında olan carileri gösterir.
              </p>
              <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4">
                <button type="submit" className={buton("birincil")}>
                  <Ikon ad="filtrele" />
                  Uygula
                </button>
                <Link href="/doctors" className={buton("metin")}>
                  <Ikon ad="vazgec" />
                  Temizle
                </Link>
              </div>
            </form>
          </details>
          {sutunMenusu}
        </div>
      </div>

      <EtkinSuzgecler etiketler={etiketler} />
    </div>
  );
}
