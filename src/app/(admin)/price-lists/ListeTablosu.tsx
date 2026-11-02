import Link from "next/link";
import { Card, LinkButton, StatusChip } from "@/components/ui";
import { Ikon } from "@/components/Ikon";
import { BosDurum } from "@/components/liste/BosDurum";
import { buton } from "@/components/stil";
import type { ListeSatiri } from "@/lib/fiyat-listesi-listesi/sorgu";
import { SUTUNLAR, type ListeSutunu } from "@/lib/fiyat-listesi-listesi/sutunlar";
import { bosDurum, listeAdresi, type ListeSuzgeci } from "@/lib/fiyat-listesi-listesi/suzgec";

const SINIF: Partial<Record<ListeSutunu, string>> = { urun: "sayi", barem: "sayi oncelik-dusuk", cari: "sayi" };

/**
 * Fiyat listesi tablosu (spec Ü-21 §3.4). Gizli sütunun başlığı ve hücresi çizilmez. Kod yan paneli
 * açar; "Satırlar" detay sayfasına (satır yazımı) gider.
 */
export function ListeTablosu({
  satirlar,
  gizli,
  suzgec,
  yer,
}: {
  satirlar: ListeSatiri[];
  gizli: ReadonlySet<ListeSutunu>;
  suzgec: ListeSuzgeci;
  yer: { page?: number; per?: number };
}) {
  const gorunur = SUTUNLAR.filter((s) => !gizli.has(s.anahtar));
  const acik = (k: ListeSutunu) => !gizli.has(k);
  const tur = bosDurum(suzgec);

  return (
    <Card>
      <div className="tablo-kutusu">
        <table className="veri-tablosu">
          <thead>
            <tr>
              <th>Kod</th>
              {gorunur.map((s) => (
                <th key={s.anahtar} className={SINIF[s.anahtar]}>
                  {s.baslik}
                </th>
              ))}
              <th className="sayi">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {satirlar.length === 0 && (
              <BosDurum
                colSpan={2 + gorunur.length}
                ikon={tur === "suzgecli" ? "filtrele" : "yeni"}
                baslik={tur === "suzgecli" ? "Bu süzgece uyan liste yok." : "Henüz fiyat listesi yok."}
                temizleAdresi={tur === "suzgecli" ? "/price-lists" : undefined}
                eylem={
                  tur === "hic-kayit" ? (
                    <LinkButton href="/price-lists/new" ikon="yeni">
                      Yeni Liste
                    </LinkButton>
                  ) : undefined
                }
              />
            )}
            {satirlar.map((l) => (
              <tr key={l.id}>
                <td className="font-medium text-slate-900">
                  {/* Kod yan paneli açar (spec §3.5); kapanınca odak `data-kayit` ile buraya döner. */}
                  <Link
                    href={listeAdresi(suzgec, { ...yer, detay: l.id })}
                    scroll={false}
                    data-kayit={l.id}
                    className="inline-flex items-center gap-0.5 text-link underline decoration-link/40 underline-offset-4 hover:decoration-link"
                  >
                    <span>{l.code}</span>
                    <Ikon ad="sonraki" />
                  </Link>
                  {l.varsayilan && <span className="ml-2 text-xs font-normal text-slate-400">varsayılan</span>}
                </td>
                {acik("ad") && <td className="text-slate-700">{l.name}</td>}
                {acik("urun") && <td className="sayi">{l.urunSayisi}</td>}
                {acik("barem") && <td className="sayi oncelik-dusuk">{l.baremSayisi}</td>}
                {acik("cari") && <td className="sayi">{l.cariSayisi}</td>}
                {acik("durum") && (
                  <td>
                    <StatusChip ton={l.aktif ? "olumlu" : "notr"}>{l.aktif ? "Aktif" : "Boş"}</StatusChip>
                  </td>
                )}
                <td className="text-right">
                  <Link href={`/price-lists/${l.id}`} className={buton("metin")}>
                    <Ikon ad="duzenle" />
                    Satırlar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
