"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth/requireAuth";
import type { LoanGiven, LoanReceived } from "@/types";
import type {
  LoanType,
  LoanGivenInput,
  LoanReceivedInput,
} from "@/lib/supabase/types";

export async function fetchLoansGiven(): Promise<LoanGiven[]> {
  await requireAuth();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("loans_given")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as LoanGiven[];
}

export async function fetchLoansReceived(): Promise<LoanReceived[]> {
  await requireAuth();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("loans_received")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as LoanReceived[];
}

export async function fetchLoanGivenById(id: string): Promise<LoanGiven | null> {
  await requireAuth();
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
  await requireAuth();
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
  await requireAuth();
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
  await requireAuth();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("loans_received")
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as LoanReceived;
}

// Evita fijar total_months por debajo de los meses ya pagados (corrompería
// progreso y montos derivados). Solo consulta si se está cambiando total_months.
async function assertMonthsNotBelowPaid(
  supabase: ReturnType<typeof createAdminClient>,
  table: "loans_given" | "loans_received",
  id: string,
  nextTotalMonths: number | undefined
): Promise<void> {
  if (nextTotalMonths === undefined) return;
  const { data: current, error } = await supabase
    .from(table)
    .select("months_paid")
    .eq("id", id)
    .single();
  if (error || !current) throw new Error("Préstamo no encontrado");
  if (nextTotalMonths < current.months_paid) {
    throw new Error(
      `No puedes fijar ${nextTotalMonths} meses: ya hay ${current.months_paid} pagados`
    );
  }
}

export async function updateLoanGivenById(
  id: string,
  input: Partial<LoanGivenInput>
): Promise<LoanGiven> {
  await requireAuth();
  const supabase = createAdminClient();
  await assertMonthsNotBelowPaid(supabase, "loans_given", id, input.total_months);
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
  await requireAuth();
  const supabase = createAdminClient();
  await assertMonthsNotBelowPaid(supabase, "loans_received", id, input.total_months);
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
  await requireAuth();
  const supabase = createAdminClient();
  const table = type === "given" ? "loans_given" : "loans_received";
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function fetchLoanPaymentTotals(
  entityType: "loan_given" | "loan_received"
): Promise<Record<string, number>> {
  await requireAuth();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("payment_history")
    .select("entity_id, amount")
    .eq("entity_type", entityType);

  if (error) return {};
  const totals: Record<string, number> = {};
  for (const row of data ?? []) {
    totals[row.entity_id] = (totals[row.entity_id] ?? 0) + row.amount;
  }
  return totals;
}

export async function markLoanMonthPaid(
  id: string,
  type: LoanType,
  amount: number,
  monthsCovered: number = 1
): Promise<LoanGiven | LoanReceived> {
  await requireAuth();
  const supabase = createAdminClient();
  const table = type === "given" ? "loans_given" : "loans_received";
  const nameCol = type === "given" ? "borrower_name" : "lender_name";
  const { data: current, error: fetchError } = await supabase
    .from(table)
    .select(`months_paid, total_months, ${nameCol}`)
    .eq("id", id)
    .single();

  if (fetchError || !current) throw new Error("Préstamo no encontrado");
  if (current.months_paid >= current.total_months) {
    throw new Error("Este préstamo ya está completado");
  }

  const newMonthsPaid = Math.min(current.months_paid + monthsCovered, current.total_months);

  const { data, error } = await supabase
    .from(table)
    .update({ months_paid: newMonthsPaid })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Registrar el historial. supabase-js resuelve con { error } en vez de lanzar;
  // si falla, compensamos revirtiendo months_paid para no divergir.
  const entityType = type === "given" ? "loan_given" : "loan_received";
  const entityName = (current as Record<string, string>)[nameCol];
  const { error: historyError } = await supabase.from("payment_history").insert({
    entity_type: entityType,
    entity_id: id,
    entity_name: entityName,
    month_number: current.months_paid + 1,
    amount,
    months_covered: monthsCovered,
  });

  if (historyError) {
    await supabase
      .from(table)
      .update({ months_paid: current.months_paid })
      .eq("id", id);
    throw new Error(`No se pudo registrar el pago: ${historyError.message}`);
  }

  return data as LoanGiven | LoanReceived;
}
