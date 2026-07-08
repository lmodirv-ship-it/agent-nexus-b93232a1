import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, ShieldCheck, ShieldAlert, Lock, Zap, LogIn, Key, ArrowLeft } from "lucide-react";
import { PageHeader, StatusPill } from "@/components/dashboard/PageHeader";

export const Route = createFileRoute("/security")({
  head: () => ({ meta: [{ title: "مركز الحماية — SUPER ADMIN" }, { name: "description", content: "نظرة عامة على أنظمة الحماية." }] }),
  component: SecurityPage,
});

const MODULES = [
  { name: "جدار الحماية (WAF)",   status: "نشط",  hex: "#22d3ee", value: "18,240", hint: "طلب مفحوص/دقيقة" },
  { name: "حماية DDoS",           status: "نشط",  hex: "#a78bfa", value: "3",       hint: "هجمات مصدودة اليوم" },
  { name: "شهادات SSL",           status: "نشط",  hex: "#34d399", value: "127/127", hint: "شهادة صالحة" },
  { name: "IP Blocklist",         status: "نشط",  hex: "#fb7185", value: "1,442",   hint: "IP محظور" },
  { name: "مصادقة MFA",           status: "نشط",  hex: "#fbbf24", value: "مفعّل",   hint: "لجميع المدراء" },
  { name: "تشفير عند الاستراحة",  status: "نشط",  hex: "#38bdf8", value: "AES-256", hint: "قواعد + تخزين" },
];

const LINKS = [
  { to: "/security/attempts", label: "محاولات الاختراق", Icon: LogIn,   hex: "#fb7185", hint: "سجل حي بمحاولات الوصول" },
  { to: "/security/api-keys", label: "مفاتيح API",        Icon: Key,    hex: "#a78bfa", hint: "إنشاء وإدارة المفاتيح" },
] as const;

function SecurityPage() {
  return (
    <div>
      <PageHeader icon={Shield} title="مركز الحماية" hex="#fb7185" subtitle="حالة كل أنظمة الأمان في الوقت الحقيقي" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {MODULES.map((m) => (
          <div key={m.name} className="relative overflow-hidden rounded-2xl p-5"
               style={{ background: "linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.88))",
                        border: `1px solid ${m.hex}33`, boxShadow: `0 0 0 1px ${m.hex}0d, 0 12px 40px -20px ${m.hex}55` }}>
            <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full opacity-30 blur-3xl" style={{ background: m.hex }} />
            <div className="relative flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-xl grid place-items-center"
                   style={{ background: `radial-gradient(circle at 30% 30%, ${m.hex}55, ${m.hex}11)`, border: `1px solid ${m.hex}55`, boxShadow: `0 0 14px ${m.hex}55` }}>
                <ShieldCheck className="w-5 h-5" style={{ color: m.hex, filter: `drop-shadow(0 0 6px ${m.hex})` }} />
              </div>
              <StatusPill label={m.status} hex={m.hex} />
            </div>
            <div className="relative">
              <div className="text-sm text-slate-300 font-semibold">{m.name}</div>
              <div className="text-3xl font-display font-black text-white mt-1">{m.value}</div>
              <div className="text-[11px] text-muted-foreground mt-1">{m.hint}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {LINKS.map((l) => (
          <Link key={l.to} to={l.to} className="panel p-5 flex items-center justify-between transition hover:-translate-y-0.5 group"
                style={{ borderColor: `${l.hex}33` }}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl grid place-items-center"
                   style={{ background: `radial-gradient(circle at 30% 30%, ${l.hex}55, ${l.hex}11)`, border: `1px solid ${l.hex}55`, boxShadow: `0 0 14px ${l.hex}55` }}>
                <l.Icon className="w-5 h-5" style={{ color: l.hex }} />
              </div>
              <div>
                <div className="text-white font-bold">{l.label}</div>
                <div className="text-xs text-muted-foreground">{l.hint}</div>
              </div>
            </div>
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
          </Link>
        ))}
      </div>
    </div>
  );
}
