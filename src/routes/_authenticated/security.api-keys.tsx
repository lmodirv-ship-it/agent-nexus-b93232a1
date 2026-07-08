import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { Key, Plus, Trash2 } from "lucide-react";
import { PageHeader, NeonButton, StatusPill } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { listApiKeys, revokeApiKey } from "@/lib/queries.functions";

const keysQ = queryOptions({ queryKey: ["api_keys"], queryFn: () => listApiKeys() });

export const Route = createFileRoute("/_authenticated/security/api-keys")({
  head: () => ({ meta: [{ title: "مفاتيح API — SUPER ADMIN" }, { name: "description", content: "إنشاء وإدارة مفاتيح API." }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(keysQ),
  component: KeysPage,
  errorComponent: ({ error }) => <div className="panel p-6">{error.message}</div>,
  notFoundComponent: () => <div className="panel p-6">غير موجود</div>,
});

function KeysPage() {
  const { data: keys } = useSuspenseQuery(keysQ);
  const qc = useQueryClient();
  const remove = async (id: string) => {
    if (!confirm("حذف المفتاح؟")) return;
    await revokeApiKey({ data: { id } });
    qc.invalidateQueries({ queryKey: ["api_keys"] });
  };

  const columns: Column<any>[] = [
    { key: "label", header: "الاسم", cell: (k) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg grid place-items-center"
             style={{ background: "radial-gradient(circle at 30% 30%, #a78bfa55, #a78bfa11)", border: "1px solid #a78bfa55", boxShadow: "0 0 10px #a78bfa44" }}>
          <Key className="w-4 h-4 text-violet-neon" />
        </div>
        <div>
          <div className="text-white font-semibold">{k.label}</div>
          <div className="font-mono text-[11px] text-muted-foreground">{k.prefix}</div>
        </div>
      </div>
    )},
    { key: "scopes", header: "الصلاحيات", cell: (k) => (
      <div className="flex flex-wrap gap-1">
        {(k.scopes ?? []).map((s: string) => (
          <span key={s} className="text-[10px] px-2 py-0.5 rounded-full font-mono" style={{ background: "#38bdf822", color: "#38bdf8", border: "1px solid #38bdf855" }}>{s}</span>
        ))}
      </div>
    )},
    { key: "created", header: "أُنشئ", cell: (k) => <span className="text-xs text-muted-foreground font-mono">{new Date(k.created_at).toLocaleDateString("ar-EG")}</span> },
    { key: "used", header: "آخر استخدام", cell: (k) => <span className="text-xs text-slate-300">{k.last_used_at ? new Date(k.last_used_at).toLocaleString("ar-EG") : "—"}</span> },
    { key: "st", header: "الحالة", cell: (k) => <StatusPill label={k.active ? "نشط" : "مجمّد"} hex={k.active ? "#22d3ee" : "#64748b"} /> },
    { key: "act", header: "", cell: (k) => (
      <button onClick={() => remove(k.id)} className="w-8 h-8 rounded-lg grid place-items-center border border-white/10 hover:border-rose-neon/50 text-slate-300 hover:text-rose-neon transition" title="حذف">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    )},
  ];

  return (
    <div>
      <PageHeader icon={Key} title="مفاتيح API" hex="#a78bfa" subtitle={`${keys.length} مفتاح — ${keys.filter((k: any) => k.active).length} نشط`}
        actions={<NeonButton hex="#a78bfa" icon={Plus}>مفتاح جديد</NeonButton>} />
      <DataTable rows={keys} columns={columns} />
    </div>
  );
}
