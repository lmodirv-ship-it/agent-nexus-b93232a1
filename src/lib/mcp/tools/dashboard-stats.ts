import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";

function db(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "dashboard_stats",
  title: "Dashboard stats",
  description: "Summary counts across sites: total, online, warning, offline, users, storage GB, DB GB.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const { data, error } = await db(ctx).from("sites").select("status, users_count, db_size_gb, storage_gb");
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const sites = data ?? [];
    const stats = {
      total_sites: sites.length,
      online: sites.filter((s: any) => s.status === "online").length,
      warning: sites.filter((s: any) => s.status === "warning").length,
      offline: sites.filter((s: any) => s.status === "offline" || s.status === "danger").length,
      total_users: sites.reduce((a: number, s: any) => a + (s.users_count ?? 0), 0),
      total_db_gb: +sites.reduce((a: number, s: any) => a + Number(s.db_size_gb ?? 0), 0).toFixed(2),
      total_storage_gb: +sites.reduce((a: number, s: any) => a + Number(s.storage_gb ?? 0), 0).toFixed(2),
    };
    return {
      content: [{ type: "text", text: JSON.stringify(stats) }],
      structuredContent: stats,
    };
  },
});
