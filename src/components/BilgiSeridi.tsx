import { SonucGosterimi } from "@/components/Sonuc";
import { bilgiCoz } from "@/lib/bilgi-seridi";
import { sonucOlustur } from "@/lib/sonuc";

/** Yönlendirmeden sonra `?bilgi=` ile gelen BİLGİ bildirimleri (A-12-6); işlemi engellemez, yalnız bildirir. */
export function BilgiSeridi({ ham }: { ham: string | string[] | undefined }) {
  const bildirimler = bilgiCoz(ham);
  if (bildirimler.length === 0) return null;
  return (
    <div data-bilgi-seridi className="mb-4">
      <SonucGosterimi sonuc={sonucOlustur(bildirimler)} />
    </div>
  );
}
