export default function SolveLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#0f172a] text-slate-300 font-sans -m-6 sm:-m-8 animate-pulse">
      <div className="h-12 border-b border-slate-800 bg-[#1e293b] flex items-center justify-between px-4">
        <div className="h-5 w-48 bg-slate-700/60 rounded" />
        <div className="flex gap-2">
          <div className="h-7 w-20 bg-slate-700/60 rounded" />
          <div className="h-7 w-20 bg-slate-700/60 rounded" />
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/2 border-r border-slate-800 p-6 space-y-4">
          <div className="h-6 w-3/4 bg-slate-800 rounded" />
          <div className="h-4 w-full bg-slate-800/60 rounded" />
          <div className="h-4 w-5/6 bg-slate-800/60 rounded" />
          <div className="h-32 w-full bg-slate-800/40 rounded-xl" />
        </div>
        <div className="w-1/2 flex flex-col bg-[#1e293b]">
          <div className="h-10 border-b border-slate-800 px-4 flex items-center">
            <div className="h-5 w-24 bg-slate-800 rounded" />
          </div>
          <div className="flex-1 flex items-center justify-center text-slate-500 font-mono text-xs">
            Loading problem environment...
          </div>
        </div>
      </div>
    </div>
  );
}
