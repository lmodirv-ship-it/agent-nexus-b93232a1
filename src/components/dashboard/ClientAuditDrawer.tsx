import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listClientAudit } from "@/lib/queries.functions";
import { X, History, Clock } from "lucide-react";

const ACTION_HEX: Record<string, string> = {
  "client.create": "#34d399",
  "client.update": "#fbbf24",
  "client.delete": "#fb7185",
};

function labelOf(action: string) {
  if (action.endsWith(".create")) return "إنشاء";
  if (action.endsWith(".update")) return "تعديل";
  if (action.endsWith(".delete")) return "حذف";
  return action;
}

export function ClientAuditDrawer({
  clientId, clientName, onClose,
}: { clientId: string; clientName: string; onClose: () => void }) {
  const fn = useServerFn(listClientAudit);
  const { data, isLoading } = useQuery({
    queryKey: ["client-audit", clientId],
    queryFn: () => fn({ data: { clientId } }),
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-start" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-md h-full bg-background border-l border-white/10 shadow-2xl overflow-y-auto"
           onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-white/10 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg grid place-items-center border border-violet-neon/40 bg-violet-neon/10">
              <History className="w-4 h-4 text-violet-neon" />
            </div>
            <div>
              <div className="font-bold text-sm">سجل التغييرات</div>
              <div className="text-[11px] text-muted-foreground">{clientName}</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg grid place-items-center hover:bg-white/5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-2">
          {isLoading && <div className="text-xs text-muted-foreground">جاري التحميل...</div>}
          {!isLoading && (data ?? []).length === 0 && (
            <div className="text-xs text-muted-foreground text-center py-8">لا توجد تغييرات مسجَّلة بعد.</div>
          )}
          {(data ?? []).map((row: any) => {
            const hex = ACTION_HEX[row.action] ?? "#64748b";
            return (
              <div key={row.id} className="relative pr-4 border-r border-white/10 pb-3">
                <span className="absolute right-[-5px] top-1.5 w-2.5 h-2.5 rounded-full"
                      style={{ background: hex, boxShadow: `0 0 8px ${hex}` }} />
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${hex}22`, color: hex, border: `1px solid ${hex}55` }}>
                    {labelOf(row.action)}
                  </span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(row.created_at).toLocaleString("ar")}
                  </span>
                </div>
                {row.details && (
                  <pre className="text-[11px] text-slate-300 bg-black/30 rounded-lg p-2 overflow-x-auto border border-white/5">
                    {JSON.stringify(row.details, null, 2)}
                  </pre>
                )}
                {row.actor_email && (
                  <div className="text-[10px] text-muted-foreground mt-1">بواسطة: {row.actor_email}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
