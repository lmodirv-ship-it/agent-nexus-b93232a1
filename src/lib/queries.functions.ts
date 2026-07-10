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
      context.supabase.from("sites").select("id, client_id, status, users_count, db_size_gb, storage_gb, activity_rate, integration_status, last_heartbeat_at"),
    ]);
    const sites = sitesRes.data ?? [];
    return (clientsRes.data ?? []).map((c) => {
      const mine = sites.filter((s: any) => s.client_id === c.id);
      const online = mine.filter((s: any) => s.status === "online").length;
      const connected = mine.filter((s: any) => s.integration_status === "connected").length;
      const users_total = mine.reduce((a: number, s: any) => a + (s.users_count ?? 0), 0);
      const db_total = mine.reduce((a: number, s: any) => a + Number(s.db_size_gb ?? 0), 0);
      const storage_total = mine.reduce((a: number, s: any) => a + Number(s.storage_gb ?? 0), 0);
      const avg_activity = mine.length ? mine.reduce((a: number, s: any) => a + Number(s.activity_rate ?? 0), 0) / mine.length : 0;
      const last_seen = mine.reduce((acc: string | null, s: any) => {
        if (!s.last_heartbeat_at) return acc;
        if (!acc || s.last_heartbeat_at > acc) return s.last_heartbeat_at;
        return acc;
      }, null as string | null);
      return {
        ...c,
        sites_count: mine.length,
        online_count: online,
        connected_count: connected,
        users_total,
        db_total: Math.round(db_total * 100) / 100,
        storage_total: Math.round(storage_total * 100) / 100,
        avg_activity: Math.round(avg_activity),
        last_seen,
      };
    });
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

export const listClientAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { clientId: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("audit_log")
      .select("*")
      .eq("target", `clients/${data.clientId}`)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// ============ Sites CRUD ============
export const listSites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("sites").select("*, clients(name), site_categories(id, name, color, code_prefix)").order("created_at", { ascending: false });
    return data ?? [];
  });

export const listSiteCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [catsRes, sitesRes] = await Promise.all([
      context.supabase.from("site_categories").select("*").order("id"),
      context.supabase.from("sites").select("category_id, status, users_count, activity_rate"),
    ]);
    const sites = sitesRes.data ?? [];
    return (catsRes.data ?? []).map((c: any) => {
      const mine = sites.filter((s: any) => s.category_id === c.id);
      return {
        ...c,
        actual: mine.length,
        online: mine.filter((s: any) => s.status === "online").length,
        users: mine.reduce((a: number, s: any) => a + (s.users_count ?? 0), 0),
        avg_activity: mine.length ? Math.round(mine.reduce((a: number, s: any) => a + Number(s.activity_rate ?? 0), 0) / mine.length) : 0,
      };
    });
  });

export const upsertSite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id?: string; domain: string; status?: string; client_id?: string | null; icon_color?: string; email?: string | null }) => d)
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

const PROTECTED_OWNER_EMAILS = ["lmodirv@gmail.com", "info@hnchat.net"];
const isProtectedEmail = (e?: string | null) => !!e && PROTECTED_OWNER_EMAILS.includes(e.toLowerCase());

export const getMyRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    const roles = (data ?? []).map((r: any) => r.role);
    const email = (context.claims as any)?.email as string | undefined;
    return {
      userId: context.userId,
      email,
      roles,
      isStaff: roles.includes("owner") || roles.includes("admin"),
      isOwner: roles.includes("owner"),
      isAdmin: roles.includes("admin"),
      isClient: roles.includes("client"),
      isVisitor: roles.includes("visitor") || roles.length === 0,
      isProtected: isProtectedEmail(email),
    };
  });

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Only staff can list — RLS on profiles enforces this too.
    const [profilesRes, rolesRes] = await Promise.all([
      context.supabase.from("profiles").select("*"),
      context.supabase.from("user_roles").select("*"),
    ]);
    const roles = rolesRes.data ?? [];
    const profiles = profilesRes.data ?? [];

    // Fetch emails via admin API (owner-only view needs email to identify users)
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const emailMap = new Map<string, string>();
    let page = 1;
    while (true) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) break;
      for (const u of data.users) if (u.email) emailMap.set(u.id, u.email);
      if (!data.users || data.users.length < 200) break;
      page++;
    }

    return profiles.map((p: any) => {
      const email = emailMap.get(p.id) ?? null;
      return {
        ...p,
        email,
        roles: roles.filter((r: any) => r.user_id === p.id).map((r: any) => r.role),
        isProtected: isProtectedEmail(email),
      };
    });
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; role: "owner" | "admin" | "agent" | "client" | "viewer" | "visitor" }) => d)
  .handler(async ({ data, context }) => {
    // Only owners may change roles
    const { data: myRoles } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    const iAmOwner = (myRoles ?? []).some((r: any) => r.role === "owner");
    if (!iAmOwner) throw new Error("Forbidden: owner role required");

    // Prevent changing protected owner accounts
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: userInfo } = await supabaseAdmin.auth.admin.getUserById(data.userId);
    const targetEmail = userInfo?.user?.email ?? null;
    if (isProtectedEmail(targetEmail) && data.role !== "owner") {
      throw new Error("لا يمكن تغيير دور المالك المحمي");
    }

    await context.supabase.from("user_roles").delete().eq("user_id", data.userId);
    const { error } = await context.supabase.from("user_roles").insert({ user_id: data.userId, role: data.role });
    if (error) throw new Error(error.message);
    await context.supabase.from("audit_log").insert({
      actor_id: context.userId, action: "user.role_change",
      target: `users/${data.userId}`, details: { role: data.role, email: targetEmail },
    });
    return { ok: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: myRoles } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    const iAmOwner = (myRoles ?? []).some((r: any) => r.role === "owner");
    if (!iAmOwner) throw new Error("Forbidden: owner role required");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: userInfo } = await supabaseAdmin.auth.admin.getUserById(data.userId);
    const email = userInfo?.user?.email ?? null;
    if (isProtectedEmail(email)) throw new Error("لا يمكن حذف حساب المالك المحمي");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    await context.supabase.from("audit_log").insert({
      actor_id: context.userId, action: "user.delete", target: `users/${data.userId}`, details: { email },
    });
    return { ok: true };
  });

export const linkClientToUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { clientId: string; userId: string | null }) => d)
  .handler(async ({ data, context }) => {
    const { data: myRoles } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    const iAmOwner = (myRoles ?? []).some((r: any) => r.role === "owner");
    if (!iAmOwner) throw new Error("Forbidden: owner role required");
    const { error } = await context.supabase.from("clients").update({ user_id: data.userId }).eq("id", data.clientId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyClientPortal = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: client } = await context.supabase.from("clients").select("*").eq("user_id", context.userId).maybeSingle();
    if (!client) return { client: null, sites: [] };
    const { data: sites } = await context.supabase.from("sites").select("*").eq("client_id", client.id);
    return { client, sites: sites ?? [] };
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


// ============ Agent <-> Sites Linking ============
export const listAgentSiteLinks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("agent_site_links" as any)
      .select("*");
    if (error) throw new Error(error.message);
    return ((data ?? []) as unknown) as Array<{
      id: string; agent_id: string; site_id: string;
      status: string; last_sync_at: string | null; note: string | null;
    }>;
  });

export const setAgentSiteLinks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { agent_id: string; site_ids: string[] }) => d)
  .handler(async ({ data, context }) => {
    // احذف كل الروابط الحالية لهذا الوكيل ثم أعد الإدراج
    const del = await context.supabase.from("agent_site_links" as any)
      .delete().eq("agent_id", data.agent_id);
    if (del.error) throw new Error(del.error.message);
    if (data.site_ids.length > 0) {
      const rows = data.site_ids.map((sid) => ({
        agent_id: data.agent_id, site_id: sid,
        status: "linked", last_sync_at: new Date().toISOString(),
        created_by: context.userId,
      }));
      const ins = await context.supabase.from("agent_site_links" as any).insert(rows);
      if (ins.error) throw new Error(ins.error.message);
    }
    await context.supabase.from("audit_log").insert({
      actor_id: context.userId, action: "agent.link_sites",
      target: `agents_catalog/${data.agent_id}`,
      details: { count: data.site_ids.length },
    });
    return { ok: true };
  });

export const setAgentSiteLinkStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("agent_site_links" as any)
      .update({ status: data.status, last_sync_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ HUB: Events / Mail / Site Integration ============
export const listHubEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("hub_events" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return ((data ?? []) as unknown) as Array<{
      id: string; site_id: string | null; agent_id: string | null;
      direction: "inbound" | "outbound"; type: string; payload: any;
      status: string; attempts: number; error: string | null;
      delivered_at: string | null; created_at: string;
    }>;
  });

export const getHubStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sinceIso = new Date(Date.now() - 60_000).toISOString();
    const [sitesRes, eventsRes, mailRes] = await Promise.all([
      context.supabase.from("sites").select("id, domain, status, last_heartbeat_at, health"),
      context.supabase.from("hub_events" as any).select("direction, status, created_at").gte("created_at", sinceIso),
      context.supabase.from("mail_messages" as any).select("id, read_at").is("read_at", null),
    ]);
    const sites = (sitesRes.data ?? []) as any[];
    const online = sites.filter((s) => {
      if (!s.last_heartbeat_at) return false;
      return Date.now() - new Date(s.last_heartbeat_at).getTime() < 60_000;
    }).length;
    const events = (eventsRes.data ?? []) as any[];
    return {
      sitesTotal: sites.length,
      sitesOnline: online,
      eventsPerMinute: events.length,
      inboundLastMin: events.filter((e) => e.direction === "inbound").length,
      outboundLastMin: events.filter((e) => e.direction === "outbound").length,
      failedLastMin: events.filter((e) => e.status === "failed").length,
      unreadMail: (mailRes.data ?? []).length,
    };
  });

export const emitHubEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { site_id?: string | null; agent_id?: string | null; type: string; payload?: any; direction?: "inbound" | "outbound" }) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("hub_events" as any).insert({
      site_id: data.site_id ?? null,
      agent_id: data.agent_id ?? null,
      direction: data.direction ?? "outbound",
      type: data.type,
      payload: data.payload ?? {},
      status: "queued",
    }).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const rotateSiteApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { site_id: string }) => d)
  .handler(async ({ data, context }) => {
    const rawKey = "hn_" + crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 8);
    const secret = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    const enc = new TextEncoder().encode(rawKey);
    const hashBuf = await crypto.subtle.digest("SHA-256", enc);
    const keyHash = Array.from(new Uint8Array(hashBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");
    const { error } = await context.supabase.from("sites")
      .update({ api_key_hash: keyHash, webhook_secret: secret })
      .eq("id", data.site_id);
    if (error) throw new Error(error.message);
    await context.supabase.from("audit_log").insert({
      actor_id: context.userId, action: "site.rotate_key", target: `sites/${data.site_id}`,
    });
    // shown once
    return { api_key: rawKey, webhook_secret: secret };
  });

export const updateSiteIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { site_id: string; webhook_url?: string | null }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("sites")
      .update({ webhook_url: data.webhook_url ?? null })
      .eq("id", data.site_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const pingSite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { site_id: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: site } = await context.supabase.from("sites").select("id, webhook_url, webhook_secret").eq("id", data.site_id).single();
    if (!site?.webhook_url) throw new Error("لا يوجد webhook_url لهذا الموقع");
    const body = JSON.stringify({ type: "ping", ts: Date.now() });
    let ok = false; let status = 0; let err: string | null = null;
    try {
      const res = await fetch(site.webhook_url, {
        method: "POST",
        headers: { "content-type": "application/json", "x-hn-signature": site.webhook_secret ?? "" },
        body,
      });
      status = res.status; ok = res.ok;
    } catch (e: any) { err = e?.message ?? String(e); }
    await context.supabase.from("hub_events" as any).insert({
      site_id: data.site_id, direction: "outbound", type: "ping",
      payload: { status }, status: ok ? "delivered" : "failed", error: err,
      delivered_at: ok ? new Date().toISOString() : null, attempts: 1,
    });
    return { ok, status, error: err };
  });

export const listMailMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("mail_messages" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return ((data ?? []) as unknown) as Array<{
      id: string; site_id: string | null; direction: "inbound" | "outbound";
      from_addr: string; to_addr: string; subject: string | null; body: string | null;
      read_at: string | null; created_at: string;
    }>;
  });

export const markMailRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("mail_messages" as any)
      .update({ read_at: new Date().toISOString() }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ HN Group provisioning export ============
export const getProvisioningStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("sites_provisioning" as any)
      .select("id, exported_at");
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as any[];
    return {
      total: rows.length,
      pending: rows.filter((r) => !r.exported_at).length,
    };
  });

export const exportProvisioning = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: rows, error } = await context.supabase
      .from("sites_provisioning" as any)
      .select("id, api_key, webhook_secret, exported_at, sites:site_id(domain)")
      .is("exported_at", null);
    if (error) throw new Error(error.message);
    const list = ((rows ?? []) as any[]).map((r) => ({
      domain: r.sites?.domain ?? "",
      api_key: r.api_key,
      webhook_secret: r.webhook_secret,
    }));
    if (list.length === 0) return { rows: [], count: 0 };
    const ids = ((rows ?? []) as any[]).map((r) => r.id);
    await context.supabase
      .from("sites_provisioning" as any)
      .update({ exported_at: new Date().toISOString() })
      .in("id", ids);
    await context.supabase.from("audit_log").insert({
      actor_id: context.userId,
      action: "hub.export_keys",
      target: "sites_provisioning",
      details: { count: list.length },
    });
    return { rows: list, count: list.length };
  });

export const getHubGroups = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("sites")
      .select("id, domain, icon_color, health, last_heartbeat_at, status");
    const sites = (data ?? []) as any[];
    const now = Date.now();
    const isOnline = (s: any) =>
      s.last_heartbeat_at && now - new Date(s.last_heartbeat_at).getTime() < 60_000;
    const buckets: Record<string, { color: string; sites: any[] }> = {};
    for (const s of sites) {
      const color = s.icon_color ?? "slate";
      if (!buckets[color]) buckets[color] = { color, sites: [] };
      buckets[color].sites.push({
        id: s.id, domain: s.domain, online: isOnline(s), color,
      });
    }
    return Object.values(buckets).map((b) => ({
      color: b.color,
      total: b.sites.length,
      online: b.sites.filter((s) => s.online).length,
      sites: b.sites,
    }));
  });

// ============ Site Link Agents (غرفة قيادة الوكلاء) ============
export const listSiteLinkAgents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [linksRes, sitesRes, agentsRes] = await Promise.all([
      context.supabase.from("site_link_agents" as any).select("*"),
      context.supabase.from("sites").select("id, site_code, domain, db_name, status, category_id"),
      context.supabase.from("agents_catalog").select("id, slug, name_ar, emoji, role, is_active"),
    ]);
    if (linksRes.error) throw new Error(linksRes.error.message);
    const sites = sitesRes.data ?? [];
    const agents = agentsRes.data ?? [];
    const byId = new Map(agents.map((a: any) => [a.id, a]));
    const sitesById = new Map(sites.map((s: any) => [s.id, s]));
    return ((linksRes.data ?? []) as any[]).map((r) => ({
      ...r,
      site: sitesById.get(r.site_id) ?? null,
      receiver: r.receiver_agent_id ? byId.get(r.receiver_agent_id) : null,
      sender: r.sender_agent_id ? byId.get(r.sender_agent_id) : null,
      developer: r.developer_agent_id ? byId.get(r.developer_agent_id) : null,
      security: r.security_agent_id ? byId.get(r.security_agent_id) : null,
      extras: (r.extra_agent_ids ?? []).map((id: string) => byId.get(id)).filter(Boolean),
    }));
  });

export const setSiteLinkEnabled = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { ids: string[]; is_enabled: boolean }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("site_link_agents" as any)
      .update({ is_enabled: data.is_enabled, last_sync_at: new Date().toISOString() })
      .in("id", data.ids);
    if (error) throw new Error(error.message);
    await context.supabase.from("audit_log").insert({
      actor_id: context.userId,
      action: data.is_enabled ? "site_link.enable" : "site_link.disable",
      target: "site_link_agents",
      details: { count: data.ids.length },
    });
    return { ok: true, count: data.ids.length };
  });

export const autoGenerateSiteLinks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // 1) اجلب القوالب
    const { data: tpl } = await context.supabase
      .from("agents_catalog")
      .select("id, slug")
      .in("slug", ["site-receiver", "site-sender", "site-developer", "site-security"]);
    const bySlug = Object.fromEntries((tpl ?? []).map((t: any) => [t.slug, t.id]));

    // 2) المواقع بدون سجل ربط
    const [{ data: sites }, { data: existing }] = await Promise.all([
      context.supabase.from("sites").select("id, db_name, status, activity_rate, integration_status"),
      context.supabase.from("site_link_agents" as any).select("site_id"),
    ]);
    const have = new Set((existing ?? []).map((r: any) => r.site_id));
    const missing = (sites ?? []).filter((s: any) => !have.has(s.id));

    // 3) حسب مجموعة قواعد البيانات (HN group)
    const dbCounts = new Map<string, number>();
    for (const s of sites ?? []) {
      if (s.db_name) dbCounts.set(s.db_name, (dbCounts.get(s.db_name) ?? 0) + 1);
    }

    if (missing.length === 0) return { ok: true, generated: 0 };

    const rows = missing.map((s: any) => {
      const grouped = s.db_name && (dbCounts.get(s.db_name) ?? 0) > 1;
      return {
        site_id: s.id,
        receiver_agent_id: bySlug["site-receiver"],
        sender_agent_id: bySlug["site-sender"],
        developer_agent_id: bySlug["site-developer"],
        security_agent_id: bySlug["site-security"],
        is_enabled: true,
        interaction_rate: Number(s.activity_rate ?? Math.round(Math.random() * 40 + 55)),
        link_status: grouped ? "linked" : s.integration_status === "connected" ? "linked" : s.status === "offline" ? "error" : "pending",
        response_ms: Math.floor(Math.random() * 180 + 40),
        hn_group: !!grouped,
        last_sync_at: new Date().toISOString(),
      };
    });

    const { error } = await context.supabase.from("site_link_agents" as any).insert(rows);
    if (error) throw new Error(error.message);
    await context.supabase.from("audit_log").insert({
      actor_id: context.userId,
      action: "site_link.auto_generate",
      target: "site_link_agents",
      details: { count: rows.length },
    });
    return { ok: true, generated: rows.length };
  });

export const addExtraAgentToSiteLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; agent_id: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error: e1 } = await context.supabase
      .from("site_link_agents" as any).select("extra_agent_ids").eq("id", data.id).single();
    if (e1) throw new Error(e1.message);
    const current: string[] = ((row as any)?.extra_agent_ids ?? []);
    if (current.includes(data.agent_id)) return { ok: true };
    const { error } = await context.supabase
      .from("site_link_agents" as any)
      .update({ extra_agent_ids: [...current, data.agent_id] })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- AI Models catalog ----------
// ============ AI PROVIDERS ============

export const listAiProviders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("ai_providers" as any).select("*").order("code", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as any[];
  });

export const upsertAiProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id?: string; code: string; name: string; base_url?: string | null;
    api_key_secret_name: string; is_enabled?: boolean;
  }) => d)
  .handler(async ({ data, context }) => {
    const payload: any = {
      code: data.code, name: data.name, base_url: data.base_url ?? null,
      api_key_secret_name: data.api_key_secret_name,
      is_enabled: data.is_enabled ?? true,
    };
    if (data.id) {
      const { error } = await context.supabase.from("ai_providers" as any).update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("ai_providers" as any).insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const toggleAiProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; is_enabled: boolean }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("ai_providers" as any).update({ is_enabled: data.is_enabled }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAiProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("ai_providers" as any).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ AI MODELS ============

export const listAiModels = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("ai_models" as any)
      .select("*, provider:ai_providers(id,code,name,api_key_secret_name,is_enabled)")
      .order("priority", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as any[];
  });

export const upsertAiModel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id?: string;
    provider_id: string;
    model_id: string;
    gateway_code?: string | null;
    display_name: string;
    description?: string | null;
    category?: string;
    modalities?: string[];
    caps?: Record<string, any>;
    context_window?: number | null;
    max_output_tokens?: number | null;
    input_price_per_million?: number | null;
    output_price_per_million?: number | null;
    role?: string | null;
    task?: string | null;
    rules?: string | null;
    status?: string;
    is_enabled?: boolean;
    is_default?: boolean;
    priority?: number;
    notes?: string | null;
  }) => d)
  .handler(async ({ data, context }) => {
    const payload: any = {
      provider_id: data.provider_id,
      model_id: data.model_id,
      gateway_code: data.gateway_code ?? null,
      name: data.display_name,
      display_name: data.display_name,
      description: data.description ?? null,
      category: data.category ?? "chat",
      modalities: data.modalities ?? ["text"],
      caps: data.caps ?? {},
      context_window: data.context_window ?? null,
      max_output_tokens: data.max_output_tokens ?? null,
      input_price_per_million: data.input_price_per_million ?? null,
      output_price_per_million: data.output_price_per_million ?? null,
      role: data.role ?? null,
      task: data.task ?? null,
      rules: data.rules ?? null,
      status: data.status ?? "active",
      is_enabled: data.is_enabled ?? true,
      is_default: data.is_default ?? false,
      priority: data.priority ?? 100,
      notes: data.notes ?? null,
    };
    if (data.id) {
      const { error } = await context.supabase.from("ai_models" as any).update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("ai_models" as any).insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const toggleAiModel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; is_enabled: boolean }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("ai_models" as any).update({ is_enabled: data.is_enabled }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAiModel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("ai_models" as any).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ AI USAGE ============

export const listAiUsage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("ai_usage_logs" as any)
      .select("*, model:ai_models(display_name,gateway_code)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (data ?? []) as any[];
  });

