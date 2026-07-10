import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

async function sha256Hex(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacHex(secret: string, body: string) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEq(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export const Route = createFileRoute("/api/public/hub/ingest")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = request.headers.get("x-api-key") ?? "";
        const signature = request.headers.get("x-hn-signature") ?? "";
        const raw = await request.text();
        if (!apiKey) return new Response("missing key", { status: 401 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const keyHash = await sha256Hex(apiKey);
        const { data: site } = await supabaseAdmin
          .from("sites").select("id, webhook_secret")
          .eq("api_key_hash", keyHash).maybeSingle();
        if (!site) return new Response("invalid key", { status: 401 });

        if (site.webhook_secret) {
          const expected = await hmacHex(site.webhook_secret, raw);
          if (!timingSafeEq(expected, signature)) {
            return new Response("bad signature", { status: 401 });
          }
        }
        let body: any = {};
        try { body = JSON.parse(raw); } catch { return new Response("bad json", { status: 400 }); }
        const type = String(body.type ?? "event").slice(0, 64);
        const payload = body.payload ?? body;

        // Mail shortcut
        if (type === "mail" && body.from && body.to) {
          await supabaseAdmin.from("mail_messages" as any).insert({
            site_id: site.id, direction: "inbound",
            from_addr: String(body.from).slice(0, 320),
            to_addr: String(body.to).slice(0, 320),
            subject: body.subject ? String(body.subject).slice(0, 500) : null,
            body: body.body ? String(body.body).slice(0, 20000) : null,
          });
        }

        const { data: event, error } = await supabaseAdmin.from("hub_events" as any).insert({
          site_id: site.id, direction: "inbound", type, payload,
          status: "delivered", delivered_at: new Date().toISOString(),
        }).select("id").single();
        if (error) return new Response(error.message, { status: 500 });
        return Response.json({ ok: true, event_id: (event as any).id });
      },
    },
  },
});
