import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  SESSION_COOKIE_NAME,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/session";

const verifySchema = z.object({
  pin: z.string().length(6).regex(/^\d{6}$/),
});

// Server-enforced brute-force protection. The previous lockout lived only in
// React state, so it reset on reload and was trivially bypassed by calling this
// route directly. Now the counter/lock live in the database.
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30 * 1000;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = verifySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "PIN debe ser 6 dígitos" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("pin_auth")
    .select("id, hashed_pin, failed_attempts, locked_until")
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "PIN no configurado" },
      { status: 404 }
    );
  }

  const now = Date.now();
  if (data.locked_until && new Date(data.locked_until).getTime() > now) {
    const secs = Math.ceil(
      (new Date(data.locked_until).getTime() - now) / 1000
    );
    return NextResponse.json(
      { error: `Demasiados intentos. Intenta en ${secs}s` },
      { status: 429 }
    );
  }

  const isValid = await bcrypt.compare(parsed.data.pin, data.hashed_pin);

  if (!isValid) {
    const attempts = (data.failed_attempts ?? 0) + 1;
    const locked = attempts >= MAX_ATTEMPTS;
    await supabase
      .from("pin_auth")
      .update({
        failed_attempts: locked ? 0 : attempts,
        locked_until: locked
          ? new Date(now + LOCKOUT_MS).toISOString()
          : null,
      })
      .eq("id", data.id);

    return NextResponse.json(
      {
        error: locked
          ? "Demasiados intentos. Bloqueado 30s"
          : "PIN incorrecto",
      },
      { status: locked ? 429 : 401 }
    );
  }

  // Success — reset counters and issue a signed session.
  await supabase
    .from("pin_auth")
    .update({ failed_attempts: 0, locked_until: null })
    .eq("id", data.id);

  const response = NextResponse.json({ success: true });
  response.cookies.set(
    SESSION_COOKIE_NAME,
    await createSessionToken(),
    sessionCookieOptions()
  );

  return response;
}
