import Form from "next/form";
import Link from "next/link";

import { DetayPaneli, KayitYokPaneli } from "@/components/denetim/DetayPaneli";
import { ImlecSayfalama } from "@/components/denetim/ImlecSayfalama";
import { IslemTuruRozeti } from "@/components/denetim/IslemTuruRozeti";
import { Ikon } from "@/components/Ikon";
import { KONTROL_TEK_SATIR, buton } from "@/components/stil";
import { Card, EmptyRow, PageHeader } from "@/components/ui";
import { AUDIT_ACTION_LABELS, ISLEM_TURU_ETIKETI, MODUL_ETIKETI } from "@/lib/denetim/olaylar";
import { varlikEtiketi } from "@/lib/denetim/ozet";
import { denetimKaydi, denetimListesi, kullaniciSecenekleri } from "@/lib/denetim/sorgu";
import { SISTEM, denetimAdresi, suzgecCoz, type Imlec } from "@/lib/denetim/suzgec";
import { formatDateTime } from "@/lib/format";
import { ROLE_LABEL } from "@/lib/roles";
import { requireAdmin } from "@/lib/session";

/** Listede kalınan yer; detay açılıp kapanınca aynı sayfaya dönülür. */
const imlecParametresi = (i: Imlec) => (i === null ? {} : i.yon === "once" ? { once: i.seq } : { sonra: i.seq });

/**
 * Denetim kaydı (KARARLAR X-18): üç katman — süzgeçli liste, sağdan detay paneli, alan bazlı fark.
 * Yalnız `YONETICI` (D-2); salt okunur, kayıt değiştirilemez ve silinemez (X-18 §(1)).
 */
export default async function DenetimKaydiSayfasi({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const { suzgec, imlec, kayit } = suzgecCoz(await searchParams);
  const [sayfa, kullanicilar, detay] = await Promise.all([
    denetimListesi(suzgec, imlec),
    kullaniciSecenekleri(),
    kayit ? denetimKaydi(kayit) : null,
  ]);
  const yer = imlecParametresi(imlec);
  const listeAdresi = denetimAdresi(suzgec, yer);

  return (
    <div>
      <PageHeader
        title="Denetim Kaydı"
        description="Sistemdeki işlemlerin değiştirilemez kaydı; her kayıt zincirle mühürlüdür. Salt okunur."
      />

      {/* `next/form` istemci tarafında gezer; süzgeç değişince form yeniden kurulur, yoksa Temizle'den
          sonra <select>'ler eski değeri gösterirdi (React denetimsiz alanı sıfırlamaz). */}
      <div key={denetimAdresi(suzgec)}>
        <Form
          action="/audit-logs"
          prefetch={false}
          aria-label="Denetim kaydı süzgeci"
          className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="text-sm">
            <label htmlFor="denetim-baslangic" className="mb-1 block font-medium text-slate-700">
              Başlangıç
            </label>
            <input type="date" id="denetim-baslangic" name="baslangic" defaultValue={suzgec.baslangic ?? ""} className={KONTROL_TEK_SATIR} />
          </div>
          <div className="text-sm">
            <label htmlFor="denetim-bitis" className="mb-1 block font-medium text-slate-700">
              Bitiş
            </label>
            <input type="date" id="denetim-bitis" name="bitis" defaultValue={suzgec.bitis ?? ""} className={KONTROL_TEK_SATIR} />
          </div>
          <div className="text-sm">
            <label htmlFor="denetim-kullanici" className="mb-1 block font-medium text-slate-700">
              Kullanıcı
            </label>
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
          </div>
          <div className="text-sm">
            <label htmlFor="denetim-modul" className="mb-1 block font-medium text-slate-700">
              Modül
            </label>
            <select id="denetim-modul" name="modul" defaultValue={suzgec.modul ?? ""} className={KONTROL_TEK_SATIR}>
              <option value="">Tümü</option>
              {Object.entries(MODUL_ETIKETI).map(([deger, etiket]) => (
                <option key={deger} value={deger}>
                  {etiket}
                </option>
              ))}
            </select>
          </div>
          <div className="text-sm">
            <label htmlFor="denetim-tur" className="mb-1 block font-medium text-slate-700">
              İşlem türü
            </label>
            <select id="denetim-tur" name="tur" defaultValue={suzgec.tur ?? ""} className={KONTROL_TEK_SATIR}>
              <option value="">Tümü</option>
              {Object.entries(ISLEM_TURU_ETIKETI).map(([deger, etiket]) => (
                <option key={deger} value={deger}>
                  {etiket}
                </option>
              ))}
            </select>
          </div>
          <div className="text-sm">
            <label htmlFor="denetim-olay" className="mb-1 block font-medium text-slate-700">
              Olay
            </label>
            <select id="denetim-olay" name="olay" defaultValue={suzgec.olay ?? ""} className={KONTROL_TEK_SATIR}>
              <option value="">Tümü</option>
              {Object.entries(AUDIT_ACTION_LABELS).map(([deger, etiket]) => (
                <option key={deger} value={deger}>
                  {etiket}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className={buton("birincil", { form: true })}>
            <Ikon ad="filtrele" />
            Filtrele
          </button>
          <Link href="/audit-logs" className="text-sm font-medium text-slate-500 hover:text-slate-800">
            Temizle
          </Link>
        </Form>
      </div>

      <Card>
        <div className="tablo-kutusu">
          <table className="veri-tablosu">
            <thead>
              <tr>
                <th>Zaman</th>
                <th>Kullanıcı</th>
                <th>İşlem türü</th>
                <th className="oncelik-dusuk">Modül / varlık</th>
                <th>Özet</th>
                <th>
                  <span className="sr-only">Detay</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sayfa.satirlar.length === 0 && <EmptyRow colSpan={6} text="Bu süzgeçle kayıt yok." />}
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
                  <td className="oncelik-dusuk whitespace-nowrap">
                    <span className="text-slate-900">{MODUL_ETIKETI[s.module]}</span>
                    {/* Belge no özettedir; varlık türü modülle aynıysa tekrarlanmaz. */}
                    {varlikEtiketi(s.entityType) !== MODUL_ETIKETI[s.module] && (
                      <span className="block text-xs text-slate-500">{varlikEtiketi(s.entityType)}</span>
                    )}
                  </td>
                  <td className="text-slate-700">{s.ozet}</td>
                  <td className="text-right">
                    <Link
                      href={denetimAdresi(suzgec, { ...yer, kayit: s.id })}
                      scroll={false}
                      data-kayit={s.id}
                      className={buton("metin")}
                    >
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
