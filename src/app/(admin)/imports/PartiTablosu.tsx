import Link from "next/link";
import { Card, StatusChip } from "@/components/ui";
import { Ikon } from "@/components/Ikon";
import { BosDurum } from "@/components/liste/BosDurum";
import { buton } from "@/components/stil";
import { formatDateTime } from "@/lib/format";
import { VERI_TIPI_ADI } from "@/lib/ice-aktarim/adlar";
import type { PartiSatiri } from "@/lib/ice-aktarim-listesi/sorgu";
import type { PartiSutunu } from "@/lib/ice-aktarim-listesi/sutunlar";
import { bosDurum, partiAdresi, type PartiSuzgeci } from "@/lib/ice-aktarim-listesi/suzgec";

export function PartiDurumu({ geriAlindi }: { geriAlindi: boolean }) {
  return geriAlindi ? <StatusChip ton="uyari">Geri alındı</StatusChip> : <StatusChip ton="notr">Yazıldı</StatusChip>;
}

/** Parti tablosu (spec Ü-30 §3.3). Gizli sütun çizilmez; "İncele" parti panelini açar. Satır `data-parti` taşır. */
export function PartiTablosu({
  satirlar,
  gizli,
  suzgec,
  yer,
}: {
  satirlar: PartiSatiri[];
  gizli: ReadonlySet<PartiSutunu>;
  suzgec: PartiSuzgeci;
  yer: { page?: number; per?: number };
}) {
  const acik = (k: PartiSutunu) => !gizli.has(k);
  const tur = bosDurum(suzgec);
  return (
    <Card>
      <div className="tablo-kutusu">
        <table className="veri-tablosu" aria-label="Partiler">
          <thead>
            <tr>
              <th>Parti</th>
              <th>Tür</th>
              {acik("dosya") && <th className="oncelik-dusuk">Dosya</th>}
              {acik("yapan") && <th className="oncelik-dusuk">Yapan</th>}
              <th>Zaman</th>
              <th className="sayi">Kayıt</th>
              <th>Durum</th>
              <th className="sayi">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {satirlar.length === 0 && (
              <BosDurum
                colSpan={8 - gizli.size}
                ikon={tur === "suzgecli" ? "filtrele" : "yeni"}
                baslik={tur === "suzgecli" ? "Bu süzgeçlere uyan parti yok." : "Henüz içe aktarım yok."}
                temizleAdresi={tur === "suzgecli" ? "/imports" : undefined}
              />
            )}
            {satirlar.map((p) => (
              <tr key={p.id} data-parti={p.batchNo}>
                <td className="whitespace-nowrap font-medium text-slate-900">{p.batchNo}</td>
                <td>{VERI_TIPI_ADI[p.dataType]}</td>
                {acik("dosya") && <td className="text-slate-500 oncelik-dusuk">{p.fileName ?? "—"}</td>}
                {acik("yapan") && <td className="text-slate-600 oncelik-dusuk">{p.yapan}</td>}
                <td className="whitespace-nowrap text-slate-500">{formatDateTime(p.createdAt)}</td>
                <td className="sayi">{p.kayit}</td>
                <td>
                  <PartiDurumu geriAlindi={p.geriAlindi} />
                </td>
                <td className="text-right">
                  <Link href={partiAdresi(suzgec, { ...yer, detay: p.id })} scroll={false} data-kayit={p.id} className={buton("metin")}>
                    <Ikon ad="detay" />
                    İncele
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
