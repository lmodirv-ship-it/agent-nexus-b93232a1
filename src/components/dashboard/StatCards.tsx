import { Globe, Users, Database, Cloud, ShoppingCart, DollarSign } from "lucide-react";

interface Stats {
  activeSites: number; totalUsers: number; databases: number;
  storageTb: number; storageMaxTb: number; ordersToday: number; revenueToday: number;
}

const items = (s: Stats) => [
  { icon: Globe, label: "المواقع النشطة", value: s.activeSites.toString(), hint: "+3 هذا الشهر", color: "cyan" },
  { icon: Users, label: "إجمالي المستخدمين", value: s.totalUsers.toLocaleString("en-US"), hint: "+2,451 هذا الأسبوع", color: "violet" },
  { icon: Database, label: "قواعد البيانات", value: s.databases.toString(), hint: "كل المواقع متصلة", color: "cyan" },
  { icon: Cloud, label: "التخزين المستخدم", value: `${s.storageTb} TB`, hint: `من أصل ${s.storageMaxTb} TB`, color: "cyan" },
  { icon: ShoppingCart, label: "الطلبات اليوم", value: s.ordersToday.toLocaleString("en-US"), hint: "+18.7%", color: "pink" },
  { icon: DollarSign, label: "الأرباح اليوم", value: `${s.revenueToday.toLocaleString("en-US")} DH`, hint: "+22.5%", color: "emerald" },
];

const colorMap: Record<string, string> = {
  cyan: "from-cyan-neon/30 to-cyan-neon/5 text-cyan-neon border-cyan-neon/30",
  violet: "from-violet-neon/30 to-violet-neon/5 text-violet-neon border-violet-neon/30",
  pink: "from-pink-neon/30 to-pink-neon/5 text-pink-neon border-pink-neon/30",
  emerald: "from-emerald-neon/30 to-emerald-neon/5 text-emerald-neon border-emerald-neon/30",
};

export function StatCards({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {items(stats).map((it) => {
        const Icon = it.icon;
        return (
          <div key={it.label} className="panel p-4 relative overflow-hidden">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[it.color]} border grid place-items-center mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-xs text-muted-foreground mb-1">{it.label}</div>
            <div className="text-2xl font-display font-bold">{it.value}</div>
            <div className="text-[11px] text-emerald-neon mt-1">{it.hint}</div>
          </div>
        );
      })}
    </div>
  );
}
