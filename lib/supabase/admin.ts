import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente Supabase server-only con la service-role key. Bypassa RLS.
// NUNCA debe importarse en componentes de cliente ni exponerse al navegador:
// solo en route handlers / server actions.
//
// Si SUPABASE_SERVICE_ROLE_KEY no está configurada, cae a la anon key para no
// romper el flujo local. Para que RLS proteja pin_auth (migración 005) hay que
// configurar la service-role key en el entorno.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
