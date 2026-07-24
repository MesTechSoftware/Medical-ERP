export default function Loading() {
  return (
    <div className="p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-7 w-56 rounded bg-slate-200" />
        <div className="h-4 w-80 rounded bg-slate-100" />
        <div className="mt-6 space-y-3 rounded-lg border border-slate-200 bg-white p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 rounded bg-slate-100" />
          ))}
        </div>
      </div>
      <span className="sr-only">Yükleniyor…</span>
    </div>
  );
}
