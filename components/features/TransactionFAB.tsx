"use client";

import { useState } from "react";
import { Receipt, Landmark, ArrowLeftRight } from "lucide-react";
import { useAccounts } from "@/lib/hooks/useAccounts";
import { ActionFAB } from "@/components/features/ActionFAB";
import { ExpenseFormSheet } from "@/components/features/ExpenseFormSheet";
import { PaymentFormSheet } from "@/components/features/PaymentFormSheet";
import { TransferFormSheet } from "@/components/features/TransferFormSheet";
import { insertTransaction, type TransactionInput } from "@/lib/db/transactions";
import { revalidateFinanceData } from "@/lib/swr/finance";
import type { Account } from "@/types";

type ActiveForm = "expense" | "payment" | "transfer" | null;

interface TransactionFABProps {
  cardAccount: Account;
  onCreated: () => void;
}

export function TransactionFAB({ cardAccount, onCreated }: TransactionFABProps) {
  const { accounts } = useAccounts();
  const [activeForm, setActiveForm] = useState<ActiveForm>(null);

  async function handleSubmit(input: TransactionInput) {
    await insertTransaction(input);
    await revalidateFinanceData();
    onCreated();
  }

  return (
    <>
      <ActionFAB
        actions={[
          { key: "expense", icon: <Receipt size={20} color="#2C6CFF" />, label: "Gasto", onSelect: () => setActiveForm("expense") },
          { key: "payment", icon: <Landmark size={20} color="#00A878" />, label: "Pago o ingreso", onSelect: () => setActiveForm("payment") },
          { key: "transfer", icon: <ArrowLeftRight size={20} color="#8B5CF6" />, label: "Transferencia entre cuentas", onSelect: () => setActiveForm("transfer") },
        ]}
      />

      <ExpenseFormSheet
        isOpen={activeForm === "expense"}
        onClose={() => setActiveForm(null)}
        accounts={accounts}
        defaultAccountId={cardAccount.id}
        onSubmit={handleSubmit}
      />
      <PaymentFormSheet
        isOpen={activeForm === "payment"}
        onClose={() => setActiveForm(null)}
        accounts={accounts}
        defaultAccountId={cardAccount.id}
        onSubmit={handleSubmit}
      />
      <TransferFormSheet
        isOpen={activeForm === "transfer"}
        onClose={() => setActiveForm(null)}
        accounts={accounts}
        defaultSourceAccountId={cardAccount.id}
        onSubmit={handleSubmit}
      />
    </>
  );
}
