export function AICommandCenter() {
  return (
    <div className="panel p-4 h-full">
      <h3 className="text-sm font-bold mb-3">مركز أوامر الذكاء الاصطناعي</h3>
      <div className="space-y-2 text-xs">
        <div className="p-3 rounded bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-400/30">
          <div className="font-bold text-violet-200 mb-1">وكيل المراقبة</div>
          <div className="text-muted-foreground">يعمل الآن · 42 مهمة</div>
        </div>
        <div className="p-3 rounded bg-black/30 border border-white/5">
          <div className="font-bold">آخر أمر:</div>
          <div className="text-muted-foreground">"حلّل أداء قاعدة البيانات"</div>
        </div>
        <button className="w-full py-2 rounded bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 hover:bg-cyan-500/30">
          أمر جديد →
        </button>
      </div>
    </div>
  );
}
