"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Receipt, Landmark, ArrowLeftRight } from "lucide-react";
import { ActionFAB } from "@/components/features/ActionFAB";
import { ExpenseFormSheet } from "@/components/features/ExpenseFormSheet";
import { PaymentFormSheet } from "@/components/features/PaymentFormSheet";
import { TransferFormSheet } from "@/components/features/TransferFormSheet";
import { insertTransaction, type TransactionInput } from "@/lib/db/transactions";
import type { Account } from "@/types";

type ActiveForm = "expense" | "payment" | "transfer" | null;

interface HomeActionFABProps {
  accounts: Account[];
  onCreated: () => void;
}

export function HomeActionFAB({ accounts, onCreated }: HomeActionFABProps) {
  const router = useRouter();
  const [activeForm, setActiveForm] = useState<ActiveForm>(null);

  const defaultAccountId = accounts.find((a) => a.type === "credit_card")?.id ?? accounts[0]?.id ?? "";

  async function handleSubmit(input: TransactionInput) {
    await insertTransaction(input);
    onCreated();
  }

  return (
    <>
      <ActionFAB
        actions={[
          { key: "account", icon: <Wallet size={20} color="#6B6B6B" />, label: "Agregar cuenta", onSelect: () => router.push("/accounts/new") },
          { key: "expense", icon: <Receipt size={20} color="#2C6CFF" />, label: "Gasto", onSelect: () => setActiveForm("expense") },
          { key: "payment", icon: <Landmark size={20} color="#00A878" />, label: "Pago o ingreso", onSelect: () => setActiveForm("payment") },
          { key: "transfer", icon: <ArrowLeftRight size={20} color="#8B5CF6" />, label: "Transferencia entre cuentas", onSelect: () => setActiveForm("transfer") },
        ]}
      />

      <ExpenseFormSheet
        isOpen={activeForm === "expense"}
        onClose={() => setActiveForm(null)}
        accounts={accounts}
        defaultAccountId={defaultAccountId}
        onSubmit={handleSubmit}
      />
      <PaymentFormSheet
        isOpen={activeForm === "payment"}
        onClose={() => setActiveForm(null)}
        accounts={accounts}
        defaultAccountId={defaultAccountId}
        onSubmit={handleSubmit}
      />
      <TransferFormSheet
        isOpen={activeForm === "transfer"}
        onClose={() => setActiveForm(null)}
        accounts={accounts}
        defaultSourceAccountId={defaultAccountId}
        onSubmit={handleSubmit}
      />
    </>
  );
}
