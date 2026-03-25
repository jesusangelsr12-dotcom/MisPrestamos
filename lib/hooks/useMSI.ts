"use client";

import { useState, useEffect, useCallback } from "react";
import type { MSIExpenseWithCard } from "@/types";
import {
  fetchMSIExpenses,
  insertMSI,
  updateMSIById,
  deleteMSIById,
  markMSIMonthPaid,
  type MSIInput,
} from "@/lib/supabase/msi";

interface UseMSIReturn {
  expenses: MSIExpenseWithCard[];
  loading: boolean;
  error: string | null;
  createExpense: (data: MSIInput) => Promise<void>;
  updateExpense: (id: string, data: Partial<Omit<MSIInput, "card_id">>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  markPaid: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useMSI(): UseMSIReturn {
  const [expenses, setExpenses] = useState<MSIExpenseWithCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Tiempo de espera agotado")), 5000)
      );

      const data = await Promise.race([fetchMSIExpenses(), timeout]);
      setExpenses(data);
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
    async (id: string) => {
      // Optimistic update
      setExpenses((prev) =>
        prev.map((e) =>
          e.id === id ? { ...e, months_paid: Math.min(e.months_paid + 1, e.months) } : e
        )
      );

      try {
        await markMSIMonthPaid(id);
      } catch (err) {
        // Rollback
        await loadExpenses();
        throw err;
      }
    },
    [loadExpenses]
  );

  return {
    expenses,
    loading,
    error,
    createExpense,
    updateExpense,
    deleteExpense,
    markPaid,
    refresh: loadExpenses,
  };
}
