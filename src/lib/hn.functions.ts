import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** يحدد لوحة التحكم المناسبة للمستخدم الحالي حسب دوره داخل التطبيق (Role-Based Dynamic Routing) */
export const getMyDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase as any;
    const { data, error } = await sb.rpc("hn_my_dashboard", { _app_code: "HUB" });
    if (error) return { dashboard: "/user/dashboard" as string };
    return { dashboard: (data as string) || "/user/dashboard" };
  });

/** بيانات هوية المستخدم المركزية + أدواره في كل تطبيق */
export const getMyHnIdentity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase as any;
    const [meRes, rolesRes] = await Promise.all([
      sb.from("hn_users").select("*").eq("user_id", context.userId).maybeSingle(),
      sb
        .from("hn_user_roles_apps")
        .select("id, is_active, hn_roles(code, name_ar, access_level, default_dashboard), hn_apps(app_code, name, url)")
        .eq("user_id", context.userId),
    ]);
    const roles = (rolesRes.data ?? []) as any[];
    return {
      user: meRes.data ?? null,
      roles: roles.map((r) => ({
        id: r.id,
        isActive: r.is_active,
        roleCode: r.hn_roles?.code ?? null,
        roleName: r.hn_roles?.name_ar ?? null,
        accessLevel: r.hn_roles?.access_level ?? 0,
        dashboard: r.hn_roles?.default_dashboard ?? "/user/dashboard",
        appCode: r.hn_apps?.app_code ?? null,
        appName: r.hn_apps?.name ?? null,
        appUrl: r.hn_apps?.url ?? null,
      })),
    };
  });
