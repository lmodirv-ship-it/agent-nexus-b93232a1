import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Globe } from "lucide-react";
import { MOCK_SITES } from "@/lib/mock-data";

export function LiveSitesStatus() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 2000);
    return () => clearInterval(id);
  }, []);

  const sites = MOCK_SITES.slice(0, 8).map((s, i) => {
    const jitter = ((tick + i) * 13) % 40;
    return {
      ...s,
      response: s.status === "offline" ? 0 : 60 + jitter + (s.status === "maintenance" ? 380 : 0),
    };
  });

  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-lg flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-neon" />
          حالة المواقع الحية
        </h3>
        <Link to="/sites" className="text-xs text-cyan-neon hover:underline">عرض الكل ←</Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {sites.map(site => {
          const hex = site.status === "online" ? "#34d399"
                    : site.status === "maintenance" ? "#fbbf24"
                    : "#fb7185";
          const label = site.status === "online" ? "🟢 يعمل"
                      : site.status === "maintenance" ? "⚠️ صيانة"
                      : "🔴 معطل";
          return (
            <div key={site.id}
                 className="rounded-2xl p-3 bg-black/30 border transition hover:-translate-y-0.5"
                 style={{ borderColor: `${hex}44`, boxShadow: `0 0 18px ${hex}18` }}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold truncate">{site.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{site.domain}</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                      style={{ background: `${hex}22`, color: hex, border: `1px solid ${hex}55` }}>
                  {label}
                </span>
              </div>
              <div className="mt-3 space-y-1 text-[11px]">
                <Row k="المستخدمون" v={site.users.toLocaleString("ar")} />
                <Row k="الاستجابة" v={`${site.response}ms`} />
                <Row k="قاعدة البيانات" v={site.db} />
                <Row k="النسخ" v={String(site.replicas)} />
              </div>
            </div>
          );
        })}
      </div>
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
