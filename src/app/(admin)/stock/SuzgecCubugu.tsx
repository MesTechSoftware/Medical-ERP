import Link from "next/link";
import { Ikon } from "@/components/Ikon";
import { EtkinSuzgecler } from "@/components/liste/EtkinSuzgecler";
import { HizliSekmeler } from "@/components/liste/HizliSekmeler";
import { KONTROL_TEK_SATIR, buton } from "@/components/stil";
import { HAREKET_TURLERI } from "@/lib/stok-hareket-turu";
import { etkinSekme, etkinSuzgecler, hizliSekmeler, sekmeAdresi, stokAdresi, type StokSuzgeci } from "@/lib/stok-listesi/suzgec";

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
 * Hareket geçmişinin süzgeç çubuğu (spec Ü-20 §3.3): tarih kısayolları, Filtrele paneli (JS'siz GET
 * formu), etkin süzgeç etiketleri ve sütun menüsünün yuvası. Süzgeç adres çubuğundadır.
 */
export function SuzgecCubugu({
  suzgec,
  bugun,
  urunler,
  sutunMenusu,
}: {
  suzgec: StokSuzgeci;
  bugun: string;
  urunler: { value: string; label: string }[];
  sutunMenusu?: React.ReactNode;
}) {
  const etiketler = etkinSuzgecler(suzgec, (id) => urunler.find((u) => u.value === id)?.label);
  const sekmeler = hizliSekmeler(bugun);
  const etkin = etkinSekme(sekmeler, suzgec);
  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-start gap-2">
        <HizliSekmeler
          sekmeler={sekmeler.map((f) => ({ etiket: f.etiket, adres: sekmeAdresi(suzgec, f.tarih), etkin: f.etiket === etkin }))}
        />
        <div className="ml-auto flex flex-wrap items-start gap-2">
          {/* Süzgeç değişince form yeniden kurulur: yumuşak gezinmede <select> eski değerini korur (React). */}
          <details key={stokAdresi(suzgec)} className="relative">
            <summary className={`${buton("ikincil")} cursor-pointer list-none`}>
              <Ikon ad="filtrele" />
              {etiketler.length > 0 ? `Filtrele · ${etiketler.length}` : "Filtrele"}
            </summary>
            <form
              method="get"
              action="/stock"
              aria-label="Hareket süzgeci"
              className="absolute right-0 z-20 mt-2 grid w-[min(36rem,calc(100vw-2rem))] gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-lg sm:grid-cols-2"
            >
              <Alan id="suzgec-baslangic" etiket="Başlangıç">
                <input type="date" id="suzgec-baslangic" name="baslangic" defaultValue={suzgec.baslangic ?? ""} className={KONTROL_TEK_SATIR} />
              </Alan>
              <Alan id="suzgec-bitis" etiket="Bitiş">
                <input type="date" id="suzgec-bitis" name="bitis" defaultValue={suzgec.bitis ?? ""} className={KONTROL_TEK_SATIR} />
              </Alan>
              <Alan id="suzgec-tur" etiket="Tür">
                <select id="suzgec-tur" name="tur" defaultValue={suzgec.tur ?? ""} className={KONTROL_TEK_SATIR}>
                  <option value="">Tümü</option>
                  {HAREKET_TURLERI.map((t) => (
                    <option key={t.kod} value={t.kod}>
                      {t.etiket}
                    </option>
                  ))}
                </select>
              </Alan>
              <Alan id="suzgec-yon" etiket="Yön">
                <select id="suzgec-yon" name="yon" defaultValue={suzgec.yon ?? ""} className={KONTROL_TEK_SATIR}>
                  <option value="">Tümü</option>
                  <option value="GIRIS">Giriş</option>
                  <option value="CIKIS">Çıkış</option>
                </select>
              </Alan>
              <div className="sm:col-span-2">
                <Alan id="suzgec-urun" etiket="Ürün">
                  <select id="suzgec-urun" name="urunId" defaultValue={suzgec.urunId ?? ""} className={KONTROL_TEK_SATIR}>
                    <option value="">Tümü</option>
                    {urunler.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </Alan>
              </div>
              <div className="flex items-center gap-3 sm:col-span-2">
                <button type="submit" className={buton("birincil")}>
                  <Ikon ad="filtrele" />
                  Uygula
                </button>
                <Link href="/stock" className={buton("metin")}>
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
