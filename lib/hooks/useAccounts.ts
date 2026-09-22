"use client";

import { useState, useEffect, useCallback } from "react";
import type { Account } from "@/types";
import {
  fetchAccounts,
  insertAccount,
  updateAccountById,
  deleteAccountById,
  type AccountInput,
} from "@/lib/db/accounts";

interface UseAccountsReturn {
  accounts: Account[];
  loading: boolean;
  error: string | null;
  createAccount: (data: AccountInput) => Promise<Account>;
  updateAccount: (id: string, data: Partial<AccountInput>) => Promise<Account>;
  deleteAccount: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useAccounts(): UseAccountsReturn {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Tiempo de espera agotado")), 5000)
      );

      const data = await Promise.race([fetchAccounts(), timeout]);
      setAccounts(data);
    } catch (err) {
      console.error("[useAccounts] Error loading accounts:", err);
      setError(err instanceof Error ? err.message : "Error al cargar cuentas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const createAccount = useCallback(async (data: AccountInput): Promise<Account> => {
    const tempId = `temp-${Date.now()}`;
    const optimistic: Account = { ...data, id: tempId, created_at: new Date().toISOString() };
    setAccounts((prev) => [optimistic, ...prev]);

    try {
      const created = await insertAccount(data);
      setAccounts((prev) => prev.map((a) => (a.id === tempId ? created : a)));
      return created;
    } catch (err) {
      setAccounts((prev) => prev.filter((a) => a.id !== tempId));
      throw err;
    }
  }, []);

  const updateAccount = useCallback(
    async (id: string, data: Partial<AccountInput>): Promise<Account> => {
      const previous = accounts.find((a) => a.id === id);
      setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)));

      try {
        const updated = await updateAccountById(id, data);
        setAccounts((prev) => prev.map((a) => (a.id === id ? updated : a)));
        return updated;
      } catch (err) {
        if (previous) setAccounts((prev) => prev.map((a) => (a.id === id ? previous : a)));
        throw err;
      }
    },
    [accounts]
  );

  const deleteAccount = useCallback(
    async (id: string): Promise<void> => {
      const previous = accounts.find((a) => a.id === id);
      setAccounts((prev) => prev.filter((a) => a.id !== id));

      try {
        await deleteAccountById(id);
      } catch (err) {
        if (previous) setAccounts((prev) => [previous, ...prev]);
        throw err;
      }
    },
    [accounts]
  );

  return {
    accounts,
    loading,
    error,
    createAccount,
    updateAccount,
    deleteAccount,
    refresh: loadAccounts,
  };
}
