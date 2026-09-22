"use client";

import { useState, useEffect, useCallback } from "react";
import type { Category } from "@/types";
import { fetchCategories, insertCategory, deleteCategoryById } from "@/lib/db/categories";

interface UseCategoriesReturn {
  categories: Category[];
  loading: boolean;
  createCategory: (name: string) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
}

export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch((err) => console.error("[useCategories] Error:", err))
      .finally(() => setLoading(false));
  }, []);

  const createCategory = useCallback(async (name: string): Promise<Category> => {
    const created = await insertCategory(name);
    setCategories((prev) =>
      prev.some((c) => c.id === created.id) ? prev : [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
    );
    return created;
  }, []);

  const deleteCategory = useCallback(async (id: string): Promise<void> => {
    const previous = categories;
    setCategories((prev) => prev.filter((c) => c.id !== id));
    try {
      await deleteCategoryById(id);
    } catch (err) {
      setCategories(previous);
      throw err;
    }
  }, [categories]);

  return { categories, loading, createCategory, deleteCategory };
}
