import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Play, Square, RotateCw, Zap, Settings2, Activity, Bot, AlertCircle,
  CheckCircle2, Search, Filter, Terminal, Cpu, MemoryStick, Timer,
  ShieldCheck, Database, Cloud, Sparkles, Wrench, Radio, Power, PowerOff,
} from "lucide-react";

export const Route = createFileRoute("/agents")({
  head: () => ({
    meta: [
      { title: "غرفة القيادة — إدارة الوكلاء | SUPER ADMIN" },
      { name: "description", content: "غرفة قيادة متقدمة لتشغيل وإيقاف وجدولة وكلاء المنصة لحظياً." },
    ],
  }),
  component: AgentsPage,
});

type Status = "running" | "stopped" | "error";
interface Agent {
  id: string;
  name: string;
  nameAr: string;
  status: Status;
  interval: number;
  lastRun: string;
  tasks: number;
  cpu: number;
  ram: number;
  category: "monitor" | "security" | "ai" | "infra" | "backup" | "ops";
  icon: any;
  hex: string;
  desc: string;
}

const CAT_META: Record<Agent["category"], { label: string; hex: string }> = {
  monitor:  { label: "مراقبة",  hex: "#22d3ee" },
  security: { label: "حماية",   hex: "#fb7185" },
  ai:       { label: "ذكاء",    hex: "#a78bfa" },
  infra:    { label: "بنية",    hex: "#38bdf8" },
  backup:   { label: "نسخ",     hex: "#34d399" },
  ops:      { label: "تشغيل",   hex: "#fbbf24" },
};

const INITIAL: Agent[] = [
  { id: "uptime",     name: "Uptime Monitor",     nameAr: "مراقب التوفر",     status: "running", interval: 30,     lastRun: "12:30:45", tasks: 4821, cpu: 4,  ram: 12, category: "monitor",  icon: Radio,       hex: "#22d3ee", desc: "يفحص جميع المواقع كل 30 ثانية." },
  { id: "waf",        name: "WAF Sentinel",       nameAr: "حارس الجدار",       status: "running", interval: 10,     lastRun: "12:31:00", tasks: 18240,cpu: 11, ram: 26, category: "security", icon: ShieldCheck, hex: "#fb7185", desc: "يحلل الطلبات ويحظر الاعتداءات." },
  { id: "ai_dbg",     name: "AI Debugger",        nameAr: "المصحح الذكي",      status: "stopped", interval: 300,    lastRun: "11:20:00", tasks: 132,  cpu: 0,  ram: 0,  category: "ai",       icon: Sparkles,    hex: "#a78bfa", desc: "يقترح ويطبق إصلاحات تلقائية." },
  { id: "scaler",     name: "Auto-Scaler",        nameAr: "التوسع الذاتي",     status: "running", interval: 30,     lastRun: "12:29:30", tasks: 74,   cpu: 3,  ram: 8,  category: "infra",    icon: Cpu,         hex: "#38bdf8", desc: "يوسّع أو يقلّص النسخ حسب الضغط." },
  { id: "backup",     name: "Core Backup",        nameAr: "النسخ الاحتياطي",   status: "running", interval: 3600,   lastRun: "12:00:00", tasks: 168,  cpu: 2,  ram: 6,  category: "backup",   icon: Database,    hex: "#34d399", desc: "نسخة لقاعدة الدماغ كل ساعة." },
  { id: "mesh",       name: "Mesh Orchestrator",  nameAr: "منسق الشبكة",       status: "error",   interval: 60,     lastRun: "10:15:00", tasks: 902,  cpu: 0,  ram: 0,  category: "infra",    icon: Cloud,       hex: "#38bdf8", desc: "يربط المواقع بالدماغ المركزي." },
  { id: "supervisor", name: "Supervisor",         nameAr: "المشرف الأعلى",     status: "running", interval: 15,     lastRun: "12:31:15", tasks: 60421,cpu: 5,  ram: 14, category: "ops",      icon: Wrench,      hex: "#fbbf24", desc: "يعيد تشغيل أي وكيل يتوقف." },
  { id: "report",     name: "Weekly Report",      nameAr: "التقرير الأسبوعي",  status: "running", interval: 604800, lastRun: "2026-06-30", tasks: 14, cpu: 1,  ram: 3,  category: "ops",      icon: Terminal,    hex: "#fbbf24", desc: "يرسل تقرير PDF كل يوم أحد." },
];

function fmtInterval(s: number) {
  if (s < 60) return `${s} ث`;
  if (s < 3600) return `${Math.round(s / 60)} د`;
  if (s < 86400) return `${Math.round(s / 3600)} س`;
  return `${Math.round(s / 86400)} ي`;
}

function statusStyle(s: Status) {
  if (s === "running") return { dot: "#22d3ee", label: "يعمل", ring: "#22d3ee" };
  if (s === "stopped") return { dot: "#64748b", label: "متوقف", ring: "#64748b" };
  return { dot: "#fb7185", label: "خطأ", ring: "#fb7185" };
}

function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>(INITIAL);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [loading, setLoading] = useState<string | null>(null);
  const [logs, setLogs] = useState<{ t: string; msg: string; hex: string }[]>([
    { t: "12:31:15", msg: "المشرف الأعلى: كل الوكلاء تحت السيطرة", hex: "#fbbf24" },
    { t: "12:31:00", msg: "حارس الجدار: حظر IP 41.92.10.44", hex: "#fb7185" },
    { t: "12:30:45", msg: "مراقب التوفر: 127 موقع سليم", hex: "#22d3ee" },
    { t: "12:29:30", msg: "التوسع الذاتي: زيادة نسخ souk.hn إلى 4", hex: "#38bdf8" },
    { t: "12:00:00", msg: "النسخ الاحتياطي: تم رفع 428MB إلى S3", hex: "#34d399" },
  ]);

  // بث لحظي للنشاط (محاكاة)
  useEffect(() => {
    const id = setInterval(() => {
      setAgents((prev) =>
        prev.map((a) =>
          a.status === "running"
            ? { ...a, cpu: Math.max(1, Math.min(95, a.cpu + (Math.random() * 6 - 3))), ram: Math.max(1, Math.min(95, a.ram + (Math.random() * 4 - 2))), tasks: a.tasks + Math.round(Math.random() * 3) }
            : a
        )
      );
    }, 1500);
    return () => clearInterval(id);
  }, []);

  const stats = useMemo(() => {
    const running = agents.filter((a) => a.status === "running").length;
    const stopped = agents.filter((a) => a.status === "stopped").length;
    const errors  = agents.filter((a) => a.status === "error").length;
    const tasks   = agents.reduce((s, a) => s + a.tasks, 0);
    return { total: agents.length, running, stopped, errors, tasks };
  }, [agents]);

  const filtered = useMemo(
    () =>
      agents.filter((a) => {
        const okS = filter === "all" ? true : a.status === filter;
        const q = query.trim().toLowerCase();
        const okQ = !q || a.name.toLowerCase().includes(q) || a.nameAr.includes(query.trim());
        return okS && okQ;
      }),
    [agents, filter, query]
  );

  function pushLog(msg: string, hex: string) {
    const t = new Date().toLocaleTimeString("ar-EG", { hour12: false });
    setLogs((l) => [{ t, msg, hex }, ...l].slice(0, 40));
  }

  async function act(id: string, action: "start" | "stop" | "restart" | "run") {
    setLoading(id + action);
    await new Promise((r) => setTimeout(r, 500));
    setAgents((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const now = new Date().toLocaleTimeString("ar-EG", { hour12: false });
        if (action === "start")   { pushLog(`▶️ تشغيل ${a.nameAr}`, a.hex);        return { ...a, status: "running", lastRun: now }; }
        if (action === "stop")    { pushLog(`⏹ إيقاف ${a.nameAr}`, "#64748b");   return { ...a, status: "stopped", cpu: 0, ram: 0 }; }
        if (action === "restart") { pushLog(`🔄 إعادة تشغيل ${a.nameAr}`, a.hex); return { ...a, status: "running", lastRun: now }; }
        pushLog(`⚡ تنفيذ فوري: ${a.nameAr}`, a.hex);
        return { ...a, tasks: a.tasks + 1, lastRun: now };
      })
    );
    setLoading(null);
  }

  async function bulk(action: "start" | "stop") {
    for (const a of agents) {
      if (action === "start" && a.status !== "running") await act(a.id, "start");
      if (action === "stop"  && a.status === "running") await act(a.id, "stop");
    }
  }

  return (
    <div className="space-y-6">
      {/* ترويسة */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-black">غرفة قيادة الوكلاء</h1>
          <p className="text-sm text-muted-foreground mt-1">تحكم مطلق: تشغيل، إيقاف، جدولة، وتنفيذ فوري لكل وكيل في المنصة.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => bulk("start")} className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
                  style={{ background: "linear-gradient(135deg,#22d3ee33,#22d3ee11)", border: "1px solid #22d3ee55", color: "#a5f3fc", boxShadow: "0 0 20px #22d3ee33" }}>
            <Power className="w-4 h-4" /> تشغيل الكل
          </button>
          <button onClick={() => bulk("stop")} className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
                  style={{ background: "linear-gradient(135deg,#fb718533,#fb718511)", border: "1px solid #fb718555", color: "#fecdd3", boxShadow: "0 0 20px #fb718533" }}>
            <PowerOff className="w-4 h-4" /> إيقاف الكل
          </button>
        </div>
      </div>

      {/* إحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "إجمالي الوكلاء", value: stats.total,   hex: "#a78bfa", Icon: Bot },
          { label: "قيد التشغيل",   value: stats.running, hex: "#22d3ee", Icon: Activity },
          { label: "متوقف",         value: stats.stopped, hex: "#64748b", Icon: Square },
          { label: "أخطاء",         value: stats.errors,  hex: "#fb7185", Icon: AlertCircle },
          { label: "مهام منفذة",    value: stats.tasks.toLocaleString("en-US"), hex: "#34d399", Icon: CheckCircle2 },
        ].map((s) => (
          <div key={s.label} className="relative overflow-hidden rounded-2xl p-4"
               style={{ background: "linear-gradient(180deg,rgba(15,23,42,0.9),rgba(2,6,23,0.85))", border: `1px solid ${s.hex}33`, boxShadow: `0 0 0 1px ${s.hex}0d, 0 12px 40px -20px ${s.hex}55` }}>
            <div className="absolute -top-8 -left-8 w-24 h-24 rounded-full opacity-40 blur-2xl" style={{ background: s.hex }} />
            <div className="relative flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400">{s.label}</div>
                <div className="text-2xl font-display font-black text-white mt-1">{s.value}</div>
              </div>
              <div className="w-10 h-10 rounded-xl grid place-items-center"
                   style={{ background: `radial-gradient(circle at 30% 30%, ${s.hex}55, ${s.hex}11)`, border: `1px solid ${s.hex}66`, boxShadow: `0 0 14px ${s.hex}55` }}>
                <s.Icon className="w-4 h-4" style={{ color: s.hex, filter: `drop-shadow(0 0 6px ${s.hex})` }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* شريط بحث + فلترة */}
      <div className="panel p-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)}
                 placeholder="ابحث عن وكيل بالاسم..."
                 className="w-full bg-black/30 border border-white/10 rounded-lg pr-9 pl-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-neon/40" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {(["all", "running", "stopped", "error"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      filter === f ? "text-white" : "text-muted-foreground hover:text-white"
                    }`}
                    style={filter === f
                      ? { borderColor: "#22d3ee88", background: "#22d3ee22", boxShadow: "0 0 12px #22d3ee55" }
                      : { borderColor: "rgba(255,255,255,0.08)" }}>
              {f === "all" ? "الكل" : f === "running" ? "يعمل" : f === "stopped" ? "متوقف" : "خطأ"}
            </button>
          ))}
        </div>
      </div>

      {/* الشبكة: وكلاء + سجل حي */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((a) => {
            const st = statusStyle(a.status);
            const Icon = a.icon;
            const cat = CAT_META[a.category];
            const isLoad = (k: string) => loading === a.id + k;
            return (
              <div key={a.id} className="relative overflow-hidden rounded-2xl p-5 group transition hover:-translate-y-0.5"
                   style={{ background: "linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.88))",
                            border: `1px solid ${a.hex}33`,
                            boxShadow: `0 0 0 1px ${a.hex}0d, 0 20px 60px -30px ${a.hex}66` }}>
                <div className="absolute -top-16 -left-16 w-40 h-40 rounded-full opacity-30 blur-3xl" style={{ background: a.hex }} />

                <div className="relative flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl grid place-items-center"
                         style={{ background: `radial-gradient(circle at 30% 30%, ${a.hex}66, ${a.hex}11)`,
                                  border: `1px solid ${a.hex}66`,
                                  boxShadow: `0 0 18px ${a.hex}66, inset 0 0 12px ${a.hex}33` }}>
                      <Icon className="w-5 h-5" style={{ color: a.hex, filter: `drop-shadow(0 0 6px ${a.hex})` }} />
                    </div>
                    <div>
                      <div className="text-base font-bold text-white leading-tight">{a.nameAr}</div>
                      <div className="text-[11px] text-muted-foreground">{a.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: `${cat.hex}22`, color: cat.hex, border: `1px solid ${cat.hex}55` }}>
                      {cat.label}
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full"
                          style={{ background: `${st.dot}18`, color: st.dot, border: `1px solid ${st.ring}55` }}>
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: st.dot, boxShadow: `0 0 8px ${st.dot}` }} />
                      {st.label}
                    </span>
                  </div>
                </div>

                <p className="relative text-xs text-slate-400 mt-3 leading-relaxed">{a.desc}</p>

                {/* metrics */}
                <div className="relative grid grid-cols-4 gap-2 mt-4 text-[11px]">
                  <MetricPill Icon={Timer} label="التكرار" value={fmtInterval(a.interval)} hex="#a78bfa" />
                  <MetricPill Icon={Cpu} label="CPU" value={`${a.cpu.toFixed(0)}%`} hex="#22d3ee" />
                  <MetricPill Icon={MemoryStick} label="RAM" value={`${a.ram.toFixed(0)}%`} hex="#38bdf8" />
                  <MetricPill Icon={CheckCircle2} label="مهام" value={a.tasks.toLocaleString("en-US")} hex="#34d399" />
                </div>

                <div className="relative text-[10px] text-muted-foreground mt-3">
                  آخر تشغيل: <span className="text-slate-300">{a.lastRun}</span>
                </div>

                {/* actions */}
                <div className="relative grid grid-cols-4 gap-2 mt-4">
                  <ActionBtn onClick={() => act(a.id, "start")}   disabled={a.status === "running" || isLoad("start")}   hex="#22d3ee" Icon={Play}     label="تشغيل" />
                  <ActionBtn onClick={() => act(a.id, "stop")}    disabled={a.status !== "running" || isLoad("stop")}    hex="#fb7185" Icon={Square}   label="إيقاف" />
                  <ActionBtn onClick={() => act(a.id, "restart")} disabled={isLoad("restart")}                            hex="#fbbf24" Icon={RotateCw} label="إعادة" />
                  <ActionBtn onClick={() => act(a.id, "run")}     disabled={isLoad("run")}                                hex="#a78bfa" Icon={Zap}      label="فوري" />
                </div>
              </div>
            );
          })}
        </div>

        {/* سجل حي */}
        <div className="panel p-5 flex flex-col min-h-[420px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-neon animate-pulse" style={{ boxShadow: "0 0 8px #22d3ee" }} />
              <h3 className="font-bold">السجل الحي</h3>
            </div>
            <Settings2 className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-[11px] leading-relaxed">
            {logs.map((l, i) => (
              <div key={i} className="flex gap-2 items-start p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-slate-500 shrink-0">{l.t}</span>
                <span className="w-1.5 h-1.5 mt-1.5 rounded-full shrink-0" style={{ background: l.hex, boxShadow: `0 0 6px ${l.hex}` }} />
                <span className="text-slate-200">{l.msg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricPill({ Icon, label, value, hex }: { Icon: any; label: string; value: string; hex: string }) {
  return (
    <div className="rounded-lg px-2 py-1.5 flex flex-col items-center justify-center"
         style={{ background: `${hex}0e`, border: `1px solid ${hex}33` }}>
      <div className="flex items-center gap-1 text-[9px] text-slate-400">
        <Icon className="w-3 h-3" style={{ color: hex }} />
        {label}
      </div>
      <div className="text-[12px] font-bold text-white">{value}</div>
    </div>
  );
}

function ActionBtn({ onClick, disabled, hex, Icon, label }: { onClick: () => void; disabled?: boolean; hex: string; Icon: any; label: string }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="flex items-center justify-center gap-1 py-2 rounded-lg text-[11px] font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5"
      style={{ background: `linear-gradient(135deg, ${hex}26, ${hex}0a)`, border: `1px solid ${hex}55`, color: hex, boxShadow: `0 0 14px ${hex}22` }}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}
