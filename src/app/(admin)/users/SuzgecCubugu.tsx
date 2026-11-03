import { EtkinSuzgecler } from "@/components/liste/EtkinSuzgecler";
import { HizliSekmeler } from "@/components/liste/HizliSekmeler";
import { ayniSuzgec, etkinSuzgecler, hizliSekmeler, kullaniciAdresi, type GorenRol, type KullaniciSuzgeci } from "@/lib/kullanici-listesi/suzgec";

/**
 * Kullanıcılar ekranının süzgeç çubuğu (spec Ü-22 §3.3): role göre hızlı sekmeler, etkin süzgeç
 * etiketleri ve sütun menüsünün yuvası. Kullanıcı sayısı küçük; Filtrele paneli yoktur.
 */
export function SuzgecCubugu({
  suzgec,
  gorenRol,
  sutunMenusu,
}: {
  suzgec: KullaniciSuzgeci;
  gorenRol: GorenRol;
  sutunMenusu?: React.ReactNode;
}) {
  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-start gap-2">
        <HizliSekmeler
          sekmeler={hizliSekmeler(gorenRol).map((f) => ({ etiket: f.etiket, adres: kullaniciAdresi(f.suzgec), etkin: ayniSuzgec(suzgec, f.suzgec) }))}
        />
        <div className="ml-auto flex flex-wrap items-start gap-2">{sutunMenusu}</div>
      </div>
      <EtkinSuzgecler etiketler={etkinSuzgecler(suzgec)} />
    </div>
  );
}
