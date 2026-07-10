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
