import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getMyClientPortal, getMyRole } from "@/lib/queries.functions";
import { Globe, User as UserIcon, Sparkles } from "lucide-react";

const portalQ = queryOptions({ queryKey: ["client-portal"], queryFn: () => getMyClientPortal() });
const meQ = queryOptions({ queryKey: ["me-role"], queryFn: () => getMyRole() });

export const Route = createFileRoute("/_authenticated/portal")({
  loader: ({ context }) => Promise.all([
    context.queryClient.ensureQueryData(portalQ),
    context.queryClient.ensureQueryData(meQ),
  ]),
  component: PortalPage,
  errorComponent: ({ error }) => <div className="panel p-6">{error.message}</div>,
  notFoundComponent: () => <div className="panel p-6">لم يوجد</div>,
});

function PortalPage() {
  const { data } = useSuspenseQuery(portalQ);
  const { data: me } = useSuspenseQuery(meQ);

  if (me.isStaff) {
    return (
      <div className="panel p-6">
        <p className="text-sm text-muted-foreground">هذه الصفحة مخصصة للعملاء. أنت تستعمل حساب طاقم إداري.</p>
      </div>
    );
  }

  if (!data.client) {
    return (
      <div className="panel p-8 text-center max-w-xl mx-auto">
        <Sparkles className="w-10 h-10 text-amber-neon mx-auto mb-3" />
        <h2 className="text-xl font-display font-bold mb-2">مرحباً بك 👋</h2>
        <p className="text-sm text-muted-foreground mb-4">
          حسابك مسجّل بنجاح، لكنه لم يُربط بعد بسجل عميل. سيقوم المالك بمراجعة طلبك ومنحك الصلاحيات المناسبة قريباً.
        </p>
        <div className="text-xs text-muted-foreground">
          دورك الحالي: <span className="text-cyan-neon">{me.roles.join(", ") || "زائر"}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="panel p-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-neon to-violet-neon grid place-items-center glow-cyan">
          <UserIcon className="w-7 h-7 text-background" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">أهلاً</div>
          <h2 className="text-xl font-display font-bold">{data.client.name}</h2>
          <div className="text-xs text-muted-foreground">{data.client.company || data.client.email}</div>
        </div>
      </div>

      <div className="panel p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-cyan-neon" />
          <h3 className="font-display font-bold">مواقعك</h3>
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
