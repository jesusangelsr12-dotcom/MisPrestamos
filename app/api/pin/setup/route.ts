import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  createSessionToken,
} from "@/lib/auth/session";

const setupSchema = z.object({
  pin: z.string().length(6).regex(/^\d{6}$/),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = setupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "PIN debe ser 6 dígitos" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  const { count, error: countError } = await supabase
    .from("pin_auth")
    .select("*", { count: "exact", head: true });

  // Si no podemos verificar el estado actual, fallamos en cerrado en vez de
  // insertar un segundo PIN (que dejaría la verificación no determinista).
  if (countError) {
    return NextResponse.json(
      { error: "Error al verificar PIN" },
      { status: 500 }
    );
  }

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: "PIN ya configurado" },
      { status: 409 }
    );
  }

  const hashedPin = await bcrypt.hash(parsed.data.pin, 12);

  const { error } = await supabase
    .from("pin_auth")
    .insert({ hashed_pin: hashedPin });

  if (error) {
    return NextResponse.json(
      { error: "Error al guardar PIN" },
      { status: 500 }
    );
  }

  const token = await createSessionToken(Date.now());
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);

  return response;
}
