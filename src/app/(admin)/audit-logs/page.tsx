import Link from "next/link";
import { cookies } from "next/headers";

import { DetayPaneli, KayitYokPaneli } from "@/components/denetim/DetayPaneli";
import { ImlecSayfalama } from "@/components/denetim/ImlecSayfalama";
import { IslemTuruRozeti } from "@/components/denetim/IslemTuruRozeti";
import { Ikon } from "@/components/Ikon";
import { AcilirPanel } from "@/components/liste/AcilirPanel";
import { BosDurum } from "@/components/liste/BosDurum";
import { EtkinSuzgecler } from "@/components/liste/EtkinSuzgecler";
import { HizliSekmeler } from "@/components/liste/HizliSekmeler";
import { SutunSecici } from "@/components/liste/SutunSecici";
import { SuzgecFormu } from "@/components/liste/SuzgecFormu";
import { KONTROL_TEK_SATIR, buton } from "@/components/stil";
import { Card, PageHeader } from "@/components/ui";
import { AUDIT_ACTION_LABELS, ISLEM_TURU_ETIKETI, MODUL_ETIKETI } from "@/lib/denetim/olaylar";
import { varlikEtiketi } from "@/lib/denetim/ozet";
import { denetimKaydi, denetimKpileri, denetimListesi, kullaniciSecenekleri } from "@/lib/denetim/sorgu";
import { SUTUNLAR, SUTUN_CEREZI } from "@/lib/denetim/sutunlar";
import {
  SISTEM,
  bosDurum,
  denetimAdresi,
  etkinSekme,
  etkinSuzgecler,
  hizliSekmeler,
  suzgecCoz,
  tarihSekmesiAdresi,
  type Imlec,
} from "@/lib/denetim/suzgec";
import { formatDateTime } from "@/lib/format";
import { kpiGetir } from "@/lib/kpi/getir";
import { gizliSutunlariCoz } from "@/lib/liste/sutunlar";
import { ROLE_LABEL } from "@/lib/roles";
import { requireAdmin } from "@/lib/session";
import { simdi, yerelGunMetni } from "@/lib/zaman";
import { KpiKartlari } from "./KpiKartlari";
import { sutunlariKaydet } from "./sutunEylemi";

/** Listede kalınan yer; detay açılıp kapanınca aynı sayfaya dönülür. */
const imlecParametresi = (i: Imlec) => (i === null ? {} : i.yon === "once" ? { once: i.seq } : { sonra: i.seq });

const ETIKET = "mb-1 block font-medium text-slate-700";

function Alan({ id, etiket, children }: { id: string; etiket: string; children: React.ReactNode }) {
  return (
    <div className="text-sm">
      <label htmlFor={id} className={ETIKET}>
        {etiket}
      </label>
      {children}
    </div>
  );
}

/**
 * Denetim kaydı (KARARLAR X-18): üç katman — süzgeçli liste, sağdan detay paneli, alan bazlı fark.
 * Yalnız `YONETICI` (D-2); salt okunur, kayıt değiştirilemez ve silinemez (X-18 §(1)). Üstte "bugün ne oldu"
 * kartları, tarih kısayolları, açılır süzgeç, etkin etiketler ve sütun seçici (spec Ü-28).
 */
export default async function DenetimKaydiSayfasi({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireAdmin();
  const bugun = yerelGunMetni(simdi());
  const { suzgec, imlec, kayit } = suzgecCoz(await searchParams);
  const gizli = gizliSutunlariCoz(SUTUNLAR, (await cookies()).get(SUTUN_CEREZI)?.value);
  const [sayfa, kullanicilar, detay, kpi] = await Promise.all([
    denetimListesi(suzgec, imlec),
    kullaniciSecenekleri(),
    kayit ? denetimKaydi(kayit) : null,
    kpiGetir(() => denetimKpileri(bugun), { yol: "/audit-logs", kullaniciId: session.user.id }),
  ]);
  const yer = imlecParametresi(imlec);
  const listeAdresi = denetimAdresi(suzgec, yer);
  const etiketler = etkinSuzgecler(suzgec, (id) => kullanicilar.find((k) => k.id === id)?.name);
  const sekmeler = hizliSekmeler(bugun);
  const etkin = etkinSekme(sekmeler, suzgec);
  const acik = (k: (typeof SUTUNLAR)[number]["anahtar"]) => !gizli.has(k);
  const tur = bosDurum(suzgec);

  return (
    <div>
      <PageHeader
        title="Denetim Kaydı"
        description="Sistemdeki işlemlerin değiştirilemez kaydı; her kayıt zincirle mühürlüdür. Salt okunur."
      />

      <KpiKartlari sonuc={kpi} bugun={bugun} />

      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-start gap-2">
          <HizliSekmeler sekmeler={sekmeler.map((f) => ({ etiket: f.etiket, adres: tarihSekmesiAdresi(suzgec, f.tarih), etkin: f.etiket === etkin }))} />
          <div className="ml-auto flex flex-wrap items-start gap-2">
            <AcilirPanel key={denetimAdresi(suzgec)} className="relative">
              <summary className={`${buton("ikincil")} cursor-pointer list-none`}>
                <Ikon ad="filtrele" />
                {etiketler.length > 0 ? `Filtrele · ${etiketler.length}` : "Filtrele"}
              </summary>
              <SuzgecFormu
                action="/audit-logs"
                anahtar={denetimAdresi(suzgec)}
                aria-label="Denetim kaydı süzgeci"
                className="absolute right-0 z-20 mt-2 grid w-[min(36rem,calc(100vw-2rem))] gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-lg sm:grid-cols-2"
              >
                <Alan id="denetim-baslangic" etiket="Başlangıç">
                  <input type="date" id="denetim-baslangic" name="baslangic" defaultValue={suzgec.baslangic ?? ""} className={KONTROL_TEK_SATIR} />
                </Alan>
                <Alan id="denetim-bitis" etiket="Bitiş">
                  <input type="date" id="denetim-bitis" name="bitis" defaultValue={suzgec.bitis ?? ""} className={KONTROL_TEK_SATIR} />
                </Alan>
                <Alan id="denetim-kullanici" etiket="Kullanıcı">
                  <select id="denetim-kullanici" name="kullanici" defaultValue={suzgec.kullanici ?? ""} className={KONTROL_TEK_SATIR}>
                    <option value="">Tümü</option>
                    <option value={SISTEM}>Sistem / anonim</option>
                    {kullanicilar.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.name}
                        {k.isActive ? "" : " (pasif)"}
                      </option>
                    ))}
                  </select>
                </Alan>
                <Alan id="denetim-modul" etiket="Modül">
                  <select id="denetim-modul" name="modul" defaultValue={suzgec.modul ?? ""} className={KONTROL_TEK_SATIR}>
                    <option value="">Tümü</option>
                    {Object.entries(MODUL_ETIKETI).map(([deger, etiket]) => (
                      <option key={deger} value={deger}>
                        {etiket}
                      </option>
                    ))}
                  </select>
                </Alan>
                <Alan id="denetim-tur" etiket="İşlem türü">
                  <select id="denetim-tur" name="tur" defaultValue={suzgec.tur ?? ""} className={KONTROL_TEK_SATIR}>
                    <option value="">Tümü</option>
                    {Object.entries(ISLEM_TURU_ETIKETI).map(([deger, etiket]) => (
                      <option key={deger} value={deger}>
                        {etiket}
                      </option>
                    ))}
                  </select>
                </Alan>
                <Alan id="denetim-olay" etiket="Olay">
                  <select id="denetim-olay" name="olay" defaultValue={suzgec.olay ?? ""} className={KONTROL_TEK_SATIR}>
                    <option value="">Tümü</option>
                    {Object.entries(AUDIT_ACTION_LABELS).map(([deger, etiket]) => (
                      <option key={deger} value={deger}>
                        {etiket}
                      </option>
                    ))}
                  </select>
                </Alan>
                <div className="flex items-center gap-3 sm:col-span-2">
                  <button type="submit" className={buton("birincil")}>
                    <Ikon ad="filtrele" />
                    Uygula
                  </button>
                  <Link href="/audit-logs" scroll={false} className={buton("metin")}>
                    <Ikon ad="vazgec" />
                    Temizle
                  </Link>
                </div>
              </SuzgecFormu>
            </AcilirPanel>
            <SutunSecici sutunlar={SUTUNLAR} gizli={gizli} action={sutunlariKaydet} donus={listeAdresi} />
          </div>
        </div>
        <EtkinSuzgecler etiketler={etiketler} />
      </div>

      <Card>
        <div className="tablo-kutusu">
          <table className="veri-tablosu" aria-label="Denetim kayıtları">
            <thead>
              <tr>
                <th>Zaman</th>
                <th>Kullanıcı</th>
                <th>İşlem türü</th>
                {acik("modul") && <th className="oncelik-dusuk">Modül / varlık</th>}
                {acik("ozet") && <th>Özet</th>}
                <th>
                  <span className="sr-only">Detay</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sayfa.satirlar.length === 0 && (
                <BosDurum
                  colSpan={6 - gizli.size}
                  ikon="filtrele"
                  baslik={tur === "suzgecli" ? "Bu süzgeçlere uyan kayıt yok." : "Henüz kayıt yok."}
                  temizleAdresi={tur === "suzgecli" ? "/audit-logs" : undefined}
                />
              )}
              {sayfa.satirlar.map((s) => (
                <tr key={s.id}>
                  <td className="whitespace-nowrap text-slate-500">
                    <time dateTime={s.createdAt.toISOString()}>{formatDateTime(s.createdAt)}</time>
                  </td>
                  <td className="whitespace-nowrap">
                    {s.aktor ? (
                      <>
                        <span className="text-slate-900">{s.aktor}</span>
                        {s.actorRole && <span className="block text-xs text-slate-500">{ROLE_LABEL[s.actorRole]}</span>}
                      </>
                    ) : (
                      <span className="text-slate-500">Sistem / anonim</span>
                    )}
                  </td>
                  <td>
                    <IslemTuruRozeti tur={s.actionType} />
                  </td>
                  {acik("modul") && (
                    <td className="oncelik-dusuk whitespace-nowrap">
                      <span className="text-slate-900">{MODUL_ETIKETI[s.module]}</span>
                      {/* Belge no özettedir; varlık türü modülle aynıysa tekrarlanmaz. */}
                      {varlikEtiketi(s.entityType) !== MODUL_ETIKETI[s.module] && (
                        <span className="block text-xs text-slate-500">{varlikEtiketi(s.entityType)}</span>
                      )}
                    </td>
                  )}
                  {acik("ozet") && <td className="text-slate-700">{s.ozet}</td>}
                  <td className="text-right">
                    <Link href={denetimAdresi(suzgec, { ...yer, kayit: s.id })} scroll={false} data-kayit={s.id} className={buton("metin")}>
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

      <ImlecSayfalama
        dahaYeni={sayfa.dahaYeni === null ? null : denetimAdresi(suzgec, { sonra: sayfa.dahaYeni })}
        dahaEski={sayfa.dahaEski === null ? null : denetimAdresi(suzgec, { once: sayfa.dahaEski })}
      />

      {kayit &&
        (detay ? (
          <DetayPaneli key={kayit} detay={detay} kapatAdresi={listeAdresi} />
        ) : (
          <KayitYokPaneli kapatAdresi={listeAdresi} kayitId={kayit} />
        ))}
    </div>
  );
}
