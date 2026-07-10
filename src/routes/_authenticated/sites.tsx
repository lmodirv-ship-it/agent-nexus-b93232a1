import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { Globe, Plus, Search, ExternalLink, Trash2, Users, HardDrive, Mail, KeyRound } from "lucide-react";
import { PageHeader, NeonButton, StatusPill } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { listSites, deleteSite, upsertSite } from "@/lib/queries.functions";
import { SiteIntegrationModal } from "@/components/dashboard/SiteIntegrationModal";
import { ExportKeysBanner } from "@/components/dashboard/ExportKeysBanner";

const sitesQ = queryOptions({ queryKey: ["sites"], queryFn: () => listSites() });

export const Route = createFileRoute("/_authenticated/sites")({
  head: () => ({ meta: [{ title: "المواقع — SUPER ADMIN" }, { name: "description", content: "إدارة جميع المواقع من مكان واحد." }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(sitesQ),
  component: SitesPage,
  errorComponent: ({ error }) => <div className="panel p-6">{error.message}</div>,
  notFoundComponent: () => <div className="panel p-6">غير موجود</div>,
});

const STATUS: Record<string, { label: string; hex: string }> = {
  online: { label: "يعمل", hex: "#22d3ee" },
  warning: { label: "تحذير", hex: "#fbbf24" },
  maintenance: { label: "صيانة", hex: "#fbbf24" },
  danger: { label: "خطر", hex: "#fb7185" },
  offline: { label: "متوقف", hex: "#fb7185" },
};

function SitesPage() {
  const { data: sites } = useSuspenseQuery(sitesQ);
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [integrationSite, setIntegrationSite] = useState<any | null>(null);

  const filtered = useMemo(() => sites.filter((s: any) => {
    const okS = filter === "all" ? true : s.status === filter;
    const q = query.trim().toLowerCase();
    return okS && (!q || (s.domain ?? "").toLowerCase().includes(q));
  }), [sites, filter, query]);

  const totals = {
    total: sites.length,
    online: sites.filter((s: any) => s.status === "online").length,
    users: sites.reduce((a: number, s: any) => a + (s.users_count ?? 0), 0),
  };

  const handleDelete = async (id: string) => {
    if (!confirm("حذف الموقع؟")) return;
    await deleteSite({ data: { id } });
    qc.invalidateQueries({ queryKey: ["sites"] });
  };

  const handleEmail = async (s: any) => {
    const email = prompt("بريد الموقع (يشغّله ويرسل ويستقبل نيابةً عنه):", s.email ?? "");
    if (email === null) return;
    await upsertSite({ data: { id: s.id, domain: s.domain, email: email.trim() || null } as any });
    qc.invalidateQueries({ queryKey: ["sites"] });
  };

  const columns: Column<any>[] = [
    { key: "site", header: "الموقع", cell: (s) => {
      const hex = s.icon_color ?? "#22d3ee";
      return (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg grid place-items-center"
               style={{ background: `radial-gradient(circle at 30% 30%, ${hex}55, ${hex}11)`, border: `1px solid ${hex}55`, boxShadow: `0 0 10px ${hex}44` }}>
            <Globe className="w-4 h-4" style={{ color: hex }} />
          </div>
          <div>
            <div className="font-semibold text-white">{s.clients?.name ?? s.domain}</div>
            <a href={`https://${s.domain}`} target="_blank" rel="noreferrer" className="text-[11px] text-muted-foreground hover:text-cyan-neon flex items-center gap-1">
              {s.domain} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      );
    }},
    { key: "status", header: "الحالة", cell: (s) => <StatusPill label={STATUS[s.status]?.label ?? s.status} hex={STATUS[s.status]?.hex ?? "#94a3b8"} /> },
    { key: "users", header: "المستخدمون", cell: (s) => (
      <div className="flex items-center gap-1.5 text-slate-200"><Users className="w-3.5 h-3.5 text-cyan-neon" />{(s.users_count ?? 0).toLocaleString("en-US")}</div>
    )},
    { key: "db", header: "DB", cell: (s) => <span className="text-slate-300 text-xs">{Number(s.db_size_gb ?? 0)} GB</span> },
    { key: "storage", header: "التخزين", cell: (s) => (
      <div className="flex items-center gap-1.5 text-slate-200"><HardDrive className="w-3.5 h-3.5 text-violet-neon" />{Number(s.storage_gb ?? 0)} GB</div>
    )},
    { key: "email", header: "بريد التشغيل", cell: (s) => (
      <button onClick={() => handleEmail(s)} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg border border-white/10 hover:border-cyan-neon/50 transition text-slate-300 hover:text-cyan-neon" title="ربط بريد للموقع">
        <Mail className="w-3.5 h-3.5" />
        <span className="max-w-[160px] truncate">{s.email ?? "— ربط بريد —"}</span>
      </button>
    )},
    { key: "integrate", header: "تكامل", cell: (s) => (
      <button onClick={() => setIntegrationSite(s)} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg border border-white/10 hover:border-amber-400/50 text-slate-300 hover:text-amber-300 transition" title="مفاتيح API و webhook">
        <KeyRound className="w-3.5 h-3.5" /> Hub
      </button>
    )},
    { key: "act", header: "", cell: (s) => (
      <button onClick={() => handleDelete(s.id)} className="w-8 h-8 rounded-lg grid place-items-center border border-white/10 hover:border-rose-neon/50 text-slate-300 hover:text-rose-neon transition" title="حذف">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    )},
  ];

  return (
    <div>
      <PageHeader icon={Globe} title="إدارة المواقع" subtitle={`${totals.total} موقع · ${totals.online} يعمل · ${totals.users.toLocaleString("en-US")} مستخدم`}
        actions={<NeonButton icon={Plus}>إضافة موقع</NeonButton>} />

      <ExportKeysBanner />

      <div className="panel p-3 mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث بالنطاق..."
                 className="w-full bg-black/30 border border-white/10 rounded-lg pr-9 pl-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-neon/40" />
        </div>
        <div className="flex items-center gap-2">
          {["all", "online", "warning", "danger", "offline"].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition"
                    style={filter === f
                      ? { borderColor: "#22d3ee88", background: "#22d3ee22", color: "#fff", boxShadow: "0 0 12px #22d3ee55" }
                      : { borderColor: "rgba(255,255,255,0.08)", color: "#94a3b8" }}>
              {f === "all" ? "الكل" : (STATUS[f]?.label ?? f)}
            </button>
          ))}
        </div>
      </div>

      <DataTable rows={filtered} columns={columns} />
      {integrationSite && (
        <SiteIntegrationModal site={integrationSite} onClose={() => setIntegrationSite(null)} />
      )}
    </div>
  );
}
