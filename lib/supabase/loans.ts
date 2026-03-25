import { createClient } from "@/lib/supabase/client";
import type { LoanGiven, LoanReceived } from "@/types";

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

export async function fetchLoansGiven(): Promise<LoanGiven[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("loans_given")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as LoanGiven[];
}

export async function fetchLoansReceived(): Promise<LoanReceived[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("loans_received")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as LoanReceived[];
}

export async function fetchLoanGivenById(id: string): Promise<LoanGiven | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("loans_given")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as LoanGiven;
}

export async function fetchLoanReceivedById(id: string): Promise<LoanReceived | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("loans_received")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as LoanReceived;
}

export async function insertLoanGiven(input: LoanGivenInput): Promise<LoanGiven> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("loans_given")
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as LoanGiven;
}

export async function insertLoanReceived(input: LoanReceivedInput): Promise<LoanReceived> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("loans_received")
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as LoanReceived;
}

export async function updateLoanGivenById(
  id: string,
  input: Partial<LoanGivenInput>
): Promise<LoanGiven> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("loans_given")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as LoanGiven;
}

export async function updateLoanReceivedById(
  id: string,
  input: Partial<LoanReceivedInput>
): Promise<LoanReceived> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("loans_received")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as LoanReceived;
}

export async function deleteLoanById(id: string, type: LoanType): Promise<void> {
  const supabase = createClient();
  const table = type === "given" ? "loans_given" : "loans_received";
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function markLoanMonthPaid(
  id: string,
  type: LoanType
): Promise<LoanGiven | LoanReceived> {
  const supabase = createClient();
  const table = type === "given" ? "loans_given" : "loans_received";
  const { data: current, error: fetchError } = await supabase
    .from(table)
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !current) throw new Error("Préstamo no encontrado");
  if (current.months_paid >= current.total_months) {
    throw new Error("Este préstamo ya está completado");
  }

  const newMonthsPaid = current.months_paid + 1;

  const { data, error } = await supabase
    .from(table)
    .update({ months_paid: newMonthsPaid })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Record payment history
  const entityType = type === "given" ? "loan_given" : "loan_received";
  const entityName = type === "given"
    ? (current as { borrower_name: string }).borrower_name
    : (current as { lender_name: string }).lender_name;
  await supabase.from("payment_history").insert({
    entity_type: entityType,
    entity_id: id,
    entity_name: entityName,
    month_number: newMonthsPaid,
    amount: current.monthly_payment,
  });

  return data as LoanGiven | LoanReceived;
}
