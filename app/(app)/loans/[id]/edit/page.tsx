"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useLoans } from "@/lib/hooks/useLoans";
import { fetchLoanGivenById, fetchLoanReceivedById } from "@/lib/supabase/loans";
import { LoanForm, type LoanFormValues } from "@/components/features/LoanForm";
import type { LoanType } from "@/lib/supabase/types";

export default function EditLoanPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2C6CFF] border-t-transparent" /></main>}>
      <EditLoanContent />
    </Suspense>
  );
}

function EditLoanContent() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { updateLoan } = useLoans();

  const direction = (searchParams.get("type") as LoanType) || "given";
  const [initialValues, setInitialValues] = useState<LoanFormValues | null>(null);

  useEffect(() => {
    async function load() {
      const data =
        direction === "given"
          ? await fetchLoanGivenById(params.id)
          : await fetchLoanReceivedById(params.id);

      if (!data) {
        router.replace("/loans");
        return;
      }

      const personName =
        direction === "given"
          ? (data as { borrower_name: string }).borrower_name
          : (data as { lender_name: string }).lender_name;

      setInitialValues({
        name: personName,
        amount: data.amount,
        total_months: data.total_months,
        start_date: data.start_date,
        notes: data.notes,
      });
    }
    load();
  }, [params.id, direction, router]);

  async function handleSubmit(values: LoanFormValues, dir: LoanType) {
    const monthly_payment = values.amount / values.total_months;
    const base = {
      amount: values.amount,
      monthly_payment,
      total_months: values.total_months,
      start_date: values.start_date,
      notes: values.notes,
    };
    if (dir === "given") {
      await updateLoan(params.id, { borrower_name: values.name, ...base }, "given");
    } else {
      await updateLoan(params.id, { lender_name: values.name, ...base }, "received");
    }
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
        <h1 className="font-display text-[24px] font-semibold text-[#1A1A1A]" style={{ letterSpacing: "-0.5px" }}>Editar préstamo</h1>
        <p className="mt-1 text-[13px] text-[#6B6B6B]">{direction === "given" ? "Presté 💸" : "Me prestaron 📥"}</p>
      </div>

      <LoanForm
        initialType={direction}
        allowDirectionToggle={false}
        initialValues={initialValues}
        submitLabel="Guardar cambios"
        onSubmit={handleSubmit}
      />
    </main>
  );
}
