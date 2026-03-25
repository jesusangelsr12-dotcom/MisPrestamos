"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number, monthsCovered: number) => void;
  monthlyAmount: number;
  remainingMonths: number;
  currentMonth: number;
  totalMonths: number;
  isFinalMonth: boolean;
  finalPaymentAmount: number | null;
}

function formatCurrency(n: number): string {
  return n.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

const inputCls =
  "h-12 w-full rounded-[10px] border border-[#EBEBEB] bg-white px-3.5 text-[15px] text-[#1A1A1A] placeholder:text-[#A8A8A8] focus:border-[#2C6CFF] focus:outline-none focus:ring-[3px] focus:ring-[#2C6CFF]/12 font-mono";

export function PaymentModal({
  isOpen,
  onClose,
  onConfirm,
  monthlyAmount,
  remainingMonths,
  currentMonth,
  totalMonths,
  isFinalMonth,
  finalPaymentAmount,
}: PaymentModalProps) {
  const defaultAmount = isFinalMonth && finalPaymentAmount ? finalPaymentAmount : monthlyAmount;
  const [amountStr, setAmountStr] = useState(String(defaultAmount));
  const [selectedCover, setSelectedCover] = useState<number>(1);

  useEffect(() => {
    if (isOpen) {
      const def = isFinalMonth && finalPaymentAmount ? finalPaymentAmount : monthlyAmount;
      setAmountStr(String(def));
      setSelectedCover(1);
    }
  }, [isOpen, isFinalMonth, finalPaymentAmount, monthlyAmount]);

  const parsedAmount = useMemo(() => {
    const n = parseFloat(amountStr);
    return isNaN(n) ? 0 : n;
  }, [amountStr]);

  const detectedMonths = useMemo(() => {
    if (monthlyAmount <= 0 || parsedAmount <= monthlyAmount) return 1;
    return Math.min(Math.floor(parsedAmount / monthlyAmount), remainingMonths);
  }, [parsedAmount, monthlyAmount, remainingMonths]);

  const showMultiMonth = detectedMonths > 1;
  const coversAll = detectedMonths >= remainingMonths;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[4px]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-5 top-1/2 z-50 -translate-y-1/2 rounded-2xl bg-white p-5"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
          >
            {/* Title */}
            <p className="text-[16px] font-semibold text-[#1A1A1A]">
              Registrar pago — Mes {currentMonth} de {totalMonths}
            </p>

            {/* Amount input */}
            <div className="mt-4">
              <label className="mb-1.5 block text-[13px] font-medium text-[#1A1A1A]">
                ¿Cuánto pagaste?
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value.replace(/[^0-9.]/g, ""))}
                className={inputCls}
                placeholder="$0"
              />
            </div>

            {/* Multi-month detection */}
            {showMultiMonth && (
              <div className="mt-3 rounded-[10px] bg-[#EEF3FF] p-3">
                {coversAll ? (
                  <p className="text-[13px] font-medium text-[#00A878]">
                    ✓ Este pago liquida el compromiso completo
                  </p>
                ) : (
                  <p className="text-[13px] text-[#1A1A1A]">
                    💡 Este monto cubre aproximadamente <strong>{detectedMonths} meses</strong>.
                  </p>
                )}
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCover(1)}
                    className={`flex h-9 flex-1 items-center justify-center rounded-lg text-[13px] font-medium transition-colors ${
                      selectedCover === 1
                        ? "bg-[#2C6CFF] text-white"
                        : "border border-[#EBEBEB] text-[#6B6B6B]"
                    }`}
                  >
                    Solo 1 mes
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCover(detectedMonths)}
                    className={`flex h-9 flex-1 items-center justify-center rounded-lg text-[13px] font-medium transition-colors ${
                      selectedCover === detectedMonths
                        ? "bg-[#2C6CFF] text-white"
                        : "border border-[#EBEBEB] text-[#6B6B6B]"
                    }`}
                  >
                    Marcar {detectedMonths} meses
                  </button>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="mt-3 rounded-[10px] bg-[#F7F7F5] p-3">
              <p className="font-mono text-[15px] font-medium text-[#2C6CFF]">
                Monto a registrar: {formatCurrency(parsedAmount)}
              </p>
              <p className="mt-0.5 text-[13px] text-[#6B6B6B]">
                Meses a marcar: {showMultiMonth ? selectedCover : 1} de {remainingMonths} restantes
              </p>
            </div>

            {/* Buttons */}
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex h-11 flex-1 items-center justify-center rounded-xl border border-[#EBEBEB] text-[15px] font-medium text-[#6B6B6B]"
              >
                Cancelar
              </button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                disabled={parsedAmount <= 0}
                onClick={() => onConfirm(parsedAmount, showMultiMonth ? selectedCover : 1)}
                className="flex h-11 flex-1 items-center justify-center rounded-xl bg-[#2C6CFF] text-[15px] font-medium text-white disabled:opacity-50"
              >
                Registrar pago
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
