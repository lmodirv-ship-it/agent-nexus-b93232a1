import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, Cpu, MemoryStick, Network, Timer } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";

export const Route = createFileRoute("/_authenticated/performance")({
  head: () => ({ meta: [{ title: "مراقبة الأداء — SUPER ADMIN" }, { name: "description", content: "مراقبة CPU/RAM/الشبكة والأداء لحظياً." }] }),
  component: PerformancePage,
});

type Pt = { t: number; v: number };

function useSeries(start: number, min: number, max: number, drift: number) {
  const [pts, setPts] = useState<Pt[]>(() =>
    Array.from({ length: 40 }, (_, i) => ({ t: i, v: start + (Math.random() * 10 - 5) })));
  useEffect(() => {
    const id = setInterval(() => {
      setPts((prev) => {
        const last = prev[prev.length - 1].v;
        const next = Math.max(min, Math.min(max, last + (Math.random() * drift - drift / 2)));
        return [...prev.slice(1), { t: prev[prev.length - 1].t + 1, v: next }];
      });
    }, 800);
    return () => clearInterval(id);
  }, [min, max, drift]);
  return pts;
}

function PerformancePage() {
  const cpu = useSeries(55, 10, 95, 12);
  const ram = useSeries(62, 20, 90, 8);
  const net = useSeries(320, 100, 900, 80);
  const lat = useSeries(85, 30, 200, 30);

  const cards = [
    { label: "CPU",           icon: Cpu,         hex: "#22d3ee", pts: cpu, unit: "%",  cur: cpu[cpu.length - 1].v },
    { label: "RAM",           icon: MemoryStick, hex: "#a78bfa", pts: ram, unit: "%",  cur: ram[ram.length - 1].v },
    { label: "شبكة (Mbps)",   icon: Network,     hex: "#34d399", pts: net, unit: "",   cur: net[net.length - 1].v },
    { label: "زمن الاستجابة", icon: Timer,       hex: "#fbbf24", pts: lat, unit: "ms", cur: lat[lat.length - 1].v },
  ];

  return (
    <div>
      <PageHeader icon={Activity} title="مراقبة الأداء" subtitle="مقاييس النظام لحظياً — تحديث كل ثانية" hex="#22d3ee" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="relative overflow-hidden rounded-2xl p-5"
               style={{ background: "linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.88))",
                        border: `1px solid ${c.hex}33`, boxShadow: `0 0 0 1px ${c.hex}0d, 0 12px 40px -20px ${c.hex}55` }}>
            <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full opacity-30 blur-3xl" style={{ background: c.hex }} />
            <div className="relative flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <c.icon className="w-4 h-4" style={{ color: c.hex, filter: `drop-shadow(0 0 6px ${c.hex})` }} />
                <span className="text-sm font-semibold text-slate-200">{c.label}</span>
              </div>
              <div className="text-3xl font-display font-black text-white">
                {c.cur.toFixed(0)}<span className="text-sm text-slate-500 mr-1">{c.unit}</span>
              </div>
            </div>
            <Sparkline pts={c.pts} hex={c.hex} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Sparkline({ pts, hex }: { pts: Pt[]; hex: string }) {
  const w = 600, h = 120, pad = 6;
  const vals = pts.map((p) => p.v);
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = Math.max(1, max - min);
  const dx = (w - pad * 2) / (pts.length - 1);
  const path = pts.map((p, i) => {
    const x = pad + i * dx;
    const y = h - pad - ((p.v - min) / range) * (h - pad * 2);
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const area = `${path} L${(w - pad).toFixed(1)},${(h - pad).toFixed(1)} L${pad},${(h - pad).toFixed(1)} Z`;
  const gid = `g-${hex.replace("#", "")}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24">
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"   stopColor={hex} stopOpacity="0.5" />
          <stop offset="100%" stopColor={hex} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={path} fill="none" stroke={hex} strokeWidth={2} style={{ filter: `drop-shadow(0 0 4px ${hex})` }} />
    </svg>
  );
}
