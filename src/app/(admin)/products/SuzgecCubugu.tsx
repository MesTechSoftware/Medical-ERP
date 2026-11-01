import { EtkinSuzgecler } from "@/components/liste/EtkinSuzgecler";
import { HizliSekmeler } from "@/components/liste/HizliSekmeler";
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
        <div className="ml-auto flex flex-wrap items-start gap-2">{sutunMenusu}</div>
      </div>

      <EtkinSuzgecler etiketler={etiketler} />
    </div>
  );
}
