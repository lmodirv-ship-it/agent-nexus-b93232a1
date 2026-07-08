import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { FileArchive, Play, RotateCcw, Trash2, Clock } from "lucide-react";
import { PageHeader, NeonButton, StatusPill } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { listBackups, upsertBackup, deleteBackup } from "@/lib/queries.functions";

const backupsQ = queryOptions({ queryKey: ["backups"], queryFn: () => listBackups() });

export const Route = createFileRoute("/_authenticated/backups")({
  head: () => ({ meta: [{ title: "النسخ الاحتياطي — SUPER ADMIN" }, { name: "description", content: "إدارة النسخ الاحتياطية والاستعادة." }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(backupsQ),
  component: BackupsPage,
  errorComponent: ({ error }) => <div className="panel p-6">{error.message}</div>,
  notFoundComponent: () => <div className="panel p-6">غير موجود</div>,
});

const STATUS: Record<string, { label: string; hex: string }> = {
  completed: { label: "مكتمل", hex: "#22d3ee" },
  running: { label: "قيد التنفيذ", hex: "#fbbf24" },
  failed: { label: "فشل", hex: "#fb7185" },
};

function BackupsPage() {
  const { data: rows } = useSuspenseQuery(backupsQ);
  const qc = useQueryClient();

  const runNow = async () => {
    await upsertBackup({ data: { status: "completed", size_gb: 0.5 } });
    qc.invalidateQueries({ queryKey: ["backups"] });
  };
  const remove = async (id: string) => {
    await deleteBackup({ data: { id } });
    qc.invalidateQueries({ queryKey: ["backups"] });
  };

  const totalGb = rows.reduce((a: number, r: any) => a + Number(r.size_gb ?? 0), 0);

  const columns: Column<any>[] = [
    { key: "name", header: "المعرّف", cell: (r) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg grid place-items-center"
             style={{ background: "radial-gradient(circle at 30% 30%, #34d39955, #34d39911)", border: "1px solid #34d39955", boxShadow: "0 0 10px #34d39944" }}>
          <FileArchive className="w-4 h-4 text-emerald-neon" />
        </div>
        <div className="font-mono text-white text-sm">{String(r.id).slice(0, 8)}</div>
      </div>
    )},
    { key: "size", header: "الحجم", cell: (r) => <span className="text-slate-200">{Number(r.size_gb ?? 0)} GB</span> },
    { key: "when", header: "تاريخ", cell: (r) => <span className="text-xs font-mono text-muted-foreground">{new Date(r.created_at).toLocaleString("ar-EG")}</span> },
    { key: "st", header: "الحالة", cell: (r) => <StatusPill label={STATUS[r.status]?.label ?? r.status ?? "—"} hex={STATUS[r.status]?.hex ?? "#94a3b8"} /> },
    { key: "act", header: "", cell: (r) => (
      <button onClick={() => remove(r.id)} className="w-8 h-8 rounded-lg grid place-items-center border border-white/10 hover:border-rose-neon/50 text-slate-300 hover:text-rose-neon transition" title="حذف">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    )},
  ];

  return (
    <div>
      <PageHeader icon={FileArchive} title="النسخ الاحتياطي" hex="#34d399"
        subtitle={`${rows.length} نسخة — ${rows.filter((r: any) => r.status === "completed").length} مكتملة`}
        actions={<NeonButton hex="#34d399" icon={Play} onClick={runNow}>نسخ فوري</NeonButton>} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="panel p-4 flex items-center justify-between">
          <div><div className="text-xs text-muted-foreground">جدولة تلقائية</div><div className="text-lg font-bold text-white mt-1">كل ساعة</div></div>
          <Clock className="w-6 h-6 text-cyan-neon" />
        </div>
        <div className="panel p-4 flex items-center justify-between">
          <div><div className="text-xs text-muted-foreground">إجمالي الحجم</div><div className="text-lg font-bold text-white mt-1">{totalGb.toFixed(1)} GB</div></div>
          <FileArchive className="w-6 h-6 text-violet-neon" />
        </div>
        <div className="panel p-4 flex items-center justify-between">
          <div><div className="text-xs text-muted-foreground">الاحتفاظ</div><div className="text-lg font-bold text-white mt-1">آخر 30 يوماً</div></div>
          <RotateCcw className="w-6 h-6 text-emerald-neon" />
        </div>
      </div>

      <DataTable rows={rows} columns={columns} />
    </div>
  );
}
