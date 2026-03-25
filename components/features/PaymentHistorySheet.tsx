"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CalendarCheck } from "lucide-react";
import { usePaymentHistoryByEntity } from "@/lib/hooks/usePaymentHistory";
import type { PaymentEntityType } from "@/types";

interface PaymentHistorySheetProps {
  isOpen: boolean;
  onClose: () => void;
  entityId: string;
  entityName: string;
  entityType: PaymentEntityType;
}

function formatCurrency(n: number): string {
  return n.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const months = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
  ];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day} ${month} ${year} · ${hours}:${minutes}`;
}

export function PaymentHistorySheet({
  isOpen,
  onClose,
  entityId,
  entityName,
}: PaymentHistorySheetProps) {
  const { history, loading } = usePaymentHistoryByEntity(
    isOpen ? entityId : null
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[4px]"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[70vh] flex-col bg-white px-5 pb-safe pt-5"
            style={{ borderRadius: "24px 24px 0 0" }}
          >
            {/* Handle bar */}
            <div className="mb-4 flex justify-center">
              <div className="h-1 w-8 rounded-full bg-[#E8E8E5]" />
            </div>

            {/* Header */}
            <div className="mb-4">
              <p className="text-[18px] font-semibold text-[#1A1A1A]">
                {entityName}
              </p>
              <p className="mt-0.5 text-[13px] text-[#A8A8A8]">
                Historial de pagos
              </p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex h-20 items-center justify-center">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#2C6CFF] border-t-transparent" />
                </div>
              ) : history.length === 0 ? (
                <div className="flex h-20 items-center justify-center">
                  <p className="text-[14px] text-[#A8A8A8]">
                    Sin pagos registrados aún
                  </p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {history.map((payment, i) => (
                    <div key={payment.id}>
                      <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <CalendarCheck
                            size={16}
                            strokeWidth={2}
                            color="#2C6CFF"
                          />
                          <span className="text-[14px] font-medium text-[#1A1A1A]">
                            Mes {payment.month_number}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-[15px] font-medium text-[#1A1A1A]">
                            {formatCurrency(payment.amount)}
                          </p>
                          <p className="text-[12px] text-[#A8A8A8]">
                            {formatDate(payment.paid_at)}
                          </p>
                        </div>
                      </div>
                      {i < history.length - 1 && (
                        <div className="h-px bg-[#EBEBEB]" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
