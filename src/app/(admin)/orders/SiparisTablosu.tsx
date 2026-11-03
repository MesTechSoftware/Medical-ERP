import Link from "next/link";
import { Card, LinkButton, StatusBadge, StatusChip } from "@/components/ui";
import { Ikon } from "@/components/Ikon";
import { BosDurum } from "@/components/liste/BosDurum";
import { OnayEtiketi } from "@/components/OnayEtiketi";
import { buton } from "@/components/stil";
import { Tutar } from "@/components/Tutar";
import { formatDate } from "@/lib/format";
import type { SiparisSatiri } from "@/lib/siparis-listesi/sorgu";
import { SUTUNLAR, type SiparisSutunu } from "@/lib/siparis-listesi/sutunlar";
import { bosDurum, siparisAdresi, type SiparisSuzgeci } from "@/lib/siparis-listesi/suzgec";
import { SATIR_TABANI, tabanli } from "@/lib/taban";

const SINIF: Partial<Record<SiparisSutunu, string>> = {
  belgeNo: "whitespace-nowrap",
  klinik: "oncelik-dusuk",
  satici: "oncelik-dusuk",
  tutar: "sayi",
  sevk: "sayi",
};
const BASLIK: Partial<Record<SiparisSutunu, string>> = { tutar: tabanli("Tutar", SATIR_TABANI.toplam) };

/** Sevk sütunu: hiç sevk yoksa "—", yoksa "sevk / adet" (bedelsiz dahil, A-3-2). */
export function sevkMetni(sevk: number, adet: number): string {
  return sevk === 0 ? "—" : `${sevk} / ${adet}`;
}

/**
 * Sipariş tablosu (spec Ü-23 §3.4). Gizli sütunun başlığı ve hücresi çizilmez. Cari adı yan paneli açar;
 * teklif ve onay bloğu (A-8) çipleri adın yanındadır.
 */
export function SiparisTablosu({
  satirlar,
  gizli,
  suzgec,
  yer,
}: {
  satirlar: SiparisSatiri[];
  gizli: ReadonlySet<SiparisSutunu>;
  suzgec: SiparisSuzgeci;
  yer: { page?: number; per?: number };
}) {
  const gorunur = SUTUNLAR.filter((s) => !gizli.has(s.anahtar));
  const acik = (k: SiparisSutunu) => !gizli.has(k);
  const tur = bosDurum(suzgec);

  return (
    <Card>
      <div className="tablo-kutusu">
        <table className="veri-tablosu">
          <thead>
            <tr>
              <th>Tarih</th>
              {acik("belgeNo") && <th className={SINIF.belgeNo}>Belge no</th>}
              <th>Cari</th>
              {gorunur
                .filter((s) => s.anahtar !== "belgeNo")
                .map((s) => (
                  <th key={s.anahtar} className={SINIF[s.anahtar]}>
                    {BASLIK[s.anahtar] ?? s.baslik}
                  </th>
                ))}
              <th>Durum</th>
              <th className="sayi">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {satirlar.length === 0 && (
              <BosDurum
                colSpan={4 + gorunur.length}
                ikon={tur === "suzgecli" ? "filtrele" : "yeni"}
                baslik={tur === "suzgecli" ? "Bu süzgeçlere uyan sipariş yok." : "Henüz sipariş yok."}
                temizleAdresi={tur === "suzgecli" ? "/orders" : undefined}
                eylem={
                  tur === "hic-kayit" ? (
                    <LinkButton href="/orders/new" ikon="yeni">
                      Yeni Sipariş
                    </LinkButton>
                  ) : undefined
                }
              />
            )}
            {satirlar.map((o) => (
              <tr key={o.id}>
                <td className="whitespace-nowrap text-slate-500">{formatDate(o.orderDate)}</td>
                {acik("belgeNo") && <td className="whitespace-nowrap text-slate-600">{o.documentNo}</td>}
                <td className="font-medium text-slate-900">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Cari adı yan paneli açar (spec §3.5); kapanınca odak `data-kayit` ile buraya döner. */}
                    <Link
                      href={siparisAdresi(suzgec, { ...yer, detay: o.id })}
                      scroll={false}
                      data-kayit={o.id}
                      className="inline-flex items-center gap-0.5 text-link underline decoration-link/40 underline-offset-4 hover:decoration-link"
                    >
                      <span>{o.cari.fullName}</span>
                      <Ikon ad="sonraki" />
                    </Link>
                    {o.stage === "TEKLIF" && <StatusChip ton="notr">Teklif</StatusChip>}
                    <OnayEtiketi durum={o.onay} />
                  </div>
                </td>
                {acik("klinik") && <td className="text-slate-500 oncelik-dusuk">{o.cari.clinic ?? "—"}</td>}
                {acik("satici") && <td className="text-slate-600 oncelik-dusuk">{o.satici ?? "—"}</td>}
                {acik("tutar") && (
                  <td className="sayi">
                    <Tutar deger={o.toplam} taban={SATIR_TABANI.toplam} baslikta />
                  </td>
                )}
                {acik("sevk") && <td className="sayi whitespace-nowrap">{sevkMetni(o.sevk, o.adet)}</td>}
                <td>
                  <StatusBadge status={o.status} />
                </td>
                <td className="text-right">
                  <Link href={`/orders/${o.id}`} className={buton("metin")}>
                    <Ikon ad="detay" />
                    Detay
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
