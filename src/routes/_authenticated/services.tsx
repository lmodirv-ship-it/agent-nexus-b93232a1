import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Network, Activity, Shield, Zap, Search } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { listServices } from "@/lib/queries.functions";

const servicesQ = queryOptions({ queryKey: ["services"], queryFn: () => listServices() });

export const Route = createFileRoute("/_authenticated/services")({
  head: () => ({ meta: [{ title: "شبكة الخدمات — Service Mesh" }, { name: "description", content: "سجل موحد لكل الخدمات، مع الحالة والاستدعاءات." }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(servicesQ),
  component: ServicesPage,
  errorComponent: ({ error }) => <div className="panel p-6">{error.message}</div>,
  notFoundComponent: () => <div className="panel p-6">غير موجود</div>,
});

const HEALTH_META: Record<string, { label: string; hex: string }> = {
  online: { label: "🟢 يعمل", hex: "#34d399" },
  degraded: { label: "⚠️ ضعيف", hex: "#fbbf24" },
  offline: { label: "🔴 معطل", hex: "#fb7185" },
};

function ServicesPage() {
  const { data: services } = useSuspenseQuery(servicesQ);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const stats = useMemo(() => ({
    total: services.length,
    online: services.filter((s: any) => s.health === "online").length,
    degraded: services.filter((s: any) => s.health === "degraded").length,
    offline: services.filter((s: any) => s.health === "offline").length,
    calls: services.reduce((a: number, s: any) => a + (s.calls_today ?? 0), 0),
  }), [services]);

  const rows = useMemo(() => services.filter((s: any) =>
    (filter === "all" || s.health === filter) &&
    (q === "" || (s.name ?? "").includes(q) || (s.endpoint_url ?? "").includes(q))
  ), [services, q, filter]);

  const columns: Column<any>[] = [
    { key: "name", header: "الخدمة", cell: (s) => (
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ background: HEALTH_META[s.health]?.hex ?? "#94a3b8" }} />
        <span className="font-bold">{s.name}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground">{s.version ?? "v1"}</span>
      </div>
    )},
    { key: "endpoint", header: "Endpoint", cell: (s) => (
      <span className="font-mono text-[11px] text-muted-foreground truncate max-w-[280px] block">{s.endpoint_url ?? "—"}</span>
    )},
    { key: "health", header: "الحالة", cell: (s) => {
      const m = HEALTH_META[s.health] ?? { label: s.health, hex: "#94a3b8" };
      return <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: `${m.hex}22`, color: m.hex, border: `1px solid ${m.hex}55` }}>{m.label}</span>;
    }},
    { key: "rate", header: "الحد/دقيقة", cell: (s) => <span className="text-xs">{s.rate_limit ?? "—"}</span> },
    { key: "calls", header: "استدعاءات اليوم", cell: (s) => <span className="font-mono text-cyan-neon">{(s.calls_today ?? 0).toLocaleString("ar")}</span> },
  ];

  return (
    <div>
      <PageHeader icon={Network} title="شبكة الخدمات" hex="#38bdf8"
        subtitle="سجل موحد لكل الخدمات التي تقدّمها مواقعك."
        actions={<Link to="/security/api-keys" className="text-xs px-3 py-2 rounded-xl border border-cyan-neon/40 text-cyan-neon hover:bg-cyan-neon/10">مفاتيح SSO</Link>} />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <Stat label="خدمات" value={stats.total} hex="#38bdf8" icon={<Network className="w-4 h-4" />} />
        <Stat label="تعمل" value={stats.online} hex="#34d399" icon={<Activity className="w-4 h-4" />} />
        <Stat label="ضعيفة" value={stats.degraded} hex="#fbbf24" icon={<Zap className="w-4 h-4" />} />
        <Stat label="معطلة" value={stats.offline} hex="#fb7185" icon={<Shield className="w-4 h-4" />} />
        <Stat label="استدعاءات/يوم" value={stats.calls.toLocaleString("ar")} hex="#a78bfa" icon={<Activity className="w-4 h-4" />} />
      </div>

      <div className="panel p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث..." className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 pr-10 text-sm focus:border-cyan-neon/60 outline-none" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["all", "online", "degraded", "offline"].map((a) => {
            const active = filter === a;
            const hex = a === "all" ? "#38bdf8" : HEALTH_META[a]?.hex ?? "#94a3b8";
            const label = a === "all" ? "الكل" : HEALTH_META[a]?.label ?? a;
            return (
              <button key={a} onClick={() => setFilter(a)} className="text-[11px] font-bold px-3 py-1.5 rounded-lg transition"
                style={{ background: active ? `${hex}33` : "transparent", color: active ? hex : "#94a3b8", border: `1px solid ${active ? hex + "88" : "#ffffff15"}` }}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <DataTable rows={rows} columns={columns} />
    </div>
  );
}

function Stat({ label, value, hex, icon }: { label: string; value: number | string; hex: string; icon: React.ReactNode }) {
  return (
    <div className="panel p-4" style={{ boxShadow: `inset 0 0 0 1px ${hex}22` }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <span style={{ color: hex }}>{icon}</span>
      </div>
      <div className="text-2xl font-display font-black" style={{ color: hex, textShadow: `0 0 12px ${hex}66` }}>{value}</div>
    </div>
  );
}
