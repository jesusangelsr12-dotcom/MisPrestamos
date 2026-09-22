"use client";

import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils/finance";
import type { UpcomingDuePayment } from "@/lib/hooks/useHomeAccounts";

function daysUntil(dateYMD: string): number {
  const [y, m, d] = dateYMD.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function dueLabel(days: number): string {
  if (days < 0) return `Venció hace ${Math.abs(days)} día${Math.abs(days) === 1 ? "" : "s"}`;
  if (days === 0) return "Vence hoy";
  if (days === 1) return "Vence mañana";
  return `Vence en ${days} días`;
}

interface DuePaymentsBannerProps {
  payments: UpcomingDuePayment[];
}

export function DuePaymentsBanner({ payments }: DuePaymentsBannerProps) {
  const router = useRouter();

  if (payments.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {payments.map((payment) => {
        const days = daysUntil(payment.dueDate);
        const urgent = days <= 2;
        return (
          <button
            key={payment.accountId}
            type="button"
            onClick={() => router.push(`/accounts/${payment.accountId}`)}
            className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left"
            style={{ backgroundColor: urgent ? "#FEF2F2" : "#FFF8EB" }}
          >
            <AlertCircle size={18} color={urgent ? "#EF4444" : "#F59E0B"} className="shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-medium text-[#1A1A1A]">{payment.accountName}</p>
              <p className="text-[12px]" style={{ color: urgent ? "#EF4444" : "#B45309" }}>
                {dueLabel(days)}
              </p>
            </div>
            <span className="font-mono text-[15px] font-medium text-[#1A1A1A]">{formatCurrency(payment.amount)}</span>
          </button>
        );
      })}
    </div>
  );
}
