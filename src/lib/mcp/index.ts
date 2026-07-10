import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listSitesTool from "./tools/list-sites";
import listClientsTool from "./tools/list-clients";
import dashboardStatsTool from "./tools/dashboard-stats";
import listAgentsTool from "./tools/list-agents";
import toggleAgentTool from "./tools/toggle-agent";

// المرجع المباشر لمصدر OAuth (لا يستخدم البروكسي)
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "hn-groupe-command-mcp",
  title: "HN Groupe — Command Center MCP",
  version: "0.1.0",
  instructions:
    "أدوات للتحكم في مواقع HN Groupe وعملائها ووكلائها الأذكياء. استعمل list_sites/list_clients/dashboard_stats للقراءة، وlist_agents/toggle_agent لإدارة الوكلاء.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listSitesTool, listClientsTool, dashboardStatsTool, listAgentsTool, toggleAgentTool],
});
