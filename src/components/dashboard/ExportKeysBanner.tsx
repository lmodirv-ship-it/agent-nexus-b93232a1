import { useState } from "react";
import { useSuspenseQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, KeyRound, X, ShieldAlert } from "lucide-react";
import { getProvisioningStatus, exportProvisioning } from "@/lib/queries.functions";

const statusQO = queryOptions({
  queryKey: ["provisioning-status"],
  queryFn: () => getProvisioningStatus(),
});

export function ExportKeysBanner() {
  const { data } = useSuspenseQuery(statusQO);
  const qc = useQueryClient();
  const exportFn = useServerFn(exportProvisioning);
  const [rows, setRows] = useState<Array<{ domain: string; api_key: string; webhook_secret: string }> | null>(null);
  const [busy, setBusy] = useState(false);

  if (data.pending === 0 && !rows) return null;

  const handleExport = async () => {
    setBusy(true);
    try {
      const res = await exportFn();
      setRows(res.rows);
      // Trigger CSV download
      const header = "domain,api_key,webhook_secret,ingest_url,heartbeat_url\n";
      const ingest = `${window.location.origin}/api/public/hub/ingest`;
      const beat = `${window.location.origin}/api/public/hub/heartbeat`;
      const body = res.rows
        .map((r) => `${r.domain},${r.api_key},${r.webhook_secret},${ingest},${beat}`)
        .join("\n");
      const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hn-group-keys-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      qc.invalidateQueries({ queryKey: ["provisioning-status"] });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel p-4 mb-4 border border-amber-400/40" style={{ boxShadow: "0 0 20px #fbbf2422" }}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg grid place-items-center bg-amber-400/10 border border-amber-400/40">
          <ShieldAlert className="w-5 h-5 text-amber-300" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-white flex items-center gap-2">
            <KeyRound className="w-4 h-4" />
            مفاتيح HN Group جاهزة للتصدير
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            يوجد <span className="text-amber-300 font-semibold">{data.pending}</span> موقعاً بمفاتيح API لم تُصدَّر بعد.
            التصدير يتم مرة واحدة فقط — احتفظ بالملف في مكان آمن (بعد الإغلاق لن يمكن استرجاع المفاتيح الخام).
          </div>
          {rows && (
            <div className="mt-3 text-xs text-emerald-300">
              تم تنزيل ملف CSV يحتوي {rows.length} صف. نقاط الاستقبال:
              <div className="mt-1 font-mono text-[10px] text-slate-400">
                POST /api/public/hub/ingest · POST /api/public/hub/heartbeat
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={busy}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-400/20 border border-amber-400/60 text-amber-200 hover:bg-amber-400/30 transition text-sm font-semibold disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {busy ? "جاري..." : "تنزيل CSV"}
          </button>
          {rows && (
            <button onClick={() => setRows(null)} className="w-9 h-9 grid place-items-center rounded-lg border border-white/10 hover:border-white/30">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
