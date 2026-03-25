"use client";

import { motion, AnimatePresence } from "framer-motion";

interface MonthProjectionCardProps {
  month: Date;
  msiTotal: number;
  loansGivenTotal: number;
  loansReceivedTotal: number;
  total: number;
  isCurrentMonth: boolean;
  expanded: boolean;
  onToggle: () => void;
}

function formatCurrency(n: number): string {
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function getMonthLabel(date: Date): string {
  const month = date.toLocaleDateString("es-MX", { month: "long" });
  const year = date.getFullYear();
  return `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
}

export function MonthProjectionCard({
  month, msiTotal, loansGivenTotal, loansReceivedTotal, total,
  isCurrentMonth, expanded, onToggle,
}: MonthProjectionCardProps) {
  const isEmpty = total === 0;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full overflow-hidden rounded-2xl text-left ${isCurrentMonth ? "bg-[#EEF3FF]" : "bg-white"}`}
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
    >
      <div className="flex">
        <div className="w-1 shrink-0" style={{ backgroundColor: isCurrentMonth ? "#2C6CFF" : "#EBEBEB" }} />
        <div className="flex-1 px-4 py-4">
          <div className="flex items-center justify-between">
            <span className="font-display text-[16px] font-semibold text-[#1A1A1A]">{getMonthLabel(month)}</span>
            {isEmpty ? (
              <span className="text-[14px] text-[#A8A8A8]">Sin compromisos</span>
            ) : (
              <span className="font-mono text-[18px] font-medium text-[#1A1A1A]">{formatCurrency(total)}</span>
            )}
          </div>

          <AnimatePresence initial={false}>
            {expanded && !isEmpty && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="mt-3 flex flex-col gap-2.5">
                  {[
                    { icon: "📊", label: "MSI", value: msiTotal, color: "#2C6CFF" },
                    { icon: "💸", label: "Presté", value: loansGivenTotal, color: "#8B5CF6" },
                    { icon: "📥", label: "Me prestaron", value: loansReceivedTotal, color: "#EC4899" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className="text-[13px] text-[#6B6B6B]">{row.icon} {row.label}</span>
                      <span className="font-mono text-[13px] font-medium" style={{ color: row.color }}>{formatCurrency(row.value)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </button>
  );
}
