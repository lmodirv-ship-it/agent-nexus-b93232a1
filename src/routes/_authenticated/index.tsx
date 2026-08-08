import { createFileRoute, redirect } from "@tanstack/react-router";
import { queryOptions } from "@tanstack/react-query";
import { getMyDashboard } from "@/lib/hn.functions";

const dashQ = queryOptions({ queryKey: ["my-dashboard"], queryFn: () => getMyDashboard() });

export const Route = createFileRoute("/_authenticated/")({
  loader: async ({ context }) => {
    const { dashboard } = await context.queryClient.ensureQueryData(dashQ);
    throw redirect({ to: dashboard === "/owner/dashboard" ? "/owner/dashboard" : "/user/dashboard" });
  },
  component: () => null,
  errorComponent: ({ error }) => <div className="panel p-6">{error.message}</div>,
  notFoundComponent: () => <div className="panel p-6">لم يوجد</div>,
});
