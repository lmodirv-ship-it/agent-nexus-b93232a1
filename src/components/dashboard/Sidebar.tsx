import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Globe, Database, HardDrive, Shield, Sparkles,
  Bot, Settings, Activity, Cloud, Key, LogIn, FileArchive, FolderOpen,
  Crown, ScrollText, Network, Users, Radio, Mail, Code2, Link2, BrainCircuit,
} from "lucide-react";

const groups = [
  {
    label: "لوحة التحكم",
    items: [
      { to: "/", label: "الرئيسية", icon: LayoutDashboard, badge: null },
      { to: "/hub", label: "قلب المجموعة", icon: Radio, badge: "LIVE" },
      { to: "/hub-sdk", label: "SDK للمواقع", icon: Code2, badge: null },
      { to: "/inbox", label: "البريد الموحد", icon: Mail, badge: null },
    ],
  },
  {
    label: "إدارة المواقع والعملاء",
    items: [
      { to: "/sites", label: "جميع المواقع", icon: Globe, badge: null },
      { to: "/clients", label: "العملاء", icon: Users, badge: null },
      { to: "/services", label: "شبكة الخدمات", icon: Network, badge: null },
    ],
  },
  {
    label: "قواعد البيانات",
    items: [
      { to: "/databases", label: "جميع قواعد البيانات", icon: Database, badge: null },
      { to: "/performance", label: "مراقبة الأداء", icon: Activity, badge: null },
    ],
  },
  {
    label: "التخزين السحابي",
    items: [
      { to: "/storage", label: "ملفات التخزين", icon: HardDrive, badge: null },
      { to: "/folders", label: "المجلدات العامة", icon: FolderOpen, badge: null },
    ],
  },
  {
    label: "الأمان",
    items: [
      { to: "/security", label: "مركز الحماية", icon: Shield, badge: null },
      { to: "/security/attempts", label: "محاولات الاختراق", icon: LogIn, badge: null },
      { to: "/security/api-keys", label: "مفاتيح API", icon: Key, badge: null },
    ],
  },
  {
    label: "الذكاء الاصطناعي",
    items: [
      { to: "/ai-command", label: "AI Command Center", icon: Sparkles, badge: null },
      { to: "/agents", label: "الوكلاء الأذكياء", icon: Bot, badge: "8" },
      { to: "/agent-link", label: "وكلاء الربط", icon: Link2, badge: "LIVE" },
    ],
  },
  {
    label: "المراقبة",
    items: [
      { to: "/audit", label: "سجل التعديلات", icon: ScrollText, badge: null },
    ],
  },
  {
    label: "الإعدادات",
    items: [
      { to: "/settings", label: "إعدادات النظام", icon: Settings, badge: null },
      { to: "/backups", label: "النسخ الاحتياطي", icon: FileArchive, badge: null },
    ],
  },
];

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="w-64 shrink-0 panel m-3 mr-3 ml-0 p-4 overflow-y-auto max-h-[calc(100vh-1.5rem)] sticky top-3 self-start">
      <div className="flex items-center gap-3 mb-6 px-2">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-neon to-violet-neon grid place-items-center glow-cyan">
          <Crown className="w-5 h-5 text-background" />
        </div>
        <div>
          <div className="font-display font-bold text-lg leading-tight">SUPER ADMIN</div>
          <div className="text-xs text-muted-foreground">Central Database Hub</div>
        </div>
      </div>

      <nav className="space-y-5">
        {groups.map((g) => (
          <div key={g.label}>
            <div className="text-[11px] font-bold text-muted-foreground/70 tracking-wider mb-2 px-2 uppercase">
              {g.label}
            </div>
            <div className="space-y-0.5">
              {g.items.map((it) => {
                const active = pathname === it.to || (it.to !== "/" && pathname.startsWith(it.to));
                const Icon = it.icon;
                return (
                  <Link
                    key={it.to}
                    to={it.to}
                    className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-all ${
                      active
                        ? "bg-gradient-to-l from-cyan-neon/20 to-violet-neon/10 text-foreground border border-cyan-neon/30 glow-cyan"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      {it.label}
                    </span>
                    {it.badge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${active ? "bg-cyan-neon/30 text-foreground" : "bg-muted text-muted-foreground"}`}>
                        {it.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-6 pt-4 border-t border-panel-border flex items-center gap-3 px-2">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-neon to-pink-neon" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">المالك</div>
          <div className="text-[11px] text-muted-foreground truncate">superadmin@hub.com</div>
        </div>
      </div>
    </aside>
  );
}
