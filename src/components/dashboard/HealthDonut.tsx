export function HealthDonut({ healthy, warnings, danger, total }: { healthy: number; warnings: number; danger: number; total: number }) {
  const pct = total ? Math.round((healthy / total) * 100) : 0;
  return (
    <div className="panel p-4">
      <h3 className="text-sm font-bold mb-3">صحة النظام</h3>
      <div className="flex items-center gap-4">
        <div className="relative w-24 h-24">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgb(52 211 153)" strokeWidth="3"
              strokeDasharray={`${pct}, 100`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center font-bold">{pct}%</div>
        </div>
        <div className="text-xs space-y-1">
          <div>✓ سليم: {healthy}</div>
          <div className="text-amber-400">⚠ تحذير: {warnings}</div>
          <div className="text-rose-400">✕ خطر: {danger}</div>
        </div>
      </div>
    </div>
  );
}
