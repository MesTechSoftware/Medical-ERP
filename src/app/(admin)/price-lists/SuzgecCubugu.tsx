import { EtkinSuzgecler } from "@/components/liste/EtkinSuzgecler";
import { HizliSekmeler } from "@/components/liste/HizliSekmeler";
import { HIZLI_SEKMELER, ayniSuzgec, etkinSuzgecler, listeAdresi, type ListeSuzgeci } from "@/lib/fiyat-listesi-listesi/suzgec";

/**
 * Fiyat listesi ekranının süzgeç çubuğu (spec Ü-21 §3.3): hızlı sekmeler, etkin süzgeç etiketi ve sütun
 * menüsünün yuvası. Tek süzgeç alanı olduğu için Filtrele paneli yoktur.
 */
export function SuzgecCubugu({ suzgec, sutunMenusu }: { suzgec: ListeSuzgeci; sutunMenusu?: React.ReactNode }) {
  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-start gap-2">
        <HizliSekmeler
          sekmeler={HIZLI_SEKMELER.map((f) => ({ etiket: f.etiket, adres: listeAdresi(f.suzgec), etkin: ayniSuzgec(suzgec, f.suzgec) }))}
        />
        <div className="ml-auto flex flex-wrap items-start gap-2">{sutunMenusu}</div>
      </div>
      <EtkinSuzgecler etiketler={etkinSuzgecler(suzgec)} />
    </div>
  );
}
