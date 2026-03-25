"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { motion } from "framer-motion";
import type { CardInput } from "@/lib/supabase/cards";

const PRESET_COLORS = [
  "#2C6CFF",
  "#00A878",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#0EA5E9",
  "#1A1A1A",
];

const cardSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  bank: z.string().min(1, "Banco requerido"),
  last_four: z
    .string()
    .length(4, "Deben ser 4 dígitos")
    .regex(/^\d{4}$/, "Solo dígitos"),
  color: z.string().min(1, "Selecciona un color"),
});

interface CardFormProps {
  initialData?: CardInput;
  onSubmit: (data: CardInput) => Promise<void>;
  submitLabel: string;
}

export function CardForm({ initialData, onSubmit, submitLabel }: CardFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialData?.name ?? "");
  const [bank, setBank] = useState(initialData?.bank ?? "");
  const [lastFour, setLastFour] = useState(initialData?.last_four ?? "");
  const [color, setColor] = useState(initialData?.color ?? PRESET_COLORS[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const data = { name, bank, last_four: lastFour, color };
    const parsed = cardSchema.safeParse(data);

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
      await onSubmit(parsed.data);
      router.push("/cards");
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Name */}
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
          Nombre
        </label>
        <input
          id="name"
          type="text"
          placeholder='Ej. "Visa Azul"'
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name}</p>
        )}
      </div>

      {/* Bank */}
      <div>
        <label htmlFor="bank" className="mb-1.5 block text-sm font-medium">
          Banco
        </label>
        <input
          id="bank"
          type="text"
          placeholder="Ej. BBVA"
          value={bank}
          onChange={(e) => setBank(e.target.value)}
          className={inputClass}
        />
        {errors.bank && (
          <p className="mt-1 text-sm text-red-500">{errors.bank}</p>
        )}
      </div>

      {/* Last Four */}
      <div>
        <label htmlFor="lastFour" className="mb-1.5 block text-sm font-medium">
          Últimos 4 dígitos
        </label>
        <input
          id="lastFour"
          type="text"
          inputMode="numeric"
          maxLength={4}
          placeholder="0000"
          value={lastFour}
          onChange={(e) => setLastFour(e.target.value.replace(/\D/g, ""))}
          className={`${inputClass} font-mono tracking-widest`}
        />
        {errors.last_four && (
          <p className="mt-1 text-sm text-red-500">{errors.last_four}</p>
        )}
      </div>

      {/* Color Picker */}
      <div>
        <span className="mb-2 block text-sm font-medium">Color</span>
        <div className="flex flex-wrap gap-3">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="flex h-9 w-9 items-center justify-center rounded-full transition-transform"
              style={{ backgroundColor: c }}
              aria-label={`Color ${c}`}
            >
              {color === c && (
                <motion.svg
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </motion.svg>
              )}
            </button>
          ))}
        </div>
        {errors.color && (
          <p className="mt-1 text-sm text-red-500">{errors.color}</p>
        )}
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
        {submitting ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}
