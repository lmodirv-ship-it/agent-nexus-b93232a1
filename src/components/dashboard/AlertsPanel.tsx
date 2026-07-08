export function AlertsPanel({ items }: { items: any[] }) {
  return (
    <div className="panel p-4 h-full">
      <h3 className="text-sm font-bold mb-3">التنبيهات</h3>
      <div className="space-y-2 text-xs">
        {items.length === 0 && <div className="text-muted-foreground">لا توجد تنبيهات</div>}
        {items.map((n) => {
          const level = n.level ?? n.severity ?? "info";
          const color = level === "danger" ? "rose" : level === "warning" ? "amber" : "cyan";
          return (
            <div key={n.id} className={`p-2 rounded bg-${color}-500/10 border border-${color}-400/30`}>
              <div className="font-bold">{n.title ?? "تنبيه"}</div>
              <div className="text-muted-foreground">{n.message ?? ""}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
