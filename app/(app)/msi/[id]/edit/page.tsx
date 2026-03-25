"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { z } from "zod";
import { fetchMSIById } from "@/lib/supabase/msi";
import { useMSI } from "@/lib/hooks/useMSI";
import type { MSIExpenseWithCard, ExpenseOwner } from "@/types";

const MONTHS_OPTIONS = [3, 6, 9, 12, 18, 24];

const msiSchema = z.object({
  description: z.string().min(1, "Descripción requerida"),
  total_amount: z.number().positive("El monto debe ser mayor a 0"),
  months: z.number().int("Debe ser un número entero").min(1, "Mínimo 1 mes").max(120, "Máximo 120 meses"),
  start_date: z.string().min(1, "Fecha requerida"),
  owner: z.enum(["me", "other"] as const),
  owner_name: z.string().nullable(),
  has_final_payment: z.boolean(),
  final_payment_amount: z.number().positive("Debe ser mayor a 0").nullable(),
});

function formatCurrency(n: number): string {
  return n.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export default function EditMSIPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { updateExpense } = useMSI();

  const [expense, setExpense] = useState<MSIExpenseWithCard | null>(null);
  const [loadingExpense, setLoadingExpense] = useState(true);

  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [months, setMonths] = useState<number>(0);
  const [startDate, setStartDate] = useState("");
  const [owner, setOwner] = useState<ExpenseOwner>("me");
  const [ownerName, setOwnerName] = useState("");
  const [customMonths, setCustomMonths] = useState(false);
  const [hasFinalPayment, setHasFinalPayment] = useState(false);
  const [finalPaymentAmount, setFinalPaymentAmount] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await fetchMSIById(params.id);
      if (!data) {
        router.replace("/msi");
        return;
      }
      setExpense(data);
      setDescription(data.description);
      setTotalAmount(String(data.total_amount));
      setMonths(data.months);
      if (!MONTHS_OPTIONS.includes(data.months)) {
        setCustomMonths(true);
      }
      setStartDate(data.start_date);
      setOwner(data.owner);
      setOwnerName(data.owner_name ?? "");
      setHasFinalPayment(data.has_final_payment);
      if (data.final_payment_amount) setFinalPaymentAmount(String(data.final_payment_amount));
      setLoadingExpense(false);
    }
    load();
  }, [params.id, router]);

  const parsedAmount = useMemo(() => {
    const n = parseFloat(totalAmount);
    return isNaN(n) ? 0 : n;
  }, [totalAmount]);

  const monthlyPreview = useMemo(() => {
    if (parsedAmount > 0 && months > 0) return parsedAmount / months;
    return 0;
  }, [parsedAmount, months]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const parsedFinal = hasFinalPayment ? parseFloat(finalPaymentAmount) || null : null;
    const data = {
      description,
      total_amount: parsedAmount,
      months,
      start_date: startDate,
      owner,
      owner_name: owner === "other" ? ownerName : null,
      has_final_payment: hasFinalPayment,
      final_payment_amount: parsedFinal,
    };

    const parsed = msiSchema.safeParse(data);

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string") {
          fieldErrors[field] = issue.message;
        }
      }
      if (owner === "other" && !ownerName.trim()) {
        fieldErrors.owner_name = "Nombre requerido";
      }
      setErrors(fieldErrors);
      return;
    }

    if (owner === "other" && !ownerName.trim()) {
      setErrors({ owner_name: "Nombre requerido" });
      return;
    }

    if (hasFinalPayment && (!parsedFinal || parsedFinal <= 0)) {
      setErrors({ final_payment_amount: "Monto del último pago requerido" });
      return;
    }

    setSubmitting(true);
    try {
      await updateExpense(params.id, parsed.data);
      router.push("/msi");
    } catch (err) {
      setErrors({
        form: err instanceof Error ? err.message : "Error al guardar",
      });
      setSubmitting(false);
    }
  }

  const inputClass =
    "h-12 w-full rounded-[10px] border border-[#EBEBEB] bg-white px-3.5 text-[15px] text-[#1A1A1A] placeholder:text-[#A8A8A8] focus:border-[#2C6CFF] focus:outline-none focus:ring-[3px] focus:ring-[#2C6CFF]/12";

  if (loadingExpense) {
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

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Description */}
        <div>
          <label htmlFor="description" className="mb-1.5 block text-[13px] font-medium text-[#1A1A1A]">
            Descripción
          </label>
          <input
            id="description"
            type="text"
            placeholder='Ej. "MacBook Pro"'
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
          />
          {errors.description && (
            <p className="mt-1 text-[13px] text-[#EF4444]">{errors.description}</p>
          )}
        </div>

        {/* Total amount */}
        <div>
          <label htmlFor="total" className="mb-1.5 block text-[13px] font-medium text-[#1A1A1A]">
            Monto total
          </label>
          <input
            id="total"
            type="text"
            inputMode="decimal"
            placeholder="$0"
            value={totalAmount}
            onChange={(e) =>
              setTotalAmount(e.target.value.replace(/[^0-9.]/g, ""))
            }
            className={`${inputClass} font-mono`}
          />
          {errors.total_amount && (
            <p className="mt-1 text-[13px] text-[#EF4444]">{errors.total_amount}</p>
          )}
        </div>

        {/* Months */}
        <div>
          <label htmlFor="months" className="mb-1.5 block text-[13px] font-medium text-[#1A1A1A]">
            Meses
          </label>
          {customMonths ? (
            <div>
              <input
                id="months"
                type="text"
                inputMode="numeric"
                placeholder="Ej. 36"
                value={months === 0 ? "" : String(months)}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "");
                  const n = v === "" ? 0 : Math.min(parseInt(v, 10), 120);
                  setMonths(n);
                }}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => {
                  setCustomMonths(false);
                  setMonths(0);
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
                  onClick={() => setMonths(m)}
                  className={`flex h-11 flex-1 items-center justify-center rounded-xl text-[15px] font-medium transition-colors ${
                    months === m
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
                  setMonths(0);
                }}
                className="flex h-11 flex-1 items-center justify-center rounded-xl text-[15px] font-medium transition-colors bg-white border border-[#EBEBEB] text-[#6B6B6B]"
              >
                Otro...
              </button>
            </div>
          )}
          {errors.months && (
            <p className="mt-1 text-[13px] text-[#EF4444]">{errors.months}</p>
          )}
        </div>

        {/* Monthly preview */}
        {monthlyPreview > 0 && (
          <div className="rounded-xl bg-[#EEF3FF] px-3.5 py-3.5 text-center">
            <p className="text-[13px] text-[#6B6B6B]">Pagarás</p>
            <p className="font-mono text-[20px] font-medium text-[#2C6CFF]">{formatCurrency(monthlyPreview)}</p>
            <p className="text-[13px] text-[#6B6B6B]">por mes durante {months} meses</p>
          </div>
        )}

        {/* Start date */}
        <div>
          <label htmlFor="startDate" className="mb-1.5 block text-[13px] font-medium text-[#1A1A1A]">
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

        {/* Owner toggle */}
        <div>
          <span className="mb-1.5 block text-[13px] font-medium text-[#1A1A1A]">¿De quién es?</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOwner("me")}
              className={`flex h-11 flex-1 items-center justify-center rounded-xl text-[15px] font-medium transition-colors ${
                owner === "me"
                  ? "bg-accent text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              Mío
            </button>
            <button
              type="button"
              onClick={() => setOwner("other")}
              className={`flex h-11 flex-1 items-center justify-center rounded-xl text-[15px] font-medium transition-colors ${
                owner === "other"
                  ? "bg-accent text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              De otra persona
            </button>
          </div>
        </div>

        {/* Owner name */}
        {owner === "other" && (
          <div>
            <label htmlFor="ownerName" className="mb-1.5 block text-[13px] font-medium text-[#1A1A1A]">
              Nombre
            </label>
            <input
              id="ownerName"
              type="text"
              placeholder="Nombre de la persona"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className={inputClass}
            />
            {errors.owner_name && (
              <p className="mt-1 text-[13px] text-[#EF4444]">{errors.owner_name}</p>
            )}
          </div>
        )}

        {/* Final payment */}
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[#1A1A1A]">¿Tiene pago final diferente?</span>
            <button
              type="button"
              onClick={() => { setHasFinalPayment((v) => !v); if (hasFinalPayment) setFinalPaymentAmount(""); }}
              className={`relative h-6 w-11 rounded-full transition-colors ${hasFinalPayment ? "bg-[#2C6CFF]" : "bg-[#E8E8E5]"}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow-sm ${hasFinalPayment ? "translate-x-[22px]" : "translate-x-0.5"}`} />
            </button>
          </div>
          {hasFinalPayment && (
            <div className="mt-3">
              <label htmlFor="finalPayment" className="mb-1.5 block text-[13px] font-medium text-[#1A1A1A]">Monto del último pago</label>
              <input
                id="finalPayment"
                type="text"
                inputMode="decimal"
                placeholder="Ej. 5,000"
                value={finalPaymentAmount}
                onChange={(e) => setFinalPaymentAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                className={`${inputClass} font-mono`}
              />
              {monthlyPreview > 0 && months > 0 && (
                <p className="mt-1 text-[12px] text-[#A8A8A8]">El mes {months} tendrá este monto en lugar de {formatCurrency(monthlyPreview)}</p>
              )}
              {errors.final_payment_amount && (
                <p className="mt-1 text-[13px] text-[#EF4444]">{errors.final_payment_amount}</p>
              )}
            </div>
          )}
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
