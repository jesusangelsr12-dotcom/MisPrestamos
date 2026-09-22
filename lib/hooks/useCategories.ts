"use client";

import useSWR from "swr";
import type { Category } from "@/types";
import { fetchCategories, insertCategory, deleteCategoryById } from "@/lib/db/categories";
import { swrKeys } from "@/lib/swr/finance";

interface UseCategoriesReturn {
  categories: Category[];
  loading: boolean;
  createCategory: (name: string) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
}

export function useCategories(): UseCategoriesReturn {
  const { data, isLoading, mutate } = useSWR<Category[]>(swrKeys.categories, fetchCategories);
  const categories = data ?? [];

  async function createCategory(name: string): Promise<Category> {
    const created = await insertCategory(name);
    await mutate(
      (prev) =>
        prev?.some((c) => c.id === created.id)
          ? prev
          : [...(prev ?? []), created].sort((a, b) => a.name.localeCompare(b.name)),
      { revalidate: false }
    );
    return created;
  }

  async function deleteCategory(id: string): Promise<void> {
    const previous = categories;
    await mutate(
      categories.filter((c) => c.id !== id),
      { revalidate: false }
    );
    try {
      await deleteCategoryById(id);
    } catch (err) {
      await mutate(previous, { revalidate: false });
      throw err;
    }
  }

  return { categories, loading: isLoading, createCategory, deleteCategory };
}
