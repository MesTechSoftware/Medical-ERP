import Link from "next/link";
import { StatusBadge } from "@/components/ui";
import { BosDurum } from "@/components/liste/BosDurum";
import { formatDateTime } from "@/lib/format";
import type { SevkiyatSatiri } from "@/lib/kargo-listesi/sorgu";
import { SUTUNLAR, type KargoSutunu } from "@/lib/kargo-listesi/sutunlar";
import { bosDurum, type KargoSuzgeci } from "@/lib/kargo-listesi/suzgec";
import { BAGLANTI } from "@/components/stil";

const SINIF: Partial<Record<KargoSutunu, string>> = { siparis: "whitespace-nowrap", firma: "oncelik-dusuk", irsaliye: "oncelik-dusuk", adet: "sayi" };

/**
 * Sevkiyat listesi (spec Ü-24 §3.5): bir siparişin her sevkiyatı ayrı satır. Gizli sütun çizilmez. Sipariş
 * bağlantısı Siparişler ekranının yan panelini açar; takip numarası firmanın şablonu varsa bağlantıdır (D-3-2).
 */
export function SevkiyatTablosu({
  satirlar,
  gizli,
  suzgec,
}: {
  satirlar: SevkiyatSatiri[];
  gizli: ReadonlySet<KargoSutunu>;
  suzgec: KargoSuzgeci;
}) {
  const gorunur = SUTUNLAR.filter((s) => !gizli.has(s.anahtar));
  const acik = (k: KargoSutunu) => !gizli.has(k);
  const tur = bosDurum(suzgec);
  return (
    <div className="tablo-kutusu">
      <table className="veri-tablosu" aria-label="Sevkiyatlar">
        <thead>
          <tr>
            <th>Gönderi</th>
            <th>Belge no</th>
            <th>Cari</th>
            {gorunur.map((s) => (
              <th key={s.anahtar} className={SINIF[s.anahtar]}>
                {s.baslik}
              </th>
            ))}
            <th>Durum</th>
          </tr>
        </thead>
        <tbody>
          {satirlar.length === 0 && (
            <BosDurum
              colSpan={4 + gorunur.length}
              ikon={tur === "suzgecli" ? "filtrele" : "yeni"}
              baslik={tur === "suzgecli" ? "Bu süzgeçlere uyan sevkiyat yok." : "Henüz sevkiyat yok."}
              temizleAdresi={tur === "suzgecli" ? "/shipping" : undefined}
            />
          )}
          {satirlar.map((v) => (
            <tr key={v.id}>
              <td className="whitespace-nowrap text-slate-500">{v.shippedAt ? formatDateTime(v.shippedAt) : "—"}</td>
              <td className="whitespace-nowrap text-slate-700">
                {v.documentNo}
                <Link href={`/orders/${v.siparis.id}#fatura-${v.documentNo}`} className={`block text-xs ${BAGLANTI}`}>
                  Fatura bilgisi
                </Link>
              </td>
              <td className="font-medium text-slate-900">{v.cari}</td>
              {acik("siparis") && (
                <td className={SINIF.siparis}>
                  <Link href={`/orders?detay=${v.siparis.id}`} className={BAGLANTI}>
                    {v.siparis.documentNo}
                  </Link>
                </td>
              )}
              {acik("firma") && <td className="text-slate-700 oncelik-dusuk">{v.firma ?? "—"}</td>}
              {acik("takip") && (
                <td className="text-slate-700">
                  {v.takipLinki ? (
                    <a href={v.takipLinki} target="_blank" rel="noopener noreferrer" className={BAGLANTI}>
                      {v.takipNo}
                    </a>
                  ) : (
                    (v.takipNo ?? "—")
                  )}
                </td>
              )}
              {acik("irsaliye") && <td className="text-slate-500 oncelik-dusuk">{v.irsaliyeNo ?? "—"}</td>}
              {acik("adet") && <td className="sayi">{v.adet}</td>}
              <td>
                <StatusBadge status={v.durum} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
