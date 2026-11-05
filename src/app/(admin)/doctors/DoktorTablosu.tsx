import Link from "next/link";
import { Card, LinkButton } from "@/components/ui";
import { Ikon } from "@/components/Ikon";
import { BosDurum } from "@/components/liste/BosDurum";
import { bakiyeYonu } from "@/lib/doctor-cari";
import type { DoktorSatiri } from "@/lib/doktor-listesi/sorgu";
import { SUTUNLAR, type SutunAnahtari } from "@/lib/doktor-listesi/sutunlar";
import { bosDurum, doktorAdresi, type BosDurum as BosTur, type DoktorSuzgeci } from "@/lib/doktor-listesi/suzgec";
import { formatPhone } from "@/lib/phone";
import { BAKIYE_BASLIGI, BakiyeHucresi } from "@/components/doktor/bakiye";
import { DurumRozetleri } from "@/components/doktor/DurumRozetleri";
import { SonSiparisHucresi } from "@/components/doktor/SonSiparisHucresi";

/** Sütun başlıkları; Bakiye'nin tabanı başlıktadır (`BAKIYE_BASLIGI` — Ü-3-1). */
const BASLIK: Record<SutunAnahtari, { metin: string; sinif?: string }> = {
  klinik: { metin: "Klinik / Bölge", sinif: "oncelik-dusuk" },
  telefon: { metin: "Telefon", sinif: "oncelik-dusuk" },
  satici: { metin: "Sorumlu Satıcı" },
  siparis: { metin: "Sipariş", sinif: "sayi oncelik-dusuk" },
  sonSiparis: { metin: "Son Sipariş", sinif: "oncelik-dusuk" },
  bakiye: { metin: BAKIYE_BASLIGI, sinif: "sayi" },
  durum: { metin: "Durum" },
};

/** Boş liste metinleri (spec Ü-18 §3.5). */
const BOS: Record<BosTur, { ikon: "yeni" | "onayla" | "filtrele"; baslik: string }> = {
  "hic-kayit": { ikon: "yeni", baslik: "Henüz cari yok." },
  sahipsiz: { ikon: "onayla", baslik: "Sahipsiz cari yok — tüm doktorlar bir satıcıya atanmış." },
  "eksik-fatura": { ikon: "onayla", baslik: "Fatura bilgisi eksik cari yok." },
  suzgecli: { ikon: "filtrele", baslik: "Bu süzgeçlere uyan cari bulunamadı." },
};


/**
 * Cari listesinin tablosu (spec Ü-18 §3.3). Eksik fatura bilgisi olan satır uyarı arka planı taşır
 * (A-13-3). Gizli sütunun başlığı ve hücresi çizilmez. İsim yan paneli açar.
 */
export function DoktorTablosu({
  satirlar,
  gizli,
  devirYetkisi,
  suzgec,
  yer,
  an,
}: {
  satirlar: DoktorSatiri[];
  gizli: ReadonlySet<SutunAnahtari>;
  devirYetkisi: boolean;
  suzgec: DoktorSuzgeci;
  /** Listenin sayfası; panel bağlantısı korur. */
  yer: { page?: number; per?: number };
  an: Date;
}) {
  const gorunur = SUTUNLAR.filter((s) => !gizli.has(s.anahtar)).map((s) => s.anahtar);
  const acik = (k: SutunAnahtari) => !gizli.has(k);

  return (
    <Card>
      <div className="tablo-kutusu">
        <table className="veri-tablosu">
          <thead>
            <tr>
              <th className="w-8"></th>
              <th>Ad Soyad</th>
              {gorunur.map((k) => (
                <th key={k} className={BASLIK[k].sinif}>
                  {BASLIK[k].metin}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {satirlar.length === 0 && (
              <BosHucre tur={bosDurum(suzgec)} colSpan={2 + gorunur.length} yeniCari={devirYetkisi} />
            )}
            {satirlar.map((d) => (
              <tr key={d.id} className={d.eksikFatura ? "bg-critical-bg" : undefined}>
                <td className={d.eksikFatura ? "border-l-2 border-critical" : undefined}>
                  {devirYetkisi && d.accountClass === "DOKTOR" && (
                    <label className="dokunma-hedefi">
                      <input
                        type="checkbox"
                        id={`sec-${d.id}`}
                        name="doctorId"
                        value={d.id}
                        form="toplu-devir"
                        aria-label={`${d.fullName} seç`}
                      />
                    </label>
                  )}
                </td>
                <td className="font-medium text-slate-900">
                  {/* İsim yan paneli açar (spec §3.6); kapanınca odak `data-kayit` ile buraya döner. */}
                  <Link
                    href={doktorAdresi(suzgec, { ...yer, detay: d.id })}
                    scroll={false}
                    data-kayit={d.id}
                    className="inline-flex items-center gap-0.5 text-link underline decoration-link/40 underline-offset-4 hover:decoration-link"
                  >
                    <span>
                      {d.title ? `${d.title} ` : ""}
                      {d.fullName}
                    </span>
                    <Ikon ad="sonraki" />
                  </Link>
                  {d.accountClass === "BAYI" && (
                    <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">Bayi</span>
                  )}
                </td>
                {acik("klinik") && (
                  <td className="text-slate-500 oncelik-dusuk">
                    {d.clinic}
                    <span className="ml-1 text-xs text-slate-400">{d.region}</span>
                  </td>
                )}
                {acik("telefon") && (
                  <td className="tabular-nums text-slate-500 oncelik-dusuk">{formatPhone(d.phoneNormalized)}</td>
                )}
                {acik("satici") && (
                  <td>
                    {d.accountClass === "BAYI" ? (
                      <span className="text-slate-400">—</span>
                    ) : d.ownerSeller ? (
                      <span className="text-slate-900">{d.ownerSeller.name}</span>
                    ) : (
                      <span className="font-medium text-critical">Sahipsiz</span>
                    )}
                  </td>
                )}
                {acik("siparis") && <td className="sayi oncelik-dusuk">{d._count.orders}</td>}
                {acik("sonSiparis") && <SonSiparisHucresi son={d.sonSiparis} an={an} />}
                {acik("bakiye") && (
                  <td className="sayi whitespace-nowrap">
                    <BakiyeHucresi bakiye={d.risk.bakiye} yon={bakiyeYonu(d.risk.bakiye)} />
                  </td>
                )}
                {acik("durum") && (
                  <td>
                    <DurumRozetleri status={d.status} eksikFatura={d.eksikFatura} risk={d.risk} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function BosHucre({ tur, colSpan, yeniCari }: { tur: BosTur; colSpan: number; yeniCari: boolean }) {
  return (
    <BosDurum
      colSpan={colSpan}
      {...BOS[tur]}
      temizleAdresi={tur === "suzgecli" ? "/doctors" : undefined}
      eylem={
        tur === "hic-kayit" && yeniCari ? (
          <LinkButton href="/doctors/new" ikon="yeni">
            Yeni Cari
          </LinkButton>
        ) : undefined
      }
    />
  );
}
