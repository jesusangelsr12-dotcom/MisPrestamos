"use client";

import { motion } from "framer-motion";

interface CardListItemProps {
  name: string;
  bank: string;
  lastFour: string;
  color: string;
  onTap: () => void;
}

export function CardListItem({
  name,
  bank,
  lastFour,
  color,
  onTap,
}: CardListItemProps) {
  return (
    <motion.button
      type="button"
      onClick={onTap}
      className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3.5 text-left"
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-3">
        <span
          className="block h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        <div>
          <p className="text-[15px] font-medium text-foreground">{name}</p>
          <p className="text-sm text-muted-foreground">{bank}</p>
        </div>
      </div>
      <span className="font-mono text-sm text-muted-foreground">
        •••• {lastFour}
      </span>
    </motion.button>
  );
}
