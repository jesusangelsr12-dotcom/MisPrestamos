"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useMSIExpensesByCard, type PersonFilter } from "@/lib/hooks/useMSIExpensesByCard";
import { FinanceBottomNav } from "@/components/features/FinanceBottomNav";
import { MSIExpenseItem } from "@/components/features/MSIExpenseItem";
import { ReimbursementSheet } from "@/components/features/ReimbursementSheet";
import { formatCurrency } from "@/lib/utils/finance";
import type { TransactionWithRelations } from "@/types";

function chipCls(active: boolean) {
  return `flex h-9 shrink-0 items-center rounded-full px-3.5 text-[13px] font-medium ${
    active ? "bg-[#2C6CFF] text-white" : "border border-[#EBEBEB] bg-white text-[#6B6B6B]"
  }`;
}

export default function MSIExpensesPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<PersonFilter>("all");
  const { groups, people, reimbursedTotals, loading, error, refresh } = useMSIExpensesByCard(filter);
  const [reimbursingExpense, setReimbursingExpense] = useState<TransactionWithRelations | null>(null);

  return (
    <main className="min-h-screen px-5 pb-24 pt-safe">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="pb-4 pt-6">
          <h1 className="font-display text-[28px] font-semibold text-[#1A1A1A]" style={{ letterSpacing: "-0.5px" }}>
            Gastos MSI
          </h1>
        </div>

        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          <button type="button" onClick={() => setFilter("all")} className={chipCls(filter === "all")}>Todos</button>
          <button type="button" onClick={() => setFilter(null)} className={chipCls(filter === null)}>Mío</button>
          {people.map((p) => (
            <button key={p.id} type="button" onClick={() => setFilter(p.id)} className={chipCls(filter === p.id)}>
              {p.name}
            </button>
          ))}
        </div>

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
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 pt-20">
            <span className="text-[64px]">📊</span>
            <p className="text-[18px] font-semibold text-[#1A1A1A]">Sin gastos a MSI</p>
            <p className="text-center text-[14px] text-[#6B6B6B]">
              Registra un gasto con meses sin intereses desde el detalle de una tarjeta
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {groups.map((group) => (
              <div key={group.account.id}>
                <button
                  type="button"
                  onClick={() => router.push(`/accounts/${group.account.id}`)}
                  className="mb-2 flex w-full items-center justify-between px-1 text-left"
                >
                  <span className="text-[15px] font-semibold text-[#1A1A1A]">{group.account.name}</span>
                  <span className="text-[13px] text-[#2C6CFF]">Ver cuenta</span>
                </button>

                <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                  {group.periodTotals.map((p) => (
                    <div key={p.offset} className="flex shrink-0 flex-col rounded-xl bg-white px-3 py-2" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                      <span className="text-[10px] font-medium uppercase text-[#A8A8A8]">{p.label}</span>
                      <span className="font-mono-nums mt-0.5 text-[14px] font-medium text-[#1A1A1A]">{formatCurrency(p.total)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2">
                  {group.currentItems.map((item) => (
                    <MSIExpenseItem
                      key={item.transaction.id}
                      item={item}
                      reimbursedTotal={reimbursedTotals[item.transaction.id] ?? 0}
                      onOpenReimbursements={() => setReimbursingExpense(item.transaction)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {reimbursingExpense && (
        <ReimbursementSheet
          isOpen={!!reimbursingExpense}
          onClose={() => setReimbursingExpense(null)}
          expenseId={reimbursingExpense.id}
          personName={reimbursingExpense.person?.name ?? ""}
          totalAmount={reimbursingExpense.amount}
          msiMonths={reimbursingExpense.msi_months}
          onChanged={refresh}
        />
      )}

      <FinanceBottomNav />
    </main>
  );
}
