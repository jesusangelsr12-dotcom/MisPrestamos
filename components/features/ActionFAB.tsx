"use client";

import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface FABAction {
  key: string;
  icon: ReactNode;
  label: string;
  onSelect: () => void;
}

interface ActionFABProps {
  actions: FABAction[];
}

export function ActionFAB({ actions }: ActionFABProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-24 right-5 z-30 flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-[#2C6CFF] text-white"
        style={{ boxShadow: "0 4px 16px rgba(44,108,255,0.35)" }}
        aria-label="Agregar"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/30"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-white px-5 pb-safe pt-5"
            >
              <div className="mb-4 flex justify-center">
                <div className="h-1 w-8 rounded-full bg-[#E8E8E5]" />
              </div>
              <div className="flex flex-col gap-2">
                {actions.map((action) => (
                  <button
                    key={action.key}
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      action.onSelect();
                    }}
                    className="flex h-14 items-center gap-3 rounded-xl bg-[#F7F7F5] px-4 text-left"
                  >
                    {action.icon}
                    <span className="text-[15px] font-medium text-[#1A1A1A]">{action.label}</span>
                  </button>
                ))}
                <button type="button" onClick={() => setOpen(false)} className="mt-1 flex h-12 items-center justify-center rounded-xl text-[15px] text-[#A8A8A8]">
                  Cancelar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
