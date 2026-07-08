export function QuickAccess() {
  const items = ["إضافة موقع", "نسخة احتياطية", "فحص أمني", "تشغيل وكيل", "تقرير SEO", "استعلام SQL"];
  return (
    <div className="panel p-4 h-full">
      <h3 className="text-sm font-bold mb-3">وصول سريع</h3>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {items.map((i) => (
          <button key={i} className="p-3 rounded bg-black/30 border border-white/5 hover:border-cyan-400/40 hover:bg-cyan-500/10 transition">
            {i}
          </button>
        ))}
      </div>
    </div>
  );
}
