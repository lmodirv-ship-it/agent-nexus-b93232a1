import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listClients, upsertClient, deleteClient } from "@/lib/queries.functions";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Plus, Pencil, Trash2, Users, Building2, Mail, Phone, X } from "lucide-react";

const clientsQ = queryOptions({ queryKey: ["clients"], queryFn: () => listClients() });

export const Route = createFileRoute("/_authenticated/clients")({
  loader: ({ context }) => context.queryClient.ensureQueryData(clientsQ),
  component: ClientsPage,
  errorComponent: ({ error }) => <div className="panel p-6">{error.message}</div>,
  notFoundComponent: () => <div className="panel p-6">لم يوجد</div>,
});

type Client = { id: string; name: string; email?: string | null; phone?: string | null; company?: string | null; status?: string | null; notes?: string | null; sites_count?: number };

function ClientsPage() {
  const { data: clients } = useSuspenseQuery(clientsQ);
  const qc = useQueryClient();
  const upsertFn = useServerFn(upsertClient);
  const deleteFn = useServerFn(deleteClient);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Partial<Client> | null>(null);

  const saveMut = useMutation({
    mutationFn: (d: any) => upsertFn({ data: d }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clients"] }); setEditing(null); },
  });
  const delMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });

  const filtered = clients.filter((c: Client) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (c.company ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader title="إدارة العملاء" subtitle="جميع العملاء والمواقع المرتبطة بهم" icon={Users} />

      <div className="flex items-center gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث..."
          className="panel flex-1 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-neon/40" />
        <button onClick={() => setEditing({})}
          className="panel px-4 py-2 text-sm font-medium bg-gradient-to-l from-cyan-neon/20 to-violet-neon/10 border-cyan-neon/30 flex items-center gap-2 hover:glow-cyan transition">
          <Plus className="w-4 h-4" /> عميل جديد
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <div className="col-span-full panel p-12 text-center text-muted-foreground">
            لا يوجد عملاء. اضغط "عميل جديد" لإضافة أول عميل.
          </div>
        )}
        {filtered.map((c: Client) => (
          <div key={c.id} className="panel p-5 hover:glow-cyan transition">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-bold text-lg">{c.name}</div>
                {c.company && <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Building2 className="w-3 h-3" /> {c.company}</div>}
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded ${c.status === "active" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "bg-muted text-muted-foreground"}`}>
                {c.status === "active" ? "نشط" : c.status ?? "—"}
              </span>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              {c.email && <div className="flex items-center gap-2"><Mail className="w-3 h-3" /> {c.email}</div>}
              {c.phone && <div className="flex items-center gap-2"><Phone className="w-3 h-3" /> {c.phone}</div>}
            </div>
            <div className="mt-3 pt-3 border-t border-panel-border flex items-center justify-between">
              <div className="text-xs"><span className="text-cyan-neon font-bold">{c.sites_count ?? 0}</span> موقع</div>
              <div className="flex gap-1">
                <button onClick={() => setEditing(c)} className="p-1.5 rounded hover:bg-cyan-neon/20 transition"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => { if (confirm(`حذف ${c.name}؟`)) delMut.mutate(c.id); }}
                  className="p-1.5 rounded hover:bg-rose-neon/20 transition"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm grid place-items-center z-50 p-4" onClick={() => setEditing(null)}>
          <div className="panel p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{editing.id ? "تعديل عميل" : "عميل جديد"}</h3>
              <button onClick={() => setEditing(null)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); saveMut.mutate(editing); }} className="space-y-3">
              <input required placeholder="الاسم *" value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="w-full panel px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-neon/40" />
              <input type="email" placeholder="البريد الإلكتروني" value={editing.email ?? ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                className="w-full panel px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-neon/40" />
              <input placeholder="الهاتف" value={editing.phone ?? ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                className="w-full panel px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-neon/40" />
              <input placeholder="الشركة" value={editing.company ?? ""} onChange={(e) => setEditing({ ...editing, company: e.target.value })}
                className="w-full panel px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-neon/40" />
              <select value={editing.status ?? "active"} onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                className="w-full panel px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-neon/40">
                <option value="active">نشط</option>
                <option value="paused">موقوف</option>
                <option value="archived">مؤرشف</option>
              </select>
              <textarea placeholder="ملاحظات" value={editing.notes ?? ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                className="w-full panel px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-neon/40 h-20 resize-none" />
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
