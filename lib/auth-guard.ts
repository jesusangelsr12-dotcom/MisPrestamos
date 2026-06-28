import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

// Guard used at the top of every data server action. Throws if the request
// does not carry a valid, unexpired signed session cookie, so the action's
// underlying service-role DB access is only reachable by an authenticated PIN
// session — even though server actions are individually addressable endpoints.
export async function requireSession(): Promise<void> {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  const ok = await verifySessionToken(token);
  if (!ok) {
    throw new Error("No autorizado");
  }
}
