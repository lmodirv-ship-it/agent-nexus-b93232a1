import { useQuery, queryOptions } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Globe } from "lucide-react";
import { listSites } from "@/lib/queries.functions";

const sitesQ = queryOptions({ queryKey: ["sites"], queryFn: () => listSites() });

export function LiveSitesStatus() {
  const { data = [] } = useQuery(sitesQ);
  const sites = data.slice(0, 8);

  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-lg flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-neon" />
          حالة المواقع الحية
        </h3>
        <Link to="/sites" className="text-xs text-cyan-neon hover:underline">عرض الكل ←</Link>
      </div>

      {sites.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-8">لا توجد مواقع بعد</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {sites.map((site: any) => {
            const hex = site.status === "online" ? "#34d399"
                      : site.status === "warning" || site.status === "maintenance" ? "#fbbf24"
                      : "#fb7185";
            const label = site.status === "online" ? "🟢 يعمل"
                        : site.status === "warning" || site.status === "maintenance" ? "⚠️ تحذير"
                        : "🔴 معطل";
            return (
              <div key={site.id} className="rounded-2xl p-3 bg-black/30 border transition hover:-translate-y-0.5"
                   style={{ borderColor: `${hex}44`, boxShadow: `0 0 18px ${hex}18` }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-bold truncate">{site.clients?.name ?? site.domain}</div>
                      {site.site_code && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-cyan-neon">{site.site_code}</span>}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">{site.domain}</div>
                    {site.role && <div className="text-[10px] text-slate-400 truncate">{site.role}</div>}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                        style={{ background: `${hex}22`, color: hex, border: `1px solid ${hex}55` }}>{label}</span>
                </div>
                <div className="mt-3 space-y-1 text-[11px]">
                  <Row k="المستخدمون" v={(site.users_count ?? 0).toLocaleString("ar")} />
                  <Row k="قاعدة البيانات" v={site.db_name ?? `${Number(site.db_size_gb ?? 0)} GB`} />
                  <Row k="التخزين" v={`${Number(site.storage_gb ?? 0)} GB`} />
                  <Row k="النشاط" v={`${Math.round(Number(site.activity_rate ?? 0))}%`} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{k}</span>
      <span className="text-foreground font-semibold">{v}</span>
    </div>
  );
}
