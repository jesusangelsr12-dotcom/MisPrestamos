"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireSession } from "@/lib/auth-guard";
import type {
  LoanGiven,
  LoanReceived,
  LoanType,
  LoanGivenInput,
  LoanReceivedInput,
} from "@/types";

export async function fetchLoansGiven(): Promise<LoanGiven[]> {
  await requireSession();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("loans_given")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as LoanGiven[];
}

export async function fetchLoansReceived(): Promise<LoanReceived[]> {
  await requireSession();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("loans_received")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as LoanReceived[];
}

export async function fetchLoanGivenById(id: string): Promise<LoanGiven | null> {
  await requireSession();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("loans_given")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as LoanGiven;
}

export async function fetchLoanReceivedById(id: string): Promise<LoanReceived | null> {
  await requireSession();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("loans_received")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as LoanReceived;
}

export async function insertLoanGiven(input: LoanGivenInput): Promise<LoanGiven> {
  await requireSession();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("loans_given")
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as LoanGiven;
}

export async function insertLoanReceived(input: LoanReceivedInput): Promise<LoanReceived> {
  await requireSession();
  const supabase = createAdminClient();
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
  await requireSession();
  const supabase = createAdminClient();
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
  await requireSession();
  const supabase = createAdminClient();
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
  await requireSession();
  const supabase = createAdminClient();
  const table = type === "given" ? "loans_given" : "loans_received";
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// Atomic mark-paid: a single Postgres function increments months_paid and
// writes one payment_history row per covered month in one transaction. This
// replaces the previous read-modify-write that lost updates under concurrency
// and silently swallowed history-insert errors.
export async function markLoanMonthPaid(
  id: string,
  type: LoanType,
  amount: number,
  monthsCovered: number = 1
): Promise<LoanGiven | LoanReceived> {
  await requireSession();
  const supabase = createAdminClient();
  const fn = type === "given" ? "mark_loan_given_paid" : "mark_loan_received_paid";

  const { data, error } = await supabase.rpc(fn, {
    p_id: id,
    p_months_covered: monthsCovered,
    p_amount: amount,
  });

  if (error) throw new Error(error.message);
  return data as LoanGiven | LoanReceived;
}
