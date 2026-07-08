import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Shield, Ban } from "lucide-react";
import { PageHeader, StatusPill } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { listAttackAttempts } from "@/lib/queries.functions";

const attemptsQ = queryOptions({ queryKey: ["attacks"], queryFn: () => listAttackAttempts() });

export const Route = createFileRoute("/_authenticated/security/attempts")({
  head: () => ({ meta: [{ title: "محاولات الاختراق — SUPER ADMIN" }, { name: "description", content: "سجل محاولات الاختراق المكتشفة." }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(attemptsQ),
  component: AttemptsPage,
  errorComponent: ({ error }) => <div className="panel p-6">{error.message}</div>,
  notFoundComponent: () => <div className="panel p-6">غير موجود</div>,
});

function AttemptsPage() {
  const { data: rows } = useSuspenseQuery(attemptsQ);

  const columns: Column<any>[] = [
    { key: "ip", header: "IP", cell: (r) => <span className="font-mono text-white">{r.ip}</span> },
    { key: "country", header: "الدولة", cell: (r) => <span className="text-slate-200">{r.country ?? "—"}</span> },
    { key: "kind", header: "النوع", cell: (r) => <span className="text-[11px] px-2 py-0.5 rounded-full font-mono" style={{ background: "#fb718522", color: "#fb7185", border: "1px solid #fb718555" }}>{r.kind ?? "—"}</span> },
    { key: "target", header: "الهدف", cell: (r) => <span className="font-mono text-xs text-slate-300">{r.target ?? "—"}</span> },
    { key: "when", header: "الوقت", cell: (r) => <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("ar-EG")}</span> },
    { key: "st", header: "الحالة", cell: (r) => <StatusPill label={r.blocked ? "محجوب" : "مسموح"} hex={r.blocked ? "#22d3ee" : "#fb7185"} /> },
  ];

  return (
    <div>
      <PageHeader icon={Ban} title="محاولات الاختراق" hex="#fb7185"
        subtitle={`${rows.length} محاولة — ${rows.filter((r: any) => r.blocked).length} محجوبة`} />
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="panel p-4"><div className="text-xs text-muted-foreground">إجمالي</div><div className="text-2xl font-black text-rose-neon mt-1">{rows.length}</div></div>
        <div className="panel p-4"><div className="text-xs text-muted-foreground">محجوبة</div><div className="text-2xl font-black text-cyan-neon mt-1">{rows.filter((r: any) => r.blocked).length}</div></div>
        <div className="panel p-4 flex items-center justify-between"><div><div className="text-xs text-muted-foreground">جدار الحماية</div><div className="text-sm font-bold text-emerald-neon mt-1">نشط</div></div><Shield className="w-6 h-6 text-emerald-neon" /></div>
      </div>
      <DataTable rows={rows} columns={columns} />
    </div>
  );
}
