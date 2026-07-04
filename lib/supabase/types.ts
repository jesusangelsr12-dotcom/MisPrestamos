import type { Card, ExpenseOwner } from "@/types";

// Tipos de entrada compartidos entre los server actions y los formularios.
// Viven fuera de los módulos "use server" porque esos solo pueden exportar
// funciones async.

export type CardInput = Omit<Card, "id" | "created_at">;

export interface MSIInput {
  card_id: string;
  description: string;
  total_amount: number;
  months: number;
  start_date: string;
  owner: ExpenseOwner;
  owner_name: string | null;
  has_final_payment?: boolean;
  final_payment_amount?: number | null;
}

export type LoanType = "given" | "received";

export interface LoanGivenInput {
  borrower_name: string;
  amount: number;
  monthly_payment: number;
  total_months: number;
  start_date: string;
  notes: string | null;
}

export interface LoanReceivedInput {
  lender_name: string;
  amount: number;
  monthly_payment: number;
  total_months: number;
  start_date: string;
  notes: string | null;
}
