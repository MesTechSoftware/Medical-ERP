import Link from "next/link";
import { YanPanel } from "@/components/YanPanel";
import { Ikon } from "@/components/Ikon";
import { buton } from "@/components/stil";
import { LinkButton, StatusBadge, StatusChip } from "@/components/ui";
import { ISLEM_TURU_ETIKETI } from "@/lib/denetim/olaylar";
import { formatDate, formatDateTime } from "@/lib/format";
import type { KullaniciPaneli as Veri } from "@/lib/kullanici-listesi/sorgu";
import { policy } from "@/lib/policy";
import { ROLE_LABEL } from "@/lib/roles";

const BASLIK = "kullanici-paneli-baslik";
const BAGLANTI = "text-link underline decoration-link/40 underline-offset-4 hover:decoration-link";

function Satir({ ad, children }: { ad: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-2 py-1.5 text-sm">
      <dt className="text-slate-500">{ad}</dt>
      <dd className="min-w-0 break-words text-slate-900">{children}</dd>
    </div>
  );
}

function Bolum({ baslik, children }: { baslik: string; children: React.ReactNode }) {
  return (
    <section aria-label={baslik}>
      <h3 className="mb-1 text-xs font-medium uppercase text-slate-500">{baslik}</h3>
      {children}
    </section>
  );
}

/**
 * Kullanıcının yan paneli (spec Ü-22 §3.5): özet, oturum, satıcıysa portföy ve son siparişler; yöneticiye
 * prim oranı ve son işlemler (D-2: OPERASYON denetim kaydı görmez — veri zaten `null` gelir).
 */
export function KullaniciPaneli({ veri, kapatAdresi, yonetici }: { veri: Veri; kapatAdresi: string; yonetici: boolean }) {
  const u = veri.kullanici;
  const satici = u.role === "SATICI";
  return (
    <YanPanel kapatAdresi={kapatAdresi} baslikId={BASLIK} kayitId={u.id}>
      <div className="flex h-full flex-col">
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 p-4">
          <div className="min-w-0">
            <h2 id={BASLIK} className="text-base font-semibold text-slate-900">
              {u.name}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-slate-500">{ROLE_LABEL[u.role]}</span>
              <StatusBadge status={u.isActive ? "AKTIF" : "PASIF"} />
              {u.geciciParola && <StatusChip ton="uyari">Geçici parola</StatusChip>}
            </div>
          </div>
          <Link href={kapatAdresi} scroll={false} className={buton("metin")}>
            <Ikon ad="vazgec" />
            Kapat
          </Link>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          <Bolum baslik="Özet">
            <dl className="divide-y divide-slate-100">
              <Satir ad="E-posta">{u.email}</Satir>
              {u.phone && <Satir ad="Telefon">{u.phone}</Satir>}
              <Satir ad="Açılış">{formatDate(u.createdAt)}</Satir>
              {veri.prim && (
                <Satir ad="Prim oranı">{veri.prim.oran ? `%${veri.prim.oran}` : `varsayılan (%${policy.finance.primOraniVarsayilan})`}</Satir>
              )}
            </dl>
          </Bolum>

          <Bolum baslik="Oturum">
            <dl className="divide-y divide-slate-100">
              <Satir ad="Son etkinlik">{u.sonEtkinlik ? formatDateTime(u.sonEtkinlik) : "Hiç giriş yapmadı"}</Satir>
              <Satir ad="Açık oturum">{veri.acikOturum}</Satir>
              {u.geciciParola && <Satir ad="Parola">Geçici — ilk girişte değiştirilecek</Satir>}
            </dl>
          </Bolum>

          {satici && (
            <Bolum baslik="Portföy">
              {veri.cariler.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Portföyünde aktif cari yok.{" "}
                  <Link href="/doctors?satici=yok" className={BAGLANTI}>
                    Sahipsiz cariler
                  </Link>
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {veri.cariler.map((c) => (
                    <li key={c.id} className="py-1.5 text-sm">
                      <Link href={`/doctors?detay=${c.id}`} className={BAGLANTI}>
                        {c.fullName}
                      </Link>
                    </li>
                  ))}
                  {(u.portfoy ?? 0) > veri.cariler.length && (
                    <li className="py-1.5 text-sm text-slate-500">ve {(u.portfoy ?? 0) - veri.cariler.length} cari daha</li>
                  )}
                </ul>
              )}
            </Bolum>
          )}

          {satici && (
            <Bolum baslik="Son siparişler">
              {veri.siparisler.length === 0 ? (
                <p className="text-sm text-slate-400">Sipariş yok.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {veri.siparisler.map((s) => (
                    <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-1.5 text-sm">
                      <span className="min-w-0">
                        <Link href={`/orders/${s.id}`} className={BAGLANTI}>
                          {s.documentNo}
                        </Link>
                        <span className="ml-2 text-slate-500">{formatDate(s.orderDate)}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        {s.stage === "TEKLIF" && <StatusChip ton="notr">Teklif</StatusChip>}
                        <StatusBadge status={s.status} />
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Bolum>
          )}

          {veri.islemler && (
            <Bolum baslik="Son işlemler">
              {veri.islemler.length === 0 ? (
                <p className="text-sm text-slate-400">Denetim kaydında işlemi yok.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {veri.islemler.map((k) => (
                    <li key={k.id} className="py-1.5 text-sm">
                      <Link href={`/audit-logs?kayit=${k.id}`} className={BAGLANTI}>
                        {k.ozet}
                      </Link>
                      <span className="ml-2 text-slate-500">
                        {ISLEM_TURU_ETIKETI[k.actionType]} · {formatDateTime(k.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Bolum>
          )}
        </div>

        <footer className="flex flex-wrap gap-3 border-t border-slate-200 p-4">
          {yonetici && (
            <LinkButton href={`/users/${u.id}/edit`} ikon="duzenle">
              Düzenle
            </LinkButton>
          )}
          {satici && (
            <Link href={`/users/${u.id}`} className={buton("metin")}>
              <Ikon ad="sonraki" />
              Tam detaya git
            </Link>
          )}
        </footer>
      </div>
    </YanPanel>
  );
}
