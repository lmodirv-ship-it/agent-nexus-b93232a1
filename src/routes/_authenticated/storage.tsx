import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { HardDrive, Upload, Folder, Search, Trash2 } from "lucide-react";
import { PageHeader, NeonButton } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { listFolders, deleteFolder } from "@/lib/queries.functions";

const foldersQ = queryOptions({ queryKey: ["folders"], queryFn: () => listFolders() });

export const Route = createFileRoute("/_authenticated/storage")({
  head: () => ({ meta: [{ title: "التخزين السحابي — SUPER ADMIN" }, { name: "description", content: "إدارة مجلدات التخزين السحابي." }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(foldersQ),
  component: StoragePage,
  errorComponent: ({ error }) => <div className="panel p-6">{error.message}</div>,
  notFoundComponent: () => <div className="panel p-6">غير موجود</div>,
});

function StoragePage() {
  const { data: rows } = useSuspenseQuery(foldersQ);
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const items = rows.filter((i: any) => !query || (i.name ?? "").includes(query));
  const totalGb = rows.reduce((a: number, r: any) => a + Number(r.size_gb ?? 0), 0);

  const remove = async (id: string) => {
    if (!confirm("حذف؟")) return;
    await deleteFolder({ data: { id } });
    qc.invalidateQueries({ queryKey: ["folders"] });
  };

  const columns: Column<any>[] = [
    { key: "name", header: "الاسم", cell: (i) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg grid place-items-center"
             style={{ background: "radial-gradient(circle at 30% 30%, #fbbf2455, #fbbf2411)", border: "1px solid #fbbf2455", boxShadow: "0 0 10px #fbbf2444" }}>
          <Folder className="w-4 h-4 text-amber-neon" />
        </div>
        <span className="text-white font-medium font-mono">{i.name}</span>
      </div>
    )},
    { key: "files", header: "الملفات", cell: (i) => <span className="text-slate-200">{i.file_count ?? 0}</span> },
    { key: "size", header: "الحجم", cell: (i) => <span className="text-slate-200">{Number(i.size_gb ?? 0)} GB</span> },
    { key: "act", header: "", cell: (i) => (
      <button onClick={() => remove(i.id)} className="w-8 h-8 rounded-lg grid place-items-center border border-white/10 hover:border-rose-neon/50 text-slate-300 hover:text-rose-neon transition" title="حذف">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    )},
  ];

  return (
    <div>
      <PageHeader icon={HardDrive} title="التخزين السحابي" hex="#22d3ee"
        subtitle={`${totalGb.toFixed(1)} GB مستخدم في ${rows.length} مجلد`}
        actions={<NeonButton icon={Upload}>رفع ملف</NeonButton>} />

      <div className="panel p-3 mb-4 relative">
        <Search className="w-4 h-4 absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث في التخزين..."
               className="w-full bg-black/30 border border-white/10 rounded-lg pr-9 pl-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-neon/40" />
      </div>

      <DataTable rows={items} columns={columns} />
    </div>
  );
}
