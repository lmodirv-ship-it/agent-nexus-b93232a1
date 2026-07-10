import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuspenseQuery, useMutation, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Power, PowerOff, Sparkles, RefreshCw, Search, Link2, CheckCircle2, AlertCircle,
  Zap, Shield, Wrench, Send, Inbox, Globe, Users2,
} from "lucide-react";
import {
  listSiteLinkAgents, setSiteLinkEnabled, autoGenerateSiteLinks,
} from "@/lib/queries.functions";

const linksQO = queryOptions({
  queryKey: ["site_link_agents"],
  queryFn: () => listSiteLinkAgents(),
  refetchInterval: 20_000,
});

export const Route = createFileRoute("/_authenticated/agent-link")({
  head: () => ({
    meta: [
      { title: "غرفة القيادة — وكلاء الربط" },
      { name: "description", content: "جدول شامل لوكلاء استقبال/إرسال/تطوير/أمن لكل موقع مع تحكم جماعي وتوليد تلقائي." },
    ],
  }),
  loader: ({ context }) => { context.queryClient.ensureQueryData(linksQO); },
  component: AgentLinkPage,
});

type Row = Awaited<ReturnType<typeof listSiteLinkAgents>>[number];

const STATUS_STYLE: Record<string, { c: string; label: string; Icon: any }> = {
  linked:  { c: "#22d3ee", label: "مربوط",   Icon: CheckCircle2 },
  pending: { c: "#fbbf24", label: "قيد الربط", Icon: RefreshCw },
  error:   { c: "#fb7185", label: "خطأ",     Icon: AlertCircle },
};

function AgentLinkPage() {
  const { data: rows } = useSuspenseQuery(linksQO);
  const qc = useQueryClient();
  const setEnabled = useServerFn(setSiteLinkEnabled);
  const autoGen = useServerFn(autoGenerateSiteLinks);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "linked" | "pending" | "error">("all");

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.link_status !== statusFilter) return false;
      if (q) {
        const s = q.toLowerCase();
        if (!(
          r.site?.domain?.toLowerCase().includes(s) ||
          r.site?.site_code?.toLowerCase().includes(s) ||
          r.site?.db_name?.toLowerCase().includes(s)
        )) return false;
      }
      return true;
    });
  }, [rows, q, statusFilter]);

  const stats = useMemo(() => ({
    total: rows.length,
    enabled: rows.filter((r) => r.is_enabled).length,
    linked: rows.filter((r) => r.link_status === "linked").length,
    hn: rows.filter((r) => r.hn_group).length,
    avgMs: Math.round(rows.reduce((a, r) => a + (r.response_ms ?? 0), 0) / Math.max(rows.length, 1)),
    avgRate: Math.round(rows.reduce((a, r) => a + Number(r.interaction_rate ?? 0), 0) / Math.max(rows.length, 1)),
  }), [rows]);

  const mToggle = useMutation({
    mutationFn: (v: { ids: string[]; is_enabled: boolean }) => setEnabled({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["site_link_agents"] }),
  });
  const mAuto = useMutation({
    mutationFn: () => autoGen(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["site_link_agents"] }),
  });

  const allIds = filtered.map((r) => r.id);
  const selectedIds = allIds.filter((id) => selected.has(id));

  const toggleSel = (id: string) => {
    const n = new Set(selected);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelected(n);
  };
  const toggleAll = () => setSelected(selectedIds.length === allIds.length ? new Set() : new Set(allIds));

  return (
    <div className="space-y-5">
      <div className="panel p-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Users2 className="w-5 h-5 text-cyan-neon" />
              <h1 className="font-display font-bold text-2xl">وكلاء الربط</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              لكل موقع وكيلا استقبال وإرسال + وكيل تطوير + وكيل أمن. المواقع التي تشترك في نفس قاعدة البيانات تُربط تلقائيًا بدون مفاتيح (مجموعة HN).
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => mToggle.mutate({ ids: rows.map((r) => r.id), is_enabled: true })}
              disabled={mToggle.isPending}
              className="px-3 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-1.5"
              style={{ background: "linear-gradient(135deg,#22d3ee33,#22d3ee11)", border: "1px solid #22d3ee55", color: "#a5f3fc" }}>
              <Power className="w-3.5 h-3.5" /> تفعيل الكل
            </button>
            <button
              onClick={() => mToggle.mutate({ ids: selectedIds, is_enabled: true })}
              disabled={mToggle.isPending || selectedIds.length === 0}
              className="px-3 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#a78bfa33,#a78bfa11)", border: "1px solid #a78bfa55", color: "#ddd6fe" }}>
              <Zap className="w-3.5 h-3.5" /> تفعيل المختارين ({selectedIds.length})
            </button>
            <button
              onClick={() => mToggle.mutate({ ids: selectedIds.length ? selectedIds : rows.map((r) => r.id), is_enabled: false })}
              disabled={mToggle.isPending}
              className="px-3 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-1.5"
              style={{ background: "linear-gradient(135deg,#fb718533,#fb718511)", border: "1px solid #fb718555", color: "#fecdd3" }}>
              <PowerOff className="w-3.5 h-3.5" /> إيقاف
            </button>
            <button
              onClick={() => mAuto.mutate()}
              disabled={mAuto.isPending}
              className="px-3 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-1.5"
              style={{ background: "linear-gradient(135deg,#34d39933,#34d39911)", border: "1px solid #34d39955", color: "#bbf7d0" }}>
              <Sparkles className="w-3.5 h-3.5" />
              {mAuto.isPending ? "جارٍ التوليد..." : "توليد تلقائي حسب الحاجة"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-4">
          <Stat label="إجمالي" value={stats.total} />
          <Stat label="مفعّل" value={stats.enabled} color="#22d3ee" />
          <Stat label="مربوط" value={stats.linked} color="#34d399" />
          <Stat label="مجموعة HN" value={stats.hn} color="#a78bfa" />
          <Stat label="متوسط الاستجابة" value={`${stats.avgMs}ms`} color="#fbbf24" />
          <Stat label="متوسط التفاعل" value={`${stats.avgRate}%`} color="#38bdf8" />
        </div>
      </div>

      <div className="panel p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث بالنطاق أو معرّف الموقع أو قاعدة البيانات..."
              className="w-full bg-black/30 border border-white/10 rounded-xl pr-10 pl-3 py-2 text-sm" />
          </div>
          {(["all", "linked", "pending", "error"] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border ${
                statusFilter === s ? "border-cyan-neon text-cyan-neon bg-cyan-neon/10" : "border-white/10 text-muted-foreground"
              }`}>
              {s === "all" ? "الكل" : STATUS_STYLE[s]?.label}
            </button>
          ))}
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-right text-[11px] uppercase tracking-wider text-muted-foreground/80 bg-black/30">
                <th className="px-3 py-3 w-8">
                  <input type="checkbox" checked={allIds.length > 0 && selectedIds.length === allIds.length}
                    onChange={toggleAll} className="w-4 h-4 accent-cyan-400" />
                </th>
                <th className="px-3 py-3">معرّف الموقع</th>
                <th className="px-3 py-3">النطاق</th>
                <th className="px-3 py-3"><span className="inline-flex items-center gap-1"><Inbox className="w-3 h-3"/>استقبال</span></th>
                <th className="px-3 py-3"><span className="inline-flex items-center gap-1"><Send className="w-3 h-3"/>إرسال</span></th>
                <th className="px-3 py-3"><span className="inline-flex items-center gap-1"><Wrench className="w-3 h-3"/>تطوير</span></th>
                <th className="px-3 py-3"><span className="inline-flex items-center gap-1"><Shield className="w-3 h-3"/>أمن</span></th>
                <th className="px-3 py-3">إضافيون</th>
                <th className="px-3 py-3">مفعّل</th>
                <th className="px-3 py-3">التفاعل</th>
                <th className="px-3 py-3">الحالة</th>
                <th className="px-3 py-3">الاستجابة</th>
                <th className="px-3 py-3">HN</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const st = STATUS_STYLE[r.link_status] ?? STATUS_STYLE.pending;
                return (
                  <tr key={r.id} className={`border-t border-white/5 ${i % 2 ? "bg-white/[0.015]" : ""}`}>
                    <td className="px-3 py-2">
                      <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSel(r.id)}
                        className="w-4 h-4 accent-cyan-400" />
                    </td>
                    <td className="px-3 py-2">
                      <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-cyan-neon">
                        {r.site?.site_code ?? "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3 h-3 text-slate-400" />
                        <span className="text-white text-xs">{r.site?.domain ?? "—"}</span>
                      </div>
                      {r.site?.db_name && <div className="text-[10px] text-slate-500 mt-0.5">{r.site.db_name}</div>}
                    </td>
                    <AgentCell a={r.receiver} />
                    <AgentCell a={r.sender} />
                    <AgentCell a={r.developer} />
                    <AgentCell a={r.security} />
                    <td className="px-3 py-2">
                      {r.extras.length ? (
                        <div className="flex flex-wrap gap-1">
                          {r.extras.slice(0, 3).map((x: any) => (
                            <span key={x.id} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                              {x.emoji} {x.name_ar}
                            </span>
                          ))}
                          {r.extras.length > 3 && <span className="text-[10px] text-slate-500">+{r.extras.length - 3}</span>}
                        </div>
                      ) : <span className="text-[10px] text-slate-600">—</span>}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => mToggle.mutate({ ids: [r.id], is_enabled: !r.is_enabled })}
                        className={`px-2 py-1 rounded-full text-[10px] font-bold border ${
                          r.is_enabled ? "text-emerald-300 border-emerald-500/50 bg-emerald-500/10"
                                       : "text-slate-400 border-white/10 bg-white/5"
                        }`}>
                        {r.is_enabled ? "ON" : "OFF"}
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-cyan-neon to-violet-neon"
                            style={{ width: `${Math.min(100, Number(r.interaction_rate ?? 0))}%` }} />
                        </div>
                        <span className="text-[11px] text-white/80">{Math.round(Number(r.interaction_rate ?? 0))}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                        style={{ background: `${st.c}18`, color: st.c, border: `1px solid ${st.c}55` }}>
                        <st.Icon className="w-3 h-3" /> {st.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[11px] text-white/80">{r.response_ms}ms</td>
                    <td className="px-3 py-2">
                      {r.hn_group ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full text-violet-300 border border-violet-500/50 bg-violet-500/10">
                          <Link2 className="w-3 h-3" /> HN
                        </span>
                      ) : <span className="text-[10px] text-slate-600">—</span>}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={13} className="px-4 py-10 text-center text-muted-foreground">
                    لا نتائج. جرّب <Link to="/agent-link" search={{}} className="text-cyan-neon">إعادة الضبط</Link> أو اضغط "توليد تلقائي".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color = "#94a3b8" }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="rounded-xl p-3 border border-white/10 bg-black/30">
      <div className="text-[10px] text-muted-foreground uppercase">{label}</div>
      <div className="font-display font-bold text-lg mt-1" style={{ color }}>{value}</div>
    </div>
  );
}

function AgentCell({ a }: { a: any }) {
  if (!a) return <td className="px-3 py-2 text-[10px] text-slate-600">—</td>;
  const on = a.is_active;
  return (
    <td className="px-3 py-2">
      <div className="flex items-center gap-1.5">
        <span className="text-sm">{a.emoji}</span>
        <div>
          <div className="text-[11px] text-white leading-tight">{a.name_ar}</div>
          <div className={`text-[9px] ${on ? "text-emerald-400" : "text-slate-500"}`}>{on ? "نشط" : "متوقف"}</div>
        </div>
      </div>
    </td>
  );
}
