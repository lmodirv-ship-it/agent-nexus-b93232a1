import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Crown, Mail, Lock, Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/" });
    });
  }, [navigate]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/" });
    } catch (err: any) {
      setError(err.message ?? "خطأ");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true); setError(null);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { setError(String(result.error?.message ?? result.error)); setLoading(false); return; }
    if (result.redirected) return;
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen grid place-items-center p-6 bg-gradient-to-br from-background via-background to-violet-neon/5" dir="rtl">
      <div className="w-full max-w-md panel p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-neon to-violet-neon grid place-items-center glow-cyan">
            <Crown className="w-6 h-6 text-background" />
          </div>
          <div>
            <div className="font-display font-bold text-xl">SUPER ADMIN</div>
            <div className="text-xs text-muted-foreground">مركز التحكم الشامل</div>
          </div>
        </div>

        <div className="flex gap-2 mb-6 p-1 bg-muted/30 rounded-lg">
          <button onClick={() => setMode("signin")}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${mode === "signin" ? "bg-gradient-to-l from-cyan-neon/20 to-violet-neon/10 text-foreground border border-cyan-neon/30" : "text-muted-foreground"}`}>
            تسجيل الدخول
          </button>
          <button onClick={() => setMode("signup")}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${mode === "signup" ? "bg-gradient-to-l from-cyan-neon/20 to-violet-neon/10 text-foreground border border-cyan-neon/30" : "text-muted-foreground"}`}>
            حساب جديد
          </button>
        </div>

        <form onSubmit={handleEmail} className="space-y-3">
          {mode === "signup" && (
            <input type="text" required placeholder="الاسم الكامل" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full panel px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-cyan-neon/40" />
          )}
          <div className="relative">
            <Mail className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="email" required placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full panel pr-10 pl-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-cyan-neon/40" />
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="password" required minLength={6} placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full panel pr-10 pl-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-cyan-neon/40" />
          </div>
          {error && <div className="text-xs text-rose-neon bg-rose-neon/10 border border-rose-neon/30 rounded px-3 py-2">{error}</div>}
          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-lg bg-gradient-to-l from-cyan-neon to-violet-neon text-background font-bold text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === "signin" ? "دخول" : "إنشاء حساب"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="flex-1 h-px bg-panel-border" />
          <span className="text-xs text-muted-foreground">أو</span>
          <div className="flex-1 h-px bg-panel-border" />
        </div>

        <button onClick={handleGoogle} disabled={loading}
          className="w-full panel py-2.5 text-sm font-medium hover:bg-muted/40 transition flex items-center justify-center gap-2 disabled:opacity-50">
          <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          الدخول بحساب Google
        </button>

        <p className="text-[11px] text-muted-foreground text-center mt-6">
          🔒 محمي بواسطة نظام مصادقة متقدم — أول مستخدم يسجّل يصبح مالك النظام تلقائياً
        </p>
      </div>
    </div>
  );
}
