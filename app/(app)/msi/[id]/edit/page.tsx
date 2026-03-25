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

    const data = {
      description,
      total_amount: parsedAmount,
      months,
      start_date: startDate,
      owner,
      owner_name: owner === "other" ? ownerName : null,
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
    "w-full rounded-xl border border-[#EBEBEB] bg-white px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

  if (loadingExpense) {
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
        <h1 className="text-2xl font-bold font-display">Editar gasto MSI</h1>
        {expense && (
          <p className="mt-1 text-sm text-muted-foreground">
            {expense.card.bank} · {expense.card.name}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Description */}
        <div>
          <label htmlFor="description" className="mb-1.5 block text-sm font-medium">
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
            <p className="mt-1 text-sm text-red-500">{errors.description}</p>
          )}
        </div>

        {/* Total amount */}
        <div>
          <label htmlFor="total" className="mb-1.5 block text-sm font-medium">
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
            <p className="mt-1 text-sm text-red-500">{errors.total_amount}</p>
          )}
        </div>

        {/* Months */}
        <div>
          <label htmlFor="months" className="mb-1.5 block text-sm font-medium">
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
                  onClick={() => setMonths(m)}
                  className={`flex h-11 flex-1 items-center justify-center rounded-xl text-[15px] font-medium transition-colors ${
                    months === m
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
                  setMonths(0);
                }}
                className="flex h-11 flex-1 items-center justify-center rounded-xl text-[15px] font-medium transition-colors bg-muted text-muted-foreground"
              >
                Otro...
              </button>
            </div>
          )}
          {errors.months && (
            <p className="mt-1 text-sm text-red-500">{errors.months}</p>
          )}
        </div>

        {/* Monthly preview */}
        {monthlyPreview > 0 && (
          <div className="rounded-xl bg-accent/5 px-4 py-3 text-center">
            <p className="text-sm text-muted-foreground">Pagarás</p>
            <p className="font-mono text-xl font-medium text-accent">
              {formatCurrency(monthlyPreview)}
            </p>
            <p className="text-sm text-muted-foreground">
              por mes durante {months} meses
            </p>
          </div>
        )}

        {/* Start date */}
        <div>
          <label htmlFor="startDate" className="mb-1.5 block text-sm font-medium">
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

        {/* Owner toggle */}
        <div>
          <span className="mb-1.5 block text-sm font-medium">¿De quién es?</span>
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
            <label htmlFor="ownerName" className="mb-1.5 block text-sm font-medium">
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
              <p className="mt-1 text-sm text-red-500">{errors.owner_name}</p>
            )}
          </div>
        )}

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
