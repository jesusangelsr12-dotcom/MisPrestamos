"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useCards } from "@/lib/hooks/useCards";
import { useMSI } from "@/lib/hooks/useMSI";
import type { ExpenseOwner } from "@/types";

const MONTHS_OPTIONS = [3, 6, 9, 12, 18, 24];

const msiSchema = z.object({
  card_id: z.string().min(1, "Selecciona una tarjeta"),
  description: z.string().min(1, "Descripción requerida"),
  total_amount: z.number().positive("El monto debe ser mayor a 0"),
  months: z.number().refine((v) => MONTHS_OPTIONS.includes(v), "Meses inválidos"),
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

export default function NewMSIPage() {
  const router = useRouter();
  const { cards, loading: cardsLoading } = useCards();
  const { createExpense } = useMSI();

  const [cardId, setCardId] = useState("");
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [months, setMonths] = useState<number>(0);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [owner, setOwner] = useState<ExpenseOwner>("me");
  const [ownerName, setOwnerName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

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
      card_id: cardId,
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
      await createExpense(parsed.data);
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
        <h1 className="text-2xl font-bold font-display">Nuevo gasto MSI</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Card select */}
        <div>
          <label htmlFor="card" className="mb-1.5 block text-sm font-medium">
            Tarjeta
          </label>
          {cardsLoading ? (
            <div className="h-12 animate-pulse rounded-xl bg-muted" />
          ) : cards.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No tienes tarjetas.{" "}
              <a href="/cards/new" className="text-accent underline">
                Agrega una primero
              </a>
            </p>
          ) : (
            <select
              id="card"
              value={cardId}
              onChange={(e) => setCardId(e.target.value)}
              className={inputClass}
            >
              <option value="">Selecciona una tarjeta</option>
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.bank} — {c.name} (•••• {c.last_four})
                </option>
              ))}
            </select>
          )}
          {errors.card_id && (
            <p className="mt-1 text-sm text-red-500">{errors.card_id}</p>
          )}
        </div>

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
          </div>
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
          disabled={submitting || cards.length === 0}
          className="mt-2 w-full rounded-xl bg-accent py-3.5 text-[15px] font-semibold text-white transition-opacity disabled:opacity-50"
        >
          {submitting ? "Guardando..." : "Agregar gasto MSI"}
        </button>
      </form>
    </main>
  );
}
