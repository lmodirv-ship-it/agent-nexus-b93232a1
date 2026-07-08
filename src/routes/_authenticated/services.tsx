import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Network, Activity, Shield, Zap, Search } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { MOCK_SITES } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/services")({
  head: () => ({
    meta: [
      { title: "شبكة الخدمات — Service Mesh" },
      { name: "description", content: "سجل موحد لكل الخدمات التي تقدمها مواقعك، مع الحالة، الاستدعاءات، وSSO." },
    ],
  }),
  component: ServicesPage,
});

type Health = "online" | "degraded" | "offline";
interface Service {
  id: string; siteDomain: string; siteHex: string;
  name: string; endpoint: string; version: string;
  health: Health; isPublic: boolean; rateLimit: number; callsToday: number;
}

const SERVICE_TYPES = [
  { key: "auth",             label: "المصادقة الموحدة",  hex: "#22d3ee" },
  { key: "payment",          label: "الدفع",              hex: "#34d399" },
  { key: "storage",          label: "التخزين",            hex: "#a78bfa" },
  { key: "video_processing", label: "معالجة الفيديو",     hex: "#fb7185" },
  { key: "ai_inference",     label: "الذكاء الاصطناعي",  hex: "#f472b6" },
  { key: "api_gateway",      label: "بوابة API",          hex: "#38bdf8" },
  { key: "notifications",    label: "الإشعارات",          hex: "#fbbf24" },
] as const;

function seedServices(): Service[] {
  const rows: Service[] = [];
  MOCK_SITES.forEach((site, i) => {
    const t1 = SERVICE_TYPES[i % SERVICE_TYPES.length];
    const t2 = SERVICE_TYPES[(i + 3) % SERVICE_TYPES.length];
    [t1, t2].forEach((t, j) => {
      const health: Health = site.status === "offline" ? "offline"
                            : site.status === "maintenance" ? "degraded"
                            : (i + j) % 7 === 0 ? "degraded" : "online";
      rows.push({
        id: `${site.id}-${t.key}`,
        siteDomain: site.domain,
        siteHex: site.hex,
        name: t.label,
        endpoint: `https://${site.domain}/api/${t.key}`,
        version: "v1",
        health,
        isPublic: true,
        rateLimit: 100 + (i * 40),
        callsToday: 200 + ((i + j) * 137) % 4800,
      });
    });
  });
  return rows;
}

const HEALTH_META: Record<Health, { label: string; hex: string }> = {
  online:   { label: "🟢 يعمل",   hex: "#34d399" },
  degraded: { label: "⚠️ ضعيف",  hex: "#fbbf24" },
  offline:  { label: "🔴 معطل",   hex: "#fb7185" },
};

function ServicesPage() {
  const [services, setServices] = useState<Service[]>(() => seedServices());
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Health | "all">("all");

  // نبض حي للاستدعاءات
  useEffect(() => {
    const id = setInterval(() => {
      setServices(prev => prev.map(s => ({
        ...s,
        callsToday: s.health === "offline" ? s.callsToday : s.callsToday + Math.floor(Math.random() * 7),
      })));
    }, 2500);
    return () => clearInterval(id);
  }, []);

  const stats = useMemo(() => ({
    total:   services.length,
    online:  services.filter(s => s.health === "online").length,
    degraded:services.filter(s => s.health === "degraded").length,
    offline: services.filter(s => s.health === "offline").length,
    calls:   services.reduce((a, s) => a + s.callsToday, 0),
  }), [services]);

  const rows = useMemo(() => services.filter(s =>
    (filter === "all" || s.health === filter) &&
    (q === "" || s.siteDomain.includes(q) || s.name.includes(q) || s.endpoint.includes(q))
  ), [services, q, filter]);

  const columns: Column<Service>[] = [
    { key: "name", header: "الخدمة", cell: s => (
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ background: s.siteHex, boxShadow: `0 0 8px ${s.siteHex}` }} />
        <span className="font-bold">{s.name}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground">{s.version}</span>
      </div>
    )},
    { key: "site", header: "الموقع المزوّد", cell: s => (
      <span className="font-mono text-xs" style={{ color: s.siteHex }}>{s.siteDomain}</span>
    )},
    { key: "endpoint", header: "Endpoint", cell: s => (
      <span className="font-mono text-[11px] text-muted-foreground truncate max-w-[280px] block">{s.endpoint}</span>
    )},
    { key: "health", header: "الحالة", cell: s => {
      const m = HEALTH_META[s.health];
      return (
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: `${m.hex}22`, color: m.hex, border: `1px solid ${m.hex}55` }}>
          {m.label}
        </span>
      );
    }},
    { key: "rate", header: "الحد/دقيقة", cell: s => <span className="text-xs">{s.rateLimit}</span> },
    { key: "calls", header: "استدعاءات اليوم", cell: s => (
      <span className="font-mono text-cyan-neon">{s.callsToday.toLocaleString("ar")}</span>
    )},
  ];

  return (
    <div>
      <PageHeader
        icon={Network}
        title="شبكة الخدمات"
        subtitle="سجل موحد لكل الخدمات التي تقدّمها مواقعك، مع الصحة والاستدعاءات الحية."
        hex="#38bdf8"
        actions={
          <Link to="/security/api-keys"
                className="text-xs px-3 py-2 rounded-xl border border-cyan-neon/40 text-cyan-neon hover:bg-cyan-neon/10">
            مفاتيح SSO
          </Link>
        }
      />

      {/* بطاقات إحصائية */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <Stat label="خدمات نشطة"  value={stats.total}      hex="#38bdf8" icon={<Network className="w-4 h-4" />} />
        <Stat label="تعمل"        value={stats.online}     hex="#34d399" icon={<Activity className="w-4 h-4" />} />
        <Stat label="ضعيفة"       value={stats.degraded}   hex="#fbbf24" icon={<Zap className="w-4 h-4" />} />
        <Stat label="معطلة"       value={stats.offline}    hex="#fb7185" icon={<Shield className="w-4 h-4" />} />
        <Stat label="استدعاءات/يوم" value={stats.calls.toLocaleString("ar")} hex="#a78bfa" icon={<Activity className="w-4 h-4" />} />
      </div>

      {/* لوحة القلب المركزي */}
      <div className="panel p-5 mb-5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30 pointer-events-none"
             style={{ background: "radial-gradient(circle at 50% 50%, #22d3ee44, transparent 60%)" }} />
        <div className="relative">
          <h3 className="font-display font-bold text-lg mb-1">🧠 القلب المركزي (Service Router + SSO Broker)</h3>
          <p className="text-xs text-muted-foreground mb-4">
            كل استدعاء بين المواقع يمرّ عبر البوابة الموحّدة. المصادقة، التوجيه، والمراقبة تُدار من مكان واحد.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <MeshTag label="🔐 /api/sso/verify" />
            <MeshTag label="🌐 /api/gateway/*" />
            <MeshTag label="📊 /api/services/health" />
            <MeshTag label="🧾 /api/services/logs" />
          </div>
        </div>
      </div>

      {/* بحث + فلترة */}
      <div className="panel p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="ابحث باسم الخدمة، الموقع، أو الـ endpoint..."
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 pr-10 text-sm focus:border-cyan-neon/60 outline-none"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(["all", "online", "degraded", "offline"] as const).map(a => {
            const active = filter === a;
            const hex = a === "all" ? "#38bdf8" : HEALTH_META[a as Health].hex;
            const label = a === "all" ? "الكل" : HEALTH_META[a as Health].label;
            return (
              <button key={a} onClick={() => setFilter(a)}
                className="text-[11px] font-bold px-3 py-1.5 rounded-lg transition"
                style={{
                  background: active ? `${hex}33` : "transparent",
                  color: active ? hex : "#94a3b8",
                  border: `1px solid ${active ? hex + "88" : "#ffffff15"}`,
                }}>
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
      <div className="text-2xl font-display font-black" style={{ color: hex, textShadow: `0 0 12px ${hex}66` }}>
        {value}
      </div>
    </div>
  );
}

function MeshTag({ label }: { label: string }) {
  return (
    <div className="px-3 py-2 rounded-lg bg-black/40 border border-cyan-neon/30 font-mono text-cyan-neon">
      {label}
    </div>
  );
}
