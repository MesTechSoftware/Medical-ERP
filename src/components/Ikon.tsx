import {
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  Ban,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  Check,
  Columns3,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Eye,
  FileSearch,
  Funnel,
  House,
  KeyRound,
  LogIn,
  LogOut,
  Minus,
  OctagonAlert,
  PackageCheck,
  PackageMinus,
  PackageOpen,
  PackagePlus,
  Pencil,
  Split,
  Plus,
  RotateCcw,
  Save,
  SlidersHorizontal,
  TriangleAlert,
  Trash2,
  Truck,
  Undo2,
  Warehouse,
  X,
  type LucideIcon,
} from "lucide-react";

/**
 * Buton ve durum ikonları (ADR-009): ikon + metin, emoji ve düz metin ok yok. Tek eşleme: aynı eylem her
 * ekranda aynı ikonu taşır; ikon menüyle aynı settendir (lucide). Direktifsiz modül: sunucu
 * sayfaları ve istemci formları birlikte kullanır.
 */
const IKONLAR = {
  yeni: Plus,
  duzenle: Pencil,
  sutunlar: Columns3,
  kismiSevk: Split,
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
  donem: CalendarDays,
  vade: CalendarClock,
  kargola: Truck,
  hazirla: PackageOpen,
  teslim: PackageCheck,
  devret: ArrowRightLeft,
  stokGirisi: PackagePlus,
  stokDuzeltme: SlidersHorizontal,
  konsinyeCikis: PackageMinus,
  depoyaTransfer: Warehouse,
  parola: KeyRound,
  giris: LogIn,
  cikis: LogOut,
  anaSayfa: House,
  onceki: ChevronLeft,
  sonraki: ChevronRight,
  uyari: TriangleAlert,
  hata: OctagonAlert,
  // Fark görünümü (denetim kaydı): eski değer eksi, yeni değer `yeni` (artı).
  eksi: Minus,
  kopyala: Copy,
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
