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
    <main className="min-h-screen px-5 pb-24 pt-safe">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="pb-4 pt-6">
          <h1 className="font-display text-[28px] font-semibold text-[#1A1A1A]" style={{ letterSpacing: "-0.5px" }}>Proyección</h1>
          <p className="mt-1 text-[14px] text-[#6B6B6B]">Próximos 12 meses</p>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2C6CFF] border-t-transparent" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 pt-20">
            <p className="text-[14px] text-[#EF4444]">{error}</p>
            <button type="button" onClick={() => refresh()} className="rounded-[10px] bg-[#2C6CFF] px-5 py-2.5 text-[14px] font-medium text-white">Reintentar</button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {projection.map((p, i) => (
              <motion.div key={p.month.toISOString()} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.3) }}>
                <MonthProjectionCard
                  month={p.month} msiTotal={p.msiTotal} loansGivenTotal={p.loansGivenTotal}
                  loansReceivedTotal={p.loansReceivedTotal} total={p.total}
                  isCurrentMonth={isSameMonth(p.month, now)}
                  expanded={expandedIndex === i}
                  onToggle={() => setExpandedIndex(expandedIndex === i ? -1 : i)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
      <BottomNav />
    </main>
  );
}
