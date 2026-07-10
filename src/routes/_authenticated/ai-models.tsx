import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Sparkles, Plus, Pencil, Trash2, KeyRound, ShieldCheck, Zap } from "lucide-react";
import {
  listAiModels, upsertAiModel, toggleAiModel, deleteAiModel,
} from "@/lib/queries.functions";

export const Route = createFileRoute("/_authenticated/ai-models")({
  head: () => ({ meta: [{ title: "نماذج الذكاء الاصطناعي" }] }),
  component: AiModelsPage,
});

type Model = {
  id: string;
  model_code: string;
  name: string;
  provider: string;
  source: string | null;
  model_id: string;
  api_key_secret: string | null;
  role: string | null;
  task: string | null;
  capabilities: string[];
  rules: string | null;
  status: string;
  is_enabled: boolean;
  is_default: boolean;
  notes: string | null;
};

const empty: Partial<Model> = {
  name: "", provider: "Google", source: "Lovable AI Gateway", model_id: "",
  api_key_secret: "", role: "assistant", task: "", capabilities: [], rules: "",
  status: "active", is_enabled: true, is_default: false, notes: "",
};

function AiModelsPage() {
  const router = useRouter();
  const list = useServerFn(listAiModels);
  const save = useServerFn(upsertAiModel);
  const toggle = useServerFn(toggleAiModel);
  const remove = useServerFn(deleteAiModel);

  const { data: models = [], refetch, isLoading } = useQuery({
    queryKey: ["ai-models"], queryFn: () => list(),
  });

  const [editing, setEditing] = useState<Partial<Model> | null>(null);
  const [capsInput, setCapsInput] = useState("");

  function openNew() { setEditing({ ...empty }); setCapsInput(""); }
  function openEdit(m: Model) { setEditing(m); setCapsInput((m.capabilities ?? []).join(", ")); }
  function close() { setEditing(null); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing?.name || !editing?.provider || !editing?.model_id) return;
    const capabilities = capsInput.split(",").map((s) => s.trim()).filter(Boolean);
    await save({ data: { ...(editing as any), capabilities } });
    close(); refetch(); router.invalidate();
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-violet-neon" /> نماذج الذكاء الاصطناعي
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            سجل مركزي لنماذج AI: المصدر، المفتاح، الحالة، الدور، المهمة والقدرات.
          </p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> إضافة نموذج
        </button>
      </div>

      <div className="panel p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs text-muted-foreground">
              <tr className="text-right">
                <th className="p-3">المعرف</th>
                <th className="p-3">الاسم</th>
                <th className="p-3">المزود / المصدر</th>
                <th className="p-3">Model ID</th>
                <th className="p-3">الدور / المهمة</th>
                <th className="p-3">القدرات</th>
                <th className="p-3">مفتاح API</th>
                <th className="p-3">الحالة</th>
                <th className="p-3">تفعيل</th>
                <th className="p-3">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={10} className="p-6 text-center text-muted-foreground">جارٍ التحميل…</td></tr>
              )}
              {!isLoading && models.length === 0 && (
                <tr><td colSpan={10} className="p-6 text-center text-muted-foreground">لا توجد نماذج بعد.</td></tr>
              )}
              {models.map((m: Model) => (
                <tr key={m.id} className="border-t border-panel-border hover:bg-muted/20">
                  <td className="p-3 font-mono text-xs text-cyan-neon">{m.model_code}</td>
                  <td className="p-3">
                    <div className="font-semibold flex items-center gap-2">
                      {m.name}
                      {m.is_default && <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-neon/20 text-violet-neon">افتراضي</span>}
                    </div>
                    {m.notes && <div className="text-xs text-muted-foreground">{m.notes}</div>}
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{m.provider}</div>
                    <div className="text-xs text-muted-foreground">{m.source ?? "-"}</div>
                  </td>
                  <td className="p-3 font-mono text-xs">{m.model_id}</td>
                  <td className="p-3">
                    <div className="text-xs">{m.role ?? "-"}</div>
                    <div className="text-xs text-muted-foreground">{m.task ?? "-"}</div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1 max-w-[220px]">
                      {(m.capabilities ?? []).map((c) => (
                        <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-foreground/80 flex items-center gap-1">
                          <Zap className="w-3 h-3" />{c}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3">
                    {m.api_key_secret ? (
                      <span className="text-xs flex items-center gap-1 text-emerald-400">
                        <KeyRound className="w-3 h-3" />{m.api_key_secret}
                      </span>
                    ) : (
                      <span className="text-xs flex items-center gap-1 text-muted-foreground">
                        <ShieldCheck className="w-3 h-3" /> مُدار
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      m.status === "active" ? "bg-emerald-500/20 text-emerald-400" :
                      m.status === "beta" ? "bg-amber-500/20 text-amber-400" :
                      "bg-muted text-muted-foreground"
                    }`}>{m.status}</span>
                  </td>
                  <td className="p-3">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={m.is_enabled}
                        onChange={async (e) => {
                          await toggle({ data: { id: m.id, is_enabled: e.target.checked } });
                          refetch();
                        }}
                        className="accent-cyan-neon"
                      />
                      <span className="text-xs">{m.is_enabled ? "مفعّل" : "متوقّف"}</span>
                    </label>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(m)} className="p-1.5 rounded hover:bg-muted" title="تعديل">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm(`حذف النموذج ${m.name}؟`)) return;
                          await remove({ data: { id: m.id } });
                          refetch();
                        }}
                        className="p-1.5 rounded hover:bg-red-500/20 text-red-400" title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4" onClick={close}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={submit}
            className="panel w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold">
              {editing.id ? "تعديل نموذج" : "إضافة نموذج ذكاء اصطناعي"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="الاسم *"><input required className="input" value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
              <Field label="Model ID *"><input required className="input" placeholder="google/gemini-3-flash-preview" value={editing.model_id ?? ""} onChange={(e) => setEditing({ ...editing, model_id: e.target.value })} /></Field>
              <Field label="المزود *"><input required className="input" value={editing.provider ?? ""} onChange={(e) => setEditing({ ...editing, provider: e.target.value })} /></Field>
              <Field label="المصدر"><input className="input" placeholder="Lovable AI Gateway / OpenAI / Anthropic ..." value={editing.source ?? ""} onChange={(e) => setEditing({ ...editing, source: e.target.value })} /></Field>
              <Field label="الدور"><input className="input" placeholder="assistant / reasoner / image-generator" value={editing.role ?? ""} onChange={(e) => setEditing({ ...editing, role: e.target.value })} /></Field>
              <Field label="المهمة"><input className="input" placeholder="chat-general / deep-analysis / image-gen" value={editing.task ?? ""} onChange={(e) => setEditing({ ...editing, task: e.target.value })} /></Field>
              <Field label="مفتاح API (اسم السر)"><input className="input" placeholder="LOVABLE_API_KEY أو اسم سر آخر" value={editing.api_key_secret ?? ""} onChange={(e) => setEditing({ ...editing, api_key_secret: e.target.value })} /></Field>
              <Field label="الحالة">
                <select className="input" value={editing.status ?? "active"} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                  <option value="active">active</option>
                  <option value="beta">beta</option>
                  <option value="deprecated">deprecated</option>
                  <option value="disabled">disabled</option>
                </select>
              </Field>
              <Field label="القدرات (مفصولة بفواصل)" className="md:col-span-2">
                <input className="input" placeholder="text, vision, tools, image-generation" value={capsInput} onChange={(e) => setCapsInput(e.target.value)} />
              </Field>
              <Field label="القوانين / التعليمات" className="md:col-span-2">
                <textarea className="input min-h-[80px]" value={editing.rules ?? ""} onChange={(e) => setEditing({ ...editing, rules: e.target.value })} />
              </Field>
              <Field label="ملاحظات" className="md:col-span-2">
                <input className="input" value={editing.notes ?? ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.is_enabled ?? true} onChange={(e) => setEditing({ ...editing, is_enabled: e.target.checked })} />
                مفعّل
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.is_default ?? false} onChange={(e) => setEditing({ ...editing, is_default: e.target.checked })} />
                افتراضي
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={close} className="px-4 py-2 rounded bg-muted text-sm">إلغاء</button>
              <button type="submit" className="btn-primary">حفظ</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs text-muted-foreground mb-1 block">{label}</span>
      {children}
    </label>
  );
}
