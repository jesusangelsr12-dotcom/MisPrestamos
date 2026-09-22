"use client";

import useSWR from "swr";
import type { Account } from "@/types";
import {
  fetchAccounts,
  insertAccount,
  updateAccountById,
  deleteAccountById,
  type AccountInput,
} from "@/lib/db/accounts";
import { swrKeys, revalidateFinanceData } from "@/lib/swr/finance";

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
  const { data, error, isLoading, mutate } = useSWR<Account[]>(swrKeys.accounts, fetchAccounts);
  const accounts = data ?? [];

  async function createAccount(input: AccountInput): Promise<Account> {
    const tempId = `temp-${Date.now()}`;
    const optimistic: Account = { ...input, id: tempId, created_at: new Date().toISOString() };
    await mutate((prev) => [optimistic, ...(prev ?? [])], { revalidate: false });

    try {
      const created = await insertAccount(input);
      await mutate((prev) => (prev ?? []).map((a) => (a.id === tempId ? created : a)), { revalidate: false });
      await revalidateFinanceData();
      return created;
    } catch (err) {
      await mutate((prev) => (prev ?? []).filter((a) => a.id !== tempId), { revalidate: false });
      throw err;
    }
  }

  async function updateAccount(id: string, input: Partial<AccountInput>): Promise<Account> {
    await mutate((prev) => (prev ?? []).map((a) => (a.id === id ? { ...a, ...input } : a)), { revalidate: false });

    try {
      const updated = await updateAccountById(id, input);
      await mutate((prev) => (prev ?? []).map((a) => (a.id === id ? updated : a)), { revalidate: false });
      await revalidateFinanceData();
      return updated;
    } catch (err) {
      await mutate();
      throw err;
    }
  }

  async function deleteAccount(id: string): Promise<void> {
    await mutate((prev) => (prev ?? []).filter((a) => a.id !== id), { revalidate: false });

    try {
      await deleteAccountById(id);
      await revalidateFinanceData();
    } catch (err) {
      await mutate();
      throw err;
    }
  }

  return {
    accounts,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : "Error al cargar cuentas") : null,
    createAccount,
    updateAccount,
    deleteAccount,
    refresh: async () => {
      await mutate();
    },
  };
}
