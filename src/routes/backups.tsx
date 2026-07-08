import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileArchive, Play, Download, RotateCcw, Trash2, Clock } from "lucide-react";
import { PageHeader, NeonButton, StatusPill } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { MOCK_BACKUPS, type Backup } from "@/lib/mock-data";

export const Route = createFileRoute("/backups")({
  head: () => ({ meta: [{ title: "النسخ الاحتياطي — SUPER ADMIN" }, { name: "description", content: "إدارة النسخ الاحتياطية والاستعادة." }] }),
  component: BackupsPage,
});

const STATUS = {
  completed: { label: "مكتمل", hex: "#22d3ee" },
  running:   { label: "قيد التنفيذ", hex: "#fbbf24" },
  failed:    { label: "فشل", hex: "#fb7185" },
} as const;

function BackupsPage() {
  const [rows, setRows] = useState<Backup[]>(MOCK_BACKUPS);
  const runNow = () => {
    const now = new Date().toLocaleTimeString("ar-EG", { hour12: false, hour: "2-digit", minute: "2-digit" });
    const nb: Backup = { id: crypto.randomUUID(), name: `manual_${Date.now()}`, target: "قاعدة الدماغ", size: "428 MB", created: now, status: "running", type: "manual" };
    setRows((p) => [nb, ...p]);
    setTimeout(() => setRows((p) => p.map((r) => r.id === nb.id ? { ...r, status: "completed" } : r)), 2500);
  };

  const columns: Column<Backup>[] = [
    { key: "name", header: "الاسم", cell: (r) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg grid place-items-center"
             style={{ background: "radial-gradient(circle at 30% 30%, #34d39955, #34d39911)", border: "1px solid #34d39955", boxShadow: "0 0 10px #34d39944" }}>
          <FileArchive className="w-4 h-4 text-emerald-neon" />
        </div>
        <div>
          <div className="font-mono text-white text-sm">{r.name}</div>
          <div className="text-[11px] text-muted-foreground">{r.target}</div>
        </div>
      </div>
    )},
    { key: "size", header: "الحجم", cell: (r) => <span className="text-slate-200">{r.size}</span> },
    { key: "when", header: "وقت الإنشاء", cell: (r) => <span className="text-xs font-mono text-muted-foreground">{r.created}</span> },
    { key: "type", header: "النوع", cell: (r) => (
      <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
            style={r.type === "auto"
              ? { background: "#22d3ee22", color: "#22d3ee", border: "1px solid #22d3ee55" }
              : { background: "#a78bfa22", color: "#a78bfa", border: "1px solid #a78bfa55" }}>
        {r.type === "auto" ? "تلقائي" : "يدوي"}
      </span>
    )},
    { key: "st", header: "الحالة", cell: (r) => <StatusPill label={STATUS[r.status].label} hex={STATUS[r.status].hex} /> },
    { key: "act", header: "", cell: (r) => (
      <div className="flex gap-1.5">
        <button className="w-8 h-8 rounded-lg grid place-items-center border border-white/10 hover:border-cyan-neon/50 text-slate-300 hover:text-cyan-neon transition" title="تنزيل"><Download className="w-3.5 h-3.5" /></button>
        <button className="w-8 h-8 rounded-lg grid place-items-center border border-white/10 hover:border-amber-neon/50 text-slate-300 hover:text-amber-neon transition" title="استعادة"><RotateCcw className="w-3.5 h-3.5" /></button>
        <button onClick={() => setRows((p) => p.filter((x) => x.id !== r.id))} className="w-8 h-8 rounded-lg grid place-items-center border border-white/10 hover:border-rose-neon/50 text-slate-300 hover:text-rose-neon transition" title="حذف"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader icon={FileArchive} title="النسخ الاحتياطي" hex="#34d399"
        subtitle={`${rows.length} نسخة — ${rows.filter(r=>r.status==="completed").length} مكتملة`}
        actions={<NeonButton hex="#34d399" icon={Play} onClick={runNow}>نسخ فوري</NeonButton>} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="panel p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">جدولة تلقائية</div>
            <div className="text-lg font-bold text-white mt-1">كل ساعة</div>
          </div>
          <Clock className="w-6 h-6 text-cyan-neon" />
        </div>
        <div className="panel p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">إجمالي الحجم</div>
            <div className="text-lg font-bold text-white mt-1">24.6 GB</div>
          </div>
          <FileArchive className="w-6 h-6 text-violet-neon" />
        </div>
        <div className="panel p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">الاحتفاظ</div>
            <div className="text-lg font-bold text-white mt-1">آخر 7 نسخ</div>
          </div>
          <RotateCcw className="w-6 h-6 text-emerald-neon" />
        </div>
      </div>

      <DataTable rows={rows} columns={columns} />
    </div>
  );
}
