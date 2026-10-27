import { ANA_MENU, gorunurOzetler, type OzetSayfasi } from "@/components/menu";
import { OZET_IZGARASI, SayfaOzeti, type OzetSatiri } from "@/components/SayfaOzeti";
import { BarMicro } from "@/components/grafik/BarMicro";
import { StokMiktari } from "@/components/StokMiktari";
import { Tutar } from "@/components/Tutar";
import type { Role } from "@/generated/prisma/enums";
import { AUDIT_ACTION_LABELS } from "@/lib/audit";
import { VERI_SETLERI } from "@/lib/disa-aktarim";
import { donemCoz } from "@/lib/donem";
import { formatDate, formatDateTime, formatSayi } from "@/lib/format";
import { VERI_TIPI_ADI } from "@/lib/ice-aktarim";
import { kpiGetir } from "@/lib/kpi/getir";
import { cubukOranlari } from "@/lib/kpi/olcek";
import * as oz from "@/lib/sayfa-ozetleri";
import { BRUT, MATRAH } from "@/lib/taban";

type Icerik = { satirlar: OzetSatiri[]; liste?: React.ReactNode };

const uyari = (n: number) => (n > 0 ? ("uyari" as const) : undefined);

/**
 * Dashboard'un sayfa özetleri: menüdeki her sayfa için bir kart, rolün görebildiği sayfalar için
 * (`gorunurOzetler`; yalnız yöneticinin sayfaları OPERASYON'da okunmaz). Her kart kendi hata
 * alanında (`kpiGetir`). Tutarlar `<Tutar>` ile; hakediş yok (D-2).
 */
export async function SayfaOzetleri({ kullanici }: { kullanici: { id: string; role: Role } }) {
  const ay = donemCoz(undefined).aralik;
  const okuyucu: Record<OzetSayfasi, () => Promise<Icerik>> = {
    "/orders": async () => {
      const o = await oz.siparisOzeti(ay);
      return {
        satirlar: [
          { etiket: "Bekliyor", deger: formatSayi(o.bekliyor), ton: uyari(o.bekliyor) },
          { etiket: "Hazırlanıyor", deger: formatSayi(o.hazirlaniyor) },
          { etiket: "Bu ay açılan", deger: formatSayi(o.buAy) },
        ],
      };
    },
    "/shipping": async () => {
      const o = await oz.kargoOzeti(ay);
      const oranlar = cubukOranlari(o.enCok.map((u) => u.miktar));
      return {
        satirlar: [
          { etiket: "Kargolanacak", deger: formatSayi(o.kargolanacak), ton: uyari(o.kargolanacak) },
          { etiket: "Onayda", deger: formatSayi(o.onayda), ton: uyari(o.onayda) },
          { etiket: "Yolda", deger: formatSayi(o.yolda) },
        ],
        liste: (
          <>
            <p className="mb-2 text-xs font-medium text-slate-500">Bu ay en çok sevk edilenler</p>
            <BarMicro
              satirlar={o.enCok.map((u, i) => ({ anahtar: u.urunId, etiket: u.ad, deger: `${formatSayi(u.miktar)} adet`, oran: oranlar[i] }))}
            />
          </>
        ),
      };
    },
    "/approvals": async () => {
      const o = await oz.onayOzeti();
      return {
        satirlar: [
          { etiket: "Karar bekleyen", deger: formatSayi(o.bekleyen), ton: uyari(o.bekleyen) },
          { etiket: "En eskisi", deger: o.enEski ? formatDate(o.enEski) : "—" },
        ],
      };
    },
    "/stock": async () => {
      const o = await oz.stokOzeti();
      return {
        satirlar: [
          { etiket: "Tükendi", deger: formatSayi(o.tukendi), ton: o.tukendi > 0 ? "hata" : undefined },
          { etiket: "Kritik", deger: formatSayi(o.kritik), ton: uyari(o.kritik) },
        ],
        liste:
          o.enDusuk.length === 0 ? (
            <p className="text-xs text-slate-500">Kritik stokta ürün yok.</p>
          ) : (
            <ul className="space-y-1">
              {o.enDusuk.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-slate-700" title={u.name}>
                    {u.name}
                  </span>
                  <StokMiktari miktar={u.stok} />
                </li>
              ))}
            </ul>
          ),
      };
    },
    "/products": async () => {
      const o = await oz.urunOzeti();
      return { satirlar: [{ etiket: "Aktif", deger: formatSayi(o.aktif) }, { etiket: "Pasif", deger: formatSayi(o.pasif) }] };
    },
    "/doctors": async () => {
      const o = await oz.doktorOzeti();
      return {
        satirlar: [
          { etiket: "Aktif", deger: formatSayi(o.aktif) },
          { etiket: "Sahipsiz", deger: formatSayi(o.sahipsiz), ton: uyari(o.sahipsiz), href: "/doctors?sahip=yok" },
          { etiket: "Fatura bilgisi eksik", deger: formatSayi(o.faturaEksik), ton: uyari(o.faturaEksik), href: "/doctors?fatura=eksik" },
        ],
      };
    },
    "/collections": async () => {
      const o = await oz.tahsilatOzeti(ay);
      return {
        satirlar: [{ etiket: "Bu ay", deger: `${formatSayi(o.buAy)} tahsilat` }],
        liste: o.son ? (
          <p>
            <span className="text-slate-500">Son: </span>
            {formatDate(o.son.an)} · {o.son.doktor} · <Tutar deger={o.son.tutar} taban={BRUT} />
          </p>
        ) : (
          <p className="text-xs text-slate-500">Henüz tahsilat yok.</p>
        ),
      };
    },
    "/price-lists": async () => {
      const o = await oz.fiyatListesiOzeti();
      return {
        satirlar: [
          { etiket: "Liste", deger: formatSayi(o.liste) },
          { etiket: "Listesi atanmış cari", deger: formatSayi(o.atanmisCari) },
        ],
      };
    },
    "/users": async () => {
      const o = await oz.kullaniciOzeti();
      return {
        satirlar: [
          { etiket: "Satıcı", deger: formatSayi(o.satici) },
          { etiket: "Operasyon", deger: formatSayi(o.operasyon) },
          { etiket: "Yönetici", deger: formatSayi(o.yonetici) },
          { etiket: "Pasif", deger: formatSayi(o.pasif) },
        ],
      };
    },
    "/reports": async () => {
      const o = await oz.raporOzeti(kullanici, ay);
      return {
        satirlar: [
          { etiket: "Bu ayın satıcı lideri", deger: o.lider ? o.lider.ad : "—" },
          { etiket: "Lider cirosu", deger: o.lider ? <Tutar deger={o.lider.ciro} taban={MATRAH} /> : "—" },
          { etiket: "En çok ciro yapan doktor", deger: o.doktor ? o.doktor.ad : "—" },
        ],
      };
    },
    "/audit-logs": async () => {
      const o = await oz.denetimOzeti();
      return {
        satirlar: [{ etiket: "Bugün", deger: `${formatSayi(o.bugun)} kayıt` }],
        liste: o.son ? (
          <p>
            <span className="text-slate-500">Son: </span>
            {formatDateTime(o.son.createdAt)} · {AUDIT_ACTION_LABELS[o.son.action] ?? o.son.action}
          </p>
        ) : undefined,
      };
    },
    "/imports": async () => {
      const o = await oz.iceAktarimOzeti(ay);
      return {
        satirlar: [{ etiket: "Bu ay", deger: `${formatSayi(o.buAy)} parti` }],
        liste: o.son ? (
          <p>
            <span className="text-slate-500">Son parti: </span>
            {formatDate(o.son.createdAt)} · {VERI_TIPI_ADI[o.son.dataType]}
            {o.son.revertedAt ? " · geri alındı" : ""}
          </p>
        ) : (
          <p className="text-xs text-slate-500">Henüz içe aktarım yok.</p>
        ),
      };
    },
    // D-5 §(5): dışa aktarım kütüğünü okuyan ekran yoktur — yalnız indirilebilen veri setleri.
    "/exports": async () => ({ satirlar: [{ etiket: "Veri seti", deger: formatSayi(VERI_SETLERI.length) }] }),
  };

  const sayfalar = gorunurOzetler(kullanici.role);
  const sonuclar = await Promise.all(sayfalar.map((s) => kpiGetir(okuyucu[s], { yol: "/dashboard", kullaniciId: kullanici.id })));
  const etiket = new Map(ANA_MENU.map((m) => [m.href, m.label]));

  return (
    <div className="@container">
      <div data-sayfa-ozetleri className={OZET_IZGARASI}>
        {sayfalar.map((s, i) => {
          const r = sonuclar[i];
          return <SayfaOzeti key={s} baslik={etiket.get(s) ?? s} href={s} {...(r.tamam ? r.deger : { hataReferansi: r.referans })} />;
        })}
      </div>
    </div>
  );
}
