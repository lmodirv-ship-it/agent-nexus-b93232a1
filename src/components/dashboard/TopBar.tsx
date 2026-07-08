import { Bell, Search, Sun, Maximize2 } from "lucide-react";

export function TopBar() {
  return (
    <header className="flex items-center justify-between gap-4 px-6 py-4">
      <div>
        <h1 className="text-2xl font-display font-bold">
          مرحباً بك في مركز التحكم الشامل <span className="text-amber-neon">👑</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          لوحة التحكم المركزية لإدارة جميع قواعد البيانات، المواقع، والتخزين
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            className="panel pr-9 pl-4 py-2 text-sm w-64 outline-none focus:ring-2 focus:ring-cyan-neon/40"
            placeholder="البحث في النظام..."
          />
        </div>
        <button className="panel w-10 h-10 grid place-items-center hover:glow-cyan transition"><Sun className="w-4 h-4" /></button>
        <button className="panel w-10 h-10 grid place-items-center relative hover:glow-violet transition">
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 bg-rose-neon text-[10px] text-background font-bold rounded-full w-5 h-5 grid place-items-center">8+</span>
        </button>
        <button className="panel w-10 h-10 grid place-items-center"><Maximize2 className="w-4 h-4" /></button>
      </div>
    </header>
  );
}
