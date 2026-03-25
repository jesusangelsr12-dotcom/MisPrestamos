import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();

  const { count, error } = await supabase
    .from("pin_auth")
    .select("*", { count: "exact", head: true });

  if (error) {
    return NextResponse.json(
      { error: "Error al verificar PIN" },
      { status: 500 }
    );
  }

  return NextResponse.json({ hasPin: (count ?? 0) > 0 });
}
