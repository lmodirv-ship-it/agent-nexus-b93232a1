import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Sparkles, Send, Mic, Zap, Bot, Database, Shield, HardDrive, RotateCw } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";

export const Route = createFileRoute("/_authenticated/ai-command")({
  head: () => ({ meta: [{ title: "AI Command Center — SUPER ADMIN" }, { name: "description", content: "أوامر ذكية لإدارة المنصة بالكامل." }] }),
  component: AICommandPage,
});

interface Msg { id: string; role: "user" | "ai"; text: string; time: string; }

const QUICK = [
  { label: "أنشئ نسخة احتياطية الآن",       Icon: HardDrive, hex: "#22d3ee", prompt: "نفّذ نسخة احتياطية فورية لقاعدة الدماغ." },
  { label: "حلّل أداء قاعدة البيانات",       Icon: Database,  hex: "#38bdf8", prompt: "حلّل أداء جميع قواعد البيانات وأخبرني بالأبطأ." },
  { label: "افحص الحماية على كل المواقع",   Icon: Shield,    hex: "#fb7185", prompt: "افحص جدار الحماية على 127 موقع وأعطني تقريراً." },
  { label: "شغّل كل الوكلاء المتوقفة",       Icon: Bot,       hex: "#a78bfa", prompt: "شغّل كل الوكلاء المتوقفة الآن." },
];

const AI_REPLIES = [
  "تم استلام الأمر — أُنفّذ الآن عبر شبكة الوكلاء.",
  "المهمة موزّعة على 3 وكلاء متخصصين. النتائج ستظهر في السجل الحي.",
  "بدأت التنفيذ. سأخطرك عند الاكتمال.",
  "تم — الوكيل المسؤول أكمل المهمة بنجاح.",
];

function AICommandPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { id: "1", role: "ai", text: "أهلاً بك أيها المالك 👑 اطلب أي شيء وسأنسّق الوكلاء لتنفيذه.", time: "12:30:00" },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, thinking]);

  const send = (text: string) => {
    const t = text.trim(); if (!t) return;
    const now = new Date().toLocaleTimeString("ar-EG", { hour12: false });
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", text: t, time: now }]);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      const reply = AI_REPLIES[Math.floor(Math.random() * AI_REPLIES.length)];
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "ai", text: reply, time: new Date().toLocaleTimeString("ar-EG", { hour12: false }) }]);
      setThinking(false);
    }, 900);
  };

  return (
    <div>
      <PageHeader icon={Sparkles} title="AI Command Center" hex="#a78bfa" subtitle="حاور الذكاء الاصطناعي — أعطِ أوامرك وسيوزّعها على الوكلاء المناسبين." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* شات */}
        <div className="lg:col-span-2 panel p-0 flex flex-col h-[70vh]">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3">
            {messages.map((m) => (
              <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className="w-9 h-9 rounded-xl grid place-items-center shrink-0"
                     style={{
                       background: m.role === "ai"
                         ? "radial-gradient(circle at 30% 30%, #a78bfa55, #a78bfa11)"
                         : "radial-gradient(circle at 30% 30%, #22d3ee55, #22d3ee11)",
                       border: `1px solid ${m.role === "ai" ? "#a78bfa" : "#22d3ee"}55`,
                       boxShadow: `0 0 12px ${m.role === "ai" ? "#a78bfa" : "#22d3ee"}55`,
                     }}>
                  {m.role === "ai" ? <Sparkles className="w-4 h-4 text-violet-neon" /> : <span className="text-white text-xs font-bold">أنت</span>}
                </div>
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${m.role === "user" ? "bg-cyan-neon/10 border border-cyan-neon/30 text-white" : "bg-black/40 border border-violet-neon/20 text-slate-100"}`}>
                  <div>{m.text}</div>
                  <div className="text-[10px] text-muted-foreground mt-1 font-mono">{m.time}</div>
                </div>
              </div>
            ))}
            {thinking && (
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-xl grid place-items-center shrink-0"
                     style={{ background: "radial-gradient(circle at 30% 30%, #a78bfa55, #a78bfa11)", border: "1px solid #a78bfa55" }}>
                  <Sparkles className="w-4 h-4 text-violet-neon animate-pulse" />
                </div>
                <div className="rounded-2xl px-4 py-3 bg-black/40 border border-violet-neon/20 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-violet-neon animate-pulse" />
                  <span className="w-2 h-2 rounded-full bg-violet-neon animate-pulse" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-violet-neon animate-pulse" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-white/5 p-3 flex items-center gap-2">
            <button className="w-10 h-10 rounded-xl grid place-items-center border border-white/10 hover:border-rose-neon/50 text-slate-300 hover:text-rose-neon transition" title="أمر صوتي">
              <Mic className="w-4 h-4" />
            </button>
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send(input)}
                   placeholder="اكتب أمرك للـ AI..."
                   className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-neon/40" />
            <button onClick={() => send(input)} disabled={!input.trim()}
                    className="w-10 h-10 rounded-xl grid place-items-center disabled:opacity-40 transition"
                    style={{ background: "linear-gradient(135deg,#a78bfa33,#a78bfa11)", border: "1px solid #a78bfa55", color: "#a78bfa", boxShadow: "0 0 14px #a78bfa44" }}>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* أوامر سريعة */}
        <div className="panel p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-amber-neon" />
            <h3 className="font-bold">أوامر سريعة</h3>
          </div>
          <div className="space-y-2">
            {QUICK.map((q) => (
              <button key={q.label} onClick={() => send(q.prompt)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl text-right transition hover:-translate-y-0.5"
                      style={{ background: `linear-gradient(135deg,${q.hex}18,${q.hex}05)`, border: `1px solid ${q.hex}33` }}>
                <div className="w-9 h-9 rounded-lg grid place-items-center shrink-0"
                     style={{ background: `radial-gradient(circle at 30% 30%, ${q.hex}55, ${q.hex}11)`, border: `1px solid ${q.hex}55` }}>
                  <q.Icon className="w-4 h-4" style={{ color: q.hex }} />
                </div>
                <span className="text-sm text-slate-200">{q.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-6 p-4 rounded-xl border border-cyan-neon/20 bg-cyan-neon/5">
            <div className="flex items-center gap-2 mb-2">
              <RotateCw className="w-3.5 h-3.5 text-cyan-neon animate-spin" style={{ animationDuration: "3s" }} />
              <span className="text-xs font-semibold text-cyan-neon">حالة الوكلاء</span>
            </div>
            <div className="text-2xl font-black text-white">7/8</div>
            <div className="text-[11px] text-muted-foreground">وكيل نشط الآن</div>
          </div>
        </div>
      </div>
    </div>
  );
}
