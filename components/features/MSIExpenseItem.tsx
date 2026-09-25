"use client";

import { TransactionListItem } from "@/components/features/TransactionListItem";
import { formatCurrency } from "@/lib/utils/finance";
import { myShareAmount, owedParties, reimbursementKey, round2, type OwedParty } from "@/lib/utils/shares";
import type { PeriodLineItem } from "@/lib/utils/accountBalance";

interface MSIExpenseItemProps {
  item: PeriodLineItem;
  reimbursedTotals: Record<string, number>; // reimbursementKey(gasto, persona) -> total
  onOpenReimbursements: (party: OwedParty) => void;
}

export function MSIExpenseItem({ item, reimbursedTotals, onOpenReimbursements }: MSIExpenseItemProps) {
  const { transaction } = item;
  const parties = owedParties(transaction);

  if (parties.length === 0) {
    return <TransactionListItem {...item} />;
  }

  const isShared = transaction.shares.length > 0;
  const mine = isShared ? myShareAmount(transaction.amount, transaction.shares) : 0;

  return (
    <div className="flex flex-col gap-2">
      <TransactionListItem {...item} />

      {isShared && mine > 0 && (
        <div className="flex items-center justify-between px-3.5">
          <span className="text-[12px] text-[#6B6B6B]">Tu parte</span>
          <span className="font-mono text-[12px] font-medium text-[#1A1A1A]">
            {formatCurrency(round2(mine / transaction.msi_months))}/mes · {formatCurrency(mine)}
          </span>
        </div>
      )}

      {parties.map((party) => {
        const reimbursed = reimbursedTotals[reimbursementKey(transaction.id, party.personId)] ?? 0;
        const pct = party.amount > 0 ? Math.min((reimbursed / party.amount) * 100, 100) : 0;
        const isSettled = reimbursed >= party.amount - 0.005;

        return (
          <button
            key={party.personId ?? "owner"}
            type="button"
            onClick={() => onOpenReimbursements(party)}
            className="flex flex-col gap-1.5 rounded-xl bg-[#F7F7F5] px-3.5 py-2.5 text-left"
          >
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#6B6B6B]">
                {isSettled
                  ? isShared ? `✓ ${party.name} pagó su parte` : "✓ Reembolsado por completo"
                  : `Reembolsado por ${party.name}`}
              </span>
              <span className="font-mono text-[12px] font-medium text-[#1A1A1A]">
                {formatCurrency(reimbursed)} / {formatCurrency(party.amount)}
              </span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-[#E8E8E5]">
              <div className="h-full rounded-full bg-[#00A878]" style={{ width: `${pct}%` }} />
            </div>
          </button>
        );
      })}
    </div>
  );
}
