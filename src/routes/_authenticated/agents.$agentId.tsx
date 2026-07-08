import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bot, ArrowRight, Play, Square, RotateCw, Zap, Activity, Terminal } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";

export const Route = createFileRoute("/_authenticated/agents/$agentId")({
  head: ({ params }) => ({
    meta: [
      { title: `الوكيل ${params.agentId} — SUPER ADMIN` },
      { name: "description", content: `تفاصيل وأداء الوكيل ${params.agentId}.` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AgentDetailPage,
});

const AGENTS: Record<string, { nameAr: string; name: string; desc: string; hex: string; interval: number }> = {
  uptime:     { nameAr: "مراقب التوفر",   name: "Uptime Monitor",    desc: "يفحص جميع المواقع كل 30 ثانية.",  hex: "#22d3ee", interval: 30 },
  waf:        { nameAr: "حارس الجدار",     name: "WAF Sentinel",      desc: "يحلل الطلبات ويحظر الاعتداءات.",  hex: "#fb7185", interval: 10 },
  ai_dbg:     { nameAr: "المصحح الذكي",    name: "AI Debugger",       desc: "يقترح ويطبق إصلاحات تلقائية.",    hex: "#a78bfa", interval: 300 },
  scaler:     { nameAr: "التوسع الذاتي",   name: "Auto-Scaler",       desc: "يوسّع أو يقلّص النسخ حسب الضغط.", hex: "#38bdf8", interval: 30 },
  backup:     { nameAr: "النسخ الاحتياطي", name: "Core Backup",       desc: "نسخة لقاعدة الدماغ كل ساعة.",     hex: "#34d399", interval: 3600 },
  mesh:       { nameAr: "منسق الشبكة",     name: "Mesh Orchestrator", desc: "يربط المواقع بالدماغ المركزي.",   hex: "#38bdf8", interval: 60 },
  supervisor: { nameAr: "المشرف الأعلى",   name: "Supervisor",        desc: "يعيد تشغيل أي وكيل يتوقف.",       hex: "#fbbf24", interval: 15 },
  report:     { nameAr: "التقرير الأسبوعي",name: "Weekly Report",     desc: "يرسل تقرير PDF كل يوم أحد.",      hex: "#fbbf24", interval: 604800 },
};

function AgentDetailPage() {
  const { agentId } = Route.useParams();
  const info = AGENTS[agentId] ?? { nameAr: agentId, name: agentId, desc: "وكيل غير معروف", hex: "#64748b", interval: 60 };

  const [cpu, setCpu] = useState<number[]>(Array.from({ length: 30 }, () => 20 + Math.random() * 40));
  const [logs] = useState(Array.from({ length: 20 }, (_, i) => ({
    t: new Date(Date.now() - i * 45_000).toLocaleTimeString("ar-EG", { hour12: false }),
    msg: [`تم الفحص بنجاح`, `تنفيذ مهمة دورية`, `لا توجد تغييرات`, `اكتشف تحديث بسيط`, `أعاد المحاولة بنجاح`][i % 5],
  })));

  useEffect(() => {
    const id = setInterval(() => setCpu((p) => [...p.slice(1), Math.max(1, Math.min(95, p[p.length - 1] + (Math.random() * 10 - 5)))]), 900);
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      <div className="mb-4">
        <Link to="/agents" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-cyan-neon transition">
          <ArrowRight className="w-4 h-4" /> عودة لغرفة القيادة
        </Link>
      </div>

      <PageHeader icon={Bot} title={info.nameAr} hex={info.hex} subtitle={`${info.name} · ${info.desc}`}
        actions={
          <div className="flex gap-2">
            <button className="px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
                    style={{ background: "linear-gradient(135deg,#22d3ee33,#22d3ee11)", border: "1px solid #22d3ee55", color: "#22d3ee" }}>
              <Play className="w-3.5 h-3.5" /> تشغيل
            </button>
            <button className="px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
                    style={{ background: "linear-gradient(135deg,#fb718533,#fb718511)", border: "1px solid #fb718555", color: "#fb7185" }}>
              <Square className="w-3.5 h-3.5" /> إيقاف
            </button>
            <button className="px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
                    style={{ background: "linear-gradient(135deg,#a78bfa33,#a78bfa11)", border: "1px solid #a78bfa55", color: "#a78bfa" }}>
              <Zap className="w-3.5 h-3.5" /> تنفيذ فوري
            </button>
          </div>
        } />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "الحالة",  val: "يعمل",             hex: "#22d3ee" },
          { label: "التكرار", val: `${info.interval}s`, hex: "#a78bfa" },
          { label: "مهام اليوم", val: "1,284",          hex: "#38bdf8" },
          { label: "نجاح",    val: "99.8%",            hex: "#34d399" },
        ].map((s) => (
          <div key={s.label} className="panel p-4">
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="text-2xl font-black mt-1" style={{ color: s.hex }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 panel p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-cyan-neon" />
            <h3 className="font-bold">أداء الوكيل (CPU)</h3>
          </div>
          <svg viewBox="0 0 600 180" className="w-full h-40">
            <defs>
              <linearGradient id="ag" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={info.hex} stopOpacity="0.5" />
                <stop offset="100%" stopColor={info.hex} stopOpacity="0" />
              </linearGradient>
            </defs>
            {(() => {
              const w = 600, h = 180, pad = 8;
              const dx = (w - pad * 2) / (cpu.length - 1);
              const path = cpu.map((v, i) => `${i === 0 ? "M" : "L"}${pad + i * dx},${h - pad - (v / 100) * (h - pad * 2)}`).join(" ");
              const area = `${path} L${w - pad},${h - pad} L${pad},${h - pad} Z`;
              return <>
                <path d={area} fill="url(#ag)" />
                <path d={path} fill="none" stroke={info.hex} strokeWidth={2} style={{ filter: `drop-shadow(0 0 4px ${info.hex})` }} />
              </>;
            })()}
          </svg>
        </div>

        <div className="panel p-5">
          <div className="flex items-center gap-2 mb-4">
            <Terminal className="w-4 h-4 text-violet-neon" />
            <h3 className="font-bold">سجل تنفيذ الوكيل</h3>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto font-mono text-[11px]">
            {logs.map((l, i) => (
              <div key={i} className="flex gap-2 p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-slate-500 shrink-0">{l.t}</span>
                <span className="w-1.5 h-1.5 mt-1.5 rounded-full shrink-0" style={{ background: info.hex, boxShadow: `0 0 6px ${info.hex}` }} />
                <span className="text-slate-200">{l.msg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
