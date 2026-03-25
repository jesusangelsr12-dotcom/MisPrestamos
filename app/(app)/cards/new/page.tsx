"use client";

import { useRouter } from "next/navigation";
import { CardForm } from "@/components/features/CardForm";
import { useCards } from "@/lib/hooks/useCards";
import type { CardInput } from "@/lib/supabase/cards";

export default function NewCardPage() {
  const router = useRouter();
  const { createCard } = useCards();

  async function handleSubmit(data: CardInput) {
    await createCard(data);
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
        <h1 className="text-xl font-bold font-display">Nueva tarjeta</h1>
      </div>

      <CardForm onSubmit={handleSubmit} submitLabel="Crear tarjeta" />
    </main>
  );
}
