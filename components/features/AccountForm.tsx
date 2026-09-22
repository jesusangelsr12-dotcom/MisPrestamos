"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { AccountTypeIcon, ACCOUNT_TYPE_LABELS } from "@/components/features/AccountTypeIcon";
import type { AccountInput } from "@/lib/db/accounts";
import type { AccountType } from "@/types";

const ACCOUNT_TYPES: AccountType[] = ["cash", "credit_card", "savings", "investment", "other"];

const accountSchema = z
  .object({
    name: z.string().min(1, "Nombre requerido"),
    type: z.enum(["cash", "credit_card", "savings", "investment", "other"]),
    cut_off_day: z.number().int().min(1).max(31).nullable(),
    payment_due_day: z.number().int().min(1).max(31).nullable(),
  })
  .refine((data) => data.type !== "credit_card" || data.cut_off_day !== null, {
    message: "Fecha de corte requerida",
    path: ["cut_off_day"],
  })
  .refine((data) => data.type !== "credit_card" || data.payment_due_day !== null, {
    message: "Fecha límite de pago requerida",
    path: ["payment_due_day"],
  });

interface AccountFormProps {
  onSubmit: (data: AccountInput) => Promise<void>;
  submitLabel: string;
}

const inputCls =
  "h-12 w-full rounded-[10px] border border-[#EBEBEB] bg-white px-3.5 text-[15px] text-[#1A1A1A] placeholder:text-[#A8A8A8] focus:border-[#2C6CFF] focus:outline-none focus:ring-[3px] focus:ring-[#2C6CFF]/12";

export function AccountForm({ onSubmit, submitLabel }: AccountFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("cash");
  const [cutOffDay, setCutOffDay] = useState("");
  const [paymentDueDay, setPaymentDueDay] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const data = {
      name,
      type,
      cut_off_day: type === "credit_card" && cutOffDay ? Number(cutOffDay) : null,
      payment_due_day: type === "credit_card" && paymentDueDay ? Number(paymentDueDay) : null,
    };
    const parsed = accountSchema.safeParse(data);
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const f = issue.path[0];
        if (typeof f === "string") fe[f] = issue.message;
      }
      setErrors(fe);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(parsed.data);
      router.push("/");
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Error al guardar" });
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <span className="mb-2 block text-[13px] font-medium text-[#1A1A1A]">Tipo de cuenta</span>
        <div className="grid grid-cols-3 gap-2">
          {ACCOUNT_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex flex-col items-center gap-1.5 rounded-[10px] border px-2 py-3 ${
                type === t ? "border-[#2C6CFF] bg-[#2C6CFF]/[0.06]" : "border-[#EBEBEB] bg-white"
              }`}
            >
              <AccountTypeIcon type={t} color={type === t ? "#2C6CFF" : "#6B6B6B"} />
              <span className={`text-center text-[11px] font-medium ${type === t ? "text-[#2C6CFF]" : "text-[#6B6B6B]"}`}>
                {ACCOUNT_TYPE_LABELS[t]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="name" className="mb-1.5 block text-[13px] font-medium text-[#1A1A1A]">
          Nombre
        </label>
        <input
          id="name"
          type="text"
          placeholder='Ej. "Efectivo" o "Visa Platino"'
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputCls}
        />
        {errors.name && <p className="mt-1 text-[13px] text-[#EF4444]">{errors.name}</p>}
      </div>

      {type === "credit_card" && (
        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="cutOffDay" className="mb-1.5 block text-[13px] font-medium text-[#1A1A1A]">
              Día de corte
            </label>
            <input
              id="cutOffDay"
              type="text"
              inputMode="numeric"
              maxLength={2}
              placeholder="20"
              value={cutOffDay}
              onChange={(e) => setCutOffDay(e.target.value.replace(/\D/g, ""))}
              className={`${inputCls} font-mono`}
            />
            {errors.cut_off_day && <p className="mt-1 text-[13px] text-[#EF4444]">{errors.cut_off_day}</p>}
          </div>
          <div className="flex-1">
            <label htmlFor="paymentDueDay" className="mb-1.5 block text-[13px] font-medium text-[#1A1A1A]">
              Límite de pago
            </label>
            <input
              id="paymentDueDay"
              type="text"
              inputMode="numeric"
              maxLength={2}
              placeholder="5"
              value={paymentDueDay}
              onChange={(e) => setPaymentDueDay(e.target.value.replace(/\D/g, ""))}
              className={`${inputCls} font-mono`}
            />
            {errors.payment_due_day && <p className="mt-1 text-[13px] text-[#EF4444]">{errors.payment_due_day}</p>}
          </div>
        </div>
      )}

      {errors.form && <p className="text-[14px] text-[#EF4444]">{errors.form}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 flex h-[52px] w-full items-center justify-center rounded-xl bg-[#2C6CFF] font-display text-[16px] font-semibold text-white disabled:opacity-50"
      >
        {submitting ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}
