import { createClient } from "@/lib/supabase/client";
import type { PaymentHistory, PaymentEntityType } from "@/types";

export async function insertPaymentHistory(params: {
  entity_type: PaymentEntityType;
  entity_id: string;
  entity_name: string;
  month_number: number;
  amount: number;
}): Promise<PaymentHistory> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("payment_history")
    .insert(params)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as PaymentHistory;
}

export async function fetchHistoryByEntity(
  entityId: string
): Promise<PaymentHistory[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("payment_history")
    .select("*")
    .eq("entity_id", entityId)
    .order("paid_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as PaymentHistory[];
}

export async function fetchAllHistory(): Promise<PaymentHistory[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("payment_history")
    .select("*")
    .order("paid_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as PaymentHistory[];
}
