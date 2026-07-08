export function DbMonitor() {
  const dbs = [
    { name: "main_db", size: "12.4 GB", status: "online" },
    { name: "analytics", size: "8.1 GB", status: "online" },
    { name: "logs", size: "24.7 GB", status: "warning" },
  ];
  return (
    <div className="panel p-4">
      <h3 className="text-sm font-bold mb-3">قواعد البيانات</h3>
      <div className="space-y-2">
        {dbs.map((d) => (
          <div key={d.name} className="flex items-center justify-between text-xs">
            <span>{d.name}</span>
            <span className="text-muted-foreground">{d.size}</span>
            <span className={`w-2 h-2 rounded-full ${d.status === "online" ? "bg-emerald-400" : "bg-amber-400"}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
