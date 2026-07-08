import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { generateText } from "ai";
import type { Database } from "@/integrations/supabase/types";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

function db() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

const CYCLE_NAMES = ["البحث", "التحليل", "التخطيط", "التنفيذ", "التحقق", "التقرير"];

// Small demo scale: 3 general managers → 2 managers each → 2 employees each = 21 agents across 3 cycles.
const SCALE = {
  small: { gm: 3, mgr: 2, emp: 2, cycles: 3 },
  full: { gm: 10, mgr: 5, emp: 3, cycles: 6 },
};

async function callAgent(model: ReturnType<ReturnType<typeof createLovableAiGatewayProvider>>, role: string, prompt: string) {
  try {
    const { text } = await generateText({
      model,
      system: `أنت وكيل ذكي متخصص. دورك: ${role}. أجب بالعربية بشكل موجز جداً (سطران كحد أقصى) ومركز على المطلوب.`,
      prompt,
    });
    return text;
  } catch (e) {
    return `تعذر تنفيذ المهمة: ${(e as Error).message}`;
  }
}

export const startAgentSession = createServerFn({ method: "POST" })
  .inputValidator((d: { goal: string; scale?: "small" | "full" }) => d)
  .handler(async ({ data }) => {
    const supabase = db();
    const scale = data.scale === "full" ? "full" : "small";
    const cfg = SCALE[scale];

    const { data: session, error } = await supabase
      .from("agent_sessions")
      .insert({ goal: data.goal, scale, total_cycles: cfg.cycles, status: "running" })
      .select()
      .single();
    if (error || !session) throw new Error(error?.message || "session create failed");

    // Fire-and-forget: run orchestrator in background
    void runOrchestrator(session.id, data.goal, scale).catch((e) => {
      console.error("orchestrator failed", e);
    });

    return { sessionId: session.id };
  });

async function runOrchestrator(sessionId: string, goal: string, scale: "small" | "full") {
  const supabase = db();
  const key = process.env.LOVABLE_API_KEY;
  if (!key) {
    await supabase.from("agent_sessions").update({ status: "failed", result_summary: "LOVABLE_API_KEY مفقود" }).eq("id", sessionId);
    return;
  }
  const gateway = createLovableAiGatewayProvider(key);
  const model = gateway("google/gemini-3-flash-preview");
  const cfg = SCALE[scale];

  const collected: string[] = [];

  for (let cycle = 1; cycle <= cfg.cycles; cycle++) {
    const cycleName = CYCLE_NAMES[cycle - 1] ?? `الجولة ${cycle}`;
    await supabase.from("agent_sessions").update({ current_cycle: cycle }).eq("id", sessionId);

    const gmPromises = Array.from({ length: cfg.gm }).map(async (_, gi) => {
      const gmRole = `مدير عام #${gi + 1} — جولة ${cycleName}`;
      const { data: gmTask } = await supabase.from("agent_tasks").insert({
        session_id: sessionId, cycle, level: "general_manager",
        role: gmRole, status: "working",
        input: `الهدف: ${goal}\nمرحلة: ${cycleName}\nقسّم المهمة على ${cfg.mgr} مدراء.`,
      }).select().single();

      const gmOutput = await callAgent(model, gmRole, `الهدف: ${goal}\nالمرحلة: ${cycleName}\nحدّد ${cfg.mgr} توجيهات فرعية.`);
      await supabase.from("agent_tasks").update({ output: gmOutput, status: "done", completed_at: new Date().toISOString() }).eq("id", gmTask!.id);

      const mgrPromises = Array.from({ length: cfg.mgr }).map(async (_, mi) => {
        const mgrRole = `مدير #${gi + 1}.${mi + 1}`;
        const { data: mgrTask } = await supabase.from("agent_tasks").insert({
          session_id: sessionId, parent_id: gmTask!.id, cycle, level: "manager",
          role: mgrRole, status: "working", input: gmOutput,
        }).select().single();

        const mgrOutput = await callAgent(model, mgrRole, `توجيهات المدير العام:\n${gmOutput}\nأشرف على ${cfg.emp} موظفين وحدد مهامهم.`);
        await supabase.from("agent_tasks").update({ output: mgrOutput, status: "done", completed_at: new Date().toISOString() }).eq("id", mgrTask!.id);

        const empPromises = Array.from({ length: cfg.emp }).map(async (_, ei) => {
          const empRole = `موظف ${gi + 1}.${mi + 1}.${ei + 1}`;
          const { data: empTask } = await supabase.from("agent_tasks").insert({
            session_id: sessionId, parent_id: mgrTask!.id, cycle, level: "employee",
            role: empRole, status: "working", input: mgrOutput,
          }).select().single();

          const empOutput = await callAgent(model, empRole, `المهمة: ${mgrOutput}\nنفّذ خطوة عملية واحدة وأعطِ الناتج.`);
          await supabase.from("agent_tasks").update({ output: empOutput, status: "done", completed_at: new Date().toISOString() }).eq("id", empTask!.id);
          return empOutput;
        });
        const empResults = await Promise.all(empPromises);
        return `${mgrRole}: ${empResults.length} نتائج`;
      });
      await Promise.all(mgrPromises);
      return gmOutput;
    });
    const cycleResults = await Promise.all(gmPromises);
    collected.push(`## ${cycleName}\n${cycleResults.join("\n")}`);
  }

  // Final summary
  const summary = await callAgent(model, "منسق نهائي",
    `الهدف الأصلي: ${goal}\n\nنتائج الجولات:\n${collected.join("\n\n")}\n\nقدّم ملخصاً تنفيذياً موجزاً (5 نقاط).`);

  await supabase.from("agent_sessions").update({
    status: "completed",
    result_summary: summary,
    completed_at: new Date().toISOString(),
  }).eq("id", sessionId);
}
