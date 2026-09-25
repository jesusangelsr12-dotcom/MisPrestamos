"use client";

import { useState, useEffect, useCallback } from "react";
import { BottomSheet } from "@/components/features/BottomSheet";
import { formatCurrency } from "@/lib/utils/finance";
import {
  fetchReimbursementsForExpense,
  insertReimbursement,
  deleteReimbursementById,
} from "@/lib/db/reimbursements";
import { revalidateFinanceData } from "@/lib/swr/finance";
import type { Reimbursement } from "@/types";

const todayYMD = () => new Date().toISOString().slice(0, 10);

function formatShort(dateYMD: string): string {
  const [y, m, d] = dateYMD.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

interface ReimbursementSheetProps {
  isOpen: boolean;
  onClose: () => void;
  expenseId: string;
  personId: string | null; // null = dueño del gasto completo
  personName: string;
  totalAmount: number; // lo que le toca pagar a esta persona (todo el gasto o su parte)
  msiMonths: number;
  onChanged: () => void; // refresca los totales en la pantalla que abrió el sheet
}

export function ReimbursementSheet({
  isOpen,
  onClose,
  expenseId,
  personId,
  personName,
  totalAmount,
  msiMonths,
  onChanged,
}: ReimbursementSheetProps) {
  const [history, setHistory] = useState<Reimbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingInstallment, setPendingInstallment] = useState<number | null>(null);
  const [confirmingInstallment, setConfirmingInstallment] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setHistory(await fetchReimbursementsForExpense(expenseId, personId));
    } finally {
      setLoading(false);
    }
  }, [expenseId, personId]);

  useEffect(() => {
    if (isOpen) {
      load();
      setConfirmingInstallment(null);
      setError("");
    }
  }, [isOpen, load]);

  const cuotaAmount = round2(totalAmount / msiMonths);
  const paidByInstallment = new Map(
    history.filter((r): r is Reimbursement & { installment_number: number } => r.installment_number !== null).map((r) => [r.installment_number, r])
  );
  const paidCount = paidByInstallment.size;
  const paidTotal = history.reduce((sum, r) => sum + r.amount, 0);
  const confirming = confirmingInstallment !== null ? paidByInstallment.get(confirmingInstallment) ?? null : null;

  async function handleMarkPaid(n: number) {
    setPendingInstallment(n);
    setError("");
    try {
      await insertReimbursement({ expense_id: expenseId, person_id: personId, installment_number: n, amount: cuotaAmount, date: todayYMD() });
      await load();
      await revalidateFinanceData();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setPendingInstallment(null);
    }
  }

  async function handleUnmark() {
    if (!confirming) return;
    setConfirmingInstallment(null);
    setError("");
    try {
      await deleteReimbursementById(confirming.id);
      await load();
      await revalidateFinanceData();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    }
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={`Cuotas de ${personName}`}>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between rounded-xl bg-[#F7F7F5] px-4 py-3">
          <div>
            <span className="text-[11px] font-medium uppercase text-[#A8A8A8]">Pagado</span>
            <p className="font-mono text-[16px] font-medium text-[#00A878]">
              {paidCount}/{msiMonths} <span className="text-[13px] font-normal text-[#6B6B6B]">· {formatCurrency(paidTotal)}</span>
            </p>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-medium uppercase text-[#A8A8A8]">Cuota mensual</span>
            <p className="font-mono text-[16px] font-medium text-[#1A1A1A]">{formatCurrency(cuotaAmount)}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex h-24 items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#2C6CFF] border-t-transparent" />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-medium text-[#1A1A1A]">Toca una mensualidad para marcarla como pagada</span>
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: msiMonths }, (_, i) => i + 1).map((n) => {
                const paid = paidByInstallment.get(n);
                const isPending = pendingInstallment === n;
                return (
                  <button
                    key={n}
                    type="button"
                    disabled={isPending}
                    onClick={() => (paid ? setConfirmingInstallment(n) : handleMarkPaid(n))}
                    className={`flex aspect-square min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl text-[14px] font-medium transition-colors disabled:opacity-50 ${
                      paid ? "bg-[#00A878] text-white" : "border border-[#EBEBEB] bg-white text-[#6B6B6B]"
                    }`}
                  >
                    <span>{n}</span>
                    {paid && <span className="text-[10px] font-normal opacity-90">{formatShort(paid.date)}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {error && <p className="text-[13px] text-[#EF4444]">{error}</p>}

        {confirming && confirmingInstallment !== null && (
          <div className="flex flex-col gap-3 rounded-xl bg-[#F7F7F5] px-4 py-3.5">
            <p className="text-[13px] text-[#1A1A1A]">
              ¿Quitar el pago de la cuota {confirmingInstallment}, registrado el {formatShort(confirming.date)}?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmingInstallment(null)}
                className="flex h-10 flex-1 items-center justify-center rounded-[10px] bg-white text-[14px] font-medium text-[#1A1A1A]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleUnmark}
                className="flex h-10 flex-1 items-center justify-center rounded-[10px] bg-[#EF4444] text-[14px] font-medium text-white"
              >
                Quitar
              </button>
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
