import { useEffect, useState } from "react";

function TimeAgo({ iso }: { iso: string }) {
  const [text, setText] = useState("");
  useEffect(() => {
    setText(new Date(iso).toLocaleString("ar"));
  }, [iso]);
  return <>{text}</>;
}

export function ActivityFeed({ items }: { items: any[] }) {
  return (
    <div className="panel p-4 h-full">
      <h3 className="text-sm font-bold mb-3">النشاط الحي</h3>
      <div className="space-y-2 text-xs">
        {items.length === 0 && <div className="text-muted-foreground">لا يوجد نشاط</div>}
        {items.map((a) => (
          <div key={a.id} className="flex gap-2 p-2 rounded bg-black/30 border border-white/5">
            <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-cyan-400" />
            <div className="flex-1">
              <div>{a.action ?? a.message ?? "نشاط"}</div>
              <div className="text-muted-foreground text-[10px]"><TimeAgo iso={a.created_at} /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
