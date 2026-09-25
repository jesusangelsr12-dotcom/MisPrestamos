"use client";

import { formatCurrency } from "@/lib/utils/finance";
import { myShareAmount, splitEvenly, sumShares, round2 } from "@/lib/utils/shares";
import type { Person } from "@/types";

// Parte en edición: el monto se guarda como texto mientras se escribe.
export interface ShareDraft {
  person_id: string;
  amount: string;
}

export function sharesToDrafts(shares: { person_id: string; amount: number }[]): ShareDraft[] {
  return shares.map((s) => ({ person_id: s.person_id, amount: String(s.amount) }));
}

export function draftsToShares(drafts: ShareDraft[]): { person_id: string; amount: number }[] {
  return drafts.map((d) => ({ person_id: d.person_id, amount: parseFloat(d.amount) || 0 }));
}

interface ShareSplitEditorProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  total: number; // monto total del gasto
  msiMonths: number;
  people: Person[];
  drafts: ShareDraft[];
  onChange: (drafts: ShareDraft[]) => void;
  error?: string;
}

const inputCls =
  "h-10 w-28 rounded-[10px] border border-[#EBEBEB] bg-white px-3 text-right font-mono text-[14px] text-[#1A1A1A] placeholder:text-[#A8A8A8] focus:border-[#2C6CFF] focus:outline-none";

export function ShareSplitEditor({ enabled, onToggle, total, msiMonths, people, drafts, onChange, error }: ShareSplitEditorProps) {
  const selectedIds = new Set(drafts.map((d) => d.person_id));
  const shares = draftsToShares(drafts);
  const othersTotal = sumShares(shares);
  const mine = myShareAmount(total, shares);
  const exceeds = total > 0 && othersTotal > total + 0.005;

  function togglePerson(personId: string) {
    if (selectedIds.has(personId)) {
      onChange(drafts.filter((d) => d.person_id !== personId));
    } else {
      onChange([...drafts, { person_id: personId, amount: "" }]);
    }
  }

  function setAmount(personId: string, value: string) {
    onChange(drafts.map((d) => (d.person_id === personId ? { ...d, amount: value.replace(/[^0-9.]/g, "") } : d)));
  }

  function splitEqually() {
    const even = splitEvenly(total, drafts.map((d) => d.person_id), true);
    onChange(even.map((s) => ({ person_id: s.person_id, amount: String(s.amount) })));
  }

  const perMonth = (amount: number) => (msiMonths > 0 ? ` · ${formatCurrency(round2(amount / msiMonths))}/mes` : "");

  return (
    <div>
      <div className="flex min-h-[44px] items-center justify-between">
        <span className="text-[13px] font-medium text-[#1A1A1A]">Dividir con otras personas</span>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Dividir con otras personas"
          onClick={() => onToggle(!enabled)}
          className={`relative h-6 w-11 rounded-full transition-colors ${enabled ? "bg-[#2C6CFF]" : "bg-[#E8E8E5]"}`}
        >
          <span className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${enabled ? "translate-x-[22px]" : "translate-x-0.5"}`} />
        </button>
      </div>

      {enabled && (
        <div className="mt-2 flex flex-col gap-3 rounded-xl bg-[#F7F7F5] p-3.5">
          {people.length === 0 ? (
            <p className="text-[13px] text-[#6B6B6B]">Agrega personas con “+ Nueva” en “¿De quién es?” y vuelve a elegir “Mío”.</p>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {people.map((p) => {
                const active = selectedIds.has(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePerson(p.id)}
                    className={`flex h-9 shrink-0 items-center rounded-full px-3.5 text-[13px] font-medium ${
                      active ? "bg-[#2C6CFF] text-white" : "border border-[#EBEBEB] bg-white text-[#6B6B6B]"
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          )}

          {drafts.map((d) => {
            const name = people.find((p) => p.id === d.person_id)?.name ?? "Persona";
            const amount = parseFloat(d.amount) || 0;
            return (
              <div key={d.person_id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-[#1A1A1A]">{name}</p>
                  {amount > 0 && msiMonths > 0 && (
                    <p className="font-mono text-[12px] text-[#A8A8A8]">{formatCurrency(round2(amount / msiMonths))}/mes</p>
                  )}
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="$0"
                  aria-label={`Parte de ${name}`}
                  value={d.amount}
                  onChange={(e) => setAmount(d.person_id, e.target.value)}
                  className={inputCls}
                />
              </div>
            );
          })}

          {drafts.length > 0 && (
            <>
              <div className="flex items-center justify-between border-t border-[#EBEBEB] pt-3">
                <span className="text-[14px] font-medium text-[#1A1A1A]">Tu parte</span>
                <span className={`font-mono text-[14px] font-medium ${exceeds ? "text-[#EF4444]" : "text-[#1A1A1A]"}`}>
                  {exceeds ? `Excede por ${formatCurrency(round2(othersTotal - total))}` : `${formatCurrency(mine)}${perMonth(mine)}`}
                </span>
              </div>
              <button
                type="button"
                onClick={splitEqually}
                disabled={total <= 0}
                className="flex h-10 items-center justify-center rounded-[10px] bg-white text-[13px] font-medium text-[#2C6CFF] disabled:opacity-50"
              >
                Partes iguales entre {drafts.length + 1}
              </button>
            </>
          )}

          <p className="text-[12px] text-[#A8A8A8]">Las partes son sobre el total del gasto. Tu parte es lo que sobra.</p>
        </div>
      )}

      {error && <p className="mt-1 text-[13px] text-[#EF4444]">{error}</p>}
    </div>
  );
}
