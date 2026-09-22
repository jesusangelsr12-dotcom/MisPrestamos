"use client";

import { useState, useEffect } from "react";
import { BottomSheet } from "@/components/features/BottomSheet";
import { TagPicker } from "@/components/features/TagPicker";
import { MSIMonthsPicker } from "@/components/features/MSIMonthsPicker";
import { useCategories } from "@/lib/hooks/useCategories";
import { usePeople } from "@/lib/hooks/usePeople";
import type { TransactionWithRelations } from "@/types";
import type { TransactionUpdateInput } from "@/lib/db/transactions";

const inputCls =
  "h-12 w-full rounded-[10px] border border-[#EBEBEB] bg-white px-3.5 text-[15px] text-[#1A1A1A] placeholder:text-[#A8A8A8] focus:border-[#2C6CFF] focus:outline-none focus:ring-[3px] focus:ring-[#2C6CFF]/12";

const TYPE_LABELS: Record<string, string> = {
  expense: "Gasto",
  payment: "Pago o ingreso",
  transfer: "Transferencia",
};

interface TransactionEditSheetProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionWithRelations | null;
  onSave: (id: string, updates: TransactionUpdateInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function TransactionEditSheet({ isOpen, onClose, transaction, onSave, onDelete }: TransactionEditSheetProps) {
  const { categories, createCategory, deleteCategory } = useCategories();
  const { people, createPerson, deletePerson } = usePeople();

  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [personId, setPersonId] = useState<string | null>(null);
  const [msiMonths, setMsiMonths] = useState(0);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (transaction) {
      setDate(transaction.date);
      setAmount(String(transaction.amount));
      setCategoryId(transaction.category_id);
      setPersonId(transaction.person_id);
      setMsiMonths(transaction.msi_months);
      setNote(transaction.note ?? "");
      setError("");
      setConfirmingDelete(false);
    }
  }, [transaction]);

  if (!transaction) return null;

  async function handleSave() {
    const parsedAmount = parseFloat(amount);
    if (!date || !(parsedAmount > 0)) {
      setError("Revisa la fecha y el monto");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(transaction!.id, {
        date,
        amount: parsedAmount,
        category_id: transaction!.type !== "transfer" ? categoryId : undefined,
        person_id: transaction!.type === "expense" ? personId : undefined,
        msi_months: transaction!.type === "expense" ? msiMonths : undefined,
        note: note.trim() || null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      await onDelete(transaction!.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
      setDeleting(false);
    }
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={`Editar ${TYPE_LABELS[transaction.type]}`}>
      <div className="flex flex-col gap-5">
        <div>
          <label htmlFor="editDate" className="mb-1.5 block text-[13px] font-medium text-[#1A1A1A]">Fecha</label>
          <input id="editDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
        </div>

        <div>
          <label htmlFor="editAmount" className="mb-1.5 block text-[13px] font-medium text-[#1A1A1A]">Monto</label>
          <input
            id="editAmount"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            className={`${inputCls} font-mono`}
          />
        </div>

        {transaction.type !== "transfer" && (
          <TagPicker label="Categoría" options={categories} value={categoryId} onChange={setCategoryId} onCreate={createCategory} onDelete={deleteCategory} noneLabel="Sin categoría" />
        )}

        {transaction.type === "expense" && <MSIMonthsPicker value={msiMonths} onChange={setMsiMonths} />}

        {transaction.type === "expense" && (
          <TagPicker label="¿De quién es?" options={people} value={personId} onChange={setPersonId} onCreate={createPerson} onDelete={deletePerson} noneLabel="Mío" />
        )}

        <div>
          <label htmlFor="editNote" className="mb-1.5 block text-[13px] font-medium text-[#1A1A1A]">Nota (opcional)</label>
          <input id="editNote" type="text" value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
        </div>

        {error && <p className="text-[14px] text-[#EF4444]">{error}</p>}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || deleting}
          className="flex h-[52px] w-full items-center justify-center rounded-xl bg-[#2C6CFF] font-display text-[16px] font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>

        {confirmingDelete ? (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="flex h-12 flex-1 items-center justify-center rounded-xl border border-[#EBEBEB] text-[14px] font-medium text-[#6B6B6B]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex h-12 flex-1 items-center justify-center rounded-xl bg-[#EF4444] text-[14px] font-medium text-white disabled:opacity-50"
            >
              {deleting ? "Eliminando..." : "Confirmar eliminar"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="flex h-12 w-full items-center justify-center rounded-xl text-[14px] font-medium text-[#EF4444]"
          >
            Eliminar movimiento
          </button>
        )}
      </div>
    </BottomSheet>
  );
}
