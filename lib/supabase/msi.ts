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

  // Si cambian total o meses hace falta el estado actual (para recalcular la
  // mensualidad y para validar que meses no baje de los ya pagados).
  const needsCurrent =
    input.total_amount !== undefined || input.months !== undefined;
  if (needsCurrent) {
    const { data: current, error: currentError } = await supabase
      .from("msi_expenses")
      .select("months, total_amount, months_paid")
      .eq("id", id)
      .single();
    if (currentError || !current) throw new Error("Gasto MSI no encontrado");

    const nextMonths = input.months ?? current.months;
    if (nextMonths < current.months_paid) {
      throw new Error(
        `No puedes fijar ${nextMonths} meses: ya hay ${current.months_paid} pagados`
      );
    }

    const nextTotal = input.total_amount ?? current.total_amount;
    updateData.monthly_amount = nextTotal / nextMonths;
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

  // Registrar el historial. El cliente supabase-js resuelve con { error } en vez
  // de lanzar, así que hay que revisarlo explícitamente. Si falla, compensamos
  // revirtiendo months_paid para que contador e historial no diverjan.
  const { error: historyError } = await supabase.from("payment_history").insert({
    entity_type: "msi",
    entity_id: id,
    entity_name: current.description,
    month_number: current.months_paid + 1,
    amount,
    months_covered: monthsCovered,
  });

  if (historyError) {
    await supabase
      .from("msi_expenses")
      .update({ months_paid: current.months_paid })
      .eq("id", id);
    throw new Error(`No se pudo registrar el pago: ${historyError.message}`);
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

