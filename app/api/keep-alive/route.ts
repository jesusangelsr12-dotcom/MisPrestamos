import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Ping diario (Vercel Cron) para que Supabase registre actividad
// y no pause el proyecto free por inactividad.
export async function GET() {
  const supabase = createClient();

  const { error } = await supabase
    .from("pin_auth")
    .select("id", { count: "exact", head: true });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, pingedAt: new Date().toISOString() });
}
