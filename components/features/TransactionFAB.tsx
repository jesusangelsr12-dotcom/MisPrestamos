"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Receipt, Landmark, ArrowLeftRight } from "lucide-react";
import { useAccounts } from "@/lib/hooks/useAccounts";
import { ExpenseFormSheet } from "@/components/features/ExpenseFormSheet";
import { PaymentFormSheet } from "@/components/features/PaymentFormSheet";
import { TransferFormSheet } from "@/components/features/TransferFormSheet";
import { insertTransaction, type TransactionInput } from "@/lib/db/transactions";
import type { Account } from "@/types";

type ActiveForm = "expense" | "payment" | "transfer" | null;

interface TransactionFABProps {
  cardAccount: Account;
  onCreated: () => void;
}

export function TransactionFAB({ cardAccount, onCreated }: TransactionFABProps) {
  const { accounts } = useAccounts();
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [activeForm, setActiveForm] = useState<ActiveForm>(null);

  const otherAccounts = accounts.filter((a) => a.id !== cardAccount.id);

  async function handleSubmit(input: TransactionInput) {
    await insertTransaction(input);
    onCreated();
  }

  function openForm(form: ActiveForm) {
    setActionSheetOpen(false);
    setActiveForm(form);
  }

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setActionSheetOpen(true)}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-24 right-5 z-30 flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-[#2C6CFF] text-white"
        style={{ boxShadow: "0 4px 16px rgba(44,108,255,0.35)" }}
        aria-label="Agregar movimiento"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </motion.button>

      <AnimatePresence>
        {actionSheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActionSheetOpen(false)}
              className="fixed inset-0 z-40 bg-black/30"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-white px-5 pb-safe pt-5"
            >
              <div className="mb-4 flex justify-center">
                <div className="h-1 w-8 rounded-full bg-[#E8E8E5]" />
              </div>
              <div className="flex flex-col gap-2">
                <button type="button" onClick={() => openForm("expense")} className="flex h-14 items-center gap-3 rounded-xl bg-[#F7F7F5] px-4 text-left">
                  <Receipt size={20} color="#2C6CFF" />
                  <span className="text-[15px] font-medium text-[#1A1A1A]">Gasto</span>
                </button>
                <button type="button" onClick={() => openForm("payment")} className="flex h-14 items-center gap-3 rounded-xl bg-[#F7F7F5] px-4 text-left">
                  <Landmark size={20} color="#00A878" />
                  <span className="text-[15px] font-medium text-[#1A1A1A]">Pago o ingreso</span>
                </button>
                <button type="button" onClick={() => openForm("transfer")} className="flex h-14 items-center gap-3 rounded-xl bg-[#F7F7F5] px-4 text-left">
                  <ArrowLeftRight size={20} color="#8B5CF6" />
                  <span className="text-[15px] font-medium text-[#1A1A1A]">Transferencia entre cuentas</span>
                </button>
                <button type="button" onClick={() => setActionSheetOpen(false)} className="mt-1 flex h-12 items-center justify-center rounded-xl text-[15px] text-[#A8A8A8]">
                  Cancelar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ExpenseFormSheet
        isOpen={activeForm === "expense"}
        onClose={() => setActiveForm(null)}
        accounts={accounts}
        defaultAccountId={cardAccount.id}
        onSubmit={handleSubmit}
      />
      <PaymentFormSheet
        isOpen={activeForm === "payment"}
        onClose={() => setActiveForm(null)}
        cardAccountId={cardAccount.id}
        cardName={cardAccount.name}
        otherAccounts={otherAccounts}
        onSubmit={handleSubmit}
      />
      <TransferFormSheet
        isOpen={activeForm === "transfer"}
        onClose={() => setActiveForm(null)}
        accounts={accounts}
        defaultSourceAccountId={cardAccount.id}
        onSubmit={handleSubmit}
      />
    </>
  );
}
