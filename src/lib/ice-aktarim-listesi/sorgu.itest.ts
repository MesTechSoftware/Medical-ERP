import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { partiKpileri, partiListesi, partiPaneli } from "@/lib/ice-aktarim-listesi/sorgu";
import { BOS_SUZGEC, kartAdresleri, suzgecCoz, type PartiSuzgeci } from "@/lib/ice-aktarim-listesi/suzgec";
import { yeniDoktorVerisi } from "../../../test/integration/referans";

// İçe aktarım ekranı sorguları — KABUL_KRITERLERI X-12-2 (spec Ü-30 §4).

const SAYFA = { skip: 0, take: 100 };
const S = (ek: Partial<PartiSuzgeci>): PartiSuzgeci => ({ ...BOS_SUZGEC, ...ek });
let yapan: { id: string };
let no = 0;

beforeEach(async () => {
  no += 1;
  yapan = await prisma.user.create({ data: { name: "Ayşe Yönetici", email: `ia${no}@m.local`, passwordHash: "x", role: "YONETICI" } });
});

async function parti(o: { tur: "CARI" | "URUN" | "ACILIS_STOGU"; an: string; geriAlindi?: boolean; dosya?: string }) {
  no += 1;
  return prisma.importBatch.create({
    data: {
      batchNo: `${o.tur}-T-${no}`,
      dataType: o.tur,
      userId: yapan.id,
      createdAt: new Date(o.an),
      fileName: o.dosya ?? null,
      ...(o.geriAlindi ? { revertedAt: new Date(o.an), revertedById: yapan.id, revertReason: "Yanlış dosya" } : {}),
    },
  });
}

describe("parti kartları = süzgeç (X-12-2)", () => {
  it("parti, bu ay, geri alınabilir (açılış hariç), geri alındı; her kart açtığı süzgecin satırı", async () => {
    await parti({ tur: "CARI", an: "2026-11-02T09:00:00Z" });
    await parti({ tur: "URUN", an: "2026-11-03T09:00:00Z", geriAlindi: true });
    await parti({ tur: "ACILIS_STOGU", an: "2026-11-03T10:00:00Z" });
    await parti({ tur: "CARI", an: "2026-10-31T20:30:00Z" }); // 31 Ekim 23:30 İstanbul — bu ay değil

    const k = await partiKpileri("2026-11-04");
    expect(k).toEqual({ tumu: 4, buAy: 3, geriAlinabilir: 2, geriAlindi: 1 });
    const adres = kartAdresleri("2026-11-04");
    for (const anahtar of ["tumu", "buAy", "geriAlinabilir", "geriAlindi"] as const) {
      const { suzgec } = suzgecCoz(Object.fromEntries(new URL(adres[anahtar], "http://x").searchParams));
      expect((await partiListesi(suzgec, SAYFA)).toplam, anahtar).toBe(k[anahtar]);
    }
  });

  it("yazıldı sekmesi geri alınmışı göstermez; tür ve metin süzgeci; sıralama yeniden eskiye", async () => {
    const a = await parti({ tur: "CARI", an: "2026-11-02T09:00:00Z", dosya: "cariler-kasim.xlsx" });
    const b = await parti({ tur: "URUN", an: "2026-11-03T09:00:00Z", geriAlindi: true });
    const id = async (s: Partial<PartiSuzgeci>) => (await partiListesi(S(s), SAYFA)).satirlar.map((p) => p.id);
    expect(await id({})).toEqual([b.id, a.id]);
    expect(await id({ durum: "yazildi" })).toEqual([a.id]);
    expect(await id({ tur: "URUN" })).toEqual([b.id]);
    expect(await id({ q: "KASIM" })).toEqual([a.id]);
    expect(await id({ q: b.batchNo.toLowerCase() })).toEqual([b.id]);
  });
});

describe("parti paneli (X-12-2)", () => {
  it("kayıt dağılımı, geri alınabilirlik ve geri alma bilgisi; bulunmayan null", async () => {
    const p = await parti({ tur: "CARI", an: "2026-11-02T09:00:00Z" });
    await prisma.doctor.create({ data: { ...yeniDoktorVerisi("Dr. Parti"), importBatchId: p.id } });
    const panel = (await partiPaneli(p.id))!;
    expect(panel.kayitlar).toEqual([{ ad: "Cari", adet: 1 }]);
    expect(panel.geriAlinabilir).toBe(true);
    expect(panel.geriAlma).toBeNull();

    const acilis = await parti({ tur: "ACILIS_STOGU", an: "2026-11-02T09:00:00Z" });
    expect((await partiPaneli(acilis.id))!.geriAlinabilir).toBe(false);

    const geri = await parti({ tur: "URUN", an: "2026-11-02T09:00:00Z", geriAlindi: true });
    expect((await partiPaneli(geri.id))!.geriAlma).toEqual({ eden: "Ayşe Yönetici", zaman: new Date("2026-11-02T09:00:00Z"), gerekce: "Yanlış dosya" });
    expect(await partiPaneli("yok")).toBeNull();
  });
});
