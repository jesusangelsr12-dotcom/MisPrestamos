"use client";

import { motion } from "framer-motion";
import { AccountTypeIcon, ACCOUNT_TYPE_LABELS } from "@/components/features/AccountTypeIcon";
import { formatCurrency } from "@/lib/utils/finance";
import type { AccountWithPeriods } from "@/lib/hooks/useHomeAccounts";

interface AccountListItemProps {
  account: AccountWithPeriods;
  onTap: () => void;
}

export function AccountListItem({ account, onTap }: AccountListItemProps) {
  return (
    <motion.button
      type="button"
      onClick={onTap}
      className="flex w-full flex-col gap-3 rounded-2xl bg-white px-4 py-4 text-left"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
      whileTap={{ scale: 0.97 }}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F7F7F5]">
          <AccountTypeIcon type={account.type} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-medium text-[#1A1A1A]">{account.name}</p>
          <p className="text-[12px] text-[#A8A8A8]">{ACCOUNT_TYPE_LABELS[account.type]}</p>
        </div>
      </div>

      {account.periodTotals && (
        <div className="grid grid-cols-3 gap-2 border-t border-[#F0F0EE] pt-3">
          {["Periodo actual", "Siguiente corte", "Después"].map((label, i) => (
            <div key={label} className="flex flex-col">
              <span className="text-[10px] font-medium uppercase text-[#A8A8A8]">{label}</span>
              <span className="font-mono-nums mt-0.5 text-[13px] font-medium text-[#1A1A1A]">
                {formatCurrency(account.periodTotals![i])}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.button>
  );
}
