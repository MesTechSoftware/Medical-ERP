import {
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  Ban,
  CalendarClock,
  CalendarRange,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileSearch,
  Funnel,
  House,
  KeyRound,
  LogIn,
  LogOut,
  PackageCheck,
  PackageOpen,
  PackagePlus,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Truck,
  Undo2,
  X,
  type LucideIcon,
} from "lucide-react";

/**
 * Buton ikonları (ADR-009): ikon + metin, emoji ve düz metin ok yok. Tek eşleme: aynı eylem her
 * ekranda aynı ikonu taşır; ikon menüyle aynı settendir (lucide). Direktifsiz modül: sunucu
 * sayfaları ve istemci formları birlikte kullanır.
 */
const IKONLAR = {
  yeni: Plus,
  duzenle: Pencil,
  sil: Trash2,
  kaydet: Save,
  vazgec: X,
  iptalEt: Ban,
  geri: ArrowLeft,
  ileri: ArrowRight,
  detay: Eye,
  onayla: Check,
  reddet: X,
  indir: Download,
  dogrula: FileSearch,
  geriAl: Undo2,
  cevir: RotateCcw,
  filtrele: Funnel,
  tumZamanlar: CalendarRange,
  vade: CalendarClock,
  kargola: Truck,
  hazirla: PackageOpen,
  teslim: PackageCheck,
  devret: ArrowRightLeft,
  stokGirisi: PackagePlus,
  parola: KeyRound,
  giris: LogIn,
  cikis: LogOut,
  anaSayfa: House,
  onceki: ChevronLeft,
  sonraki: ChevronRight,
} as const satisfies Record<string, LucideIcon>;

export type IkonAdi = keyof typeof IKONLAR;

/**
 * Dekoratif ikon: erişilebilir ad butonun metnidir. Boyut yazı boyunun 1,15 katı — 14 px yazıda
 * ≈16 px, 12 px yazıda ≈14 px; renk yazıdan gelir.
 */
export function Ikon({ ad }: { ad: IkonAdi }) {
  const Bilesen = IKONLAR[ad];
  return <Bilesen aria-hidden="true" className="size-[1.15em] shrink-0" />;
}
