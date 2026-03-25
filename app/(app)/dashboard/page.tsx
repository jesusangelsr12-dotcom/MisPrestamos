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
    if (value === 0) {
      setDisplay(0);
      return;
    }
    const duration = 800;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      current = Math.min(increment * step, value);
      setDisplay(current);
      if (step >= steps) clearInterval(interval);
    }, duration / steps);
    return () => clearInterval(interval);
  }, [value]);

  return <>{formatCurrency(Math.round(display))}</>;
}

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function DashboardPage() {
  const {
    cards,
    totalMonthly,
    msiTotal,
    loansGivenTotal,
    loansReceivedTotal,
    activeMSI,
    activeLoansGiven,
    activeLoansReceived,
    activeCount,
    loading,
    error,
    refresh,
  } = useDashboard();

  const hasData = cards.length > 0 || activeMSI.length > 0 || activeLoansGiven.length > 0 || activeLoansReceived.length > 0;
  const activeLoansCount = activeLoansGiven.length + activeLoansReceived.length;

  // Mix loans for display, sorted by created_at desc
  const mixedLoans = [
    ...activeLoansGiven.map((l) => ({ ...l, _type: "given" as const })),
    ...activeLoansReceived.map((l) => ({ ...l, _type: "received" as const })),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center pb-safe pt-safe">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <BottomNav />
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-5 pb-safe pt-safe">
        <p className="text-sm text-red-500">{error}</p>
        <button
          type="button"
          onClick={() => refresh()}
          className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white"
        >
          Reintentar
        </button>
        <BottomNav />
      </main>
    );
  }

  if (!hasData) {
    return (
      <main className="min-h-screen px-5 pb-20 pt-safe">
        <div className="pb-4 pt-6">
          <h1 className="text-2xl font-bold font-display">Hola, Jesús 👋</h1>
          <p className="mt-1 text-sm text-muted-foreground">{getMonthName()}</p>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 pt-16">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <span className="text-3xl">🚀</span>
          </div>
          <p className="text-center text-[15px] font-medium text-foreground">
            Empieza agregando una tarjeta y tu primer gasto MSI
          </p>
          <div className="flex gap-3">
            <Link
              href="/cards"
              className="rounded-xl bg-accent px-5 py-3 text-[15px] font-semibold text-white"
            >
              Agregar tarjeta
            </Link>
            <Link
              href="/msi"
              className="rounded-xl border border-accent px-5 py-3 text-[15px] font-semibold text-accent"
            >
              Agregar MSI
            </Link>
          </div>
        </div>
        <BottomNav />
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 pb-20 pt-safe">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-5"
      >
        {/* Header */}
        <motion.div variants={fadeUp} className="pt-6">
          <h1 className="text-2xl font-bold font-display">Hola, Jesús 👋</h1>
          <p className="mt-1 text-sm text-muted-foreground">{getMonthName()}</p>
        </motion.div>

        {/* Hero Card */}
        <motion.div
          variants={fadeUp}
          className="relative overflow-hidden rounded-2xl bg-[#2C6CFF] px-5 py-6"
        >
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-white/[0.07]" />

          <p className="relative text-sm font-medium text-white/80">
            Total a pagar este mes
          </p>
          <p className="relative mt-1 font-mono text-[36px] font-medium leading-tight text-white">
            <AnimatedNumber value={totalMonthly} />
          </p>

          {/* Breakdown pills */}
          <div className="relative mt-4 flex gap-2">
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white">
              MSI {formatCurrency(msiTotal)}
            </span>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white">
              Presté {formatCurrency(loansGivenTotal)}
            </span>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white">
              Me prestaron {formatCurrency(loansReceivedTotal)}
            </span>
          </div>
        </motion.div>

        {/* Summary chips */}
        <motion.div variants={fadeUp} className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center rounded-xl bg-white px-2 py-3">
            <span className="text-xs uppercase tracking-wide text-[#6B6B6B]">
              Activos
            </span>
            <span className="mt-1 font-mono text-lg font-medium text-foreground">
              {activeCount}
            </span>
          </div>
          <div className="flex flex-col items-center rounded-xl bg-white px-2 py-3">
            <span className="text-xs uppercase tracking-wide text-[#6B6B6B]">
              Tarjetas
            </span>
            <span className="mt-1 font-mono text-lg font-medium text-foreground">
              {cards.length}
            </span>
          </div>
          <div className="flex flex-col items-center rounded-xl bg-white px-2 py-3">
            <span className="text-xs uppercase tracking-wide text-[#6B6B6B]">
              Préstamos
            </span>
            <span className="mt-1 font-mono text-lg font-medium text-foreground">
              {activeLoansCount}
            </span>
          </div>
        </motion.div>

        {/* Active MSI */}
        {activeMSI.length > 0 && (
          <motion.div variants={fadeUp}>
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-[13px] font-semibold uppercase tracking-wide text-[#6B6B6B]">
                MSI Activos
              </span>
              <Link href="/msi" className="text-sm font-medium text-accent">
                Ver todos
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              {activeMSI.slice(0, 3).map((expense) => {
                const pct = expense.months > 0 ? (expense.months_paid / expense.months) * 100 : 0;
                return (
                  <div
                    key={expense.id}
                    className="flex items-center gap-3 rounded-xl bg-white px-4 py-3"
                  >
                    <span
                      className="block h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: expense.card.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-[15px] font-medium text-foreground">
                        {expense.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {expense.card.name}
                      </p>
                      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: getProgressColor(pct),
                          }}
                        />
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-[15px] font-medium text-foreground">
                        {formatCurrency(expense.monthly_amount)}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {expense.months_paid}/{expense.months}
                      </p>
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
              <span className="text-[13px] font-semibold uppercase tracking-wide text-[#6B6B6B]">
                Préstamos
              </span>
              <Link href="/loans" className="text-sm font-medium text-accent">
                Ver todos
              </Link>
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
                  <div
                    key={loan.id}
                    className="flex items-center gap-3 rounded-xl bg-white px-4 py-3"
                  >
                    <span
                      className="block h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: dotColor }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-[15px] font-medium text-foreground">
                        {personName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {loan._type === "given" ? "Presté" : "Me prestaron"}
                      </p>
                      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: getProgressColor(pct),
                          }}
                        />
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-[15px] font-medium text-foreground">
                        {formatCurrency(loan.monthly_payment)}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {loan.months_paid}/{totalM}
                      </p>
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
