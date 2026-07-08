import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Settings, Bell, Globe, Moon, Shield, Zap, Save } from "lucide-react";
import { PageHeader, NeonButton } from "@/components/dashboard/PageHeader";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "الإعدادات — SUPER ADMIN" }, { name: "description", content: "إعدادات النظام والتفضيلات." }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [state, setState] = useState({
    darkMode: true, arabic: true, notifs: true, autoScale: true, mfa: true, cronBackup: true,
    email: "superadmin@hub.com", timezone: "Africa/Casablanca", threshold: 80,
  });

  return (
    <div>
      <PageHeader icon={Settings} title="إعدادات النظام" hex="#38bdf8" subtitle="التحكم في كل خيار عام يخصّ المنصة"
        actions={<NeonButton hex="#22d3ee" icon={Save}>حفظ التغييرات</NeonButton>} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section icon={Moon} title="المظهر واللغة" hex="#a78bfa">
          <Toggle label="الوضع الداكن" checked={state.darkMode} onChange={(v) => setState({ ...state, darkMode: v })} />
          <Toggle label="واجهة عربية RTL" checked={state.arabic} onChange={(v) => setState({ ...state, arabic: v })} />
          <Field label="المنطقة الزمنية" value={state.timezone} onChange={(v) => setState({ ...state, timezone: v })} />
        </Section>

        <Section icon={Bell} title="التنبيهات" hex="#fbbf24">
          <Toggle label="تنبيهات الأخطاء الفورية" checked={state.notifs} onChange={(v) => setState({ ...state, notifs: v })} />
          <Field label="بريد التنبيه" value={state.email} onChange={(v) => setState({ ...state, email: v })} />
          <div className="text-[11px] text-muted-foreground">قناة Telegram/Slack تُهيَّأ من صفحة تكاملات مستقلة.</div>
        </Section>

        <Section icon={Shield} title="الأمان" hex="#fb7185">
          <Toggle label="مصادقة MFA للمدراء" checked={state.mfa} onChange={(v) => setState({ ...state, mfa: v })} />
          <Toggle label="نسخ احتياطي دوري تلقائي" checked={state.cronBackup} onChange={(v) => setState({ ...state, cronBackup: v })} />
        </Section>

        <Section icon={Zap} title="الأداء والتوسع" hex="#22d3ee">
          <Toggle label="التوسع التلقائي (Auto-Scaler)" checked={state.autoScale} onChange={(v) => setState({ ...state, autoScale: v })} />
          <div>
            <label className="text-xs text-slate-300 block mb-2">عتبة توسع CPU (%)</label>
            <input type="range" min={50} max={95} value={state.threshold} onChange={(e) => setState({ ...state, threshold: +e.target.value })} className="w-full accent-cyan-neon" />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>50%</span><span className="text-cyan-neon font-bold">{state.threshold}%</span><span>95%</span></div>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, hex, children }: any) {
  return (
    <div className="panel p-5 space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-white/5">
        <div className="w-9 h-9 rounded-lg grid place-items-center"
             style={{ background: `radial-gradient(circle at 30% 30%, ${hex}55, ${hex}11)`, border: `1px solid ${hex}55`, boxShadow: `0 0 10px ${hex}44` }}>
          <Icon className="w-4 h-4" style={{ color: hex }} />
        </div>
        <h3 className="font-bold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm text-slate-200">{label}</span>
      <button type="button" onClick={() => onChange(!checked)}
              className="relative w-11 h-6 rounded-full transition"
              style={{ background: checked ? "linear-gradient(90deg,#22d3ee,#a78bfa)" : "#334155", boxShadow: checked ? "0 0 12px #22d3ee66" : "none" }}>
        <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
              style={{ right: checked ? "2px" : "22px" }} />
      </button>
    </label>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs text-slate-300 block mb-1.5">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)}
             className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-neon/40" />
    </div>
  );
}
