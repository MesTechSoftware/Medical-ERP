"use client";

import HataEkrani from "@/components/HataEkrani";

/** Kök hata sınırı — kritik segmentler dışındaki her rota buraya düşer (X-3 §(1)). */
export default function HataSiniri({ error }: { error: Error & { digest?: string } }) {
  return <HataEkrani referans={error.digest} />;
}
