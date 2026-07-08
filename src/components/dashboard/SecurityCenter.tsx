export function SecurityCenter() {
  return (
    <div className="panel p-4">
      <h3 className="text-sm font-bold mb-3">مركز الأمان</h3>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 rounded bg-emerald-500/10 border border-emerald-400/30">
          <div className="text-emerald-300 font-bold">Firewall</div>
          <div className="text-muted-foreground">نشط</div>
        </div>
        <div className="p-2 rounded bg-emerald-500/10 border border-emerald-400/30">
          <div className="text-emerald-300 font-bold">SSL</div>
          <div className="text-muted-foreground">صالح</div>
        </div>
        <div className="p-2 rounded bg-amber-500/10 border border-amber-400/30">
          <div className="text-amber-300 font-bold">تنبيهات</div>
          <div className="text-muted-foreground">3 اليوم</div>
        </div>
        <div className="p-2 rounded bg-cyan-500/10 border border-cyan-400/30">
          <div className="text-cyan-300 font-bold">DDoS</div>
          <div className="text-muted-foreground">محمي</div>
        </div>
      </div>
    </div>
  );
}
