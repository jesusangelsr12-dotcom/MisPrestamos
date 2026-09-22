"use client";

import { useState } from "react";
import useSWR from "swr";
import type { Account, TransactionWithRelations } from "@/types";
import { fetchAccountById } from "@/lib/db/accounts";
import {
  fetchExpenseTransactionsForAccount,
  fetchTransactionsForAccountPeriod,
  fetchTransactionsForAccountRangeAnyDirection,
} from "@/lib/db/transactions";
import {
  getBillingPeriodByOffset,
  getCalendarMonthPeriod,
  periodMonthsBetween,
  parseYMD,
  type BillingPeriod,
} from "@/lib/utils/cardPeriods";
import { calculatePeriodBalance, getMaxForwardOffset, type PeriodLineItem } from "@/lib/utils/accountBalance";
import { swrKeys } from "@/lib/swr/finance";

interface AccountDetailState {
  account: Account | null;
  period: BillingPeriod | null;
  isCreditCard: boolean;
  items: PeriodLineItem[];
  total: number; // saldo a pagar (tarjeta) o movimiento neto del periodo (otras cuentas)
  offset: number;
  canGoBack: boolean;
  canGoForward: boolean;
  goBack: () => void;
  goForward: () => void;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

interface AccountDetailData {
  account: Account;
  period: BillingPeriod;
  isCreditCard: boolean;
  items: PeriodLineItem[];
  minOffset: number;
  maxOffset: number;
}

function netMovement(accountId: string, transactions: TransactionWithRelations[]): PeriodLineItem[] {
  return transactions.map((t) => {
    let amount = 0;
    if (t.type === "expense" && t.account_id === accountId) amount = -t.amount;
    else if (t.type === "transfer" && t.account_id === accountId) amount = t.amount;
    else if (t.type === "transfer" && t.source_account_id === accountId) amount = -t.amount;
    else if (t.type === "payment" && t.source_account_id === accountId) amount = -t.amount;
    return { transaction: t, amount, installmentLabel: null };
  });
}

async function fetchAccountDetailData(accountId: string, offset: number): Promise<AccountDetailData> {
  const acc = await fetchAccountById(accountId);
  if (!acc) throw new Error("Cuenta no encontrada");

  const today = new Date();
  const createdAt = parseYMD(acc.created_at.slice(0, 10));
  const isCreditCard = acc.type === "credit_card" && acc.cut_off_day != null && acc.payment_due_day != null;

  if (isCreditCard) {
    const cutOffDay = acc.cut_off_day!;
    const paymentDueDay = acc.payment_due_day!;
    const todayPeriod = getBillingPeriodByOffset(cutOffDay, paymentDueDay, today, 0);
    const createdPeriod = getBillingPeriodByOffset(cutOffDay, paymentDueDay, createdAt, 0);
    const minOffset = periodMonthsBetween(todayPeriod.end, createdPeriod.end);

    const allExpenses = await fetchExpenseTransactionsForAccount(accountId);
    const maxOffset = getMaxForwardOffset(cutOffDay, paymentDueDay, today, allExpenses);

    const currentPeriod = getBillingPeriodByOffset(cutOffDay, paymentDueDay, today, offset);
    const rangeTransactions = await fetchTransactionsForAccountPeriod(accountId, currentPeriod.start, currentPeriod.end);
    const periodPayments = rangeTransactions.filter((t) => t.type === "payment");
    const balance = calculatePeriodBalance(cutOffDay, paymentDueDay, currentPeriod, allExpenses, periodPayments);

    return { account: acc, period: currentPeriod, isCreditCard, items: balance.items, minOffset, maxOffset };
  }

  const todayMonth = getCalendarMonthPeriod(today, 0);
  const createdMonth = getCalendarMonthPeriod(createdAt, 0);
  const minOffset = periodMonthsBetween(todayMonth.end, createdMonth.end);

  const currentPeriod = getCalendarMonthPeriod(today, offset);
  const transactions = await fetchTransactionsForAccountRangeAnyDirection(accountId, currentPeriod.start, currentPeriod.end);

  return {
    account: acc,
    period: currentPeriod,
    isCreditCard,
    items: netMovement(accountId, transactions),
    minOffset,
    maxOffset: 0,
  };
}

export function useAccountDetail(accountId: string): AccountDetailState {
  const [offset, setOffset] = useState(0);
  const { data, error, isLoading, mutate } = useSWR(
    swrKeys.accountDetail(accountId, offset),
    () => fetchAccountDetailData(accountId, offset)
  );

  const total = (data?.items ?? []).reduce((sum, item) => sum + item.amount, 0);

  return {
    account: data?.account ?? null,
    period: data?.period ?? null,
    isCreditCard: data?.isCreditCard ?? false,
    items: data?.items ?? [],
    total,
    offset,
    canGoBack: offset > (data?.minOffset ?? -1200),
    canGoForward: offset < (data?.maxOffset ?? 0),
    goBack: () => setOffset((o) => o - 1),
    goForward: () => setOffset((o) => o + 1),
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : "Error al cargar la cuenta") : null,
    refresh: async () => {
      await mutate();
    },
  };
}
