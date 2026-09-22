"use client";

import { useState, useEffect, useCallback } from "react";
import type { Account, Person, TransactionWithRelations } from "@/types";
import { fetchAccounts } from "@/lib/db/accounts";
import { fetchExpenseTransactionsForAccount } from "@/lib/db/transactions";
import { fetchPeople } from "@/lib/db/people";
import { fetchReimbursementTotals } from "@/lib/db/reimbursements";
import { getBillingPeriodByOffset } from "@/lib/utils/cardPeriods";
import { calculatePeriodBalance, getMaxForwardOffset, type PeriodLineItem } from "@/lib/utils/accountBalance";

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

function periodLabel(offset: number): string {
  if (offset === 0) return "Corte actual";
  if (offset === 1) return "Siguiente";
  return `+${offset} cortes`;
}

export function useMSIExpensesByCard(personFilter: PersonFilter): UseMSIExpensesByCardReturn {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [expensesByAccount, setExpensesByAccount] = useState<Record<string, TransactionWithRelations[]>>({});
  const [people, setPeople] = useState<Person[]>([]);
  const [reimbursedTotals, setReimbursedTotals] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [allAccounts, peopleList] = await Promise.all([fetchAccounts(), fetchPeople()]);
      setPeople(peopleList);

      const creditCards = allAccounts.filter(
        (a) => a.type === "credit_card" && a.cut_off_day != null && a.payment_due_day != null
      );
      setAccounts(creditCards);

      const expensesPerAccount = await Promise.all(
        creditCards.map((account) => fetchExpenseTransactionsForAccount(account.id))
      );
      const perAccount: Record<string, TransactionWithRelations[]> = {};
      creditCards.forEach((account, i) => {
        perAccount[account.id] = filterMsi(expensesPerAccount[i]);
      });
      setExpensesByAccount(perAccount);

      const notMineExpenseIds = Object.values(perAccount)
        .flat()
        .filter((e) => e.person_id !== null)
        .map((e) => e.id);
      setReimbursedTotals(await fetchReimbursementTotals(notMineExpenseIds));
    } catch (err) {
      console.error("[useMSIExpensesByCard] Error:", err);
      setError(err instanceof Error ? err.message : "Error al cargar gastos MSI");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const today = new Date();
  const groups: CardMSIGroup[] = [];

  for (const account of accounts) {
    const cutOffDay = account.cut_off_day!;
    const paymentDueDay = account.payment_due_day!;
    const allExpenses = (expensesByAccount[account.id] ?? []).filter(
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

  return { groups, people, reimbursedTotals, loading, error, refresh: load };
}
