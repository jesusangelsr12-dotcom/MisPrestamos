"use client";

import { useState, useEffect, useCallback } from "react";
import type { LoanGiven, LoanReceived } from "@/types";
import {
  fetchLoansGiven,
  fetchLoansReceived,
  fetchLoanPaymentTotals,
  insertLoanGiven,
  insertLoanReceived,
  updateLoanGivenById,
  updateLoanReceivedById,
  deleteLoanById,
  markLoanMonthPaid,
  type LoanType,
  type LoanGivenInput,
  type LoanReceivedInput,
} from "@/lib/supabase/loans";

interface UseLoansReturn {
  given: LoanGiven[];
  received: LoanReceived[];
  // Total realmente pagado por préstamo (suma del historial), keyed by id.
  paidTotals: Record<string, number>;
  loading: boolean;
  error: string | null;
  createLoan: (data: LoanGivenInput | LoanReceivedInput, type: LoanType) => Promise<void>;
  updateLoan: (id: string, data: Partial<LoanGivenInput> | Partial<LoanReceivedInput>, type: LoanType) => Promise<void>;
  deleteLoan: (id: string, type: LoanType) => Promise<void>;
  markPaid: (id: string, type: LoanType, amount: number, monthsCovered: number) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useLoans(): UseLoansReturn {
  const [given, setGiven] = useState<LoanGiven[]>([]);
  const [received, setReceived] = useState<LoanReceived[]>([]);
  const [paidTotals, setPaidTotals] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Tiempo de espera agotado")), 5000)
      );

      const [g, r, givenTotals, receivedTotals] = await Promise.race([
        Promise.all([
          fetchLoansGiven(),
          fetchLoansReceived(),
          fetchLoanPaymentTotals("loan_given"),
          fetchLoanPaymentTotals("loan_received"),
        ]),
        timeout,
      ]);
      setGiven(g);
      setReceived(r);
      setPaidTotals({ ...givenTotals, ...receivedTotals });
    } catch (err) {
      console.error("[useLoans] Error loading:", err);
      setError(err instanceof Error ? err.message : "Error al cargar préstamos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createLoan = useCallback(
    async (data: LoanGivenInput | LoanReceivedInput, type: LoanType) => {
      if (type === "given") {
        await insertLoanGiven(data as LoanGivenInput);
      } else {
        await insertLoanReceived(data as LoanReceivedInput);
      }
      await load();
    },
    [load]
  );

  const updateLoan = useCallback(
    async (
      id: string,
      data: Partial<LoanGivenInput> | Partial<LoanReceivedInput>,
      type: LoanType
    ) => {
      if (type === "given") {
        await updateLoanGivenById(id, data as Partial<LoanGivenInput>);
      } else {
        await updateLoanReceivedById(id, data as Partial<LoanReceivedInput>);
      }
      await load();
    },
    [load]
  );

  const deleteLoan = useCallback(
    async (id: string, type: LoanType) => {
      if (type === "given") {
        const previous = [...given];
        setGiven((prev) => prev.filter((l) => l.id !== id));
        try {
          await deleteLoanById(id, type);
        } catch (err) {
          setGiven(previous);
          throw err;
        }
      } else {
        const previous = [...received];
        setReceived((prev) => prev.filter((l) => l.id !== id));
        try {
          await deleteLoanById(id, type);
        } catch (err) {
          setReceived(previous);
          throw err;
        }
      }
    },
    [given, received]
  );

  const markPaid = useCallback(
    async (id: string, type: LoanType, amount: number, monthsCovered: number) => {
      const list = type === "given" ? given : received;
      const target = list.find((l) => l.id === id);

      if (type === "given") {
        setGiven((prev) =>
          prev.map((l) =>
            l.id === id
              ? { ...l, months_paid: Math.min(l.months_paid + monthsCovered, l.total_months) }
              : l
          )
        );
      } else {
        setReceived((prev) =>
          prev.map((l) =>
            l.id === id
              ? { ...l, months_paid: Math.min(l.months_paid + monthsCovered, l.total_months) }
              : l
          )
        );
      }
      setPaidTotals((prev) => {
        const base = prev[id] ?? (target ? target.monthly_payment * target.months_paid : 0);
        return { ...prev, [id]: base + amount };
      });

      try {
        await markLoanMonthPaid(id, type, amount, monthsCovered);
      } catch (err) {
        await load();
        throw err;
      }
    },
    [given, received, load]
  );

  return {
    given,
    received,
    paidTotals,
    loading,
    error,
    createLoan,
    updateLoan,
    deleteLoan,
    markPaid,
    refresh: load,
  };
}
