"use client";

import { useState } from "react";
import { z } from "zod";
import { BottomSheet } from "@/components/features/BottomSheet";
import { TagPicker } from "@/components/features/TagPicker";
import { MSIMonthsPicker } from "@/components/features/MSIMonthsPicker";
import { ShareSplitEditor, draftsToShares, type ShareDraft } from "@/components/features/ShareSplitEditor";
import { useCategories } from "@/lib/hooks/useCategories";
import { usePeople } from "@/lib/hooks/usePeople";
import type { Account } from "@/types";
import type { ExpenseInput } from "@/lib/db/transactions";
import { validateShares } from "@/lib/utils/shares";

const todayYMD = () => new Date().toISOString().slice(0, 10);

const expenseSchema = z.object({
  date: z.string().min(1, "Fecha requerida"),
  amount: z.number().positive("El monto debe ser mayor a 0"),
  account_id: z.string().min(1, "Selecciona una cuenta"),
});

const inputCls =
  "h-12 w-full rounded-[10px] border border-[#EBEBEB] bg-white px-3.5 text-[15px] text-[#1A1A1A] placeholder:text-[#A8A8A8] focus:border-[#2C6CFF] focus:outline-none focus:ring-[3px] focus:ring-[#2C6CFF]/12";

interface ExpenseFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  defaultAccountId: string;
  onSubmit: (input: ExpenseInput) => Promise<void>;
}

export function ExpenseFormSheet({ isOpen, onClose, accounts, defaultAccountId, onSubmit }: ExpenseFormSheetProps) {
  const { categories, createCategory, deleteCategory } = useCategories();
  const { people, createPerson, deletePerson } = usePeople();

  const [date, setDate] = useState(todayYMD());
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState(defaultAccountId);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [personId, setPersonId] = useState<string | null>(null);
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [shareDrafts, setShareDrafts] = useState<ShareDraft[]>([]);
  const [msiMonths, setMsiMonths] = useState(0);
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Si se borra una persona mientras se captura, su parte deja de contar.
  const liveShareDrafts = shareDrafts.filter((d) => people.some((p) => p.id === d.person_id));

  function reset() {
    setDate(todayYMD());
    setAmount("");
    setAccountId(defaultAccountId);
    setCategoryId(null);
    setPersonId(null);
    setSplitEnabled(false);
    setShareDrafts([]);
    setMsiMonths(0);
    setNote("");
    setErrors({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const parsedAmount = parseFloat(amount);
    const parsed = expenseSchema.safeParse({ date, amount: parsedAmount, account_id: accountId });
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const f = issue.path[0];
        if (typeof f === "string") fe[f] = issue.message;
      }
      setErrors(fe);
      return;
    }

    // Solo un gasto "Mío" se puede dividir; si es 100% de otra persona, las
    // partes que se hayan capturado se ignoran.
    const shares = personId === null && splitEnabled ? draftsToShares(liveShareDrafts) : [];
    const sharesError = validateShares(parsedAmount, personId, shares);
    if (sharesError) {
      setErrors({ shares: sharesError });
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        type: "expense",
        date,
        amount: parsedAmount,
        account_id: accountId,
        category_id: categoryId,
        person_id: personId,
        msi_months: msiMonths,
        shares,
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
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Nuevo gasto">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="expenseDate" className="mb-1.5 block text-[13px] font-medium text-[#1A1A1A]">Fecha</label>
            <input id="expenseDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
            {errors.date && <p className="mt-1 text-[13px] text-[#EF4444]">{errors.date}</p>}
          </div>
          <div>
            <label htmlFor="expenseAmount" className="mb-1.5 block text-[13px] font-medium text-[#1A1A1A]">Monto</label>
            <input
              id="expenseAmount"
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

        <div>
          <label htmlFor="expenseAccount" className="mb-1.5 block text-[13px] font-medium text-[#1A1A1A]">Cuenta</label>
          <select id="expenseAccount" value={accountId} onChange={(e) => setAccountId(e.target.value)} className={inputCls}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          {errors.account_id && <p className="mt-1 text-[13px] text-[#EF4444]">{errors.account_id}</p>}
        </div>

        <TagPicker label="Categoría" options={categories} value={categoryId} onChange={setCategoryId} onCreate={createCategory} onDelete={deleteCategory} noneLabel="Sin categoría" />

        <MSIMonthsPicker value={msiMonths} onChange={setMsiMonths} />

        <TagPicker label="¿De quién es?" options={people} value={personId} onChange={setPersonId} onCreate={createPerson} onDelete={deletePerson} noneLabel="Mío" />

        {personId === null && (
          <ShareSplitEditor
            enabled={splitEnabled}
            onToggle={setSplitEnabled}
            total={parseFloat(amount) || 0}
            msiMonths={msiMonths}
            people={people}
            drafts={liveShareDrafts}
            onChange={setShareDrafts}
            error={errors.shares}
          />
        )}

        <input
          type="text"
          placeholder="Nota (opcional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={inputCls}
        />

        {errors.form && <p className="text-[14px] text-[#EF4444]">{errors.form}</p>}

        <button type="submit" disabled={submitting} className="flex h-[52px] w-full items-center justify-center rounded-xl bg-[#2C6CFF] font-display text-[16px] font-semibold text-white disabled:opacity-50">
          {submitting ? "Guardando..." : "Agregar gasto"}
        </button>
      </form>
    </BottomSheet>
  );
}
