import { DegisiklikListesi } from "@/components/denetim/DegisiklikListesi";
import { IslemTuruRozeti } from "@/components/denetim/IslemTuruRozeti";
import { Panel, PanelBolumu as Bolum, PanelSatiri, Yok } from "@/components/panel/Panel";
import { Ikon, type IkonAdi } from "@/components/Ikon";
import { StatusChip, type Ton } from "@/components/ui";
import { AUDIT_ACTION_LABELS, MODUL_ETIKETI } from "@/lib/denetim/olaylar";
import { varlikEtiketi } from "@/lib/denetim/ozet";
import type { DenetimDetayi } from "@/lib/denetim/sorgu";
import type { KayitDurumu } from "@/lib/denetim/zincir";
import { formatZamanDamgasi } from "@/lib/format";
import { ROLE_LABEL } from "@/lib/roles";

const BUTUNLUK: Record<KayitDurumu, { ton: Ton; ikon: IkonAdi; metin: string }> = {
  DOGRULANDI: { ton: "olumlu", ikon: "onayla", metin: "Doğrulandı" },
  ICERIK_UYUSMUYOR: { ton: "hata", ikon: "hata", metin: "İçerik mühürle uyuşmuyor" },
  BAG_KOPUK: { ton: "hata", ikon: "hata", metin: "Önceki mühürle bağ kopuk" },
  MUHURSUZ: { ton: "uyari", ikon: "uyari", metin: "Mühürsüz" },
};

const Satir = (p: { ad: string; children: React.ReactNode }) => <PanelSatiri etiket="dar" {...p} />;
const Kod = ({ children }: { children: React.ReactNode }) => <code className="font-mono text-xs">{children}</code>;

/**
 * Detay paneli (KARARLAR X-18 §(9)): kim, ne zaman, hangi istekle, neden, ne değişti ve kayıt
 * bütünlüğü. Salt okunur; düzenleme ya da silme kontrolü yoktur (X-18 §(1)).
 */
export function DetayPaneli({ detay, kapatAdresi }: { detay: DenetimDetayi; kapatAdresi: string }) {
  const { kayit, aktor, ozet, farklar, modulOncesi, muhur, butunluk } = detay;
  const durum = BUTUNLUK[butunluk];
  return (
    <Panel
      kapatAdresi={kapatAdresi}
      kayitId={kayit.id}
      baslik={AUDIT_ACTION_LABELS[kayit.action] ?? kayit.action}
      ozet={ozet}
      ust={
        <>
          <IslemTuruRozeti tur={kayit.actionType} />
          <span className="text-xs text-slate-500">{MODUL_ETIKETI[kayit.module]}</span>
        </>
      }
    >
      <Bolum baslik="Kayıt">
        <dl className="divide-y divide-slate-100">
          <Satir ad="Kullanıcı">
            {aktor ? (
              <>
                {aktor.name}
                <span className="text-slate-500"> · {kayit.actorRole ? ROLE_LABEL[kayit.actorRole] : "rol kaydı yok"}</span>
                <span className="block text-xs text-slate-500">{aktor.email}</span>
              </>
            ) : (
              "Sistem / anonim"
            )}
          </Satir>
          <Satir ad="Zaman">
            {formatZamanDamgasi(kayit.createdAt)}
            <span className="block">
              <Kod>{kayit.createdAt.toISOString()}</Kod>
            </span>
          </Satir>
          <Satir ad="Varlık">
            {varlikEtiketi(kayit.entityType)}
            {kayit.entityId && (
              <span className="block">
                <Kod>{kayit.entityId}</Kod>
              </span>
            )}
          </Satir>
          <Satir ad="Kayıt no">
            <Kod>{kayit.id}</Kod>
          </Satir>
        </dl>
      </Bolum>

      <Bolum baslik="İstek">
        {modulOncesi && (
          <p className="mb-1 text-xs text-slate-500">Bu kayıt modül öncesinde yazıldı; istek bilgisi tutulmadı.</p>
        )}
        <dl className="divide-y divide-slate-100">
          <Satir ad="IP adresi">{kayit.ipAddress ? <Kod>{kayit.ipAddress}</Kod> : <Yok />}</Satir>
          <Satir ad="Oturum">{kayit.sessionId ? <Kod>{kayit.sessionId}</Kod> : <Yok />}</Satir>
          <Satir ad="Uç nokta">
            {kayit.endpoint ? (
              <Kod>
                {kayit.requestMethod ?? ""} {kayit.endpoint}
              </Kod>
            ) : (
              <Yok />
            )}
          </Satir>
          <Satir ad="Gerekçe">{kayit.reason ?? <span className="text-slate-500">Bu işlem gerekçe istemez.</span>}</Satir>
        </dl>
      </Bolum>

      <Bolum baslik="Değişiklikler">
        {modulOncesi && (
          <p className="mb-2 text-xs text-slate-500">Değişiklik listesi önceki ve sonraki hâlden çıkarıldı.</p>
        )}
        <DegisiklikListesi farklar={farklar} />
      </Bolum>

      <Bolum baslik="Bütünlük">
        <div className="flex flex-wrap items-center gap-2 py-1.5">
          <StatusChip ton={durum.ton}>
            <Ikon ad={durum.ikon} />
            {durum.metin}
          </StatusChip>
          {muhur && <span className="text-xs text-slate-500">Zincir sırası {muhur.chainIndex}</span>}
        </div>
        {muhur && (
          <p className="text-xs text-slate-500" title={muhur.hash}>
            SHA-256 <Kod>{muhur.hash.slice(0, 16)}…</Kod>
          </p>
        )}
      </Bolum>
    </Panel>
  );
}

/** Adres çubuğundaki kayıt bulunamazsa panel bunu söyler; liste yerinde kalır. */
export function KayitYokPaneli({ kapatAdresi, kayitId }: { kapatAdresi: string; kayitId: string }) {
  return (
    <Panel kapatAdresi={kapatAdresi} kayitId={kayitId} baslik="Kayıt bulunamadı" />
  );
}
