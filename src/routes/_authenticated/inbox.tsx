import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { queryOptions, useSuspenseQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMailMessages, markMailRead, listSites } from "@/lib/queries.functions";
import { supabase } from "@/integrations/supabase/client";
import { Mail, ArrowDownLeft, ArrowUpRight, Check } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";

const mailQO = queryOptions({ queryKey: ["mailMessages"], queryFn: () => listMailMessages() });
const sitesQO = queryOptions({ queryKey: ["sites"], queryFn: () => listSites() });

export const Route = createFileRoute("/_authenticated/inbox")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(mailQO);
    context.queryClient.ensureQueryData(sitesQO);
  },
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-6 space-y-3">
        <div className="text-rose-300 font-bold">تعذر التحميل</div>
        <div className="text-xs text-muted-foreground">{error.message}</div>
        <button onClick={() => { reset(); router.invalidate(); }} className="px-3 py-1.5 rounded bg-cyan-neon/20 border border-cyan-neon/40 text-sm">إعادة المحاولة</button>
      </div>
    );
  },
  notFoundComponent: () => <div className="p-6">غير موجود</div>,
  component: InboxPage,
});

function InboxPage() {
  const qc = useQueryClient();
  const messages = useSuspenseQuery(mailQO).data;
  const sites = useSuspenseQuery(sitesQO).data as any[];
  const [selected, setSelected] = useState<string | null>(messages[0]?.id ?? null);
  const mark = useServerFn(markMailRead);
  const markM = useMutation({
    mutationFn: (id: string) => mark({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mailMessages"] }),
  });

  useEffect(() => {
    const ch = supabase.channel("mail_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "mail_messages" }, () => {
        qc.invalidateQueries({ queryKey: ["mailMessages"] });
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const current = messages.find((m) => m.id === selected) ?? null;
  const siteOf = (id: string | null) => sites.find((s) => s.id === id)?.domain ?? "—";

  return (
    <div className="space-y-4">
      <PageHeader title="صندوق البريد الموحد" subtitle="كل رسائل عناوين مواقع المجموعة" icon={Mail} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="panel p-2 lg:col-span-1 max-h-[70vh] overflow-auto">
          {messages.length === 0 && <div className="text-center py-8 text-muted-foreground text-xs">لا رسائل بعد</div>}
          {messages.map((m) => (
            <button key={m.id} onClick={() => { setSelected(m.id); if (!m.read_at) markM.mutate(m.id); }}
              className={`w-full text-right p-3 rounded-lg mb-1 border ${selected === m.id ? "bg-cyan-neon/10 border-cyan-neon/40" : "bg-muted/20 border-panel-border/40 hover:bg-muted/30"}`}>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-1">
                {m.direction === "inbound" ? <ArrowDownLeft className="w-3 h-3 text-violet-300" /> : <ArrowUpRight className="w-3 h-3 text-amber-300" />}
                <span className="truncate">{siteOf(m.site_id)}</span>
                {!m.read_at && <span className="mr-auto w-1.5 h-1.5 rounded-full bg-cyan-400" />}
              </div>
              <div className="text-xs font-semibold truncate">{m.subject || "(بدون موضوع)"}</div>
              <div className="text-[10px] text-muted-foreground truncate">{m.from_addr} → {m.to_addr}</div>
            </button>
          ))}
        </div>

        <div className="panel p-4 lg:col-span-2 min-h-[400px]">
          {current ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold">{current.subject || "(بدون موضوع)"}</div>
                  <div className="text-xs text-muted-foreground">{current.from_addr} → {current.to_addr}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">{new Date(current.created_at).toLocaleString("en-GB", { hour12: false })} · {siteOf(current.site_id)}</div>
                </div>
                {current.read_at && <span className="text-[10px] text-emerald-300 flex items-center gap-1"><Check className="w-3 h-3" /> مقروء</span>}
              </div>
              <div className="whitespace-pre-wrap text-sm bg-background/50 p-4 rounded-lg border border-panel-border/40 max-h-[500px] overflow-auto">
                {current.body || "(بدون محتوى)"}
              </div>
            </div>
          ) : <div className="text-center text-muted-foreground py-16 text-sm">اختر رسالة لعرضها</div>}
        </div>
      </div>
    </div>
  );
}
