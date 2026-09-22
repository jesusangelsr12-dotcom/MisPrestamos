"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AccountForm } from "@/components/features/AccountForm";
import { useAccounts } from "@/lib/hooks/useAccounts";
import type { AccountInput } from "@/lib/db/accounts";

export default function NewAccountPage() {
  const router = useRouter();
  const { createAccount } = useAccounts();

  async function handleSubmit(data: AccountInput) {
    await createAccount(data);
  }

  return (
    <main className="min-h-screen px-5 pb-safe pt-safe">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="pb-6 pt-6">
          <button type="button" onClick={() => router.back()} className="mb-3 flex items-center gap-1 text-[14px] text-[#2C6CFF]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Volver
          </button>
          <h1 className="font-display text-[24px] font-semibold text-[#1A1A1A]" style={{ letterSpacing: "-0.5px" }}>
            Nueva cuenta
          </h1>
        </div>
        <AccountForm onSubmit={handleSubmit} submitLabel="Crear cuenta" />
      </motion.div>
    </main>
  );
}
