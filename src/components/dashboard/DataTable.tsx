import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  width?: string;
  sortValue?: (row: T) => string | number | null | undefined;
}

export function DataTable<T extends { id: string }>({
  rows, columns, onRowClick, initialSort,
}: {
  rows: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  initialSort?: { key: string; dir: "asc" | "desc" };
}) {
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(initialSort ?? null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const va = col.sortValue!(a);
      const vb = col.sortValue!(b);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  }, [rows, sort, columns]);

  function toggleSort(key: string) {
    setSort((s) => {
      if (!s || s.key !== key) return { key, dir: "desc" };
      if (s.dir === "desc") return { key, dir: "asc" };
      return null;
    });
  }

  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-right text-[11px] uppercase tracking-wider text-muted-foreground/80 bg-black/30">
              {columns.map((c) => {
                const sortable = !!c.sortValue;
                const active = sort?.key === c.key;
                return (
                  <th key={c.key} className="px-4 py-3 font-semibold" style={{ width: c.width }}>
                    {sortable ? (
                      <button onClick={() => toggleSort(c.key)}
                              className={`inline-flex items-center gap-1 hover:text-cyan-neon transition ${active ? "text-cyan-neon" : ""}`}>
                        {c.header}
                        {active
                          ? (sort!.dir === "desc" ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />)
                          : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                      </button>
                    ) : c.header}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => (
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
            {sorted.length === 0 && (
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
