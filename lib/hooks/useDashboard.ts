"use client";

import { useState, useEffect, useCallback } from "react";
import type { Card, MSIExpenseWithCard, LoanGiven, LoanReceived } from "@/types";
import { fetchCards } from "@/lib/supabase/cards";
import { fetchMSIExpenses } from "@/lib/supabase/msi";
import { fetchLoansGiven, fetchLoansReceived } from "@/lib/supabase/loans";
import { calculateMonthlyProjection } from "@/lib/utils/projection";
import { isMSIActive } from "@/lib/utils/finance";

interface DashboardData {
  cards: Card[];
  msiExpenses: MSIExpenseWithCard[];
  loansGiven: LoanGiven[];
  loansReceived: LoanReceived[];
  totalMonthly: number;
  msiTotal: number;
  loansGivenTotal: number;
  loansReceivedTotal: number;
  activeMSI: MSIExpenseWithCard[];
  activeLoansGiven: LoanGiven[];
  activeLoansReceived: LoanReceived[];
  activeCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useDashboard(): DashboardData {
  const [cards, setCards] = useState<Card[]>([]);
  const [msiExpenses, setMsiExpenses] = useState<MSIExpenseWithCard[]>([]);
  const [loansGiven, setLoansGiven] = useState<LoanGiven[]>([]);
  const [loansReceived, setLoansReceived] = useState<LoanReceived[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Tiempo de espera agotado")), 5000)
      );

      const [c, m, lg, lr] = await Promise.race([
        Promise.all([
          fetchCards(),
          fetchMSIExpenses(),
          fetchLoansGiven(),
          fetchLoansReceived(),
        ]),
        timeout,
      ]);

      setCards(c);
      setMsiExpenses(m);
      setLoansGiven(lg);
      setLoansReceived(lr);
    } catch (err) {
      console.error("[useDashboard] Error:", err);
      setError(err instanceof Error ? err.message : "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeMSI = msiExpenses.filter(isMSIActive);
  const activeLoansGiven = loansGiven.filter((l) => l.months_paid < l.total_months);
  const activeLoansReceived = loansReceived.filter((l) => l.months_paid < l.total_months);

  // El total "a pagar este mes" sale del mismo cálculo que la proyección (mes
  // actual), respetando start_date. Antes el dashboard sumaba TODOS los activos
  // (ignorando start_date), por lo que discrepaba con la página de proyección.
  const [currentMonth] = calculateMonthlyProjection(
    msiExpenses,
    loansGiven,
    loansReceived,
    1
  );
  const msiTotal = currentMonth?.msiTotal ?? 0;
  const loansGivenTotal = currentMonth?.loansGivenTotal ?? 0;
  const loansReceivedTotal = currentMonth?.loansReceivedTotal ?? 0;
  const totalMonthly = currentMonth?.total ?? 0;
  const activeCount = activeMSI.length + activeLoansGiven.length + activeLoansReceived.length;

  return {
    cards,
    msiExpenses,
    loansGiven,
    loansReceived,
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
    refresh: load,
  };
}
