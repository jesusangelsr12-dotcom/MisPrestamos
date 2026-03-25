"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MonthProjectionCard } from "@/components/features/MonthProjectionCard";
import { BottomNav } from "@/components/features/BottomNav";
import { useProjection } from "@/lib/hooks/useProjection";

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export default function ProjectionPage() {
  const { projection, loading, error, refresh } = useProjection();
  const now = new Date();
  const [expandedIndex, setExpandedIndex] = useState<number>(0);

  return (
    <main className="min-h-screen px-5 pb-20 pt-safe">
      {/* Header */}
      <div className="pb-4 pt-6">
        <h1 className="text-2xl font-bold font-display">Proyección</h1>
        <p className="mt-1 text-sm text-muted-foreground">Próximos 12 meses</p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-3 pt-20">
          <p className="text-sm text-red-500">{error}</p>
          <button
            type="button"
            onClick={() => refresh()}
            className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {projection.map((p, i) => (
            <motion.div
              key={p.month.toISOString()}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <MonthProjectionCard
                month={p.month}
                msiTotal={p.msiTotal}
                loansGivenTotal={p.loansGivenTotal}
                loansReceivedTotal={p.loansReceivedTotal}
                total={p.total}
                isCurrentMonth={isSameMonth(p.month, now)}
                expanded={expandedIndex === i}
                onToggle={() =>
                  setExpandedIndex(expandedIndex === i ? -1 : i)
                }
              />
            </motion.div>
          ))}
        </div>
      )}

      <BottomNav />
    </main>
  );
}
