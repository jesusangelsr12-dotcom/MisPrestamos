"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";

interface PinKeypadProps {
  onComplete: (pin: string) => void;
  length?: number;
  disabled?: boolean;
  shake?: boolean;
}

const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

export function PinKeypad({
  onComplete,
  length = 6,
  disabled = false,
  shake = false,
}: PinKeypadProps) {
  const [pin, setPin] = useState("");

  const handleKey = useCallback(
    (key: string) => {
      if (disabled) return;

      if (key === "del") {
        setPin((prev) => prev.slice(0, -1));
        return;
      }

      if (key === "") return;

      const newPin = pin + key;
      if (newPin.length > length) return;

      setPin(newPin);

      if (newPin.length === length) {
        onComplete(newPin);
        // Reset after a short delay to allow animation
        setTimeout(() => setPin(""), 300);
      }
    },
    [pin, length, onComplete, disabled]
  );

  return (
    <div className="flex flex-col items-center gap-8">
      {/* PIN Dots */}
      <motion.div
        className="flex gap-3"
        animate={shake ? { x: [0, -10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        {Array.from({ length }).map((_, i) => (
          <div
            key={i}
            className={`w-3.5 h-3.5 rounded-full transition-colors duration-150 ${
              i < pin.length
                ? "bg-accent"
                : "border-2 border-[#EBEBEB] bg-transparent"
            }`}
          />
        ))}
      </motion.div>

      {/* Keypad Grid */}
      <div className="grid grid-cols-3 gap-4">
        {keys.map((key, i) => {
          if (key === "") {
            return <div key={i} className="w-16 h-16" />;
          }

          return (
            <motion.button
              key={i}
              type="button"
              disabled={disabled}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleKey(key)}
              className={`w-16 h-16 rounded-full flex items-center justify-center text-[22px] font-display transition-colors select-none ${
                disabled
                  ? "opacity-40 cursor-not-allowed"
                  : "active:bg-muted"
              } ${
                key === "del"
                  ? "text-muted-foreground text-base"
                  : "bg-white text-foreground shadow-sm"
              }`}
            >
              {key === "del" ? (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                  <line x1="18" y1="9" x2="12" y2="15" />
                  <line x1="12" y1="9" x2="18" y2="15" />
                </svg>
              ) : (
                key
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
