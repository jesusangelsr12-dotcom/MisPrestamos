"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { LoanGiven, LoanReceived } from "@/types";
import type { LoanType } from "@/lib/supabase/loans";
import { PaymentHistorySheet } from "@/components/features/PaymentHistorySheet";
import { PaymentModal } from "@/components/features/PaymentModal";

interface LoanCardProps {
  loan: LoanGiven | LoanReceived;
  type: LoanType;
  paidReal?: number;
  onMarkPaid: (id: string, type: LoanType, amount: number, monthsCovered: number) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string, type: LoanType) => void;
}

function getProgressColor(pct: number): string {
  if (pct <= 40) return "#2C6CFF";
  if (pct <= 75) return "#F59E0B";
  return "#00A878";
}

function formatCurrency(n: number): string {
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function getPersonName(loan: LoanGiven | LoanReceived, type: LoanType): string {
  if (type === "given") return (loan as LoanGiven).borrower_name;
  return (loan as LoanReceived).lender_name;
}

export function LoanCard({ loan, type, paidReal, onMarkPaid, onEdit, onDelete }: LoanCardProps) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const pct = loan.total_months > 0 ? (loan.months_paid / loan.total_months) * 100 : 0;
  const isComplete = loan.months_paid >= loan.total_months;
  const remainingMonths = loan.total_months - loan.months_paid;
  const paidDisplay = paidReal !== undefined ? paidReal : loan.monthly_payment * loan.months_paid;
  const estimatedRemaining = loan.monthly_payment * remainingMonths;
  const progressColor = getProgressColor(pct);
  const personName = getPersonName(loan, type);
  const entityType = type === "given" ? "loan_given" as const : "loan_received" as const;
  const isFinalMonth = loan.months_paid === loan.total_months - 1;

  return (
    <>
      <div className="rounded-2xl bg-white p-[18px]" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-[15px] font-semibold text-[#1A1A1A]">{personName}</p>
            <p className="mt-0.5 text-[12px] text-[#A8A8A8]">Total: {formatCurrency(loan.amount)}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <p className="font-mono text-[26px] font-medium leading-tight text-[#1A1A1A]">{formatCurrency(loan.monthly_payment)}</p>
            {isComplete ? (
              <span className="rounded-full bg-[#E8E8E5] px-2.5 py-0.5 text-[11px] font-semibold text-[#6B6B6B]">Completado</span>
            ) : (
              <span className="rounded-full bg-[#E6F7F3] px-2.5 py-0.5 text-[11px] font-semibold text-[#00A878]">Al corriente</span>
            )}
          </div>
        </div>

        <div className="mt-4">
          <div className="h-1 w-full overflow-hidden rounded-full bg-[#E8E8E5]">
            <motion.div className="h-full rounded-full" style={{ backgroundColor: progressColor }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: "easeOut" }} />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-[#A8A8A8]">Pagado </span>
            <span className="font-mono text-[13px] font-medium text-[#1A1A1A]">{formatCurrency(paidDisplay)}</span>
          </div>
          <div>
            <span className="text-[11px] text-[#A8A8A8]">Est. restante </span>
            <span className="font-mono text-[13px] font-medium text-[#1A1A1A]">{formatCurrency(estimatedRemaining)}</span>
          </div>
          <div>
            <span className="text-[11px] text-[#A8A8A8]">Meses </span>
            <span className="font-mono text-[13px] font-medium text-[#1A1A1A]">{loan.months_paid}/{loan.total_months}</span>
          </div>
        </div>

        {loan.notes && (
          <button type="button" onClick={() => setNotesOpen((o) => !o)} className="mt-3 w-full text-left">
            <p className="text-[12px] font-medium text-[#2C6CFF]">{notesOpen ? "▾ Ocultar nota" : "▸ Ver nota"}</p>
            {notesOpen && <p className="mt-1 text-[13px] text-[#1A1A1A]">{loan.notes}</p>}
          </button>
        )}

        <div className="mt-3">
          {isComplete ? (
            <div className="flex h-11 items-center justify-center rounded-xl bg-[#E6F7F3] text-[15px] font-medium text-[#00A878]">✓ Completado</div>
          ) : (
            <motion.button type="button" onClick={() => setPaymentOpen(true)} whileTap={{ scale: 0.97 }} className="flex h-11 w-full items-center justify-center rounded-xl border border-[#2C6CFF] text-[15px] font-medium text-[#2C6CFF]">
              Marcar mes pagado
            </motion.button>
          )}
        </div>

        {loan.months_paid > 0 && (
          <button type="button" onClick={() => setHistoryOpen(true)} className="mt-2 w-full text-center text-[13px] font-medium text-[#2C6CFF]">Ver pagos</button>
        )}

        <div className="mt-2 flex gap-2">
          <button type="button" onClick={() => onEdit(loan.id)} className="flex h-9 flex-1 items-center justify-center rounded-[10px] text-[13px] font-medium text-[#6B6B6B]">Editar</button>
          <button type="button" onClick={() => onDelete(loan.id, type)} className="flex h-9 flex-1 items-center justify-center rounded-[10px] text-[13px] font-medium text-[#EF4444]">Eliminar</button>
        </div>
      </div>

      <PaymentModal
        isOpen={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        onConfirm={(amount, monthsCovered) => {
          setPaymentOpen(false);
          onMarkPaid(loan.id, type, amount, monthsCovered);
        }}
        monthlyAmount={loan.monthly_payment}
        remainingMonths={remainingMonths}
        currentMonth={loan.months_paid + 1}
        totalMonths={loan.total_months}
        isFinalMonth={isFinalMonth}
        finalPaymentAmount={null}
      />

      <PaymentHistorySheet
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        entityId={loan.id}
        entityName={personName}
        entityType={entityType}
      />
    </>
  );
}
