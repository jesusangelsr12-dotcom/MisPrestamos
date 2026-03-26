import { createClient } from "@/lib/supabase/client";
import type { MSIExpense, MSIExpenseWithCard, ExpenseOwner } from "@/types";

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

export async function fetchMSIExpenses(): Promise<MSIExpenseWithCard[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("msi_expenses")
    .select("*, card:cards!card_id(name, bank, color, last_four)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as MSIExpenseWithCard[];
}

export async function fetchMSIById(id: string): Promise<MSIExpenseWithCard | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("msi_expenses")
    .select("*, card:cards!card_id(name, bank, color, last_four)")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as MSIExpenseWithCard;
}

export async function insertMSI(input: MSIInput): Promise<MSIExpense> {
  const supabase = createClient();
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
  const supabase = createClient();

  const updateData: Record<string, unknown> = { ...input };
  if (input.total_amount !== undefined && input.months !== undefined) {
    updateData.monthly_amount = input.total_amount / input.months;
  } else if (input.total_amount !== undefined) {
    // Need to fetch current months
    const { data: current } = await supabase
      .from("msi_expenses")
      .select("months")
      .eq("id", id)
      .single();
    if (current) {
      updateData.monthly_amount = input.total_amount / current.months;
    }
  } else if (input.months !== undefined) {
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
  const supabase = createClient();
  const { error } = await supabase.from("msi_expenses").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function markMSIMonthPaid(
  id: string,
  amount: number,
  monthsCovered: number = 1
): Promise<MSIExpense> {
  const supabase = createClient();

  const { data: current, error: fetchError } = await supabase
    .from("msi_expenses")
    .select("months_paid, months, description, has_final_payment")
    .eq("id", id)
    .single();

  if (fetchError || !current) throw new Error("Gasto MSI no encontrado");
  const totalMonths = current.has_final_payment ? current.months + 1 : current.months;
  if (current.months_paid >= totalMonths) {
    throw new Error("Este gasto ya está completado");
  }

  const newMonthsPaid = Math.min(current.months_paid + monthsCovered, totalMonths);

  const { data, error } = await supabase
    .from("msi_expenses")
    .update({ months_paid: newMonthsPaid })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Record payment history
  try {
    await supabase.from("payment_history").insert({
      entity_type: "msi",
      entity_id: id,
      entity_name: current.description,
      month_number: current.months_paid + 1,
      amount,
      months_covered: monthsCovered,
    });
  } catch (err) {
    console.error("[markMSIMonthPaid] Failed to insert history:", err);
  }

  return data as MSIExpense;
}

export async function fetchMSIPaymentTotals(): Promise<Record<string, number>> {
  const supabase = createClient();
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
  const supabase = createClient();
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
