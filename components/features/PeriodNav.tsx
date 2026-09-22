"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { BillingPeriod } from "@/lib/utils/cardPeriods";

interface PeriodNavProps {
  period: BillingPeriod;
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
}

function formatShort(dateYMD: string): string {
  const [y, m, d] = dateYMD.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

export function PeriodNav({ period, canGoBack, canGoForward, onBack, onForward }: PeriodNavProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-3" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <button
        type="button"
        onClick={onBack}
        disabled={!canGoBack}
        className="flex h-10 w-10 items-center justify-center rounded-full disabled:opacity-25"
        aria-label="Periodo anterior"
      >
        <ChevronLeft size={20} color="#1A1A1A" />
      </button>

      <div className="flex flex-col items-center">
        <span className="text-[14px] font-medium text-[#1A1A1A]">
          {formatShort(period.start)} – {formatShort(period.end)}
        </span>
        {period.dueDate && (
          <span className="text-[11px] text-[#A8A8A8]">Límite de pago: {formatShort(period.dueDate)}</span>
        )}
      </div>

      <button
        type="button"
        onClick={onForward}
        disabled={!canGoForward}
        className="flex h-10 w-10 items-center justify-center rounded-full disabled:opacity-25"
        aria-label="Periodo siguiente"
      >
        <ChevronRight size={20} color="#1A1A1A" />
      </button>
    </div>
  );
}
