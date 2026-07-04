"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLoans } from "@/lib/hooks/useLoans";
import { LoanForm, type LoanFormValues } from "@/components/features/LoanForm";
import type { LoanType } from "@/lib/supabase/types";

export default function NewLoanPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2C6CFF] border-t-transparent" /></main>}>
      <NewLoanContent />
    </Suspense>
  );
}

function NewLoanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createLoan } = useLoans();
  const initialType = (searchParams.get("type") as LoanType) || "given";

  async function handleSubmit(values: LoanFormValues, direction: LoanType) {
    const monthly_payment = values.amount / values.total_months;
    const base = {
      amount: values.amount,
      monthly_payment,
      total_months: values.total_months,
      start_date: values.start_date,
      notes: values.notes,
    };
    if (direction === "given") {
      await createLoan({ borrower_name: values.name, ...base }, "given");
    } else {
      await createLoan({ lender_name: values.name, ...base }, "received");
    }
  }

  return (
    <main className="min-h-screen px-5 pb-safe pt-safe">
      <div className="pb-4 pt-6">
        <button type="button" onClick={() => router.back()} className="mb-3 flex items-center gap-1 text-[14px] text-[#2C6CFF]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          Volver
        </button>
        <h1 className="font-display text-[24px] font-semibold text-[#1A1A1A]" style={{ letterSpacing: "-0.5px" }}>Nuevo préstamo</h1>
      </div>

      <LoanForm
        initialType={initialType}
        allowDirectionToggle
        submitLabel="Agregar préstamo"
        onSubmit={handleSubmit}
      />
    </main>
  );
}
