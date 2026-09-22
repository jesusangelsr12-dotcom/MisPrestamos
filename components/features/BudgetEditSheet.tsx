"use client";

import { useState, useEffect } from "react";
import { BottomSheet } from "@/components/features/BottomSheet";

interface BudgetEditSheetProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName: string;
  currentAmount: number;
  onSave: (amount: number) => Promise<void>;
}

const inputCls =
  "h-12 w-full rounded-[10px] border border-[#EBEBEB] bg-white px-3.5 text-[15px] text-[#1A1A1A] placeholder:text-[#A8A8A8] focus:border-[#2C6CFF] focus:outline-none focus:ring-[3px] focus:ring-[#2C6CFF]/12 font-mono";

export function BudgetEditSheet({ isOpen, onClose, categoryName, currentAmount, onSave }: BudgetEditSheetProps) {
  const [amountStr, setAmountStr] = useState(currentAmount > 0 ? String(currentAmount) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setAmountStr(currentAmount > 0 ? String(currentAmount) : "");
      setError("");
    }
  }, [isOpen, currentAmount]);

  async function handleSave() {
    const amount = parseFloat(amountStr) || 0;
    setSaving(true);
    setError("");
    try {
      await onSave(amount);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={`Presupuesto — ${categoryName}`}>
      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="budgetAmount" className="mb-1.5 block text-[13px] font-medium text-[#1A1A1A]">
            Monto asignado este mes
          </label>
          <input
            id="budgetAmount"
            type="text"
            inputMode="decimal"
            autoFocus
            placeholder="$0"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value.replace(/[^0-9.]/g, ""))}
            className={inputCls}
          />
        </div>
        {error && <p className="text-[13px] text-[#EF4444]">{error}</p>}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex h-[52px] w-full items-center justify-center rounded-xl bg-[#2C6CFF] font-display text-[16px] font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </BottomSheet>
  );
}
