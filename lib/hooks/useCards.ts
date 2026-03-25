"use client";

import { useState, useEffect, useCallback } from "react";
import type { Card } from "@/types";
import {
  fetchCards,
  insertCard,
  updateCardById,
  deleteCardById,
  type CardInput,
} from "@/lib/supabase/cards";

interface UseCardsReturn {
  cards: Card[];
  loading: boolean;
  error: string | null;
  createCard: (data: CardInput) => Promise<Card>;
  updateCard: (id: string, data: Partial<CardInput>) => Promise<Card>;
  deleteCard: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useCards(): UseCardsReturn {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Tiempo de espera agotado")), 5000)
      );

      const data = await Promise.race([fetchCards(), timeout]);
      setCards(data);
    } catch (err) {
      console.error("[useCards] Error loading cards:", err);
      setError(err instanceof Error ? err.message : "Error al cargar tarjetas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const createCard = useCallback(
    async (data: CardInput): Promise<Card> => {
      // Optimistic: add a temp card at the top
      const tempId = `temp-${Date.now()}`;
      const optimistic: Card = {
        ...data,
        id: tempId,
        created_at: new Date().toISOString(),
      };
      setCards((prev) => [optimistic, ...prev]);

      try {
        const created = await insertCard(data);
        setCards((prev) =>
          prev.map((c) => (c.id === tempId ? created : c))
        );
        return created;
      } catch (err) {
        // Rollback
        setCards((prev) => prev.filter((c) => c.id !== tempId));
        throw err;
      }
    },
    []
  );

  const updateCard = useCallback(
    async (id: string, data: Partial<CardInput>): Promise<Card> => {
      const previous = cards.find((c) => c.id === id);

      // Optimistic update
      setCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...data } : c))
      );

      try {
        const updated = await updateCardById(id, data);
        setCards((prev) =>
          prev.map((c) => (c.id === id ? updated : c))
        );
        return updated;
      } catch (err) {
        // Rollback
        if (previous) {
          setCards((prev) =>
            prev.map((c) => (c.id === id ? previous : c))
          );
        }
        throw err;
      }
    },
    [cards]
  );

  const deleteCard = useCallback(
    async (id: string): Promise<void> => {
      const previous = cards.find((c) => c.id === id);

      // Optimistic delete
      setCards((prev) => prev.filter((c) => c.id !== id));

      try {
        await deleteCardById(id);
      } catch (err) {
        // Rollback
        if (previous) {
          setCards((prev) => [previous, ...prev]);
        }
        throw err;
      }
    },
    [cards]
  );

  return {
    cards,
    loading,
    error,
    createCard,
    updateCard,
    deleteCard,
    refresh: loadCards,
  };
}
