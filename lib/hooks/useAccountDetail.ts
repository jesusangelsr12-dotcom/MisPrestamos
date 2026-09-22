"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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

export function useAccountDetail(accountId: string): AccountDetailState {
  const [account, setAccount] = useState<Account | null>(null);
  const [offset, setOffset] = useState(0);
  const [items, setItems] = useState<PeriodLineItem[]>([]);
  const [minOffset, setMinOffset] = useState<number>(-1200);
  const [maxOffset, setMaxOffset] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isCreditCard =
    account?.type === "credit_card" && account.cut_off_day != null && account.payment_due_day != null;

  const period = useMemo<BillingPeriod | null>(() => {
    if (!account) return null;
    const today = new Date();
    return isCreditCard
      ? getBillingPeriodByOffset(account.cut_off_day!, account.payment_due_day!, today, offset)
      : getCalendarMonthPeriod(today, offset);
  }, [account, isCreditCard, offset]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const acc = await fetchAccountById(accountId);
      if (!acc) throw new Error("Cuenta no encontrada");
      setAccount(acc);

      const today = new Date();
      const createdAt = parseYMD(acc.created_at.slice(0, 10));
      const accIsCard = acc.type === "credit_card" && acc.cut_off_day != null && acc.payment_due_day != null;

      if (accIsCard) {
        const cutOffDay = acc.cut_off_day!;
        const paymentDueDay = acc.payment_due_day!;
        const todayPeriod = getBillingPeriodByOffset(cutOffDay, paymentDueDay, today, 0);
        const createdPeriod = getBillingPeriodByOffset(cutOffDay, paymentDueDay, createdAt, 0);
        setMinOffset(periodMonthsBetween(todayPeriod.end, createdPeriod.end));

        const allExpenses = await fetchExpenseTransactionsForAccount(accountId);
        setMaxOffset(getMaxForwardOffset(cutOffDay, paymentDueDay, today, allExpenses));

        const currentPeriod = getBillingPeriodByOffset(cutOffDay, paymentDueDay, today, offset);
        const rangeTransactions = await fetchTransactionsForAccountPeriod(
          accountId,
          currentPeriod.start,
          currentPeriod.end
        );
        const periodPayments = rangeTransactions.filter((t) => t.type === "payment");
        const balance = calculatePeriodBalance(cutOffDay, paymentDueDay, currentPeriod, allExpenses, periodPayments);
        setItems(balance.items);
      } else {
        const todayMonth = getCalendarMonthPeriod(today, 0);
        const createdMonth = getCalendarMonthPeriod(createdAt, 0);
        setMinOffset(periodMonthsBetween(todayMonth.end, createdMonth.end));
        setMaxOffset(0);

        const currentPeriod = getCalendarMonthPeriod(today, offset);
        const transactions = await fetchTransactionsForAccountRangeAnyDirection(
          accountId,
          currentPeriod.start,
          currentPeriod.end
        );
        setItems(netMovement(accountId, transactions));
      }
    } catch (err) {
      console.error("[useAccountDetail] Error:", err);
      setError(err instanceof Error ? err.message : "Error al cargar la cuenta");
    } finally {
      setLoading(false);
    }
  }, [accountId, offset]);

  useEffect(() => {
    load();
  }, [load]);

  const total = items.reduce((sum, item) => sum + item.amount, 0);

  return {
    account,
    period,
    isCreditCard,
    items,
    total,
    offset,
    canGoBack: offset > minOffset,
    canGoForward: offset < maxOffset,
    goBack: () => setOffset((o) => o - 1),
    goForward: () => setOffset((o) => o + 1),
    loading,
    error,
    refresh: load,
  };
}
