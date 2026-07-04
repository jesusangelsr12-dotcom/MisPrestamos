"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth/requireAuth";
import type { Card } from "@/types";
import type { CardInput } from "@/lib/supabase/types";

export async function fetchCards(): Promise<Card[]> {
  await requireAuth();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Card[];
}

export async function fetchCardById(id: string): Promise<Card | null> {
  await requireAuth();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Card;
}

export async function insertCard(card: CardInput): Promise<Card> {
  await requireAuth();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("cards")
    .insert(card)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Card;
}

export async function updateCardById(
  id: string,
  card: Partial<CardInput>
): Promise<Card> {
  await requireAuth();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("cards")
    .update(card)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Card;
}

export async function deleteCardById(id: string): Promise<void> {
  await requireAuth();
  const supabase = createAdminClient();

  // Check for linked MSI expenses
  const { count } = await supabase
    .from("msi_expenses")
    .select("*", { count: "exact", head: true })
    .eq("card_id", id);

  if (count && count > 0) {
    throw new Error(
      "No se puede eliminar: esta tarjeta tiene gastos MSI asociados"
    );
  }

  const { error } = await supabase.from("cards").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
