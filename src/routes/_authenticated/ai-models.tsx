import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Sparkles, Plus, Pencil, Trash2, KeyRound, ShieldCheck, Zap, Server, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";
import {
  listAiModels, upsertAiModel, toggleAiModel, deleteAiModel,
  listAiProviders, upsertAiProvider, toggleAiProvider, deleteAiProvider,
} from "@/lib/queries.functions";

export const Route = createFileRoute("/_authenticated/ai-models")({
  head: () => ({ meta: [{ title: "نماذج الذكاء الاصطناعي" }] }),
  component: AiModelsPage,
});

type Provider = {
  id: string; code: string; name: string; base_url: string | null;
  api_key_secret_name: string; is_enabled: boolean;
};

type Model = {
  id: string; model_code: string; provider_id: string | null;
  provider: Provider | null;
  model_id: string; gateway_code: string | null;
  display_name: string; name: string; description: string | null;
  category: string; modalities: string[]; caps: Record<string, any>;
  context_window: number | null; max_output_tokens: number | null;
  input_price_per_million: number | null; output_price_per_million: number | null;
  role: string | null; task: string | null; rules: string | null;
  status: string; is_enabled: boolean; is_default: boolean;
  priority: number; notes: string | null;
};

const emptyModel: Partial<Model> = {
  provider_id: "", model_id: "", gateway_code: "", display_name: "",
  description: "", category: "chat", modalities: ["text"], caps: {},
  context_window: null, max_output_tokens: null,
  input_price_per_million: null, output_price_per_million: null,
  role: "assistant", task: "", rules: "", status: "active",
  is_enabled: true, is_default: false, priority: 100, notes: "",
};

const emptyProvider: Partial<Provider> = {
  code: "", name: "", base_url: "", api_key_secret_name: "", is_enabled: true,
};

const categories = ["chat","reasoning","coding","image","audio","embedding","moderation","realtime"];
const statuses = ["active","preview","experimental","deprecated","disabled"];

function AiModelsPage() {
  const router = useRouter();
  const listM = useServerFn(listAiModels);
  const saveM = useServerFn(upsertAiModel);
  const toggleM = useServerFn(toggleAiModel);
  const removeM = useServerFn(deleteAiModel);
  const listP = useServerFn(listAiProviders);
  const saveP = useServerFn(upsertAiProvider);
  const toggleP = useServerFn(toggleAiProvider);
  const removeP = useServerFn(deleteAiProvider);

  const [tab, setTab] = useState<"models" | "providers">("models");

  const { data: models = [], refetch: refetchM, isLoading: loadM } = useQuery({
    queryKey: ["ai-models"], queryFn: () => listM(),
  });
  const { data: providers = [], refetch: refetchP, isLoading: loadP } = useQuery({
    queryKey: ["ai-providers"], queryFn: () => listP(),
  });

  const [editingM, setEditingM] = useState<Partial<Model> | null>(null);
  const [editingP, setEditingP] = useState<Partial<Provider> | null>(null);
  const [modInput, setModInput] = useState("");
  const [capsInput, setCapsInput] = useState("");

  function openNewModel() {
    setEditingM({ ...emptyModel, provider_id: providers[0]?.id ?? "" });
    setModInput("text"); setCapsInput("");
  }
  function openEditModel(m: Model) {
    setEditingM(m);
    setModInput((m.modalities ?? []).join(", "));
    setCapsInput(Object.entries(m.caps ?? {}).filter(([,v]) => v).map(([k]) => k).join(", "));
  }
  async function submitModel(e: React.FormEvent) {
    e.preventDefault();
    if (!editingM?.provider_id || !editingM.model_id || !editingM.display_name) return;
    const modalities = modInput.split(",").map(s => s.trim()).filter(Boolean);
    const caps: Record<string, boolean> = {};
    capsInput.split(",").map(s => s.trim()).filter(Boolean).forEach(k => { caps[k] = true; });
    await saveM({ data: { ...(editingM as any), modalities, caps } });
    setEditingM(null); refetchM(); router.invalidate();
  }

  function openNewProvider() { setEditingP({ ...emptyProvider }); }
  async function submitProvider(e: React.FormEvent) {
    e.preventDefault();
    if (!editingP?.code || !editingP.name || !editingP.api_key_secret_name) return;
    await saveP({ data: editingP as any });
    setEditingP(null); refetchP(); router.invalidate();
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-violet-neon" /> نماذج الذكاء الاصطناعي
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            مزودو الذكاء الاصطناعي والنماذج — المفاتيح تُحفظ في أسرار Cloud وليست هنا.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-panel-border overflow-hidden">
            <button onClick={() => setTab("models")}
              className={`px-4 py-2 text-sm ${tab==="models" ? "bg-violet-neon/20 text-violet-neon" : "hover:bg-muted"}`}>
              النماذج ({models.length})
            </button>
            <button onClick={() => setTab("providers")}
              className={`px-4 py-2 text-sm ${tab==="providers" ? "bg-cyan-neon/20 text-cyan-neon" : "hover:bg-muted"}`}>
              المزودون ({providers.length})
            </button>
          </div>
          {tab === "models" ? (
            <button onClick={openNewModel} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> نموذج جديد
            </button>
          ) : (
            <button onClick={openNewProvider} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> مزود جديد
            </button>
          )}
        </div>
      </div>

      {tab === "providers" && (
        <div className="panel p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-xs text-muted-foreground">
                <tr className="text-right">
                  <th className="p-3">الكود</th>
                  <th className="p-3">الاسم</th>
                  <th className="p-3">Base URL</th>
                  <th className="p-3">اسم السر</th>
                  <th className="p-3">تفعيل</th>
                  <th className="p-3">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {loadP && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">جارٍ التحميل…</td></tr>}
                {!loadP && providers.length === 0 && (
                  <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">لا مزودين.</td></tr>
                )}
                {providers.map((p: Provider) => (
                  <tr key={p.id} className="border-t border-panel-border hover:bg-muted/20">
                    <td className="p-3 font-mono text-xs text-cyan-neon">{p.code}</td>
                    <td className="p-3 font-semibold flex items-center gap-2">
                      <Server className="w-4 h-4 text-cyan-neon" /> {p.name}
                    </td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">{p.base_url ?? "—"}</td>
                    <td className="p-3">
                      <span className="text-xs flex items-center gap-1 text-emerald-400">
                        <KeyRound className="w-3 h-3" /> {p.api_key_secret_name}
                      </span>
                    </td>
                    <td className="p-3">
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={p.is_enabled}
                          onChange={async (e) => { await toggleP({ data: { id: p.id, is_enabled: e.target.checked } }); refetchP(); }}
                          className="accent-cyan-neon" />
                        <span className="text-xs">{p.is_enabled ? "مفعّل" : "متوقّف"}</span>
                      </label>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditingP(p)} className="p-1.5 rounded hover:bg-muted"><Pencil className="w-4 h-4" /></button>
                        <button onClick={async () => { if (!confirm(`حذف ${p.name}؟`)) return; await removeP({ data: { id: p.id } }); refetchP(); }}
                          className="p-1.5 rounded hover:bg-red-500/20 text-red-400"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "models" && (
        <div className="panel p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-xs text-muted-foreground">
                <tr className="text-right">
                  <th className="p-3">المعرف</th>
                  <th className="p-3">النموذج</th>
                  <th className="p-3">المزود</th>
                  <th className="p-3">Gateway ID</th>
                  <th className="p-3">الفئة</th>
                  <th className="p-3">القدرات</th>
                  <th className="p-3">السياق / الأسعار</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3">تفعيل</th>
                  <th className="p-3">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {loadM && <tr><td colSpan={10} className="p-6 text-center text-muted-foreground">جارٍ التحميل…</td></tr>}
                {!loadM && models.length === 0 && (
                  <tr><td colSpan={10} className="p-6 text-center text-muted-foreground">لا نماذج بعد.</td></tr>
                )}
                {models.map((m: Model) => (
                  <tr key={m.id} className="border-t border-panel-border hover:bg-muted/20">
                    <td className="p-3 font-mono text-xs text-cyan-neon">{m.model_code}</td>
                    <td className="p-3">
                      <div className="font-semibold flex items-center gap-2">
                        {m.display_name || m.name}
                        {m.is_default && <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-neon/20 text-violet-neon">افتراضي</span>}
                      </div>
                      {m.description && <div className="text-xs text-muted-foreground max-w-[220px] truncate">{m.description}</div>}
                    </td>
                    <td className="p-3">
                      {m.provider ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded bg-cyan-neon/10 text-cyan-neon font-mono">{m.provider.code}</span>
                          {m.provider.is_enabled
                            ? <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            : <XCircle className="w-3 h-3 text-red-400" />}
                        </div>
                      ) : <span className="text-xs text-red-400 flex items-center gap-1"><ShieldAlert className="w-3 h-3" />بدون مزود</span>}
                    </td>
                    <td className="p-3 font-mono text-xs">{m.gateway_code ?? m.model_id}</td>
                    <td className="p-3"><span className="text-xs px-1.5 py-0.5 rounded bg-muted">{m.category}</span></td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {(m.modalities ?? []).map((c) => (
                          <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60">{c}</span>
                        ))}
                        {Object.entries(m.caps ?? {}).filter(([,v]) => v).map(([k]) => (
                          <span key={k} className="text-[10px] px-1.5 py-0.5 rounded bg-violet-neon/10 text-violet-neon flex items-center gap-1">
                            <Zap className="w-2.5 h-2.5" />{k}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {m.context_window ? <div>ctx: {m.context_window.toLocaleString()}</div> : null}
                      {m.input_price_per_million ? <div>${m.input_price_per_million}/M in</div> : null}
                      {m.output_price_per_million ? <div>${m.output_price_per_million}/M out</div> : null}
                      {!m.context_window && !m.input_price_per_million && !m.output_price_per_million && "—"}
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        m.status === "active" ? "bg-emerald-500/20 text-emerald-400" :
                        m.status === "preview" ? "bg-blue-500/20 text-blue-400" :
                        m.status === "experimental" ? "bg-amber-500/20 text-amber-400" :
                        "bg-muted text-muted-foreground"
                      }`}>{m.status}</span>
                    </td>
                    <td className="p-3">
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={m.is_enabled}
                          onChange={async (e) => { await toggleM({ data: { id: m.id, is_enabled: e.target.checked } }); refetchM(); }}
                          className="accent-cyan-neon" />
                      </label>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEditModel(m)} className="p-1.5 rounded hover:bg-muted"><Pencil className="w-4 h-4" /></button>
                        <button onClick={async () => { if (!confirm(`حذف ${m.display_name}؟`)) return; await removeM({ data: { id: m.id } }); refetchM(); }}
                          className="p-1.5 rounded hover:bg-red-500/20 text-red-400"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODEL MODAL */}
      {editingM && (
        <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4" onClick={() => setEditingM(null)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={submitModel}
            className="panel w-full max-w-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold">{editingM.id ? "تعديل نموذج" : "نموذج جديد"}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="المزود *">
                <select required className="input" value={editingM.provider_id ?? ""}
                  onChange={(e) => setEditingM({ ...editingM, provider_id: e.target.value })}>
                  <option value="">اختر مزوداً…</option>
                  {providers.map((p: Provider) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                  ))}
                </select>
              </Field>
              <Field label="الاسم المعروض *">
                <input required className="input" value={editingM.display_name ?? ""}
                  onChange={(e) => setEditingM({ ...editingM, display_name: e.target.value })} />
              </Field>
              <Field label="Model ID *">
                <input required className="input" placeholder="gemini-3-flash-preview"
                  value={editingM.model_id ?? ""}
                  onChange={(e) => setEditingM({ ...editingM, model_id: e.target.value })} />
              </Field>
              <Field label="Gateway Code">
                <input className="input" placeholder="google/gemini-3-flash-preview"
                  value={editingM.gateway_code ?? ""}
                  onChange={(e) => setEditingM({ ...editingM, gateway_code: e.target.value })} />
              </Field>
              <Field label="الفئة">
                <select className="input" value={editingM.category ?? "chat"}
                  onChange={(e) => setEditingM({ ...editingM, category: e.target.value })}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="الحالة">
                <select className="input" value={editingM.status ?? "active"}
                  onChange={(e) => setEditingM({ ...editingM, status: e.target.value })}>
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Context Window">
                <input type="number" className="input" value={editingM.context_window ?? ""}
                  onChange={(e) => setEditingM({ ...editingM, context_window: e.target.value ? Number(e.target.value) : null })} />
              </Field>
              <Field label="Max Output Tokens">
                <input type="number" className="input" value={editingM.max_output_tokens ?? ""}
                  onChange={(e) => setEditingM({ ...editingM, max_output_tokens: e.target.value ? Number(e.target.value) : null })} />
              </Field>
              <Field label="سعر الإدخال / مليون توكن">
                <input type="number" step="0.000001" className="input" value={editingM.input_price_per_million ?? ""}
                  onChange={(e) => setEditingM({ ...editingM, input_price_per_million: e.target.value ? Number(e.target.value) : null })} />
              </Field>
              <Field label="سعر الإخراج / مليون توكن">
                <input type="number" step="0.000001" className="input" value={editingM.output_price_per_million ?? ""}
                  onChange={(e) => setEditingM({ ...editingM, output_price_per_million: e.target.value ? Number(e.target.value) : null })} />
              </Field>
              <Field label="Modalities (مفصولة بفواصل)" className="md:col-span-2">
                <input className="input" placeholder="text, image, audio, video" value={modInput}
                  onChange={(e) => setModInput(e.target.value)} />
              </Field>
              <Field label="Capabilities (مفصولة بفواصل)" className="md:col-span-2">
                <input className="input" placeholder="tools, vision, reasoning, streaming, image_generation" value={capsInput}
                  onChange={(e) => setCapsInput(e.target.value)} />
              </Field>
              <Field label="الدور">
                <input className="input" value={editingM.role ?? ""}
                  onChange={(e) => setEditingM({ ...editingM, role: e.target.value })} />
              </Field>
              <Field label="المهمة">
                <input className="input" value={editingM.task ?? ""}
                  onChange={(e) => setEditingM({ ...editingM, task: e.target.value })} />
              </Field>
              <Field label="الأولوية">
                <input type="number" className="input" value={editingM.priority ?? 100}
                  onChange={(e) => setEditingM({ ...editingM, priority: Number(e.target.value) })} />
              </Field>
              <Field label="الوصف" className="md:col-span-2">
                <input className="input" value={editingM.description ?? ""}
                  onChange={(e) => setEditingM({ ...editingM, description: e.target.value })} />
              </Field>
              <Field label="القوانين / التعليمات" className="md:col-span-2">
                <textarea className="input min-h-[80px]" value={editingM.rules ?? ""}
                  onChange={(e) => setEditingM({ ...editingM, rules: e.target.value })} />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editingM.is_enabled ?? true}
                  onChange={(e) => setEditingM({ ...editingM, is_enabled: e.target.checked })} />
                مفعّل
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editingM.is_default ?? false}
                  onChange={(e) => setEditingM({ ...editingM, is_default: e.target.checked })} />
                افتراضي (للمزود)
              </label>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-2 p-3 rounded bg-emerald-500/10 border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              المفتاح السري يُقرأ من المزود ({providers.find((p: Provider) => p.id === editingM.provider_id)?.api_key_secret_name || "—"}) ولا يُخزَّن هنا.
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditingM(null)} className="px-4 py-2 rounded bg-muted text-sm">إلغاء</button>
              <button type="submit" className="btn-primary">حفظ</button>
            </div>
          </form>
        </div>
      )}

      {/* PROVIDER MODAL */}
      {editingP && (
        <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4" onClick={() => setEditingP(null)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={submitProvider}
            className="panel w-full max-w-lg p-6 space-y-4">
            <h2 className="text-lg font-bold">{editingP.id ? "تعديل مزود" : "مزود جديد"}</h2>
            <Field label="الكود * (فريد)">
              <input required className="input" placeholder="anthropic" value={editingP.code ?? ""}
                onChange={(e) => setEditingP({ ...editingP, code: e.target.value })} />
            </Field>
            <Field label="الاسم *">
              <input required className="input" placeholder="Anthropic Claude" value={editingP.name ?? ""}
                onChange={(e) => setEditingP({ ...editingP, name: e.target.value })} />
            </Field>
            <Field label="Base URL">
              <input className="input" placeholder="https://api.anthropic.com/v1" value={editingP.base_url ?? ""}
                onChange={(e) => setEditingP({ ...editingP, base_url: e.target.value })} />
            </Field>
            <Field label="اسم السر * (Secret Name)">
              <input required className="input" placeholder="ANTHROPIC_API_KEY" value={editingP.api_key_secret_name ?? ""}
                onChange={(e) => setEditingP({ ...editingP, api_key_secret_name: e.target.value })} />
            </Field>
            <div className="text-xs text-muted-foreground p-3 rounded bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              أضف قيمة السر من إعدادات Cloud → الأسرار (لن يتم تخزينه في قاعدة البيانات).
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editingP.is_enabled ?? true}
                onChange={(e) => setEditingP({ ...editingP, is_enabled: e.target.checked })} />
              مفعّل
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditingP(null)} className="px-4 py-2 rounded bg-muted text-sm">إلغاء</button>
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
