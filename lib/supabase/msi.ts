"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireSession } from "@/lib/auth-guard";
import type { MSIExpense, MSIExpenseWithCard, MSIInput } from "@/types";

export async function fetchMSIExpenses(): Promise<MSIExpenseWithCard[]> {
  await requireSession();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("msi_expenses")
    .select("*, card:cards!card_id(name, bank, color, last_four)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as MSIExpenseWithCard[];
}

export async function fetchMSIById(id: string): Promise<MSIExpenseWithCard | null> {
  await requireSession();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("msi_expenses")
    .select("*, card:cards!card_id(name, bank, color, last_four)")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as MSIExpenseWithCard;
}

export async function insertMSI(input: MSIInput): Promise<MSIExpense> {
  await requireSession();
  if (!input.months || input.months <= 0) {
    throw new Error("El número de meses debe ser mayor a 0");
  }
  const supabase = createAdminClient();
  const monthly_amount = input.total_amount / input.months;

  const { data, error } = await supabase
    .from("msi_expenses")
    .insert({ ...input, monthly_amount })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as MSIExpense;
}

export async function updateMSIById(
  id: string,
  input: Partial<Omit<MSIInput, "card_id">>
): Promise<MSIExpense> {
  await requireSession();
  const supabase = createAdminClient();

  const updateData: Record<string, unknown> = { ...input };
  if (input.total_amount !== undefined && input.months !== undefined) {
    if (input.months <= 0) throw new Error("El número de meses debe ser mayor a 0");
    updateData.monthly_amount = input.total_amount / input.months;
  } else if (input.total_amount !== undefined) {
    // Need to fetch current months
    const { data: current } = await supabase
      .from("msi_expenses")
      .select("months")
      .eq("id", id)
      .single();
    if (current && current.months > 0) {
      updateData.monthly_amount = input.total_amount / current.months;
    }
  } else if (input.months !== undefined) {
    if (input.months <= 0) throw new Error("El número de meses debe ser mayor a 0");
    const { data: current } = await supabase
      .from("msi_expenses")
      .select("total_amount")
      .eq("id", id)
      .single();
    if (current) {
      updateData.monthly_amount = current.total_amount / input.months;
    }
  }

  const { data, error } = await supabase
    .from("msi_expenses")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as MSIExpense;
}

export async function deleteMSIById(id: string): Promise<void> {
  await requireSession();
  const supabase = createAdminClient();
  const { error } = await supabase.from("msi_expenses").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// Atomic mark-paid via Postgres function: increments months_paid and writes one
// payment_history row per covered month in a single transaction.
export async function markMSIMonthPaid(
  id: string,
  amount: number,
  monthsCovered: number = 1
): Promise<MSIExpense> {
  await requireSession();
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("mark_msi_paid", {
    p_id: id,
    p_months_covered: monthsCovered,
    p_amount: amount,
  });

  if (error) throw new Error(error.message);
  return data as MSIExpense;
}

export async function fetchMSIPaymentTotals(): Promise<Record<string, number>> {
  await requireSession();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("payment_history")
    .select("entity_id, amount")
    .eq("entity_type", "msi");

  if (error) return {};
  const totals: Record<string, number> = {};
  for (const row of (data ?? [])) {
    totals[row.entity_id] = (totals[row.entity_id] ?? 0) + row.amount;
  }
  return totals;
}

export async function fetchLoanPaymentTotals(
  entityType: "loan_given" | "loan_received"
): Promise<Record<string, number>> {
  await requireSession();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("payment_history")
    .select("entity_id, amount")
    .eq("entity_type", entityType);

  if (error) return {};
  const totals: Record<string, number> = {};
  for (const row of (data ?? [])) {
    totals[row.entity_id] = (totals[row.entity_id] ?? 0) + row.amount;
  }
  return totals;
}
