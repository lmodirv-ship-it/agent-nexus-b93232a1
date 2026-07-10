import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Crown, Loader2, ShieldCheck } from "lucide-react";

// Local wrapper for the beta supabase.auth.oauth namespace.
type OAuthDetails = {
  client?: { name?: string; client_uri?: string; redirect_uris?: string[] };
  scope?: string;
  redirect_url?: string;
  redirect_to?: string;
};
function authOAuth(): {
  getAuthorizationDetails: (id: string) => Promise<{ data: OAuthDetails | null; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: OAuthDetails | null; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: OAuthDetails | null; error: any }>;
} {
  return (supabase.auth as unknown as { oauth: any }).oauth;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/auth", search: { next } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await authOAuth().getAuthorizationDetails(authorizationId);
    if (error) throw error;
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="min-h-screen grid place-items-center p-6" dir="rtl">
      <div className="panel p-6 max-w-md text-center">
        <h1 className="font-display font-bold text-xl mb-2">تعذّر تحميل طلب الربط</h1>
        <p className="text-sm text-muted-foreground">{String((error as Error)?.message ?? error)}</p>
      </div>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientName = details?.client?.name ?? "تطبيق خارجي";

  async function decide(approve: boolean) {
    setBusy(true); setError(null);
    const { data, error } = approve
      ? await authOAuth().approveAuthorization(authorization_id)
      : await authOAuth().denyAuthorization(authorization_id);
    if (error) { setBusy(false); setError(error.message ?? String(error)); return; }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) { setBusy(false); setError("لم يُرجع خادم الترخيص رابط إعادة توجيه."); return; }
    window.location.href = target;
  }

  return (
    <main className="min-h-screen grid place-items-center p-6 bg-gradient-to-br from-background via-background to-cyan-neon/5" dir="rtl">
      <div className="w-full max-w-md panel p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-neon to-violet-neon grid place-items-center">
            <Crown className="w-5 h-5 text-background" />
          </div>
          <div>
            <div className="font-display font-bold text-lg leading-tight">HN Groupe</div>
            <div className="text-xs text-muted-foreground">طلب ربط تطبيق خارجي</div>
          </div>
        </div>

        <h1 className="font-display font-bold text-xl mb-2">
          ربط <span className="text-cyan-neon">{clientName}</span> بحسابك
        </h1>
        <p className="text-sm text-muted-foreground mb-4">
          سيتمكّن هذا التطبيق من استدعاء أدوات MCP الخاصّة بك نيابةً عنك، ضمن نفس صلاحيات حسابك (RLS).
          الحدود التي يفرضها التطبيق على بياناتك تبقى سارية.
        </p>

        <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-muted-foreground mb-5 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-neon shrink-0 mt-0.5" />
          <div>
            <div className="text-white font-semibold mb-0.5">صلاحيات الهوية</div>
            <div>مشاركة ملفك الأساسي وبريدك الإلكتروني مع {clientName}.</div>
            {details?.scope && <div className="mt-1 opacity-70">Scope: {details.scope}</div>}
          </div>
        </div>

        {error && <div className="text-sm text-rose-300 mb-3" role="alert">{error}</div>}

        <div className="flex gap-2">
          <button disabled={busy} onClick={() => decide(true)}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#22d3ee33,#22d3ee11)", border: "1px solid #22d3ee55", color: "#a5f3fc" }}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "الموافقة والربط"}
          </button>
          <button disabled={busy} onClick={() => decide(false)}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-white/10 text-slate-300 disabled:opacity-50">
            رفض
          </button>
        </div>
      </div>
    </main>
  );
}
