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
  return n.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function getMonthLabel(date: Date): string {
  const month = date.toLocaleDateString("es-MX", { month: "long" });
  const year = date.getFullYear();
  return `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
}

function getDominantColor(msi: number, given: number, received: number): string {
  if (msi === 0 && given === 0 && received === 0) return "#E8E8E5";
  if (msi >= given && msi >= received) return "#2C6CFF";
  if (given >= msi && given >= received) return "#8B5CF6";
  return "#EC4899";
}

export function MonthProjectionCard({
  month,
  msiTotal,
  loansGivenTotal,
  loansReceivedTotal,
  total,
  isCurrentMonth,
  expanded,
  onToggle,
}: MonthProjectionCardProps) {
  const dominantColor = getDominantColor(msiTotal, loansGivenTotal, loansReceivedTotal);
  const isEmpty = total === 0;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full text-left rounded-2xl overflow-hidden ${
        isCurrentMonth ? "bg-[#EEF3FF]" : "bg-white"
      }`}
    >
      <div className="flex">
        {/* Left colored bar */}
        <div
          className="w-1 shrink-0"
          style={{
            backgroundColor: isCurrentMonth ? "#2C6CFF" : dominantColor,
          }}
        />

        <div className="flex-1 px-4 py-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-[16px] font-semibold font-display text-foreground">
              {getMonthLabel(month)}
            </span>
            {isEmpty ? (
              <span className="text-sm text-muted-foreground">
                Sin compromisos
              </span>
            ) : (
              <span className="font-mono text-[18px] font-medium text-foreground">
                {formatCurrency(total)}
              </span>
            )}
          </div>

          {/* Expanded breakdown */}
          <AnimatePresence initial={false}>
            {expanded && !isEmpty && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="mt-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-muted-foreground">
                      📊 MSI
                    </span>
                    <span
                      className="font-mono text-[13px] font-medium"
                      style={{ color: "#2C6CFF" }}
                    >
                      {formatCurrency(msiTotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-muted-foreground">
                      💸 Presté
                    </span>
                    <span
                      className="font-mono text-[13px] font-medium"
                      style={{ color: "#8B5CF6" }}
                    >
                      {formatCurrency(loansGivenTotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-muted-foreground">
                      📥 Me prestaron
                    </span>
                    <span
                      className="font-mono text-[13px] font-medium"
                      style={{ color: "#EC4899" }}
                    >
                      {formatCurrency(loansReceivedTotal)}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </button>
  );
}
