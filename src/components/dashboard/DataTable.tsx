import type { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  width?: string;
}

export function DataTable<T extends { id: string }>({
  rows, columns, onRowClick,
}: { rows: T[]; columns: Column<T>[]; onRowClick?: (row: T) => void }) {
  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-right text-[11px] uppercase tracking-wider text-muted-foreground/80 bg-black/30">
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-3 font-semibold" style={{ width: c.width }}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id}
                  onClick={() => onRowClick?.(r)}
                  className={`border-t border-white/5 transition ${
                    onRowClick ? "cursor-pointer hover:bg-white/[0.03]" : ""
                  } ${i % 2 ? "bg-white/[0.015]" : ""}`}>
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3 align-middle">{c.cell(r)}</td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                  لا توجد بيانات مطابقة
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
