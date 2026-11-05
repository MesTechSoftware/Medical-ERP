import Link from "next/link";
import { Card, StatusChip } from "@/components/ui";
import { Ikon } from "@/components/Ikon";
import { BosDurum } from "@/components/liste/BosDurum";
import { BAGLANTI, buton } from "@/components/stil";
import { formatDateTime } from "@/lib/format";
import type { BlokKuralKodu } from "@/lib/onay-blogu";
import type { OnaySatiri } from "@/lib/onay-listesi/sorgu";
import { SUTUNLAR, type OnaySutunu } from "@/lib/onay-listesi/sutunlar";
import { bosDurum, onayAdresi, type OnaySuzgeci } from "@/lib/onay-listesi/suzgec";
import { BLOK_KURAL_ADI } from "@/lib/sozluk";

/** Talebin durumu: bekliyor (uyarı), onaylandı (olumlu), reddedildi (hata). */
export function KararRozeti({ karar }: { karar: OnaySatiri["decision"] }) {
  if (karar === "ONAY") return <StatusChip ton="olumlu">Onaylandı</StatusChip>;
  if (karar === "RED") return <StatusChip ton="hata">Reddedildi</StatusChip>;
  return <StatusChip ton="uyari">Bekliyor</StatusChip>;
}

export const kuralAdi = (kod: string) => BLOK_KURAL_ADI[kod as BlokKuralKodu] ?? kod;

/** Belge hücresi: numara; sipariş Siparişler panelini açar; bulunmayan belge "—". */
export function BelgeBaglantisi({ belge }: { belge: OnaySatiri["belge"] }) {
  if (!belge) return <span className="text-slate-400">—</span>;
  return belge.siparisId ? (
    <Link href={`/orders?detay=${belge.siparisId}`} className={BAGLANTI}>
      {belge.no}
    </Link>
  ) : (
    <span>{belge.no}</span>
  );
}

/** Onay tablosu (spec Ü-25 §3.4). Gizli sütun çizilmez; "İncele" karar panelini açar. */
export function OnayTablosu({
  satirlar,
  gizli,
  suzgec,
  yer,
}: {
  satirlar: OnaySatiri[];
  gizli: ReadonlySet<OnaySutunu>;
  suzgec: OnaySuzgeci;
  yer: { page?: number; per?: number };
}) {
  const gorunur = SUTUNLAR.filter((s) => !gizli.has(s.anahtar));
  const acik = (k: OnaySutunu) => !gizli.has(k);
  const tur = bosDurum(suzgec);
  return (
    <Card>
      <div className="tablo-kutusu">
        <table className="veri-tablosu" aria-label="Onay talepleri">
          <thead>
            <tr>
              <th>Açılış</th>
              <th>Kural</th>
              <th>Belge</th>
              {gorunur
                .filter((s) => s.anahtar === "cari" || s.anahtar === "acan" || s.anahtar === "gerekce")
                .map((s) => (
                  <th key={s.anahtar} className={s.anahtar === "gerekce" ? "oncelik-dusuk" : undefined}>
                    {s.baslik}
                  </th>
                ))}
              <th>Durum</th>
              {gorunur
                .filter((s) => s.anahtar === "kararVeren" || s.anahtar === "kararZamani")
                .map((s) => (
                  <th key={s.anahtar} className="oncelik-dusuk">
                    {s.baslik}
                  </th>
                ))}
              <th className="sayi">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {satirlar.length === 0 && (
              <BosDurum
                colSpan={5 + gorunur.length}
                ikon={tur === "suzgecli" ? "filtrele" : "onayla"}
                baslik={tur === "suzgecli" ? "Bu süzgeçlere uyan talep yok." : "Onay bekleyen işlem yok."}
                temizleAdresi={tur === "suzgecli" ? "/approvals" : undefined}
              />
            )}
            {satirlar.map((b) => (
              <tr key={b.id}>
                <td className="whitespace-nowrap text-slate-500">{formatDateTime(b.openedAt)}</td>
                <td className="whitespace-nowrap font-medium text-slate-900">{kuralAdi(b.ruleCode)}</td>
                <td className="whitespace-nowrap">
                  <BelgeBaglantisi belge={b.belge} />
                </td>
                {acik("cari") && <td className="text-slate-700">{b.cari ?? "—"}</td>}
                {acik("acan") && <td className="text-slate-600">{b.acan ?? "—"}</td>}
                {acik("gerekce") && (
                  <td className="max-w-64 truncate text-slate-500 oncelik-dusuk" title={b.openReason}>
                    {b.openReason}
                  </td>
                )}
                <td>
                  <KararRozeti karar={b.decision} />
                </td>
                {acik("kararVeren") && <td className="text-slate-600 oncelik-dusuk">{b.kararVeren ?? "—"}</td>}
                {acik("kararZamani") && <td className="whitespace-nowrap text-slate-500 oncelik-dusuk">{b.decidedAt ? formatDateTime(b.decidedAt) : "—"}</td>}
                <td className="text-right">
                  <Link href={onayAdresi(suzgec, { ...yer, detay: b.id })} scroll={false} data-kayit={b.id} className={buton("metin")}>
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
