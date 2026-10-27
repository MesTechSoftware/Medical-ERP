import { Ikon, type IkonAdi } from "@/components/Ikon";
import { StatusChip, type Ton } from "@/components/ui";
import type { AuditActionType } from "@/generated/prisma/enums";
import { ISLEM_TURU_ETIKETI } from "@/lib/denetim/olaylar";

/**
 * İşlem türü rozeti (KARARLAR X-18 §(9)). Tonlar ADR-009'dan: mavi bağlantıya ayrılmıştır, Güncelleme
 * ve Oturum nötrdür; türü renk değil ikon ve metin ayırır.
 */
const GORUNUM: Record<AuditActionType, { ton: Ton; ikon: IkonAdi }> = {
  EKLEME: { ton: "olumlu", ikon: "yeni" },
  GUNCELLEME: { ton: "notr", ikon: "duzenle" },
  SILME: { ton: "hata", ikon: "sil" },
  OTURUM: { ton: "notr", ikon: "giris" },
};

export function IslemTuruRozeti({ tur }: { tur: AuditActionType }) {
  const { ton, ikon } = GORUNUM[tur];
  return (
    <StatusChip ton={ton}>
      <Ikon ad={ikon} />
      {ISLEM_TURU_ETIKETI[tur]}
    </StatusChip>
  );
}
