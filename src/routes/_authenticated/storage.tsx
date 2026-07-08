import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { HardDrive, Upload, Folder, File as FileIcon, Search, Download, Trash2, Share2 } from "lucide-react";
import { PageHeader, NeonButton, StatusPill } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { MOCK_STORAGE, type StorageItem } from "@/lib/mock-data";

export const Route = createFileRoute("/storage")({
  head: () => ({ meta: [{ title: "التخزين السحابي — SUPER ADMIN" }, { name: "description", content: "إدارة ملفات ومجلدات التخزين السحابي." }] }),
  component: StoragePage,
});

const VIS = { public: { label: "عام", hex: "#22d3ee" }, private: { label: "خاص", hex: "#fb7185" }, shared: { label: "مشترك", hex: "#a78bfa" } } as const;

function StoragePage() {
  const [query, setQuery] = useState("");
  const items = MOCK_STORAGE.filter((i) => !query || i.name.includes(query));

  const columns: Column<StorageItem>[] = [
    { key: "name", header: "الاسم", cell: (i) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg grid place-items-center"
               style={{
                 background: i.kind === "folder" ? "radial-gradient(circle at 30% 30%, #fbbf2455, #fbbf2411)" : "radial-gradient(circle at 30% 30%, #38bdf855, #38bdf811)",
                 border: `1px solid ${i.kind === "folder" ? "#fbbf24" : "#38bdf8"}55`,
                 boxShadow: `0 0 10px ${i.kind === "folder" ? "#fbbf24" : "#38bdf8"}44`,
               }}>
            {i.kind === "folder" ? <Folder className="w-4 h-4 text-amber-neon" /> : <FileIcon className="w-4 h-4 text-cyan-neon" />}
          </div>
          <span className="text-white font-medium font-mono">{i.name}</span>
        </div>
      )},
    { key: "size", header: "الحجم", cell: (i) => <span className="text-slate-200">{i.size}</span> },
    { key: "upd",  header: "آخر تعديل", cell: (i) => <span className="text-muted-foreground text-xs">{i.updated}</span> },
    { key: "vis",  header: "الظهور", cell: (i) => <StatusPill label={VIS[i.visibility].label} hex={VIS[i.visibility].hex} /> },
    { key: "act",  header: "", cell: () => (
      <div className="flex gap-1.5">
        <button className="w-8 h-8 rounded-lg grid place-items-center border border-white/10 hover:border-cyan-neon/50 text-slate-300 hover:text-cyan-neon transition" title="تنزيل"><Download className="w-3.5 h-3.5" /></button>
        <button className="w-8 h-8 rounded-lg grid place-items-center border border-white/10 hover:border-violet-neon/50 text-slate-300 hover:text-violet-neon transition" title="مشاركة"><Share2 className="w-3.5 h-3.5" /></button>
        <button className="w-8 h-8 rounded-lg grid place-items-center border border-white/10 hover:border-rose-neon/50 text-slate-300 hover:text-rose-neon transition" title="حذف"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader icon={HardDrive} title="التخزين السحابي" hex="#22d3ee"
        subtitle="1.8 TB مستخدم من 5 TB (36%)"
        actions={<NeonButton icon={Upload}>رفع ملف</NeonButton>} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {[
          { label: "المجلدات", val: MOCK_STORAGE.filter((i) => i.kind === "folder").length, hex: "#fbbf24" },
          { label: "الملفات",  val: MOCK_STORAGE.filter((i) => i.kind === "file").length,   hex: "#22d3ee" },
          { label: "المشاركات", val: MOCK_STORAGE.filter((i) => i.visibility !== "private").length, hex: "#a78bfa" },
        ].map((s) => (
          <div key={s.label} className="panel p-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{s.label}</span>
            <span className="text-2xl font-display font-black" style={{ color: s.hex }}>{s.val}</span>
          </div>
        ))}
      </div>

      <div className="panel p-3 mb-4 relative">
        <Search className="w-4 h-4 absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث في التخزين..."
               className="w-full bg-black/30 border border-white/10 rounded-lg pr-9 pl-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-neon/40" />
      </div>

      <DataTable rows={items} columns={columns} />
    </div>
  );
}
