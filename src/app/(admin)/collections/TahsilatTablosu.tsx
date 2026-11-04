import Link from "next/link";
import { Card, StatusChip } from "@/components/ui";
import { Ikon } from "@/components/Ikon";
import { BosDurum } from "@/components/liste/BosDurum";
import { buton } from "@/components/stil";
import { Tutar } from "@/components/Tutar";
import { formatDate } from "@/lib/format";
import { BRUT, tabanli } from "@/lib/taban";
import type { Ozet, TahsilatSatiri } from "@/lib/tahsilat-listesi/sorgu";
import { SUTUNLAR, type TahsilatSutunu } from "@/lib/tahsilat-listesi/sutunlar";
import { bosDurum, tahsilatAdresi, type TahsilatSuzgeci } from "@/lib/tahsilat-listesi/suzgec";

const BAGLANTI = "text-link underline decoration-link/40 underline-offset-4 hover:decoration-link";

export function DurumRozeti({ durum }: { durum: TahsilatSatiri["status"] }) {
  return durum === "IPTAL" ? <StatusChip ton="hata">İptal</StatusChip> : <StatusChip ton="notr">Aktif</StatusChip>;
}

/**
 * Tahsilat tablosu (spec Ü-26 §3.4). Gizli sütun çizilmez; "İncele" paneli açar. Toplam satırı yalnız aktif
 * süzgeçte, süzgecin bütün sayfalarının toplamıdır (A-11-2).
 */
export function TahsilatTablosu({
  satirlar,
  ozet,
  gizli,
  suzgec,
  yer,
}: {
  satirlar: TahsilatSatiri[];
  ozet: Ozet | null;
  gizli: ReadonlySet<TahsilatSutunu>;
  suzgec: TahsilatSuzgeci;
  yer: { page?: number; per?: number };
}) {
  const gorunur = SUTUNLAR.filter((s) => !gizli.has(s.anahtar));
  const acik = (k: TahsilatSutunu) => !gizli.has(k);
  const tur = bosDurum(suzgec);
  const once = gorunur.filter((s) => s.anahtar === "yontem" || s.anahtar === "referans");
  const sonra = gorunur.filter((s) => s.anahtar === "komisyon" || s.anahtar === "kaydeden");
  return (
    <Card>
      <div className="tablo-kutusu">
        <table className="veri-tablosu" aria-label="Tahsilatlar">
          <thead>
            <tr>
              <th>Tarih</th>
              <th>Belge no</th>
              <th>Cari</th>
              {once.map((s) => (
                <th key={s.anahtar} className="oncelik-dusuk">
                  {s.baslik}
                </th>
              ))}
              <th className="sayi">{tabanli("Tutar", BRUT)}</th>
              {sonra.map((s) => (
                <th key={s.anahtar} className={s.anahtar === "komisyon" ? "sayi oncelik-dusuk" : "oncelik-dusuk"}>
                  {s.anahtar === "komisyon" ? tabanli(s.baslik, BRUT) : s.baslik}
                </th>
              ))}
              <th>Durum</th>
              <th className="sayi">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {satirlar.length === 0 && (
              <BosDurum
                colSpan={6 + gorunur.length}
                ikon={tur === "suzgecli" ? "filtrele" : "yeni"}
                baslik={tur === "suzgecli" ? "Bu süzgeçlere uyan tahsilat yok." : "Henüz tahsilat kaydı yok."}
                temizleAdresi={tur === "suzgecli" ? "/collections" : undefined}
              />
            )}
            {satirlar.map((p) => {
              const iptal = p.status === "IPTAL";
              return (
                <tr key={p.id}>
                  <td className="whitespace-nowrap text-slate-500">{formatDate(p.paidAt)}</td>
                  <td className="whitespace-nowrap font-medium text-slate-900">{p.documentNo}</td>
                  <td>
                    <Link href={`/doctors/${p.doktorId}`} className={BAGLANTI}>
                      {p.doktor}
                    </Link>
                  </td>
                  {acik("yontem") && <td className="text-slate-600 oncelik-dusuk">{p.yontem}</td>}
                  {acik("referans") && <td className="text-slate-500 oncelik-dusuk">{p.referenceNo ?? "—"}</td>}
                  <td className={iptal ? "sayi text-slate-400 line-through" : "sayi"}>
                    <Tutar deger={p.amount} taban={BRUT} baslikta />
                  </td>
                  {acik("komisyon") && (
                    <td className="sayi text-slate-500 oncelik-dusuk">
                      {p.commissionAmount.isZero() ? "—" : <Tutar deger={p.commissionAmount} taban={BRUT} baslikta />}
                    </td>
                  )}
                  {acik("kaydeden") && <td className="text-slate-600 oncelik-dusuk">{p.kaydeden ?? "—"}</td>}
                  <td>
                    <DurumRozeti durum={p.status} />
                  </td>
                  <td className="text-right">
                    <Link href={tahsilatAdresi(suzgec, { ...yer, detay: p.id })} scroll={false} data-kayit={p.id} className={buton("metin")}>
                      <Ikon ad="detay" />
                      İncele
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {ozet && satirlar.length > 0 && (
            <tfoot>
              <tr>
                <th scope="row" colSpan={3 + once.length} className="text-left">
                  Toplam · {ozet.adet} tahsilat
                </th>
                <td className="sayi font-semibold">
                  <Tutar deger={ozet.tutar} taban={BRUT} baslikta />
                </td>
                <td colSpan={sonra.length + 2} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </Card>
  );
}
