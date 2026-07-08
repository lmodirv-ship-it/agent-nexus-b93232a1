import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function db() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export const getDashboardStats = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = db();
  const [sitesRes, folderRes] = await Promise.all([
    supabase.from("sites").select("*"),
    supabase.from("storage_folders").select("*"),
  ]);
  const sites = sitesRes.data ?? [];
  const folders = folderRes.data ?? [];
  const activeSites = sites.filter((s) => s.status === "online").length;
  const warnings = sites.filter((s) => s.status === "warning").length;
  const totalUsers = sites.reduce((a, s) => a + (s.users_count ?? 0), 0);
  const totalDbGb = sites.reduce((a, s) => a + Number(s.db_size_gb ?? 0), 0);
  const totalStorageGb = sites.reduce((a, s) => a + Number(s.storage_gb ?? 0), 0);
  return {
    activeSites,
    totalSites: sites.length,
    warnings,
    healthy: sites.length - warnings - sites.filter((s) => s.status === "danger" || s.status === "offline").length,
    danger: sites.filter((s) => s.status === "danger" || s.status === "offline").length,
    totalUsers,
    databases: sites.length,
    storageTb: +(totalStorageGb / 1024).toFixed(1),
    storageMaxTb: 50,
    dbSizeGb: +totalDbGb.toFixed(1),
    ordersToday: 8921,
    revenueToday: 34500,
    sites: sites.map((s) => ({
      id: s.id, domain: s.domain, status: s.status ?? "online",
      users: s.users_count ?? 0, db: Number(s.db_size_gb ?? 0),
      storage: Number(s.storage_gb ?? 0), color: s.icon_color ?? "cyan",
    })),
    folders: folders.map((f) => ({
      id: f.id, name: f.name, files: f.file_count ?? 0,
      sizeGb: Number(f.size_gb ?? 0), icon: f.icon ?? "folder",
    })),
  };
});

export const getNotifications = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await db().from("notifications").select("*").order("created_at", { ascending: false }).limit(10);
  return data ?? [];
});

export const getActivity = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await db().from("activity_log").select("*").order("created_at", { ascending: false }).limit(10);
  return data ?? [];
});

export const getAgentsCatalog = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await db().from("agents_catalog").select("*").order("name_ar");
  return data ?? [];
});

export const getAgentSessions = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await db().from("agent_sessions").select("*").order("created_at", { ascending: false }).limit(50);
  return data ?? [];
});

export const getAgentSession = createServerFn({ method: "GET" })
  .inputValidator((d: { sessionId: string }) => d)
  .handler(async ({ data }) => {
    const supabase = db();
    const [sessionRes, tasksRes] = await Promise.all([
      supabase.from("agent_sessions").select("*").eq("id", data.sessionId).single(),
      supabase.from("agent_tasks").select("*").eq("session_id", data.sessionId).order("created_at"),
    ]);
    return { session: sessionRes.data, tasks: tasksRes.data ?? [] };
  });
