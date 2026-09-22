"use client";

import { useState, useEffect, useCallback } from "react";
import type { Account } from "@/types";
import { fetchAccounts } from "@/lib/db/accounts";
import { fetchExpenseTransactionsForAccount, fetchTransactionsForAccountPeriod } from "@/lib/db/transactions";
import { getBillingPeriodByOffset } from "@/lib/utils/cardPeriods";
import { calculatePeriodBalance } from "@/lib/utils/accountBalance";

export interface AccountWithPeriods extends Account {
  // Saldo a pagar de los 3 próximos cortes (actual, siguiente, y el que sigue).
  // null para cuentas que no son tarjeta de crédito.
  periodTotals: [number, number, number] | null;
}

interface UseHomeAccountsReturn {
  accounts: AccountWithPeriods[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

async function loadPeriodTotals(account: Account): Promise<[number, number, number] | null> {
  if (account.type !== "credit_card" || account.cut_off_day == null || account.payment_due_day == null) {
    return null;
  }

  const cutOffDay = account.cut_off_day;
  const paymentDueDay = account.payment_due_day;
  const today = new Date();
  const periods = [0, 1, 2].map((offset) =>
    getBillingPeriodByOffset(cutOffDay, paymentDueDay, today, offset)
  );

  const [allExpenses, rangeTransactions] = await Promise.all([
    fetchExpenseTransactionsForAccount(account.id),
    fetchTransactionsForAccountPeriod(account.id, periods[0].start, periods[2].end),
  ]);
  const payments = rangeTransactions.filter((t) => t.type === "payment");

  const totals = periods.map((period) => {
    const periodPayments = payments.filter((p) => p.date >= period.start && p.date <= period.end);
    return calculatePeriodBalance(cutOffDay, paymentDueDay, period, allExpenses, periodPayments).total;
  });

  return [totals[0], totals[1], totals[2]];
}

export function useHomeAccounts(): UseHomeAccountsReturn {
  const [accounts, setAccounts] = useState<AccountWithPeriods[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const list = await fetchAccounts();
      const withPeriods = await Promise.all(
        list.map(async (account) => ({
          ...account,
          periodTotals: await loadPeriodTotals(account),
        }))
      );
      setAccounts(withPeriods);
    } catch (err) {
      console.error("[useHomeAccounts] Error:", err);
      setError(err instanceof Error ? err.message : "Error al cargar cuentas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { accounts, loading, error, refresh: load };
}
