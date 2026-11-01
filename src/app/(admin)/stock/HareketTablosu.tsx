import Link from "next/link";
import { Ikon } from "@/components/Ikon";
import { BosDurum } from "@/components/liste/BosDurum";
import { StatusChip } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import type { StokHareketSatiri } from "@/lib/stok-listesi/sorgu";
import { SUTUNLAR, type StokSutunu } from "@/lib/stok-listesi/sutunlar";

/** Gizlenebilir sütunların başlık sınıfı (dar ekranda Konum ve Açıklama gizlenir). */
const SINIF: Partial<Record<StokSutunu, string>> = { konum: "oncelik-dusuk", aciklama: "oncelik-dusuk" };

/**
 * Stok hareket geçmişi (spec Ü-20 §3.4). Gizli sütunun başlığı ve hücresi çizilmez. Yön rengi yoktur:
 * miktar `+`/`−` işaretiyle okunur (ADR-009 §2). Ürün adı Ürünler ekranının yan panelini açar.
 */
export function HareketTablosu({
  satirlar,
  gizli,
  suzgecli,
}: {
  satirlar: StokHareketSatiri[];
  gizli: ReadonlySet<StokSutunu>;
  suzgecli: boolean;
}) {
  const gorunur = SUTUNLAR.filter((s) => !gizli.has(s.anahtar));
  const acik = (k: StokSutunu) => !gizli.has(k);
  return (
    <div className="tablo-kutusu">
      <table className="veri-tablosu">
        <thead>
          <tr>
            <th>Tarih</th>
            <th>Ürün</th>
            {acik("tur") && <th>Tür</th>}
            {acik("konum") && <th className="oncelik-dusuk">Konum</th>}
            <th className="sayi">Miktar</th>
            {acik("aciklama") && <th className="oncelik-dusuk">Açıklama</th>}
            {acik("yapan") && <th>İşlemi yapan</th>}
          </tr>
        </thead>
        <tbody>
          {satirlar.length === 0 && (
            <BosDurum
              colSpan={3 + gorunur.length}
              ikon={suzgecli ? "filtrele" : "yeni"}
              baslik={suzgecli ? "Bu süzgeçlere uyan hareket bulunamadı." : "Henüz stok hareketi yok."}
              temizleAdresi={suzgecli ? "/stock" : undefined}
            />
          )}
          {satirlar.map((h) => (
            <tr key={h.id} data-hareket={h.id}>
              <td className="whitespace-nowrap text-slate-500">{formatDateTime(h.createdAt)}</td>
              <td className="text-slate-900">
                <Link
                  href={`/products?detay=${h.urun.id}`}
                  className="inline-flex items-center gap-0.5 text-link underline decoration-link/40 underline-offset-4 hover:decoration-link"
                >
                  <span>{h.urun.name}</span>
                  <Ikon ad="sonraki" />
                </Link>
                <span className="ml-1 text-xs text-slate-400">{h.urun.code}</span>
              </td>
              {acik("tur") && (
                <td data-sutun="tur" className="whitespace-nowrap">
                  <StatusChip ton="notr">{h.tur}</StatusChip>
                  {h.belgeNo && <span className="ml-1 text-xs text-slate-500">{h.belgeNo}</span>}
                </td>
              )}
              {acik("konum") && <td className={SINIF.konum}>{h.konum}</td>}
              <td className="sayi">
                {h.miktar > 0 ? "+" : "−"}
                {Math.abs(h.miktar)}
              </td>
              {acik("aciklama") && <td className={`text-slate-500 ${SINIF.aciklama}`}>{h.not}</td>}
              {acik("yapan") && <td>{h.yapan ?? <span className="text-slate-400">—</span>}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
