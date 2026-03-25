"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CardListItem } from "@/components/features/CardListItem";
import { useCards } from "@/lib/hooks/useCards";
import { BottomNav } from "@/components/features/BottomNav";
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
      setDeleteError(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="min-h-screen px-5 pb-24 pt-safe">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {/* Header */}
        <div className="pb-4 pt-6">
          <h1 className="font-display text-[28px] font-semibold text-[#1A1A1A]" style={{ letterSpacing: "-0.5px" }}>Tarjetas</h1>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2C6CFF] border-t-transparent" />
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center gap-3 pt-20">
            <p className="text-[14px] text-[#EF4444]">{loadError}</p>
            <button type="button" onClick={() => refresh()} className="rounded-[10px] bg-[#2C6CFF] px-5 py-2.5 text-[14px] font-medium text-white">
              Reintentar
            </button>
          </div>
        ) : cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 pt-20">
            <span className="text-[64px]">💳</span>
            <p className="text-[18px] font-semibold text-[#1A1A1A]">Sin tarjetas</p>
            <p className="text-[14px] text-[#6B6B6B]">Agrega tu primera tarjeta para empezar</p>
            <Link href="/cards/new" className="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-[#2C6CFF] text-[15px] font-semibold text-white">
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
                transition={{ delay: Math.min(i * 0.05, 0.3) }}
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
      </motion.div>

      {/* FAB */}
      {cards.length > 0 && (
        <Link
          href="/cards/new"
          className="fixed bottom-24 right-5 flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-[#2C6CFF] text-white"
          style={{ boxShadow: "0 4px 16px rgba(44,108,255,0.35)" }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </Link>
      )}

      {/* Action Sheet */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setSelected(null); setDeleteError(""); }} className="fixed inset-0 z-40 bg-black/30" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-white px-5 pb-safe pt-5">
              <div className="mb-4 flex items-center gap-3">
                <span className="block h-3 w-3 rounded-full" style={{ backgroundColor: selected.color }} />
                <div>
                  <p className="text-[15px] font-semibold text-[#1A1A1A]">{selected.name}</p>
                  <p className="text-[12px] text-[#A8A8A8]">{selected.bank} •••• {selected.last_four}</p>
                </div>
              </div>
              {deleteError && <p className="mb-3 text-[14px] text-[#EF4444]">{deleteError}</p>}
              <div className="flex flex-col gap-2">
                <Link href={`/cards/${selected.id}/edit`} className="flex h-12 items-center justify-center rounded-xl bg-[#F7F7F5] text-[15px] font-medium text-[#1A1A1A]">Editar</Link>
                <button type="button" onClick={handleDelete} disabled={deleting} className="flex h-12 items-center justify-center rounded-xl text-[15px] font-medium text-[#EF4444] disabled:opacity-50">{deleting ? "Eliminando..." : "Eliminar"}</button>
                <button type="button" onClick={() => { setSelected(null); setDeleteError(""); }} className="flex h-12 items-center justify-center rounded-xl text-[15px] text-[#A8A8A8]">Cancelar</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <BottomNav />
    </main>
  );
}
