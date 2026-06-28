import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();

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
