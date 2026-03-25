"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CardListItem } from "@/components/features/CardListItem";
import { useCards } from "@/lib/hooks/useCards";
import type { Card } from "@/types";

export default function CardsPage() {
  const { cards, loading, error: loadError, deleteCard, refresh } = useCards();
  const [selected, setSelected] = useState<Card | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function handleDelete() {
    if (!selected) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteCard(selected.id);
      setSelected(null);
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Error al eliminar"
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="min-h-screen px-5 pb-safe pt-safe">
      {/* Header */}
      <div className="pb-4 pt-6">
        <h1 className="text-2xl font-bold font-display">Tarjetas</h1>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : loadError ? (
        <div className="flex flex-col items-center justify-center gap-3 pt-20">
          <p className="text-sm text-red-500">{loadError}</p>
          <button
            type="button"
            onClick={() => refresh()}
            className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white"
          >
            Reintentar
          </button>
        </div>
      ) : cards.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center gap-4 pt-20">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          </div>
          <p className="text-[15px] font-medium text-foreground">
            Agrega tu primera tarjeta
          </p>
          <p className="text-sm text-muted-foreground">
            Empieza registrando tus tarjetas de crédito
          </p>
          <Link
            href="/cards/new"
            className="mt-2 rounded-xl bg-accent px-6 py-3 text-[15px] font-semibold text-white"
          >
            Agregar tarjeta
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {cards.map((card, i) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <CardListItem
                name={card.name}
                bank={card.bank}
                lastFour={card.last_four}
                color={card.color}
                onTap={() => setSelected(card)}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* FAB */}
      {cards.length > 0 && (
        <Link
          href="/cards/new"
          className="fixed bottom-6 right-5 flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-accent text-white shadow-md mb-safe"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </Link>
      )}

      {/* Action Sheet */}
      <AnimatePresence>
        {selected && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelected(null);
                setDeleteError("");
              }}
              className="fixed inset-0 z-40 bg-black/30"
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-white px-5 pb-safe pt-5"
            >
              <div className="mb-4 flex items-center gap-3">
                <span
                  className="block h-3 w-3 rounded-full"
                  style={{ backgroundColor: selected.color }}
                />
                <div>
                  <p className="text-[15px] font-semibold">{selected.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selected.bank} •••• {selected.last_four}
                  </p>
                </div>
              </div>

              {deleteError && (
                <p className="mb-3 text-sm text-red-500">{deleteError}</p>
              )}

              <div className="flex flex-col gap-2">
                <Link
                  href={`/cards/${selected.id}/edit`}
                  className="flex h-12 items-center justify-center rounded-xl bg-muted text-[15px] font-medium text-foreground"
                >
                  Editar
                </Link>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex h-12 items-center justify-center rounded-xl text-[15px] font-medium text-red-500 disabled:opacity-50"
                >
                  {deleting ? "Eliminando..." : "Eliminar"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(null);
                    setDeleteError("");
                  }}
                  className="flex h-12 items-center justify-center rounded-xl text-[15px] text-muted-foreground"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
