"use client";

import { motion } from "framer-motion";

interface CardListItemProps {
  name: string;
  bank: string;
  lastFour: string;
  color: string;
  onTap: () => void;
}

export function CardListItem({ name, bank, lastFour, color, onTap }: CardListItemProps) {
  return (
    <motion.button
      type="button"
      onClick={onTap}
      className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-4 text-left"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
      whileTap={{ scale: 0.97 }}
    >
      <div className="flex items-center gap-3">
        <span
          className="block h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        <div>
          <p className="text-[15px] font-medium text-[#1A1A1A]">{name}</p>
          <p className="text-[12px] text-[#A8A8A8]">{bank}</p>
        </div>
      </div>
      <span className="font-mono text-[14px] text-[#6B6B6B]">
        •••• {lastFour}
      </span>
    </motion.button>
  );
}
