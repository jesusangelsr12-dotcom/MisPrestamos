"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MSICard } from "@/components/features/MSICard";
import { BottomNav } from "@/components/features/BottomNav";
import { useMSI } from "@/lib/hooks/useMSI";

type FilterType = "all" | "me" | "other" | string;

export default function MSIPage() {
  const router = useRouter();
  const { expenses, loading, error, markPaid, deleteExpense, refresh } = useMSI();
  const [filter, setFilter] = useState<FilterType>("all");
  const [deleteError, setDeleteError] = useState("");

  const cardFilters = useMemo(() => {
    const seen = new Map<string, { name: string; color: string }>();
    for (const e of expenses) {
      if (!seen.has(e.card_id)) {
        seen.set(e.card_id, { name: e.card.name, color: e.card.color });
      }
    }
    return Array.from(seen.entries()).map(([id, info]) => ({ id, ...info }));
  }, [expenses]);

  const filtered = useMemo(() => {
    if (filter === "all") return expenses;
    if (filter === "me") return expenses.filter((e) => e.owner === "me");
    if (filter === "other") return expenses.filter((e) => e.owner === "other");
    return expenses.filter((e) => e.card_id === filter);
  }, [expenses, filter]);

  const grouped = useMemo(() => {
    const groups = new Map<string, { card: { name: string; bank: string; color: string }; items: typeof filtered }>();
    for (const e of filtered) {
      if (!groups.has(e.card_id)) {
        groups.set(e.card_id, { card: { name: e.card.name, bank: e.card.bank, color: e.card.color }, items: [] });
      }
      groups.get(e.card_id)!.items.push(e);
    }
    return Array.from(groups.values());
  }, [filtered]);

  async function handleMarkPaid(id: string, amount: number, monthsCovered: number) {
    try { await markPaid(id, amount, monthsCovered); } catch (err) { setDeleteError(err instanceof Error ? err.message : "Error"); }
  }

  async function handleDelete(id: string) {
    setDeleteError("");
    try { await deleteExpense(id); } catch (err) { setDeleteError(err instanceof Error ? err.message : "Error al eliminar"); }
  }

  function chipCls(active: boolean) {
    return `flex h-9 shrink-0 items-center rounded-full px-3.5 text-[13px] font-medium transition-colors ${
      active ? "bg-[#2C6CFF] text-white" : "border border-[#EBEBEB] bg-white text-[#6B6B6B]"
    }`;
  }

  return (
    <main className="min-h-screen px-5 pb-24 pt-safe">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="pb-4 pt-6">
          <h1 className="font-display text-[28px] font-semibold text-[#1A1A1A]" style={{ letterSpacing: "-0.5px" }}>Gastos MSI</h1>
        </div>

        {expenses.length > 0 && (
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button type="button" onClick={() => setFilter("all")} className={chipCls(filter === "all")}>Todos</button>
            {cardFilters.map((c) => (
              <button key={c.id} type="button" onClick={() => setFilter(c.id)} className={chipCls(filter === c.id)}>
                <span className="mr-1.5 block h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                {c.name}
              </button>
            ))}
            <button type="button" onClick={() => setFilter("me")} className={chipCls(filter === "me")}>Mis gastos</button>
            <button type="button" onClick={() => setFilter("other")} className={chipCls(filter === "other")}>Otros</button>
          </div>
        )}

        {deleteError && <p className="mb-3 text-[14px] text-[#EF4444]">{deleteError}</p>}

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2C6CFF] border-t-transparent" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 pt-20">
            <p className="text-[14px] text-[#EF4444]">{error}</p>
            <button type="button" onClick={() => refresh()} className="rounded-[10px] bg-[#2C6CFF] px-5 py-2.5 text-[14px] font-medium text-white">Reintentar</button>
          </div>
        ) : expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 pt-20">
            <span className="text-[64px]">📊</span>
            <p className="text-[18px] font-semibold text-[#1A1A1A]">Sin gastos MSI</p>
            <p className="text-[14px] text-[#6B6B6B]">Registra tus compras a meses sin intereses</p>
            <Link href="/msi/new" className="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-[#2C6CFF] text-[15px] font-semibold text-white">Agregar gasto MSI</Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 pt-20">
            <p className="text-[14px] text-[#A8A8A8]">No hay gastos con este filtro</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {grouped.map((group) => (
              <div key={group.card.name + group.card.bank}>
                <div className="mb-2 flex items-center gap-2 px-1">
                  <span className="block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: group.card.color }} />
                  <span className="text-[12px] font-medium text-[#A8A8A8]">{group.card.bank} · {group.card.name}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {group.items.map((expense, i) => (
                    <motion.div key={expense.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.05, 0.3) }}>
                      <MSICard expense={expense} onMarkPaid={handleMarkPaid} onEdit={(id) => router.push(`/msi/${id}/edit`)} onDelete={handleDelete} />
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {expenses.length > 0 && (
        <Link href="/msi/new" className="fixed bottom-24 right-5 flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-[#2C6CFF] text-white" style={{ boxShadow: "0 4px 16px rgba(44,108,255,0.35)" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        </Link>
      )}

      <BottomNav />
    </main>
  );
}
