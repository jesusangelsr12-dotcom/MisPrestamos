export interface Card {
  id: string;
  name: string;
  bank: string;
  color: string;
  last_four: string;
  created_at: string;
}

export type ExpenseOwner = "me" | "other";

export interface MSIExpense {
  id: string;
  card_id: string;
  description: string;
  total_amount: number;
  monthly_amount: number;
  months: number;
  months_paid: number;
  start_date: string;
  owner: ExpenseOwner;
  owner_name: string | null;
  has_final_payment: boolean;
  final_payment_amount: number | null;
  created_at: string;
}

export interface LoanGiven {
  id: string;
  borrower_name: string;
  amount: number;
  monthly_payment: number;
  total_months: number;
  months_paid: number;
  start_date: string;
  notes: string | null;
  created_at: string;
}

export interface LoanReceived {
  id: string;
  lender_name: string;
  amount: number;
  monthly_payment: number;
  total_months: number;
  months_paid: number;
  start_date: string;
  notes: string | null;
  created_at: string;
}

export interface MSIExpenseWithCard extends MSIExpense {
  card: Pick<Card, "name" | "bank" | "color" | "last_four">;
}

export interface PinAuth {
  id: string;
  hashed_pin: string;
  created_at: string;
}

export type PaymentEntityType = "msi" | "loan_given" | "loan_received";

export interface PaymentHistory {
  id: string;
  entity_type: PaymentEntityType;
  entity_id: string;
  entity_name: string;
  month_number: number;
  amount: number;
  months_covered: number;
  paid_at: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Finanzas personales (Home, cuentas, gastos, presupuesto).
// Independiente del módulo de Préstamos de arriba (cards, msi_expenses, loans_*).
// ---------------------------------------------------------------------------

export type AccountType = "cash" | "credit_card" | "savings" | "investment" | "other";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  cut_off_day: number | null;
  payment_due_day: number | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  created_at: string;
}

export interface Person {
  id: string;
  name: string;
  created_at: string;
}

export type TransactionType = "expense" | "payment" | "transfer";

export const MSI_MONTHS_OPTIONS = [0, 3, 6, 9, 12, 18, 24, 36] as const;
export type MSIMonths = (typeof MSI_MONTHS_OPTIONS)[number];

export interface Transaction {
  id: string;
  type: TransactionType;
  date: string;
  amount: number;
  account_id: string;
  source_account_id: string | null;
  category_id: string | null;
  person_id: string | null;
  note: string | null;
  msi_months: number;
  created_at: string;
}

export interface TransactionWithRelations extends Transaction {
  category: Pick<Category, "name"> | null;
  person: Pick<Person, "name"> | null;
  source_account: Pick<Account, "name" | "type"> | null;
}

export interface Budget {
  id: string;
  category_id: string;
  month: string;
  amount: number;
  created_at: string;
}

export interface BudgetWithCategory extends Budget {
  category: Pick<Category, "name">;
}
