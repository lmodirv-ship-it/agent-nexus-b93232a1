import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getMyClientPortal, getMyRole } from "@/lib/queries.functions";
import { getMyHnIdentity } from "@/lib/hn.functions";
import { Globe, User as UserIcon, ShieldCheck, LayoutDashboard } from "lucide-react";

const portalQ = queryOptions({ queryKey: ["client-portal"], queryFn: () => getMyClientPortal() });
const meQ = queryOptions({ queryKey: ["me-role"], queryFn: () => getMyRole() });
const idQ = queryOptions({ queryKey: ["hn-identity"], queryFn: () => getMyHnIdentity() });

export const Route = createFileRoute("/_authenticated/user/dashboard")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(portalQ),
      context.queryClient.ensureQueryData(meQ),
      context.queryClient.ensureQueryData(idQ),
    ]),
  component: UserDashboard,
  errorComponent: ({ error }) => <div className="panel p-6">{error.message}</div>,
  notFoundComponent: () => <div className="panel p-6">لم يوجد</div>,
});

function UserDashboard() {
  const { data } = useSuspenseQuery(portalQ);
  const { data: me } = useSuspenseQuery(meQ);
  const { data: identity } = useSuspenseQuery(idQ);

  const topRole = [...identity.roles].sort((a, b) => b.accessLevel - a.accessLevel)[0];

  return (
    <div className="space-y-6">
      <div className="panel p-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-neon to-violet-neon grid place-items-center glow-cyan">
          <UserIcon className="w-7 h-7 text-background" />
        </div>
        <div className="flex-1">
          <div className="text-xs text-muted-foreground">لوحتي الشخصية</div>
          <h2 className="text-xl font-display font-bold">
            {identity.user?.full_name || data.client?.name || identity.user?.email || "مستخدم"}
          </h2>
          <div className="text-xs text-muted-foreground">{identity.user?.email}</div>
        </div>
        {me.isStaff && (
          <Link to="/owner/dashboard" className="panel px-4 py-2 text-sm flex items-center gap-2 hover:bg-muted/40 transition">
            <LayoutDashboard className="w-4 h-4 text-cyan-neon" />
            لوحة المالك
          </Link>
        )}
      </div>

      <div className="panel p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-violet-neon" />
          <h3 className="font-display font-bold">أدواري في المنظومة</h3>
          <span className="text-xs text-muted-foreground">({identity.roles.length})</span>
        </div>
        {identity.roles.length === 0 ? (
          <p className="text-sm text-muted-foreground">لم يُمنح حسابك أي دور بعد. سيراجع المالك طلبك قريباً.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-right text-[11px] text-muted-foreground uppercase border-b border-panel-border">
                  <th className="py-2 px-3">التطبيق</th>
                  <th className="py-2 px-3">الدور</th>
                  <th className="py-2 px-3">المستوى</th>
                  <th className="py-2 px-3">اللوحة</th>
                  <th className="py-2 px-3">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {identity.roles.map((r) => (
                  <tr key={r.id} className="border-b border-panel-border/50">
                    <td className="py-2 px-3">{r.appName ?? "المنظومة"}</td>
                    <td className="py-2 px-3 text-cyan-neon">{r.roleName ?? r.roleCode}</td>
                    <td className="py-2 px-3">{r.accessLevel}</td>
                    <td className="py-2 px-3 text-muted-foreground text-xs">{r.dashboard}</td>
                    <td className="py-2 px-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded ${r.isActive ? "bg-green-neon/20 text-green-neon" : "bg-muted text-muted-foreground"}`}>
                        {r.isActive ? "مفعّل" : "موقوف"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {topRole && (
          <p className="text-[11px] text-muted-foreground mt-3">
            الدور الأعلى: <span className="text-amber-neon">{topRole.roleName ?? topRole.roleCode}</span> — التوجيه الافتراضي {topRole.dashboard}
          </p>
        )}
      </div>

      <div className="panel p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-cyan-neon" />
          <h3 className="font-display font-bold">مواقعي</h3>
          <span className="text-xs text-muted-foreground">({data.sites.length})</span>
        </div>
        {data.sites.length === 0 ? (
          <p className="text-sm text-muted-foreground">لا توجد مواقع مربوطة بحسابك بعد.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.sites.map((s: any) => (
              <div key={s.id} className="panel p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold">{s.domain}</div>
                  <span className={`text-[10px] px-2 py-0.5 rounded ${s.status === "online" ? "bg-green-neon/20 text-green-neon" : "bg-muted text-muted-foreground"}`}>
                    {s.status ?? "—"}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground grid grid-cols-3 gap-2">
                  <div>👥 {s.users_count ?? 0}</div>
                  <div>💾 {Number(s.db_size_gb ?? 0)} GB</div>
                  <div>📦 {Number(s.storage_gb ?? 0)} GB</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
