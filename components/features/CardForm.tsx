"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { motion } from "framer-motion";
import type { CardInput } from "@/lib/supabase/cards";

const PRESET_COLORS = ["#2C6CFF", "#00A878", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#0EA5E9", "#1A1A1A"];

const cardSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  bank: z.string().min(1, "Banco requerido"),
  last_four: z.string().length(4, "Deben ser 4 dígitos").regex(/^\d{4}$/, "Solo dígitos"),
  color: z.string().min(1, "Selecciona un color"),
});

interface CardFormProps {
  initialData?: CardInput;
  onSubmit: (data: CardInput) => Promise<void>;
  submitLabel: string;
}

const inputCls = "h-12 w-full rounded-[10px] border border-[#EBEBEB] bg-white px-3.5 text-[15px] text-[#1A1A1A] placeholder:text-[#A8A8A8] focus:border-[#2C6CFF] focus:outline-none focus:ring-[3px] focus:ring-[#2C6CFF]/12";

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
      const fe: Record<string, string> = {};
      for (const issue of parsed.error.issues) { const f = issue.path[0]; if (typeof f === "string") fe[f] = issue.message; }
      setErrors(fe);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(parsed.data);
      router.push("/cards");
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Error al guardar" });
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label htmlFor="name" className="mb-1.5 block text-[13px] font-medium text-[#1A1A1A]">Nombre</label>
        <input id="name" type="text" placeholder='Ej. "Visa Azul"' value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        {errors.name && <p className="mt-1 text-[13px] text-[#EF4444]">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="bank" className="mb-1.5 block text-[13px] font-medium text-[#1A1A1A]">Banco</label>
        <input id="bank" type="text" placeholder="Ej. BBVA" value={bank} onChange={(e) => setBank(e.target.value)} className={inputCls} />
        {errors.bank && <p className="mt-1 text-[13px] text-[#EF4444]">{errors.bank}</p>}
      </div>

      <div>
        <label htmlFor="lastFour" className="mb-1.5 block text-[13px] font-medium text-[#1A1A1A]">Últimos 4 dígitos</label>
        <input id="lastFour" type="text" inputMode="numeric" maxLength={4} placeholder="0000" value={lastFour} onChange={(e) => setLastFour(e.target.value.replace(/\D/g, ""))} className={`${inputCls} font-mono tracking-widest`} />
        {errors.last_four && <p className="mt-1 text-[13px] text-[#EF4444]">{errors.last_four}</p>}
      </div>

      <div>
        <span className="mb-2 block text-[13px] font-medium text-[#1A1A1A]">Color</span>
        <div className="flex flex-wrap gap-3">
          {PRESET_COLORS.map((c) => (
            <button key={c} type="button" onClick={() => setColor(c)} className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: c }} aria-label={`Color ${c}`}>
              {color === c && (
                <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </motion.svg>
              )}
            </button>
          ))}
        </div>
        {errors.color && <p className="mt-1 text-[13px] text-[#EF4444]">{errors.color}</p>}
      </div>

      {errors.form && <p className="text-[14px] text-[#EF4444]">{errors.form}</p>}

      <button type="submit" disabled={submitting} className="mt-2 flex h-[52px] w-full items-center justify-center rounded-xl bg-[#2C6CFF] font-display text-[16px] font-semibold text-white disabled:opacity-50">
        {submitting ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}
