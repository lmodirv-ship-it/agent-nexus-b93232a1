import { Database as DbIcon } from "lucide-react";

type Site = { id: string; domain: string; status: string; users: number; db: number; storage: number; color: string };

const colorHex: Record<string, string> = {
  cyan: "#22d3ee",
  emerald: "#34d399",
  violet: "#a78bfa",
  amber: "#fbbf24",
  pink: "#f472b6",
  rose: "#fb7185",
};

export function SiteGraph({ sites }: { sites: Site[] }) {
  const nodes = sites.slice(0, 6);
  // 3 left, 3 right positions (percentages)
  const positions = [
    { x: 18, y: 22 }, { x: 82, y: 22 },
    { x: 15, y: 52 }, { x: 85, y: 52 },
    { x: 20, y: 82 }, { x: 80, y: 82 },
  ];

  return (
    <div className="panel p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold tracking-tight">خريطة النظام المباشرة</h3>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-sm bg-emerald-400" /> نشط</span>
          <span className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-sm bg-amber-400" /> تحذير</span>
          <span className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-sm bg-rose-400" /> خطر</span>
        </div>
      </div>

      <div className="relative h-[520px] rounded-2xl overflow-hidden border border-white/5"
           style={{ background: "radial-gradient(ellipse at center, rgba(34,211,238,0.08), rgba(2,6,23,0.9) 65%), #030712" }}>
        {/* grid */}
        <div className="absolute inset-0 opacity-[0.07]"
             style={{ backgroundImage: "linear-gradient(#22d3ee 1px, transparent 1px), linear-gradient(90deg, #22d3ee 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

        {/* SVG connections */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="line" x1="0" x2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.1" />
            </linearGradient>
            <filter id="glow"><feGaussianBlur stdDeviation="0.6" /></filter>
          </defs>
          {nodes.map((_, i) => (
            <line key={i} x1="50" y1="50" x2={positions[i].x} y2={positions[i].y}
                  stroke="url(#line)" strokeWidth="0.25" strokeDasharray="1 1.2" filter="url(#glow)">
              <animate attributeName="stroke-dashoffset" from="0" to="20" dur="4s" repeatCount="indefinite" />
            </line>
          ))}
        </svg>

        {/* CORE */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative w-44 h-44 grid place-items-center">
            <div className="absolute inset-0 rounded-full bg-cyan-400/10 blur-2xl pulse-glow" />
            <div className="absolute inset-4 rounded-full border border-cyan-400/30 animate-pulse" />
            <div className="absolute inset-8 rounded-full border border-cyan-300/40" />
            <div className="relative w-24 h-24 rounded-full grid place-items-center text-center"
                 style={{
                   background: "radial-gradient(circle at 30% 30%, #67e8f9, #0891b2 60%, #0e7490)",
                   boxShadow: "0 0 40px rgba(34,211,238,0.7), inset 0 0 20px rgba(255,255,255,0.2)"
                 }}>
              <div>
                <div className="text-[10px] font-bold text-white/90 tracking-widest">SUPER</div>
                <div className="text-sm font-black text-white">CORE</div>
              </div>
            </div>
          </div>
        </div>

        {/* Site nodes */}
        {nodes.map((s, i) => {
          const p = positions[i];
          const hex = colorHex[s.color] ?? "#22d3ee";
          const dotColor = s.status === "warning" ? "#fbbf24" : s.status === "danger" ? "#fb7185" : "#34d399";
          return (
            <div key={s.id} className="absolute -translate-x-1/2 -translate-y-1/2 float-slow"
                 style={{ left: `${p.x}%`, top: `${p.y}%`, animationDelay: `${i * 0.4}s` }}>
              <div className="rounded-xl p-3 min-w-[190px] backdrop-blur-md"
                   style={{
                     background: "rgba(2,6,23,0.75)",
                     border: `1px solid ${hex}55`,
                     boxShadow: `0 0 20px ${hex}33, inset 0 0 12px ${hex}11`,
                   }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg grid place-items-center"
                       style={{ background: `${hex}22`, border: `1px solid ${hex}66` }}>
                    <DbIcon className="w-4 h-4" style={{ color: hex }} />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-white">{s.domain}</div>
                    <div className="flex items-center gap-1 text-[10px]" style={{ color: dotColor }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: dotColor, boxShadow: `0 0 6px ${dotColor}` }} />
                      {s.status === "warning" ? "تحذير" : s.status === "danger" ? "خطر" : "Online"}
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 space-y-0.5 font-mono">
                  <div>Users : <span className="text-slate-200">{s.users.toLocaleString("en-US")}</span></div>
                  <div>DB &nbsp;&nbsp;&nbsp;: <span className="text-slate-200">{s.db} GB</span></div>
                  <div>Storage : <span className="text-slate-200">{s.storage >= 1000 ? `${(s.storage/1000).toFixed(1)} TB` : `${s.storage} GB`}</span></div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Footer button */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <button className="px-4 py-1.5 text-xs rounded-full bg-white/5 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-400/10 transition">
            عرض جميع المواقع ({sites.length})
          </button>
        </div>
      </div>
    </div>
  );
}
