"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useDashboard } from "@/lib/hooks/useDashboard";
import { BottomNav } from "@/components/features/BottomNav";

function formatCurrency(n: number): string {
  return n.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function getMonthName(): string {
  const now = new Date();
  const month = now.toLocaleDateString("es-MX", { month: "long" });
  const year = now.getFullYear();
  return `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
}

function getProgressColor(pct: number): string {
  if (pct <= 40) return "#2C6CFF";
  if (pct <= 75) return "#F59E0B";
  return "#00A878";
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    const duration = 800;
    const steps = 30;
    const increment = value / steps;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setDisplay(Math.min(increment * step, value));
      if (step >= steps) clearInterval(interval);
    }, duration / steps);
    return () => clearInterval(interval);
  }, [value]);

  return <>{formatCurrency(Math.round(display))}</>;
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function DashboardPage() {
  const {
    cards, totalMonthly, msiTotal, loansGivenTotal, loansReceivedTotal,
    activeMSI, activeLoansGiven, activeLoansReceived, activeCount,
    loading, error, refresh,
  } = useDashboard();

  const hasData = cards.length > 0 || activeMSI.length > 0 || activeLoansGiven.length > 0 || activeLoansReceived.length > 0;
  const activeLoansCount = activeLoansGiven.length + activeLoansReceived.length;

  const mixedLoans = [
    ...activeLoansGiven.map((l) => ({ ...l, _type: "given" as const })),
    ...activeLoansReceived.map((l) => ({ ...l, _type: "received" as const })),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center pb-20 pt-safe">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2C6CFF] border-t-transparent" />
        <BottomNav />
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-5 pb-20 pt-safe">
        <p className="text-[14px] text-[#EF4444]">{error}</p>
        <button type="button" onClick={() => refresh()} className="rounded-[10px] bg-[#2C6CFF] px-5 py-2.5 text-[14px] font-medium text-white">
          Reintentar
        </button>
        <BottomNav />
      </main>
    );
  }

  if (!hasData) {
    return (
      <main className="min-h-screen px-5 pb-24 pt-safe">
        <div className="pb-4 pt-6">
          <h1 className="font-display text-[28px] font-semibold text-[#1A1A1A]" style={{ letterSpacing: "-0.5px" }}>Hola, Jesús 👋</h1>
          <p className="mt-1 text-[14px] text-[#6B6B6B]">{getMonthName()}</p>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 pt-16">
          <span className="text-[64px]">🚀</span>
          <p className="text-center text-[18px] font-semibold text-[#1A1A1A]">Bienvenido a Cuotas</p>
          <p className="text-center text-[14px] text-[#6B6B6B]">Empieza agregando una tarjeta y tu primer gasto MSI</p>
          <div className="mt-2 flex w-full gap-3">
            <Link href="/cards" className="flex h-12 flex-1 items-center justify-center rounded-xl bg-[#2C6CFF] text-[15px] font-semibold text-white">
              Agregar tarjeta
            </Link>
            <Link href="/msi" className="flex h-12 flex-1 items-center justify-center rounded-xl border border-[#2C6CFF] text-[15px] font-semibold text-[#2C6CFF]">
              Agregar MSI
            </Link>
          </div>
        </div>
        <BottomNav />
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 pb-24 pt-safe">
      <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-5">
        {/* Header */}
        <motion.div variants={fadeUp} className="pt-6">
          <h1 className="font-display text-[28px] font-semibold text-[#1A1A1A]" style={{ letterSpacing: "-0.5px" }}>Hola, Jesús 👋</h1>
          <p className="mt-1 text-[14px] text-[#6B6B6B]">{getMonthName()}</p>
        </motion.div>

        {/* Hero Card */}
        <motion.div variants={fadeUp} className="relative overflow-hidden rounded-2xl bg-[#2C6CFF] px-5 py-6">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/[0.07]" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-white/[0.05]" />

          <p className="relative text-[11px] font-medium uppercase text-white/65" style={{ letterSpacing: "0.08em" }}>
            Total a pagar este mes
          </p>
          <p className="relative mt-1 font-mono text-[44px] font-medium leading-tight text-white" style={{ letterSpacing: "-1px" }}>
            <AnimatedNumber value={totalMonthly} />
          </p>

          <div className="relative mt-4 flex flex-wrap gap-2">
            {[
              { label: "MSI", value: msiTotal },
              { label: "Presté", value: loansGivenTotal },
              { label: "Me prestaron", value: loansReceivedTotal },
            ].map((pill) => (
              <span key={pill.label} className="flex flex-col rounded-lg bg-white/15 px-3 py-1.5">
                <span className="text-[11px] text-white/70">{pill.label}</span>
                <strong className="block font-mono text-[13px] font-medium text-white">{formatCurrency(pill.value)}</strong>
              </span>
            ))}
          </div>
        </motion.div>

        {/* Summary chips */}
        <motion.div variants={fadeUp} className="grid grid-cols-3 gap-2">
          {[
            { label: "Activos", value: activeCount },
            { label: "Tarjetas", value: cards.length },
            { label: "Préstamos", value: activeLoansCount },
          ].map((chip) => (
            <div key={chip.label} className="flex flex-col items-center rounded-xl bg-white px-2 py-3" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <span className="text-[10px] font-medium uppercase text-[#A8A8A8]">{chip.label}</span>
              <span className="mt-1 font-mono text-[18px] font-medium text-[#1A1A1A]">{chip.value}</span>
            </div>
          ))}
        </motion.div>

        {/* Active MSI */}
        {activeMSI.length > 0 && (
          <motion.div variants={fadeUp}>
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-[12px] font-semibold uppercase text-[#A8A8A8]">MSI Activos</span>
              <Link href="/msi" className="text-[13px] font-medium text-[#2C6CFF]">Ver todos</Link>
            </div>
            <div className="flex flex-col gap-2">
              {activeMSI.slice(0, 3).map((expense) => {
                const pct = expense.months > 0 ? (expense.months_paid / expense.months) * 100 : 0;
                return (
                  <div key={expense.id} className="rounded-xl bg-white px-4 py-3.5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                    <div className="flex items-center gap-3">
                      <span className="block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: expense.card.color }} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-medium text-[#1A1A1A]">{expense.description}</p>
                        <p className="text-[12px] text-[#A8A8A8]">{expense.card.name}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-mono text-[15px] font-medium text-[#1A1A1A]">{formatCurrency(expense.monthly_amount)}</p>
                        <p className="font-mono text-[11px] text-[#A8A8A8]">{expense.months_paid}/{expense.months}</p>
                      </div>
                    </div>
                    <div className="mt-2.5 h-[3px] w-full overflow-hidden rounded-full bg-[#E8E8E5]">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: getProgressColor(pct) }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Active Loans */}
        {mixedLoans.length > 0 && (
          <motion.div variants={fadeUp}>
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-[12px] font-semibold uppercase text-[#A8A8A8]">Préstamos</span>
              <Link href="/loans" className="text-[13px] font-medium text-[#2C6CFF]">Ver todos</Link>
            </div>
            <div className="flex flex-col gap-2">
              {mixedLoans.map((loan) => {
                const totalM = loan.total_months;
                const pct = totalM > 0 ? (loan.months_paid / totalM) * 100 : 0;
                const personName =
                  loan._type === "given"
                    ? (loan as typeof loan & { borrower_name: string }).borrower_name
                    : (loan as typeof loan & { lender_name: string }).lender_name;
                const dotColor = loan._type === "given" ? "#8B5CF6" : "#EC4899";
                return (
                  <div key={loan.id} className="rounded-xl bg-white px-4 py-3.5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                    <div className="flex items-center gap-3">
                      <span className="block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: dotColor }} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-medium text-[#1A1A1A]">{personName}</p>
                        <p className="text-[12px] text-[#A8A8A8]">{loan._type === "given" ? "Presté" : "Me prestaron"}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-mono text-[15px] font-medium text-[#1A1A1A]">{formatCurrency(loan.monthly_payment)}</p>
                        <p className="font-mono text-[11px] text-[#A8A8A8]">{loan.months_paid}/{totalM}</p>
                      </div>
                    </div>
                    <div className="mt-2.5 h-[3px] w-full overflow-hidden rounded-full bg-[#E8E8E5]">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: getProgressColor(pct) }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </motion.div>
      <BottomNav />
    </main>
  );
}
