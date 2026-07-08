import { useEffect, useState } from "react";
import { useSuspenseQuery, useMutation, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { X, Link2, CheckCircle2, AlertCircle, Globe } from "lucide-react";
import { listSites, listAgentSiteLinks, setAgentSiteLinks } from "@/lib/queries.functions";

const sitesQO = queryOptions({ queryKey: ["sites"], queryFn: () => listSites() });
const linksQO = queryOptions({ queryKey: ["agent_site_links"], queryFn: () => listAgentSiteLinks() });

export function AgentSitesModal({
  agentId, agentName, onClose,
}: { agentId: string; agentName: string; onClose: () => void }) {
  const { data: sites } = useSuspenseQuery(sitesQO);
  const { data: links } = useSuspenseQuery(linksQO);
  const qc = useQueryClient();
  const save = useServerFn(setAgentSiteLinks);

  const currentIds = (links as any[])
    .filter((l) => l.agent_id === agentId)
    .map((l) => l.site_id);

  const [selected, setSelected] = useState<Set<string>>(new Set(currentIds));
  useEffect(() => { setSelected(new Set(currentIds)); /* eslint-disable-next-line */ }, [agentId]);

  const m = useMutation({
    mutationFn: (site_ids: string[]) => save({ data: { agent_id: agentId, site_ids } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agent_site_links"] });
      onClose();
    },
  });

  const toggle = (id: string) => {
    const n = new Set(selected);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelected(n);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-4"
         onClick={onClose}>
      <div className="panel w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <div className="text-lg font-bold text-white flex items-center gap-2">
              <Link2 className="w-5 h-5 text-cyan-400" /> ربط الوكيل بالمواقع
            </div>
            <div className="text-xs text-slate-400 mt-0.5">{agentName}</div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {sites.length === 0 && (
            <div className="text-center text-slate-500 py-8">لا مواقع مسجّلة بعد.</div>
          )}
          {(sites as any[]).map((s) => {
            const link = (links as any[]).find((l) => l.agent_id === agentId && l.site_id === s.id);
            const status = link?.status ?? "unlinked";
            const on = selected.has(s.id);
            const hex = status === "linked" ? "#22d3ee" : status === "error" ? "#fb7185" : "#64748b";
            return (
              <label key={s.id}
                className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:bg-white/[0.03]"
                style={{ borderColor: on ? "#22d3ee55" : "rgba(255,255,255,0.08)", background: on ? "#22d3ee0d" : "transparent" }}>
                <input type="checkbox" checked={on} onChange={() => toggle(s.id)}
                       className="w-4 h-4 accent-cyan-400" />
                <Globe className="w-4 h-4" style={{ color: s.icon_color ?? "#22d3ee" }} />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white">{s.domain}</div>
                  <div className="text-[11px] text-slate-500">{s.email ?? "بدون بريد"}</div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-full"
                      style={{ background: `${hex}18`, color: hex, border: `1px solid ${hex}55` }}>
                  {status === "linked" ? <CheckCircle2 className="w-3 h-3" /> :
                   status === "error"  ? <AlertCircle className="w-3 h-3" /> : null}
                  {status === "linked" ? "مربوط" : status === "error" ? "خطأ" : "غير مربوط"}
                </span>
              </label>
            );
          })}
        </div>

        <div className="p-4 border-t border-white/10 flex items-center justify-between gap-2">
          <div className="text-xs text-slate-400">
            محدد: <span className="text-white font-bold">{selected.size}</span> / {sites.length}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm border border-white/10">إلغاء</button>
            <button
              onClick={() => m.mutate(Array.from(selected))}
              disabled={m.isPending}
              className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#22d3ee33,#22d3ee11)", border: "1px solid #22d3ee55", color: "#a5f3fc" }}>
              {m.isPending ? "جارٍ الحفظ..." : "حفظ الروابط"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
