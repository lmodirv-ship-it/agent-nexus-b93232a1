import { createFileRoute } from "@tanstack/react-router";

async function hmacHex(secret: string, body: string) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function run() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: events } = await supabaseAdmin
    .from("hub_events" as any)
    .select("id, site_id, type, payload, attempts")
    .eq("direction", "outbound").eq("status", "queued")
    .limit(50);
  const rows = (events ?? []) as any[];
  let delivered = 0; let failed = 0;
  for (const ev of rows) {
    const { data: site } = await supabaseAdmin
      .from("sites").select("webhook_url, webhook_secret").eq("id", ev.site_id).maybeSingle();
    if (!site?.webhook_url) {
      await supabaseAdmin.from("hub_events" as any).update({
        status: "failed", error: "no webhook_url", attempts: (ev.attempts ?? 0) + 1,
      }).eq("id", ev.id);
      failed++; continue;
    }
    const body = JSON.stringify({ id: ev.id, type: ev.type, payload: ev.payload });
    const sig = site.webhook_secret ? await hmacHex(site.webhook_secret, body) : "";
    try {
      const res = await fetch(site.webhook_url, {
        method: "POST",
        headers: { "content-type": "application/json", "x-hn-signature": sig },
        body,
      });
      if (res.ok) {
        await supabaseAdmin.from("hub_events" as any).update({
          status: "delivered", delivered_at: new Date().toISOString(),
          attempts: (ev.attempts ?? 0) + 1,
        }).eq("id", ev.id);
        delivered++;
      } else {
        await supabaseAdmin.from("hub_events" as any).update({
          status: "failed", error: `HTTP ${res.status}`,
          attempts: (ev.attempts ?? 0) + 1,
        }).eq("id", ev.id);
        failed++;
      }
    } catch (e: any) {
      await supabaseAdmin.from("hub_events" as any).update({
        status: "failed", error: e?.message ?? String(e),
        attempts: (ev.attempts ?? 0) + 1,
      }).eq("id", ev.id);
      failed++;
    }
  }
  return { processed: rows.length, delivered, failed };
}

export const Route = createFileRoute("/api/public/hub/dispatch")({
  server: {
    handlers: {
      POST: async () => Response.json(await run()),
      GET: async () => Response.json(await run()),
    },
  },
});
