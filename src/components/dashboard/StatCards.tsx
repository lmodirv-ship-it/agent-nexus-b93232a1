import { Globe, Users, Database, Cloud, ShoppingCart, DollarSign } from "lucide-react";

interface Stats {
  activeSites: number; totalUsers: number; databases: number;
  storageTb: number; storageMaxTb: number; ordersToday: number; revenueToday: number;
}

const items = (s: Stats) => [
  { icon: Globe, label: "المواقع النشطة", value: s.activeSites.toString(), hint: "+3 هذا الشهر", hex: "#22d3ee" },
  { icon: Users, label: "إجمالي المستخدمين", value: s.totalUsers.toLocaleString("en-US"), hint: "+2,451 هذا الأسبوع", hex: "#a78bfa" },
  { icon: Database, label: "قواعد البيانات", value: s.databases.toString(), hint: "كل المواقع متصلة", hex: "#38bdf8" },
  { icon: Cloud, label: "التخزين المستخدم", value: `${s.storageTb} TB`, hint: `من أصل ${s.storageMaxTb} TB`, hex: "#22d3ee" },
  { icon: ShoppingCart, label: "الطلبات اليوم", value: s.ordersToday.toLocaleString("en-US"), hint: "+18.7%", hex: "#f472b6" },
  { icon: DollarSign, label: "الأرباح اليوم", value: `${s.revenueToday.toLocaleString("en-US")} DH`, hint: "+22.5%", hex: "#34d399" },
];

export function StatCards({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {items(stats).map((it) => {
        const Icon = it.icon;
        return (
          <div key={it.label}
               className="relative overflow-hidden rounded-2xl p-5 backdrop-blur-md transition hover:-translate-y-0.5"
               style={{
                 background: "linear-gradient(180deg, rgba(15,23,42,0.9), rgba(2,6,23,0.85))",
                 border: `1px solid ${it.hex}22`,
                 boxShadow: `0 0 0 1px ${it.hex}0d, 0 12px 40px -20px ${it.hex}55`,
               }}>
            <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full opacity-40 blur-2xl"
                 style={{ background: it.hex }} />
            <div className="relative flex items-start justify-between mb-4">
              <div className="text-[11px] text-slate-400 font-medium">{it.label}</div>
              <div className="w-11 h-11 rounded-xl grid place-items-center"
                   style={{
                     background: `radial-gradient(circle at 30% 30%, ${it.hex}55, ${it.hex}11)`,
                     border: `1px solid ${it.hex}66`,
                     boxShadow: `0 0 18px ${it.hex}66, inset 0 0 10px ${it.hex}33`,
                   }}>
                <Icon className="w-5 h-5" style={{ color: it.hex, filter: `drop-shadow(0 0 6px ${it.hex})` }} />
              </div>
            </div>
            <div className="relative">
              <div className="text-3xl font-display font-black tracking-tight text-white">{it.value}</div>
              <div className="text-[11px] mt-1" style={{ color: it.hex }}>{it.hint}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
