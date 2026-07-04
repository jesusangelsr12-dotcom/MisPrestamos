"use client";

import { useRouter } from "next/navigation";
import { useCards } from "@/lib/hooks/useCards";
import { useMSI } from "@/lib/hooks/useMSI";
import { MSIForm, type MSIFormValues } from "@/components/features/MSIForm";

export default function NewMSIPage() {
  const router = useRouter();
  const { cards, loading: cardsLoading } = useCards();
  const { createExpense } = useMSI();

  async function handleSubmit(values: MSIFormValues, cardId: string) {
    await createExpense({ card_id: cardId, ...values });
  }

  return (
    <main className="min-h-screen px-5 pb-safe pt-safe">
      <div className="pb-4 pt-6">
        <button type="button" onClick={() => router.back()} className="mb-3 flex items-center gap-1 text-[14px] text-[#2C6CFF]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          Volver
        </button>
        <h1 className="font-display text-[24px] font-semibold text-[#1A1A1A]" style={{ letterSpacing: "-0.5px" }}>Nuevo gasto MSI</h1>
      </div>

      <MSIForm
        cards={cards}
        cardsLoading={cardsLoading}
        submitLabel="Agregar gasto MSI"
        onSubmit={handleSubmit}
      />
    </main>
  );
}
