import { createFileRoute, redirect } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getDashboardStats, getNotifications, getActivity, getMyRole } from "@/lib/queries.functions";
import { StatCards } from "@/components/dashboard/StatCards";
import { SiteGraph } from "@/components/dashboard/SiteGraph";
import { DbMonitor } from "@/components/dashboard/DbMonitor";
import { ResourceChart } from "@/components/dashboard/ResourceChart";
import { HealthDonut } from "@/components/dashboard/HealthDonut";
import { SecurityCenter } from "@/components/dashboard/SecurityCenter";
import { StorageExplorer } from "@/components/dashboard/StorageExplorer";
import { AICommandCenter } from "@/components/dashboard/AICommandCenter";
import { BackupCenter } from "@/components/dashboard/BackupCenter";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { QuickAccess } from "@/components/dashboard/QuickAccess";
import { LiveSitesStatus } from "@/components/dashboard/LiveSitesStatus";

const statsQ = queryOptions({ queryKey: ["stats"], queryFn: () => getDashboardStats() });
const notifQ = queryOptions({ queryKey: ["notifications"], queryFn: () => getNotifications() });
const actQ = queryOptions({ queryKey: ["activity"], queryFn: () => getActivity() });
const meQ = queryOptions({ queryKey: ["me-role"], queryFn: () => getMyRole() });

export const Route = createFileRoute("/_authenticated/owner/dashboard")({
  loader: async ({ context }) => {
    const me = await context.queryClient.ensureQueryData(meQ);
    if (!me.isStaff) throw redirect({ to: "/user/dashboard" });
    await Promise.all([
      context.queryClient.ensureQueryData(statsQ),
      context.queryClient.ensureQueryData(notifQ),
      context.queryClient.ensureQueryData(actQ),
    ]);
  },
  component: OwnerDashboard,
  errorComponent: ({ error }) => <div className="panel p-6">{error.message}</div>,
  notFoundComponent: () => <div className="panel p-6">لم يوجد</div>,
});

function OwnerDashboard() {
  const { data: stats } = useSuspenseQuery(statsQ);
  const { data: notifs } = useSuspenseQuery(notifQ);
  const { data: activity } = useSuspenseQuery(actQ);

  return (
    <div className="space-y-6">
      <StatCards stats={stats} />

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-8">
          <SiteGraph sites={stats.sites} />
        </div>
        <div className="col-span-12 xl:col-span-4 space-y-6">
          <DbMonitor />
          <ResourceChart />
          <HealthDonut healthy={stats.healthy} warnings={stats.warnings} danger={stats.danger} total={stats.totalSites} />
          <SecurityCenter />
        </div>
      </div>

      <LiveSitesStatus />

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-4"><StorageExplorer folders={stats.folders} /></div>
        <div className="col-span-12 lg:col-span-4"><AICommandCenter /></div>
        <div className="col-span-12 lg:col-span-4"><BackupCenter /></div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-4"><ActivityFeed items={activity} /></div>
        <div className="col-span-12 lg:col-span-4"><AlertsPanel items={notifs} /></div>
        <div className="col-span-12 lg:col-span-4"><QuickAccess /></div>
      </div>
    </div>
  );
}
