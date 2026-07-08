import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuspenseQuery, useMutation, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Power, PowerOff, Search, Zap, CheckCircle2, XCircle, Bot, Link2 } from "lucide-react";
import { getAgentsCatalog, setAgentActive, setAllAgentsActive, listAgentSiteLinks } from "@/lib/queries.functions";
import { AgentSitesModal } from "@/components/dashboard/AgentSitesModal";

const catalogQO = queryOptions({
  queryKey: ["agents_catalog"],
  queryFn: () => getAgentsCatalog(),
});

const linksQO = queryOptions({
  queryKey: ["agent_site_links"],
  queryFn: () => listAgentSiteLinks(),
});

export const Route = createFileRoute("/_authenticated/agents")({
  head: () => ({
    meta: [
      { title: "غرفة القيادة — إدارة الوكلاء" },
      { name: "description", content: "جدول شامل لكل الوكلاء مع تفعيل جماعي وربط المواقع بالبريد." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(catalogQO);
    context.queryClient.ensureQueryData(linksQO);
  },
  component: AgentsPage,
});

type AgentRow = {
  id: string;
  slug: string;
  name_ar: string;
  role: string;
  description: string | null;
  emoji: string | null;
  frequency: string | null;
  is_active: boolean;
};

// حرف الدور: G / M / E / D (افتراضي)
function roleLetter(role: string): string {
  const r = role.toLowerCase();
  if (r === "general-manager") return "G";
  if (r === "manager") return "M";
  if (r === "employee") return "E";
  if (r === "supervisor") return "S";
  if (r.includes("security")) return "X";
  if (r.includes("monitor")) return "N";
  if (r.includes("infra")) return "I";
  if (r.includes("backup") || r.includes("report")) return "B";
  if (r.includes("coord") || r.includes("mesh") || r.includes("site")) return "C";
  return "D";
}

const ROLE_COLOR: Record<string, string> = {
  G: "#f59e0b", M: "#a78bfa", E: "#38bdf8", S: "#22d3ee",
  X: "#fb7185", N: "#22d3ee", I: "#38bdf8", B: "#34d399", C: "#f472b6", D: "#94a3b8",
};

function AgentsPage() {
  const { data: agents } = useSuspenseQuery(catalogQO);
  const { data: links } = useSuspenseQuery(linksQO);
  const qc = useQueryClient();
  const toggleOne = useServerFn(setAgentActive);
  const toggleAll = useServerFn(setAllAgentsActive);

  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(0);
  const [linkModal, setLinkModal] = useState<{ id: string; name: string } | null>(null);
  const pageSize = 50;

  const linkCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of links as any[]) m.set(l.agent_id, (m.get(l.agent_id) ?? 0) + 1);
    return m;
  }, [links]);


  const rows = useMemo(() => {
    // ترقيم داخل كل دور
    const counters: Record<string, number> = {};
    return (agents as AgentRow[]).map((a) => {
      const L = roleLetter(a.role);
      counters[L] = (counters[L] ?? 0) + 1;
      return { ...a, displayId: `${L}${String(counters[L]).padStart(6, "0")}` };
    });
  }, [agents]);

  const roles = useMemo(() => Array.from(new Set(rows.map((r) => r.role))).sort(), [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (roleFilter !== "all" && r.role !== roleFilter) return false;
      if (statusFilter === "active" && !r.is_active) return false;
      if (statusFilter === "inactive" && r.is_active) return false;
      if (!q) return true;
      return (
        r.name_ar.includes(query.trim()) ||
        r.slug.toLowerCase().includes(q) ||
        r.role.toLowerCase().includes(q) ||
        r.displayId.toLowerCase().includes(q)
      );
    });
  }, [rows, query, roleFilter, statusFilter]);

  const pageRows = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const stats = useMemo(() => {
    const active = rows.filter((r) => r.is_active).length;
    return { total: rows.length, active, inactive: rows.length - active };
  }, [rows]);

  const mToggle = useMutation({
    mutationFn: (v: { id: string; is_active: boolean }) => toggleOne({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agents_catalog"] }),
  });

  const mBulk = useMutation({
    mutationFn: (v: { is_active: boolean; role?: string }) => toggleAll({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agents_catalog"] }),
  });

  return (
    <div className="space-y-6">
      {/* ترويسة */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-display font-black">غرفة قيادة الوكلاء</h1>
          <p className="text-sm text-muted-foreground mt-1">
            جدول شامل لجميع الوكلاء ({stats.total.toLocaleString("en-US")}) — نشِط: {stats.active} · متوقف: {stats.inactive}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => mBulk.mutate({ is_active: true, role: roleFilter === "all" ? undefined : roleFilter })}
            disabled={mBulk.isPending}
            className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#22d3ee33,#22d3ee11)", border: "1px solid #22d3ee55", color: "#a5f3fc", boxShadow: "0 0 20px #22d3ee33" }}
          >
            <Power className="w-4 h-4" /> تفعيل الجميع{roleFilter !== "all" ? ` (${roleFilter})` : ""}
          </button>
          <button
            onClick={() => mBulk.mutate({ is_active: false, role: roleFilter === "all" ? undefined : roleFilter })}
            disabled={mBulk.isPending}
            className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#fb718533,#fb718511)", border: "1px solid #fb718555", color: "#fecdd3" }}
          >
            <PowerOff className="w-4 h-4" /> إيقاف الجميع
          </button>
        </div>
      </div>

      {/* بطاقات */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "إجمالي الوكلاء", value: stats.total, hex: "#a78bfa", Icon: Bot },
          { label: "نشِط", value: stats.active, hex: "#22d3ee", Icon: CheckCircle2 },
          { label: "متوقف", value: stats.inactive, hex: "#64748b", Icon: XCircle },
          { label: "الأدوار المميزة", value: roles.length, hex: "#f59e0b", Icon: Zap },
        ].map((s) => (
          <div key={s.label} className="relative overflow-hidden rounded-2xl p-4"
               style={{ background: "linear-gradient(180deg,rgba(15,23,42,0.9),rgba(2,6,23,0.85))", border: `1px solid ${s.hex}33` }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400">{s.label}</div>
                <div className="text-2xl font-display font-black text-white mt-1">{s.value.toLocaleString("en-US")}</div>
              </div>
              <div className="w-10 h-10 rounded-xl grid place-items-center"
                   style={{ background: `${s.hex}22`, border: `1px solid ${s.hex}55` }}>
                <s.Icon className="w-4 h-4" style={{ color: s.hex }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* فلاتر */}
      <div className="panel p-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0); }}
            placeholder="بحث بالمعرّف، الاسم، الدور..."
            className="w-full bg-black/30 border border-white/10 rounded-lg pr-9 pl-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-400/40"
          />
        </div>
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }}
                className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm">
          <option value="all">كل الأدوار</option>
          {roles.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as any); setPage(0); }}
                className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm">
          <option value="all">كل الحالات</option>
          <option value="active">نشِط</option>
          <option value="inactive">متوقف</option>
        </select>
      </div>

      {/* الجدول */}
      <div className="panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-right text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/10">
              <th className="py-3 px-3 font-semibold">المعرّف</th>
              <th className="py-3 px-3 font-semibold">الوكيل</th>
              <th className="py-3 px-3 font-semibold">المهنة / الدور</th>
              <th className="py-3 px-3 font-semibold">التكرار</th>
              <th className="py-3 px-3 font-semibold">الوصف</th>
              <th className="py-3 px-3 font-semibold">الحالة</th>
              <th className="py-3 px-3 font-semibold text-center">المواقع</th>
              <th className="py-3 px-3 font-semibold text-center">إجراء</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r) => {
              const L = roleLetter(r.role);
              const color = ROLE_COLOR[L] ?? "#94a3b8";
              return (
                <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="py-2.5 px-3 font-mono text-xs">
                    <span className="px-2 py-1 rounded-md" style={{ background: `${color}18`, color, border: `1px solid ${color}44` }}>
                      {r.displayId}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{r.emoji ?? "🤖"}</span>
                      <div>
                        <div className="text-white font-semibold leading-tight">{r.name_ar}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{r.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">{r.role}</td>
                  <td className="py-2.5 px-3 text-slate-400 text-xs">{r.frequency ?? "—"}</td>
                  <td className="py-2.5 px-3 text-slate-400 text-xs max-w-[320px] truncate" title={r.description ?? ""}>
                    {r.description ?? "—"}
                  </td>
                  <td className="py-2.5 px-3">
                    {r.is_active ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-full"
                            style={{ background: "#22d3ee18", color: "#22d3ee", border: "1px solid #22d3ee55" }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> نشِط
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-full text-slate-400 border border-white/10">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" /> متوقف
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => mToggle.mutate({ id: r.id, is_active: !r.is_active })}
                      disabled={mToggle.isPending}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
                      style={r.is_active
                        ? { background: "#fb718522", color: "#fecdd3", border: "1px solid #fb718555" }
                        : { background: "#22d3ee22", color: "#a5f3fc", border: "1px solid #22d3ee55" }}
                    >
                      {r.is_active ? "إيقاف" : "تفعيل"}
                    </button>
                  </td>
                </tr>
              );
            })}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-500">لا نتائج مطابقة.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ترقيم */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div>
          عرض {pageRows.length ? page * pageSize + 1 : 0}–{page * pageSize + pageRows.length} من {filtered.length.toLocaleString("en-US")}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                  className="px-3 py-1.5 rounded-lg border border-white/10 disabled:opacity-40">السابق</button>
          <span className="px-2">صفحة {page + 1} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 rounded-lg border border-white/10 disabled:opacity-40">التالي</button>
        </div>
      </div>

      {/* شريط ربط المواقع بالبريد */}
      <div className="panel p-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-sm font-bold text-white">🌐 ربط المواقع بالبريد</div>
          <div className="text-xs text-slate-400 mt-1">
            كل موقع مربوط بحساب بريد يشغّله ويُرسِل ويستقبل نيابةً عنه — من هذا الموقع كقلب مركزي.
          </div>
        </div>
        <Link to="/sites" className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: "#a78bfa22", color: "#ddd6fe", border: "1px solid #a78bfa55" }}>
          إدارة المواقع والبريد ←
        </Link>
      </div>
    </div>
  );
}
