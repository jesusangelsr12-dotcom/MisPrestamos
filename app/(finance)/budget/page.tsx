"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useBudget } from "@/lib/hooks/useBudget";
import { BudgetRow } from "@/components/features/BudgetRow";
import { BudgetEditSheet } from "@/components/features/BudgetEditSheet";
import { FinanceBottomNav } from "@/components/features/FinanceBottomNav";
import { formatCurrency } from "@/lib/utils/finance";
import type { CategoryBudgetRow } from "@/lib/hooks/useBudget";

export default function BudgetPage() {
  const { monthLabel, rows, loading, error, setAssigned, refresh } = useBudget();
  const [editing, setEditing] = useState<CategoryBudgetRow | null>(null);

  const totalAssigned = rows.reduce((sum, r) => sum + r.assigned, 0);
  const totalSpent = rows.reduce((sum, r) => sum + r.spent, 0);

  return (
    <main className="min-h-screen px-5 pb-24 pt-safe">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="pb-4 pt-6">
          <h1 className="font-display text-[28px] font-semibold text-[#1A1A1A]" style={{ letterSpacing: "-0.5px" }}>
            Presupuesto
          </h1>
          <p className="mt-1 text-[14px] text-[#6B6B6B]">{monthLabel}</p>
        </div>

        {!loading && !error && rows.length > 0 && (
          <div className="mb-4 flex items-center justify-between rounded-2xl bg-white px-4 py-4" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div>
              <span className="text-[11px] font-medium uppercase text-[#A8A8A8]">Gastado</span>
              <p className="font-mono text-[20px] font-medium text-[#1A1A1A]">{formatCurrency(totalSpent)}</p>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-medium uppercase text-[#A8A8A8]">Asignado</span>
              <p className="font-mono text-[20px] font-medium text-[#1A1A1A]">{formatCurrency(totalAssigned)}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2C6CFF] border-t-transparent" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 pt-20">
            <p className="text-[14px] text-[#EF4444]">{error}</p>
            <button type="button" onClick={() => refresh()} className="rounded-[10px] bg-[#2C6CFF] px-5 py-2.5 text-[14px] font-medium text-white">
              Reintentar
            </button>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 pt-20">
            <span className="text-[64px]">🗂️</span>
            <p className="text-[18px] font-semibold text-[#1A1A1A]">Sin categorías todavía</p>
            <p className="text-center text-[14px] text-[#6B6B6B]">
              Las categorías se crean desde el formulario de gasto de una tarjeta
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {rows.map((row) => (
              <BudgetRow key={row.category.id} row={row} onTap={() => setEditing(row)} />
            ))}
          </div>
        )}
      </motion.div>

      {editing && (
        <BudgetEditSheet
          isOpen={!!editing}
          onClose={() => setEditing(null)}
          categoryName={editing.category.name}
          currentAmount={editing.assigned}
          onSave={(amount) => setAssigned(editing.category.id, amount)}
        />
      )}

      <FinanceBottomNav />
    </main>
  );
}
