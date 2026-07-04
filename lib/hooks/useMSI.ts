"use client";

import { useState, useEffect, useCallback } from "react";
import type { MSIExpenseWithCard } from "@/types";
import {
  fetchMSIExpenses,
  fetchMSIPaymentTotals,
  insertMSI,
  updateMSIById,
  deleteMSIById,
  markMSIMonthPaid,
} from "@/lib/supabase/msi";
import type { MSIInput } from "@/lib/supabase/types";

interface UseMSIReturn {
  expenses: MSIExpenseWithCard[];
  // Total realmente pagado por gasto (suma del historial). undefined = sin
  // historial → la card cae a la estimación monthly_amount × months_paid.
  paidTotals: Record<string, number>;
  loading: boolean;
  error: string | null;
  createExpense: (data: MSIInput) => Promise<void>;
  updateExpense: (id: string, data: Partial<Omit<MSIInput, "card_id">>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  markPaid: (id: string, amount: number, monthsCovered: number) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useMSI(): UseMSIReturn {
  const [expenses, setExpenses] = useState<MSIExpenseWithCard[]>([]);
  const [paidTotals, setPaidTotals] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Tiempo de espera agotado")), 5000)
      );

      const [data, totals] = await Promise.race([
        Promise.all([fetchMSIExpenses(), fetchMSIPaymentTotals()]),
        timeout,
      ]);
      setExpenses(data);
      setPaidTotals(totals);
    } catch (err) {
      console.error("[useMSI] Error loading expenses:", err);
      setError(err instanceof Error ? err.message : "Error al cargar gastos MSI");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const createExpense = useCallback(async (data: MSIInput) => {
    await insertMSI(data);
    await loadExpenses();
  }, [loadExpenses]);

  const updateExpense = useCallback(
    async (id: string, data: Partial<Omit<MSIInput, "card_id">>) => {
      await updateMSIById(id, data);
      await loadExpenses();
    },
    [loadExpenses]
  );

  const deleteExpense = useCallback(
    async (id: string) => {
      const previous = [...expenses];
      setExpenses((prev) => prev.filter((e) => e.id !== id));

      try {
        await deleteMSIById(id);
      } catch (err) {
        setExpenses(previous);
        throw err;
      }
    },
    [expenses]
  );

  const markPaid = useCallback(
    async (id: string, amount: number, monthsCovered: number) => {
      const target = expenses.find((e) => e.id === id);

      // Optimistic update: contador de meses y total pagado juntos.
      setExpenses((prev) =>
        prev.map((e) => {
          if (e.id !== id) return e;
          const total = e.has_final_payment ? e.months + 1 : e.months;
          return { ...e, months_paid: Math.min(e.months_paid + monthsCovered, total) };
        })
      );
      setPaidTotals((prev) => {
        const base =
          prev[id] ??
          (target ? target.monthly_amount * Math.min(target.months_paid, target.months) : 0);
        return { ...prev, [id]: base + amount };
      });

      try {
        await markMSIMonthPaid(id, amount, monthsCovered);
      } catch (err) {
        await loadExpenses();
        throw err;
      }
    },
    [expenses, loadExpenses]
  );

  return {
    expenses,
    paidTotals,
    loading,
    error,
    createExpense,
    updateExpense,
    deleteExpense,
    markPaid,
    refresh: loadExpenses,
  };
}
