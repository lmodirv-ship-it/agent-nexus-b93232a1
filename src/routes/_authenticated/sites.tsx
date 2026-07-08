import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Globe, Plus, Search, ExternalLink, RotateCw, Square, Play, Trash2, Cpu, MemoryStick, Users } from "lucide-react";
import { PageHeader, NeonButton, StatusPill } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { MOCK_SITES, type Site, type SiteStatus } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/sites")({
  head: () => ({ meta: [{ title: "المواقع — SUPER ADMIN" }, { name: "description", content: "إدارة جميع المواقع من مكان واحد." }] }),
  component: SitesPage,
});

const STATUS: Record<SiteStatus, { label: string; hex: string }> = {
  online:      { label: "يعمل",   hex: "#22d3ee" },
  maintenance: { label: "صيانة",  hex: "#fbbf24" },
  offline:     { label: "متوقف",  hex: "#fb7185" },
};

function SitesPage() {
  const [sites, setSites] = useState<Site[]>(MOCK_SITES);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | SiteStatus>("all");

  // مقاييس حية
  useEffect(() => {
    const id = setInterval(() => {
      setSites((prev) => prev.map((s) => s.status === "online"
        ? { ...s, cpu: Math.max(5, Math.min(95, s.cpu + (Math.random() * 6 - 3))), ram: Math.max(5, Math.min(95, s.ram + (Math.random() * 4 - 2))) }
        : s));
    }, 1800);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(() => sites.filter((s) => {
    const okS = filter === "all" ? true : s.status === filter;
    const q = query.trim().toLowerCase();
    return okS && (!q || s.domain.includes(q) || s.name.includes(query.trim()));
  }), [sites, filter, query]);

  const totals = useMemo(() => ({
    total: sites.length,
    online: sites.filter((s) => s.status === "online").length,
    users: sites.reduce((a, s) => a + s.users, 0),
    replicas: sites.reduce((a, s) => a + s.replicas, 0),
  }), [sites]);

  const toggle = (id: string) => setSites((prev) => prev.map((s) => s.id === id
    ? { ...s, status: s.status === "online" ? "offline" : "online", cpu: s.status === "online" ? 0 : 30, ram: s.status === "online" ? 0 : 40 }
    : s));

  const columns: Column<Site>[] = [
    { key: "site", header: "الموقع", cell: (s) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg grid place-items-center"
               style={{ background: `radial-gradient(circle at 30% 30%, ${s.hex}55, ${s.hex}11)`, border: `1px solid ${s.hex}55`, boxShadow: `0 0 10px ${s.hex}44` }}>
            <Globe className="w-4 h-4" style={{ color: s.hex }} />
          </div>
          <div>
            <div className="font-semibold text-white">{s.name}</div>
            <a href={`https://${s.domain}`} target="_blank" rel="noreferrer" className="text-[11px] text-muted-foreground hover:text-cyan-neon flex items-center gap-1">
              {s.domain} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )},
    { key: "status", header: "الحالة", cell: (s) => <StatusPill label={STATUS[s.status].label} hex={STATUS[s.status].hex} /> },
    { key: "users",  header: "المستخدمون", cell: (s) => (
      <div className="flex items-center gap-1.5 text-slate-200"><Users className="w-3.5 h-3.5 text-cyan-neon" />{s.users.toLocaleString("en-US")}</div>
    )},
    { key: "cpu", header: "CPU", cell: (s) => <Bar value={s.cpu} hex="#22d3ee" icon={<Cpu className="w-3 h-3" />} /> },
    { key: "ram", header: "RAM", cell: (s) => <Bar value={s.ram} hex="#a78bfa" icon={<MemoryStick className="w-3 h-3" />} /> },
    { key: "db",  header: "القاعدة", cell: (s) => <span className="text-slate-300 text-xs">{s.db}</span> },
    { key: "rep", header: "النسخ", cell: (s) => <span className="text-slate-200 font-bold">{s.replicas}x</span> },
    { key: "act", header: "", cell: (s) => (
        <div className="flex items-center gap-1.5">
          <button onClick={() => toggle(s.id)} title={s.status === "online" ? "إيقاف" : "تشغيل"}
            className="w-8 h-8 rounded-lg grid place-items-center border border-white/10 hover:border-cyan-neon/50 text-slate-300 hover:text-cyan-neon transition">
            {s.status === "online" ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button className="w-8 h-8 rounded-lg grid place-items-center border border-white/10 hover:border-amber-neon/50 text-slate-300 hover:text-amber-neon transition" title="إعادة تشغيل">
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button className="w-8 h-8 rounded-lg grid place-items-center border border-white/10 hover:border-rose-neon/50 text-slate-300 hover:text-rose-neon transition" title="حذف">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )},
  ];

  return (
    <div>
      <PageHeader icon={Globe} title="إدارة المواقع" subtitle={`${totals.total} موقع · ${totals.online} يعمل · ${totals.users.toLocaleString("en-US")} مستخدم · ${totals.replicas} نسخة`}
        actions={<NeonButton icon={Plus}>إضافة موقع</NeonButton>} />

      <div className="panel p-3 mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث بالنطاق أو الاسم..."
                 className="w-full bg-black/30 border border-white/10 rounded-lg pr-9 pl-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-neon/40" />
        </div>
        <div className="flex items-center gap-2">
          {(["all", "online", "maintenance", "offline"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition"
                    style={filter === f
                      ? { borderColor: "#22d3ee88", background: "#22d3ee22", color: "#fff", boxShadow: "0 0 12px #22d3ee55" }
                      : { borderColor: "rgba(255,255,255,0.08)", color: "#94a3b8" }}>
              {f === "all" ? "الكل" : STATUS[f as SiteStatus].label}
            </button>
          ))}
        </div>
      </div>

      <DataTable rows={filtered} columns={columns} />
    </div>
  );
}

function Bar({ value, hex, icon }: { value: number; hex: string; icon: React.ReactNode }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="min-w-[110px]">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
        <span className="flex items-center gap-1" style={{ color: hex }}>{icon}</span>
        <span className="text-slate-300 font-bold">{pct.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-black/50 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${hex}, ${hex}88)`, boxShadow: `0 0 8px ${hex}` }} />
      </div>
    </div>
  );
}
