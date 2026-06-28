"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireSession } from "@/lib/auth-guard";
import type { PaymentHistory } from "@/types";

export async function fetchHistoryByEntity(
  entityId: string
): Promise<PaymentHistory[]> {
  await requireSession();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("payment_history")
    .select("*")
    .eq("entity_id", entityId)
    .order("paid_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as PaymentHistory[];
}

export async function fetchAllHistory(): Promise<PaymentHistory[]> {
  await requireSession();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("payment_history")
    .select("*")
    .order("paid_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as PaymentHistory[];
}
