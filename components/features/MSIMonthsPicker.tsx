"use client";

import { MSI_MONTHS_OPTIONS } from "@/types";

interface MSIMonthsPickerProps {
  value: number;
  onChange: (months: number) => void;
}

export function MSIMonthsPicker({ value, onChange }: MSIMonthsPickerProps) {
  return (
    <div>
      <span className="mb-1.5 block text-[13px] font-medium text-[#1A1A1A]">Meses sin intereses</span>
      <div className="flex flex-wrap gap-2">
        {MSI_MONTHS_OPTIONS.map((months) => (
          <button
            key={months}
            type="button"
            onClick={() => onChange(months)}
            className={`flex h-9 min-w-[44px] items-center justify-center rounded-full px-3 text-[13px] font-medium ${
              value === months ? "bg-[#2C6CFF] text-white" : "border border-[#EBEBEB] bg-white text-[#6B6B6B]"
            }`}
          >
            {months === 0 ? "No" : months}
          </button>
        ))}
      </div>
    </div>
  );
}
