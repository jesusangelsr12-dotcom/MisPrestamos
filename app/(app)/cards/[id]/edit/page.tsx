"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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
    fetchCardById(params.id).then((data) => {
      setCard(data);
      setLoading(false);
    });
  }, [params.id]);

  async function handleSubmit(data: CardInput) {
    await updateCard(params.id, data);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </main>
    );
  }

  if (!card) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-2">
        <p className="text-[15px] text-muted-foreground">
          Tarjeta no encontrada
        </p>
        <button
          type="button"
          onClick={() => router.push("/cards")}
          className="text-sm text-accent underline"
        >
          Volver
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 pb-safe pt-safe">
      {/* Header */}
      <div className="flex items-center gap-3 pb-6 pt-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-11 w-11 items-center justify-center rounded-xl"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-xl font-bold font-display">Editar tarjeta</h1>
      </div>

      <CardForm
        initialData={{
          name: card.name,
          bank: card.bank,
          last_four: card.last_four,
          color: card.color,
        }}
        onSubmit={handleSubmit}
        submitLabel="Guardar cambios"
      />
    </main>
  );
}
