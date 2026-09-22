"use client";

import useSWR from "swr";
import type { Category } from "@/types";
import { fetchCategories } from "@/lib/db/categories";
import { fetchBudgetsForMonth, upsertBudget } from "@/lib/db/budgets";
import { fetchExpensesInRange } from "@/lib/db/transactions";
import { swrKeys, revalidateFinanceData } from "@/lib/swr/finance";

export interface CategoryBudgetRow {
  category: Category;
  assigned: number; // 0 si no hay presupuesto asignado
  spent: number;
}

interface UseBudgetReturn {
  monthLabel: string;
  rows: CategoryBudgetRow[];
  loading: boolean;
  error: string | null;
  setAssigned: (categoryId: string, amount: number) => Promise<void>;
  refresh: () => Promise<void>;
}

function currentMonthRange(): { monthStart: string; monthEnd: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0);
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { monthStart: fmt(start), monthEnd: fmt(end) };
}

async function fetchBudgetRows(monthStart: string, monthEnd: string): Promise<CategoryBudgetRow[]> {
  const [categories, budgets, expenses] = await Promise.all([
    fetchCategories(),
    fetchBudgetsForMonth(monthStart),
    fetchExpensesInRange(monthStart, monthEnd),
  ]);

  const assignedByCategory = new Map(budgets.map((b) => [b.category_id, b.amount]));
  const spentByCategory = new Map<string, number>();
  for (const expense of expenses) {
    if (!expense.category_id) continue;
    spentByCategory.set(expense.category_id, (spentByCategory.get(expense.category_id) ?? 0) + expense.amount);
  }

  return categories.map((category) => ({
    category,
    assigned: assignedByCategory.get(category.id) ?? 0,
    spent: spentByCategory.get(category.id) ?? 0,
  }));
}

export function useBudget(): UseBudgetReturn {
  const { monthStart, monthEnd } = currentMonthRange();
  const { data, error, isLoading, mutate } = useSWR<CategoryBudgetRow[]>(swrKeys.budget, () =>
    fetchBudgetRows(monthStart, monthEnd)
  );
  const rows = data ?? [];

  async function setAssigned(categoryId: string, amount: number): Promise<void> {
    await mutate(
      (prev) => (prev ?? []).map((r) => (r.category.id === categoryId ? { ...r, assigned: amount } : r)),
      { revalidate: false }
    );
    try {
      await upsertBudget({ category_id: categoryId, month: monthStart, amount });
      await revalidateFinanceData();
    } catch (err) {
      await mutate();
      throw err;
    }
  }

  const monthLabel = new Date(`${monthStart}T00:00:00`).toLocaleDateString("es-MX", { month: "long", year: "numeric" });

  return {
    monthLabel: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
    rows,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : "Error al cargar el presupuesto") : null,
    setAssigned,
    refresh: async () => {
      await mutate();
    },
  };
}
