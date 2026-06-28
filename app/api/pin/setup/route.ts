import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  SESSION_COOKIE_NAME,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/session";

const setupSchema = z.object({
  pin: z.string().length(6).regex(/^\d{6}$/),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = setupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "PIN debe ser 6 dígitos" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  const { count } = await supabase
    .from("pin_auth")
    .select("*", { count: "exact", head: true });

  if (count && count > 0) {
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

  const response = NextResponse.json({ success: true });
  response.cookies.set(
    SESSION_COOKIE_NAME,
    await createSessionToken(),
    sessionCookieOptions()
  );

  return response;
}
