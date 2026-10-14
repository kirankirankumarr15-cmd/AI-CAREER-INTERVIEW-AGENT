export default function PracticeLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-72 bg-slate-200 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="h-28 bg-slate-100 rounded-2xl border border-slate-200" />
        <div className="h-28 bg-slate-100 rounded-2xl border border-slate-200" />
        <div className="h-28 bg-slate-100 rounded-2xl border border-slate-200" />
      </div>
      <div className="h-32 bg-slate-100 rounded-2xl border border-slate-200" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-44 bg-slate-100 rounded-2xl border border-slate-200" />
        ))}
      </div>
    </div>
  );
}
