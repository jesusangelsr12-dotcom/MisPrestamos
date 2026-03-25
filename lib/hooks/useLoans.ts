"use client";

import { useState, useEffect, useCallback } from "react";
import type { LoanGiven, LoanReceived } from "@/types";
import {
  fetchLoansGiven,
  fetchLoansReceived,
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
  loading: boolean;
  error: string | null;
  createLoan: (data: LoanGivenInput | LoanReceivedInput, type: LoanType) => Promise<void>;
  updateLoan: (id: string, data: Partial<LoanGivenInput> | Partial<LoanReceivedInput>, type: LoanType) => Promise<void>;
  deleteLoan: (id: string, type: LoanType) => Promise<void>;
  markPaid: (id: string, type: LoanType) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useLoans(): UseLoansReturn {
  const [given, setGiven] = useState<LoanGiven[]>([]);
  const [received, setReceived] = useState<LoanReceived[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Tiempo de espera agotado")), 5000)
      );

      const [g, r] = await Promise.race([
        Promise.all([fetchLoansGiven(), fetchLoansReceived()]),
        timeout,
      ]);
      setGiven(g);
      setReceived(r);
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
    async (id: string, type: LoanType) => {
      // Optimistic update
      if (type === "given") {
        setGiven((prev) =>
          prev.map((l) =>
            l.id === id
              ? { ...l, months_paid: Math.min(l.months_paid + 1, l.total_months) }
              : l
          )
        );
      } else {
        setReceived((prev) =>
          prev.map((l) =>
            l.id === id
              ? { ...l, months_paid: Math.min(l.months_paid + 1, l.total_months) }
              : l
          )
        );
      }

      try {
        await markLoanMonthPaid(id, type);
      } catch (err) {
        await load();
        throw err;
      }
    },
    [load]
  );

  return {
    given,
    received,
    loading,
    error,
    createLoan,
    updateLoan,
    deleteLoan,
    markPaid,
    refresh: load,
  };
}
