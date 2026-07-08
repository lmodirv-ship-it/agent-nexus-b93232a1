import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Database, Plus, Zap, Users, HardDrive } from "lucide-react";
import { PageHeader, NeonButton, StatusPill } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { MOCK_DBS, type DbRow } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/databases")({
  head: () => ({ meta: [{ title: "قواعد البيانات — SUPER ADMIN" }, { name: "description", content: "مراقبة وإدارة قواعد البيانات." }] }),
  component: DatabasesPage,
});

const STATUS = {
  healthy:  { label: "سليم",  hex: "#22d3ee" },
  warning:  { label: "تحذير", hex: "#fbbf24" },
  critical: { label: "حرج",   hex: "#fb7185" },
} as const;

const ENGINE_HEX: Record<DbRow["engine"], string> = {
  Postgres: "#38bdf8", MySQL: "#f97316", Mongo: "#34d399", Redis: "#fb7185",
};

function DatabasesPage() {
  const [rows, setRows] = useState<DbRow[]>(MOCK_DBS);

  useEffect(() => {
    const id = setInterval(() => {
      setRows((prev) => prev.map((r) => ({
        ...r,
        connections: Math.max(1, r.connections + Math.round(Math.random() * 10 - 5)),
        queriesPerSec: Math.max(10, r.queriesPerSec + Math.round(Math.random() * 60 - 30)),
      })));
    }, 1600);
    return () => clearInterval(id);
  }, []);

  const columns: Column<DbRow>[] = [
    { key: "name", header: "قاعدة البيانات", cell: (r) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg grid place-items-center"
             style={{ background: `radial-gradient(circle at 30% 30%, ${ENGINE_HEX[r.engine]}55, ${ENGINE_HEX[r.engine]}11)`, border: `1px solid ${ENGINE_HEX[r.engine]}55`, boxShadow: `0 0 10px ${ENGINE_HEX[r.engine]}44` }}>
          <Database className="w-4 h-4" style={{ color: ENGINE_HEX[r.engine] }} />
        </div>
        <div>
          <div className="font-semibold text-white font-mono">{r.name}</div>
          <div className="text-[11px]" style={{ color: ENGINE_HEX[r.engine] }}>{r.engine}</div>
        </div>
      </div>
    )},
    { key: "size", header: "الحجم",   cell: (r) => <div className="flex items-center gap-1.5 text-slate-200"><HardDrive className="w-3.5 h-3.5 text-cyan-neon" />{r.size}</div> },
    { key: "conn", header: "اتصالات", cell: (r) => <div className="flex items-center gap-1.5 text-slate-200"><Users className="w-3.5 h-3.5 text-violet-neon" />{r.connections}</div> },
    { key: "qps",  header: "QPS",     cell: (r) => <div className="flex items-center gap-1.5 font-bold" style={{ color: "#a78bfa" }}><Zap className="w-3.5 h-3.5" />{r.queriesPerSec.toLocaleString("en-US")}</div> },
    { key: "st",   header: "الحالة",  cell: (r) => <StatusPill label={STATUS[r.status].label} hex={STATUS[r.status].hex} /> },
    { key: "act",  header: "", cell: () => (
      <div className="flex gap-1.5">
        <button className="px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-white/10 hover:border-cyan-neon/50 text-slate-300 hover:text-cyan-neon transition">استعلام</button>
        <button className="px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-white/10 hover:border-emerald-neon/50 text-slate-300 hover:text-emerald-neon transition">نسخ</button>
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader icon={Database} title="قواعد البيانات" hex="#38bdf8"
        subtitle={`${rows.length} قاعدة · ${rows.reduce((a, r) => a + r.connections, 0)} اتصال حي`}
        actions={<NeonButton hex="#38bdf8" icon={Plus}>قاعدة جديدة</NeonButton>} />
      <DataTable rows={rows} columns={columns} />
    </div>
  );
}
