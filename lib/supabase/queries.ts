import { createClient } from "@/lib/supabase/client";
import type { PinAuth } from "@/types";

export async function fetchPin(): Promise<PinAuth | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pin_auth")
    .select("*")
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as PinAuth;
}

export async function insertPin(hashedPin: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("pin_auth")
    .insert({ hashed_pin: hashedPin });

  if (error) throw new Error(error.message);
}

export async function pinExists(): Promise<boolean> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("pin_auth")
    .select("*", { count: "exact", head: true });

  if (error) return false;
  return (count ?? 0) > 0;
}
