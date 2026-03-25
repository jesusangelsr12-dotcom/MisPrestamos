import { createClient } from "@/lib/supabase/client";
import type { Card } from "@/types";

export type CardInput = Omit<Card, "id" | "created_at">;

export async function fetchCards(): Promise<Card[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Card[];
}

export async function fetchCardById(id: string): Promise<Card | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Card;
}

export async function insertCard(card: CardInput): Promise<Card> {
  const supabase = createClient();
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
  const supabase = createClient();
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
  const supabase = createClient();

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
