"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchMSIExpenses } from "@/lib/supabase/msi";
import { fetchLoansGiven, fetchLoansReceived } from "@/lib/supabase/loans";
import {
  calculateMonthlyProjection,
  type MonthProjection,
} from "@/lib/utils/projection";

interface UseProjectionReturn {
  projection: MonthProjection[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useProjection(): UseProjectionReturn {
  const [projection, setProjection] = useState<MonthProjection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Tiempo de espera agotado")), 5000)
      );

      const [msi, lg, lr] = await Promise.race([
        Promise.all([fetchMSIExpenses(), fetchLoansGiven(), fetchLoansReceived()]),
        timeout,
      ]);

      const result = calculateMonthlyProjection(msi, lg, lr, 12);
      setProjection(result);
    } catch (err) {
      console.error("[useProjection] Error:", err);
      setError(err instanceof Error ? err.message : "Error al cargar proyección");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { projection, loading, error, refresh: load };
}
