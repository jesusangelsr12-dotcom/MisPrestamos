"use client";

import { TransactionListItem } from "@/components/features/TransactionListItem";
import { formatCurrency } from "@/lib/utils/finance";
import type { PeriodLineItem } from "@/lib/utils/accountBalance";

interface MSIExpenseItemProps {
  item: PeriodLineItem;
  reimbursedTotal: number;
  onOpenReimbursements: () => void;
}

export function MSIExpenseItem({ item, reimbursedTotal, onOpenReimbursements }: MSIExpenseItemProps) {
  const { transaction } = item;
  const isOwedByPerson = transaction.person !== null;

  if (!isOwedByPerson) {
    return <TransactionListItem {...item} />;
  }

  const total = transaction.amount;
  const pct = total > 0 ? Math.min((reimbursedTotal / total) * 100, 100) : 0;
  const isSettled = reimbursedTotal >= total;

  return (
    <div className="flex flex-col gap-2">
      <TransactionListItem {...item} />
      <button
        type="button"
        onClick={onOpenReimbursements}
        className="flex flex-col gap-1.5 rounded-xl bg-[#F7F7F5] px-3.5 py-2.5 text-left"
      >
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-[#6B6B6B]">
            {isSettled ? "✓ Reembolsado por completo" : `Reembolsado por ${transaction.person!.name}`}
          </span>
          <span className="font-mono text-[12px] font-medium text-[#1A1A1A]">
            {formatCurrency(reimbursedTotal)} / {formatCurrency(total)}
          </span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-[#E8E8E5]">
          <div className="h-full rounded-full bg-[#00A878]" style={{ width: `${pct}%` }} />
        </div>
      </button>
    </div>
  );
}
