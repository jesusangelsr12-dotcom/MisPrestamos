"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { MSIExpenseWithCard } from "@/types";
import { OwnerTag } from "@/components/features/OwnerTag";
import { PaymentHistorySheet } from "@/components/features/PaymentHistorySheet";

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
  const [historyOpen, setHistoryOpen] = useState(false);
  const { card } = expense;
  const pct = expense.months > 0 ? (expense.months_paid / expense.months) * 100 : 0;
  const isComplete = expense.months_paid >= expense.months;
  const remaining = expense.monthly_amount * (expense.months - expense.months_paid);
  const paid = expense.monthly_amount * expense.months_paid;
  const progressColor = getProgressColor(pct);

  return (
    <>
      <div
        className="rounded-2xl bg-white p-[18px]"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
      >
        {/* Header row */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-[15px] font-semibold text-[#1A1A1A]">{expense.description}</p>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="block h-2 w-2 rounded-full" style={{ backgroundColor: card.color }} />
              <span className="text-[12px] text-[#A8A8A8]">{card.bank} · {card.name}</span>
            </div>
            {expense.owner === "other" && expense.owner_name && (
              <div className="mt-1.5">
                <OwnerTag name={expense.owner_name} />
              </div>
            )}
          </div>
          <p className="font-mono text-[26px] font-medium leading-tight text-[#1A1A1A]">
            {formatCurrency(expense.monthly_amount)}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="h-1 w-full overflow-hidden rounded-full bg-[#E8E8E5]">
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
        <div className="mt-3 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-[#A8A8A8]">Pagado </span>
            <span className="font-mono text-[13px] font-medium text-[#1A1A1A]">{formatCurrency(paid)}</span>
          </div>
          <div>
            <span className="text-[11px] text-[#A8A8A8]">Restante </span>
            <span className="font-mono text-[13px] font-medium text-[#1A1A1A]">{formatCurrency(remaining)}</span>
          </div>
          <div>
            <span className="text-[11px] text-[#A8A8A8]">Meses </span>
            <span className="font-mono text-[13px] font-medium text-[#1A1A1A]">{expense.months_paid}/{expense.months}</span>
          </div>
        </div>

        {/* Action button */}
        <div className="mt-3">
          {isComplete ? (
            <div className="flex h-11 items-center justify-center rounded-xl bg-[#E6F7F3] text-[15px] font-medium text-[#00A878]">
              ✓ Completado
            </div>
          ) : (
            <motion.button
              type="button"
              onClick={() => onMarkPaid(expense.id)}
              whileTap={{ scale: 0.97 }}
              className="flex h-11 w-full items-center justify-center rounded-xl border border-[#2C6CFF] text-[15px] font-medium text-[#2C6CFF]"
            >
              Marcar mes pagado
            </motion.button>
          )}
        </div>

        {/* Ver pagos */}
        {expense.months_paid > 0 && (
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="mt-2 w-full text-center text-[13px] font-medium text-[#2C6CFF]"
          >
            Ver pagos
          </button>
        )}

        {/* Edit / Delete */}
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={() => onEdit(expense.id)} className="flex h-9 flex-1 items-center justify-center rounded-[10px] text-[13px] font-medium text-[#6B6B6B]">Editar</button>
          <button type="button" onClick={() => onDelete(expense.id)} className="flex h-9 flex-1 items-center justify-center rounded-[10px] text-[13px] font-medium text-[#EF4444]">Eliminar</button>
        </div>
      </div>

      <PaymentHistorySheet
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        entityId={expense.id}
        entityName={expense.description}
        entityType="msi"
      />
    </>
  );
}
