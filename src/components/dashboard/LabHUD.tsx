import { useEffect, useState } from "react";
import { Activity, Cpu, Radio, ShieldCheck, Terminal, Zap } from "lucide-react";

export function LabHUD() {
  const [now, setNow] = useState<string>("--:--:--");
  useEffect(() => {
    const tick = () => setNow(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="lab-hud rounded-xl px-3 py-2 flex items-center gap-4 text-[11px] text-slate-300 overflow-x-auto">
      <div className="flex items-center gap-1.5">
        <span className="dot" style={{ background: "#22d3ee", color: "#22d3ee" }} />
        <span className="text-cyan-300 font-bold tracking-widest">HN::LAB</span>
      </div>
      <span className="sep">│</span>
      <div className="flex items-center gap-1.5">
        <Terminal className="w-3 h-3 text-cyan-400" />
        <span>SYS/ONLINE</span>
      </div>
      <span className="sep">│</span>
      <div className="flex items-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-rose-400" />
        <span>WAF: <span className="text-rose-300">ACTIVE</span></span>
      </div>
      <span className="sep">│</span>
      <div className="flex items-center gap-1.5">
        <Radio className="w-3 h-3 text-emerald-400" />
        <span>MESH: <span className="text-emerald-300">LINKED</span></span>
      </div>
      <span className="sep">│</span>
      <div className="flex items-center gap-1.5">
        <Cpu className="w-3 h-3 text-violet-400" />
        <span>AGENTS: <span className="text-violet-300">RUNNING</span></span>
      </div>
      <span className="sep">│</span>
      <div className="flex items-center gap-1.5">
        <Activity className="w-3 h-3 text-amber-400" />
        <span>UPTIME: <span className="text-amber-300">99.98%</span></span>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-1.5">
        <Zap className="w-3 h-3 text-cyan-400" />
        <span className="font-mono text-cyan-200 lab-cursor">T {now}</span>
      </div>
    </div>
  );
}
