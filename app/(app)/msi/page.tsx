"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MSICard } from "@/components/features/MSICard";
import { BottomNav } from "@/components/features/BottomNav";
import { useMSI } from "@/lib/hooks/useMSI";

type FilterType = "all" | "me" | "other" | string; // string = card_id

export default function MSIPage() {
  const router = useRouter();
  const { expenses, loading, error, markPaid, deleteExpense, refresh } = useMSI();
  const [filter, setFilter] = useState<FilterType>("all");
  const [deleteError, setDeleteError] = useState("");

  // Build card filter chips from data
  const cardFilters = useMemo(() => {
    const seen = new Map<string, { name: string; color: string }>();
    for (const e of expenses) {
      if (!seen.has(e.card_id)) {
        seen.set(e.card_id, { name: e.card.name, color: e.card.color });
      }
    }
    return Array.from(seen.entries()).map(([id, info]) => ({
      id,
      ...info,
    }));
  }, [expenses]);

  const filtered = useMemo(() => {
    if (filter === "all") return expenses;
    if (filter === "me") return expenses.filter((e) => e.owner === "me");
    if (filter === "other") return expenses.filter((e) => e.owner === "other");
    return expenses.filter((e) => e.card_id === filter);
  }, [expenses, filter]);

  // Group by card
  const grouped = useMemo(() => {
    const groups = new Map<
      string,
      { card: { name: string; bank: string; color: string }; items: typeof filtered }
    >();
    for (const e of filtered) {
      if (!groups.has(e.card_id)) {
        groups.set(e.card_id, {
          card: { name: e.card.name, bank: e.card.bank, color: e.card.color },
          items: [],
        });
      }
      groups.get(e.card_id)!.items.push(e);
    }
    return Array.from(groups.values());
  }, [filtered]);

  async function handleMarkPaid(id: string) {
    try {
      await markPaid(id);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Error");
    }
  }

  async function handleDelete(id: string) {
    setDeleteError("");
    try {
      await deleteExpense(id);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Error al eliminar");
    }
  }

  const chipBase =
    "flex h-9 items-center rounded-full px-4 text-sm font-medium transition-colors";
  const chipActive = "bg-accent text-white";
  const chipInactive = "bg-muted text-muted-foreground";

  return (
    <main className="min-h-screen px-5 pb-20 pt-safe">
      {/* Header */}
      <div className="pb-4 pt-6">
        <h1 className="text-2xl font-bold font-display">Gastos MSI</h1>
      </div>

      {/* Filter chips */}
      {expenses.length > 0 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`${chipBase} ${filter === "all" ? chipActive : chipInactive}`}
          >
            Todos
          </button>
          {cardFilters.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setFilter(c.id)}
              className={`${chipBase} shrink-0 ${filter === c.id ? chipActive : chipInactive}`}
            >
              <span
                className="mr-1.5 block h-2 w-2 rounded-full"
                style={{ backgroundColor: c.color }}
              />
              {c.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setFilter("me")}
            className={`${chipBase} shrink-0 ${filter === "me" ? chipActive : chipInactive}`}
          >
            Mis gastos
          </button>
          <button
            type="button"
            onClick={() => setFilter("other")}
            className={`${chipBase} shrink-0 ${filter === "other" ? chipActive : chipInactive}`}
          >
            Otros
          </button>
        </div>
      )}

      {deleteError && (
        <p className="mb-3 text-sm text-red-500">{deleteError}</p>
      )}

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
      ) : expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 pt-20">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          </div>
          <p className="text-[15px] font-medium text-foreground">
            No tienes gastos MSI registrados
          </p>
          <p className="text-sm text-muted-foreground">
            Empieza registrando tus compras a meses sin intereses
          </p>
          <Link
            href="/msi/new"
            className="mt-2 rounded-xl bg-accent px-6 py-3 text-[15px] font-semibold text-white"
          >
            Agregar gasto MSI
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 pt-20">
          <p className="text-[15px] text-muted-foreground">
            No hay gastos con este filtro
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {grouped.map((group) => (
            <div key={group.card.name + group.card.bank}>
              {/* Card mini header */}
              <div className="mb-2 flex items-center gap-2 px-1">
                <span
                  className="block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: group.card.color }}
                />
                <span className="text-sm font-medium text-muted-foreground">
                  {group.card.bank} · {group.card.name}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {group.items.map((expense, i) => (
                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <MSICard
                      expense={expense}
                      onMarkPaid={handleMarkPaid}
                      onEdit={(id) => router.push(`/msi/${id}/edit`)}
                      onDelete={handleDelete}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      {expenses.length > 0 && (
        <Link
          href="/msi/new"
          className="fixed bottom-24 right-5 flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-accent text-white shadow-md"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </Link>
      )}

      <BottomNav />
    </main>
  );
}
