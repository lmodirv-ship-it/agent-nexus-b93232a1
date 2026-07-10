import { createFileRoute } from "@tanstack/react-router";

async function sha256Hex(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const Route = createFileRoute("/api/public/hub/heartbeat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = request.headers.get("x-api-key") ?? "";
        if (!apiKey) return new Response("missing key", { status: 401 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const keyHash = await sha256Hex(apiKey);
        const { data: site } = await supabaseAdmin
          .from("sites").select("id").eq("api_key_hash", keyHash).maybeSingle();
        if (!site) return new Response("invalid key", { status: 401 });
        await supabaseAdmin.from("sites").update({
          last_heartbeat_at: new Date().toISOString(),
          health: "online",
        }).eq("id", site.id);
        return Response.json({ ok: true });
      },
    },
  },
});
