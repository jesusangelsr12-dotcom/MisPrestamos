"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { AccountForm } from "@/components/features/AccountForm";
import { useAccounts } from "@/lib/hooks/useAccounts";
import { fetchAccountById } from "@/lib/db/accounts";
import type { AccountInput } from "@/lib/db/accounts";
import type { Account } from "@/types";

export default function EditAccountPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { updateAccount } = useAccounts();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccountById(params.id).then((data) => {
      setAccount(data);
      setLoading(false);
    });
  }, [params.id]);

  async function handleSubmit(data: AccountInput) {
    await updateAccount(params.id, data);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2C6CFF] border-t-transparent" />
      </main>
    );
  }

  if (!account) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-2">
        <p className="text-[15px] text-[#6B6B6B]">Cuenta no encontrada</p>
        <button type="button" onClick={() => router.push("/")} className="text-[14px] text-[#2C6CFF] underline">
          Volver
        </button>
      </main>
    );
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
            Editar cuenta
          </h1>
        </div>
        <AccountForm
          initialData={{
            name: account.name,
            type: account.type,
            cut_off_day: account.cut_off_day,
            payment_due_day: account.payment_due_day,
          }}
          onSubmit={handleSubmit}
          submitLabel="Guardar cambios"
          redirectTo={`/accounts/${params.id}`}
        />
      </motion.div>
    </main>
  );
}
