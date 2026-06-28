import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client using the service-role key. This key bypasses
// Row Level Security and MUST never be exposed to the browser — it is only
// imported by server actions and route handlers. With RLS enabled on every
// table (migration 004), this is the only client that can read or write data.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno."
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
