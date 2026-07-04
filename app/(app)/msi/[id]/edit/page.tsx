"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { fetchMSIById } from "@/lib/supabase/msi";
import { useMSI } from "@/lib/hooks/useMSI";
import { MSIForm, type MSIFormValues } from "@/components/features/MSIForm";
import type { MSIExpenseWithCard } from "@/types";

export default function EditMSIPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { updateExpense } = useMSI();

  const [expense, setExpense] = useState<MSIExpenseWithCard | null>(null);
  const [initialValues, setInitialValues] = useState<MSIFormValues | null>(null);

  useEffect(() => {
    async function load() {
      const data = await fetchMSIById(params.id);
      if (!data) {
        router.replace("/msi");
        return;
      }
      setExpense(data);
      setInitialValues({
        description: data.description,
        total_amount: data.total_amount,
        months: data.months,
        start_date: data.start_date,
        owner: data.owner,
        owner_name: data.owner_name,
        has_final_payment: data.has_final_payment,
        final_payment_amount: data.final_payment_amount,
      });
    }
    load();
  }, [params.id, router]);

  async function handleSubmit(values: MSIFormValues) {
    await updateExpense(params.id, values);
  }

  if (!initialValues) {
    return (
      <main className="flex min-h-screen items-center justify-center pb-safe pt-safe">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2C6CFF] border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 pb-safe pt-safe">
      <div className="pb-4 pt-6">
        <button type="button" onClick={() => router.back()} className="mb-3 flex items-center gap-1 text-[14px] text-[#2C6CFF]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          Volver
        </button>
        <h1 className="font-display text-[24px] font-semibold text-[#1A1A1A]" style={{ letterSpacing: "-0.5px" }}>Editar gasto MSI</h1>
        {expense && (
          <p className="mt-1 text-[13px] text-[#6B6B6B]">{expense.card.bank} · {expense.card.name}</p>
        )}
      </div>

      <MSIForm
        initialValues={initialValues}
        submitLabel="Guardar cambios"
        onSubmit={handleSubmit}
      />
    </main>
  );
}
