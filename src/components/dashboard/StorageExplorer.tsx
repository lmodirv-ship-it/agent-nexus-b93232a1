type Folder = { id: string; name: string; files: number; sizeGb: number; icon: string };

export function StorageExplorer({ folders }: { folders: Folder[] }) {
  return (
    <div className="panel p-4 h-full">
      <h3 className="text-sm font-bold mb-3">مستكشف التخزين</h3>
      <div className="space-y-2">
        {folders.length === 0 && <div className="text-xs text-muted-foreground">لا توجد مجلدات</div>}
        {folders.map((f) => (
          <div key={f.id} className="flex items-center justify-between p-2 rounded bg-black/30 border border-white/5 text-xs">
            <span className="flex items-center gap-2">📁 {f.name}</span>
            <span className="text-muted-foreground">{f.files} ملف · {f.sizeGb} GB</span>
          </div>
        ))}
      </div>
    </div>
  );
}
