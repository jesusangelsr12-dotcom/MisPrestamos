"use client";

import { motion, AnimatePresence } from "framer-motion";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
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
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90vh] flex-col bg-white"
            style={{ borderRadius: "24px 24px 0 0" }}
          >
            <div className="flex justify-center pt-2.5 pb-1.5">
              <div className="h-1 w-8 rounded-full bg-[#E8E8E5]" />
            </div>
            <div className="flex-1 overflow-y-auto px-5" style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}>
              <p className="mb-3 text-[16px] font-semibold text-[#1A1A1A]">{title}</p>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
