export function BackupCenter() {
  return (
    <div className="panel p-4 h-full">
      <h3 className="text-sm font-bold mb-3">مركز النسخ الاحتياطي</h3>
      <div className="space-y-2 text-xs">
        {[
          { name: "backup_2026_07_08.zip", size: "2.4 GB", time: "منذ ساعة" },
          { name: "backup_2026_07_07.zip", size: "2.3 GB", time: "أمس" },
          { name: "backup_2026_07_06.zip", size: "2.3 GB", time: "قبل يومين" },
        ].map((b) => (
          <div key={b.name} className="flex justify-between p-2 rounded bg-black/30 border border-white/5">
            <span>💾 {b.name}</span>
            <span className="text-muted-foreground">{b.size} · {b.time}</span>
          </div>
        ))}
        <button className="w-full py-2 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/30">
          إنشاء نسخة الآن
        </button>
      </div>
    </div>
  );
}
