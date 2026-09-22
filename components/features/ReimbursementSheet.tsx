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

const inputCls =
  "h-11 w-full rounded-[10px] border border-[#EBEBEB] bg-white px-3.5 text-[15px] text-[#1A1A1A] placeholder:text-[#A8A8A8] focus:border-[#2C6CFF] focus:outline-none focus:ring-[3px] focus:ring-[#2C6CFF]/12";

interface ReimbursementSheetProps {
  isOpen: boolean;
  onClose: () => void;
  expenseId: string;
  personName: string;
  totalAmount: number;
  onChanged: () => void; // refresca los totales en la pantalla que abrió el sheet
}

export function ReimbursementSheet({ isOpen, onClose, expenseId, personName, totalAmount, onChanged }: ReimbursementSheetProps) {
  const [history, setHistory] = useState<Reimbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayYMD());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setHistory(await fetchReimbursementsForExpense(expenseId));
    } finally {
      setLoading(false);
    }
  }, [expenseId]);

  useEffect(() => {
    if (isOpen) {
      load();
      setAmount("");
      setDate(todayYMD());
      setNote("");
      setError("");
    }
  }, [isOpen, load]);

  const totalPaid = history.reduce((sum, r) => sum + r.amount, 0);
  const remaining = Math.max(totalAmount - totalPaid, 0);

  async function handleAdd() {
    const parsedAmount = parseFloat(amount);
    if (!(parsedAmount > 0) || !date) {
      setError("Revisa la fecha y el monto");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await insertReimbursement({ expense_id: expenseId, amount: parsedAmount, date, note: note.trim() || null });
      setAmount("");
      setNote("");
      await load();
      await revalidateFinanceData();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteReimbursementById(id);
      await load();
      await revalidateFinanceData();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    }
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={`Reembolsos de ${personName}`}>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between rounded-xl bg-[#F7F7F5] px-4 py-3">
          <div>
            <span className="text-[11px] font-medium uppercase text-[#A8A8A8]">Pagado</span>
            <p className="font-mono text-[16px] font-medium text-[#00A878]">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-medium uppercase text-[#A8A8A8]">Falta</span>
            <p className="font-mono text-[16px] font-medium text-[#1A1A1A]">{formatCurrency(remaining)}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-[13px] font-medium text-[#1A1A1A]">Registrar pago recibido</span>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="decimal"
              placeholder="$0"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              className={`${inputCls} font-mono flex-1`}
            />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${inputCls} w-[150px]`} />
          </div>
          <input type="text" placeholder="Nota (opcional)" value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
          {error && <p className="text-[13px] text-[#EF4444]">{error}</p>}
          <button
            type="button"
            onClick={handleAdd}
            disabled={saving}
            className="flex h-11 w-full items-center justify-center rounded-xl bg-[#2C6CFF] text-[15px] font-medium text-white disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Registrar pago"}
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-[#1A1A1A]">Historial</span>
          {loading ? (
            <div className="flex h-16 items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#2C6CFF] border-t-transparent" />
            </div>
          ) : history.length === 0 ? (
            <p className="py-4 text-center text-[13px] text-[#A8A8A8]">Sin pagos registrados aún</p>
          ) : (
            history.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl bg-white px-3.5 py-2.5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <div>
                  <p className="font-mono text-[14px] font-medium text-[#1A1A1A]">{formatCurrency(r.amount)}</p>
                  <p className="text-[12px] text-[#A8A8A8]">{formatShort(r.date)}{r.note ? ` · ${r.note}` : ""}</p>
                </div>
                <button type="button" onClick={() => handleDelete(r.id)} className="text-[12px] font-medium text-[#EF4444]">
                  Eliminar
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
