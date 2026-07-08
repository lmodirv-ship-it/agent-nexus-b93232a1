import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase;
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

export const getNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(10);
    return data ?? [];
  });

export const getActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(10);
    return data ?? [];
  });

export const getAgentsCatalog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("agents_catalog")
      .select("*")
      .order("role")
      .order("slug");
    return data ?? [];
  });

export const setAgentActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; is_active: boolean }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("agents_catalog")
      .update({ is_active: data.is_active })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await context.supabase.from("audit_log").insert({
      actor_id: context.userId,
      action: data.is_active ? "agent.activate" : "agent.deactivate",
      target: `agents_catalog/${data.id}`,
    });
    return { ok: true };
  });

export const setAllAgentsActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { is_active: boolean; role?: string }) => d)
  .handler(async ({ data, context }) => {
    const query = context.supabase.from("agents_catalog").update({ is_active: data.is_active });
    const q = data.role ? query.eq("role", data.role) : query.not("id", "is", null);
    const { error } = await q;
    if (error) throw new Error(error.message);
    await context.supabase.from("audit_log").insert({
      actor_id: context.userId,
      action: data.is_active ? "agent.activate_all" : "agent.deactivate_all",
      target: "agents_catalog",
      details: { role: data.role ?? "all" },
    });
    return { ok: true };
  });

export const getAgentSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("agent_sessions").select("*").order("created_at", { ascending: false }).limit(50);
    return data ?? [];
  });

export const getAgentSession = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { sessionId: string }) => d)
  .handler(async ({ data, context }) => {
    const [sessionRes, tasksRes] = await Promise.all([
      context.supabase.from("agent_sessions").select("*").eq("id", data.sessionId).single(),
      context.supabase.from("agent_tasks").select("*").eq("session_id", data.sessionId).order("created_at"),
    ]);
    return { session: sessionRes.data, tasks: tasksRes.data ?? [] };
  });

// ============ Clients ============
export const listClients = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [clientsRes, sitesRes] = await Promise.all([
      context.supabase.from("clients").select("*").order("created_at", { ascending: false }),
      context.supabase.from("sites").select("id, client_id"),
    ]);
    const sites = sitesRes.data ?? [];
    return (clientsRes.data ?? []).map((c) => ({
      ...c,
      sites_count: sites.filter((s: any) => s.client_id === c.id).length,
    }));
  });

export const upsertClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id?: string; name: string; email?: string; phone?: string; company?: string; status?: string; notes?: string }) => d)
  .handler(async ({ data, context }) => {
    const payload = { ...data, created_by: context.userId };
    const res = data.id
      ? await context.supabase.from("clients").update(payload).eq("id", data.id).select().single()
      : await context.supabase.from("clients").insert(payload).select().single();
    if (res.error) throw new Error(res.error.message);
    await context.supabase.from("audit_log").insert({
      actor_id: context.userId,
      action: data.id ? "client.update" : "client.create",
      target: `clients/${res.data.id}`,
      details: { name: data.name },
    });
    return res.data;
  });

export const deleteClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("clients").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await context.supabase.from("audit_log").insert({
      actor_id: context.userId, action: "client.delete", target: `clients/${data.id}`,
    });
    return { ok: true };
  });

// ============ Sites CRUD ============
export const listSites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("sites").select("*, clients(name)").order("created_at", { ascending: false });
    return data ?? [];
  });

export const upsertSite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id?: string; domain: string; status?: string; client_id?: string | null; icon_color?: string }) => d)
  .handler(async ({ data, context }) => {
    const res = data.id
      ? await context.supabase.from("sites").update(data).eq("id", data.id).select().single()
      : await context.supabase.from("sites").insert(data).select().single();
    if (res.error) throw new Error(res.error.message);
    await context.supabase.from("audit_log").insert({
      actor_id: context.userId,
      action: data.id ? "site.update" : "site.create",
      target: `sites/${res.data.id}`,
      details: { domain: data.domain },
    });
    return res.data;
  });

export const deleteSite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("sites").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await context.supabase.from("audit_log").insert({
      actor_id: context.userId, action: "site.delete", target: `sites/${data.id}`,
    });
    return { ok: true };
  });

// ============ Audit / Roles ============
export const getAuditLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(200);
    return data ?? [];
  });

export const getMyRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    const roles = (data ?? []).map((r: any) => r.role);
    return {
      userId: context.userId,
      roles,
      isStaff: roles.includes("owner") || roles.includes("admin"),
      isOwner: roles.includes("owner"),
    };
  });

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [profilesRes, rolesRes] = await Promise.all([
      context.supabase.from("profiles").select("*"),
      context.supabase.from("user_roles").select("*"),
    ]);
    const roles = rolesRes.data ?? [];
    return (profilesRes.data ?? []).map((p: any) => ({
      ...p,
      roles: roles.filter((r: any) => r.user_id === p.id).map((r: any) => r.role),
    }));
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; role: "owner" | "admin" | "agent" | "viewer" }) => d)
  .handler(async ({ data, context }) => {
    // remove other roles, set this one
    await context.supabase.from("user_roles").delete().eq("user_id", data.userId);
    const { error } = await context.supabase.from("user_roles").insert({ user_id: data.userId, role: data.role });
    if (error) throw new Error(error.message);
    await context.supabase.from("audit_log").insert({
      actor_id: context.userId, action: "user.role_change",
      target: `users/${data.userId}`, details: { role: data.role },
    });
    return { ok: true };
  });

// ============ Generic CRUD for remaining tables ============
const listFn = (table: string, order = "created_at") =>
  createServerFn({ method: "GET" })
    .middleware([requireSupabaseAuth])
    .handler(async ({ context }) => {
      const { data, error } = await context.supabase.from(table as any).select("*").order(order, { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    });

const upsertFn = (table: string, action: string) =>
  createServerFn({ method: "POST" })
    .middleware([requireSupabaseAuth])
    .inputValidator((d: any) => d)
    .handler(async ({ data, context }) => {
      const res = data.id
        ? await context.supabase.from(table as any).update(data).eq("id", data.id).select().single()
        : await context.supabase.from(table as any).insert(data).select().single();
      if (res.error) throw new Error(res.error.message);
      await context.supabase.from("audit_log").insert({
        actor_id: context.userId, action: data.id ? `${action}.update` : `${action}.create`,
        target: `${table}/${(res.data as any).id}`,
      });
      return res.data;
    });

const deleteFn = (table: string, action: string) =>
  createServerFn({ method: "POST" })
    .middleware([requireSupabaseAuth])
    .inputValidator((d: { id: string }) => d)
    .handler(async ({ data, context }) => {
      const { error } = await context.supabase.from(table as any).delete().eq("id", data.id);
      if (error) throw new Error(error.message);
      await context.supabase.from("audit_log").insert({
        actor_id: context.userId, action: `${action}.delete`, target: `${table}/${data.id}`,
      });
      return { ok: true };
    });

export const listDatabases = listFn("databases_registry");
export const upsertDatabase = upsertFn("databases_registry", "database");
export const deleteDatabase = deleteFn("databases_registry", "database");

export const listBackups = listFn("backups");
export const upsertBackup = upsertFn("backups", "backup");
export const deleteBackup = deleteFn("backups", "backup");

export const listFolders = listFn("storage_folders");
export const upsertFolder = upsertFn("storage_folders", "folder");
export const deleteFolder = deleteFn("storage_folders", "folder");

export const listSecurityEvents = listFn("security_events");
export const listAttackAttempts = listFn("attack_attempts");
export const upsertAttackAttempt = upsertFn("attack_attempts", "attack");

export const listApiKeys = listFn("api_keys");
export const createApiKey = upsertFn("api_keys", "api_key");
export const revokeApiKey = deleteFn("api_keys", "api_key");

export const listServices = listFn("services");
export const upsertService = upsertFn("services", "service");
export const deleteService = deleteFn("services", "service");
export const listServiceLogs = listFn("service_call_logs");
export const listServiceDependencies = listFn("service_dependencies");

