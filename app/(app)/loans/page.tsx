"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LoanCard } from "@/components/features/LoanCard";
import { BottomNav } from "@/components/features/BottomNav";
import { useLoans } from "@/lib/hooks/useLoans";
import type { LoanType } from "@/lib/supabase/loans";

type Tab = "given" | "received";

export default function LoansPage() {
  const router = useRouter();
  const { given, received, loading, error, markPaid, deleteLoan, refresh } = useLoans();
  const [tab, setTab] = useState<Tab>("given");
  const [actionError, setActionError] = useState("");

  const list = tab === "given" ? given : received;

  async function handleMarkPaid(id: string, type: LoanType, amount: number, monthsCovered: number) {
    setActionError("");
    try { await markPaid(id, type, amount, monthsCovered); } catch (err) { setActionError(err instanceof Error ? err.message : "Error"); }
  }

  async function handleDelete(id: string, type: LoanType) {
    setActionError("");
    try { await deleteLoan(id, type); } catch (err) { setActionError(err instanceof Error ? err.message : "Error al eliminar"); }
  }

  return (
    <main className="min-h-screen px-5 pb-24 pt-safe">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="pb-4 pt-6">
          <h1 className="font-display text-[28px] font-semibold text-[#1A1A1A]" style={{ letterSpacing: "-0.5px" }}>Préstamos</h1>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex border-b border-[#EBEBEB]">
          <button type="button" onClick={() => setTab("given")} className={`flex-1 pb-2.5 text-center text-[15px] font-medium transition-colors ${tab === "given" ? "border-b-2 border-[#2C6CFF] font-semibold text-[#2C6CFF]" : "text-[#A8A8A8]"}`}>
            Presté 💸
          </button>
          <button type="button" onClick={() => setTab("received")} className={`flex-1 pb-2.5 text-center text-[15px] font-medium transition-colors ${tab === "received" ? "border-b-2 border-[#2C6CFF] font-semibold text-[#2C6CFF]" : "text-[#A8A8A8]"}`}>
            Me prestaron 📥
          </button>
        </div>

        {actionError && <p className="mb-3 text-[14px] text-[#EF4444]">{actionError}</p>}

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
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, x: tab === "given" ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: tab === "given" ? 20 : -20 }}
              transition={{ duration: 0.2 }}
            >
              {list.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 pt-20">
                  <span className="text-[64px]">{tab === "given" ? "💸" : "📥"}</span>
                  <p className="text-[18px] font-semibold text-[#1A1A1A]">{tab === "given" ? "No has prestado dinero" : "No te han prestado dinero"}</p>
                  <p className="text-[14px] text-[#6B6B6B]">{tab === "given" ? "Registra préstamos que hagas a otros" : "Registra préstamos que te hayan hecho"}</p>
                  <Link href={`/loans/new?type=${tab}`} className="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-[#2C6CFF] text-[15px] font-semibold text-white">Agregar préstamo</Link>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {list.map((loan, i) => (
                    <motion.div key={loan.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.05, 0.3) }}>
                      <LoanCard loan={loan} type={tab} onMarkPaid={handleMarkPaid} onEdit={(id) => router.push(`/loans/${id}/edit?type=${tab}`)} onDelete={handleDelete} />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>

      <Link href={`/loans/new?type=${tab}`} className="fixed bottom-24 right-5 flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-[#2C6CFF] text-white" style={{ boxShadow: "0 4px 16px rgba(44,108,255,0.35)" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
      </Link>

      <BottomNav />
    </main>
  );
}
