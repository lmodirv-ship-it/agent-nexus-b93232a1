import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Key, Plus, Copy, Trash2, Power } from "lucide-react";
import { PageHeader, NeonButton, StatusPill } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { MOCK_KEYS, type ApiKey } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/security/api-keys")({
  head: () => ({ meta: [{ title: "مفاتيح API — SUPER ADMIN" }, { name: "description", content: "إنشاء وإدارة مفاتيح API." }] }),
  component: KeysPage,
});

function KeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>(MOCK_KEYS);
  const toggle = (id: string) => setKeys((p) => p.map((k) => k.id === id ? { ...k, active: !k.active } : k));
  const remove = (id: string) => setKeys((p) => p.filter((k) => k.id !== id));

  const columns: Column<ApiKey>[] = [
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
        {k.scopes.map((s) => (
          <span key={s} className="text-[10px] px-2 py-0.5 rounded-full font-mono"
                style={{ background: "#38bdf822", color: "#38bdf8", border: "1px solid #38bdf855" }}>{s}</span>
        ))}
      </div>
    )},
    { key: "created", header: "أُنشئ", cell: (k) => <span className="text-xs text-muted-foreground font-mono">{k.created}</span> },
    { key: "used",    header: "آخر استخدام", cell: (k) => <span className="text-xs text-slate-300">{k.lastUsed}</span> },
    { key: "st",      header: "الحالة", cell: (k) => <StatusPill label={k.active ? "نشط" : "مجمّد"} hex={k.active ? "#22d3ee" : "#64748b"} /> },
    { key: "act", header: "", cell: (k) => (
      <div className="flex gap-1.5">
        <button className="w-8 h-8 rounded-lg grid place-items-center border border-white/10 hover:border-cyan-neon/50 text-slate-300 hover:text-cyan-neon transition" title="نسخ"><Copy className="w-3.5 h-3.5" /></button>
        <button onClick={() => toggle(k.id)} className="w-8 h-8 rounded-lg grid place-items-center border border-white/10 hover:border-amber-neon/50 text-slate-300 hover:text-amber-neon transition" title="تبديل الحالة"><Power className="w-3.5 h-3.5" /></button>
        <button onClick={() => remove(k.id)} className="w-8 h-8 rounded-lg grid place-items-center border border-white/10 hover:border-rose-neon/50 text-slate-300 hover:text-rose-neon transition" title="حذف"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader icon={Key} title="مفاتيح API" hex="#a78bfa" subtitle={`${keys.length} مفتاح — ${keys.filter(k=>k.active).length} نشط`}
        actions={<NeonButton hex="#a78bfa" icon={Plus}>مفتاح جديد</NeonButton>} />
      <DataTable rows={keys} columns={columns} />
    </div>
  );
}
