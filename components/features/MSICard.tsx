"use client";

import { motion } from "framer-motion";
import type { MSIExpenseWithCard } from "@/types";
import { OwnerTag } from "@/components/features/OwnerTag";

interface MSICardProps {
  expense: MSIExpenseWithCard;
  onMarkPaid: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function getProgressColor(pct: number): string {
  if (pct <= 40) return "#2C6CFF";
  if (pct <= 75) return "#F59E0B";
  return "#00A878";
}

function formatCurrency(n: number): string {
  return n.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function MSICard({ expense, onMarkPaid, onEdit, onDelete }: MSICardProps) {
  const { card } = expense;
  const pct = expense.months > 0 ? (expense.months_paid / expense.months) * 100 : 0;
  const isComplete = expense.months_paid >= expense.months;
  const remaining = expense.monthly_amount * (expense.months - expense.months_paid);
  const paid = expense.monthly_amount * expense.months_paid;
  const progressColor = getProgressColor(pct);

  return (
    <div className="rounded-2xl bg-white px-4 py-4">
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[15px] font-semibold text-foreground">
            {expense.description}
          </p>
          <div className="mt-0.5 flex items-center gap-2">
            <span
              className="block h-2 w-2 rounded-full"
              style={{ backgroundColor: card.color }}
            />
            <span className="text-sm text-muted-foreground">
              {card.bank} · {card.name}
            </span>
          </div>
          {expense.owner === "other" && expense.owner_name && (
            <div className="mt-1.5">
              <OwnerTag name={expense.owner_name} />
            </div>
          )}
        </div>
        <p className="font-mono text-[26px] font-medium leading-tight text-foreground">
          {formatCurrency(expense.monthly_amount)}
        </p>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: progressColor }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Footer stats */}
      <div className="mt-3 flex items-center justify-between text-sm">
        <div>
          <span className="text-muted-foreground">Pagado </span>
          <span className="font-mono font-medium text-foreground">
            {formatCurrency(paid)}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Restante </span>
          <span className="font-mono font-medium text-foreground">
            {formatCurrency(remaining)}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Meses </span>
          <span className="font-mono font-medium text-foreground">
            {expense.months_paid}/{expense.months}
          </span>
        </div>
      </div>

      {/* Action button */}
      <div className="mt-3">
        {isComplete ? (
          <div className="flex h-11 items-center justify-center rounded-xl bg-[#00A878]/10 text-[15px] font-medium text-[#00A878]">
            ✓ Completado
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onMarkPaid(expense.id)}
            className="flex h-11 w-full items-center justify-center rounded-xl border border-accent text-[15px] font-medium text-accent"
          >
            Marcar mes pagado
          </button>
        )}
      </div>

      {/* Edit / Delete row */}
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => onEdit(expense.id)}
          className="flex h-9 flex-1 items-center justify-center rounded-lg text-sm text-muted-foreground"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => onDelete(expense.id)}
          className="flex h-9 flex-1 items-center justify-center rounded-lg text-sm text-red-500"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}
