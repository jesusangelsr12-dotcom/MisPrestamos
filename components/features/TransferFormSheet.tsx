"use client";

import { useState } from "react";
import { z } from "zod";
import { BottomSheet } from "@/components/features/BottomSheet";
import type { Account } from "@/types";
import type { TransferInput } from "@/lib/db/transactions";

const todayYMD = () => new Date().toISOString().slice(0, 10);

const transferSchema = z
  .object({
    date: z.string().min(1, "Fecha requerida"),
    amount: z.number().positive("El monto debe ser mayor a 0"),
    account_id: z.string().min(1, "Selecciona la cuenta destino"),
    source_account_id: z.string().min(1, "Selecciona la cuenta origen"),
  })
  .refine((data) => data.account_id !== data.source_account_id, {
    message: "Origen y destino deben ser distintos",
    path: ["account_id"],
  });

const inputCls =
  "h-12 w-full rounded-[10px] border border-[#EBEBEB] bg-white px-3.5 text-[15px] text-[#1A1A1A] placeholder:text-[#A8A8A8] focus:border-[#2C6CFF] focus:outline-none focus:ring-[3px] focus:ring-[#2C6CFF]/12";

interface TransferFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  defaultSourceAccountId: string;
  onSubmit: (input: TransferInput) => Promise<void>;
}

export function TransferFormSheet({ isOpen, onClose, accounts, defaultSourceAccountId, onSubmit }: TransferFormSheetProps) {
  const otherDefault = accounts.find((a) => a.id !== defaultSourceAccountId)?.id ?? "";

  const [date, setDate] = useState(todayYMD());
  const [amount, setAmount] = useState("");
  const [sourceAccountId, setSourceAccountId] = useState(defaultSourceAccountId);
  const [destinationAccountId, setDestinationAccountId] = useState(otherDefault);
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setDate(todayYMD());
    setAmount("");
    setSourceAccountId(defaultSourceAccountId);
    setDestinationAccountId(otherDefault);
    setNote("");
    setErrors({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const parsedAmount = parseFloat(amount);
    const parsed = transferSchema.safeParse({
      date,
      amount: parsedAmount,
      account_id: destinationAccountId,
      source_account_id: sourceAccountId,
    });
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
        type: "transfer",
        date,
        amount: parsedAmount,
        account_id: destinationAccountId,
        source_account_id: sourceAccountId,
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
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Transferencia entre cuentas">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="transferDate" className="mb-1.5 block text-[13px] font-medium text-[#1A1A1A]">Fecha</label>
            <input id="transferDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
            {errors.date && <p className="mt-1 text-[13px] text-[#EF4444]">{errors.date}</p>}
          </div>
          <div>
            <label htmlFor="transferAmount" className="mb-1.5 block text-[13px] font-medium text-[#1A1A1A]">Monto</label>
            <input
              id="transferAmount"
              type="text"
              inputMode="decimal"
              placeholder="$0"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              className={`${inputCls} font-mono`}
            />
            {errors.amount && <p className="mt-1 text-[13px] text-[#EF4444]">{errors.amount}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="transferSource" className="mb-1.5 block text-[13px] font-medium text-[#1A1A1A]">Origen</label>
            <select id="transferSource" value={sourceAccountId} onChange={(e) => setSourceAccountId(e.target.value)} className={inputCls}>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="transferDestination" className="mb-1.5 block text-[13px] font-medium text-[#1A1A1A]">Destino</label>
            <select id="transferDestination" value={destinationAccountId} onChange={(e) => setDestinationAccountId(e.target.value)} className={inputCls}>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            {errors.account_id && <p className="mt-1 text-[13px] text-[#EF4444]">{errors.account_id}</p>}
          </div>
        </div>

        <input
          type="text"
          placeholder="Nota (opcional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={inputCls}
        />

        {errors.form && <p className="text-[14px] text-[#EF4444]">{errors.form}</p>}

        <button type="submit" disabled={submitting} className="flex h-[52px] w-full items-center justify-center rounded-xl bg-[#2C6CFF] font-display text-[16px] font-semibold text-white disabled:opacity-50">
          {submitting ? "Guardando..." : "Transferir"}
        </button>
      </form>
    </BottomSheet>
  );
}
