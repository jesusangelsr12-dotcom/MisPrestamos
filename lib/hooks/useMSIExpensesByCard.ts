"use client";

import useSWR from "swr";
import type { Account, Person, TransactionWithRelations } from "@/types";
import { fetchAccounts } from "@/lib/db/accounts";
import { fetchExpenseTransactionsForAccount } from "@/lib/db/transactions";
import { fetchPeople } from "@/lib/db/people";
import { fetchReimbursementTotals } from "@/lib/db/reimbursements";
import { getBillingPeriodByOffset } from "@/lib/utils/cardPeriods";
import { calculatePeriodBalance, getMaxForwardOffset, type PeriodLineItem } from "@/lib/utils/accountBalance";
import { swrKeys } from "@/lib/swr/finance";

function filterMsi(expenses: TransactionWithRelations[]): TransactionWithRelations[] {
  return expenses.filter((e) => e.msi_months > 0);
}

export interface CardPeriodTotal {
  offset: number;
  label: string;
  total: number;
}

export interface CardMSIGroup {
  account: Account;
  periodTotals: CardPeriodTotal[];
  currentItems: PeriodLineItem[];
}

// null = "Mío" (person_id nulo), "all" = sin filtro, o un person_id específico.
export type PersonFilter = "all" | null | string;

interface UseMSIExpensesByCardReturn {
  groups: CardMSIGroup[];
  people: Person[];
  reimbursedTotals: Record<string, number>; // expense_id -> total reembolsado
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

interface MSIExpensesData {
  creditCards: Account[];
  expensesByAccount: Record<string, TransactionWithRelations[]>;
  people: Person[];
  reimbursedTotals: Record<string, number>;
}

function periodLabel(offset: number): string {
  if (offset === 0) return "Corte actual";
  if (offset === 1) return "Siguiente";
  return `+${offset} cortes`;
}

async function fetchMSIExpensesData(): Promise<MSIExpensesData> {
  const [allAccounts, peopleList] = await Promise.all([fetchAccounts(), fetchPeople()]);

  const creditCards = allAccounts.filter(
    (a) => a.type === "credit_card" && a.cut_off_day != null && a.payment_due_day != null
  );

  const expensesPerAccount = await Promise.all(
    creditCards.map((account) => fetchExpenseTransactionsForAccount(account.id))
  );
  const expensesByAccount: Record<string, TransactionWithRelations[]> = {};
  creditCards.forEach((account, i) => {
    expensesByAccount[account.id] = filterMsi(expensesPerAccount[i]);
  });

  const notMineExpenseIds = Object.values(expensesByAccount)
    .flat()
    .filter((e) => e.person_id !== null)
    .map((e) => e.id);
  const reimbursedTotals = await fetchReimbursementTotals(notMineExpenseIds);

  return { creditCards, expensesByAccount, people: peopleList, reimbursedTotals };
}

export function useMSIExpensesByCard(personFilter: PersonFilter): UseMSIExpensesByCardReturn {
  const { data, error, isLoading, mutate } = useSWR<MSIExpensesData>(swrKeys.msiExpensesData, fetchMSIExpensesData);

  const today = new Date();
  const groups: CardMSIGroup[] = [];

  for (const account of data?.creditCards ?? []) {
    const cutOffDay = account.cut_off_day!;
    const paymentDueDay = account.payment_due_day!;
    const allExpenses = (data?.expensesByAccount[account.id] ?? []).filter(
      (e) => personFilter === "all" || e.person_id === personFilter
    );
    if (allExpenses.length === 0) continue;

    const maxOffset = Math.min(getMaxForwardOffset(cutOffDay, paymentDueDay, today, allExpenses), 12);
    const periodTotals: CardPeriodTotal[] = [];
    let currentItems: PeriodLineItem[] = [];

    for (let offset = 0; offset <= maxOffset; offset++) {
      const period = getBillingPeriodByOffset(cutOffDay, paymentDueDay, today, offset);
      const balance = calculatePeriodBalance(cutOffDay, paymentDueDay, period, allExpenses, []);
      periodTotals.push({ offset, label: periodLabel(offset), total: balance.total });
      if (offset === 0) currentItems = balance.items;
    }

    groups.push({ account, periodTotals, currentItems });
  }

  return {
    groups,
    people: data?.people ?? [],
    reimbursedTotals: data?.reimbursedTotals ?? {},
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : "Error al cargar gastos MSI") : null,
    refresh: async () => {
      await mutate();
    },
  };
}
