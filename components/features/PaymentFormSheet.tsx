"use client";

import { useState } from "react";
import { z } from "zod";
import { BottomSheet } from "@/components/features/BottomSheet";
import { TagPicker } from "@/components/features/TagPicker";
import { useCategories } from "@/lib/hooks/useCategories";
import type { Account } from "@/types";
import type { PaymentInput } from "@/lib/db/transactions";

const todayYMD = () => new Date().toISOString().slice(0, 10);

const paymentSchema = z
  .object({
    date: z.string().min(1, "Fecha requerida"),
    amount: z.number().positive("El monto debe ser mayor a 0"),
    source_account_id: z.string().min(1, "Selecciona de dónde sale el pago"),
  });

const inputCls =
  "h-12 w-full rounded-[10px] border border-[#EBEBEB] bg-white px-3.5 text-[15px] text-[#1A1A1A] placeholder:text-[#A8A8A8] focus:border-[#2C6CFF] focus:outline-none focus:ring-[3px] focus:ring-[#2C6CFF]/12";

interface PaymentFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  cardAccountId: string;
  cardName: string;
  otherAccounts: Account[]; // cuentas distintas a la tarjeta, de donde puede salir el pago
  onSubmit: (input: PaymentInput) => Promise<void>;
}

export function PaymentFormSheet({ isOpen, onClose, cardAccountId, cardName, otherAccounts, onSubmit }: PaymentFormSheetProps) {
  const { categories, createCategory, deleteCategory } = useCategories();

  const [date, setDate] = useState(todayYMD());
  const [amount, setAmount] = useState("");
  const [sourceAccountId, setSourceAccountId] = useState(otherAccounts[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setDate(todayYMD());
    setAmount("");
    setSourceAccountId(otherAccounts[0]?.id ?? "");
    setCategoryId(null);
    setNote("");
    setErrors({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const parsedAmount = parseFloat(amount);
    const parsed = paymentSchema.safeParse({ date, amount: parsedAmount, source_account_id: sourceAccountId });
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
      await onSubmit({
        type: "payment",
        date,
        amount: parsedAmount,
        account_id: cardAccountId,
        source_account_id: sourceAccountId,
        category_id: categoryId,
        note: note.trim() || null,
      });
      reset();
      onClose();
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Error al guardar" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={`Pago a ${cardName}`}>
      {otherAccounts.length === 0 ? (
        <p className="py-6 text-center text-[14px] text-[#6B6B6B]">
          Necesitas otra cuenta (efectivo, débito, etc.) para registrar de dónde sale el pago.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label htmlFor="paymentDate" className="mb-1.5 block text-[13px] font-medium text-[#1A1A1A]">Fecha</label>
            <input id="paymentDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
            {errors.date && <p className="mt-1 text-[13px] text-[#EF4444]">{errors.date}</p>}
          </div>

          <div>
            <label htmlFor="paymentAmount" className="mb-1.5 block text-[13px] font-medium text-[#1A1A1A]">Monto</label>
            <input
              id="paymentAmount"
              type="text"
              inputMode="decimal"
              placeholder="$0"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              className={`${inputCls} font-mono`}
            />
            {errors.amount && <p className="mt-1 text-[13px] text-[#EF4444]">{errors.amount}</p>}
          </div>

          <div>
            <label htmlFor="paymentSource" className="mb-1.5 block text-[13px] font-medium text-[#1A1A1A]">Cuenta de origen</label>
            <select id="paymentSource" value={sourceAccountId} onChange={(e) => setSourceAccountId(e.target.value)} className={inputCls}>
              {otherAccounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            {errors.source_account_id && <p className="mt-1 text-[13px] text-[#EF4444]">{errors.source_account_id}</p>}
          </div>

          <TagPicker label="Categoría" options={categories} value={categoryId} onChange={setCategoryId} onCreate={createCategory} onDelete={deleteCategory} noneLabel="Sin categoría" />

          <div>
            <label htmlFor="paymentNote" className="mb-1.5 block text-[13px] font-medium text-[#1A1A1A]">Nota (opcional)</label>
            <input id="paymentNote" type="text" value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
          </div>

          {errors.form && <p className="text-[14px] text-[#EF4444]">{errors.form}</p>}

          <button type="submit" disabled={submitting} className="flex h-[52px] w-full items-center justify-center rounded-xl bg-[#2C6CFF] font-display text-[16px] font-semibold text-white disabled:opacity-50">
            {submitting ? "Guardando..." : "Registrar pago"}
          </button>
        </form>
      )}
    </BottomSheet>
  );
}
