export function ResourceChart() {
  const items = [
    { label: "CPU", value: 62, color: "bg-cyan-400" },
    { label: "RAM", value: 78, color: "bg-violet-400" },
    { label: "Disk", value: 44, color: "bg-emerald-400" },
    { label: "Net", value: 31, color: "bg-amber-400" },
  ];
  return (
    <div className="panel p-4">
      <h3 className="text-sm font-bold mb-3">الموارد الحية</h3>
      <div className="space-y-3">
        {items.map((i) => (
          <div key={i.label}>
            <div className="flex justify-between text-xs mb-1">
              <span>{i.label}</span>
              <span className="text-muted-foreground">{i.value}%</span>
            </div>
            <div className="h-2 rounded-full bg-black/40 overflow-hidden">
              <div className={`h-full ${i.color}`} style={{ width: `${i.value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
