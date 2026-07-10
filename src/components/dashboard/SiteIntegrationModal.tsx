import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { rotateSiteApiKey, updateSiteIntegration, pingSite } from "@/lib/queries.functions";
import { X, KeyRound, RefreshCw, Send, Copy, Check } from "lucide-react";

export function SiteIntegrationModal({
  site, onClose,
}: {
  site: { id: string; domain: string; webhook_url?: string | null };
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [webhookUrl, setWebhookUrl] = useState(site.webhook_url ?? "");
  const [newKey, setNewKey] = useState<{ api_key: string; webhook_secret: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [pingResult, setPingResult] = useState<{ ok: boolean; status: number; error: string | null } | null>(null);

  const rotate = useServerFn(rotateSiteApiKey);
  const save = useServerFn(updateSiteIntegration);
  const ping = useServerFn(pingSite);

  const rotateM = useMutation({
    mutationFn: () => rotate({ data: { site_id: site.id } }),
    onSuccess: (d) => { setNewKey(d); qc.invalidateQueries({ queryKey: ["sites"] }); },
  });
  const saveM = useMutation({
    mutationFn: () => save({ data: { site_id: site.id, webhook_url: webhookUrl || null } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sites"] }),
  });
  const pingM = useMutation({
    mutationFn: () => ping({ data: { site_id: site.id } }),
    onSuccess: (d) => { setPingResult(d); qc.invalidateQueries({ queryKey: ["hubEvents"] }); },
    onError: (e: any) => setPingResult({ ok: false, status: 0, error: e?.message ?? "خطأ" }),
  });

  const copy = (v: string, k: string) => {
    navigator.clipboard.writeText(v); setCopied(k);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="panel w-full max-w-2xl p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-bold flex items-center gap-2"><KeyRound className="w-5 h-5 text-cyan-400" /> تكامل الهب مع الموقع</div>
            <div className="text-xs text-muted-foreground">{site.domain}</div>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-muted/40"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Webhook URL — عنوان استقبال الأوامر في هذا الموقع</label>
          <div className="flex gap-2">
            <input
              value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://site.example.com/api/hub/inbox"
              className="flex-1 bg-background border border-panel-border rounded-lg px-3 py-2 text-sm"
            />
            <button onClick={() => saveM.mutate()} disabled={saveM.isPending}
              className="px-3 py-2 rounded-lg bg-cyan-neon/20 border border-cyan-neon/40 text-sm">
              حفظ
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">مفتاح API + سر HMAC</div>
            <button onClick={() => rotateM.mutate()} disabled={rotateM.isPending}
              className="text-xs px-3 py-1.5 rounded bg-amber-500/20 border border-amber-500/40 flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3" /> توليد/تدوير
            </button>
          </div>
          {newKey ? (
            <div className="space-y-2 rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-xs">
              <div className="text-amber-300 font-bold">⚠ احفظ هذه القيم الآن — لن تُعرض مرة أخرى</div>
              {(["api_key", "webhook_secret"] as const).map((k) => (
                <div key={k} className="flex items-center gap-2">
                  <span className="w-32 text-muted-foreground">{k}:</span>
                  <code className="flex-1 truncate bg-background/60 px-2 py-1 rounded">{newKey[k]}</code>
                  <button onClick={() => copy(newKey[k], k)} className="p-1.5 rounded hover:bg-muted/40">
                    {copied === k ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">اضغط "توليد/تدوير" لإنشاء مفتاح جديد. القديم يُبطَل فوراً.</div>
          )}
        </div>

        <div className="pt-3 border-t border-panel-border space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">اختبار الاتصال</div>
            <button onClick={() => pingM.mutate()} disabled={pingM.isPending}
              className="text-xs px-3 py-1.5 rounded bg-emerald-500/20 border border-emerald-500/40 flex items-center gap-1.5">
              <Send className="w-3 h-3" /> إرسال ping
            </button>
          </div>
          {pingResult && (
            <div className={`text-xs rounded p-2 ${pingResult.ok ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300"}`}>
              {pingResult.ok ? `✓ نجح — HTTP ${pingResult.status}` : `✗ فشل — ${pingResult.error ?? `HTTP ${pingResult.status}`}`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
