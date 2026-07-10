import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function db(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "toggle_agent",
  title: "Toggle agent activation",
  description: "Activate or deactivate an agent from the catalog by id.",
  inputSchema: {
    agent_id: z.string().uuid(),
    is_active: z.boolean(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ agent_id, is_active }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = db(ctx);
    const { error } = await supabase.from("agents_catalog").update({ is_active }).eq("id", agent_id);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    await supabase.from("audit_log").insert({
      actor_id: ctx.getUserId(),
      action: is_active ? "agent.activate" : "agent.deactivate",
      target: `agents_catalog/${agent_id}`,
      details: { via: "mcp" },
    });
    return { content: [{ type: "text", text: `agent ${agent_id} => ${is_active ? "active" : "inactive"}` }] };
  },
});
