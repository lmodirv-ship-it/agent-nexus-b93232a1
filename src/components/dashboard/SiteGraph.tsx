type Site = { id: string; domain: string; status: string; users: number; db: number; storage: number; color: string };

export function SiteGraph({ sites }: { sites: Site[] }) {
  return (
    <div className="panel p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">SUPER CORE — شبكة المواقع</h3>
        <span className="text-xs text-muted-foreground">{sites.length} موقع نشط</span>
      </div>
      <div className="relative h-[360px] rounded-xl bg-black/40 border border-white/5 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center animate-pulse">
            <span className="font-bold text-cyan-300">CORE</span>
          </div>
        </div>
        {sites.slice(0, 8).map((s, i) => {
          const angle = (i / Math.min(sites.length, 8)) * Math.PI * 2;
          const r = 140;
          const x = 50 + (Math.cos(angle) * r) / 7;
          const y = 50 + (Math.sin(angle) * r) / 3.6;
          return (
            <div key={s.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }}>
              <div className={`px-3 py-2 rounded-lg bg-slate-900/80 border border-${s.color}-400/50 text-xs`}>
                <div className="font-semibold">{s.domain}</div>
                <div className="text-muted-foreground">{s.users} مستخدم</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
