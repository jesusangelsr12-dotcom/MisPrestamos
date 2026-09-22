"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MoreHorizontal } from "lucide-react";
import { useAccountDetail } from "@/lib/hooks/useAccountDetail";
import { AccountTypeIcon, ACCOUNT_TYPE_LABELS } from "@/components/features/AccountTypeIcon";
import { PeriodNav } from "@/components/features/PeriodNav";
import { TransactionListItem } from "@/components/features/TransactionListItem";
import { TransactionEditSheet } from "@/components/features/TransactionEditSheet";
import { FinanceBottomNav } from "@/components/features/FinanceBottomNav";
import { TransactionFAB } from "@/components/features/TransactionFAB";
import { formatCurrency } from "@/lib/utils/finance";
import { deleteAccountById } from "@/lib/db/accounts";
import { updateTransactionById, deleteTransactionById } from "@/lib/db/transactions";
import type { TransactionWithRelations } from "@/types";

export default function AccountDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { account, period, isCreditCard, items, total, canGoBack, canGoForward, goBack, goForward, loading, error, refresh } =
    useAccountDetail(params.id);

  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithRelations | null>(null);

  async function handleDeleteAccount() {
    setDeletingAccount(true);
    setDeleteError("");
    try {
      await deleteAccountById(params.id);
      router.push("/");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Error al eliminar");
      setDeletingAccount(false);
      setMenuOpen(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center pb-20 pt-safe">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2C6CFF] border-t-transparent" />
        <FinanceBottomNav />
      </main>
    );
  }

  if (error || !account) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-5 pb-20 pt-safe">
        <p className="text-[14px] text-[#EF4444]">{error ?? "Cuenta no encontrada"}</p>
        <button type="button" onClick={() => refresh()} className="rounded-[10px] bg-[#2C6CFF] px-5 py-2.5 text-[14px] font-medium text-white">
          Reintentar
        </button>
        <FinanceBottomNav />
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 pb-24 pt-safe">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex flex-col gap-4">
        <div className="pt-6">
          <button type="button" onClick={() => router.push("/")} className="mb-3 flex items-center gap-1 text-[14px] text-[#2C6CFF]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Cuentas
          </button>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F7F7F5]">
                <AccountTypeIcon type={account.type} />
              </span>
              <div>
                <h1 className="font-display text-[22px] font-semibold text-[#1A1A1A]" style={{ letterSpacing: "-0.5px" }}>
                  {account.name}
                </h1>
                <p className="text-[13px] text-[#A8A8A8]">{ACCOUNT_TYPE_LABELS[account.type]}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              aria-label="Más opciones"
            >
              <MoreHorizontal size={20} color="#6B6B6B" />
            </button>
          </div>
          {deleteError && <p className="mt-2 text-[13px] text-[#EF4444]">{deleteError}</p>}
        </div>

        {period && (
          <PeriodNav period={period} canGoBack={canGoBack} canGoForward={canGoForward} onBack={goBack} onForward={goForward} />
        )}

        <div className="flex flex-col items-center rounded-2xl bg-white px-4 py-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <span className="text-[11px] font-medium uppercase text-[#A8A8A8]" style={{ letterSpacing: "0.06em" }}>
            {isCreditCard ? "Saldo a pagar" : "Movimiento neto del periodo"}
          </span>
          <span className="font-mono mt-1 text-[32px] font-medium text-[#1A1A1A]" style={{ letterSpacing: "-1px" }}>
            {formatCurrency(Math.abs(total))}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {items.length === 0 ? (
            <p className="py-8 text-center text-[14px] text-[#A8A8A8]">Sin movimientos en este periodo</p>
          ) : (
            items.map((item) => (
              <TransactionListItem key={item.transaction.id} {...item} onTap={() => setEditingTransaction(item.transaction)} />
            ))
          )}
        </div>
      </motion.div>

      {isCreditCard && <TransactionFAB cardAccount={account} onCreated={refresh} />}

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
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
                <button
                  type="button"
                  onClick={() => router.push(`/accounts/${account.id}/edit`)}
                  className="flex h-12 items-center justify-center rounded-xl bg-[#F7F7F5] text-[15px] font-medium text-[#1A1A1A]"
                >
                  Editar cuenta
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount}
                  className="flex h-12 items-center justify-center rounded-xl text-[15px] font-medium text-[#EF4444] disabled:opacity-50"
                >
                  {deletingAccount ? "Eliminando..." : "Eliminar cuenta"}
                </button>
                <button type="button" onClick={() => setMenuOpen(false)} className="flex h-12 items-center justify-center rounded-xl text-[15px] text-[#A8A8A8]">
                  Cancelar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <TransactionEditSheet
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        transaction={editingTransaction}
        onSave={async (id, updates) => {
          await updateTransactionById(id, updates);
          await refresh();
        }}
        onDelete={async (id) => {
          await deleteTransactionById(id);
          await refresh();
        }}
      />

      <FinanceBottomNav />
    </main>
  );
}
