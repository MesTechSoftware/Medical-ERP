import { SayfaIskeleti } from "@/components/Iskelet";

/** İlk açılışta (kabuk henüz yokken) aynı iskelet, sayfa kenar boşluğuyla. */
export default function Loading() {
  return (
    <div className="kenar-x kenar-alt pt-(--kenar)">
      <SayfaIskeleti />
    </div>
  );
}
