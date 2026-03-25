"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { useLoans } from "@/lib/hooks/useLoans";
import type { LoanType } from "@/lib/supabase/loans";

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

export default function NewLoanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createLoan } = useLoans();

  const initialType = (searchParams.get("type") as LoanType) || "given";
  const [direction, setDirection] = useState<LoanType>(initialType);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [totalMonths, setTotalMonths] = useState<number>(0);
  const [customMonths, setCustomMonths] = useState(false);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

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
        await createLoan(
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
        await createLoan(
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
    "w-full rounded-xl border border-[#EBEBEB] bg-white px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

  return (
    <main className="min-h-screen px-5 pb-safe pt-safe">
      <div className="pb-4 pt-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-2 text-sm text-accent"
        >
          ← Volver
        </button>
        <h1 className="text-2xl font-bold font-display">Nuevo préstamo</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Direction toggle */}
        <div className="flex rounded-xl bg-muted p-1">
          <button
            type="button"
            onClick={() => setDirection("given")}
            className={`flex h-10 flex-1 items-center justify-center rounded-lg text-[15px] font-medium transition-colors ${
              direction === "given"
                ? "bg-accent text-white"
                : "text-muted-foreground"
            }`}
          >
            Presté 💸
          </button>
          <button
            type="button"
            onClick={() => setDirection("received")}
            className={`flex h-10 flex-1 items-center justify-center rounded-lg text-[15px] font-medium transition-colors ${
              direction === "received"
                ? "bg-accent text-white"
                : "text-muted-foreground"
            }`}
          >
            Me prestaron 📥
          </button>
        </div>

        {/* Name */}
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
            {direction === "given" ? "¿A quién le prestaste?" : "¿Quién te prestó?"}
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
            <p className="mt-1 text-sm text-red-500">{errors.name}</p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label htmlFor="amount" className="mb-1.5 block text-sm font-medium">
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
            <p className="mt-1 text-sm text-red-500">{errors.amount}</p>
          )}
        </div>

        {/* Months */}
        <div>
          <label htmlFor="months" className="mb-1.5 block text-sm font-medium">
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
                className="mt-1.5 text-sm text-accent"
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
                      ? "bg-accent text-white"
                      : "bg-muted text-muted-foreground"
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
                className="flex h-11 flex-1 items-center justify-center rounded-xl text-[15px] font-medium transition-colors bg-muted text-muted-foreground"
              >
                Otro...
              </button>
            </div>
          )}
          {errors.total_months && (
            <p className="mt-1 text-sm text-red-500">{errors.total_months}</p>
          )}
        </div>

        {/* Summary preview */}
        {monthlyPreview > 0 && (
          <div className="rounded-xl bg-accent/5 px-4 py-3 text-center">
            <p className="text-sm text-muted-foreground">
              {direction === "given" ? "Recibirás" : "Pagarás"}
            </p>
            <p className="font-mono text-xl font-medium text-accent">
              {formatCurrency(monthlyPreview)}
            </p>
            <p className="text-sm text-muted-foreground">
              por mes durante {totalMonths} meses
            </p>
          </div>
        )}

        {/* Start date */}
        <div>
          <label
            htmlFor="startDate"
            className="mb-1.5 block text-sm font-medium"
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
            <p className="mt-1 text-sm text-red-500">{errors.start_date}</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="mb-1.5 block text-sm font-medium">
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
          <p className="text-sm text-red-500">{errors.form}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 w-full rounded-xl bg-accent py-3.5 text-[15px] font-semibold text-white transition-opacity disabled:opacity-50"
        >
          {submitting ? "Guardando..." : "Agregar préstamo"}
        </button>
      </form>
    </main>
  );
}
