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
