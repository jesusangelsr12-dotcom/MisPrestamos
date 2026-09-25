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

// Parte de una persona en un gasto compartido, sobre el monto total del gasto.
// Mi parte no se guarda: es amount - suma de partes (ver lib/utils/shares.ts).
export interface ExpenseShare {
  person_id: string;
  person_name: string;
  amount: number;
}

export interface TransactionWithRelations extends Transaction {
  category: Pick<Category, "name"> | null;
  person: Pick<Person, "name"> | null;
  source_account: Pick<Account, "name" | "type"> | null;
  shares: ExpenseShare[]; // vacío si el gasto no es compartido
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

// Pagos que me hace de vuelta la persona dueña de un gasto que no es "Mío".
// Cada uno corresponde a una cuota MSI marcada como pagada (installment_number
// null solo en registros antiguos de antes de este esquema).
// En un gasto compartido cada persona paga sus propias cuotas (person_id);
// null = la persona dueña del gasto completo (transactions.person_id).
export interface Reimbursement {
  id: string;
  expense_id: string;
  person_id: string | null;
  installment_number: number | null;
  amount: number;
  date: string;
  note: string | null;
  created_at: string;
}
