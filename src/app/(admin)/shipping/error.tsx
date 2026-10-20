"use client";

import HataEkrani from "@/components/HataEkrani";

/** Kritik segment hata sınırı (X-3 §(1)): layout ve menü yerinde kalır. */
export default function HataSiniri({ error }: { error: Error & { digest?: string } }) {
  return <HataEkrani referans={error.digest} />;
}
