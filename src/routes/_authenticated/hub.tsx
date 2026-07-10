import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { getHubStats, listHubEvents, listSites } from "@/lib/queries.functions";
import { supabase } from "@/integrations/supabase/client";
import { Activity, ArrowDownLeft, ArrowUpRight, AlertTriangle, Radio, Mail, Globe, Zap } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";

const statsQO = queryOptions({ queryKey: ["hubStats"], queryFn: () => getHubStats() });
const eventsQO = queryOptions({ queryKey: ["hubEvents"], queryFn: () => listHubEvents() });
const sitesQO = queryOptions({ queryKey: ["sites"], queryFn: () => listSites() });

export const Route = createFileRoute("/_authenticated/hub")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(statsQO);
    context.queryClient.ensureQueryData(eventsQO);
    context.queryClient.ensureQueryData(sitesQO);
  },
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6 space-y-3">
        <div className="text-lg font-bold text-rose-300">تعذر تحميل لوحة الهب</div>
        <div className="text-xs text-muted-foreground">{error.message}</div>
        <button onClick={() => { reset(); router.invalidate(); }}
          className="px-3 py-1.5 rounded bg-cyan-neon/20 border border-cyan-neon/40 text-sm">إعادة المحاولة</button>
      </div>
    );
  },
  notFoundComponent: () => <div className="p-6">غير موجود</div>,
  component: HubPage,
});

function HubPage() {
  const qc = useQueryClient();
  const stats = useSuspenseQuery(statsQO).data;
  const events = useSuspenseQuery(eventsQO).data;
  const sites = useSuspenseQuery(sitesQO).data as any[];

  useEffect(() => {
    const ch = supabase.channel("hub_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "hub_events" }, () => {
        qc.invalidateQueries({ queryKey: ["hubEvents"] });
        qc.invalidateQueries({ queryKey: ["hubStats"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "sites" }, () => {
        qc.invalidateQueries({ queryKey: ["sites"] });
        qc.invalidateQueries({ queryKey: ["hubStats"] });
      })
      .subscribe();
    const t = setInterval(() => qc.invalidateQueries({ queryKey: ["hubStats"] }), 15_000);
    return () => { supabase.removeChannel(ch); clearInterval(t); };
  }, [qc]);

  const kpis = [
    { label: "مواقع online", value: `${stats.sitesOnline}/${stats.sitesTotal}`, icon: Globe, color: "text-emerald-400" },
    { label: "أحداث/دقيقة", value: stats.eventsPerMinute, icon: Zap, color: "text-cyan-400" },
    { label: "واردة (60s)", value: stats.inboundLastMin, icon: ArrowDownLeft, color: "text-violet-400" },
    { label: "صادرة (60s)", value: stats.outboundLastMin, icon: ArrowUpRight, color: "text-amber-400" },
    { label: "فشل (60s)", value: stats.failedLastMin, icon: AlertTriangle, color: "text-rose-400" },
    { label: "بريد غير مقروء", value: stats.unreadMail, icon: Mail, color: "text-pink-400" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="قلب المجموعة" subtitle="HN HUB — مركز قيادة مجموعة المواقع" icon={Radio} />

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="panel p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className={`w-3.5 h-3.5 ${k.color}`} />{k.label}</div>
              <div className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="panel p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="font-bold flex items-center gap-2"><Activity className="w-4 h-4 text-cyan-400" /> بث الأحداث المباشر</div>
            <div className="text-[11px] text-muted-foreground">آخر 200 حدث</div>
          </div>
          <div className="overflow-auto max-h-[560px] rounded border border-panel-border">
            <table className="w-full text-xs">
              <thead className="bg-muted/30 text-muted-foreground sticky top-0">
                <tr>
                  <th className="text-right px-3 py-2">الوقت</th>
                  <th className="text-right px-3 py-2">اتجاه</th>
                  <th className="text-right px-3 py-2">نوع</th>
                  <th className="text-right px-3 py-2">موقع</th>
                  <th className="text-right px-3 py-2">حالة</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => {
                  const site = sites.find((s) => s.id === e.site_id);
                  return (
                    <tr key={e.id} className="border-t border-panel-border/50">
                      <td className="px-3 py-1.5 font-mono text-[10px] text-muted-foreground">
                        {new Date(e.created_at).toLocaleTimeString("en-GB", { hour12: false })}
                      </td>
                      <td className="px-3 py-1.5">
                        {e.direction === "inbound"
                          ? <span className="text-violet-300 flex items-center gap-1"><ArrowDownLeft className="w-3 h-3" />in</span>
                          : <span className="text-amber-300 flex items-center gap-1"><ArrowUpRight className="w-3 h-3" />out</span>}
                      </td>
                      <td className="px-3 py-1.5 font-mono">{e.type}</td>
                      <td className="px-3 py-1.5 truncate max-w-[160px]">{site?.domain ?? "—"}</td>
                      <td className="px-3 py-1.5">
                        <span className={
                          e.status === "delivered" ? "text-emerald-300"
                          : e.status === "failed" ? "text-rose-300"
                          : e.status === "processing" ? "text-cyan-300"
                          : "text-muted-foreground"
                        }>{e.status}</span>
                      </td>
                    </tr>
                  );
                })}
                {events.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">لا أحداث بعد. اربط موقعاً وفعّل webhook.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel p-4">
          <div className="font-bold mb-3 flex items-center gap-2"><Globe className="w-4 h-4 text-emerald-400" /> شبكة المواقع</div>
          <div className="space-y-2 max-h-[560px] overflow-auto">
            {sites.map((s) => {
              const online = s.last_heartbeat_at && (Date.now() - new Date(s.last_heartbeat_at).getTime() < 60_000);
              return (
                <div key={s.id} className="flex items-center gap-3 p-2 rounded bg-muted/20 border border-panel-border/40">
                  <span className={`w-2 h-2 rounded-full ${online ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate">{s.domain}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {online ? "متصل الآن" : s.last_heartbeat_at ? `آخر نبضة: ${new Date(s.last_heartbeat_at).toLocaleTimeString("en-GB", { hour12: false })}` : "لم يتصل بعد"}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">{s.status ?? "—"}</span>
                </div>
              );
            })}
            {sites.length === 0 && <div className="text-center py-8 text-muted-foreground text-xs">أضف مواقع من /sites</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
