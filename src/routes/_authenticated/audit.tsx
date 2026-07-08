import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Shield, Search, Clock, User as UserIcon } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";

export const Route = createFileRoute("/_authenticated/audit")({
  head: () => ({
    meta: [
      { title: "سجل التعديلات — Audit Log" },
      { name: "description", content: "تتبع كل الإجراءات التي يقوم بها المالك والمشرفون على المنصة." },
    ],
  }),
  component: AuditPage,
});

type Action = "create" | "update" | "delete" | "toggle" | "trigger" | "login";
interface AuditRow {
  id: string; time: string; admin: string; action: Action; target: string; details: string; ip: string;
}

const ACTION_META: Record<Action, { label: string; hex: string }> = {
  create:  { label: "إنشاء",       hex: "#34d399" },
  update:  { label: "تعديل",       hex: "#fbbf24" },
  delete:  { label: "حذف",         hex: "#fb7185" },
  toggle:  { label: "تبديل",       hex: "#a78bfa" },
  trigger: { label: "تنفيذ فوري",  hex: "#22d3ee" },
  login:   { label: "دخول",        hex: "#64748b" },
};

const SEED: AuditRow[] = [
  { id: "1", time: "2026-07-08 12:35:00", admin: "المالك", action: "trigger", target: "AI Debugger",    details: "تم التنفيذ الفوري",                    ip: "192.168.1.1" },
  { id: "2", time: "2026-07-08 12:30:00", admin: "المالك", action: "update",  target: "Auto-Scaler",    details: "تغيير التكرار من 30 إلى 60 ثانية",   ip: "192.168.1.1" },
  { id: "3", time: "2026-07-08 11:00:00", admin: "المالك", action: "create",  target: "Weekly Report",  details: "إنشاء وكيل جديد",                       ip: "192.168.1.1" },
  { id: "4", time: "2026-07-08 10:15:00", admin: "المالك", action: "toggle",  target: "WAF Protection", details: "تم الإيقاف مؤقتاً",                    ip: "192.168.1.1" },
  { id: "5", time: "2026-07-08 09:00:00", admin: "المالك", action: "login",   target: "System",         details: "تسجيل الدخول من جهاز جديد",            ip: "192.168.1.100" },
  { id: "6", time: "2026-07-07 22:12:00", admin: "المالك", action: "delete",  target: "API Key #k4",    details: "إبطال مفتاح مطور خارجي",                ip: "192.168.1.1" },
  { id: "7", time: "2026-07-07 20:04:00", admin: "المالك", action: "update",  target: "Site: souk.hn",  details: "زيادة النسخ من 2 إلى 3",                ip: "192.168.1.1" },
];

function AuditPage() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Action | "all">("all");

  const rows = useMemo(() => SEED.filter(r =>
    (filter === "all" || r.action === filter) &&
    (q === "" || [r.admin, r.target, r.details, r.ip].some(v => v.includes(q)))
  ), [q, filter]);

  const columns: Column<AuditRow>[] = [
    { key: "time", header: "الوقت", cell: r => (
      <span className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
        <Clock className="w-3.5 h-3.5" /> {r.time}
      </span>
    )},
    { key: "admin", header: "المسؤول", cell: r => (
      <span className="flex items-center gap-2 font-semibold">
        <UserIcon className="w-3.5 h-3.5 text-cyan-neon" /> {r.admin}
      </span>
    )},
    { key: "action", header: "الإجراء", cell: r => {
      const m = ACTION_META[r.action];
      return (
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: `${m.hex}22`, color: m.hex, border: `1px solid ${m.hex}55` }}>
          {m.label}
        </span>
      );
    }},
    { key: "target", header: "الهدف", cell: r => <span className="font-medium">{r.target}</span> },
    { key: "details", header: "التفاصيل", cell: r => <span className="text-muted-foreground">{r.details}</span> },
    { key: "ip", header: "IP", cell: r => <span className="font-mono text-xs text-muted-foreground">{r.ip}</span> },
  ];

  return (
    <div>
      <PageHeader
        icon={Shield}
        title="سجل التعديلات"
        subtitle="كل إجراء يتم على المنصة يُسجَّل هنا: من قام به، متى، ومن أي IP."
        hex="#a78bfa"
      />

      <div className="panel p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="ابحث في السجل..."
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 pr-10 text-sm focus:border-cyan-neon/60 outline-none"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(["all", ...Object.keys(ACTION_META)] as (Action | "all")[]).map(a => {
            const active = filter === a;
            const hex = a === "all" ? "#22d3ee" : ACTION_META[a as Action].hex;
            const label = a === "all" ? "الكل" : ACTION_META[a as Action].label;
            return (
              <button key={a} onClick={() => setFilter(a)}
                className="text-[11px] font-bold px-3 py-1.5 rounded-lg transition"
                style={{
                  background: active ? `${hex}33` : "transparent",
                  color: active ? hex : "#94a3b8",
                  border: `1px solid ${active ? hex + "88" : "#ffffff15"}`,
                }}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <DataTable rows={rows} columns={columns} />
    </div>
  );
}
