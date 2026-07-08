import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogIn, ShieldOff, ShieldCheck, Ban } from "lucide-react";
import { PageHeader, StatusPill } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { MOCK_ATTACKS, ATTACK_COORDS, type AttackAttempt } from "@/lib/mock-data";

export const Route = createFileRoute("/security/attempts")({
  head: () => ({ meta: [{ title: "محاولات الاختراق — SUPER ADMIN" }, { name: "description", content: "سجل محاولات الاختراق مع خريطة IPs." }] }),
  component: AttemptsPage,
});

const TYPE_LABELS: Record<AttackAttempt["type"], { label: string; hex: string }> = {
  "brute-force": { label: "قوة عمياء", hex: "#fb7185" },
  sqli:          { label: "حقن SQL",   hex: "#a78bfa" },
  xss:           { label: "XSS",       hex: "#fbbf24" },
  ddos:          { label: "DDoS",      hex: "#f472b6" },
  scan:          { label: "مسح منافذ", hex: "#38bdf8" },
};

function AttemptsPage() {
  const [rows, setRows] = useState<AttackAttempt[]>(MOCK_ATTACKS);
  const [pulse, setPulse] = useState(0);
  useEffect(() => { const id = setInterval(() => setPulse((p) => p + 1), 1500); return () => clearInterval(id); }, []);

  const blockIp = (id: string) => setRows((prev) => prev.map((r) => r.id === id ? { ...r, blocked: true } : r));

  const columns: Column<AttackAttempt>[] = [
    { key: "ip", header: "IP", cell: (r) => (
      <div className="flex items-center gap-2">
        <span className="text-lg">{r.flag}</span>
        <div>
          <div className="font-mono text-white text-sm">{r.ip}</div>
          <div className="text-[11px] text-muted-foreground">{r.country}</div>
        </div>
      </div>
    )},
    { key: "type", header: "النوع", cell: (r) => <StatusPill label={TYPE_LABELS[r.type].label} hex={TYPE_LABELS[r.type].hex} /> },
    { key: "target", header: "الهدف", cell: (r) => <span className="text-slate-300 font-mono text-xs">{r.target}</span> },
    { key: "time",   header: "الوقت", cell: (r) => <span className="text-muted-foreground text-xs font-mono">{r.time}</span> },
    { key: "st",     header: "الإجراء", cell: (r) => r.blocked
      ? <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: "#22d3ee" }}><ShieldCheck className="w-3.5 h-3.5" /> محظور</span>
      : <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: "#fb7185" }}><ShieldOff className="w-3.5 h-3.5" /> مسموح</span> },
    { key: "act", header: "", cell: (r) => (
      <button onClick={() => blockIp(r.id)} disabled={r.blocked}
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition disabled:opacity-40"
              style={{ borderColor: "#fb718555", color: "#fb7185", background: "#fb71851a" }}>
        <Ban className="w-3 h-3 inline ml-1" /> حظر
      </button>
    )},
  ];

  return (
    <div>
      <PageHeader icon={LogIn} title="محاولات الاختراق" hex="#fb7185" subtitle={`${rows.length} محاولة اليوم — ${rows.filter(r=>r.blocked).length} محظورة`} />

      {/* خريطة العالم مع نقاط IPs */}
      <div className="panel p-5 mb-6">
        <h3 className="text-sm font-bold mb-3">توزيع IPs الجغرافي</h3>
        <div className="relative w-full aspect-[2/1] rounded-xl overflow-hidden"
             style={{ background: "radial-gradient(ellipse at center, rgba(34,211,238,0.06), rgba(2,6,23,0.9))", border: "1px solid rgba(255,255,255,0.06)" }}>
          {/* شبكة خطوط */}
          <svg viewBox="0 0 100 50" className="absolute inset-0 w-full h-full opacity-30">
            {Array.from({ length: 10 }).map((_, i) => (
              <line key={`v${i}`} x1={i * 10} y1="0" x2={i * 10} y2="50" stroke="rgba(255,255,255,0.06)" strokeWidth="0.1" />
            ))}
            {Array.from({ length: 6 }).map((_, i) => (
              <line key={`h${i}`} x1="0" y1={i * 10} x2="100" y2={i * 10} stroke="rgba(255,255,255,0.06)" strokeWidth="0.1" />
            ))}
            {/* قارات مبسّطة */}
            <path d="M15,15 Q22,12 28,18 L26,26 Q20,28 15,22 Z" fill="rgba(34,211,238,0.08)" />
            <path d="M45,12 Q55,10 62,18 L58,22 Q50,24 45,18 Z" fill="rgba(34,211,238,0.08)" />
            <path d="M45,25 Q55,22 60,30 L55,38 Q48,36 45,30 Z" fill="rgba(34,211,238,0.08)" />
            <path d="M70,15 Q82,12 88,22 L85,32 Q75,30 70,22 Z" fill="rgba(34,211,238,0.08)" />
            <path d="M75,35 Q82,32 88,38 L85,42 Q78,42 75,38 Z" fill="rgba(34,211,238,0.08)" />
          </svg>
          {ATTACK_COORDS.map((c, i) => (
            <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2"
                 style={{ left: `${c.x * 100}%`, top: `${c.y * 100}%` }}>
              <div className="relative">
                <div className="w-3 h-3 rounded-full animate-ping absolute inset-0"
                     style={{ background: c.hex, opacity: 0.5 + (pulse % 2) * 0.2 }} />
                <div className="w-3 h-3 rounded-full relative" style={{ background: c.hex, boxShadow: `0 0 12px ${c.hex}, 0 0 24px ${c.hex}` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <DataTable rows={rows} columns={columns} />
    </div>
  );
}
