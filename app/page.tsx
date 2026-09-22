"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useHomeAccounts } from "@/lib/hooks/useHomeAccounts";
import { AccountListItem } from "@/components/features/AccountListItem";
import { DuePaymentsBanner } from "@/components/features/DuePaymentsBanner";
import { FinanceBottomNav } from "@/components/features/FinanceBottomNav";

function getMonthName(): string {
  const now = new Date();
  const month = now.toLocaleDateString("es-MX", { month: "long" });
  return `${month.charAt(0).toUpperCase() + month.slice(1)} ${now.getFullYear()}`;
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function HomePage() {
  const router = useRouter();
  const { accounts, upcomingDuePayments, loading, error, refresh } = useHomeAccounts();

  return (
    <main className="min-h-screen px-5 pb-24 pt-safe">
      <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-5">
        <motion.div variants={fadeUp} className="pt-6">
          <h1 className="font-display text-[28px] font-semibold text-[#1A1A1A]" style={{ letterSpacing: "-0.5px" }}>
            Cuentas
          </h1>
          <p className="mt-1 text-[14px] text-[#6B6B6B]">{getMonthName()}</p>
        </motion.div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2C6CFF] border-t-transparent" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 pt-16">
            <p className="text-[14px] text-[#EF4444]">{error}</p>
            <button type="button" onClick={() => refresh()} className="rounded-[10px] bg-[#2C6CFF] px-5 py-2.5 text-[14px] font-medium text-white">
              Reintentar
            </button>
          </div>
        ) : accounts.length === 0 ? (
          <motion.div variants={fadeUp} className="flex flex-col items-center justify-center gap-4 pt-16">
            <span className="text-[64px]">🏦</span>
            <p className="text-center text-[18px] font-semibold text-[#1A1A1A]">Sin cuentas todavía</p>
            <p className="text-center text-[14px] text-[#6B6B6B]">
              Agrega tu efectivo, tarjetas o cuentas de ahorro para empezar
            </p>
            <Link href="/accounts/new" className="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-[#2C6CFF] text-[15px] font-semibold text-white">
              Agregar cuenta
            </Link>
          </motion.div>
        ) : (
          <>
            {upcomingDuePayments.length > 0 && (
              <motion.div variants={fadeUp}>
                <DuePaymentsBanner payments={upcomingDuePayments} />
              </motion.div>
            )}
            <motion.div variants={fadeUp} className="flex flex-col gap-2">
              {accounts.map((account) => (
                <AccountListItem key={account.id} account={account} onTap={() => router.push(`/accounts/${account.id}`)} />
              ))}
            </motion.div>
          </>
        )}
      </motion.div>

      {accounts.length > 0 && (
        <Link
          href="/accounts/new"
          className="fixed bottom-24 right-5 flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-[#2C6CFF] text-white"
          style={{ boxShadow: "0 4px 16px rgba(44,108,255,0.35)" }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </Link>
      )}

      <FinanceBottomNav />
    </main>
  );
}
