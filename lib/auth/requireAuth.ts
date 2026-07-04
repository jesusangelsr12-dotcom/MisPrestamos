import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

// Guard de sesión para server actions. Como los datos ahora se leen/escriben con
// la service-role key (que bypassa RLS), cada action debe validar primero la
// cookie de PIN firmada; si no, un atacante podría invocar el action sin PIN.
export async function requireAuth(): Promise<void> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const ok = await verifySessionToken(token, Date.now());
  if (!ok) throw new Error("No autorizado");
}
