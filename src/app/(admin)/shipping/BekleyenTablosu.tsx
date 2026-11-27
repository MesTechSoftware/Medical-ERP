import Link from "next/link";
import { OnayEtiketi } from "@/components/OnayEtiketi";
import { BAGLANTI, KONTROL_TEK_SATIR, buton } from "@/components/stil";
import { Tutar } from "@/components/Tutar";
import { Ikon } from "@/components/Ikon";
import { StatusChip } from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/format";
import type { BekleyenSatir } from "@/lib/kargo-listesi/sorgu";
import { onayBaglantisi } from "@/lib/kargo-listesi/onay-baglantisi";
import { SATIR_TABANI, tabanli } from "@/lib/taban";
import { TopluKargoFormu } from "./TopluKargoFormu";

/** Kalan sütunu: "N kalem · M adet"; kısmi sevk yapılmışsa "M / toplam adet" eklenir. */
export function kalanMetni(r: Pick<BekleyenSatir, "kalanKalem" | "kalanAdet" | "adet">): string {
  const temel = `${r.kalanKalem} kalem · ${r.kalanAdet} adet`;
  return r.kalanAdet < r.adet ? `${temel} (${r.kalanAdet} / ${r.adet})` : temel;
}

/**
 * Kargo bekleyenler (spec Ü-24 §3.3, 12-A): satır başına seçim, takip ve irsaliye; onay bloğu açık ya da
 * reddedilmiş sipariş seçilemez (A-8 — sunucu yine reddeder). "Kısmi sevk" kart formunu yan panelde açar.
 */
export function BekleyenTablosu({
  satirlar,
  firmalar,
  kismiAdresi,
  yonetici,
}: {
  satirlar: readonly BekleyenSatir[];
  firmalar: readonly { id: string; name: string }[];
  kismiAdresi: (id: string) => string;
  /** Onay ekranı yalnız yöneticinindir: rozet bağlantı olur; OPERASYON'da düz etiket ve bilgi notu (A-8-14). */
  yonetici: boolean;
}) {
  if (satirlar.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">Kargo bekleyen sipariş yok.</p>;
  }
  return (
    <TopluKargoFormu firmalar={firmalar}>
      <div className="tablo-kutusu">
        <table className="veri-tablosu" aria-label="Kargo bekleyenler">
          <thead>
            <tr>
              <th>
                <span className="sr-only">Seç</span>
              </th>
              <th>Tarih</th>
              <th>Sipariş</th>
              <th>Cari</th>
              <th>Kalan</th>
              <th className="sayi oncelik-dusuk">{tabanli("Tutar", SATIR_TABANI.toplam)}</th>
              <th>Takip no</th>
              <th>İrsaliye no</th>
              <th className="sayi">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {satirlar.map((r) => (
              <tr key={r.id} data-kargo-satiri={r.id}>
                <td>
                  <input
                    type="checkbox"
                    name="secili"
                    value={r.id}
                    disabled={r.onay !== undefined}
                    aria-label={`${r.documentNo} seç`}
                    className="size-4"
                  />
                </td>
                <td className="whitespace-nowrap text-slate-500">{formatDate(r.orderDate)}</td>
                <td className="whitespace-nowrap">
                  <Link href={`/orders?detay=${r.id}`} className={BAGLANTI}>
                    {r.documentNo}
                  </Link>
                </td>
                <td className="font-medium text-slate-900">
                  <div className="flex flex-wrap items-center gap-2">
                    <span>{r.cari.fullName}</span>
                    <OnayEtiketi durum={r.onay} href={yonetici ? (onayBaglantisi(r) ?? undefined) : undefined} />
                  </div>
                  {r.onay === "BEKLIYOR" && !yonetici && <div className="text-xs font-normal text-slate-500">Yönetici onayı bekleniyor</div>}
                  {r.faturaEksik && (
                    <div className="mt-1">
                      <StatusChip ton="uyari">Fatura bilgisi eksik</StatusChip>
                    </div>
                  )}
                  {r.onay === "RED" && <RedNotu r={r} />}
                  {r.cari.clinic && <div className="text-xs font-normal text-slate-500">{r.cari.clinic}</div>}
                </td>
                <td className="whitespace-nowrap text-slate-700">{kalanMetni(r)}</td>
                <td className="sayi oncelik-dusuk">
                  <Tutar deger={r.toplam} taban={SATIR_TABANI.toplam} baslikta />
                </td>
                <td>
                  <input
                    name={`takip_${r.id}`}
                    aria-label={`${r.documentNo} takip no`}
                    placeholder="Takip no"
                    className={`w-36 ${KONTROL_TEK_SATIR}`}
                  />
                </td>
                <td>
                  <input
                    name={`irsaliye_${r.id}`}
                    aria-label={`${r.documentNo} irsaliye no`}
                    maxLength={32}
                    className={`w-28 ${KONTROL_TEK_SATIR}`}
                  />
                </td>
                <td className="text-right">
                  <Link href={kismiAdresi(r.id)} scroll={false} data-kayit={r.id} className={buton("metin")}>
                    <Ikon ad="kismiSevk" />
                    Kısmi sevk
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TopluKargoFormu>
  );
}

/** Reddedilen siparişin red notu; bedelsiz/iskonto reddinde sipariş iptal edilmelidir (A-8-18, S7). */
export function RedNotu({ r }: { r: Pick<BekleyenSatir, "id" | "redNotu"> }) {
  if (!r.redNotu) return null;
  const iptal = r.redNotu.kural === "BEDELSIZ_ONAYI" || r.redNotu.kural === "ISKONTO_TAVANI";
  return (
    <div className="text-xs font-normal text-slate-500">
      {iptal && (
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip ton="hata">Reddedildi — sipariş iptal edilmeli</StatusChip>
          <Link href={`/orders/${r.id}`} className={BAGLANTI}>
            Sipariş detayı
          </Link>
        </div>
      )}
      {r.redNotu.not && <div>“{r.redNotu.not}”{r.redNotu.tarih ? ` · ${formatDateTime(r.redNotu.tarih)}` : ""}</div>}
    </div>
  );
}
