import { Bell, Search, LogOut, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function TopBar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState<string>("");
  const [name, setName] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setEmail(data.user.email ?? "");
        setName((data.user.user_metadata as any)?.full_name ?? (data.user.email ?? "").split("@")[0]);
      }
    });
  }, []);

  const handleLogout = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { next: "" }, replace: true });
  };

  return (
    <header className="flex items-center justify-between gap-4 px-6 py-4">
      <div>
        <h1 className="text-2xl font-display font-bold">
          مرحباً {name || "بك"} <span className="text-amber-neon">👑</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          لوحة التحكم المركزية لإدارة جميع قواعد البيانات، المواقع، والتخزين
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="panel pr-9 pl-4 py-2 text-sm w-64 outline-none focus:ring-2 focus:ring-cyan-neon/40" placeholder="البحث في النظام..." />
        </div>
        <button className="panel w-10 h-10 grid place-items-center relative hover:glow-violet transition">
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 bg-rose-neon text-[10px] text-background font-bold rounded-full w-5 h-5 grid place-items-center">•</span>
        </button>
        <div className="panel flex items-center gap-2 px-3 py-1.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-neon to-violet-neon grid place-items-center">
            <UserIcon className="w-3.5 h-3.5 text-background" />
          </div>
          <div className="text-xs">
            <div className="font-semibold leading-tight">{name || "مستخدم"}</div>
            <div className="text-muted-foreground text-[10px] leading-tight">{email}</div>
          </div>
        </div>
        <button onClick={handleLogout} title="تسجيل الخروج"
          className="panel w-10 h-10 grid place-items-center hover:bg-rose-neon/20 hover:border-rose-neon/40 transition">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
