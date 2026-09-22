"use client";

import useSWR from "swr";
import type { Account } from "@/types";
import { fetchAccounts } from "@/lib/db/accounts";
import { fetchExpenseTransactionsForAccount, fetchTransactionsForAccountPeriod } from "@/lib/db/transactions";
import { getBillingPeriodByOffset } from "@/lib/utils/cardPeriods";
import { calculatePeriodBalance } from "@/lib/utils/accountBalance";
import { swrKeys } from "@/lib/swr/finance";

export interface UpcomingDuePayment {
  accountId: string;
  accountName: string;
  dueDate: string; // YYYY-MM-DD
  amount: number;
}

export interface AccountWithPeriods extends Account {
  // Saldo a pagar de los 3 próximos cortes (actual, siguiente, y el que sigue).
  // null para cuentas que no son tarjeta de crédito.
  periodTotals: [number, number, number] | null;
}

interface UseHomeAccountsReturn {
  accounts: AccountWithPeriods[];
  upcomingDuePayments: UpcomingDuePayment[]; // ordenados por fecha límite más cercana
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

interface AccountPeriodData {
  periodTotals: [number, number, number] | null;
  duePayment: UpcomingDuePayment | null;
}

interface HomeAccountsData {
  accounts: AccountWithPeriods[];
  upcomingDuePayments: UpcomingDuePayment[];
}

async function loadAccountPeriodData(account: Account): Promise<AccountPeriodData> {
  if (account.type !== "credit_card" || account.cut_off_day == null || account.payment_due_day == null) {
    return { periodTotals: null, duePayment: null };
  }

  const cutOffDay = account.cut_off_day;
  const paymentDueDay = account.payment_due_day;
  const today = new Date();
  // offset -1: el corte que ya cerró y cuyo pago puede seguir pendiente.
  // offset 0..2: los que se muestran en las 3 columnas del Home.
  const periods = [-1, 0, 1, 2].map((offset) => getBillingPeriodByOffset(cutOffDay, paymentDueDay, today, offset));

  const [allExpenses, rangeTransactions] = await Promise.all([
    fetchExpenseTransactionsForAccount(account.id),
    fetchTransactionsForAccountPeriod(account.id, periods[0].start, periods[3].end),
  ]);
  const payments = rangeTransactions.filter((t) => t.type === "payment");

  const balances = periods.map((period) => {
    const periodPayments = payments.filter((p) => p.date >= period.start && p.date <= period.end);
    return calculatePeriodBalance(cutOffDay, paymentDueDay, period, allExpenses, periodPayments).total;
  });

  const [closedTotal] = balances;
  const closedPeriod = periods[0];

  // Sin fecha límite si ya está pagado (closedTotal <= 0). Si sigue sin
  // pagarse, se incluye aunque la fecha ya haya pasado — el banner decide
  // si mostrarla como "vence pronto" o "venció hace N días".
  const duePayment: UpcomingDuePayment | null =
    closedTotal > 0
      ? { accountId: account.id, accountName: account.name, dueDate: closedPeriod.dueDate, amount: closedTotal }
      : null;

  return {
    periodTotals: [balances[1], balances[2], balances[3]],
    duePayment,
  };
}

async function fetchHomeAccountsData(): Promise<HomeAccountsData> {
  const list = await fetchAccounts();
  const withData = await Promise.all(
    list.map(async (account) => ({ account, data: await loadAccountPeriodData(account) }))
  );

  const accounts = withData.map(({ account, data }) => ({ ...account, periodTotals: data.periodTotals }));

  const DUE_SOON_DAYS = 7;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + DUE_SOON_DAYS);
  const cutoffYMD = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, "0")}-${String(cutoff.getDate()).padStart(2, "0")}`;

  const upcomingDuePayments = withData
    .map(({ data }) => data.duePayment)
    .filter((d): d is UpcomingDuePayment => d !== null && d.dueDate <= cutoffYMD)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return { accounts, upcomingDuePayments };
}

export function useHomeAccounts(): UseHomeAccountsReturn {
  const { data, error, isLoading, mutate } = useSWR<HomeAccountsData>(swrKeys.homeAccounts, fetchHomeAccountsData);

  return {
    accounts: data?.accounts ?? [],
    upcomingDuePayments: data?.upcomingDuePayments ?? [],
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : "Error al cargar cuentas") : null,
    refresh: async () => {
      await mutate();
    },
  };
}
