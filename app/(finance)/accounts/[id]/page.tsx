"use client";

import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useAccountDetail } from "@/lib/hooks/useAccountDetail";
import { AccountTypeIcon, ACCOUNT_TYPE_LABELS } from "@/components/features/AccountTypeIcon";
import { PeriodNav } from "@/components/features/PeriodNav";
import { TransactionListItem } from "@/components/features/TransactionListItem";
import { FinanceBottomNav } from "@/components/features/FinanceBottomNav";
import { TransactionFAB } from "@/components/features/TransactionFAB";
import { formatCurrency } from "@/lib/utils/finance";

export default function AccountDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { account, period, isCreditCard, items, total, canGoBack, canGoForward, goBack, goForward, loading, error, refresh } =
    useAccountDetail(params.id);

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
            items.map((item) => <TransactionListItem key={item.transaction.id} {...item} />)
          )}
        </div>
      </motion.div>

      {isCreditCard && <TransactionFAB cardAccount={account} onCreated={refresh} />}

      <FinanceBottomNav />
    </main>
  );
}
