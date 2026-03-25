"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { z } from "zod";
import { useLoans } from "@/lib/hooks/useLoans";
import {
  fetchLoanGivenById,
  fetchLoanReceivedById,
  type LoanType,
} from "@/lib/supabase/loans";

const MONTHS_OPTIONS = [3, 6, 9, 12, 18, 24];

const loanSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  amount: z.number().positive("El monto debe ser mayor a 0"),
  total_months: z
    .number()
    .int("Debe ser un número entero")
    .min(1, "Mínimo 1 mes")
    .max(120, "Máximo 120 meses"),
  start_date: z.string().min(1, "Fecha requerida"),
  notes: z.string().nullable(),
});

function formatCurrency(n: number): string {
  return n.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export default function EditLoanPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { updateLoan } = useLoans();

  const direction = (searchParams.get("type") as LoanType) || "given";
  const [loadingLoan, setLoadingLoan] = useState(true);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [totalMonths, setTotalMonths] = useState<number>(0);
  const [customMonths, setCustomMonths] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

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

      setName(personName);
      setAmount(String(data.amount));
      setTotalMonths(data.total_months);
      if (!MONTHS_OPTIONS.includes(data.total_months)) {
        setCustomMonths(true);
      }
      setStartDate(data.start_date);
      setNotes(data.notes ?? "");
      setLoadingLoan(false);
    }
    load();
  }, [params.id, direction, router]);

  const parsedAmount = useMemo(() => {
    const n = parseFloat(amount);
    return isNaN(n) ? 0 : n;
  }, [amount]);

  const monthlyPreview = useMemo(() => {
    if (parsedAmount > 0 && totalMonths > 0) return parsedAmount / totalMonths;
    return 0;
  }, [parsedAmount, totalMonths]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const data = {
      name,
      amount: parsedAmount,
      total_months: totalMonths,
      start_date: startDate,
      notes: notes.trim() || null,
    };

    const parsed = loanSchema.safeParse(data);

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string") {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    const computedMonthly = parsed.data.amount / parsed.data.total_months;
    try {
      if (direction === "given") {
        await updateLoan(
          params.id,
          {
            borrower_name: parsed.data.name,
            amount: parsed.data.amount,
            monthly_payment: computedMonthly,
            total_months: parsed.data.total_months,
            start_date: parsed.data.start_date,
            notes: parsed.data.notes,
          },
          "given"
        );
      } else {
        await updateLoan(
          params.id,
          {
            lender_name: parsed.data.name,
            amount: parsed.data.amount,
            monthly_payment: computedMonthly,
            total_months: parsed.data.total_months,
            start_date: parsed.data.start_date,
            notes: parsed.data.notes,
          },
          "received"
        );
      }
      router.push("/loans");
    } catch (err) {
      setErrors({
        form: err instanceof Error ? err.message : "Error al guardar",
      });
      setSubmitting(false);
    }
  }

  const inputClass =
    "h-12 w-full rounded-[10px] border border-[#EBEBEB] bg-white px-3.5 text-[15px] text-[#1A1A1A] placeholder:text-[#A8A8A8] focus:border-[#2C6CFF] focus:outline-none focus:ring-[3px] focus:ring-[#2C6CFF]/12";

  if (loadingLoan) {
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

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Name */}
        <div>
          <label htmlFor="name" className="mb-1.5 block text-[13px] font-medium text-[#1A1A1A]">
            {direction === "given"
              ? "¿A quién le prestaste?"
              : "¿Quién te prestó?"}
          </label>
          <input
            id="name"
            type="text"
            placeholder="Nombre de la persona"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
          {errors.name && (
            <p className="mt-1 text-[13px] text-[#EF4444]">{errors.name}</p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label htmlFor="amount" className="mb-1.5 block text-[13px] font-medium text-[#1A1A1A]">
            Monto total
          </label>
          <input
            id="amount"
            type="text"
            inputMode="decimal"
            placeholder="$0"
            value={amount}
            onChange={(e) =>
              setAmount(e.target.value.replace(/[^0-9.]/g, ""))
            }
            className={`${inputClass} font-mono`}
          />
          {errors.amount && (
            <p className="mt-1 text-[13px] text-[#EF4444]">{errors.amount}</p>
          )}
        </div>

        {/* Months */}
        <div>
          <label htmlFor="months" className="mb-1.5 block text-[13px] font-medium text-[#1A1A1A]">
            Número de meses
          </label>
          {customMonths ? (
            <div>
              <input
                id="months"
                type="text"
                inputMode="numeric"
                placeholder="Ej. 36"
                value={totalMonths === 0 ? "" : String(totalMonths)}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "");
                  const n = v === "" ? 0 : Math.min(parseInt(v, 10), 120);
                  setTotalMonths(n);
                }}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => {
                  setCustomMonths(false);
                  setTotalMonths(0);
                }}
                className="mt-1.5 text-[13px] text-[#2C6CFF]"
              >
                ← Volver
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              {MONTHS_OPTIONS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTotalMonths(m)}
                  className={`flex h-11 flex-1 items-center justify-center rounded-xl text-[15px] font-medium transition-colors ${
                    totalMonths === m
                      ? "bg-[#2C6CFF] text-white"
                      : "bg-white border border-[#EBEBEB] text-[#6B6B6B]"
                  }`}
                >
                  {m}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setCustomMonths(true);
                  setTotalMonths(0);
                }}
                className="flex h-11 flex-1 items-center justify-center rounded-xl text-[15px] font-medium transition-colors bg-white border border-[#EBEBEB] text-[#6B6B6B]"
              >
                Otro...
              </button>
            </div>
          )}
          {errors.total_months && (
            <p className="mt-1 text-[13px] text-[#EF4444]">{errors.total_months}</p>
          )}
        </div>

        {/* Summary preview */}
        {monthlyPreview > 0 && (
          <div className="rounded-xl bg-[#EEF3FF] px-3.5 py-3.5 text-center">
            <p className="text-[13px] text-[#6B6B6B]">{direction === "given" ? "Recibirás" : "Pagarás"}</p>
            <p className="font-mono text-[20px] font-medium text-[#2C6CFF]">{formatCurrency(monthlyPreview)}</p>
            <p className="text-[13px] text-[#6B6B6B]">por mes durante {totalMonths} meses</p>
          </div>
        )}

        {/* Start date */}
        <div>
          <label
            htmlFor="startDate"
            className="mb-1.5 block text-[13px] font-medium text-[#1A1A1A]"
          >
            Fecha de inicio
          </label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={inputClass}
          />
          {errors.start_date && (
            <p className="mt-1 text-[13px] text-[#EF4444]">{errors.start_date}</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="mb-1.5 block text-[13px] font-medium text-[#1A1A1A]">
            Notas (opcional)
          </label>
          <textarea
            id="notes"
            placeholder="Detalles adicionales..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className={inputClass}
          />
        </div>

        {errors.form && (
          <p className="text-[14px] text-[#EF4444]">{errors.form}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 flex h-[52px] w-full items-center justify-center rounded-xl bg-[#2C6CFF] font-display text-[16px] font-semibold text-white disabled:opacity-50"
        >
          {submitting ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </main>
  );
}
