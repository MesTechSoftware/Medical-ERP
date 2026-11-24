import { EtkinSuzgecler } from "@/components/liste/EtkinSuzgecler";
import { Ikon } from "@/components/Ikon";
import { HizliSekmeler } from "@/components/liste/HizliSekmeler";
import { SuzgecFormu } from "@/components/liste/SuzgecFormu";
import { KONTROL_TEK_SATIR, buton } from "@/components/stil";
import { HIZLI_SEKMELER, ayniSuzgec, etkinSuzgecler, urunAdresi, type UrunSuzgeci } from "@/lib/urun-listesi/suzgec";

/**
 * Ürün listesinin süzgeç çubuğu (spec Ü-19 §3.2): hızlı sekmeler, etkin süzgeç etiketleri ve sütun
 * menüsünün yuvası. İki süzgeç alanı olduğu için Filtrele paneli yoktur; süzgeç adres çubuğundadır.
 */
export function SuzgecCubugu({ suzgec, sutunMenusu }: { suzgec: UrunSuzgeci; sutunMenusu?: React.ReactNode }) {
  const etiketler = etkinSuzgecler(suzgec);

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-start gap-2">
        <HizliSekmeler
          sekmeler={HIZLI_SEKMELER.map((f) => ({ etiket: f.etiket, adres: urunAdresi(f.suzgec), etkin: ayniSuzgec(suzgec, f.suzgec) }))}
        />
        <div className="ml-auto flex flex-wrap items-start gap-2">
          <SuzgecFormu action="/products" anahtar={urunAdresi(suzgec)} aria-label="Ürün ara" className="flex gap-2">
            {suzgec.durum && <input type="hidden" name="durum" value={suzgec.durum} />}
            {suzgec.stok && <input type="hidden" name="stok" value={suzgec.stok} />}
            <input
              type="search"
              name="q"
              defaultValue={suzgec.q ?? ""}
              placeholder="Ürün adı ya da kodu ara"
              aria-label="Ürün adı ya da kodu ara"
              maxLength={80}
              className={`${KONTROL_TEK_SATIR} w-56`}
            />
            <button type="submit" className={buton("ikincil")}>
              <Ikon ad="filtrele" />
              Ara
            </button>
          </SuzgecFormu>
          {sutunMenusu}
        </div>
      </div>

      <EtkinSuzgecler etiketler={etiketler} />
    </div>
  );
}
