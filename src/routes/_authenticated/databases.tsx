import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { Database, Plus, HardDrive, Trash2 } from "lucide-react";
import { PageHeader, NeonButton, StatusPill } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { listDatabases, deleteDatabase } from "@/lib/queries.functions";

const dbsQ = queryOptions({ queryKey: ["databases"], queryFn: () => listDatabases() });

export const Route = createFileRoute("/_authenticated/databases")({
  head: () => ({ meta: [{ title: "قواعد البيانات — SUPER ADMIN" }, { name: "description", content: "مراقبة وإدارة قواعد البيانات." }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(dbsQ),
  component: DatabasesPage,
  errorComponent: ({ error }) => <div className="panel p-6">{error.message}</div>,
  notFoundComponent: () => <div className="panel p-6">غير موجود</div>,
});

const STATUS: Record<string, { label: string; hex: string }> = {
  healthy: { label: "سليم", hex: "#22d3ee" },
  warning: { label: "تحذير", hex: "#fbbf24" },
  critical: { label: "حرج", hex: "#fb7185" },
};

const ENGINE_HEX: Record<string, string> = {
  Postgres: "#38bdf8", MySQL: "#f97316", Mongo: "#34d399", Redis: "#fb7185",
};

function DatabasesPage() {
  const { data: rows } = useSuspenseQuery(dbsQ);
  const qc = useQueryClient();

  const handleDelete = async (id: string) => {
    if (!confirm("حذف؟")) return;
    await deleteDatabase({ data: { id } });
    qc.invalidateQueries({ queryKey: ["databases"] });
  };

  const columns: Column<any>[] = [
    { key: "name", header: "قاعدة البيانات", cell: (r) => {
      const hex = ENGINE_HEX[r.engine] ?? "#38bdf8";
      return (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg grid place-items-center"
               style={{ background: `radial-gradient(circle at 30% 30%, ${hex}55, ${hex}11)`, border: `1px solid ${hex}55`, boxShadow: `0 0 10px ${hex}44` }}>
            <Database className="w-4 h-4" style={{ color: hex }} />
          </div>
          <div>
            <div className="font-semibold text-white font-mono">{r.name}</div>
            <div className="text-[11px]" style={{ color: hex }}>{r.engine}</div>
          </div>
        </div>
      );
    }},
    { key: "size", header: "الحجم", cell: (r) => <div className="flex items-center gap-1.5 text-slate-200"><HardDrive className="w-3.5 h-3.5 text-cyan-neon" />{Number(r.size_gb ?? 0)} GB</div> },
    { key: "st", header: "الحالة", cell: (r) => <StatusPill label={STATUS[r.status]?.label ?? r.status ?? "—"} hex={STATUS[r.status]?.hex ?? "#94a3b8"} /> },
    { key: "act", header: "", cell: (r) => (
      <button onClick={() => handleDelete(r.id)} className="w-8 h-8 rounded-lg grid place-items-center border border-white/10 hover:border-rose-neon/50 text-slate-300 hover:text-rose-neon transition" title="حذف">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    )},
  ];

  return (
    <div>
      <PageHeader icon={Database} title="قواعد البيانات" hex="#38bdf8"
        subtitle={`${rows.length} قاعدة`}
        actions={<NeonButton hex="#38bdf8" icon={Plus}>قاعدة جديدة</NeonButton>} />
      <DataTable rows={rows} columns={columns} />
    </div>
  );
}
