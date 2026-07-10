import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { listClients, upsertClient, deleteClient } from "@/lib/queries.functions";
import { PageHeader, NeonButton, StatusPill } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { ClientAuditDrawer } from "@/components/dashboard/ClientAuditDrawer";
import {
  Plus, Pencil, Trash2, Users, Building2, Mail, Phone, X, Search, Globe,
  HardDrive, Database, Activity, Clock, ExternalLink, RefreshCw, History,
} from "lucide-react";

const clientsQ = queryOptions({
  queryKey: ["clients"],
  queryFn: () => listClients(),
  refetchInterval: 15000,
  refetchOnWindowFocus: true,
});

export const Route = createFileRoute("/_authenticated/clients")({
  head: () => ({ meta: [{ title: "العملاء — SUPER ADMIN" }, { name: "description", content: "جميع العملاء والمواقع المرتبطة بهم." }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(clientsQ),
  component: ClientsPage,
  errorComponent: ({ error }) => <div className="panel p-6">{error.message}</div>,
  notFoundComponent: () => <div className="panel p-6">لم يوجد</div>,
});

type Client = {
  id: string; name: string; email?: string | null; phone?: string | null; company?: string | null;
  status?: string | null; notes?: string | null; created_at?: string;
  sites_count?: number; online_count?: number; connected_count?: number;
  users_total?: number; db_total?: number; storage_total?: number; avg_activity?: number;
  last_seen?: string | null;
};

const STATUS: Record<string, { label: string; hex: string }> = {
  active: { label: "نشط", hex: "#22d3ee" },
  paused: { label: "موقوف", hex: "#fbbf24" },
  pending: { label: "بانتظار", hex: "#a78bfa" },
  inactive: { label: "غير نشط", hex: "#64748b" },
  archived: { label: "مؤرشف", hex: "#64748b" },
};

const ACTIVITY_BUCKETS = [
  { key: "all", label: "كل النشاط", min: 0, max: 100 },
  { key: "high", label: "نشط (>70%)", min: 71, max: 100 },
  { key: "mid", label: "متوسط (30–70%)", min: 30, max: 70 },
  { key: "low", label: "خامل (<30%)", min: 0, max: 29 },
];

const SIZE_BUCKETS = [
  { key: "all", label: "الكل", min: 0, max: Infinity },
  { key: "small", label: "< 1", min: 0, max: 1 },
  { key: "medium", label: "1–10", min: 1, max: 10 },
  { key: "large", label: "10–100", min: 10, max: 100 },
  { key: "xlarge", label: "+100", min: 100, max: Infinity },
];

function timeAgo(iso?: string | null) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 5) return "الآن";
  if (s < 60) return `${s} ث`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} د`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} س`;
  return `${Math.floor(h / 24)} ي`;
}

function ClientsPage() {
  const { data: clients, dataUpdatedAt, isFetching, refetch } = useSuspenseQuery(clientsQ);
  const qc = useQueryClient();
  const upsertFn = useServerFn(upsertClient);
  const deleteFn = useServerFn(deleteClient);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activityBucket, setActivityBucket] = useState("all");
  const [dbBucket, setDbBucket] = useState("all");
  const [storageBucket, setStorageBucket] = useState("all");
  const [editing, setEditing] = useState<Partial<Client> | null>(null);
  const [audit, setAudit] = useState<{ id: string; name: string } | null>(null);

  // Force re-render each second so "منذ X ث" updates smoothly
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const saveMut = useMutation({
    mutationFn: (d: any) => upsertFn({ data: d }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clients"] }); setEditing(null); },
  });
  const delMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });

  const filtered = useMemo(() => {
    const act = ACTIVITY_BUCKETS.find((b) => b.key === activityBucket)!;
    const db = SIZE_BUCKETS.find((b) => b.key === dbBucket)!;
    const st = SIZE_BUCKETS.find((b) => b.key === storageBucket)!;
    return (clients as Client[]).filter((c) => {
      const q = search.trim().toLowerCase();
      const okQ = !q ||
        c.name.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.company ?? "").toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q);
      const okS = statusFilter === "all" ? true : (c.status ?? "active") === statusFilter;
      const rate = Number(c.avg_activity ?? 0);
      const okA = rate >= act.min && rate <= act.max;
      const dbv = Number(c.db_total ?? 0);
      const okDb = dbv >= db.min && dbv <= db.max;
      const stv = Number(c.storage_total ?? 0);
      const okSt = stv >= st.min && stv <= st.max;
      return okQ && okS && okA && okDb && okSt;
    });
  }, [clients, search, statusFilter, activityBucket, dbBucket, storageBucket]);

  const totals = useMemo(() => (clients as Client[]).reduce((acc, c) => ({
    clients: acc.clients + 1,
    sites: acc.sites + (c.sites_count ?? 0),
    users: acc.users + (c.users_total ?? 0),
    online: acc.online + (c.online_count ?? 0),
  }), { clients: 0, sites: 0, users: 0, online: 0 }), [clients]);

  const columns: Column<Client>[] = [
    { key: "name", header: "العميل", sortValue: (c) => c.name.toLowerCase(), cell: (c) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg grid place-items-center border border-cyan-neon/40 bg-cyan-neon/10 text-cyan-neon font-bold">
          {c.name.trim().charAt(0)}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-white truncate">{c.name}</div>
          {c.company && <div className="text-[11px] text-muted-foreground flex items-center gap-1"><Building2 className="w-3 h-3" />{c.company}</div>}
        </div>
      </div>
    )},
    { key: "contact", header: "التواصل", cell: (c) => (
      <div className="space-y-0.5 text-[11px]">
        {c.email ? <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-slate-200 hover:text-cyan-neon"><Mail className="w-3 h-3" />{c.email}</a> : <div className="text-muted-foreground">—</div>}
        {c.phone && <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-slate-300 hover:text-cyan-neon" dir="ltr"><Phone className="w-3 h-3" />{c.phone}</a>}
      </div>
    )},
    { key: "status", header: "الحالة", sortValue: (c) => c.status ?? "active", cell: (c) => {
      const s = STATUS[c.status ?? "active"] ?? STATUS.active;
      return <StatusPill label={s.label} hex={s.hex} />;
    }},
    { key: "sites", header: "المواقع", sortValue: (c) => c.sites_count ?? 0, cell: (c) => (
      <div className="text-xs">
        <div className="flex items-center gap-1 text-slate-100"><Globe className="w-3.5 h-3.5 text-cyan-neon" /><span className="font-bold">{c.sites_count ?? 0}</span></div>
        <div className="text-[10px] text-muted-foreground">{c.online_count ?? 0} يعمل · {c.connected_count ?? 0} متصل</div>
      </div>
    )},
    { key: "users", header: "المستخدمون", sortValue: (c) => c.users_total ?? 0, cell: (c) => (
      <div className="flex items-center gap-1.5 text-slate-200 text-xs"><Users className="w-3.5 h-3.5 text-violet-neon" />{(c.users_total ?? 0).toLocaleString("en-US")}</div>
    )},
    { key: "db", header: "DB", sortValue: (c) => Number(c.db_total ?? 0), cell: (c) => (
      <div className="flex items-center gap-1.5 text-slate-300 text-xs"><Database className="w-3.5 h-3.5 text-cyan-neon" />{Number(c.db_total ?? 0)} GB</div>
    )},
    { key: "storage", header: "التخزين", sortValue: (c) => Number(c.storage_total ?? 0), cell: (c) => (
      <div className="flex items-center gap-1.5 text-slate-300 text-xs"><HardDrive className="w-3.5 h-3.5 text-violet-neon" />{Number(c.storage_total ?? 0)} GB</div>
    )},
    { key: "activity", header: "النشاط", sortValue: (c) => Number(c.avg_activity ?? 0), cell: (c) => {
      const rate = Math.max(0, Math.min(100, Number(c.avg_activity ?? 0)));
      const hex = rate > 70 ? "#22d3ee" : rate > 30 ? "#fbbf24" : "#64748b";
      return (
        <div className="flex items-center gap-2 min-w-[110px]">
          <Activity className="w-3.5 h-3.5" style={{ color: hex }} />
          <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${rate}%`, background: hex, boxShadow: `0 0 8px ${hex}88` }} />
          </div>
          <span className="text-[10px] text-slate-300 tabular-nums w-8 text-left">{rate}%</span>
        </div>
      );
    }},
    { key: "seen", header: "آخر ظهور", sortValue: (c) => c.last_seen ? new Date(c.last_seen).getTime() : 0, cell: (c) => (
      <div className="flex items-center gap-1 text-[11px] text-slate-300"><Clock className="w-3 h-3" />{timeAgo(c.last_seen)}</div>
    )},
    { key: "act", header: "الإجراءات", cell: (c) => (
      <div className="flex items-center gap-1">
        <a href={`/sites?client=${c.id}`} title="فتح مواقع العميل"
           className="w-8 h-8 rounded-lg grid place-items-center border border-cyan-neon/30 hover:border-cyan-neon hover:bg-cyan-neon/10 text-cyan-neon transition">
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <button onClick={() => setEditing(c)} title="تعديل بيانات العميل"
          className="w-8 h-8 rounded-lg grid place-items-center border border-violet-neon/30 hover:border-violet-neon hover:bg-violet-neon/10 text-violet-neon transition">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => setAudit({ id: c.id, name: c.name })} title="سجل التغييرات"
          className="w-8 h-8 rounded-lg grid place-items-center border border-amber-400/30 hover:border-amber-400 hover:bg-amber-400/10 text-amber-400 transition">
          <History className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => { if (confirm(`حذف ${c.name}؟`)) delMut.mutate(c.id); }} title="حذف"
          className="w-8 h-8 rounded-lg grid place-items-center border border-rose-neon/30 hover:border-rose-neon hover:bg-rose-neon/10 text-rose-neon transition">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    )},
  ];

  const secSinceUpdate = Math.floor((Date.now() - dataUpdatedAt) / 1000);
  const freshHex = secSinceUpdate < 20 ? "#22d3ee" : secSinceUpdate < 60 ? "#fbbf24" : "#fb7185";

  return (
    <div>
      <PageHeader title="إدارة العملاء" icon={Users}
        subtitle={`${totals.clients} عميل · ${totals.sites} موقع · ${totals.online} يعمل · ${totals.users.toLocaleString("en-US")} مستخدم`}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-semibold"
                 style={{ borderColor: `${freshHex}55`, background: `${freshHex}15`, color: freshHex }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: freshHex, boxShadow: `0 0 6px ${freshHex}` }} />
              آخر تحديث: منذ {timeAgo(new Date(dataUpdatedAt).toISOString())}
            </div>
            <button onClick={() => refetch()} disabled={isFetching}
              className="w-9 h-9 rounded-lg grid place-items-center border border-white/10 hover:border-cyan-neon/50 hover:text-cyan-neon text-slate-300 transition disabled:opacity-50"
              title="تحديث يدوي">
              <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            </button>
            <NeonButton icon={Plus} onClick={() => setEditing({ status: "active" })}>عميل جديد</NeonButton>
          </div>
        } />

      <div className="panel p-3 mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث بالاسم / الشركة / البريد / الهاتف..."
                   className="w-full bg-black/30 border border-white/10 rounded-lg pr-9 pl-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-neon/40" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {["all", "active", "pending", "paused", "inactive", "archived"].map((f) => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition"
                style={statusFilter === f
                  ? { borderColor: "#22d3ee88", background: "#22d3ee22", color: "#fff", boxShadow: "0 0 12px #22d3ee55" }
                  : { borderColor: "rgba(255,255,255,0.08)", color: "#94a3b8" }}>
                {f === "all" ? "الكل" : (STATUS[f]?.label ?? f)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <FilterGroup label="النشاط" hex="#22d3ee" icon={Activity}
            options={ACTIVITY_BUCKETS.map((b) => ({ key: b.key, label: b.label }))}
            value={activityBucket} onChange={setActivityBucket} />
          <FilterGroup label="حجم DB (GB)" hex="#a78bfa" icon={Database}
            options={SIZE_BUCKETS.map((b) => ({ key: b.key, label: b.label }))}
            value={dbBucket} onChange={setDbBucket} />
          <FilterGroup label="التخزين (GB)" hex="#fbbf24" icon={HardDrive}
            options={SIZE_BUCKETS.map((b) => ({ key: b.key, label: b.label }))}
            value={storageBucket} onChange={setStorageBucket} />
        </div>
      </div>

      <DataTable rows={filtered} columns={columns} initialSort={{ key: "sites", dir: "desc" }} />

      {audit && <ClientAuditDrawer clientId={audit.id} clientName={audit.name} onClose={() => setAudit(null)} />}

      {editing && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm grid place-items-center z-50 p-4" onClick={() => setEditing(null)}>
          <div className="panel p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{editing.id ? "تعديل عميل" : "عميل جديد"}</h3>
              <button onClick={() => setEditing(null)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); saveMut.mutate(editing); }} className="space-y-3">
              <input required placeholder="الاسم *" value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-neon/40" />
              <input type="email" placeholder="البريد الإلكتروني" value={editing.email ?? ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-neon/40" />
              <input placeholder="الهاتف" value={editing.phone ?? ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-neon/40" />
              <input placeholder="الشركة" value={editing.company ?? ""} onChange={(e) => setEditing({ ...editing, company: e.target.value })}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-neon/40" />
              <select value={editing.status ?? "active"} onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-neon/40">
                <option value="active">نشط</option>
                <option value="pending">بانتظار</option>
                <option value="paused">موقوف</option>
                <option value="inactive">غير نشط</option>
                <option value="archived">مؤرشف</option>
              </select>
              <textarea placeholder="ملاحظات" value={editing.notes ?? ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-neon/40 h-20 resize-none" />
              {saveMut.error && <div className="text-xs text-rose-neon">{(saveMut.error as Error).message}</div>}
              <button type="submit" disabled={saveMut.isPending}
                className="w-full py-2.5 rounded-lg bg-gradient-to-l from-cyan-neon to-violet-neon text-background font-bold text-sm hover:opacity-90 transition disabled:opacity-50">
                {saveMut.isPending ? "..." : "حفظ"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterGroup({
  label, hex, icon: Icon, options, value, onChange,
}: {
  label: string; hex: string; icon: any;
  options: { key: string; label: string }[];
  value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="rounded-lg border border-white/5 bg-black/20 p-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold mb-1.5" style={{ color: hex }}>
        <Icon className="w-3 h-3" />{label}
      </div>
      <div className="flex flex-wrap gap-1">
        {options.map((o) => {
          const active = value === o.key;
          return (
            <button key={o.key} onClick={() => onChange(o.key)}
              className="text-[11px] font-semibold px-2 py-1 rounded transition"
              style={active
                ? { background: `${hex}22`, color: hex, border: `1px solid ${hex}66` }
                : { border: "1px solid rgba(255,255,255,0.06)", color: "#94a3b8" }}>
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
