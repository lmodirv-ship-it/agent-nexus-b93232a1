import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function PageHeader({
  icon: Icon, title, subtitle, hex = "#22d3ee", actions,
}: { icon: LucideIcon; title: string; subtitle?: string; hex?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl grid place-items-center"
             style={{
               background: `radial-gradient(circle at 30% 30%, ${hex}66, ${hex}11)`,
               border: `1px solid ${hex}66`,
               boxShadow: `0 0 22px ${hex}66, inset 0 0 12px ${hex}33`,
             }}>
          <Icon className="w-5 h-5" style={{ color: hex, filter: `drop-shadow(0 0 6px ${hex})` }} />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-black">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function NeonButton({
  onClick, hex = "#22d3ee", icon: Icon, children,
}: { onClick?: () => void; hex?: string; icon?: LucideIcon; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition hover:-translate-y-0.5"
      style={{
        background: `linear-gradient(135deg, ${hex}33, ${hex}11)`,
        border: `1px solid ${hex}55`,
        color: hex,
        boxShadow: `0 0 18px ${hex}33`,
      }}>
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
}

export function StatusPill({ label, hex }: { label: string; hex: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full w-fit"
          style={{ background: `${hex}18`, color: hex, border: `1px solid ${hex}55` }}>
      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: hex, boxShadow: `0 0 6px ${hex}` }} />
      {label}
    </span>
  );
}
