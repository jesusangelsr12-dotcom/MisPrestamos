"use client";

import { formatCurrency } from "@/lib/utils/finance";
import type { CategoryBudgetRow } from "@/lib/hooks/useBudget";

function getProgressColor(pct: number): string {
  if (pct <= 75) return "#2C6CFF";
  if (pct <= 100) return "#F59E0B";
  return "#EF4444";
}

interface BudgetRowProps {
  row: CategoryBudgetRow;
  onTap: () => void;
}

export function BudgetRow({ row, onTap }: BudgetRowProps) {
  const pct = row.assigned > 0 ? Math.min((row.spent / row.assigned) * 100, 100) : 0;
  const overBudget = row.assigned > 0 && row.spent > row.assigned;

  return (
    <button type="button" onClick={onTap} className="flex w-full flex-col gap-2 rounded-2xl bg-white px-4 py-3.5 text-left" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <div className="flex items-center justify-between">
        <span className="text-[14px] font-medium text-[#1A1A1A]">{row.category.name}</span>
        <span className="font-mono text-[13px] text-[#6B6B6B]">
          {formatCurrency(row.spent)}
          {row.assigned > 0 && <span className="text-[#A8A8A8]"> / {formatCurrency(row.assigned)}</span>}
        </span>
      </div>

      {row.assigned > 0 ? (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E8E8E5]">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: getProgressColor(pct) }} />
        </div>
      ) : (
        <span className="text-[12px] text-[#A8A8A8]">Sin presupuesto asignado — toca para agregarlo</span>
      )}

      {overBudget && (
        <span className="text-[12px] font-medium text-[#EF4444]">
          Excedido por {formatCurrency(row.spent - row.assigned)}
        </span>
      )}
    </button>
  );
}
