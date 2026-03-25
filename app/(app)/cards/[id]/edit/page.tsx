"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { CardForm } from "@/components/features/CardForm";
import { useCards } from "@/lib/hooks/useCards";
import { fetchCardById } from "@/lib/supabase/cards";
import type { CardInput } from "@/lib/supabase/cards";
import type { Card } from "@/types";

export default function EditCardPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { updateCard } = useCards();
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCardById(params.id).then((data) => { setCard(data); setLoading(false); });
  }, [params.id]);

  async function handleSubmit(data: CardInput) {
    await updateCard(params.id, data);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2C6CFF] border-t-transparent" />
      </main>
    );
  }

  if (!card) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-2">
        <p className="text-[15px] text-[#6B6B6B]">Tarjeta no encontrada</p>
        <button type="button" onClick={() => router.push("/cards")} className="text-[14px] text-[#2C6CFF] underline">Volver</button>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 pb-safe pt-safe">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="pb-6 pt-6">
          <button type="button" onClick={() => router.back()} className="mb-3 flex items-center gap-1 text-[14px] text-[#2C6CFF]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            Volver
          </button>
          <h1 className="font-display text-[24px] font-semibold text-[#1A1A1A]" style={{ letterSpacing: "-0.5px" }}>Editar tarjeta</h1>
        </div>
        <CardForm initialData={{ name: card.name, bank: card.bank, last_four: card.last_four, color: card.color }} onSubmit={handleSubmit} submitLabel="Guardar cambios" />
      </motion.div>
    </main>
  );
}
