import { createFileRoute } from "@tanstack/react-router";
import { FolderOpen, Users, Lock, Globe, Plus } from "lucide-react";
import { PageHeader, NeonButton } from "@/components/dashboard/PageHeader";

export const Route = createFileRoute("/folders")({
  head: () => ({ meta: [{ title: "المجلدات العامة — SUPER ADMIN" }, { name: "description", content: "المجلدات المشتركة بين المواقع." }] }),
  component: FoldersPage,
});

const FOLDERS = [
  { name: "shared-assets",   items: 128, users: 12, kind: "public",  hex: "#22d3ee", desc: "شعارات وأصول مشتركة بين كل المواقع" },
  { name: "core-backups",    items: 84,  users: 3,  kind: "private", hex: "#fb7185", desc: "نسخ احتياطية دورية لقاعدة الدماغ" },
  { name: "media-library",   items: 542, users: 18, kind: "shared",  hex: "#a78bfa", desc: "مكتبة الوسائط المرئية والمرفقات" },
  { name: "user-uploads",    items: 3210,users: 45, kind: "public",  hex: "#34d399", desc: "رفوعات المستخدمين للمواقع" },
  { name: "reports-archive", items: 68,  users: 5,  kind: "private", hex: "#fbbf24", desc: "تقارير PDF أسبوعية وشهرية" },
  { name: "logs-mirror",     items: 900, users: 2,  kind: "private", hex: "#38bdf8", desc: "مرآة للسجلات (Read-Only)" },
] as const;

const KIND = {
  public:  { label: "عام",   Icon: Globe },
  private: { label: "خاص",   Icon: Lock },
  shared:  { label: "مشترك", Icon: Users },
} as const;

function FoldersPage() {
  return (
    <div>
      <PageHeader icon={FolderOpen} title="المجلدات العامة" hex="#a78bfa"
        subtitle={`${FOLDERS.length} مجلد مشترك بين مواقع المنصة`}
        actions={<NeonButton hex="#a78bfa" icon={Plus}>مجلد جديد</NeonButton>} />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {FOLDERS.map((f) => {
          const K = KIND[f.kind];
          return (
            <div key={f.name} className="relative overflow-hidden rounded-2xl p-5 transition hover:-translate-y-0.5"
                 style={{ background: "linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.88))",
                          border: `1px solid ${f.hex}33`, boxShadow: `0 0 0 1px ${f.hex}0d, 0 12px 40px -20px ${f.hex}55` }}>
              <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full opacity-30 blur-3xl" style={{ background: f.hex }} />
              <div className="relative flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl grid place-items-center"
                     style={{ background: `radial-gradient(circle at 30% 30%, ${f.hex}55, ${f.hex}11)`, border: `1px solid ${f.hex}55`, boxShadow: `0 0 14px ${f.hex}55` }}>
                  <FolderOpen className="w-5 h-5" style={{ color: f.hex, filter: `drop-shadow(0 0 6px ${f.hex})` }} />
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"
                      style={{ background: `${f.hex}22`, color: f.hex, border: `1px solid ${f.hex}55` }}>
                  <K.Icon className="w-3 h-3" /> {K.label}
                </span>
              </div>
              <div className="relative">
                <div className="text-lg font-bold text-white font-mono">{f.name}</div>
                <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
                <div className="flex items-center justify-between mt-4 text-xs">
                  <span className="text-slate-400">{f.items.toLocaleString("en-US")} عنصر</span>
                  <span className="text-slate-400 flex items-center gap-1"><Users className="w-3 h-3" /> {f.users} مستخدم</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
