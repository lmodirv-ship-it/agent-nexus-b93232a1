import { createFileRoute, redirect } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { listUsers, setUserRole, deleteUser, getMyRole, linkClientToUser, listClients } from "@/lib/queries.functions";
import { Shield, Trash2, Lock, User as UserIcon } from "lucide-react";

const usersQ = queryOptions({ queryKey: ["users"], queryFn: () => listUsers() });
const meQ = queryOptions({ queryKey: ["me-role"], queryFn: () => getMyRole() });
const clientsQ = queryOptions({ queryKey: ["clients"], queryFn: () => listClients() });

export const Route = createFileRoute("/_authenticated/users")({
  loader: async ({ context }) => {
    const me = await context.queryClient.ensureQueryData(meQ);
    if (!me.isOwner) throw redirect({ to: "/" });
    await Promise.all([
      context.queryClient.ensureQueryData(usersQ),
      context.queryClient.ensureQueryData(clientsQ),
    ]);
  },
  component: UsersPage,
  errorComponent: ({ error }) => <div className="panel p-6">{error.message}</div>,
  notFoundComponent: () => <div className="panel p-6">لم يوجد</div>,
});

const ROLES = [
  { v: "owner", label: "مالك", color: "text-amber-neon" },
  { v: "admin", label: "مشرف", color: "text-violet-neon" },
  { v: "agent", label: "وكيل", color: "text-cyan-neon" },
  { v: "client", label: "عميل / زبون", color: "text-green-neon" },
  { v: "viewer", label: "مشاهد", color: "text-blue-neon" },
  { v: "visitor", label: "زائر", color: "text-muted-foreground" },
] as const;

function UsersPage() {
  const { data: users } = useSuspenseQuery(usersQ);
  const { data: clients } = useSuspenseQuery(clientsQ);
  const qc = useQueryClient();
  const [err, setErr] = useState<string | null>(null);

  const change = async (userId: string, role: any) => {
    setErr(null);
    try { await setUserRole({ data: { userId, role } }); qc.invalidateQueries({ queryKey: ["users"] }); }
    catch (e: any) { setErr(e.message); }
  };
  const remove = async (userId: string) => {
    if (!confirm("حذف هذا المستخدم نهائياً؟")) return;
    setErr(null);
    try { await deleteUser({ data: { userId } }); qc.invalidateQueries({ queryKey: ["users"] }); }
    catch (e: any) { setErr(e.message); }
  };
  const link = async (clientId: string, userId: string) => {
    setErr(null);
    try { await linkClientToUser({ data: { clientId, userId: userId || null } }); qc.invalidateQueries({ queryKey: ["clients"] }); }
    catch (e: any) { setErr(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-amber-neon" />
          <h2 className="text-xl font-display font-bold">المستخدمون والأدوار</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          المالكون المحميون <code className="text-amber-neon">lmodirv@gmail.com</code> و
          <code className="text-amber-neon"> info@hnchat.net</code> لا يمكن حذفهم أو تغيير أدوارهم.
        </p>
        {err && <div className="text-xs text-rose-neon bg-rose-neon/10 border border-rose-neon/30 rounded px-3 py-2 mb-3">{err}</div>}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground border-b border-panel-border">
              <tr><th className="text-right py-2">المستخدم</th><th className="text-right">البريد</th><th className="text-right">الدور الحالي</th><th className="text-right">تغيير الدور</th><th></th></tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id} className="border-b border-panel-border/50">
                  <td className="py-3 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-neon to-violet-neon grid place-items-center">
                      <UserIcon className="w-4 h-4 text-background" />
                    </div>
                    <span className="font-medium">{u.display_name || "—"}</span>
                    {u.isProtected && <Lock className="w-3.5 h-3.5 text-amber-neon" />}
                  </td>
                  <td className="text-muted-foreground">{u.email || "—"}</td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      {u.roles.length ? u.roles.map((r: string) => {
                        const meta = ROLES.find((x) => x.v === r);
                        return <span key={r} className={`text-[11px] px-2 py-0.5 rounded bg-muted/40 ${meta?.color ?? ""}`}>{meta?.label ?? r}</span>;
                      }) : <span className="text-xs text-muted-foreground">لا يوجد</span>}
                    </div>
                  </td>
                  <td>
                    <select
                      disabled={u.isProtected}
                      value={u.roles[0] ?? ""}
                      onChange={(e) => change(u.id, e.target.value)}
                      className="panel px-2 py-1 text-xs bg-transparent disabled:opacity-50">
                      <option value="" disabled>اختر</option>
                      {ROLES.map((r) => <option key={r.v} value={r.v}>{r.label}</option>)}
                    </select>
                  </td>
                  <td className="text-left">
                    <button disabled={u.isProtected} onClick={() => remove(u.id)}
                      className="p-1.5 rounded hover:bg-rose-neon/20 disabled:opacity-30 disabled:cursor-not-allowed" title="حذف">
                      <Trash2 className="w-4 h-4 text-rose-neon" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel p-6">
        <h3 className="text-lg font-display font-bold mb-4">ربط العملاء بحسابات المستخدمين</h3>
        <p className="text-xs text-muted-foreground mb-3">اربط كل سجل عميل بحساب مستخدم لكي يظهر له بورتالُه بعد تسجيل الدخول.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground border-b border-panel-border">
              <tr><th className="text-right py-2">العميل</th><th className="text-right">الشركة</th><th className="text-right">حساب المستخدم المرتبط</th></tr>
            </thead>
            <tbody>
              {clients.map((c: any) => (
                <tr key={c.id} className="border-b border-panel-border/50">
                  <td className="py-3 font-medium">{c.name}</td>
                  <td className="text-muted-foreground">{c.company || "—"}</td>
                  <td>
                    <select value={c.user_id ?? ""} onChange={(e) => link(c.id, e.target.value)}
                      className="panel px-2 py-1 text-xs bg-transparent">
                      <option value="">— بدون —</option>
                      {users.map((u: any) => <option key={u.id} value={u.id}>{u.display_name || u.email || u.id.slice(0,8)}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {clients.length === 0 && <tr><td colSpan={3} className="py-6 text-center text-muted-foreground">لا يوجد عملاء بعد</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
