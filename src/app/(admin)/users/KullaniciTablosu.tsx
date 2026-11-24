import Link from "next/link";
import { Card, LinkButton, StatusBadge, StatusChip } from "@/components/ui";
import { Ikon } from "@/components/Ikon";
import { BosDurum } from "@/components/liste/BosDurum";
import { BAGLANTI, buton } from "@/components/stil";
import { formatDateTime } from "@/lib/format";
import type { KullaniciSatiri } from "@/lib/kullanici-listesi/sorgu";
import { SUTUNLAR, type KullaniciSutunu } from "@/lib/kullanici-listesi/sutunlar";
import { bosDurum, kullaniciAdresi, type KullaniciSuzgeci } from "@/lib/kullanici-listesi/suzgec";
import { ROLE_LABEL } from "@/lib/roles";

const SINIF: Partial<Record<KullaniciSutunu, string>> = { iletisim: "oncelik-dusuk", portfoy: "sayi" };

/**
 * Kullanıcılar tablosu (spec Ü-22 §3.4). Gizli sütunun başlığı ve hücresi çizilmez. Ad yan paneli açar;
 * Düzenle yalnız YONETICI (E-2, D-2).
 */
export function KullaniciTablosu({
  satirlar,
  gizli,
  yonetici,
  suzgec,
  yer,
}: {
  satirlar: KullaniciSatiri[];
  gizli: ReadonlySet<KullaniciSutunu>;
  yonetici: boolean;
  suzgec: KullaniciSuzgeci;
  yer: { page?: number; per?: number };
}) {
  const gorunur = SUTUNLAR.filter((s) => !gizli.has(s.anahtar));
  const acik = (k: KullaniciSutunu) => !gizli.has(k);
  const tur = bosDurum(suzgec);

  return (
    <Card>
      <div className="tablo-kutusu">
        <table className="veri-tablosu">
          <thead>
            <tr>
              <th>Kullanıcı</th>
              {gorunur.map((s) => (
                <th key={s.anahtar} className={SINIF[s.anahtar]}>
                  {s.baslik}
                </th>
              ))}
              <th className="sayi">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {satirlar.length === 0 && (
              <BosDurum
                colSpan={2 + gorunur.length}
                ikon={tur === "suzgecli" ? "filtrele" : "yeni"}
                baslik={tur === "suzgecli" ? "Bu süzgeçlere uyan kullanıcı yok." : "Henüz kullanıcı yok."}
                temizleAdresi={tur === "suzgecli" ? "/users" : undefined}
                eylem={
                  tur === "hic-kayit" && yonetici ? (
                    <LinkButton href="/users/new" ikon="yeni">
                      Yeni Kullanıcı
                    </LinkButton>
                  ) : undefined
                }
              />
            )}
            {satirlar.map((u) => (
              <tr key={u.id}>
                <td className="font-medium text-slate-900">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Ad yan paneli açar (spec §3.5); kapanınca odak `data-kayit` ile buraya döner. */}
                    <Link
                      href={kullaniciAdresi(suzgec, { ...yer, detay: u.id })}
                      scroll={false}
                      data-kayit={u.id}
                      className={`inline-flex items-center gap-0.5 ${BAGLANTI}`}
                    >
                      <span>{u.name}</span>
                      <Ikon ad="sonraki" />
                    </Link>
                    {u.geciciParola && <StatusChip ton="uyari">Geçici parola</StatusChip>}
                  </div>
                </td>
                {acik("rol") && <td className="text-slate-600">{ROLE_LABEL[u.role]}</td>}
                {acik("iletisim") && (
                  <td className="text-slate-500 oncelik-dusuk">
                    <div>{u.email}</div>
                    {u.phone && <div className="text-xs text-slate-400">{u.phone}</div>}
                  </td>
                )}
                {acik("portfoy") && <td className="sayi">{u.portfoy ?? "—"}</td>}
                {acik("sonEtkinlik") && (
                  <td className="text-slate-500">{u.sonEtkinlik ? formatDateTime(u.sonEtkinlik) : <span className="text-slate-400">Hiç giriş yapmadı</span>}</td>
                )}
                {acik("durum") && (
                  <td>
                    <StatusBadge status={u.isActive ? "AKTIF" : "PASIF"} />
                  </td>
                )}
                <td className="sayi">
                  {yonetici && (
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/users/${u.id}/edit`} className={buton("metin")}>
                        <Ikon ad="duzenle" />
                        Düzenle
                      </Link>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
