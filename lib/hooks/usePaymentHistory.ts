"use client";

import { useState, useEffect, useCallback } from "react";
import type { PaymentHistory } from "@/types";
import {
  fetchHistoryByEntity,
  fetchAllHistory,
} from "@/lib/supabase/paymentHistory";

interface UsePaymentHistoryReturn {
  history: PaymentHistory[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function usePaymentHistoryByEntity(
  entityId: string | null
): UsePaymentHistoryReturn {
  const [history, setHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!entityId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchHistoryByEntity(entityId);
      setHistory(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar historial"
      );
    } finally {
      setLoading(false);
    }
  }, [entityId]);

  useEffect(() => {
    load();
  }, [load]);

  return { history, loading, error, refresh: load };
}

export function useAllPaymentHistory(): UsePaymentHistoryReturn {
  const [history, setHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAllHistory();
      setHistory(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar historial"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { history, loading, error, refresh: load };
}
