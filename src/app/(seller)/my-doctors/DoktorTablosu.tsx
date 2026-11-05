import Link from "next/link";
import { Card, LinkButton } from "@/components/ui";
import { Ikon } from "@/components/Ikon";
import { BosDurum } from "@/components/liste/BosDurum";
import { BAGLANTI, buton } from "@/components/stil";
import { BAKIYE_BASLIGI, BakiyeHucresi } from "@/components/doktor/bakiye";
import { DurumRozetleri } from "@/components/doktor/DurumRozetleri";
import { SonSiparisHucresi } from "@/components/doktor/SonSiparisHucresi";
import { bakiyeYonu } from "@/lib/doctor-cari";
import type { DoktorSatiri } from "@/lib/doktor-listesi/sorgu";
import { SATICI_SUTUNLARI, type SutunAnahtari } from "@/lib/doktor-listesi/sutunlar";
import { bosDurum, doktorAdresi, type DoktorSuzgeci } from "@/lib/doktor-listesi/suzgec";
import { formatPhone } from "@/lib/phone";

const YOL = "/my-doctors";

const BASLIK: Record<Exclude<SutunAnahtari, "satici">, { metin: string; sinif?: string }> = {
  klinik: { metin: "Klinik / Bölge", sinif: "oncelik-dusuk" },
  telefon: { metin: "Telefon", sinif: "oncelik-dusuk" },
  siparis: { metin: "Sipariş", sinif: "sayi oncelik-dusuk" },
  sonSiparis: { metin: "Son Sipariş", sinif: "oncelik-dusuk" },
  bakiye: { metin: BAKIYE_BASLIGI, sinif: "sayi" },
  durum: { metin: "Durum" },
};

/**
 * Doktorlarım tablosu (spec Ü-32 §3.3): ad yan paneli açar; Düzenle satırda kalır. Sorumlu satıcı sütunu yoktur.
 * Bakiye K-2 biçimindedir (mutlak tutar + yön); rozetler yönetici listesiyle aynı bileşendir (A-12-5). Eksik fatura
 * işareti yoktur: fatura bilgisi yöneticinin işidir, satıcının formunda alanı yok — düzeltemeyeceği uyarı çizilmez.
 */
export function DoktorTablosu({
  satirlar,
  gizli,
  suzgec,
  yer,
  an,
}: {
  satirlar: DoktorSatiri[];
  gizli: ReadonlySet<SutunAnahtari>;
  suzgec: DoktorSuzgeci;
  yer: { page?: number; per?: number };
  an: Date;
}) {
  const gorunur = SATICI_SUTUNLARI.filter((s) => !gizli.has(s.anahtar)).map((s) => s.anahtar as Exclude<SutunAnahtari, "satici">);
  const acikKume = new Set(gorunur);
  const acik = (k: Exclude<SutunAnahtari, "satici">) => acikKume.has(k);
  const suzgecli = bosDurum(suzgec) !== "hic-kayit";

  return (
    <Card>
      <div className="tablo-kutusu">
        <table className="veri-tablosu" aria-label="Doktorlarım">
          <thead>
            <tr>
              <th>Ad Soyad</th>
              {gorunur.map((k) => (
                <th key={k} className={BASLIK[k].sinif}>
                  {BASLIK[k].metin}
                </th>
              ))}
              <th className="sayi">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {satirlar.length === 0 && (
              <BosDurum
                colSpan={2 + gorunur.length}
                ikon={suzgecli ? "filtrele" : "yeni"}
                baslik={suzgecli ? "Bu süzgeçlere uyan doktor bulunamadı." : "Henüz doktor kaydınız yok."}
                temizleAdresi={suzgecli ? YOL : undefined}
                eylem={
                  suzgecli ? undefined : (
                    <LinkButton href="/my-doctors/new" ikon="yeni">
                      Yeni Doktor
                    </LinkButton>
                  )
                }
              />
            )}
            {satirlar.map((d) => (
              <tr key={d.id}>
                <td className="font-medium text-slate-900">
                  {/* Ad yan paneli açar; kapanınca odak `data-kayit` ile buraya döner. */}
                  <Link
                    href={doktorAdresi(suzgec, { ...yer, detay: d.id }, YOL)}
                    scroll={false}
                    data-kayit={d.id}
                    className={`inline-flex items-center gap-0.5 ${BAGLANTI}`}
                  >
                    <span>
                      {d.title ? `${d.title} ` : ""}
                      {d.fullName}
                    </span>
                    <Ikon ad="sonraki" />
                  </Link>
                </td>
                {acik("klinik") && (
                  <td className="text-slate-500 oncelik-dusuk">
                    {d.clinic}
                    <span className="ml-1 text-xs text-slate-400">{d.region}</span>
                  </td>
                )}
                {acik("telefon") && <td className="tabular-nums text-slate-500 oncelik-dusuk">{formatPhone(d.phoneNormalized)}</td>}
                {acik("siparis") && <td className="sayi oncelik-dusuk">{d._count.orders}</td>}
                {acik("sonSiparis") && <SonSiparisHucresi son={d.sonSiparis} an={an} />}
                {acik("bakiye") && (
                  <td className="sayi whitespace-nowrap">
                    <BakiyeHucresi bakiye={d.risk.bakiye} yon={bakiyeYonu(d.risk.bakiye)} />
                  </td>
                )}
                {acik("durum") && (
                  <td>
                    <DurumRozetleri status={d.status} eksikFatura={false} risk={d.risk} />
                  </td>
                )}
                <td className="text-right">
                  <Link href={`/my-doctors/${d.id}/edit`} className={buton("metin")}>
                    <Ikon ad="duzenle" />
                    Düzenle
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
