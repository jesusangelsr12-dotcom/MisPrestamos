"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { LoanGiven, LoanReceived } from "@/types";
import type { LoanType } from "@/lib/supabase/loans";

interface LoanCardProps {
  loan: LoanGiven | LoanReceived;
  type: LoanType;
  onMarkPaid: (id: string, type: LoanType) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string, type: LoanType) => void;
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

function getPersonName(loan: LoanGiven | LoanReceived, type: LoanType): string {
  if (type === "given") return (loan as LoanGiven).borrower_name;
  return (loan as LoanReceived).lender_name;
}

export function LoanCard({ loan, type, onMarkPaid, onEdit, onDelete }: LoanCardProps) {
  const [notesOpen, setNotesOpen] = useState(false);

  const pct =
    loan.total_months > 0
      ? (loan.months_paid / loan.total_months) * 100
      : 0;
  const isComplete = loan.months_paid >= loan.total_months;
  const paid = loan.monthly_payment * loan.months_paid;
  const remaining = loan.monthly_payment * (loan.total_months - loan.months_paid);
  const progressColor = getProgressColor(pct);
  const personName = getPersonName(loan, type);

  return (
    <div className="rounded-2xl bg-white px-4 py-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[15px] font-semibold text-foreground">
            {personName}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Total: {formatCurrency(loan.amount)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <p className="font-mono text-[26px] font-medium leading-tight text-foreground">
            {formatCurrency(loan.monthly_payment)}
          </p>
          {isComplete ? (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              Completado
            </span>
          ) : (
            <span className="rounded-full bg-[#00A878]/10 px-2.5 py-0.5 text-xs font-medium text-[#00A878]">
              Al corriente
            </span>
          )}
        </div>
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
            {loan.months_paid}/{loan.total_months}
          </span>
        </div>
      </div>

      {/* Notes */}
      {loan.notes && (
        <button
          type="button"
          onClick={() => setNotesOpen((o) => !o)}
          className="mt-3 w-full text-left"
        >
          <p className="text-sm text-muted-foreground">
            {notesOpen ? "▾ Notas" : "▸ Notas"}
          </p>
          {notesOpen && (
            <p className="mt-1 text-sm text-foreground">{loan.notes}</p>
          )}
        </button>
      )}

      {/* Action button */}
      <div className="mt-3">
        {isComplete ? (
          <div className="flex h-11 items-center justify-center rounded-xl bg-[#00A878]/10 text-[15px] font-medium text-[#00A878]">
            ✓ Completado
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onMarkPaid(loan.id, type)}
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
          onClick={() => onEdit(loan.id)}
          className="flex h-9 flex-1 items-center justify-center rounded-lg text-sm text-muted-foreground"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => onDelete(loan.id, type)}
          className="flex h-9 flex-1 items-center justify-center rounded-lg text-sm text-red-500"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}
