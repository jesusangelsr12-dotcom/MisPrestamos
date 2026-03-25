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
  monthly_payment: z.number().positive("El pago mensual debe ser mayor a 0"),
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
  const [monthlyPayment, setMonthlyPayment] = useState("");
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
      setMonthlyPayment(String(data.monthly_payment));
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

  const parsedMonthly = useMemo(() => {
    const n = parseFloat(monthlyPayment);
    return isNaN(n) ? 0 : n;
  }, [monthlyPayment]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const data = {
      name,
      amount: parsedAmount,
      monthly_payment: parsedMonthly,
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
    try {
      if (direction === "given") {
        await updateLoan(
          params.id,
          {
            borrower_name: parsed.data.name,
            amount: parsed.data.amount,
            monthly_payment: parsed.data.monthly_payment,
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
            monthly_payment: parsed.data.monthly_payment,
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

  if (loadingLoan) {
    return (
      <main className="flex min-h-screen items-center justify-center pb-safe pt-safe">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </main>
    );
  }

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
        <h1 className="text-2xl font-bold font-display">Editar préstamo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {direction === "given" ? "Presté 💸" : "Me prestaron 📥"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Name */}
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
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

        {/* Monthly payment */}
        <div>
          <label
            htmlFor="monthlyPayment"
            className="mb-1.5 block text-sm font-medium"
          >
            Pago mensual
          </label>
          <input
            id="monthlyPayment"
            type="text"
            inputMode="decimal"
            placeholder="$0"
            value={monthlyPayment}
            onChange={(e) =>
              setMonthlyPayment(e.target.value.replace(/[^0-9.]/g, ""))
            }
            className={`${inputClass} font-mono`}
          />
          {errors.monthly_payment && (
            <p className="mt-1 text-sm text-red-500">
              {errors.monthly_payment}
            </p>
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
        {parsedMonthly > 0 && totalMonths > 0 && (
          <div className="rounded-xl bg-accent/5 px-4 py-3 text-center">
            <p className="text-sm text-muted-foreground">
              {direction === "given" ? "Recibirás" : "Pagarás"}
            </p>
            <p className="font-mono text-xl font-medium text-accent">
              {formatCurrency(parsedMonthly)}
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
          {submitting ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </main>
  );
}
