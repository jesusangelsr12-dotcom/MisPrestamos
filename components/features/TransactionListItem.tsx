import { formatCurrency } from "@/lib/utils/finance";
import type { PeriodLineItem } from "@/lib/utils/accountBalance";

const TYPE_LABELS: Record<string, string> = {
  expense: "Gasto",
  payment: "Pago",
  transfer: "Transferencia",
};

function formatShort(dateYMD: string): string {
  const [y, m, d] = dateYMD.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

interface TransactionListItemProps extends PeriodLineItem {
  onTap?: () => void;
}

export function TransactionListItem({ transaction, amount, installmentLabel, onTap }: TransactionListItemProps) {
  const isNegative = amount < 0;
  const label = transaction.note || transaction.category?.name || TYPE_LABELS[transaction.type];

  return (
    <div
      onClick={onTap}
      role={onTap ? "button" : undefined}
      tabIndex={onTap ? 0 : undefined}
      className={`flex w-full items-center justify-between rounded-xl bg-white px-4 py-3.5 text-left ${onTap ? "cursor-pointer" : ""}`}
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium text-[#1A1A1A]">{label}</p>
        <p className="text-[12px] text-[#A8A8A8]">
          {formatShort(transaction.date)}
          {transaction.person?.name ? ` · ${transaction.person.name}` : ""}
          {transaction.shares.length > 0 ? ` · Con ${transaction.shares.map((s) => s.person_name).join(", ")}` : ""}
          {installmentLabel ? ` · ${installmentLabel}` : ""}
        </p>
      </div>
      <span className={`font-mono text-[15px] font-medium ${isNegative ? "text-[#00A878]" : "text-[#1A1A1A]"}`}>
        {isNegative ? "-" : ""}
        {formatCurrency(Math.abs(amount))}
      </span>
    </div>
  );
}
